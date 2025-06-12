import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

// Obter lista de usuários
export async function GET(request: Request) {
  try {
    // Verificar se o usuário tem permissão de administrador (implementar depois)
    // const cookieStore = cookies();
    // const token = cookieStore.get('sb-access-token')?.value;
    
    // Implementar verificação de permissão aqui
    
    // Por enquanto, vamos apenas prosseguir e obter os usuários
    const supabase = getSupabaseAdminClient();
    
    // Buscar usuários do Supabase
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      users: users.users 
    });
  } catch (error: any) {
    console.error('Erro na API de usuários:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
}

// Atualizar status de um usuário (bloquear/desbloquear)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, isBlocked, action } = data;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário não fornecido'
      }, { status: 400 });
    }
    
    // Obter cliente admin do Supabase
    const admin = getSupabaseAdminClient();
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (isBlocked !== undefined) {
      updateData.is_blocked = isBlocked;
    }
    
    // Se não houver dados para atualizar, retornar erro
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dado para atualizar'
      }, { status: 400 });
    }
    
    // Atualizar no banco de dados
    const { error } = await admin
      .from('users')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    // Se estiver bloqueando o usuário, também desativar suas empresas
    if (isBlocked && action === 'block') {
      const { error: businessesError } = await admin
        .from('businesses')
        .update({ is_active: false })
        .eq('user_id', id);
        
      if (businessesError) {
        console.error('Erro ao desativar empresas do usuário:', businessesError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar atualização de usuário:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 