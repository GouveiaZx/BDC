import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '../../../lib/secureLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function POST(request: NextRequest) {
  try {
    // Validar se o body existe e é válido JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos. Esperado JSON válido.' },
        { status: 400 }
      );
    }

    const { email, password, remember_me = false } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Buscar usuário por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Atualizar último login
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: user.login_count + 1
      })
      .eq('id', user.id);

    // Buscar assinatura ativa do usuário (se houver)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Preparar dados do usuário para resposta
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      profile_image_url: user.profile_image_url,
      phone: user.phone,
      whatsapp: user.whatsapp,
      bio: user.bio,
      city_id: user.city_id,
      state: user.state,
      email_verified: user.email_verified,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plans,
        status: subscription.status,
        starts_at: subscription.starts_at,
        ends_at: subscription.ends_at,
        is_trial: subscription.is_trial,
        ads_used: subscription.ads_used
      } : null
    };

    // Gerar token JWT seguro
    const { generateToken } = await import('../../../lib/jwt');

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      userType: user.user_type,
      isAdmin: user.user_type === 'admin'
    }, remember_me ? '30d' : '7d');


    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: userData,
      token,
      tokenType: 'Bearer'
    });

    // Configurar cookie httpOnly
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // segundos
    });

    return response;

  } catch (error) {
    logger.error('Login failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    // Se já retornamos uma resposta de erro, não fazer nada
    if (error instanceof Response) {
      return error;
    }

    // Erro genérico para problemas inesperados
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar login. Tente novamente.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint removido por segurança - não expor usuários admin 