import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaasService from '../../../../lib/asaas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('asaas-signature') || '';
    
    // Validar webhook
    if (!asaasService.validateWebhook(body, signature)) {
      console.error('Webhook inválido - assinatura não confere');
      return NextResponse.json({ error: 'Webhook inválido' }, { status: 401 });
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
      console.error('Erro ao salvar webhook:', webhookError);
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
        console.log(`Evento não processado: ${event}`);
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
    console.error('Erro ao processar webhook:', error);
    
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
      console.log(`Transação não encontrada para payment ID: ${payment.id}`);
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
      console.error('Erro ao atualizar transação:', error);
    } else {
      console.log(`Transação ${payment.id} atualizada com status: ${payment.status}`);
    }

    // Se for pagamento de assinatura confirmado, ativar assinatura
    if ((payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') && payment.subscription) {
      await activateSubscription(payment.subscription);
    }

  } catch (error) {
    console.error('Erro ao processar webhook de pagamento:', error);
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
      console.log(`Assinatura não encontrada para subscription ID: ${subscription.id}`);
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
      console.error('Erro ao atualizar assinatura:', error);
    } else {
      console.log(`Assinatura ${subscription.id} atualizada com status: ${subscription.status}`);
    }

  } catch (error) {
    console.error('Erro ao processar webhook de assinatura:', error);
  }
}

async function activateSubscription(subscriptionId: string) {
  try {
    const { error } = await supabase
      .from('asaas_subscriptions')
      .update({ status: 'ACTIVE' })
      .eq('asaas_subscription_id', subscriptionId);

    if (error) {
      console.error('Erro ao ativar assinatura:', error);
    } else {
      console.log(`Assinatura ${subscriptionId} ativada`);
    }
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
  }
} 