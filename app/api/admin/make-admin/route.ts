import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Este endpoint deve ser usado apenas em desenvolvimento ou por um super admin
export async function POST(request: Request) {
  try {
    // Extrair o email do corpo da requisição
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email não fornecido' }, { status: 400 });
    }
    
    // Usar o cliente admin para fazer alterações no banco de dados
    const supabase = getSupabaseAdminClient();
    
    // Primeiro, encontrar o usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      
      // Tentar buscar por outro método, diretamente da tabela de autenticação
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao listar usuários:', authError);
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      // Definir tipo explícito para users
      const users = authData.users as User[];
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      // Atualizar campo is_admin diretamente via SQL
      const { error: updateError } = await supabase.rpc('exec_sql', { 
        sql: `UPDATE auth.users SET is_admin = true WHERE email = '${email}'`
      });
      
      if (updateError) {
        console.error('Erro ao definir usuário como admin:', updateError);
        return NextResponse.json({ error: 'Falha ao definir usuário como admin' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Usuário ${email} agora é administrador` 
      });
    }
    
    // Atualizar o campo is_admin para true
    const { error: updateError } = await supabase
      .from('auth.users')
      .update({ is_admin: true })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('Erro ao definir usuário como admin:', updateError);
      
      // Tentar método alternativo via SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: `UPDATE auth.users SET is_admin = true WHERE email = '${email}'`
      });
      
      if (sqlError) {
        console.error('Erro ao definir usuário como admin via SQL:', sqlError);
        return NextResponse.json({ error: 'Falha ao definir usuário como admin' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Usuário ${email} agora é administrador` 
    });
    
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 