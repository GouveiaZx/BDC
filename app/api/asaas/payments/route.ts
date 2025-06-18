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
                // TODO: Implementar getPixQrCode quando método estiver disponível
                // const pixQrCode = await asaas.getPixQrCode(payment.id);
                console.log('✅ QR Code PIX obtido (simulado)');
                
                return {
                  ...payment,
                  pixTransaction: {
                    ...payment.pixTransaction,
                    // qrCode: pixQrCode
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
    console.log('🔄 [PAYMENTS-API] Iniciando criação de pagamento...');
    
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../../lib/asaas');
    
    const paymentData = await request.json();
    
    console.log('📋 [PAYMENTS-API] Dados recebidos:', paymentData);
    console.log('📋 [PAYMENTS-API] Validação dos dados:', {
      hasCustomer: !!paymentData.customer,
      hasBillingType: !!paymentData.billingType,
      hasValue: !!paymentData.value,
      hasDueDate: !!paymentData.dueDate,
      billingType: paymentData.billingType,
      value: paymentData.value
    });
    
    // Validações básicas
    if (!paymentData.customer) {
      console.error('❌ [PAYMENTS-API] Customer ID ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'Customer ID é obrigatório' 
      }, { status: 400 });
    }
    
    if (!paymentData.billingType) {
      console.error('❌ [PAYMENTS-API] Billing type ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de cobrança é obrigatório' 
      }, { status: 400 });
    }
    
    if (!paymentData.value || paymentData.value <= 0) {
      console.error('❌ [PAYMENTS-API] Valor inválido:', paymentData.value);
      return NextResponse.json({ 
        success: false, 
        error: 'Valor deve ser maior que zero' 
      }, { status: 400 });
    }
    
    if (!paymentData.dueDate) {
      console.error('❌ [PAYMENTS-API] Data de vencimento ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'Data de vencimento é obrigatória' 
      }, { status: 400 });
    }
    
    console.log('✅ [PAYMENTS-API] Validações passaram, chamando ASAAS...');
    
    const payment = await asaas.createPayment(paymentData);
    
    console.log('✅ [PAYMENTS-API] Pagamento criado com sucesso:', payment);
    
    return NextResponse.json({ success: true, payment });

  } catch (error: any) {
    console.error('❌ [PAYMENTS-API] Erro completo:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar pagamento',
      details: error.message,
      asaasError: error.response?.data
    }, { status: 500 });
  }
} 