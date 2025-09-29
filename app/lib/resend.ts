import { Resend } from 'resend';
import { getSupabaseAdminClient } from './supabase';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY não está definida nas variáveis de ambiente');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Configurações padrão
export const EMAIL_CONFIG = {
  FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@buscaaquibdc.com',
  REPLY_TO: 'contato@buscaaquibdc.com',
  COMPANY_NAME: 'BuscaAquiBdC',
  COMPANY_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://www.buscaaquibdc.com',
  SUPPORT_EMAIL: 'suporte@buscaaquibdc.com',
  ADMIN_EMAIL: process.env.RESEND_ADMIN_EMAIL || 'admin@buscaaquibdc.com.br',
};

// Interface para dados de email
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

// Função principal para envio de emails
export async function sendEmail(emailData: EmailData) {
  try {
    console.log('[Resend] Enviando email para:', emailData.to);
    
    const response = await resend.emails.send({
      from: emailData.from || EMAIL_CONFIG.FROM_EMAIL,
      to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      replyTo: emailData.replyTo || EMAIL_CONFIG.REPLY_TO,
      cc: emailData.cc,
      bcc: emailData.bcc,
      headers: emailData.headers,
      tags: emailData.tags,
    });

    console.log('[Resend] Email enviado com sucesso:', response.data?.id);
    return {
      success: true,
      id: response.data?.id,
      data: response.data,
    };
  } catch (error) {
    console.error('[Resend] Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para envio de email com retry
export async function sendEmailWithRetry(
  emailData: EmailData, 
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Resend] Tentativa ${attempt}/${maxRetries} de envio para:`, emailData.to);
    
    const result = await sendEmail(emailData);
    
    if (result.success) {
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`[Resend] Falha na tentativa ${attempt}, tentando novamente em ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay *= 2; // Backoff exponencial
    }
  }
  
  return {
    success: false,
    error: `Falha após ${maxRetries} tentativas`,
  };
}

// Função para validar email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para logging de emails
export async function logEmail(
  emailData: EmailData, 
  result: { success: boolean; id?: string; error?: string },
  context?: string
) {
  try {
    const logData = {
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      success: result.success,
      email_id: result.id,
      error: result.error,
      context: context || 'manual',
      created_at: new Date().toISOString(),
    };
    
    console.log('[Resend] Log do email:', logData);
    
    // Aqui você pode integrar com Supabase para salvar logs se desejar
    // const { error } = await supabase.from('email_logs').insert(logData);
    
  } catch (error) {
    console.error('[Resend] Erro ao fazer log do email:', error);
  }
}

// Função para verificar se email está na blacklist
export async function isEmailBlacklisted(email: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('email_blacklist')
      .select('id')
      .eq('email', email)
      .is('unblocked_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Resend] Erro ao verificar blacklist:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[Resend] Erro ao verificar blacklist:', error);
    return false;
  }
}

// Função para adicionar email à blacklist
export async function addToBlacklist(email: string, reason: string, notes?: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('email_blacklist')
      .upsert({
        email: email,
        reason: reason,
        notes: notes || `Adicionado automaticamente: ${reason}`
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('[Resend] Erro ao adicionar à blacklist:', error);
      return false;
    }

    console.log(`[Resend] Email ${email} adicionado à blacklist por: ${reason}`);
    return true;
  } catch (error) {
    console.error('[Resend] Erro ao adicionar à blacklist:', error);
    return false;
  }
}

// Função para remover email da blacklist
export async function removeFromBlacklist(email: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('email_blacklist')
      .update({ unblocked_at: new Date().toISOString() })
      .eq('email', email);

    if (error) {
      console.error('[Resend] Erro ao remover da blacklist:', error);
      return false;
    }

    console.log(`[Resend] Email ${email} removido da blacklist`);
    return true;
  } catch (error) {
    console.error('[Resend] Erro ao remover da blacklist:', error);
    return false;
  }
}

// Função melhorada para envio de email com verificação de blacklist
export async function sendEmailSafely(emailData: EmailData) {
  try {
    // Verificar se algum destinatário está na blacklist
    const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    
    for (const recipient of recipients) {
      if (await isEmailBlacklisted(recipient)) {
        console.warn(`[Resend] Email ${recipient} está na blacklist. Envio cancelado.`);
        return {
          success: false,
          error: `Email ${recipient} está na blacklist`,
          skipped: true
        };
      }
    }

    // Se passou na verificação, enviar normalmente
    const result = await sendEmail(emailData);
    
    // Registrar estatística de envio
    if (result.success && result.id) {
      await recordEmailSent(result.id, emailData);
    }
    
    return result;
  } catch (error) {
    console.error('[Resend] Erro no envio seguro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para registrar estatística de email enviado
async function recordEmailSent(emailId: string, emailData: EmailData): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Registrar na tabela email_stats
    await supabase
      .from('email_stats')
      .insert({
        email_id: emailId,
        sent_at: new Date().toISOString()
      });

    // Atualizar estatísticas do usuário se possível
    const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    
    for (const recipient of recipients) {
      await updateUserSentCount(recipient);
    }

  } catch (error) {
    console.error('[Resend] Erro ao registrar estatística:', error);
  }
}

// Função para atualizar contagem de emails enviados por usuário
async function updateUserSentCount(email: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    
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
      console.error('[Resend] Erro ao buscar stats do usuário:', fetchError);
      return;
    }

    const updateData = {
      sent_count: (stats?.sent_count || 0) + 1,
      last_updated: new Date().toISOString()
    };

    if (stats) {
      // Atualizar
      await supabase
        .from('user_email_stats')
        .update(updateData)
        .eq('user_id', user.id);
    } else {
      // Criar
      await supabase
        .from('user_email_stats')
        .insert({
          user_id: user.id,
          ...updateData,
          delivered_count: 0,
          bounced_count: 0,
          complained_count: 0,
          opened_count: 0,
          clicked_count: 0
        });
    }

  } catch (error) {
    console.error('[Resend] Erro ao atualizar contagem de envios:', error);
  }
}

// Função para obter estatísticas de email
export async function getEmailStats(emailId?: string) {
  try {
    const supabase = getSupabaseAdminClient();
    
    if (emailId) {
      // Estatísticas de um email específico
      const { data, error } = await supabase
        .from('email_stats')
        .select('*')
        .eq('email_id', emailId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Resend] Erro ao buscar estatísticas do email:', error);
        return null;
      }

      return data;
    } else {
      // Estatísticas gerais
      const { data, error } = await supabase
        .from('email_stats')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[Resend] Erro ao buscar estatísticas gerais:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('[Resend] Erro ao obter estatísticas:', error);
    return null;
  }
}

// Função para obter estatísticas por usuário
export async function getUserEmailStats(userId: string) {
  try {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_email_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Resend] Erro ao buscar stats do usuário:', error);
      return null;
    }

    return data || {
      sent_count: 0,
      delivered_count: 0,
      bounced_count: 0,
      complained_count: 0,
      opened_count: 0,
      clicked_count: 0
    };
  } catch (error) {
    console.error('[Resend] Erro ao obter stats do usuário:', error);
    return null;
  }
} 