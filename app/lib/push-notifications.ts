// Biblioteca para gerenciar notificações push PWA
export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Inicializar notificações push
  public async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications não são suportadas neste navegador');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar notificações push:', error);
      return false;
    }
  }

  // Solicitar permissão para notificações
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notificações não são suportadas neste navegador');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // Verificar se está subscrito
  public async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) return false;

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  // Subscrever às notificações push
  public async subscribe(): Promise<PushSubscription | null> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Permissão para notificações negada');
      return null;
    }

    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('Service Worker não está registrado');
      return null;
    }

    try {
      // Chave VAPID pública (você deve gerar uma)
      const vapidPublicKey = 'BMQnJLG0Rj8SppVQlD3IEfHWlj8TJkJM5lKHhiJAhixEj8Q5f4bFd6PKm2h2cGt9Yx6n9mQxYCMvdQfHKwfJQw';
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Enviar subscription para o servidor
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Erro ao subscrever às notificações push:', error);
      return null;
    }
  }

  // Desinscrever das notificações push
  public async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // Remover subscription do servidor
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao desinscrever das notificações push:', error);
      return false;
    }
  }

  // Enviar notificação local (para teste)
  public async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') return;

    const defaultOptions: NotificationOptions = {
      body: 'Corpo da notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      requireInteraction: false,
      ...options
    };

    if (this.registration) {
      await this.registration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  }

  // Enviar subscription para o servidor
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar subscription para o servidor');
      }
    } catch (error) {
      console.error('Erro ao enviar subscription:', error);
    }
  }

  // Remover subscription do servidor
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Falha ao remover subscription do servidor');
      }
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
    }
  }

  // Converter chave VAPID
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Verificar status de notificações
  public getNotificationStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    serviceWorkerSupported: boolean;
    pushManagerSupported: boolean;
  } {
    return {
      supported: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'denied',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushManagerSupported: 'PushManager' in window
    };
  }
}

// Instância singleton
export const pushManager = PushNotificationManager.getInstance();

// Tipos de notificação para o app
export interface BDCNotification {
  title: string;
  body: string;
  type: 'ad_approved' | 'ad_rejected' | 'new_message' | 'payment_success' | 'highlight_expiring' | 'system';
  data?: {
    adId?: string;
    userId?: string;
    url?: string;
  };
}

// Função helper para criar notificações específicas do BDC
export async function sendBDCNotification(notification: BDCNotification): Promise<void> {
  const options: NotificationOptions = {
    body: notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: notification.data,
    tag: notification.type, // Previne notificações duplicadas
    requireInteraction: notification.type === 'payment_success' || notification.type === 'ad_approved'
  };

  await pushManager.showLocalNotification(notification.title, options);
} 