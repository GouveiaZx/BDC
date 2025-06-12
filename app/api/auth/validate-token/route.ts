import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('[API] Iniciando validação de token');
    
    // Extrair o token do cabeçalho Authorization
    const authHeader = request.headers.get('Authorization');
    console.log('[API] Header de autorização:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API] Token não fornecido corretamente no header');
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' do início
    console.log('[API] Token extraído:', token ? `${token.substring(0, 10)}...` : 'vazio');
    
    if (!token) {
      console.log('[API] Token vazio após extração');
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obter cliente Supabase
    const supabase = getSupabaseAdminClient();
    console.log('[API] Cliente Supabase Admin obtido');
    
    // Verificar se o token é válido
    console.log('[API] Verificando token com Supabase...');
    const { data: user, error } = await supabase.auth.getUser(token);
    console.log('[API] Resposta da validação:', user ? 'Usuário encontrado' : 'Usuário não encontrado', error ? 'Com erro' : 'Sem erro');
    
    if (error || !user) {
      console.error('[API] Erro ao validar token:', error);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    console.log('[API] Token válido para usuário:', user.user.id);
    
    // Obter informações adicionais do usuário da tabela profiles, se existir
    console.log('[API] Buscando dados de perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
      
    if (profileError) {
      console.log('[API] Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('[API] Perfil encontrado:', profile?.id || 'N/A');
    }

    // Configurar cookies para a sessão
    const cookieStore = cookies();
    console.log('[API] Configurando cookies...');
    
    cookieStore.set('sb-access-token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    console.log('[API] Cookies configurados.');
    
    const responseData = {
      userId: user.user.id,
      email: user.user.email,
      name: profile?.full_name || user.user.email?.split('@')[0],
      avatarUrl: profile?.avatar_url,
    };
    
    console.log('[API] Retornando dados de usuário:', responseData);
    
    // Retornar informações do usuário
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API] Erro ao validar token:', error);
    return NextResponse.json(
      { error: 'Erro interno ao validar token' },
      { status: 500 }
    );
  }
} 