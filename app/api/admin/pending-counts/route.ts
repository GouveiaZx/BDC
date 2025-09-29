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

    if (profileError) {
      
    } else if (profileData) {
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
 * Endpoint para obter contagens de itens pendentes
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
    const counts = {
      ads: 0,
      reports: 0,
      subscriptions: 0
    };
    
    // Obter contagem de anúncios pendentes com verificação dupla
    try {
      
      // Primeiro, vamos verificar todos os anúncios para debug
      const { data: allAds, error: allAdsError } = await admin
        .from('ads')
        .select('id, title, status')
        .limit(10);

      // Verificação robusta com contagem exata
      const { count: adsCount, error: countError } = await admin
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (countError) {
        
        counts.ads = 0;
      } else {
        const finalCount = Math.max(0, adsCount || 0);
        
        // Verificação cruzada: buscar anúncios pendentes diretamente
        const { data: pendingAds, error: pendingError } = await admin
          .from('ads')
          .select('id, title, status')
          .eq('status', 'pending');

        // Se há discrepância, usar a contagem real dos dados retornados
        const realCount = pendingAds ? pendingAds.length : 0;
        
        counts.ads = realCount; // Usar a contagem real em vez da API count
      }
    } catch (error) {
      
      counts.ads = 0;
    }
    
    // Obter contagem de denúncias pendentes com verificação dupla
    try {
      
      // Verificação robusta com contagem exata
      const { count: reportsCount, error: reportsCountError } = await admin
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (reportsCountError) {
        
        counts.reports = 0;
      } else {
        const finalReportsCount = Math.max(0, reportsCount || 0);
        
        counts.reports = finalReportsCount;
        
        // Log adicional para debug se houver discrepância
        if (finalReportsCount > 0) {
          const { data: debugReports } = await admin
            .from('reports')
            .select('id, reason, status')
            .eq('status', 'pending')
            .limit(3);
          
        }
      }
    } catch (error) {
      
      counts.reports = 0;
    }
    
    // Obter contagem de assinaturas pendentes
    try {
      const { count: subscriptionsCount } = await admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      counts.subscriptions = subscriptionsCount || 0;
    } catch (error) {
      
    }
    
    return NextResponse.json({
      success: true,
      counts
    });
    
  } catch (error) {
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}