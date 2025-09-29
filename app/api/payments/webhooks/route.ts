import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validar assinatura do webhook Asaas
function validateAsaasWebhook(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return false;
    }

    if (!signature) {
      return false;
    }

    // Calcular assinatura esperada
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    // Comparação segura
    const providedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('asaas-signature') || '';

    // VALIDAÇÃO CRÍTICA: Verificar assinatura do webhook
    if (!validateAsaasWebhook(body, signature)) {
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }
    const webhookData = JSON.parse(body);
    const { event, payment, subscription } = webhookData;

    // Salvar webhook no banco para auditoria
    const { error: webhookError } = await supabase
      .from('asaas_webhooks')
      .insert({
        event_type: event,
        asaas_payment_id: payment?.id,
        asaas_subscription_id: subscription?.id,
        payload: webhookData,
        processed: false
      });

    if (webhookError) {
    }

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'PAYMENT_CREATED':
      case 'PAYMENT_UPDATED':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
      case 'PAYMENT_RESTORED':
      case 'PAYMENT_REFUNDED':
        await processPaymentWebhook(payment);
        break;

      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_UPDATED':
      case 'SUBSCRIPTION_DELETED':
        await processSubscriptionWebhook(subscription);
        break;

      default:
    }

    // Marcar webhook como processado
    await supabase
      .from('asaas_webhooks')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('asaas_payment_id', payment?.id)
      .eq('event_type', event);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Salvar erro no webhook
    const body = await request.text();
    const webhookData = JSON.parse(body);
    
    await supabase
      .from('asaas_webhooks')
      .update({ 
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        retry_count: 1
      })
      .eq('asaas_payment_id', webhookData.payment?.id)
      .eq('event_type', webhookData.event);

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function processPaymentWebhook(payment: any) {
  if (!payment?.id) return;

  try {
    // Buscar transação no banco
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (!transaction) {
      // Se não encontrar transação, tentar buscar assinatura diretamente
      if (payment.subscription) {
        await syncSubscriptionFromPayment(payment);
      }
      return;
    }

    // Atualizar status da transação
    const updateData: any = {
      status: payment.status,
      net_amount: payment.netValue,
      invoice_url: payment.invoiceUrl,
      bank_slip_url: payment.bankSlipUrl,
      transaction_receipt_url: payment.transactionReceiptUrl
    };

    // Se foi pago, adicionar data de pagamento
    if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
      updateData.paid_date = payment.paymentDate || payment.clientPaymentDate || new Date().toISOString();
    }

    // Atualizar PIX QR Code se disponível
    if (payment.pixTransaction?.qrCode) {
      updateData.pix_qr_code = payment.pixTransaction.qrCode.encodedImage;
      updateData.pix_payload = payment.pixTransaction.qrCode.payload;
    }

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('asaas_payment_id', payment.id);

    if (error) {
      // Log do erro sem quebrar o fluxo
    }

    // Se for pagamento de assinatura confirmado, ativar assinatura
    if ((payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') && payment.subscription) {
      await activateSubscription(payment.subscription);
      await syncSubscriptionFromPayment(payment);
    }

  } catch (error) {
    // Erro crítico no processamento do webhook
  }
}

// Nova função para sincronizar assinatura principal a partir do pagamento
async function syncSubscriptionFromPayment(payment: any) {
  try {
    if (!payment.subscription) {
      return;
    }
    
    // Buscar assinatura Asaas
    const { data: asaasSubscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription)
      .single();
    
    if (!asaasSubscription) {
      return;
    }
    // Mapear plan_type do Asaas para slug do sistema principal
    const planTypeToSlugMap: { [key: string]: string } = {
      'FREE': 'free',
      'free': 'free',
      'MICRO_EMPRESA': 'micro_business',
      'micro_business': 'micro_business',
      'PEQUENA_EMPRESA': 'small_business', 
      'small_business': 'small_business',
      'EMPRESA_SIMPLES': 'business_simple',
      'business_simple': 'business_simple',
      'EMPRESA_PLUS': 'business_plus',
      'business_plus': 'business_plus'
    };
    
    const planSlug = planTypeToSlugMap[asaasSubscription.plan_type] || 'free';
    
    // Buscar o plano correspondente na tabela plans
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .single();
    
    if (planError || !plan) {
      return;
    }
    // Verificar se já existe assinatura ativa para este usuário
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', asaasSubscription.user_id)
      .eq('status', 'active')
      .single();
    
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 30 dias
    
    if (existingSubscription) {
      // Atualizar assinatura existente
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endDate.toISOString(),
          payment_method: 'asaas',
          updated_at: now.toISOString()
        })
        .eq('id', existingSubscription.id);
      
      if (updateError) {
      } else {
      }
    } else {
      // Criar nova assinatura na tabela principal
      const newSubscription = {
        user_id: asaasSubscription.user_id,
        plan_id: plan.id,
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: endDate.toISOString(),
        payment_method: 'asaas',
        is_trial: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert([newSubscription]);
      
      if (createError) {
      } else {
      }
    }
  } catch (error) {
    // Erro crítico no processamento do webhook
  }
}

async function processSubscriptionWebhook(subscription: any) {
  if (!subscription?.id) return;

  try {
    // Buscar assinatura no banco
    const { data: localSubscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', subscription.id)
      .single();

    if (!localSubscription) {
      return;
    }

    // Atualizar status da assinatura
    const updateData: any = {
      status: subscription.status,
      value: subscription.value,
      cycle: subscription.cycle,
      next_due_date: subscription.nextDueDate
    };

    const { error } = await supabase
      .from('asaas_subscriptions')
      .update(updateData)
      .eq('asaas_subscription_id', subscription.id);

    if (error) {
      // Log do erro sem quebrar o fluxo
    }

  } catch (error) {
    // Erro crítico no processamento do webhook
  }
}

async function activateSubscription(subscriptionId: string) {
  try {
    const { error } = await supabase
      .from('asaas_subscriptions')
      .update({ status: 'ACTIVE' })
      .eq('asaas_subscription_id', subscriptionId);

    if (error) {
      // Log do erro sem quebrar o fluxo
    }
  } catch (error) {
    // Erro crítico no processamento do webhook
  }
} 