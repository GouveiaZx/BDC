import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { getAvailablePlans } from '../../../lib/subscriptionHelper';
import { convertTempIdToUUID } from '../../../lib/utils';
import { authenticateRequest, logAuthAttempt } from '../../../lib/authHelper';
import { cookies } from 'next/headers';

const supabaseAdmin = getSupabaseAdminClient();

// Usar renderização dinâmica para acessar Headers
export const dynamic = 'force-dynamic';

// GET - Obter assinatura atual do usuário
export async function GET(req: NextRequest) {
  try {
    console.log('[API:subscriptions] Iniciando busca de informações de assinatura');
    
    // Usar o helper de autenticação melhorado
    const authResult = await authenticateRequest(req);
    logAuthAttempt(req, authResult);
    
    if (!authResult.success || !authResult.user_id) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error || 'Falha na autenticação'
      }, { status: 401 });
    }
    
    const user_id = authResult.user_id;
    
    // Buscar detalhes da assinatura no Supabase
    console.log('[API:subscriptions] Buscando assinatura para o usuário:', user_id);
    
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plans!inner(
          id,
          name,
          plan_type,
          price_monthly,
          price_yearly,
          features
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (subscriptionError) {
      console.error('[API:subscriptions] Erro ao buscar assinatura:', subscriptionError);
      // Não retornar erro para o cliente, apenas mostrar assinatura gratuita
    }
    
    // Se não encontrou assinatura ativa, retorna plano gratuito
    if (!subscription) {
      console.log('[API:subscriptions] Nenhuma assinatura encontrada, retornando plano gratuito');
      return NextResponse.json({
        success: true,
        subscription: {
          plan: 'free',
          planName: 'Gratuito',
          startDate: new Date().toISOString(),
          endDate: null,
          nextBillingDate: null,
          status: 'active',
          features: getAvailablePlans().free
        }
      });
    }
    
    // Converter dados da tabela para o formato esperado pelo frontend
    const planType = subscription.plans?.plan_type || 'free';
    const planName = subscription.plans?.name || 'Gratuito';
    
    // Mapear plan_type para SubscriptionPlan enum
    let mappedPlan = 'free';
    switch (planType) {
      case 'micro_business':
        mappedPlan = 'micro_business';
        break;
      case 'small_business':
        mappedPlan = 'small_business';
        break;
      case 'business_simple':
        mappedPlan = 'business_simple';
        break;
      case 'business_plus':
        mappedPlan = 'business_plus';
        break;
      default:
        mappedPlan = 'free';
    }
    
    console.log('[API:subscriptions] Plano encontrado:', {
      planType,
      planName,
      mappedPlan,
      subscriptionId: subscription.id
    });
    
    const responseData = {
      plan: mappedPlan,
      planName: planName,
      startDate: subscription.start_date || subscription.created_at || new Date().toISOString(),
      endDate: subscription.end_date || null,
      nextBillingDate: subscription.next_billing_date || null,
      status: subscription.status || 'active',
      features: getAvailablePlans()[mappedPlan] || getAvailablePlans().free
    };
    
    return NextResponse.json({
      success: true,
      subscription: responseData
    });
  } catch (error) {
    console.error('[API:subscriptions] Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar requisição',
      subscription: {
        plan: 'free',
        planName: 'Gratuito',
        startDate: new Date().toISOString(),
        endDate: null,
        nextBillingDate: null,
        status: 'active',
        features: getAvailablePlans().free
      }
    });
  }
} 