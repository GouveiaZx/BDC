import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para gerenciar pagamentos Asaas via backend
 */

export async function GET(request: NextRequest) {
  try {
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');
    
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const paymentId = searchParams.get('paymentId');

    console.log('🔍 API /api/asaas/payments chamada com parâmetros:', {
      subscriptionId,
      paymentId
    });

    if (!subscriptionId && !paymentId) {
      return NextResponse.json({ 
        error: 'subscriptionId ou paymentId é obrigatório',
        success: false 
      }, { status: 400 });
    }

    // Se busca por ID específico do pagamento
    if (paymentId) {
      try {
        console.log('🔍 Buscando pagamento específico:', paymentId);
        const payment = await asaas.getPayment(paymentId);
        console.log('✅ Pagamento encontrado:', payment);
        
        return NextResponse.json({
          success: true,
          payment,
          payments: [payment] // Para compatibilidade
        });
      } catch (error) {
        console.error('❌ Erro ao buscar pagamento:', error);
        return NextResponse.json({ 
          error: 'Erro ao buscar pagamento',
          success: false,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
      }
    }

    // Se busca por subscription ID
    if (subscriptionId) {
      try {
        console.log('🔍 Buscando pagamentos da assinatura:', subscriptionId);
        const payments = await asaas.getSubscriptionPayments(subscriptionId);
        console.log('✅ Pagamentos encontrados:', payments);
        
        if (!payments || payments.length === 0) {
          console.log('⚠️ Nenhum pagamento encontrado para a assinatura');
          return NextResponse.json({
            success: true,
            payments: [],
            message: 'Nenhum pagamento encontrado para esta assinatura'
          });
        }

        // Para pagamentos PIX, buscar QR Code se disponível
        const enrichedPayments = await Promise.all(
          payments.map(async (payment: any) => {
            if (payment.billingType === 'PIX' && payment.status === 'PENDING') {
              try {
                console.log('🔍 Buscando QR Code PIX para pagamento:', payment.id);
                const pixQrCode = await asaas.getPixQrCode(payment.id);
                console.log('✅ QR Code PIX obtido:', pixQrCode);
                
                return {
                  ...payment,
                  pixTransaction: {
                    ...payment.pixTransaction,
                    qrCode: pixQrCode
                  }
                };
              } catch (pixError) {
                console.error('❌ Erro ao buscar QR Code PIX:', pixError);
                return payment;
              }
            }
            return payment;
          })
        );

        return NextResponse.json({
          success: true,
          payments: enrichedPayments,
          totalCount: enrichedPayments.length
        });
        
      } catch (error) {
        console.error('❌ Erro ao buscar pagamentos da assinatura:', error);
        return NextResponse.json({ 
          error: 'Erro ao buscar pagamentos da assinatura',
          success: false, 
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('❌ Erro na API /api/asaas/payments:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      success: false, 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [PAYMENTS-API] Iniciando criação de pagamento com cliente...');
    
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');
    
    const requestData = await request.json();
    
    console.log('📋 [PAYMENTS-API] Dados recebidos:', requestData);
    
    // Validações básicas
    if (!requestData.customer) {
      console.error('❌ [PAYMENTS-API] Dados do cliente ausentes');
      return NextResponse.json({ 
        success: false, 
        error: 'Dados do cliente são obrigatórios' 
      }, { status: 400 });
    }
    
    if (!requestData.billingType) {
      console.error('❌ [PAYMENTS-API] Billing type ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de cobrança é obrigatório' 
      }, { status: 400 });
    }
    
    if (!requestData.value || requestData.value <= 0) {
      console.error('❌ [PAYMENTS-API] Valor inválido:', requestData.value);
      return NextResponse.json({ 
        success: false, 
        error: 'Valor deve ser maior que zero' 
      }, { status: 400 });
    }
    
    if (!requestData.dueDate) {
      console.error('❌ [PAYMENTS-API] Data de vencimento ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'Data de vencimento é obrigatória' 
      }, { status: 400 });
    }

    // Validar CPF/CNPJ obrigatório
    if (!requestData.customer.cpfCnpj) {
      console.error('❌ [PAYMENTS-API] CPF/CNPJ obrigatório para pagamentos');
      return NextResponse.json({ 
        success: false, 
        error: 'CPF/CNPJ é obrigatório para criar pagamentos' 
      }, { status: 400 });
    }
    
    console.log('✅ [PAYMENTS-API] Validações passaram');
    
    // ETAPA 1: Criar cliente no ASAAS
    console.log('🔄 [PAYMENTS-API] ETAPA 1: Criando cliente no ASAAS...');
    
    const customerData = {
      name: requestData.customer.name,
      email: requestData.customer.email,
      cpfCnpj: requestData.customer.cpfCnpj.replace(/\D/g, ''), // Limpar formatação
      phone: requestData.customer.phone?.replace(/\D/g, '') || undefined,
      mobilePhone: requestData.customer.phone?.replace(/\D/g, '') || undefined,
      postalCode: requestData.customer.postalCode?.replace(/\D/g, '') || undefined,
      address: requestData.customer.address || undefined,
      addressNumber: requestData.customer.addressNumber || undefined,
      complement: requestData.customer.complement || undefined,
      province: requestData.customer.province || undefined,
      city: requestData.customer.city || undefined,
      state: requestData.customer.state || undefined,
      externalReference: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log('📋 [PAYMENTS-API] Dados do cliente para ASAAS:', customerData);
    
    const customer = await asaas.createCustomer(customerData);
    
    if (!customer.id) {
      console.error('❌ [PAYMENTS-API] Cliente criado mas sem ID:', customer);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar cliente - ID não retornado' 
      }, { status: 500 });
    }
    
    console.log('✅ [PAYMENTS-API] Cliente criado com sucesso! ID:', customer.id);
    
    // ETAPA 2: Criar pagamento no ASAAS
    console.log('🔄 [PAYMENTS-API] ETAPA 2: Criando pagamento no ASAAS...');
    
    const paymentData = {
      customer: customer.id, // AGORA PASSAMOS O ID DO CLIENTE!
      billingType: requestData.billingType,
      value: requestData.value,
      dueDate: requestData.dueDate,
      description: requestData.description || `Pagamento - ${requestData.billingType}`,
      externalReference: requestData.externalReference || `payment-${Date.now()}`,
      // Para cartão de crédito
      ...(requestData.billingType === 'CREDIT_CARD' && {
        installmentCount: requestData.installmentCount || 1,
        installmentValue: requestData.installmentValue || requestData.value
      })
    };
    
    console.log('📋 [PAYMENTS-API] Dados do pagamento para ASAAS:', paymentData);
    
    const payment = await asaas.createPayment(paymentData);
    
    console.log('✅ [PAYMENTS-API] Pagamento criado com sucesso:', payment);
    
    // ETAPA 3: Para PIX, buscar QR Code
    let pixQrCodeUrl = null;
    let pixCopyAndPaste = null;
    
    if (requestData.billingType === 'PIX' && payment.id) {
      try {
        console.log('🔄 [PAYMENTS-API] ETAPA 3: Buscando QR Code PIX...');
        const pixQrCode = await asaas.getPixQrCode(payment.id);
        
                 if (pixQrCode) {
           pixQrCodeUrl = (pixQrCode as any).encodedImage || (pixQrCode as any).qrCodeUrl || null;
           pixCopyAndPaste = (pixQrCode as any).payload || (pixQrCode as any).pixCopyAndPaste || null;
           console.log('✅ [PAYMENTS-API] QR Code PIX obtido:', { 
             hasQrCode: !!pixQrCodeUrl, 
             hasCopyPaste: !!pixCopyAndPaste 
           });
         }
      } catch (pixError) {
        console.error('⚠️ [PAYMENTS-API] Erro ao buscar QR Code PIX (não crítico):', pixError);
        // Não falha o processo, apenas avisa
      }
    }
    
    // Resposta final
    const response = {
      success: true,
      payment: payment,
      customer: customer,
             // Dados específicos do PIX
       ...(requestData.billingType === 'PIX' && {
         pixQrCodeUrl,
         pixCopyAndPaste,
         pixTransaction: (payment as any).pixTransaction
       }),
       // Para boleto
       ...(requestData.billingType === 'BOLETO' && {
         bankSlipUrl: (payment as any).bankSlipUrl
       })
    };
    
    console.log('✅ [PAYMENTS-API] Processo concluído com sucesso!');
    console.log('📋 [PAYMENTS-API] Resposta final:', response);
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ [PAYMENTS-API] Erro completo:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar pagamento',
      details: error.message,
      asaasError: error.response?.data
    }, { status: 500 });
  }
} 