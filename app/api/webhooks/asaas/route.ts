import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Webhook secret para validar requisições do Asaas
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || 'webhook_secret_key_here';

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

// Helper para validar webhook
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get('asaas-access-token');
    // Em produção, implementar validação real da assinatura
    // Por enquanto, verificar se o token está presente
    return signature === WEBHOOK_SECRET;
  } catch (error) {
    console.error('Erro ao validar assinatura webhook:', error);
    return false;
  }
}

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
        console.log(`Evento não processado: ${event.event}`);
        return { processed: false, reason: 'Evento não reconhecido' };
    }
  } catch (error) {
    console.error('Erro ao processar evento webhook:', error);
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
    console.error('Erro ao atualizar pagamento criado:', error);
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
    console.log('Pagamento não encontrado no banco:', payment.id);
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
    console.error('Erro ao atualizar pagamento pendente:', error);
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

  if (!paymentData) {
    console.log('Pagamento não encontrado no banco:', payment.id);
    return { processed: false, reason: 'Pagamento não encontrado' };
  }

  // Atualizar pagamento
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
    console.error('Erro ao atualizar pagamento confirmado:', paymentError);
    throw paymentError;
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
      console.error('Erro ao ativar assinatura:', subscriptionError);
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
  }

  return { processed: true, action: 'payment_confirmed' };
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
    console.error('Erro ao atualizar pagamento em atraso:', paymentError);
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
      console.error('Erro ao suspender assinatura:', subscriptionError);
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
    console.error('Erro ao marcar pagamento como cancelado:', error);
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
    console.error('Erro ao marcar pagamento como estornado:', paymentError);
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
      console.error('Erro ao cancelar assinatura:', subscriptionError);
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

// POST - Receber webhook do Asaas
export async function POST(request: NextRequest) {
  try {
    // Ler body da requisição
    const body = await request.text();
    
    // Validar assinatura do webhook (em produção)
    if (process.env.NODE_ENV === 'production') {
      if (!validateWebhookSignature(request, body)) {
        console.error('Assinatura webhook inválida');
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
      console.error('Erro ao fazer parse do webhook:', parseError);
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    // Log do evento recebido
    console.log('Webhook Asaas recebido:', {
      event: event.event,
      paymentId: event.payment?.id,
      status: event.payment?.status,
      value: event.payment?.value,
      dateCreated: event.dateCreated
    });

    // Processar evento
    const result = await processWebhookEvent(event);

    // Log do resultado
    console.log('Resultado do processamento:', result);

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
    console.error('Erro no webhook Asaas:', error);
    
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