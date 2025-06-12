import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Lista de emails autorizados para acesso administrativo
const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'rodrigogouveiarx@gmail.com',
  'developer@buscaaquibdc.com.br'
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o email está na lista de administradores
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Este email não possui privilégios administrativos.' },
        { status: 403 }
      );
    }

    // Usar cliente regular para login (não admin client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjguzxwwydlpvudwmiyv.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI2MDAsImV4cCI6MjA2MzgwODYwMH0.GidrSppfX5XHyu5SeYcML3gmNNFXbouYWxFBG-UZlco';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Tentar fazer login usando o Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Erro no login administrativo:', error);
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: 'Falha na autenticação' },
        { status: 401 }
      );
    }

    // Verificar se o usuário autenticado está na lista de administradores
    const userEmail = data.user.email?.toLowerCase();
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Usuário autenticado não possui privilégios administrativos' },
        { status: 403 }
      );
    }

    // Buscar dados do perfil usando admin client
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Retornar sucesso com dados do usuário
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.full_name || 'Administrador',
        role: 'admin'
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

    // Configurar cookies de sessão
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in || 3600,
      path: '/'
    });

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/'
    });

    response.cookies.set('admin-auth', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in || 3600,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro na API de autenticação administrativa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Usar cliente regular para verificar token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjguzxwwydlpvudwmiyv.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI2MDAsImV4cCI6MjA2MzgwODYwMH0.GidrSppfX5XHyu5SeYcML3gmNNFXbouYWxFBG-UZlco';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar token de acesso nos cookies
    const accessToken = request.cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false, message: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // Verificar se o token é válido
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar se é um administrador
    const userEmail = user.email?.toLowerCase();
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { authenticated: false, message: 'Sem privilégios administrativos' },
        { status: 403 }
      );
    }

    // Buscar dados do perfil usando admin client
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.full_name || 'Administrador',
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Erro na verificação de autenticação administrativa:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Logout administrativo
export async function DELETE(request: NextRequest) {
  try {
    // Usar cliente regular para logout
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjguzxwwydlpvudwmiyv.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI2MDAsImV4cCI6MjA2MzgwODYwMH0.GidrSppfX5XHyu5SeYcML3gmNNFXbouYWxFBG-UZlco';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fazer logout no Supabase
    await supabase.auth.signOut();

    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    // Limpar cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.delete('admin-auth');

    return response;

  } catch (error) {
    console.error('Erro no logout administrativo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro no logout' },
      { status: 500 }
    );
  }
} 