import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';
import asaasService from '../../../../lib/asaas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      planId, 
      paymentMethod, 
      customerData, 
      paymentData 
    } = body;

    if (!userId || !planId || !paymentMethod || !customerData) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Verificar se o plano é válido
    if (!Object.values(SubscriptionPlan).includes(planId as SubscriptionPlan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // No ambiente de desenvolvimento, simular sucesso sem chamar o Asaas
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_ASAAS === 'true') {
      return NextResponse.json({
        success: true,
        subscription: {
          id: `mock_sub_${Date.now()}`,
          planId,
          status: 'active',
          startDate: new Date().toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // Criar cliente no Asaas (se já existir com mesmo CPF/CNPJ, ASAAS retorna erro)
    let asaasCustomerId: string;
    try {
      const customerPayload = {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || '',
        mobilePhone: customerData.mobilePhone || customerData.phone || '',
        cpfCnpj: customerData.cpfCnpj,
        postalCode: customerData.postalCode,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement,
        province: customerData.province,
        externalReference: userId
      };

      const customer = await asaasService.createCustomer(customerPayload);
      asaasCustomerId = customer.id;
    } catch (error: any) {
      // Se erro de CPF/CNPJ já existente, usar dados do erro para obter ID
      if (error.message?.includes('cpfCnpj')) {
        throw new Error('Cliente já existe com este CPF/CNPJ. Use outro documento.');
      }
      throw error;
    }

    // Pular cancelamento de assinaturas existentes por enquanto

    // Criar nova assinatura
    const subscriptionPayload: any = {
      customer: asaasCustomerId,
      billingType: mapPaymentMethod(paymentMethod),
      value: getPlanPrice(planId as SubscriptionPlan),
      nextDueDate: new Date().toISOString().split('T')[0], // Hoje
      cycle: 'MONTHLY' as 'MONTHLY',
      description: `Assinatura ${getPlanName(planId as SubscriptionPlan)}`,
      externalReference: planId
    };

    // Adicionar dados de cartão de crédito se for o método de pagamento
    if (paymentMethod === 'credit_card' && paymentData) {
      subscriptionPayload.creditCard = {
        holderName: paymentData.cardName,
        number: paymentData.cardNumber.replace(/\s/g, ''),
        expiryMonth: paymentData.cardExpiry.split('/')[0],
        expiryYear: '20' + paymentData.cardExpiry.split('/')[1], // Assumindo formato MM/YY
        ccv: paymentData.cardCvv
      };

      subscriptionPayload.creditCardHolderInfo = {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj,
        postalCode: customerData.postalCode,
        addressNumber: customerData.addressNumber,
        phone: customerData.phone || '',
        addressComplement: customerData.complement
      };
    }

    // Criar assinatura no Asaas
    const subscription = await asaasService.createSubscription(subscriptionPayload);

    return NextResponse.json({
      success: true,
      subscription: {
        id: (subscription as any).id,
        planId,
        status: (subscription as any).status || 'ACTIVE',
        startDate: new Date().toISOString(),
        nextBillingDate: (subscription as any).nextDueDate || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao processar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro ao processar assinatura', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}

// Função para mapear método de pagamento para formato do Asaas
function mapPaymentMethod(method: string): "BOLETO" | "CREDIT_CARD" | "PIX" {
  switch (method) {
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'boleto':
      return 'BOLETO';
    case 'pix':
      return 'PIX';
    default:
      return 'CREDIT_CARD';
  }
}

// Função para obter preço do plano
function getPlanPrice(planId: SubscriptionPlan): number {
  const prices = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.MICRO_BUSINESS]: 49.90,
    [SubscriptionPlan.SMALL_BUSINESS]: 149.90,
    [SubscriptionPlan.BUSINESS_SIMPLE]: 249.90,
    [SubscriptionPlan.BUSINESS_PLUS]: 349.90
  };
  
  return prices[planId];
}

// Função para obter nome do plano
function getPlanName(planId: SubscriptionPlan): string {
  const names = {
    [SubscriptionPlan.FREE]: 'Gratuito',
    [SubscriptionPlan.MICRO_BUSINESS]: 'Micro-Empresa',
    [SubscriptionPlan.SMALL_BUSINESS]: 'Pequena Empresa',
    [SubscriptionPlan.BUSINESS_SIMPLE]: 'Empresa Simples',
    [SubscriptionPlan.BUSINESS_PLUS]: 'Empresa Plus'
  };
  
  return names[planId];
} 