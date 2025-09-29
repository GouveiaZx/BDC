import { getSupabaseAdminClient } from './supabase';
import { cookies } from 'next/headers';
import { ADMIN_EMAIL } from './adminAuth';

/**
 * Verifica se o usuário atual é um administrador (server-side)
 * @returns Um objeto de resultado indicando sucesso ou falha da autenticação
 */
export async function verifyAdminAuth() {
  try {
    const cookieStore = cookies();
    const supabase = getSupabaseAdminClient();
    
    // Verificar cookies de admin (abordagem simples para desenvolvimento)
    const adminAuth = cookieStore.get('admin_auth');
    const adminEmail = cookieStore.get('admin_email');
    
    if (adminAuth && adminAuth.value === 'true' && adminEmail && adminEmail.value === ADMIN_EMAIL) {
      return { 
        success: true, 
        userId: 'admin',
        userEmail: ADMIN_EMAIL 
      };
    }
    
    // Verificar a sessão atual
    const accessToken = cookieStore.get('sb-access-token');
    if (!accessToken) {
      return { success: false, error: 'Não autenticado' };
    }
    
    // Verificar se o usuário é admin pelo Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken.value);
    
    if (userError || !user) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // Em produção, você verificaria uma tabela 'users' no banco de dados
    // Para desenvolvimento, vamos considerar admin se o email for o correto
    if (user.email === ADMIN_EMAIL) {
      return { 
        success: true, 
        userId: user.id,
        userEmail: user.email 
      };
    }
    
    return { success: false, error: 'Acesso não autorizado' };
  } catch (error) {
    console.error('Erro ao verificar autenticação de admin:', error);
    return { success: false, error: 'Erro ao verificar autenticação' };
  }
} 