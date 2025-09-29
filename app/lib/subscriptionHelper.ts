import { SubscriptionPlan } from "../models/types";
import { PaymentHistoryItem } from "./useSubscriptionSync";

// Interface para os dados retornados pela API
interface SubscriptionApiResponse {
  success: boolean;
  subscription: {
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    status: string;
    paymentStatus: string;
    paymentHistory: PaymentHistoryItem[];
    paymentMethods: Array<{
      id: string;
      brand: string;
      last4: string;
      expiryMonth: string;
      expiryYear: string;
      isDefault: boolean;
    }>;
  };
}

// Interface para mapeamento de nomes de planos
interface PlanNameMap {
  [key: string]: string;
}

// Interface para recursos disponíveis por plano
export interface PlanFeatures {
  maxAds: number;
  hasGallery: boolean;
  maxGalleryImages: number;
  hasContactInfo: boolean;
  hasStatistics: boolean;
  hasPriority: boolean;
  hasNotifications: boolean;
  maxNotifications: number;
  hasFeaturedAds: boolean;
  maxFeaturedAds: number;
  [key: string]: any;
}

// Tipo para mapeamento de planos para recursos
export interface PlanFeaturesMap {
  [key: string]: PlanFeatures;
  free: PlanFeatures;
  premium: PlanFeatures;
  business: PlanFeatures;
}

// Mapeamento de planos para nomes legíveis
export const planDisplayNames: PlanNameMap = {
  [SubscriptionPlan.FREE]: 'Gratuito',
  [SubscriptionPlan.MICRO_BUSINESS]: 'Micro-Empresa',
  [SubscriptionPlan.SMALL_BUSINESS]: 'Pequena Empresa',
  [SubscriptionPlan.BUSINESS_SIMPLE]: 'Empresa Simples',
  [SubscriptionPlan.BUSINESS_PLUS]: 'Empresa Plus'
};

// Mapeamento de planos para período de trial
export const planTrialDays: {[key in SubscriptionPlan]: number} = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.MICRO_BUSINESS]: 30,
  [SubscriptionPlan.SMALL_BUSINESS]: 30,
  [SubscriptionPlan.BUSINESS_SIMPLE]: 30,
  [SubscriptionPlan.BUSINESS_PLUS]: 30
};

/**
 * Retorna os recursos disponíveis para cada tipo de plano
 */
export function getAvailablePlans(): PlanFeaturesMap {
  return {
    free: {
      maxAds: 3,
      hasGallery: false,
      maxGalleryImages: 0,
      hasContactInfo: true,
      hasStatistics: false,
      hasPriority: false,
      hasNotifications: true,
      maxNotifications: 5,
      hasFeaturedAds: false,
      maxFeaturedAds: 0
    },
    premium: {
      maxAds: 10,
      hasGallery: true,
      maxGalleryImages: 5,
      hasContactInfo: true,
      hasStatistics: true,
      hasPriority: true,
      hasNotifications: true,
      maxNotifications: 20,
      hasFeaturedAds: true,
      maxFeaturedAds: 1
    },
    business: {
      maxAds: 50,
      hasGallery: true,
      maxGalleryImages: 20,
      hasContactInfo: true,
      hasStatistics: true,
      hasPriority: true,
      hasNotifications: true,
      maxNotifications: 100,
      hasFeaturedAds: true,
      maxFeaturedAds: 5
    }
  };
}

/**
 * Calcula a data de fim do período de trial baseado no plano
 * @param planId ID do plano
 * @returns Data de término do período de trial ou null se não houver trial
 */
export function calculateTrialEndDate(planId: SubscriptionPlan): Date | null {
  const trialDays = planTrialDays[planId];
  
  if (!trialDays) return null;
  
  const today = new Date();
  const trialEndDate = new Date(today);
  trialEndDate.setDate(today.getDate() + trialDays);
  
  return trialEndDate;
}

/**
 * Verifica se o usuário é elegível para o período de trial
 * @param userId ID do usuário
 * @returns Booleano indicando se o usuário é elegível
 */
export async function isEligibleForTrial(userId: string): Promise<boolean> {
  try {
    // Em um ambiente real, você faria uma verificação no banco de dados
    // para ver se o usuário já utilizou o período de trial antes
    
    // Simulação: 80% dos usuários são elegíveis para trial
    return Math.random() > 0.2;
  } catch (error) {
    console.error('Erro ao verificar elegibilidade para trial:', error);
    return false;
  }
}

/**
 * Função para buscar informações de assinatura atualizadas da API
 */
export async function fetchSubscriptionInfo(): Promise<{
  plan: SubscriptionPlan;
  planName: string;
  startDate?: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  status: string;
  paymentStatus?: string;
  paymentHistory?: PaymentHistoryItem[];
  paymentMethods?: Array<{
    id: string;
    brand: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }>;
}> {
  try {
    console.log('Buscando informações de assinatura da API...');
    
    // Obter token e userId do localStorage
    const accessToken = localStorage.getItem('sb-access-token');
    const userId = localStorage.getItem('userId');
    
    console.log('fetchSubscriptionInfo - Token:', accessToken ? 'Presente' : 'Ausente');
    console.log('fetchSubscriptionInfo - UserId:', userId || 'Ausente');
    
    // Configurar cabeçalhos
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Construir query string
    let url = '/api/subscriptions/current';
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include', // Importante para enviar cookies
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar assinatura: ${response.status} ${response.statusText}`);
    }

    const data: SubscriptionApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API retornou erro ao buscar dados de assinatura');
    }
    
    console.log('Dados de assinatura recebidos:', data.subscription);
    
    // Retornar dados formatados
    return {
      plan: data.subscription.plan,
      planName: planDisplayNames[data.subscription.plan] || 'Desconhecido',
      startDate: data.subscription.startDate ? new Date(data.subscription.startDate) : undefined,
      endDate: data.subscription.endDate ? new Date(data.subscription.endDate) : undefined,
      nextBillingDate: data.subscription.nextBillingDate ? new Date(data.subscription.nextBillingDate) : undefined,
      status: data.subscription.status,
      paymentStatus: data.subscription.paymentStatus,
      paymentHistory: data.subscription.paymentHistory,
      paymentMethods: data.subscription.paymentMethods
    };
  } catch (error) {
    console.error('Erro ao buscar dados de assinatura:', error);
    
    // Retornar plano gratuito em caso de erro
    return {
      plan: SubscriptionPlan.FREE,
      planName: planDisplayNames[SubscriptionPlan.FREE],
      status: 'unknown',
      paymentStatus: 'unknown',
      paymentHistory: [],
      paymentMethods: []
    };
  }
}

/**
 * Função para verificar se um plano é um upgrade em relação ao atual
 */
export function isUpgradeFromCurrent(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const planValues = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.MICRO_BUSINESS]: 1,
    [SubscriptionPlan.SMALL_BUSINESS]: 2,
    [SubscriptionPlan.BUSINESS_SIMPLE]: 3,
    [SubscriptionPlan.BUSINESS_PLUS]: 4
  };
  
  return planValues[targetPlan] > planValues[currentPlan];
}

/**
 * Função para verificar se uma string corresponde a um plano válido
 */
export function isValidPlan(plan: string): boolean {
  return Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan);
}

/**
 * Função para converter nome legível do plano em enum SubscriptionPlan
 */
export function planNameToEnum(planName: string): SubscriptionPlan {
  const normalized = planName.toLowerCase().trim().replace(/-|\s/g, '_');
  
  switch (normalized) {
    case 'gratuito':
    case 'free':
      return SubscriptionPlan.FREE;
    case 'micro_empresa':
    case 'microempresa':
    case 'micro_business':
      return SubscriptionPlan.MICRO_BUSINESS;
    case 'pequena_empresa':
    case 'small_business':
      return SubscriptionPlan.SMALL_BUSINESS;
    case 'empresa_simples':
    case 'business_simple':
      return SubscriptionPlan.BUSINESS_SIMPLE;
    case 'empresa_plus':
    case 'business_plus':
      return SubscriptionPlan.BUSINESS_PLUS;
    default:
      return SubscriptionPlan.FREE;
  }
} 