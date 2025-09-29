import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Webhook secret para validar requisições do Asaas
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || 'webhook_secret_key_here';

/**
 * Valida a assinatura do webhook do Asaas
 * @param request - Requisição HTTP
 * @param body - Corpo da requisição
 * @returns boolean
 */
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  try {
    // O Asaas envia a assinatura no header 'asaas-access-token'
    const signature = request.headers.get('asaas-access-token');

    if (!signature) {
      return false;
    }

    // Verificar se a assinatura está correta
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    // Comparação segura
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Rate limiting simples para webhooks
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 30; // Máximo 30 requests por minuto

  const current = rateLimitMap.get(ip);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

interface AsaasWebhookEvent {
  id: string;
  dateCreated: string;
  event: string;
  payment: {
    id: string;
    customer: string;
    subscription?: string;
    installment?: string;
    paymentLink?: string;
    value: number;
    netValue?: number;
    originalValue?: number;
    nossoNumero?: string;
    description?: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
    pixTransaction?: {
      qrCode: {
        id: string;
        payload: string;
        encodedImage: string;
      };
    };
    dueDate: string;
    originalDueDate: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    invoiceNumber: string;
    externalReference?: string;
    discount?: {
      value: number;
      limitDate?: string;
    };
    fine?: {
      value: number;
    };
    interest?: {
      value: number;
    };
    deleted: boolean;
    postalService: boolean;
    anticipated: boolean;
    anticipable: boolean;
  };
}

// Função duplicada removida - usando a implementação segura acima

// Helper para processar diferentes tipos de eventos
async function processWebhookEvent(event: AsaasWebhookEvent) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    switch (event.event) {
      case 'PAYMENT_CREATED':
        return await handlePaymentCreated(event, supabase);
      
      case 'PAYMENT_AWAITING_PAYMENT':
        return await handlePaymentAwaitingPayment(event, supabase);
      
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        return await handlePaymentConfirmed(event, supabase);
      
      case 'PAYMENT_OVERDUE':
        return await handlePaymentOverdue(event, supabase);
      
      case 'PAYMENT_DELETED':
        return await handlePaymentDeleted(event, supabase);
      
      case 'PAYMENT_REFUNDED':
        return await handlePaymentRefunded(event, supabase);
      
      default:
        return { processed: false, reason: 'Evento não reconhecido' };
    }
  } catch (error) {
    throw error;
  }
}

// Pagamento criado
async function handlePaymentCreated(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Atualizar status do pagamento no banco
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'pending',
      asaas_invoice_url: payment.invoiceUrl,
      asaas_bank_slip_url: payment.bankSlipUrl,
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (error) {
    throw error;
  }

  return { processed: true, action: 'payment_created' };
}

// Pagamento aguardando
async function handlePaymentAwaitingPayment(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Buscar dados do pagamento
  const { data: paymentData } = await supabase
    .from('payments')
    .select('*, subscriptions(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!paymentData) {
    return { processed: false, reason: 'Pagamento não encontrado' };
  }

  // Atualizar status
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'pending',
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (error) {
    throw error;
  }

  return { processed: true, action: 'payment_awaiting' };
}

// Pagamento confirmado
async function handlePaymentConfirmed(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Buscar dados do pagamento
  const { data: paymentData } = await supabase
    .from('payments')
    .select('*, subscriptions(*), users(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  // ✅ BUSCAR TAMBÉM NA TABELA TRANSACTIONS (pagamentos individuais)
  const { data: transactionData } = await supabase
    .from('transactions')
    .select('*')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!paymentData && !transactionData) {
    // Tentar buscar na tabela asaas_subscriptions
    const { data: asaasSubscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription)
      .single();
    
    if (asaasSubscription) {
      await activateSubscriptionFromAsaas(asaasSubscription, supabase);
    }
    
    return { processed: false, reason: 'Pagamento não encontrado' };
  }

  // ✅ ATUALIZAR TRANSAÇÃO SE EXISTIR (pagamentos individuais)
  if (transactionData) {
    const { error: transactionError } = await supabase
      .from('transactions')
      .update({
        status: 'received',
        paid_date: payment.paymentDate || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (transactionError) {
    } else {
      // ✅ VERIFICAR SE É UM ANÚNCIO EXTRA E ATIVÁ-LO
      await activateExtraAd(payment.id, supabase);
      
      // ✅ VERIFICAR SE É UM DESTAQUE E ATIVÁ-LO
      await activateHighlightsAfterPayment(payment.id, supabase);
    }
  }

  // Atualizar pagamento (se for assinatura)
  if (paymentData) {
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_date: payment.paymentDate || new Date().toISOString(),
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (paymentError) {
    throw paymentError;
    }
  }

  // Ativar assinatura se existir
  if (paymentData.subscriptions) {
    const subscription = paymentData.subscriptions;
    
    // Calcular nova data de expiração
    const now = new Date();
    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + 1); // Assumindo pagamento mensal

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: newEndDate.toISOString(),
        payment_attempts: 0,
        last_payment_attempt: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (subscriptionError) {
      throw subscriptionError;
    }

    // Criar notificação para o usuário
    await supabase
      .from('notifications')
      .insert({
        user_id: paymentData.user_id,
        title: 'Pagamento confirmado!',
        message: `Seu pagamento de R$ ${(payment.value / 100).toFixed(2)} foi confirmado. Sua assinatura está ativa!`,
        type: 'payment_confirmed',
        related_entity_type: 'payment',
        related_entity_id: paymentData.id
      });
  } else if (transactionData) {
    // Criar notificação para pagamento individual
    await supabase
      .from('notifications')
      .insert({
        user_id: transactionData.user_id,
        title: 'Pagamento confirmado!',
        message: `Seu pagamento de R$ ${payment.value.toFixed(2)} foi confirmado com sucesso!`,
        type: 'payment_confirmed',
        related_entity_type: 'transaction',
        related_entity_id: transactionData.id
      });
  }

  // ✅ ATIVAR DESTAQUES AUTOMÁTICAMENTE APÓS PAGAMENTO CONFIRMADO
  await activateHighlightsAfterPayment(payment.id, supabase);

  return { processed: true, action: 'payment_confirmed' };
}

// ✅ NOVA FUNÇÃO: Ativar destaques após pagamento confirmado
async function activateHighlightsAfterPayment(asaasPaymentId: string, supabase: any) {
  try {
    // Buscar destaques que estão aguardando este pagamento
    const { data: highlightsToActivate, error: searchError } = await supabase
      .from('highlights')
      .select('*')
      .eq('payment_id', asaasPaymentId)
      .eq('payment_status', 'pending');
    
    if (searchError) {
      return;
    }
    
    if (!highlightsToActivate || highlightsToActivate.length === 0) {
      return;
    }

    // Ativar cada destaque
    for (const highlight of highlightsToActivate) {
      const { error: updateError } = await supabase
        .from('highlights')
        .update({
          status: 'approved', // Aprovar automaticamente
          payment_status: 'confirmed',
          is_paid: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', highlight.id);
      
      if (updateError) {
      } else {
        // Criar notificação para o usuário
        await supabase
          .from('notifications')
          .insert({
            user_id: highlight.user_id,
            title: '🎉 Destaque Ativado!',
            message: `Seu destaque "${highlight.title}" foi ativado e já está visível no topo da página principal!`,
            type: 'highlight_activated',
            related_entity_type: 'highlight',
            related_entity_id: highlight.id
          });
      }
    }
  } catch (error) {
  }
}

// Nova função para ativar assinatura a partir dos dados do Asaas
async function activateSubscriptionFromAsaas(asaasSubscription: any, supabase: any) {
  try {
    // Mapear plan_type do Asaas para plan_id do sistema principal
    const planTypeToIdMap: { [key: string]: string } = {
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
    
    const planSlug = planTypeToIdMap[asaasSubscription.plan_type] || 'free';
    
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
      // Criar nova assinatura
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
    
    // Atualizar status da assinatura Asaas
    const { error: asaasUpdateError } = await supabase
      .from('asaas_subscriptions')
      .update({
        status: 'ACTIVE',
        updated_at: now.toISOString()
      })
      .eq('id', asaasSubscription.id);
    
    if (asaasUpdateError) {
    }
    
    // Criar notificação para o usuário
    await supabase
      .from('notifications')
      .insert({
        user_id: asaasSubscription.user_id,
        title: 'Assinatura Ativada!',
        message: `Sua assinatura do plano "${plan.name}" foi ativada com sucesso!`,
        type: 'subscription_activated',
        related_entity_type: 'subscription',
        related_entity_id: asaasSubscription.id
      });
  } catch (error) {
  }
}

// Pagamento em atraso
async function handlePaymentOverdue(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Buscar dados do pagamento
  const { data: paymentData } = await supabase
    .from('payments')
    .select('*, subscriptions(*), users(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!paymentData) {
    return { processed: false, reason: 'Pagamento não encontrado' };
  }

  // Atualizar pagamento
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'overdue',
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (paymentError) {
    throw paymentError;
  }

  // Suspender assinatura se existir
  if (paymentData.subscriptions) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.subscriptions.id);

    if (subscriptionError) {
    }

    // Criar notificação
    await supabase
      .from('notifications')
      .insert({
        user_id: paymentData.user_id,
        title: 'Pagamento em atraso',
        message: `Seu pagamento está em atraso. Sua assinatura foi suspensa temporariamente.`,
        type: 'payment_overdue',
        related_entity_type: 'payment',
        related_entity_id: paymentData.id
      });
  }

  return { processed: true, action: 'payment_overdue' };
}

// Pagamento deletado
async function handlePaymentDeleted(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Atualizar status
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'cancelled',
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (error) {
    throw error;
  }

  return { processed: true, action: 'payment_deleted' };
}

// Pagamento estornado
async function handlePaymentRefunded(event: AsaasWebhookEvent, supabase: any) {
  const payment = event.payment;
  
  // Buscar dados do pagamento
  const { data: paymentData } = await supabase
    .from('payments')
    .select('*, subscriptions(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!paymentData) {
    return { processed: false, reason: 'Pagamento não encontrado' };
  }

  // Atualizar pagamento
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      gateway_response: payment,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  if (paymentError) {
    throw paymentError;
  }

  // Cancelar assinatura se existir
  if (paymentData.subscriptions) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.subscriptions.id);

    if (subscriptionError) {
    }

    // Criar notificação
    await supabase
      .from('notifications')
      .insert({
        user_id: paymentData.user_id,
        title: 'Pagamento estornado',
        message: `Seu pagamento foi estornado. Sua assinatura foi cancelada.`,
        type: 'payment_refunded',
        related_entity_type: 'payment',
        related_entity_id: paymentData.id
      });
  }

  return { processed: true, action: 'payment_refunded' };
}

// Nova função para ativar anúncios extras após pagamento confirmado
async function activateExtraAd(asaasPaymentId: string, supabase: any) {
  try {
    // Buscar anúncio extra pendente
    const { data: extraAdPending, error: pendingError } = await supabase
      .from('extra_ads_pending')
      .select('*, transactions(*)')
      .eq('asaas_payment_id', asaasPaymentId)
      .single();
    
    if (pendingError || !extraAdPending) {
      return;
    }
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', extraAdPending.user_id)
      .single();
    
    if (userError) {
      return;
    }
    
    // Criar o crédito de anúncio extra
    const { error: creditError } = await supabase
      .from('extra_ad_credits')
      .insert({
        user_id: extraAdPending.user_id,
        quantity: 1,
        status: 'active',
        expires_at: extraAdPending.expires_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_id: asaasPaymentId,
        transaction_id: extraAdPending.transaction_id
      });
    
    if (creditError) {
      return;
    }
    
    // Atualizar status do anúncio extra pendente
    const { error: updateError } = await supabase
      .from('extra_ads_pending')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', extraAdPending.id);
    
    if (updateError) {
    }
    
    // Criar notificação para o usuário
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: extraAdPending.user_id,
        title: 'Anúncio Extra Ativado!',
        message: 'Seu crédito de anúncio extra foi ativado e já está disponível para uso. Validade: 90 dias.',
        type: 'extra_ad_activated',
        read: false,
        created_at: new Date().toISOString()
      });
    
    if (notificationError) {
    }
  } catch (error) {
  }
}

// POST - Receber webhook do Asaas
export async function POST(request: NextRequest) {
  try {
    // Rate limiting básico
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Ler body da requisição
    const body = await request.text();
    
    // Validar assinatura do webhook (em produção)
    if (process.env.NODE_ENV === 'production') {
      if (!validateWebhookSignature(request, body)) {
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 401 }
        );
      }
    }

    // Parse do evento
    let event: AsaasWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    // Log do evento recebido
    // Processar evento
    const result = await processWebhookEvent(event);

    // Log do resultado
    // Registrar webhook no banco (para auditoria)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: null, // Sistema
        action: 'WEBHOOK_RECEIVED',
        entity_type: 'webhook',
        entity_id: event.id,
        new_values: {
          event: event.event,
          payment_id: event.payment?.id,
          status: event.payment?.status,
          result: result
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: 'Asaas Webhook'
      })
      .select()
      .single();

    return NextResponse.json({
      received: true,
      processed: result.processed,
      event: event.event,
      paymentId: event.payment?.id,
      result: result
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        received: true,
        processed: false
      },
      { status: 500 }
    );
  }
}

// GET - Endpoint para testar webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Asaas funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
} 