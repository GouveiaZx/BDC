import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * POST - Criar cobrança individual no Asaas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer,
      billingType,
      value,
      dueDate,
      description,
      externalReference,
      creditCard,
      creditCardHolderInfo
    } = body;

    if (!customer || !billingType || !value || !dueDate) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos (customer, billingType, value, dueDate)'
      }, { status: 400 });
    }

    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');
    // Verificar se o cliente existe e tem CPF/CNPJ
    try {
      const customerInfo = await asaas.getCustomer(customer);
      if (!customerInfo || !(customerInfo as any).cpfCnpj) {
        // Tentar buscar no banco local para verificar se temos o CPF
        const { data: localCustomer } = await supabase
          .from('asaas_customers')
          .select('*')
          .eq('asaas_customer_id', customer)
          .single();

        if (localCustomer && localCustomer.cpf_cnpj) {
          // Atualizar cliente no Asaas com CPF
          await asaas.updateCustomer(customer, {
            cpfCnpj: localCustomer.cpf_cnpj
          });
        } else {
          throw new Error('Cliente não possui CPF/CNPJ cadastrado. É necessário fornecer o documento para criar a cobrança.');
        }
      }
    } catch (customerError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar dados do cliente',
        details: customerError instanceof Error ? customerError.message : 'Cliente inválido'
      }, { status: 400 });
    }

    // Preparar dados da cobrança
    const paymentData: any = {
      customer: customer,
      billingType: billingType,
      value: parseFloat(value.toString()),
      dueDate: dueDate,
      description: description || 'Cobrança',
      externalReference: externalReference || `charge_${Date.now()}`
    };

    // Adicionar dados do cartão se for pagamento com cartão
    if (billingType === 'CREDIT_CARD' && creditCard) {
      paymentData.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s/g, ''),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv
      };

      if (creditCardHolderInfo) {
        paymentData.creditCardHolderInfo = {
          name: creditCardHolderInfo.name,
          email: creditCardHolderInfo.email,
          cpfCnpj: creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
          postalCode: creditCardHolderInfo.postalCode.replace(/\D/g, ''),
          addressNumber: creditCardHolderInfo.addressNumber,
          phone: creditCardHolderInfo.phone || ''
        };
      }
    }
    // Criar cobrança no ASAAS
    const asaasPayment = await asaas.createPayment(paymentData);
    // Buscar QR Code PIX se for PIX
    let pixQrCode = null;
    let pixCode = null;
    if (billingType === 'PIX' && (asaasPayment as any).id) {
      try {
        const pixResponse = await asaas.getPixQrCode((asaasPayment as any).id);
        pixQrCode = (pixResponse as any).encodedImage || null;
        pixCode = (pixResponse as any).payload || null;
      } catch (pixError) {
        // Continuar sem PIX QR Code
      }
    }

    // Salvar transação no banco
    const transactionData = {
      user_id: null, // Será preenchido depois pela API que usa esta charge
      asaas_payment_id: (asaasPayment as any).id,
      asaas_customer_id: customer,
      type: 'HIGHLIGHT',
      status: 'pending',
      amount: parseFloat(value.toString()),
      billing_type: billingType,
      due_date: dueDate,
      description: description,
      external_reference: externalReference,
      invoice_url: (asaasPayment as any).invoiceUrl || null,
      bank_slip_url: (asaasPayment as any).bankSlipUrl || null,
      metadata: {
        asaas_payment: asaasPayment,
        pix_qr_code: pixQrCode,
        pix_payload: pixCode
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (dbError) {
      // Não falhar aqui pois a cobrança já foi criada no ASAAS
    }
    // Preparar resposta
    const responseData = {
      success: true,
      charge: {
        id: (asaasPayment as any).id,
        status: (asaasPayment as any).status || 'pending',
        value: (asaasPayment as any).value || value,
        invoiceUrl: (asaasPayment as any).invoiceUrl || null,
        bankSlipUrl: (asaasPayment as any).bankSlipUrl || null,
        dueDate: (asaasPayment as any).dueDate || dueDate,
        ...(billingType === 'PIX' && {
          pixCode: pixCode,
          pixQrCode: pixQrCode
        })
      },
      transaction: transaction
    };
    return NextResponse.json(responseData);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar cobrança',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET - Consultar status de uma cobrança
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      return NextResponse.json({
        success: false,
        error: 'ID da cobrança é obrigatório'
      }, { status: 400 });
    }
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');

    // Consultar cobrança no ASAAS
    const asaasPayment = await asaas.getPayment(chargeId);
    
    // Atualizar status no banco se necessário
    if ((asaasPayment as any).status) {
      const updateData: any = {
        status: (asaasPayment as any).status.toLowerCase(),
        updated_at: new Date().toISOString()
      };

      if ((asaasPayment as any).paymentDate) {
        updateData.paid_date = (asaasPayment as any).paymentDate;
      }

      await supabase
        .from('transactions')
        .update(updateData)
        .eq('asaas_payment_id', chargeId);
    }

    return NextResponse.json({
      success: true,
      charge: {
        id: (asaasPayment as any).id,
        status: (asaasPayment as any).status,
        value: (asaasPayment as any).value,
        paymentDate: (asaasPayment as any).paymentDate,
        invoiceUrl: (asaasPayment as any).invoiceUrl
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao consultar cobrança',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 