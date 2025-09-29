import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-admin'
    }
  }
});

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Listar TODOS os usuários com suas assinaturas (incluindo usuários sem assinatura)
 */

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Buscar TODOS os usuários
    let usersQuery = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        user_type,
        profile_image_url,
        created_at
      `, { count: 'exact' });
    
    usersQuery = usersQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: users, error: usersError, count: totalUsers } = await usersQuery;
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar usuários: ' + usersError.message
      }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, offset, limit },
        stats: { total: 0, active: 0, pending: 0, cancelled: 0, expired: 0, paid: 0, free: 0, revenue: { monthly: 0 } }
      });
    }
    
    // Buscar assinaturas desses usuários
    const userIds = users.map(user => user.id);
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id, user_id, plan_id, status, starts_at, ends_at, 
        payment_method, created_at, updated_at
      `)
      .in('user_id', userIds);
    
    // Buscar planos
    const planIds = subscriptions?.map(sub => sub.plan_id).filter(Boolean) || [];
    const uniquePlanIds = Array.from(new Set(planIds));
    const { data: plans } = await supabase
      .from('plans')
      .select('id, name, slug, price_monthly')
      .in('id', uniquePlanIds);
    
    const plansMap = plans?.reduce((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {} as Record<string, any>) || {};
    
    // Mapear usuários com assinaturas
    const subscriptionsMap = (subscriptions || []).reduce((acc, sub) => {
      if (!acc[sub.user_id]) acc[sub.user_id] = [];
      acc[sub.user_id].push(sub);
      return acc;
    }, {} as Record<string, any[]>);
    
    const formattedData = users.map(user => {
      const userSubs = subscriptionsMap[user.id] || [];
      const activeSub = userSubs.find(sub => sub.status === 'active') || userSubs[0];
      
      let planData = { name: 'Plano Gratuito', slug: 'free', price_monthly: 0 };
      let status = 'active';
      
      if (activeSub && plansMap[activeSub.plan_id]) {
        planData = plansMap[activeSub.plan_id];
        status = activeSub.status;
      }
      
      return {
        id: activeSub?.id || `free-${user.id}`,
        planType: planData.slug,
        planName: planData.name,
        status: status,
        startDate: activeSub?.starts_at || user.created_at,
        endDate: activeSub?.ends_at || null,
        renewalDate: activeSub?.ends_at || null,
        price: parseFloat(String(planData.price_monthly || '0')),
        paymentMethod: activeSub?.payment_method || 'Gratuito',
        createdAt: activeSub?.created_at || user.created_at,
        subscriber: {
          id: user.id,
          name: user.name || 'Usuário sem nome',
          email: user.email,
          avatar: user.profile_image_url || null,
          type: user.user_type === 'business' ? 'business' : 'personal'
        }
      };
    });
    
    // Aplicar filtro de status
    let filteredData = formattedData;
    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    
    // Calcular estatísticas
    const stats = {
      total: totalUsers || 0,
      active: formattedData.filter(item => item.status === 'active').length,
      pending: formattedData.filter(item => item.status === 'pending').length,
      cancelled: formattedData.filter(item => item.status === 'cancelled').length,
      expired: formattedData.filter(item => item.status === 'expired').length,
      paid: formattedData.filter(item => item.price > 0).length,
      free: formattedData.filter(item => item.price === 0).length,
      revenue: { 
        monthly: formattedData
          .filter(item => item.status === 'active' && item.price > 0)
          .reduce((sum, item) => sum + item.price, 0)
      }
    };
    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: { total: totalUsers || 0, offset, limit },
      stats
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * Função para obter estatísticas avançadas incluindo usuários sem assinatura
 */
async function getAdvancedStats() {
  try {
    // Buscar total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Buscar todas as assinaturas
    const { data: allSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status
      `);
    
    if (subsError) {
      return getDefaultAdvancedStats(totalUsers || 0);
    }
    
    // Buscar planos para calcular receita
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, price_monthly');
    
    const plansMap = plans?.reduce((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {} as Record<string, any>) || {};
    
    // Calcular estatísticas
    const subscriptions = allSubscriptions || [];
    const usersWithActiveSubscriptions = new Set(
      subscriptions.filter(sub => sub.status === 'active').map(sub => sub.user_id)
    ).size;
    
    const usersWithoutSubscription = (totalUsers || 0) - new Set(subscriptions.map(sub => sub.user_id)).size;
    
    const paidActiveSubscriptions = subscriptions.filter(sub => {
      if (sub.status !== 'active') return false;
      const plan = plansMap[sub.plan_id];
      return plan && parseFloat(plan.price_monthly || '0') > 0;
    });
    
    const monthlyRevenue = paidActiveSubscriptions.reduce((total, sub) => {
      const plan = plansMap[sub.plan_id];
      return total + parseFloat(plan?.price_monthly || '0');
    }, 0);
    
    const stats = {
      total: totalUsers || 0,
      active: usersWithActiveSubscriptions,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      paid: paidActiveSubscriptions.length,
      free: usersWithoutSubscription + subscriptions.filter(sub => {
        const plan = plansMap[sub.plan_id];
        return sub.status === 'active' && (!plan || parseFloat(plan.price_monthly || '0') === 0);
      }).length,
      revenue: { monthly: monthlyRevenue }
    };
    return stats;
    
  } catch (error) {
    return getDefaultAdvancedStats(0);
  }
}

/**
 * Retorna estatísticas padrão em caso de erro
 */
function getDefaultAdvancedStats(totalUsers: number) {
  return {
    total: totalUsers,
    active: 0,
    pending: 0,
    cancelled: 0,
    expired: 0,
    paid: 0,
    free: totalUsers, // Assume que todos são gratuitos em caso de erro
    revenue: { monthly: 0 }
  };
}

// A função PUT foi movida para [id]/route.ts para suportar parâmetros dinâmicos 