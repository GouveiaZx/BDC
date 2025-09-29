import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';
import { ADMIN_EMAILS } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Verifica autorização alternativa para logins manuais
 * quando não há uma sessão Supabase válida
 */
async function checkManualAuth(request: NextRequest): Promise<boolean> {
  try {
    // Verificar cookie admin-auth e sb-access-token
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    // Se temos o cookie admin-auth, consideramos autenticado
    if (adminAuthCookie === 'true') {
      
      return true;
    }
    
    // Se temos um token de acesso do Supabase, também consideramos autenticado
    if (sbAccessToken) {
      
      return true;
    }
    
    return false;
  } catch (error) {
    
    return false;
  }
}

/**
 * Função auxiliar para verificar se um usuário é administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    
    const supabase = getSupabaseAdminClient();

    // Verificar no perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', userId)
      .single();

    if (!profileError && profileData) {
      if (profileData.is_admin === true) {
        return true;
      }
      if (profileData.email && ADMIN_EMAILS.includes(profileData.email.toLowerCase())) {
        return true;
      }
    }
    
    // Como fallback, verificar na tabela auth.users
    const { data: authData, error: authError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT is_admin, email FROM auth.users WHERE id = '${userId}'`
    });
    
    if (!authError && authData && authData.length > 0) {
      const userAuthInfo = authData[0];
      if (userAuthInfo?.is_admin === true) {
        return true;
      }
      if (userAuthInfo?.email && ADMIN_EMAILS.includes(userAuthInfo.email.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    
    return false;
  }
}

/**
 * Endpoint para obter estatísticas de assinaturas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const supabase = getSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Se não temos sessão Supabase válida, verificar autenticação manual
    let isUserAdmin = false;
    
    if (sessionError || !session) {
      
      const hasManualAuth = await checkManualAuth(request);
      
      if (hasManualAuth) {
        
        isUserAdmin = true;
      } else {
        
        return NextResponse.json({ 
          success: false, 
          message: 'Não autenticado' 
        }, { status: 401 });
      }
    } else {
      // Verificação normal via Supabase
      
      isUserAdmin = await isAdmin(session.user.id);
      
      if (!isUserAdmin) {
        
        return NextResponse.json({ 
          success: false, 
          message: 'Acesso negado' 
        }, { status: 403 });
      }
    }
    
    // Usar cliente admin para consultas
    const admin = getSupabaseAdminClient();
    
    // Estatísticas padrão
    const stats = {
      total: 0,
      active: 0,
      pending: 0,
      cancelled: 0,
      expired: 0,
      revenue: {
        monthly: 0
      },
      accountTypes: {
        personal: 0,
        business: 0
      }
    };
    
    // Obter contagem total
    try {
      const { count: totalCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      
      stats.total = totalCount || 0;
    } catch (error) {
      
    }
    
    // Obter contagem por status
    try {
      // Assinaturas ativas
      const { count: activeCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      stats.active = activeCount || 0;
      
      // Assinaturas pendentes
      const { count: pendingCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      stats.pending = pendingCount || 0;
      
      // Assinaturas canceladas
      const { count: cancelledCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');
      
      stats.cancelled = cancelledCount || 0;
      
      // Assinaturas expiradas
      const { count: expiredCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired');
      
      stats.expired = expiredCount || 0;
    } catch (error) {
      
    }
    
    // Obter receita mensal
    try {
      const { data: activeSubscriptions } = await admin
        .from('subscriptions')
        .select('price')
        .eq('status', 'active');
      
      if (activeSubscriptions) {
        stats.revenue.monthly = activeSubscriptions.reduce((acc, sub) => {
          const price = typeof sub.price === 'number' ? sub.price : parseFloat(sub.price || '0');
          return acc + price;
        }, 0);
      }
    } catch (error) {
      
    }
    
    // Obter contagem por tipo de conta
    try {
      // Usar SQL para fazer JOIN com profiles
      const { data: accountTypes } = await admin.rpc('exec_sql', { 
        sql: `
          SELECT p.account_type, COUNT(*) 
          FROM subscriptions s
          JOIN profiles p ON s.user_id = p.id
          GROUP BY p.account_type
        `
      });
      
      if (accountTypes) {
        accountTypes.forEach((item: any) => {
          if (item.account_type === 'business') {
            stats.accountTypes.business = parseInt(item.count || '0');
          } else {
            stats.accountTypes.personal = parseInt(item.count || '0');
          }
        });
      }
    } catch (error) {
      
    }
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 