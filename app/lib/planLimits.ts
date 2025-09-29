import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Emails com permissões especiais para testes
const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'gouveiarx@gmail.com',
  'gouveiarx@hotmail.com',
  'rodrigogouveiarx@gmail.com'
];

const TEST_EMAILS = [
  'eduardogelista@gmail.com'
];

const SPECIAL_EMAILS = [...ADMIN_EMAILS, ...TEST_EMAILS];

/**
 * Verifica se um usuário tem permissões especiais baseado no email
 */
export async function isSpecialUser(userId: string): Promise<{ isSpecial: boolean; isAdmin: boolean; isTest: boolean; email?: string }> {
  try {
    // Buscar o email do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      return { isSpecial: false, isAdmin: false, isTest: false };
    }

    const email = user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email);
    const isTest = TEST_EMAILS.some(testEmail => testEmail.toLowerCase() === email);
    const isSpecial = isAdmin || isTest;

    return {
      isSpecial,
      isAdmin,
      isTest,
      email: user.email
    };
  } catch (error) {
    console.error('[PlanLimits] Erro ao verificar usuário especial:', error);
    return { isSpecial: false, isAdmin: false, isTest: false };
  }
}

export interface PlanLimits {
  max_ads: number;
  max_highlights_per_day: number;
  ad_duration_days: number;
  max_photos_per_ad: number;
  has_premium_features: boolean;
  statistics_level: string;
  support_type: string;
  has_search_highlight: boolean;
}

export interface PlanValidationResult {
  success: boolean;
  message?: string;
  limits?: PlanLimits;
  current_usage?: {
    active_ads: number;
    highlights_today: number;
  };
}

/**
 * Busca os limites do plano atual do usuário
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits | null> {
  try {
    console.log(`[PlanLimits] Buscando limites do plano para usuário: ${userId}`);
    
    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        status,
        plans!inner(
          max_ads,
          max_highlights_per_day,
          ad_duration_days,
          max_photos_per_ad,
          has_premium_features,
          statistics_level,
          support_type,
          has_search_highlight
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.log(`[PlanLimits] Usuário sem assinatura ativa, usando plano Free`);
      
      // Se não tem assinatura ativa, usar plano gratuito
      const { data: freePlan, error: freePlanError } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', 'free')
        .single();

      if (freePlanError || !freePlan) {
        console.error('[PlanLimits] Erro ao buscar plano gratuito:', freePlanError);
        return null;
      }

      return {
        max_ads: freePlan.max_ads,
        max_highlights_per_day: freePlan.max_highlights_per_day,
        ad_duration_days: freePlan.ad_duration_days,
        max_photos_per_ad: freePlan.max_photos_per_ad,
        has_premium_features: freePlan.has_premium_features,
        statistics_level: freePlan.statistics_level || 'basic',
        support_type: freePlan.support_type || 'email',
        has_search_highlight: freePlan.has_search_highlight || false
      };
    }

    const plan = subscription.plans as any;
    return {
      max_ads: plan.max_ads,
      max_highlights_per_day: plan.max_highlights_per_day,
      ad_duration_days: plan.ad_duration_days,
      max_photos_per_ad: plan.max_photos_per_ad,
      has_premium_features: plan.has_premium_features,
      statistics_level: plan.statistics_level || 'basic',
      support_type: plan.support_type || 'email',
      has_search_highlight: plan.has_search_highlight || false
    };

  } catch (error) {
    console.error('[PlanLimits] Erro ao buscar limites do plano:', error);
    return null;
  }
}

/**
 * Conta anúncios ativos do usuário
 */
export async function getUserActiveAdsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('[PlanLimits] Erro ao contar anúncios ativos:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[PlanLimits] Erro ao contar anúncios ativos:', error);
    return 0;
  }
}

/**
 * Conta destaques usados hoje pelo usuário
 */
export async function getUserHighlightsToday(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { count, error } = await supabase
      .from('highlights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) {
      console.error('[PlanLimits] Erro ao contar destaques hoje:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[PlanLimits] Erro ao contar destaques hoje:', error);
    return 0;
  }
}

/**
 * Valida se o usuário pode criar um novo anúncio
 */
export async function validateAdCreation(userId: string): Promise<PlanValidationResult> {
  try {
    const limits = await getUserPlanLimits(userId);
    if (!limits) {
      return {
        success: false,
        message: 'Erro ao verificar limites do plano'
      };
    }

    const activeAds = await getUserActiveAdsCount(userId);
    
    if (activeAds >= limits.max_ads) {
      return {
        success: false,
        message: `Você atingiu o limite de ${limits.max_ads} anúncios ativos do seu plano. Exclua ou aguarde a expiração de um anúncio para criar um novo.`,
        limits,
        current_usage: {
          active_ads: activeAds,
          highlights_today: await getUserHighlightsToday(userId)
        }
      };
    }

    return {
      success: true,
      limits,
      current_usage: {
        active_ads: activeAds,
        highlights_today: await getUserHighlightsToday(userId)
      }
    };

  } catch (error) {
    console.error('[PlanLimits] Erro na validação de criação de anúncio:', error);
    return {
      success: false,
      message: 'Erro interno ao validar criação de anúncio'
    };
  }
}

/**
 * Valida se o usuário pode criar um novo destaque
 */
export async function validateHighlightCreation(userId: string): Promise<PlanValidationResult> {
  try {
    console.log(`[PlanLimits] Validando criação de destaque para usuário: ${userId}`);
    
    // ✅ VERIFICAÇÃO ESPECIAL: Usuários especiais têm bypass completo
    const specialUserCheck = await isSpecialUser(userId);
    if (specialUserCheck.isSpecial) {
      console.log(`[PlanLimits] ✅ Usuário especial detectado: ${specialUserCheck.email} (Admin: ${specialUserCheck.isAdmin}, Test: ${specialUserCheck.isTest})`);
      
      const currentUsage = {
        active_ads: await getUserActiveAdsCount(userId),
        highlights_today: await getUserHighlightsToday(userId)
      };
      
      return {
        success: true,
        message: `Usuário ${specialUserCheck.isTest ? 'de teste' : 'administrador'} com destaques ilimitados`,
        limits: {
          max_ads: 999,
          max_highlights_per_day: 999,
          ad_duration_days: 365,
          max_photos_per_ad: 50,
          has_premium_features: true,
          statistics_level: 'advanced',
          support_type: 'priority',
          has_search_highlight: true
        },
        current_usage: currentUsage
      };
    }

    const limits = await getUserPlanLimits(userId);
    if (!limits) {
      return {
        success: false,
        message: 'Erro ao verificar limites do plano'
      };
    }

    if (limits.max_highlights_per_day === 0) {
      return {
        success: false,
        message: 'Seu plano não permite criar destaques. Faça upgrade para um plano superior.',
        limits
      };
    }

    const highlightsToday = await getUserHighlightsToday(userId);
    
    if (highlightsToday >= limits.max_highlights_per_day) {
      return {
        success: false,
        message: `Você atingiu o limite de ${limits.max_highlights_per_day} destaques por dia do seu plano. Tente novamente amanhã.`,
        limits,
        current_usage: {
          active_ads: await getUserActiveAdsCount(userId),
          highlights_today: highlightsToday
        }
      };
    }

    return {
      success: true,
      limits,
      current_usage: {
        active_ads: await getUserActiveAdsCount(userId),
        highlights_today: highlightsToday
      }
    };

  } catch (error) {
    console.error('[PlanLimits] Erro na validação de criação de destaque:', error);
    return {
      success: false,
      message: 'Erro interno ao validar criação de destaque'
    };
  }
}

/**
 * Calcula a data de expiração para um anúncio baseado no plano
 */
export function calculateAdExpirationDate(limits: PlanLimits): Date | null {
  if (limits.ad_duration_days === -1) {
    // Duração ilimitada
    return null;
  }
  
  const now = new Date();
  const expirationDate = new Date(now.getTime() + (limits.ad_duration_days * 24 * 60 * 60 * 1000));
  return expirationDate;
}

/**
 * Retorna resumo de uso do plano do usuário
 */
export async function getUserPlanUsage(userId: string) {
  try {
    const limits = await getUserPlanLimits(userId);
    if (!limits) {
      return null;
    }

    const [activeAds, highlightsToday] = await Promise.all([
      getUserActiveAdsCount(userId),
      getUserHighlightsToday(userId)
    ]);

    return {
      limits,
      current_usage: {
        active_ads: activeAds,
        highlights_today: highlightsToday
      },
      usage_percentage: {
        ads: Math.round((activeAds / limits.max_ads) * 100),
        highlights: limits.max_highlights_per_day > 0 
          ? Math.round((highlightsToday / limits.max_highlights_per_day) * 100) 
          : 0
      }
    };

  } catch (error) {
    console.error('[PlanLimits] Erro ao obter resumo de uso:', error);
    return null;
  }
}

/**
 * Valida se um usuário pode mudar para um novo plano
 */
export async function validatePlanChange(
  userId: string, 
  newPlanId: string
): Promise<PlanValidationResult> {
  try {
    console.log(`[PlanLimits] Validando mudança de plano: usuário ${userId} para plano ${newPlanId}`);
    
    // Buscar o novo plano (primeiro por slug, depois por ID)
    let { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', newPlanId)
      .single();

    // Se não encontrou por slug, tentar por ID
    if (planError || !newPlan) {
      const { data: planById, error: planByIdError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', newPlanId)
        .single();
      
      newPlan = planById;
      planError = planByIdError;
    }

    if (planError || !newPlan) {
      return {
        success: false,
        message: 'Plano de destino não encontrado'
      };
    }

    // Buscar assinatura atual do usuário (se existir)
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        status,
        plans!inner(
          name,
          slug,
          max_ads,
          max_highlights_per_day
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const currentUsage = await getUserPlanUsage(userId);
    
    // Se não tem assinatura atual, permitir mudança
    if (subError || !currentSubscription) {
      return {
        success: true,
        message: `Usuário sem assinatura ativa pode migrar para o plano ${newPlan.name}`,
        limits: {
          max_ads: newPlan.max_ads,
          max_highlights_per_day: newPlan.max_highlights_per_day,
          ad_duration_days: newPlan.ad_duration_days,
          max_photos_per_ad: newPlan.max_photos_per_ad,
          has_premium_features: newPlan.has_premium_features,
          statistics_level: newPlan.statistics_level || 'basic',
          support_type: newPlan.support_type || 'email',
          has_search_highlight: newPlan.has_search_highlight || false
        },
        current_usage: currentUsage?.current_usage
      };
    }

    const currentPlan = currentSubscription.plans as any;
    
    // Verificar se o novo plano pode acomodar o uso atual
    const warnings: string[] = [];
    
    if (currentUsage?.current_usage.active_ads > newPlan.max_ads) {
      warnings.push(
        `Usuário possui ${currentUsage.current_usage.active_ads} anúncios ativos, ` +
        `mas o novo plano permite apenas ${newPlan.max_ads}. ` +
        `Os anúncios excedentes continuarão ativos até expirarem.`
      );
    }
    
    if (newPlan.max_highlights_per_day < currentPlan.max_highlights_per_day) {
      warnings.push(
        `O novo plano reduz o limite de destaques diários de ${currentPlan.max_highlights_per_day} ` +
        `para ${newPlan.max_highlights_per_day}.`
      );
    }

    return {
      success: true,
      message: warnings.length > 0 
        ? `Mudança possível com avisos: ${warnings.join(' ')}`
        : `Mudança de plano aprovada: ${currentPlan.name} → ${newPlan.name}`,
      limits: {
        max_ads: newPlan.max_ads,
        max_highlights_per_day: newPlan.max_highlights_per_day,
        ad_duration_days: newPlan.ad_duration_days,
        max_photos_per_ad: newPlan.max_photos_per_ad,
        has_premium_features: newPlan.has_premium_features,
        statistics_level: newPlan.statistics_level || 'basic',
        support_type: newPlan.support_type || 'email',
        has_search_highlight: newPlan.has_search_highlight || false
      },
      current_usage: currentUsage?.current_usage
    };

  } catch (error) {
    console.error('[PlanLimits] Erro na validação de mudança de plano:', error);
    return {
      success: false,
      message: 'Erro interno ao validar mudança de plano'
    };
  }
}

/**
 * Busca dados completos do usuário incluindo sua assinatura
 */
export async function getUserSubscriptionData(userId: string) {
  try {
    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, user_type')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return null;
    }

    // Buscar assinatura ativa
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        starts_at,
        ends_at,
        payment_method,
        plans!inner(
          id,
          name,
          slug,
          price_monthly,
          max_ads,
          max_highlights_per_day,
          ad_duration_days,
          max_photos_per_ad,
          has_premium_features,
          statistics_level,
          support_type,
          has_search_highlight
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return {
      user,
      subscription: subError ? null : subscription,
      hasActiveSubscription: !subError && !!subscription
    };

  } catch (error) {
    console.error('[PlanLimits] Erro ao buscar dados de assinatura do usuário:', error);
    return null;
  }
}

/**
 * Aplicar limitações do novo plano após mudança
 */
export async function applyNewPlanLimits(
  userId: string, 
  newPlanId: string
): Promise<{ success: boolean; message: string; appliedChanges?: string[] }> {
  try {
    console.log(`[PlanLimits] Aplicando limitações do novo plano ${newPlanId} para usuário ${userId}`);
    
    const appliedChanges: string[] = [];
    
    // Buscar o novo plano
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', newPlanId)
      .single();

    if (planError || !newPlan) {
      return {
        success: false,
        message: 'Novo plano não encontrado'
      };
    }

    // 1. Verificar e registrar mudanças nos anúncios ativos
    const activeAdsCount = await getUserActiveAdsCount(userId);
    if (activeAdsCount > newPlan.max_ads) {
      appliedChanges.push(
        `${activeAdsCount} anúncios ativos excedem o limite de ${newPlan.max_ads}. ` +
        `Os anúncios excedentes permanecerão ativos até expirarem.`
      );
    } else {
      appliedChanges.push(
        `${activeAdsCount} anúncios ativos dentro do novo limite de ${newPlan.max_ads}.`
      );
    }

    // 2. Verificar destaques do dia
    const highlightsToday = await getUserHighlightsToday(userId);
    if (newPlan.max_highlights_per_day === 0) {
      appliedChanges.push('Plano não permite criação de novos destaques.');
    } else if (highlightsToday >= newPlan.max_highlights_per_day) {
      appliedChanges.push(
        `${highlightsToday} destaques criados hoje atingem o limite diário de ${newPlan.max_highlights_per_day}.`
      );
    } else {
      const remaining = newPlan.max_highlights_per_day - highlightsToday;
      appliedChanges.push(`${remaining} destaques restantes hoje.`);
    }

    // 3. Atualizar tabela de usuários com o novo plano (se possível)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_plan: newPlan.slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (!updateError) {
        appliedChanges.push(`Dados do usuário atualizados com o plano ${newPlan.name}.`);
      }
    } catch (updateError) {
      console.log('[PlanLimits] Aviso: Não foi possível atualizar tabela users:', updateError);
    }

    // 4. Registrar limitações específicas aplicadas
    appliedChanges.push(`Novo limite de anúncios simultâneos: ${newPlan.max_ads}`);
    appliedChanges.push(`Novo limite de destaques por dia: ${newPlan.max_highlights_per_day}`);
    appliedChanges.push(`Duração dos anúncios: ${newPlan.ad_duration_days} dias`);
    appliedChanges.push(`Máximo de fotos por anúncio: ${newPlan.max_photos_per_ad}`);

    return {
      success: true,
      message: `Limitações do plano ${newPlan.name} aplicadas com sucesso`,
      appliedChanges
    };

  } catch (error) {
    console.error('[PlanLimits] Erro ao aplicar limitações do novo plano:', error);
    return {
      success: false,
      message: 'Erro interno ao aplicar limitações do novo plano'
    };
  }
}