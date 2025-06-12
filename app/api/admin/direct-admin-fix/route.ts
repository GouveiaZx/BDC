import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { ADMIN_EMAIL } from '../../../lib/adminAuth';

/**
 * Endpoint de correção direta do admin para contornar problemas de autenticação
 * Vai atribuir privilégios de admin com base apenas no email fornecido
 */
export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdminClient();
    
    // Buscar o usuário pelo email administrativo
    const { data: userData, error: userError } = await admin.rpc('exec_sql', { 
      sql: `SELECT id, email FROM auth.users WHERE email = '${ADMIN_EMAIL}'`
    });
    
    if (userError || !userData || userData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário admin não encontrado',
        email: ADMIN_EMAIL,
        details: userError?.message
      }, { status: 404 });
    }
    
    const userId = userData[0].id;
    
    // Definir flag is_admin na tabela auth.users
    const { error: authError } = await admin.rpc('exec_sql', { 
      sql: `UPDATE auth.users SET is_admin = true WHERE id = '${userId}'`
    });
    
    // Verificar se o usuário tem um perfil
    const { data: profileData, error: profileCheckError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId);
    
    let profileError = null;
    
    // Se não existir um perfil, criar um
    if (!profileData || profileData.length === 0) {
      const { error: createProfileError } = await admin
        .from('profiles')
        .insert([
          { 
            id: userId, 
            email: ADMIN_EMAIL,
            name: 'Administrador',
            is_admin: true
          }
        ]);
      
      profileError = createProfileError;
    } else {
      // Se existir, atualizar o perfil para ter is_admin = true
      const { error: updateProfileError } = await admin
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);
      
      profileError = updateProfileError;
    }
    
    // Verificar resultados após atualizações
    const { data: authCheck } = await admin.rpc('exec_sql', { 
      sql: `SELECT is_admin FROM auth.users WHERE id = '${userId}'`
    });
    
    const { data: profileCheck } = await admin
      .from('profiles')
      .select('id, email, is_admin')
      .eq('id', userId);
    
    // Instruções para o cliente
    const clientInstructions = `
    Para completar a configuração, execute este código no console do navegador:
    
    // Limpar qualquer autenticação anterior
    localStorage.removeItem('adminAuth');
    
    // Configurar autenticação administrativa
    localStorage.setItem('adminAuth', JSON.stringify({
      email: '${ADMIN_EMAIL}',
      role: 'admin',
      name: 'Administrador',
      token: 'admin-jwt-token-${Date.now()}',
      isAdmin: true
    }));
    
    // Definir também um cookie admin para ajudar nas requisições API
    document.cookie = 'admin-auth=true; path=/; max-age=86400; SameSite=Lax';
    document.cookie = 'admin_email=${ADMIN_EMAIL}; path=/; max-age=86400; SameSite=Lax';
    
    // Em seguida, recarregue a página
    window.location.reload();
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Correção direta de privilégios admin aplicada',
      admin: {
        email: ADMIN_EMAIL,
        userId: userId
      },
      updates: {
        auth: {
          success: !authError,
          error: authError?.message,
          result: authCheck
        },
        profile: {
          success: !profileError,
          error: profileError?.message,
          result: profileCheck
        }
      },
      instructions: clientInstructions
    });
  } catch (error) {
    console.error('Erro ao corrigir admin diretamente:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 