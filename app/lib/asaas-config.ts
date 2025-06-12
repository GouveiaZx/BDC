/**
 * Configuração do Asaas - MODO 100% REAL ATIVADO
 */

export const ASAAS_CONFIG = {
  // MODO REAL ATIVADO - Todas as funcionalidades são reais
  ENABLE_REAL_PAYMENTS: true,
  
  // URLs para chamadas backend (evitam CORS no cliente)
  BACKEND_ROUTES: {
    CUSTOMERS: '/api/asaas/customers',
    SUBSCRIPTIONS: '/api/asaas/subscriptions',
    PAYMENTS: '/api/asaas/payments'
  },
  
  // TODAS as funcionalidades funcionam em modo real
  REAL_FEATURES: [
    'user_authentication',
    'user_profiles', 
    'ads_management',
    'image_upload',
    'statistics',
    'notifications',
    'subscription_control',
    'email_system',
    'asaas_payments',        // ✅ AGORA REAL
    'external_billing',      // ✅ AGORA REAL
    'customer_management',   // ✅ AGORA REAL
    'subscription_billing'   // ✅ AGORA REAL
  ],
  
  // Nenhuma funcionalidade em mock
  MOCK_FEATURES: []
};

/**
 * Função para verificar se uma feature está em modo real
 */
export function isFeatureReal(feature: string): boolean {
  return ASAAS_CONFIG.REAL_FEATURES.includes(feature);
}

/**
 * Função para verificar se deve usar Asaas real
 */
export function shouldUseRealAsaas(): boolean {
  return true; // SEMPRE REAL
}

/**
 * Status atual do sistema
 */
export function getSystemStatus() {
  return {
    realFeatures: ASAAS_CONFIG.REAL_FEATURES.length,
    mockFeatures: ASAAS_CONFIG.MOCK_FEATURES.length,
    asaasMode: 'REAL',
    systemPercentage: '100% REAL',
    readyForProduction: true,
    corsIssue: 'RESOLVIDO - Usando APIs backend'
  };
} 