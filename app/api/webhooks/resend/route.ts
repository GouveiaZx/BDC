import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Tipos de eventos do Resend que vamos processar
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    tags?: { name: string; value: string }[];
    // Eventos específicos
    bounce_classification?: string;
    complaint_feedback_type?: string;
    click_url?: string;
    open_location?: {
      country?: string;
      region?: string;
      city?: string;
    };
  };
}

// Função para verificar a assinatura do webhook (segurança)
function verifyWebhookSignature(request: NextRequest): boolean {
  // Para emails transacionais, o Resend recomenda verificar o User-Agent
  const userAgent = request.headers.get('user-agent');
  return userAgent?.includes('Resend-Webhook') || false;
}

// POST - Receber webhooks do Resend
export async function POST(request: NextRequest) {
  try {
    console.log('[Resend Webhook] Recebendo webhook...');

    // Verificar assinatura do webhook
    if (!verifyWebhookSignature(request)) {
      console.error('[Resend Webhook] Assinatura inválida');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as ResendWebhookEvent;
    console.log('[Resend Webhook] Evento recebido:', body.type, 'Email ID:', body.data.email_id);

    const supabase = getSupabaseAdminClient();

    // Registrar o evento na tabela email_logs
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        email_id: body.data.email_id,
        event_type: body.type,
        recipient: body.data.to[0], // Pega o primeiro destinatário
        subject: body.data.subject,
        sender: body.data.from,
        metadata: {
          tags: body.data.tags || [],
          bounce_classification: body.data.bounce_classification,
          complaint_feedback_type: body.data.complaint_feedback_type,
          click_url: body.data.click_url,
          open_location: body.data.open_location,
          created_at: body.created_at
        }
      });

    if (logError) {
      console.error('[Resend Webhook] Erro ao salvar log:', logError);
    }

    // Atualizar ou criar estatísticas do email
    await updateEmailStats(supabase, body);

    // Processar eventos específicos
    await processSpecificEvent(supabase, body);

    console.log('[Resend Webhook] Evento processado com sucesso');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Resend Webhook] Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Função para atualizar estatísticas de email
async function updateEmailStats(supabase: any, event: ResendWebhookEvent) {
  const { data: emailStat, error: fetchError } = await supabase
    .from('email_stats')
    .select('*')
    .eq('email_id', event.data.email_id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[Resend Webhook] Erro ao buscar estatísticas:', fetchError);
    return;
  }

  // Preparar dados para atualização
  let updateData: any = {};

  switch (event.type) {
    case 'email.delivered':
      updateData.delivered_at = new Date().toISOString();
      break;
    case 'email.opened':
      updateData.opened_at = updateData.opened_at || new Date().toISOString();
      updateData.opens_count = (emailStat?.opens_count || 0) + 1;
      break;
    case 'email.clicked':
      updateData.clicked_at = updateData.clicked_at || new Date().toISOString();
      updateData.clicks_count = (emailStat?.clicks_count || 0) + 1;
      break;
    case 'email.bounced':
      updateData.bounced = true;
      break;
    case 'email.complained':
      updateData.complained = true;
      break;
  }

  if (Object.keys(updateData).length === 0) return;

  if (emailStat) {
    // Atualizar registro existente
    const { error: updateError } = await supabase
      .from('email_stats')
      .update(updateData)
      .eq('email_id', event.data.email_id);

    if (updateError) {
      console.error('[Resend Webhook] Erro ao atualizar estatísticas:', updateError);
    }
  } else {
    // Criar novo registro
    const { error: insertError } = await supabase
      .from('email_stats')
      .insert({
        email_id: event.data.email_id,
        sent_at: new Date().toISOString(),
        ...updateData
      });

    if (insertError) {
      console.error('[Resend Webhook] Erro ao criar estatísticas:', insertError);
    }
  }
}

// Função para processar eventos específicos
async function processSpecificEvent(supabase: any, event: ResendWebhookEvent) {
  switch (event.type) {
    case 'email.bounced':
      await handleBounce(supabase, event);
      break;
    case 'email.complained':
      await handleComplaint(supabase, event);
      break;
    case 'email.delivered':
      await updateUserEmailStats(supabase, event.data.to[0], 'delivered');
      break;
    case 'email.opened':
      await updateUserEmailStats(supabase, event.data.to[0], 'opened');
      break;
    case 'email.clicked':
      await updateUserEmailStats(supabase, event.data.to[0], 'clicked');
      break;
  }
}

// Função para lidar com bounces
async function handleBounce(supabase: any, event: ResendWebhookEvent) {
  const email = event.data.to[0];
  console.log('[Resend Webhook] Processando bounce para:', email);

  // Adicionar à blacklist se for bounce hard
  if (event.data.bounce_classification === 'hard') {
    const { error } = await supabase
      .from('email_blacklist')
      .upsert({
        email: email,
        reason: 'hard_bounce',
        notes: `Bounce classification: ${event.data.bounce_classification}`
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('[Resend Webhook] Erro ao adicionar à blacklist:', error);
    }
  }

  await updateUserEmailStats(supabase, email, 'bounced');
}

// Função para lidar com reclamações
async function handleComplaint(supabase: any, event: ResendWebhookEvent) {
  const email = event.data.to[0];
  console.log('[Resend Webhook] Processando reclamação para:', email);

  // Adicionar à blacklist
  const { error } = await supabase
    .from('email_blacklist')
    .upsert({
      email: email,
      reason: 'complaint',
      notes: `Complaint type: ${event.data.complaint_feedback_type || 'spam'}`
    }, {
      onConflict: 'email'
    });

  if (error) {
    console.error('[Resend Webhook] Erro ao adicionar à blacklist:', error);
  }

  await updateUserEmailStats(supabase, email, 'complained');
}

// Função para atualizar estatísticas por usuário
async function updateUserEmailStats(supabase: any, email: string, eventType: string) {
  // Buscar usuário pelo email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!user) return;

  // Buscar ou criar estatísticas do usuário
  const { data: stats, error: fetchError } = await supabase
    .from('user_email_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[Resend Webhook] Erro ao buscar stats do usuário:', fetchError);
    return;
  }

  let updateData: any = { last_updated: new Date().toISOString() };

  switch (eventType) {
    case 'delivered':
      updateData.delivered_count = (stats?.delivered_count || 0) + 1;
      break;
    case 'bounced':
      updateData.bounced_count = (stats?.bounced_count || 0) + 1;
      break;
    case 'complained':
      updateData.complained_count = (stats?.complained_count || 0) + 1;
      break;
    case 'opened':
      updateData.opened_count = (stats?.opened_count || 0) + 1;
      break;
    case 'clicked':
      updateData.clicked_count = (stats?.clicked_count || 0) + 1;
      break;
  }

  if (stats) {
    // Atualizar
    const { error } = await supabase
      .from('user_email_stats')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Resend Webhook] Erro ao atualizar stats do usuário:', error);
    }
  } else {
    // Criar
    const { error } = await supabase
      .from('user_email_stats')
      .insert({
        user_id: user.id,
        sent_count: 0,
        ...updateData
      });

    if (error) {
      console.error('[Resend Webhook] Erro ao criar stats do usuário:', error);
    }
  }
}

// GET - Para testar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Resend Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
} 