import { SubscriptionPlan } from '../models/types';

/**
 * Configuração de limites e preços para cada plano de assinatura
 * IMPORTANTE: Estes valores devem estar EXATAMENTE iguais aos prometidos na página de planos
 */
export const SubscriptionLimits = {
  // Plano Gratuito
  [SubscriptionPlan.FREE]: {
    maxAds: 3,  // Máximo de 3 anúncios (consistente com página de planos)
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 90, // Período de espera para novo anúncio gratuito (1 anúncio a cada 90 dias conforme dashboard)
    extraAdPrice: 24.90, // Preço do anúncio extra (consistente com página de planos)
    featuredPrice: 24.90, // Preço para destacar um anúncio (R$ 24,90 conforme página de planos)
    maxFeatured: 0, // Destaques incluídos no plano (0 para plano gratuito)
    featuredDurationDays: 3, // Duração do destaque
    maxSimultaneousFeatured: 0, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 0, // Máximo de destaques por dia
  },
  
  // Plano Microempresa
  [SubscriptionPlan.MICRO_BUSINESS]: {
    maxAds: 4, // Máximo de 4 anúncios simultâneos (consistente com página de planos)
    adDurationDays: 60, // Duração de 60 dias (consistente com página de planos)
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra
    featuredPrice: 9.90, // Preço para destacar um anúncio adicional (R$ 9,90 conforme página de planos)
    maxFeatured: 0, // Sem destaques incluídos (consistente com página de planos)
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 0, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 0, // Máximo de destaques por dia
  },
  
  // Plano Pequena Empresa
  [SubscriptionPlan.SMALL_BUSINESS]: {
    maxAds: 5, // Máximo de 5 anúncios simultâneos (consistente com página de planos)
    adDurationDays: 90, // Duração de 90 dias (consistente com página de planos)
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra
    featuredPrice: 9.90, // Preço para destacar um anúncio adicional (R$ 9,90 conforme página de planos)
    maxFeatured: 30, // 1 destaque por dia durante o mês (consistente com página de planos)
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 1, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 1, // Máximo de destaques por dia
  },
  
  // Plano Empresa Simples
  [SubscriptionPlan.BUSINESS_SIMPLE]: {
    maxAds: 10, // Máximo de 10 anúncios simultâneos (consistente com página de planos)
    adDurationDays: -1, // Duração ilimitada (consistente com página de planos)
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra
    featuredPrice: 9.90, // Preço para destacar um anúncio adicional (R$ 9,90 conforme página de planos)
    maxFeatured: 60, // 2 destaques por dia durante o mês (consistente com página de planos)
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 2, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 2, // Máximo de destaques por dia
  },
  
  // Plano Empresa Plus
  [SubscriptionPlan.BUSINESS_PLUS]: {
    maxAds: 20, // Máximo de 20 anúncios simultâneos (consistente com página de planos)
    adDurationDays: -1, // Duração ilimitada (consistente com página de planos)
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra
    featuredPrice: 9.90, // Preço para destacar um anúncio adicional (R$ 9,90 conforme página de planos)
    maxFeatured: 90, // 3 destaques por dia durante o mês (consistente com página de planos)
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 3, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 3, // Máximo de destaques por dia
  }
};

/**
 * Função para obter os limites de um plano específico
 * @param planId ID do plano
 * @returns Configuração de limites para o plano, ou do plano gratuito como fallback
 */
export function getSubscriptionLimits(planId: SubscriptionPlan) {
  return SubscriptionLimits[planId as keyof typeof SubscriptionLimits] || SubscriptionLimits[SubscriptionPlan.FREE];
}

/**
 * Verificar se um usuário pode publicar um novo anúncio gratuito
 * @param lastAdDate Data do último anúncio publicado
 * @param activeAdsCount Quantidade de anúncios ativos
 * @param planId ID do plano do usuário
 * @returns {boolean} true se pode publicar, false caso contrário
 */
export function canPublishFreeAd(lastAdDate: Date | null, activeAdsCount: number, planId: SubscriptionPlan): boolean {
  const limits = getSubscriptionLimits(planId);
  
  // Se o usuário tem um plano pago, verificar apenas se está dentro do limite
  if (planId !== SubscriptionPlan.FREE) {
    return activeAdsCount < limits.maxAds;
  }
  
  // Para usuários do plano gratuito, verificar período de espera
  if (activeAdsCount >= limits.maxAds) {
    return false;
  }
  
  // Se não tem anúncios anteriores, pode publicar
  if (!lastAdDate) {
    return true;
  }
  
  // Verificar se passou o período de espera
  const waitingPeriodMs = limits.waitingPeriodDays * 24 * 60 * 60 * 1000;
  const timeSinceLastAd = Date.now() - lastAdDate.getTime();
  
  return timeSinceLastAd >= waitingPeriodMs;
}

/**
 * Verificar se um usuário pode destacar um anúncio
 * @param featuredCount Quantidade de destaques já utilizados no período
 * @param dailyFeaturedCount Quantidade de destaques utilizados no dia
 * @param activeSimultaneousFeatured Quantidade de destaques ativos simultaneamente
 * @param planId ID do plano do usuário
 * @returns {boolean} true se pode destacar, false caso contrário
 */
export function canFeatureAd(
  featuredCount: number, 
  dailyFeaturedCount: number, 
  activeSimultaneousFeatured: number, 
  planId: SubscriptionPlan
): boolean {
  const limits = getSubscriptionLimits(planId);
  
  // Verificar se já atingiu o limite de destaques do plano
  if (featuredCount >= limits.maxFeatured && limits.maxFeatured > 0) {
    return false;
  }
  
  // Verificar se já atingiu o limite diário
  if (dailyFeaturedCount >= limits.maxFeaturedPerDay && limits.maxFeaturedPerDay > 0) {
    return false;
  }
  
  // Verificar se já atingiu o limite de destaques simultâneos
  if (activeSimultaneousFeatured >= limits.maxSimultaneousFeatured && limits.maxSimultaneousFeatured > 0) {
    return false;
  }
  
  return true;
}

/**
 * Calcular o preço de destacar um anúncio
 * @param featuredCount Quantidade de destaques já utilizados no período
 * @param planId ID do plano do usuário
 * @returns {number} Preço do destaque ou 0 se estiver incluído no plano
 */
export function calculateFeaturePrice(featuredCount: number, planId: SubscriptionPlan): number {
  const limits = getSubscriptionLimits(planId);
  
  // Se ainda tem destaques disponíveis no plano
  if (featuredCount < limits.maxFeatured && limits.maxFeatured > 0) {
    return 0; // Gratuito, incluído no plano
  }
  
  // Retorna o preço do destaque adicional
  return limits.featuredPrice;
}

/**
 * Calcular o preço de um anúncio adicional
 * @param activeAdsCount Quantidade de anúncios ativos
 * @param planId ID do plano do usuário
 * @returns {number} Preço do anúncio adicional ou 0 se estiver incluído no plano
 */
export function calculateExtraAdPrice(activeAdsCount: number, planId: SubscriptionPlan): number {
  const limits = getSubscriptionLimits(planId);
  
  // Se ainda tem anúncios disponíveis no plano
  if (activeAdsCount < limits.maxAds) {
    return 0; // Gratuito, incluído no plano
  }
  
  // Retorna o preço do anúncio adicional
  return limits.extraAdPrice;
}

/**
 * Calcular a data de expiração de um anúncio com base no plano
 * @param planId ID do plano do usuário
 * @returns {Date} Data de expiração ou null para duração ilimitada
 */
export function calculateAdExpirationDate(planId: SubscriptionPlan): Date | null {
  const limits = getSubscriptionLimits(planId);
  
  if (limits.adDurationDays === -1) {
    // Duração ilimitada para planos Business
    return new Date('2099-12-31');
  } else if (limits.adDurationDays > 0) {
    // Duração específica em dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + limits.adDurationDays);
    return expiresAt;
  }
  
  // Fallback: 30 dias
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 30);
  return fallbackDate;
}

/**
 * Verificar se um plano tem limitação especial do plano gratuito
 * @param planId ID do plano do usuário
 * @returns {boolean} true se é plano gratuito com limitação de 1 anúncio a cada 90 dias
 */
export function hasFreeAdLimitation(planId: SubscriptionPlan): boolean {
  return planId === SubscriptionPlan.FREE;
} 