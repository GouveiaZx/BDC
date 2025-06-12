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
      console.log('(Pending API) Autenticação manual válida via cookie admin-auth');
      return true;
    }
    
    // Se temos um token de acesso do Supabase, também consideramos autenticado
    if (sbAccessToken) {
      console.log('(Pending API) Autenticação manual válida via sb-access-token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('(Pending API) Erro ao verificar autenticação manual:', error);
    return false;
  }
}

/**
 * Função auxiliar para verificar se um usuário é administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    console.log('(Pending API) Verificando privilégios de admin para usuário:', userId);
    const supabase = getSupabaseAdminClient();

    // Verificar no perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('(Pending API) Erro ao buscar perfil para verificação de admin:', profileError.message);
    } else if (profileData) {
      if (profileData.is_admin === true) {
        console.log('(Pending API) Usuário é admin (is_admin=true no perfil):', userId);
        return true;
      }
      if (profileData.email && ADMIN_EMAILS.includes(profileData.email.toLowerCase())) {
        console.log('(Pending API) Usuário é admin (email na lista de admins):', profileData.email);
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
    console.error('(Pending API) Erro ao verificar se usuário é admin:', error);
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
      console.log('(Pending API) Sem sessão Supabase, verificando autenticação manual...');
      const hasManualAuth = await checkManualAuth(request);
      
      if (hasManualAuth) {
        console.log('(Pending API) Usando autorização manual para a API de contagens pendentes');
        isUserAdmin = true;
      } else {
        console.error('(Pending API) Sem sessão autenticada e sem autenticação manual');
        return NextResponse.json({ 
          success: false, 
          message: 'Não autenticado' 
        }, { status: 401 });
      }
    } else {
      // Verificação normal via Supabase
      console.log('(Pending API) Sessão encontrada para usuário:', session.user.id);
      isUserAdmin = await isAdmin(session.user.id);
      
      if (!isUserAdmin) {
        console.warn('(Pending API) Acesso negado para usuário:', session.user.id, session.user.email);
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
      console.log('(Pending API) Consultando anúncios pendentes...');
      
      // Verificação robusta com contagem exata
      const { count: adsCount, error: countError } = await admin
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (countError) {
        console.error('(Pending API) Erro na contagem de anúncios pendentes:', countError);
        counts.ads = 0;
      } else {
        const finalCount = Math.max(0, adsCount || 0);
        console.log('(Pending API) Contagem final de anúncios pendentes:', finalCount);
        counts.ads = finalCount;
        
        // Log adicional para debug se houver discrepância
        if (finalCount > 0) {
          const { data: debugAds } = await admin
            .from('ads')
            .select('id, title, status')
            .eq('status', 'pending')
            .limit(3);
          console.log('(Pending API) Anúncios pendentes encontrados:', debugAds);
        }
      }
    } catch (error) {
      console.error('(Pending API) Erro ao contar anúncios pendentes:', error);
      counts.ads = 0;
    }
    
    // Obter contagem de denúncias pendentes com verificação dupla
    try {
      console.log('(Pending API) Consultando denúncias pendentes...');
      
      // Verificação robusta com contagem exata
      const { count: reportsCount, error: reportsCountError } = await admin
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (reportsCountError) {
        console.error('(Pending API) Erro na contagem de denúncias pendentes:', reportsCountError);
        counts.reports = 0;
      } else {
        const finalReportsCount = Math.max(0, reportsCount || 0);
        console.log('(Pending API) Contagem final de denúncias pendentes:', finalReportsCount);
        counts.reports = finalReportsCount;
        
        // Log adicional para debug se houver discrepância
        if (finalReportsCount > 0) {
          const { data: debugReports } = await admin
            .from('reports')
            .select('id, reason, status')
            .eq('status', 'pending')
            .limit(3);
          console.log('(Pending API) Denúncias pendentes encontradas:', debugReports);
        }
      }
    } catch (error) {
      console.error('(Pending API) Erro ao contar denúncias pendentes:', error);
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
      console.error('(Pending API) Erro ao contar assinaturas pendentes:', error);
    }
    
    return NextResponse.json({
      success: true,
      counts
    });
    
  } catch (error) {
    console.error('(Pending API) Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 