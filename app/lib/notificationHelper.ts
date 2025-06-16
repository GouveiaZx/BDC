/**
 * Helper para criar notificações para os usuários
 */
import { convertTempIdToUUID } from './utils';

export type NotificationType = 
  | 'system'       // Notificações do sistema
  | 'message'      // Mensagens diretas
  | 'payment'      // Pagamentos
  | 'ad'           // Relacionadas a anúncios em geral
  | 'approval'     // Aprovação de anúncios
  | 'rejection'    // Rejeição de anúncios
  | 'subscription' // Assinaturas
  | 'contact'      // Contatos recebidos
  | 'alert';       // Alertas diversos

interface NotificationOptions {
  userId: string;
  type: NotificationType;
  message: string;
  title?: string;
  adId?: string;
  adTitle?: string;
  data?: any;
}

/**
 * Adiciona uma notificação para um usuário
 */
export const addNotification = async (options: NotificationOptions): Promise<boolean> => {
  try {
    // Verificar se estamos no lado do cliente ou servidor
    const isClient = typeof window !== 'undefined';
    
    // Converter ID temporário para UUID válido se necessário
    let validUserId = options.userId;
    if (options.userId.startsWith('temp-')) {
      validUserId = convertTempIdToUUID(options.userId);
      console.log('ID temporário convertido para UUID válido (notificationHelper):', validUserId);
    }
    
    // Base URL para API (diferente conforme ambiente)
    const baseUrl = isClient 
      ? '' // URL relativa no cliente
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.buscaaquibdc.com'; // URL absoluta no servidor
    
    // Fazer chamada à API para adicionar notificação
    const response = await fetch(`${baseUrl}/api/notifications/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: validUserId,
        type: options.type,
        title: options.title,
        message: options.message,
        adId: options.adId,
        adTitle: options.adTitle,
        data: options.data
      }),
      // Incluir credentials para enviar cookies (especialmente importante no cliente)
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Erro ao adicionar notificação:', await response.text());
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Erro ao adicionar notificação:', error);
    return false;
  }
};

/**
 * Adiciona uma notificação de anúncio aprovado
 */
export const notifyAdApproved = async (userId: string, adId: string, adTitle: string): Promise<boolean> => {
  return addNotification({
    userId,
    type: 'approval',
    title: 'Anúncio Aprovado',
    message: `Seu anúncio "${adTitle}" foi aprovado e está ativo.`,
    adId,
    adTitle
  });
};

/**
 * Adiciona uma notificação de anúncio rejeitado
 */
export const notifyAdRejected = async (userId: string, adId: string, adTitle: string, reason?: string): Promise<boolean> => {
  return addNotification({
    userId,
    type: 'rejection',
    title: 'Anúncio Rejeitado',
    message: reason 
      ? `Seu anúncio "${adTitle}" foi rejeitado. Motivo: ${reason}` 
      : `Seu anúncio "${adTitle}" foi rejeitado. Verifique as diretrizes e tente novamente.`,
    adId,
    adTitle,
    data: { reason }
  });
};

/**
 * Adiciona uma notificação de novo contato recebido
 */
export const notifyNewContact = async (userId: string, adId: string, adTitle: string, contactName?: string): Promise<boolean> => {
  return addNotification({
    userId,
    type: 'contact',
    title: 'Novo Contato',
    message: contactName 
      ? `Você recebeu um novo contato de ${contactName} sobre seu anúncio "${adTitle}".` 
      : `Você recebeu um novo contato sobre seu anúncio "${adTitle}".`,
    adId,
    adTitle,
    data: { contactName }
  });
};

/**
 * Adiciona uma notificação de assinatura atualizada
 */
export const notifySubscriptionUpdated = async (userId: string, planName: string, status: string): Promise<boolean> => {
  return addNotification({
    userId,
    type: 'subscription',
    title: 'Assinatura Atualizada',
    message: `Sua assinatura do plano "${planName}" foi ${status}.`,
    data: { planName, status }
  });
}; 