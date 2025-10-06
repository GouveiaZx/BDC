import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { generateToken, validateAuth } from '../../../lib/jwt';
import { isAdminEmail } from '../../../config/admin';

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
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Este email não possui privilégios administrativos.' },
        { status: 403 }
      );
    }

    // Usar variáveis de ambiente obrigatórias (sem fallback)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Buscar usuário na tabela users (sistema manual, não Supabase Auth)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .eq('user_type', 'admin')
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Gerar token JWT admin
    const adminToken = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      userType: 'admin',
      isAdmin: true
    }, '24h'); // Token admin com duração menor

    // Atualizar último login
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: user.login_count + 1
      })
      .eq('id', user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Login admin realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: 'admin',
        isAdmin: true
      },
      token: adminToken,
      tokenType: 'Bearer'
    });

    // Configurar cookie seguro para admin
    response.cookies.set('auth_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar status da autenticação admin
export async function GET(request: NextRequest) {
  try {
    const validation = validateAuth(request);

    if (!validation.isValid || !validation.user?.isAdmin) {
      return NextResponse.json(
        { authenticated: false, message: 'Não autenticado como admin' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: validation.user.userId,
        email: validation.user.email,
        name: validation.user.name,
        userType: validation.user.userType,
        isAdmin: validation.user.isAdmin
      }
    });

  } catch (error) {
    return NextResponse.json(
      { authenticated: false, message: 'Erro interno' },
      { status: 500 }
    );
  }
}