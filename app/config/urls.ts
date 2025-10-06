/**
 * Configuração centralizada de URLs da aplicação
 *
 * IMPORTANTE: Em produção, NEXT_PUBLIC_BASE_URL deve estar configurado
 * nas variáveis de ambiente do Vercel/servidor
 */

/**
 * Obtém a URL base da aplicação
 * Prioriza variáveis de ambiente, depois tenta detectar automaticamente
 */
export function getBaseUrl(): string {
  // 1. Prioridade: variável de ambiente
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 2. Em produção na Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Client-side: usar window.location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 4. Fallback para desenvolvimento (NUNCA deve ser usado em produção)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // 5. Último recurso: erro se não conseguiu determinar
  throw new Error('NEXT_PUBLIC_BASE_URL não configurado e não foi possível determinar URL base');
}

/**
 * Obtém a URL completa de uma API interna
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * URLs de API pré-configuradas para uso comum
 */
export const API_URLS = {
  // Autenticação
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',

  // Destaques
  DESTAQUES: '/api/destaques',

  // Anúncios
  ADS: '/api/ads',
  ADS_CREATE: '/api/ads/create',

  // Usuários
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  USER_SUBSCRIPTION: '/api/users/subscription',

  // Pagamentos
  PAYMENTS: '/api/payments',
  PAYMENTS_PROCESS: '/api/payments/process-extra-ad',

  // Admin
  ADMIN_AUTH: '/api/admin/auth',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_ADS: '/api/admin/ads',
  ADMIN_SUBSCRIPTIONS: '/api/admin/subscriptions',
} as const;

/**
 * Valida se a URL base está configurada corretamente em produção
 */
export function validateProductionUrl(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BASE_URL && !process.env.VERCEL_URL) {
    console.error('ERRO: NEXT_PUBLIC_BASE_URL não configurado em produção!');
  }
}
