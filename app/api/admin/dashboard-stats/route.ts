import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
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
 * GET - Obter estatísticas do dashboard administrativo
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Dashboard Stats API] Iniciando requisição');
    
    // Verificar autenticação
    if (!verifyAdminAuth(request)) {
      console.log('[Dashboard Stats API] Falha na autenticação');
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    // Inicializar estatísticas com valores padrão
    const stats = {
      users: {
        total: 0,
        newToday: 0,
        growth: 0
      },
      businesses: {
        total: 0,
        verified: 0
      },
      ads: {
        total: 0,
        active: 0,
        pendingApproval: 0
      },
      subscriptions: {
        total: 0,
        active: 0,
        revenue: {
          monthly: 0,
          yearly: 0
        }
      },
      activity: []
    };
    
    try {
      // 1. Estatísticas de usuários
      console.log('[Dashboard Stats API] Buscando estatísticas de usuários...');
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const today = new Date().toISOString().split('T')[0];
      const { count: newUsersToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      stats.users.total = totalUsers || 0;
      stats.users.newToday = newUsersToday || 0;
      stats.users.growth = stats.users.total > 0 ? 
        Math.round((stats.users.newToday / stats.users.total) * 100) : 0;
      
      console.log('[Dashboard Stats API] Usuários:', stats.users);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar usuários:', error);
    }
    
    try {
      // 2. Estatísticas de empresas
      console.log('[Dashboard Stats API] Buscando estatísticas de empresas...');
      const { count: totalBusinesses } = await supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: verifiedBusinesses } = await supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);
      
      stats.businesses.total = totalBusinesses || 0;
      stats.businesses.verified = verifiedBusinesses || 0;
      
      console.log('[Dashboard Stats API] Empresas:', stats.businesses);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar empresas:', error);
    }
    
    try {
      // 3. Estatísticas de anúncios
      console.log('[Dashboard Stats API] Buscando estatísticas de anúncios...');
      const { count: totalAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { count: pendingAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      stats.ads.total = totalAds || 0;
      stats.ads.active = activeAds || 0;
      stats.ads.pendingApproval = pendingAds || 0;
      
      console.log('[Dashboard Stats API] Anúncios:', stats.ads);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar anúncios:', error);
    }
    
    try {
      // 4. Estatísticas de assinaturas
      console.log('[Dashboard Stats API] Buscando estatísticas de assinaturas...');
      const { count: totalSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      stats.subscriptions.total = totalSubscriptions || 0;
      stats.subscriptions.active = activeSubscriptions || 0;
      
      console.log('[Dashboard Stats API] Assinaturas:', stats.subscriptions);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar assinaturas:', error);
    }
    
    try {
      // 5. Atividades recentes
      console.log('[Dashboard Stats API] Buscando atividades recentes...');
      
      // Últimos anúncios
      const { data: recentAds } = await supabase
        .from('ads')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      // Últimos usuários
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      // Combinar atividades
      let activities: any[] = [];
      
      if (recentAds) {
        activities = activities.concat(recentAds.map((ad: any) => ({
          id: ad.id,
          title: ad.title,
          date: ad.created_at,
          type: 'ad',
          status: ad.status
        })));
      }
      
      if (recentUsers) {
        activities = activities.concat(recentUsers.map((user: any) => ({
          id: user.id,
          title: user.email,
          date: user.created_at,
          type: 'user',
          status: 'new'
        })));
      }
      
      // Ordenar por data mais recente
      activities.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      stats.activity = activities.slice(0, 5);
      
      console.log('[Dashboard Stats API] Atividades:', stats.activity.length);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar atividades:', error);
    }
    
    // Lista de anúncios pendentes para aprovação
    let pendingApprovals: any[] = [];
    try {
      console.log('[Dashboard Stats API] Buscando aprovações pendentes...');
      const { data: pendingAds } = await supabase
        .from('ads')
        .select('id, title, status, created_at, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (pendingAds && pendingAds.length > 0) {
        // Buscar dados reais dos usuários
        const userIds = pendingAds.map(ad => ad.user_id).filter(Boolean);
        const uniqueUserIds = Array.from(new Set(userIds));
        
        let usersMap: Record<string, any> = {};
        if (uniqueUserIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', uniqueUserIds);
          
          if (users) {
            usersMap = users.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {} as Record<string, any>);
          }
        }
        
        pendingApprovals = pendingAds.map((ad: any) => {
          const user = usersMap[ad.user_id] || {};
          return {
            id: ad.id,
            title: ad.title,
            type: 'ad',
            date: ad.created_at,
            user: {
              name: user.name || 'Usuário sem nome',
              email: user.email || 'Email não informado'
            }
          };
        });
      }
      
      console.log('[Dashboard Stats API] Aprovações pendentes:', pendingApprovals.length);
    } catch (error) {
      console.error('[Dashboard Stats API] Erro ao buscar aprovações pendentes:', error);
    }
    
    console.log('[Dashboard Stats API] Retornando estatísticas completas');
    
    return NextResponse.json({
      success: true,
      stats,
      pendingApprovals
    });
    
  } catch (error) {
    console.error('[Dashboard Stats API] Erro geral:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 