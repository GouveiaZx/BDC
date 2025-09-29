'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaBell, FaEnvelope, FaCheck, FaTimes, FaCreditCard, FaTag, FaExclamationTriangle, FaUser, FaLightbulb } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

interface NotificationsWidgetProps {
  userId: string;
  limit?: number;
  showAll?: boolean;
  className?: string;
}

export default function NotificationsWidget({ userId, limit = 3, showAll = false, className = '' }: NotificationsWidgetProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Carregar notificações usando a nova API de estatísticas
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userId) {
          setNotifications([]);
          return;
        }
        
        console.log(`🔔 Buscando notificações para o usuário ${userId}`);
        
        const response = await fetch(`/api/dashboard/stats?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar estatísticas do dashboard');
        }
        
        const result = await response.json();
        
        if (result.success && result.data?.notifications) {
          // Combinar notificações reais e inteligentes
          const realNotifications = result.data.notifications.real || [];
          const smartNotifications = result.data.notifications.smart || [];
          
          // Converter notificações inteligentes para o formato esperado
          const convertedSmartNotifications = smartNotifications.map((smart: any) => ({
            id: smart.notification_id,
            title: smart.title,
            message: smart.message,
            type: smart.type,
            is_read: false,
            created_at: smart.created_at,
            related_entity_type: 'system',
            related_entity_id: userId
          }));
          
          // Combinar e limitar as notificações
          const allNotifications = [...realNotifications, ...convertedSmartNotifications];
          const limitedNotifications = showAll ? allNotifications : allNotifications.slice(0, limit);
          
          setNotifications(limitedNotifications);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Erro ao carregar notificações:', err);
        setError('Falha ao buscar notificações');
        
        // Fallback para notificações de exemplo
        setNotifications([
          {
            id: 'fallback-1',
            title: 'Sistema funcionando',
            message: 'Seu painel está carregado e funcionando corretamente.',
            type: 'system',
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, [userId, limit, showAll]);
  
  // Marcar notificação como lida
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read && notification.related_entity_type !== 'system') {
      try {
        const response = await fetch('/api/dashboard/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            action: 'markAsRead',
            notificationId: notification.id
          })
        });
        
        if (response.ok) {
          // Atualizar o estado local
          setNotifications(notifications.map(n => {
            if (n.id === notification.id) {
              return { ...n, is_read: true };
            }
            return n;
          }));
        }
      } catch (error) {
        console.warn('Erro ao marcar notificação como lida:', error);
      }
    }
  };
  
  // Função para obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string, title: string) => {
    switch(type) {
      case 'message':
      case 'contact':
        return <FaEnvelope className="text-blue-500" />;
      case 'approval':
        return <FaCheck className="text-green-500" />;
      case 'rejection':
        return <FaTimes className="text-red-500" />;
      case 'subscription':
      case 'payment':
        return <FaCreditCard className="text-purple-500" />;
      case 'ad':
        return <FaTag className="text-orange-500" />;
      case 'alert':
        return <FaExclamationTriangle className="text-amber-500" />;
      case 'tip':
        return <FaLightbulb className="text-yellow-500" />;
      case 'profile':
        return <FaUser className="text-indigo-500" />;
      case 'system':
      default:
        return <FaBell className="text-blue-500" />;
    }
  };
  
  // Função para formatar tempo relativo
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Agora';
    if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHour < 24) return `Há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    if (diffDay < 7) return `Há ${diffDay} ${diffDay === 1 ? 'dia' : 'dias'}`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };
  
  // Determinar classe de background com base no tipo e status de leitura
  const getNotificationBgClass = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50';
    
    switch(type) {
      case 'approval':
        return 'bg-green-50';
      case 'rejection':
        return 'bg-red-50';
      case 'message':
      case 'contact':
        return 'bg-blue-50';
      case 'subscription':
      case 'payment':
        return 'bg-purple-50';
      case 'alert':
        return 'bg-amber-50';
      case 'tip':
        return 'bg-yellow-50';
      case 'profile':
        return 'bg-indigo-50';
      case 'ad':
        return 'bg-orange-50';
      case 'system':
      default:
        return 'bg-gray-50';
    }
  };
  
  // Determinar classe de texto com base no tipo e status de leitura
  const getNotificationTextClass = (type: string, isRead: boolean) => {
    if (isRead) return 'text-gray-600';
    
    switch(type) {
      case 'approval':
        return 'text-green-800';
      case 'rejection':
        return 'text-red-800';
      case 'message':
      case 'contact':
        return 'text-blue-800';
      case 'subscription':
      case 'payment':
        return 'text-purple-800';
      case 'alert':
        return 'text-amber-800';
      case 'tip':
        return 'text-yellow-800';
      case 'profile':
        return 'text-indigo-800';
      case 'ad':
        return 'text-orange-800';
      case 'system':
      default:
        return 'text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
        <h3 className="font-semibold text-gray-800 flex items-center mb-4">
          <FaBell className="mr-2 text-amber-500" /> Notificações
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
        <h3 className="font-semibold text-gray-800 flex items-center mb-4">
          <FaBell className="mr-2 text-amber-500" /> Notificações
        </h3>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="font-semibold text-gray-800 flex items-center mb-4">
        <FaBell className="mr-2 text-amber-500" /> Notificações
        {notifications.filter(n => !n.is_read).length > 0 && (
          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            {notifications.filter(n => !n.is_read).length}
          </span>
        )}
      </h3>
      
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, showAll ? notifications.length : limit).map(notification => (
            <div 
              key={notification.id} 
              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-opacity-80 ${getNotificationBgClass(notification.type, notification.is_read)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type, notification.title)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${getNotificationTextClass(notification.type, notification.is_read)}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                    </div>
                    
                    {!notification.is_read && (
                      <div className="ml-2 mt-1 flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FaBell className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500 text-sm">Você não tem notificações no momento.</p>
        </div>
      )}
      
      {!showAll && notifications.length > 0 && (
        <Link
          href="/painel-anunciante/notificacoes"
          className="text-blue-600 hover:text-blue-800 text-sm mt-3 inline-block"
        >
          Ver todas notificações
        </Link>
      )}
    </div>
  );
} 