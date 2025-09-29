import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  validateHighlightCreation, 
  getUserPlanLimits, 
  getUserHighlightsToday,
  getUserSubscriptionData,
  validatePlanChange,
  isSpecialUser
} from '../../../lib/planLimits';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const dynamic = 'force-dynamic';

/**
 * Verificar se a requisição tem autenticação válida
 */
function verifyAuth(request: NextRequest): string | null {
  // Verificar cookie de admin
  const adminAuth = request.cookies.get('admin-auth')?.value;
  if (adminAuth === 'true') {
    return 'admin';
  }
  
  // Verificar header de autorização do usuário
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remover "Bearer "
  }
  
  return null;
}

/**
 * GET - Validar se usuário pode criar destaque
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'userId é obrigatório'
      }, { status: 400 });
    }
    // ✅ VERIFICAÇÃO ESPECIAL: Primeiro verificar se é usuário especial
    const specialUserCheck = await isSpecialUser(userId);
    if (specialUserCheck.isSpecial) {
      const userSubscriptionData = await getUserSubscriptionData(userId);
      
      return NextResponse.json({
        success: true,
        message: `Usuário ${specialUserCheck.isTest ? 'de teste' : 'administrador'} com destaques ilimitados`,
        validation: {
          canCreate: true,
          price: 0,
          reason: `Conta ${specialUserCheck.isTest ? 'de teste' : 'administrativa'} com destaques gratuitos ilimitados`
        },
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
        currentUsage: {
          active_ads: 0,
          highlights_today: await getUserHighlightsToday(userId)
        },
        userSubscription: userSubscriptionData,
        specialUser: specialUserCheck
      });
    }
    
    // Validação normal para usuários regulares
    const validation = await validateHighlightCreation(userId);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.message,
        limits: validation.limits,
        currentUsage: validation.current_usage
      });
    }
    
    // Buscar dados adicionais do usuário e plano
    const userSubscriptionData = await getUserSubscriptionData(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Usuário pode criar destaque',
      validation: {
        canCreate: true,
        price: 0
      },
      limits: validation.limits,
      currentUsage: validation.current_usage,
      userSubscription: userSubscriptionData
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno na validação'
    }, { status: 500 });
  }
}

/**
 * POST - Validar benefícios após mudança de plano
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }
    
    const { userId, newPlanId, previousPlanId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'userId é obrigatório'
      }, { status: 400 });
    }
    
    // Se newPlanId não foi fornecido, apenas validar o plano atual
    if (!newPlanId) {
      const validation = await validateHighlightCreation(userId);
      const userSubscriptionData = await getUserSubscriptionData(userId);
      
      return NextResponse.json({
        success: true,
        message: 'Validação do plano atual concluída',
        currentValidation: validation,
        userSubscription: userSubscriptionData
      });
    }
    // Buscar dados dos planos
    const [newPlan, previousPlan] = await Promise.all([
      supabase.from('plans').select('*').eq('id', newPlanId).single(),
      previousPlanId ? supabase.from('plans').select('*').eq('id', previousPlanId).single() : { data: null, error: null }
    ]);
    
    if (newPlan.error || !newPlan.data) {
      return NextResponse.json({
        success: false,
        message: 'Novo plano não encontrado'
      }, { status: 400 });
    }
    
    // Validar se a mudança de plano é possível
    const planChangeValidation = await validatePlanChange(userId, newPlanId);
    
    if (!planChangeValidation.success) {
      return NextResponse.json({
        success: false,
        message: planChangeValidation.message
      }, { status: 400 });
    }
    
    // Obter limitações atuais do usuário
    const currentLimits = await getUserPlanLimits(userId);
    const highlightsToday = await getUserHighlightsToday(userId);
    
    // Analisar mudanças nos benefícios
    const benefits: string[] = [];
    const limitations: string[] = [];
    const warnings: string[] = [];
    
    const newPlanData = newPlan.data;
    const prevPlanData = previousPlan.data;
    
    // Comparar limites de destaques
    if (prevPlanData) {
      if (newPlanData.max_highlights_per_day > prevPlanData.max_highlights_per_day) {
        benefits.push(`Aumento de destaques por dia: ${prevPlanData.max_highlights_per_day} → ${newPlanData.max_highlights_per_day}`);
      } else if (newPlanData.max_highlights_per_day < prevPlanData.max_highlights_per_day) {
        limitations.push(`Redução de destaques por dia: ${prevPlanData.max_highlights_per_day} → ${newPlanData.max_highlights_per_day}`);
        
        if (highlightsToday > newPlanData.max_highlights_per_day) {
          warnings.push(`Usuário já criou ${highlightsToday} destaques hoje, excedendo o novo limite de ${newPlanData.max_highlights_per_day}`);
        }
      }
      
      // Comparar limites de anúncios
      if (newPlanData.max_ads > prevPlanData.max_ads) {
        benefits.push(`Aumento de anúncios simultâneos: ${prevPlanData.max_ads} → ${newPlanData.max_ads}`);
      } else if (newPlanData.max_ads < prevPlanData.max_ads) {
        limitations.push(`Redução de anúncios simultâneos: ${prevPlanData.max_ads} → ${newPlanData.max_ads}`);
      }
      
      // Comparar duração dos anúncios
      if (newPlanData.ad_duration_days > prevPlanData.ad_duration_days) {
        benefits.push(`Aumento na duração dos anúncios: ${prevPlanData.ad_duration_days} → ${newPlanData.ad_duration_days} dias`);
      } else if (newPlanData.ad_duration_days < prevPlanData.ad_duration_days) {
        limitations.push(`Redução na duração dos anúncios: ${prevPlanData.ad_duration_days} → ${newPlanData.ad_duration_days} dias`);
      }
      
      // Comparar recursos premium
      if (newPlanData.has_premium_features && !prevPlanData.has_premium_features) {
        benefits.push('Acesso a recursos premium ativado');
      } else if (!newPlanData.has_premium_features && prevPlanData.has_premium_features) {
        limitations.push('Recursos premium removidos');
      }
    } else {
      // Primeiro plano do usuário
      benefits.push(`Ativação do plano ${newPlanData.name}`);
      benefits.push(`${newPlanData.max_ads} anúncios simultâneos permitidos`);
      if (newPlanData.max_highlights_per_day > 0) {
        benefits.push(`${newPlanData.max_highlights_per_day} destaques por dia incluídos`);
      }
    }
    
    // Calcular destaques restantes hoje
    const remainingHighlightsToday = Math.max(0, newPlanData.max_highlights_per_day - highlightsToday);
    
    return NextResponse.json({
      success: true,
      message: 'Análise de benefícios concluída',
      planValidation: planChangeValidation,
      planComparison: {
        previousPlan: prevPlanData,
        newPlan: newPlanData,
        benefits,
        limitations,
        warnings
      },
      currentStatus: {
        highlightsUsedToday: highlightsToday,
        highlightsRemainingToday: remainingHighlightsToday,
        canCreateHighlight: remainingHighlightsToday > 0 || newPlanData.max_highlights_per_day === 0,
        limits: currentLimits
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno na análise de benefícios'
    }, { status: 500 });
  }
}