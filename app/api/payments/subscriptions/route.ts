import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface SubscriptionPayload {
  userId: string;
  planType: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  cycle: 'MONTHLY' | 'YEARLY';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

// Mapeamento de planos para valores REAIS (conforme plansConfig.ts)
const planPrices: Record<string, number> = {
  FREE: 0,
  free: 0,
  MICRO_EMPRESA: 24.90,
  micro_business: 24.90,
  PEQUENA_EMPRESA: 49.90,
  small_business: 49.90,
  EMPRESA_SIMPLES: 99.90,
  business_simple: 99.90,
  EMPRESA_PLUS: 149.90,
  business_plus: 149.90
};

export async function POST(request: NextRequest) {
  try {
    const body: SubscriptionPayload = await request.json();
    const { userId, planType, billingType, cycle, creditCard, creditCardHolderInfo } = body;

    // Validações obrigatórias
    if (!userId || !planType || !billingType) {
      return NextResponse.json({ 
        error: 'userId, planType e billingType são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se é plano gratuito
    if (planType === 'FREE') {
      // Para planos gratuitos, apenas criar registro no banco
      const subscriptionData = {
        user_id: userId,
        plan_type: planType,
        status: 'ACTIVE',
        value: 0,
        cycle: cycle,
        started_at: new Date().toISOString(),
        next_due_date: null,
        description: 'Plano Gratuito'
      };

      const { data: subscription, error } = await supabase
        .from('asaas_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Erro ao criar assinatura gratuita' }, { status: 500 });
      }
      return NextResponse.json({ 
        success: true, 
        subscription: {
          ...subscription,
          status: 'ACTIVE'
        }
      });
    }

    // Para planos pagos, verificar se existe cliente no ASAAS
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('asaas_customer_id')
      .eq('user_id', userId)
      .single();

    if (!existingCustomer?.asaas_customer_id) {
      return NextResponse.json({ 
        error: 'Cliente não encontrado. Crie o cliente primeiro.' 
      }, { status: 400 });
    }

    const asaasCustomerId = existingCustomer.asaas_customer_id;
    // Obter valor do plano
    const planValue = planPrices[planType];
    if (planValue === undefined) {
      return NextResponse.json({ 
        error: 'Plano inválido' 
      }, { status: 400 });
    }
    try {
      // Importar dinamicamente o serviço ASAAS
      const { default: asaas } = await import('../../../../lib/asaas');
      
      // CRIAR ASSINATURA REAL NO ASAAS
      // Calcular próxima data de vencimento
      const nextDueDate = new Date();
      if (cycle === 'YEARLY') {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      } else {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: billingType,
        cycle: cycle,
        value: planValue,
        nextDueDate: asaas.formatDate(nextDueDate),
        description: `Assinatura ${planType} - BuscaAquiBDC`,
        externalReference: `subscription_${userId}_${Date.now()}`,
        maxPayments: undefined, // Assinatura ilimitada
        creditCard: creditCard ? {
          holderName: creditCard.holderName,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv
        } : undefined,
        creditCardHolderInfo: creditCardHolderInfo ? {
          name: creditCardHolderInfo.name,
          email: creditCardHolderInfo.email,
          cpfCnpj: creditCardHolderInfo.cpfCnpj,
          postalCode: creditCardHolderInfo.postalCode,
          addressNumber: creditCardHolderInfo.addressNumber,
          phone: creditCardHolderInfo.phone
        } : undefined
      };
      const asaasSubscription = await asaas.createSubscription(subscriptionPayload);
      // Salvar assinatura no banco
      const subscriptionData = {
        user_id: userId,
        asaas_subscription_id: asaasSubscription.id || '',
        asaas_customer_id: asaasCustomerId,
        plan_type: planType,
        status: 'ACTIVE',
        value: planValue,
        cycle: cycle,
        next_due_date: subscriptionPayload.nextDueDate,
        description: `Assinatura ${planType}`,
        started_at: new Date().toISOString()
      };

      const { data: subscription, error: dbError } = await supabase
        .from('asaas_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (dbError) {
        // Tentar cancelar a assinatura no ASAAS se houver erro no banco
        try {
          if (asaasSubscription.id) {
            await asaas.cancelSubscription(asaasSubscription.id);
          }
        } catch (cancelError) {
        }
        return NextResponse.json({ error: 'Erro ao salvar assinatura' }, { status: 500 });
      }
      // Preparar resposta com dados específicos do método de pagamento
      let responseData: any = {
        success: true,
        subscription: {
          ...subscription,
          asaas_subscription_id: asaasSubscription.id,
          status: 'ACTIVE'
        }
      };

      // Buscar primeiro pagamento da assinatura para dados PIX/Boleto
      try {
        if (asaasSubscription.id) {
          const payments = await asaas.getSubscriptionPayments(asaasSubscription.id);
          
          if (payments && payments.length > 0) {
            const firstPayment = payments[0];
            // Adicionar dados específicos por tipo de pagamento
                         if (billingType === 'PIX') {
               // Buscar QR Code PIX se disponível
               try {
                 const pixData = await asaas.getPixQrCode(firstPayment.id);
                 responseData.subscription.pix_qr_code = (pixData as any).encodedImage;
                 responseData.subscription.pix_payload = (pixData as any).payload;
               } catch (pixError) {
               }
            } else if (billingType === 'BOLETO' && firstPayment.bankSlipUrl) {
              responseData.subscription.boleto_url = firstPayment.bankSlipUrl;
            }

            // Salvar primeira transação no banco
            try {
              const transactionData = {
                user_id: userId,
                subscription_id: subscription.id,
                asaas_payment_id: firstPayment.id,
                asaas_customer_id: asaasCustomerId,
                type: 'SUBSCRIPTION_PAYMENT',
                status: firstPayment.status || 'PENDING',
                amount: firstPayment.value || planValue,
                billing_type: billingType,
                due_date: firstPayment.dueDate,
                description: `Primeiro pagamento - ${planType}`,
                pix_qr_code: responseData.subscription.pix_payload || null,
                pix_payload: responseData.subscription.pix_payload || null,
                metadata: {
                  asaas_subscription_id: asaasSubscription.id,
                  plan_type: planType
                }
              };

              await supabase
                .from('transactions')
                .insert(transactionData);
            } catch (transactionError) {
              
            }
          }
        }
      } catch (paymentsError) {
        
      }

      return NextResponse.json(responseData);

    } catch (asaasError) {
      return NextResponse.json({ 
        error: `Erro ao criar assinatura no ASAAS: ${asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'}` 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    // Buscar assinaturas ativas do usuário
    const { data: subscriptions, error } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
    }
    return NextResponse.json({ 
      subscriptions: subscriptions || [],
      count: subscriptions?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 