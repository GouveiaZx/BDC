import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const includeFeatures = searchParams.get('include_features') === 'true';
    const onlyActive = searchParams.get('only_active') !== 'false'; // default true
    
    let query = supabase
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data: plans, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar planos' },
        { status: 500 }
      );
    }

    // Adicionar features detalhadas se solicitado
    const plansWithDetails = plans.map(plan => {
      const baseFeatures = {
        max_ads: plan.max_ads,
        max_highlights_per_day: plan.max_highlights_per_day,
        ad_duration_days: plan.ad_duration_days,
        max_photos_per_ad: plan.max_photos_per_ad,
        has_premium_features: plan.has_premium_features,
        max_business_categories: plan.max_business_categories,
        is_featured: plan.is_featured
      };

      let detailedFeatures = {};
      
      if (includeFeatures) {
        detailedFeatures = {
          features_list: [
            `${plan.max_ads} anúncio${plan.max_ads > 1 ? 's' : ''} simultâneo${plan.max_ads > 1 ? 's' : ''}`,
            `Válido por ${plan.ad_duration_days} dias`,
            `Até ${plan.max_photos_per_ad} fotos por anúncio`,
            ...(plan.max_highlights_per_day > 0 ? [`${plan.max_highlights_per_day} destaque${plan.max_highlights_per_day > 1 ? 's' : ''} por dia`] : []),
            ...(plan.has_premium_features ? ['Recursos premium', 'Anúncios em destaque'] : []),
            ...(plan.max_business_categories > 0 ? [`Até ${plan.max_business_categories} categoria${plan.max_business_categories > 1 ? 's' : ''} de negócio`] : []),
            ...(plan.is_featured ? ['Selo de empresa verificada'] : [])
          ],
          monthly_savings: plan.price_yearly > 0 ? 
            Math.round(((plan.price_monthly * 12) - plan.price_yearly) * 100) / 100 : 0,
          yearly_discount_percentage: plan.price_yearly > 0 && plan.price_monthly > 0 ?
            Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100) : 0
        };
      }

      return {
        ...plan,
        ...baseFeatures,
        ...detailedFeatures
      };
    });

    // Separar plano gratuito dos pagos
    const freePlan = plansWithDetails.find(plan => plan.price_monthly === 0);
    const paidPlans = plansWithDetails.filter(plan => plan.price_monthly > 0);

    return NextResponse.json({
      success: true,
      plans: plansWithDetails,
      free_plan: freePlan,
      paid_plans: paidPlans,
      total: plans.length,
      currency: 'BRL'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 