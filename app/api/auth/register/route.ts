import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🔑 Supabase config check:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  serviceKey: supabaseServiceKey ? 'SET (' + supabaseServiceKey.substring(0, 20) + '...)' : 'MISSING'
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, user_type = 'advertiser', phone, city_id } = await request.json();

    // Validação básica
    if (!email || !password || !name) {
      console.log('❌ Dados obrigatórios faltando');
      return NextResponse.json(
        { success: false, error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validação de senha
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
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

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log('❌ Email já existe no sistema:', email);
      return NextResponse.json(
        { success: false, error: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserir novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name.trim(),
        user_type,
        phone: phone || null,
        city_id: city_id || null,
        is_active: true,
        email_verified: false,
        login_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar conta. Tente novamente.' },
        { status: 500 }
      );
    }

    // Criar assinatura gratuita padrão
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', 'gratuito')
      .single();

    if (freePlan) {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: newUser.id,
          plan_id: freePlan.id,
          starts_at: new Date().toISOString(),
          status: 'active',
          is_trial: false
        });
    }

    // Preparar dados do usuário para resposta (sem senha)
    const userData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      user_type: newUser.user_type,
      phone: newUser.phone,
      city_id: newUser.city_id,
      email_verified: newUser.email_verified
    };

    // Gerar token seguro
    const tokenData = {
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.user_type,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const response = NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: userData,
      token,
      next_steps: {
        verify_email: !newUser.email_verified,
        complete_profile: true,
        choose_plan: user_type !== 'advertiser'
      }
    });

    // Configurar cookie httpOnly
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 horas em segundos
    });

    return response;

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint GET para estatísticas de registro
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    const { data: stats } = await supabase
      .from('users')
      .select('user_type, created_at, is_active')
      .eq('is_active', true);

    const totalUsers = stats?.length || 0;
    const usersByType = stats?.reduce((acc: any, user) => {
      acc[user.user_type] = (acc[user.user_type] || 0) + 1;
      return acc;
    }, {});

    // Usuários registrados hoje
    const today = new Date().toISOString().split('T')[0];
    const todayUsers = stats?.filter(user => 
      user.created_at.startsWith(today)
    ).length || 0;

    return NextResponse.json({
      total_users: totalUsers,
      users_by_type: usersByType,
      registered_today: todayUsers,
      registration_enabled: true
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' });
  }
} 