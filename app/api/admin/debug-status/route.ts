import { NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';

export async function GET(request: Request) {
  try {
    // Obter sessão do usuário
    const supabase = getSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não autenticado',
        sessionError
      }, { status: 401 });
    }
    
    // Obter dados do usuário da sessão
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    // Verificar status de admin nos vários lugares possíveis
    const admin = getSupabaseAdminClient();
    
    // 1. Verificação em auth.users
    const { data: authData, error: authError } = await admin.rpc('exec_sql', { 
      sql: `SELECT id, email, is_admin FROM auth.users WHERE id = '${userId}'`
    });
    
    // 2. Verificação em profiles
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single();
    
    // 3. Verificar acesso às subscrições
    const { data: subscriptions, error: subscriptionsError } = await admin
      .from('subscriptions')
      .select('id, user_id, plan_type, status')
      .eq('user_id', userId);
    
    // 4. Verificar assinaturas ativas (sem filtrar por usuário)
    const { data: activeSubscriptions, error: activeSubError } = await admin
      .from('subscriptions')
      .select('id, user_id, plan_type, status')
      .eq('status', 'active')
      .limit(5);
    
    // Retornar resultado completo
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail
      },
      authUsers: {
        data: authData,
        error: authError?.message
      },
      profiles: {
        data: profileData,
        error: profileError?.message
      },
      userSubscriptions: {
        data: subscriptions,
        error: subscriptionsError?.message
      },
      activeSubscriptions: {
        data: activeSubscriptions,
        count: activeSubscriptions?.length || 0,
        error: activeSubError?.message
      },
      message: "Verificação de status completa."
    });
  } catch (error) {
    console.error('Erro na depuração de status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 