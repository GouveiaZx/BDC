/**
 * Serviço centralizado para gerenciar notificações
 */

import { getSupabaseClient } from './supabase';
import { convertTempIdToUUID } from './utils';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Obter notificações para o usuário atual
 * @param limit Número máximo de notificações a retornar (padrão: 5)
 * @returns Lista de notificações
 */
export async function fetchNotifications(limit: number = 5): Promise<Notification[]> {
  try {
    // Obter userId atual
    let userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.warn('Nenhum ID de usuário encontrado para buscar notificações');
      return [];
    }
    
    // Normalizar o ID para garantir que esteja no formato UUID correto
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      const oldId = userId;
      userId = convertTempIdToUUID(userId);
      console.log(`ID convertido para UUID válido (fetchNotifications): ${oldId} -> ${userId}`);
    }
    
    // Fazer solicitação ao Supabase usando o cliente com retry
    const supabase = getSupabaseClient();
    
    // Obter token de autenticação
    const accessToken = localStorage.getItem('sb-access-token');
    
    // Tentar primeiro com API REST para evitar problemas de permissão
    if (accessToken) {
      try {
        console.log('Tentando buscar notificações via API REST');
        
        // Configurar headers com token de autenticação
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`
        };
        
        // Incluir ID do usuário nos cabeçalhos como informação adicional
        headers['x-user-id'] = userId;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?select=*&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`, {
          method: 'GET',
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          return data || [];
        }
        
        console.warn('Falha ao buscar notificações via API REST, tentando método alternativo');
      } catch (restError) {
        console.error('Erro ao buscar notificações via API REST:', restError);
      }
    }
    
    // Configurar headers para o SDK Supabase
    const customHeaders: Record<string, string> = {};
    
    if (accessToken) {
      customHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
    
    customHeaders['x-user-id'] = userId;
    
    // Tentar buscar notificações via SDK Supabase com headers personalizados
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .setHeader('x-user-id', userId)
        .setHeader('Prefer', 'return=representation');
      
      if (error) {
        // Tentar novamente com outra abordagem se a primeira falhar
        if (error.code === '22P02') { // invalid input syntax for type
          console.warn('Erro de sintaxe UUID. Tentando abordagem alternativa...');
          
          // Buscar todas as notificações e filtrar no cliente
          try {
            const { data: allData, error: allError } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);
              
            if (allError) {
              console.error('Erro ao buscar todas as notificações:', allError);
              return [];
            }
            
            // Filtrar no cliente
            return (allData || [])
              .filter(notification => 
                notification.user_id === userId || 
                notification.user_id === null || 
                notification.user_id === undefined
              )
              .slice(0, limit);
          } catch (filtroError) {
            console.error('Erro ao filtrar notificações:', filtroError);
            return [];
          }
        }
        
        console.error('Erro ao buscar notificações:', error);
        
        // Retornar array vazio em caso de erro, evitando falha da UI
        return [];
      }
      
      return data || [];
    } catch (queryError) {
      console.error('Erro na query do Supabase:', queryError);
      
      // Retornar um array vazio em caso de erro, evitando falha da UI
      return [];
    }
  } catch (e) {
    console.error('Exceção ao buscar notificações:', e);
    return [];
  }
}

/**
 * Marcar uma notificação como lida
 * @param notificationId ID da notificação
 * @returns boolean indicando sucesso
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    // Fazer solicitação ao Supabase usando o cliente com retry
    const supabase = getSupabaseClient();
    
    // Obter token de autenticação
    const accessToken = localStorage.getItem('sb-access-token');
    
    // Tentar primeiro com API REST para evitar problemas de permissão
    if (accessToken) {
      try {
        console.log('Tentando marcar notificação como lida via API REST');
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ is_read: true })
        });
        
        if (response.ok) {
          return true;
        }
        
        console.warn('Falha ao marcar notificação como lida via API REST, tentando método alternativo');
      } catch (restError) {
        console.error('Erro ao marcar notificação como lida via API REST:', restError);
      }
    }
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Exceção ao marcar notificação como lida:', e);
    return false;
  }
}

/**
 * Adicionar uma notificação para o usuário
 * @param userId ID do usuário
 * @param title Título da notificação
 * @param message Mensagem da notificação
 * @param link Link opcional
 * @returns boolean indicando sucesso
 */
export async function addNotification(
  userId: string, 
  title: string, 
  message: string, 
  link?: string
): Promise<boolean> {
  try {
    // Normalizar o ID para garantir que esteja no formato UUID correto
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      const oldId = userId;
      userId = convertTempIdToUUID(userId);
      console.log(`ID convertido para UUID válido (addNotification): ${oldId} -> ${userId}`);
    }
    
    // Fazer solicitação ao Supabase usando o cliente com retry
    const supabase = getSupabaseClient();
    
    // Obter token de autenticação
    const accessToken = localStorage.getItem('sb-access-token');
    
    // Tentar primeiro com API REST para evitar problemas de permissão
    if (accessToken) {
      try {
        console.log('Tentando adicionar notificação via API REST');
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: userId,
            title,
            message,
            link,
            is_read: false,
            created_at: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          return true;
        }
        
        console.warn('Falha ao adicionar notificação via API REST, tentando método alternativo');
      } catch (restError) {
        console.error('Erro ao adicionar notificação via API REST:', restError);
      }
    }
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        link,
        is_read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Erro ao adicionar notificação:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Exceção ao adicionar notificação:', e);
    return false;
  }
}

/**
 * Remover uma notificação
 * @param notificationId ID da notificação
 * @returns boolean indicando sucesso
 */
export async function removeNotification(notificationId: string): Promise<boolean> {
  try {
    // Fazer solicitação ao Supabase usando o cliente com retry
    const supabase = getSupabaseClient();
    
    // Obter token de autenticação
    const accessToken = localStorage.getItem('sb-access-token');
    
    // Tentar primeiro com API REST para evitar problemas de permissão
    if (accessToken) {
      try {
        console.log('Tentando remover notificação via API REST');
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=minimal'
          }
        });
        
        if (response.ok) {
          return true;
        }
        
        console.warn('Falha ao remover notificação via API REST, tentando método alternativo');
      } catch (restError) {
        console.error('Erro ao remover notificação via API REST:', restError);
      }
    }
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error('Erro ao remover notificação:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Exceção ao remover notificação:', e);
    return false;
  }
} 