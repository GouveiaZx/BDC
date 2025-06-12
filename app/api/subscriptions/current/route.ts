import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { getAvailablePlans } from '../../../lib/subscriptionHelper';
import { convertTempIdToUUID } from '../../../lib/utils';
import { cookies } from 'next/headers';

const supabaseAdmin = getSupabaseAdminClient();

// Usar renderização dinâmica para acessar Headers
export const dynamic = 'force-dynamic';

// GET - Obter assinatura atual do usuário
export async function GET(req: NextRequest) {
  try {
    console.log('[API:subscriptions] Iniciando busca de informações de assinatura');
    
    // Extrair token de autenticação do cabeçalho, cookie ou query string
    const authHeader = req.headers.get('authorization');
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('sb-access-token')?.value;
    const queryToken = req.nextUrl.searchParams.get('token');
    
    // Determinar qual token usar, na ordem: cabeçalho > cookie > query
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[API:subscriptions] Usando token do cabeçalho de autorização');
    } else if (cookieToken) {
      token = cookieToken;
      console.log('[API:subscriptions] Usando token do cookie');
    } else if (queryToken) {
      token = queryToken;
      console.log('[API:subscriptions] Usando token da query string');
    }
    
    // Verificar userId alternativo nos cookies ou query params
    let userId = req.nextUrl.searchParams.get('userId') || 
      req.cookies.get('userId')?.value || 
      '';
      
    console.log('[API:subscriptions] Token presente:', !!token);
    console.log('[API:subscriptions] ID alternativo presente:', !!userId);
    
    // Validar e normalizar userId se não for um UUID válido
    if (userId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (userId.match(/^196d18[0-9a-f]{3,5}-/) || !uuidPattern.test(userId)) {
        const oldId = userId;
        userId = convertTempIdToUUID(userId);
        console.log(`[API:subscriptions] ID malformado detectado e convertido: ${oldId} -> ${userId}`);
      }
    }
    
    // Se não houver token e nem userId, retornar erro
    if (!token && !userId) {
      console.log('[API:subscriptions] Sem token de autenticação e sem userId alternativo');
      return NextResponse.json({ 
        success: false, 
        error: 'Token de autenticação ausente' 
      }, { status: 401 });
    }
    
    // Processar autenticação com Supabase auth
    let user_id = '';
    
    // Verificação tradicional para tokens normais do Supabase
    if (token) {
      // Obter dados do usuário através do token
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
          console.error('[API:subscriptions] Erro ao obter usuário pelo token:', error);
          
          // Tentar usar o ID alternativo se disponível
          if (userId) {
            console.log('[API:subscriptions] Usando ID alternativo:', userId);
            user_id = userId;
          } else {
            return NextResponse.json({ 
              success: false, 
              error: 'Usuário não autenticado' 
            }, { status: 401 });
          }
        } else {
          user_id = user.id;
          console.log('[API:subscriptions] Usuário autenticado:', user_id);
        }
      } catch (authError) {
        console.error('[API:subscriptions] Erro ao verificar autenticação:', authError);
        
        if (userId) {
          console.log('[API:subscriptions] Usando ID alternativo após erro:', userId);
          user_id = userId;
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Erro na autenticação' 
          }, { status: 500 });
        }
      }
    } else if (userId) {
      // Para IDs temporários ou quando não há token, usar o userId
      user_id = userId;
      console.log('[API:subscriptions] Usando ID fornecido:', user_id);
    }
    
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