import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validação de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function POST(request: NextRequest) {
  try {
    
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
      return NextResponse.json(
        { success: false, error: `Erro ao criar conta: ${profileError.message}` },
        { status: 500 }
      );
    }
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
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 