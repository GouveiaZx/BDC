import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../../lib/supabase';

/**
 * Função auxiliar para verificar se um usuário é administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Primeiro verificar na tabela auth.users (onde o campo is_admin foi adicionado)
    const { data: authData, error: authError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT is_admin FROM auth.users WHERE id = '${userId}'`
    });
    
    if (!authError && authData && authData.length > 0) {
      console.log('Resultado da verificação de admin em auth.users:', authData);
      return authData[0]?.is_admin === true;
    }
    
    if (authError) {
      console.error('Erro ao verificar admin em auth.users:', authError);
    }
    
    // Verificação alternativa na tabela profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('Erro ao verificar se usuário é admin em profiles:', error);
      return false;
    }
    
    return data.is_admin === true;
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e se o usuário é administrador
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const isUserAdmin = await isAdmin(session.user.id);
    
    if (!isUserAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    // Obter parâmetros da requisição
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    
    // Usar cliente admin para consultas
    const admin = getSupabaseAdminClient();
    
    // Consultar contagem de denúncias com o status especificado
    const { count, error } = await admin
      .from('ad_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    if (error) {
      console.error('Erro ao buscar contagem de denúncias:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar contagem de denúncias'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      total: count || 0
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 