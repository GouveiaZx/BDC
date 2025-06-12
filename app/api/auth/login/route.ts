import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password, remember_me = false } = await request.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
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

    // Gerar token seguro
    const tokenData = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      iat: Date.now(),
      exp: Date.now() + (remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: userData,
      token,
      expires_in: remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
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
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar se há usuários demo (desenvolvimento)
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    const { data: users, error } = await supabase
      .from('users')
      .select('email, name, user_type')
      .in('user_type', ['admin'])
      .eq('is_active', true);

    return NextResponse.json({
      demo_users: users || [],
      note: 'Usuários disponíveis para teste de login'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários demo' });
  }
} 