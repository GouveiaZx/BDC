import { SubscriptionPlan } from '../models/types';
import { isDeveloperEmail } from '../lib/adminAuth';

/**
 * Configuração de limites e preços para cada plano de assinatura
 * IMPORTANTE: Estes valores devem estar EXATAMENTE iguais aos prometidos na página de planos
 */
export const SubscriptionLimits = {
  // Plano Gratuito
  [SubscriptionPlan.FREE]: {
    maxAds: 1,  // Máximo de 1 anúncio
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 60, // Período de espera para novo anúncio gratuito (1 anúncio a cada 60 dias)
    extraAdPrice: 24.90, // Preço do anúncio extra para usuários FREE
    featuredPrice: 9.90, // Preço para destacar um anúncio (Destaques Free)
    maxFeatured: 0, // Destaques incluídos no plano (0 para plano gratuito)
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 0, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 0, // Máximo de destaques por dia
  },
  
  // Plano Micro-Empresa
  [SubscriptionPlan.MICRO_BUSINESS]: {
    maxAds: 2, // Máximo de 2 anúncios simultâneos
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra das Empresas
    featuredPrice: 4.90, // Preço para destacar um anúncio adicional (Destaques EXTRAS de empresas)
    maxFeatured: 30, // 1 destaque por dia durante o mês
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 1, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 1, // Máximo de destaques por dia
  },
  
  // Plano Pequena Empresa
  [SubscriptionPlan.SMALL_BUSINESS]: {
    maxAds: 5, // Máximo de 5 anúncios simultâneos
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra das Empresas
    featuredPrice: 4.90, // Preço para destacar um anúncio adicional (Destaques EXTRAS de empresas)
    maxFeatured: 60, // 2 destaques por dia durante o mês
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 2, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 2, // Máximo de destaques por dia
  },
  
  // Plano Empresa Simples
  [SubscriptionPlan.BUSINESS_SIMPLE]: {
    maxAds: 10, // Máximo de 10 anúncios simultâneos
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra das Empresas
    featuredPrice: 4.90, // Preço para destacar um anúncio adicional (Destaques EXTRAS de empresas)
    maxFeatured: 120, // 4 destaques por dia durante o mês
    featuredDurationDays: 1, // Duração do destaque
    maxSimultaneousFeatured: 4, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 4, // Máximo de destaques por dia
  },
  
  // Plano Empresa Plus
  [SubscriptionPlan.BUSINESS_PLUS]: {
    maxAds: 20, // Máximo de 20 anúncios simultâneos
    adDurationDays: 30, // Duração de 30 dias
    waitingPeriodDays: 0, // Sem período de espera
    extraAdPrice: 14.90, // Preço do anúncio extra das Empresas
    featuredPrice: 4.90, // Preço para destacar um anúncio adicional (Destaques EXTRAS de empresas)
    maxFeatured: 240, // 8 destaques por dia durante o mês
    featuredDurationDays: 1, // Duração do destaque  
    maxSimultaneousFeatured: 8, // Máximo de destaques simultâneos
    maxFeaturedPerDay: 8, // Máximo de destaques por dia
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
  
  // Verificar se passou o período de espera (60 dias para plano FREE)
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
  
  // ✅ CORREÇÃO CRÍTICA: Para plano FREE, sempre bloquear destaques gratuitos
  if (planId === SubscriptionPlan.FREE) {
    return false; // Usuários gratuitos não podem criar destaques sem pagar
  }
  
  // Verificar se já atingiu o limite de destaques do plano (para planos pagos)
  if (limits.maxFeatured > 0 && featuredCount >= limits.maxFeatured) {
    return false;
  }
  
  // Verificar se já atingiu o limite diário (para planos pagos)
  if (limits.maxFeaturedPerDay > 0 && dailyFeaturedCount >= limits.maxFeaturedPerDay) {
    return false;
  }
  
  // Verificar se já atingiu o limite de destaques simultâneos (para planos pagos)
  if (limits.maxSimultaneousFeatured > 0 && activeSimultaneousFeatured >= limits.maxSimultaneousFeatured) {
    return false;
  }
  
  return true;
}

/**
 * Verificar se usuário pode criar destaque com validações rigorosas
 * @param userId ID do usuário
 * @param planId ID do plano do usuário  
 * @param supabase Cliente Supabase para consultas
 * @returns {Promise<{canCreate: boolean, reason?: string, price?: number}>}
 */
export async function validateHighlightCreation(
  userId: string, 
  planId: SubscriptionPlan, 
  supabase: any
): Promise<{canCreate: boolean, reason?: string, price?: number}> {
  // Verificar se é conta de desenvolvimento com privilégios especiais
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userData?.email && isDeveloperEmail(userData.email)) {
      return {
        canCreate: true,
        reason: 'Conta de desenvolvimento - acesso ilimitado e gratuito'
      };
    }
  } catch (error) {
    console.error('Erro ao verificar email do desenvolvedor:', error);
  }

  const limits = getSubscriptionLimits(planId);
  
  // 1. Usuários FREE só podem criar mediante pagamento
  if (planId === SubscriptionPlan.FREE) {
    return {
      canCreate: true, // Pode criar, mas deve pagar
      reason: 'Plano gratuito requer pagamento para destaques',
      price: limits.featuredPrice
    };
  }
  
  // 2. Para planos pagos, verificar limites
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // Contar destaques do usuário
    const { data: userHighlights, error } = await supabase
      .from('highlights')
      .select('id, created_at, expires_at')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    if (error) {
      console.error('Erro ao buscar destaques do usuário:', error);
      return { canCreate: false, reason: 'Erro ao verificar limites' };
    }
    
    // Contar por período
    const monthlyCount = userHighlights?.length || 0;
    const dailyCount = userHighlights?.filter(h => 
      new Date(h.created_at) >= startOfDay
    ).length || 0;
    const activeCount = userHighlights?.filter(h => 
      new Date(h.expires_at) > now
    ).length || 0;
    
    // Verificar limite mensal
    if (limits.maxFeatured > 0 && monthlyCount >= limits.maxFeatured) {
      return {
        canCreate: true, // Pode criar pagando
        reason: `Limite mensal atingido (${monthlyCount}/${limits.maxFeatured})`,
        price: limits.featuredPrice
      };
    }
    
    // Verificar limite diário
    if (limits.maxFeaturedPerDay > 0 && dailyCount >= limits.maxFeaturedPerDay) {
      return {
        canCreate: false,
        reason: `Limite diário atingido (${dailyCount}/${limits.maxFeaturedPerDay}). Tente novamente amanhã.`
      };
    }
    
    // Verificar limite simultâneo
    if (limits.maxSimultaneousFeatured > 0 && activeCount >= limits.maxSimultaneousFeatured) {
      return {
        canCreate: false,
        reason: `Limite de destaques simultâneos atingido (${activeCount}/${limits.maxSimultaneousFeatured})`
      };
    }
    
    // Verificar se ainda tem destaques gratuitos disponíveis
    const freeRemaining = limits.maxFeatured - monthlyCount;
    if (freeRemaining > 0) {
      return { canCreate: true }; // Gratuito no plano
    } else {
      return {
        canCreate: true, // Pode criar pagando
        reason: 'Destaques do plano esgotados',
        price: limits.featuredPrice
      };
    }
    
  } catch (error) {
    console.error('Erro na validação de destaques:', error);
    return { canCreate: false, reason: 'Erro interno na validação' };
  }
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
 * @returns {boolean} true se é plano gratuito com limitação de 1 anúncio a cada 60 dias
 */
export function hasFreeAdLimitation(planId: SubscriptionPlan): boolean {
  return planId === SubscriptionPlan.FREE;
} 