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
    if (!subscriptionId && !paymentId) {
      return NextResponse.json({ 
        error: 'subscriptionId ou paymentId é obrigatório',
        success: false 
      }, { status: 400 });
    }

    // Se busca por ID específico do pagamento
    if (paymentId) {
      try {
        const payment = await asaas.getPayment(paymentId);
        return NextResponse.json({
          success: true,
          payment,
          payments: [payment] // Para compatibilidade
        });
      } catch (error) {
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
        const payments = await asaas.getSubscriptionPayments(subscriptionId);
        if (!payments || payments.length === 0) {
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
                const pixQrCode = await asaas.getPixQrCode(payment.id);
                return {
                  ...payment,
                  pixTransaction: {
                    ...payment.pixTransaction,
                    qrCode: pixQrCode
                  }
                };
              } catch (pixError) {
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
        return NextResponse.json({ 
          error: 'Erro ao buscar pagamentos da assinatura',
          success: false, 
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
      }
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      success: false, 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');
    
    const requestData = await request.json();
    // Validações básicas
    if (!requestData.customer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados do cliente são obrigatórios' 
      }, { status: 400 });
    }
    
    if (!requestData.billingType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de cobrança é obrigatório' 
      }, { status: 400 });
    }
    
    if (!requestData.value || requestData.value <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valor deve ser maior que zero' 
      }, { status: 400 });
    }
    
    if (!requestData.dueDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Data de vencimento é obrigatória' 
      }, { status: 400 });
    }

    // Validar CPF/CNPJ obrigatório
    if (!requestData.customer.cpfCnpj) {
      return NextResponse.json({ 
        success: false, 
        error: 'CPF/CNPJ é obrigatório para criar pagamentos' 
      }, { status: 400 });
    }
    // ETAPA 1: Criar cliente no ASAAS
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
    const customer = await asaas.createCustomer(customerData);
    
    if (!customer.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar cliente - ID não retornado' 
      }, { status: 500 });
    }
    // ETAPA 2: Criar pagamento no ASAAS
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
    const payment = await asaas.createPayment(paymentData);
    // ETAPA 3: Para PIX, buscar QR Code
    let pixQrCodeUrl = null;
    let pixCopyAndPaste = null;
    
    if (requestData.billingType === 'PIX' && payment.id) {
      try {
        const pixQrCode = await asaas.getPixQrCode(payment.id);
        
                 if (pixQrCode) {
           pixQrCodeUrl = (pixQrCode as any).encodedImage || (pixQrCode as any).qrCodeUrl || null;
           pixCopyAndPaste = (pixQrCode as any).payload || (pixQrCode as any).pixCopyAndPaste || null;
         }
      } catch (pixError) {
        
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
    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar pagamento',
      details: error.message,
      asaasError: error.response?.data
    }, { status: 500 });
  }
} 