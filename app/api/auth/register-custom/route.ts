import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Iniciando registro customizado...');
    
    const body = await request.json();
    const { email, password, name, accountType } = body;

    // Validação
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    const userId = randomUUID();
    
    console.log('👤 Criando usuário:', { userId, email, name });

    // Criar usuário na tabela profiles (sem password_hash por enquanto)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        name: name,
        account_type: accountType || 'personal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      return NextResponse.json(
        { success: false, error: `Erro ao criar conta: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Usuário criado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: userId,
        email: email,
        name: name,
        account_type: accountType || 'personal'
      }
    });

  } catch (error) {
    console.error('💥 Erro geral no registro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 