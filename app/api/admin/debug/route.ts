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
    
    // Verificar status de admin no auth.users
    const admin = getSupabaseAdminClient();
    
    const { data: authData, error: authError } = await admin.rpc('exec_sql', { 
      sql: `SELECT is_admin FROM auth.users WHERE id = '${userId}'`
    });
    
    // Verificar status de admin no profiles (alternativo)
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    // Verificar permissões RLS
    const { data: subscriptionsData, error: subscriptionsError } = await admin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    // Definir usuário como admin diretamente em auth.users
    const { error: updateAuthError } = await admin.rpc('exec_sql', { 
      sql: `UPDATE auth.users SET is_admin = true WHERE id = '${userId}'`
    });
    
    // Definir usuário como admin na tabela profiles também
    const { error: updateProfileError } = await admin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId);
    
    // Resultado final
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail
      },
      adminCheck: {
        authUsers: {
          data: authData,
          error: authError?.message
        },
        profiles: {
          data: profileData,
          error: profileError?.message
        }
      },
      subscriptionsAccess: {
        data: subscriptionsData,
        count: subscriptionsData ? (subscriptionsData as any).count : 0,
        error: subscriptionsError?.message
      },
      adminUpdate: {
        authUsers: {
          success: !updateAuthError,
          error: updateAuthError?.message
        },
        profiles: {
          success: !updateProfileError,
          error: updateProfileError?.message
        }
      },
      message: "Usuário definido como administrador. Tente atualizar a página agora."
    });
  } catch (error) {
    console.error('Erro na depuração:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 