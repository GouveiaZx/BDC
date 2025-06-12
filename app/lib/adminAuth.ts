'use client';

/**
 * Utilitários para autenticação administrativa
 */

import { getSupabaseClient } from './supabase';

// Email fixo do administrador
export const ADMIN_EMAIL = 'admin@buscaaquibdc.com.br';

// ⚠️ SEGURANÇA: NUNCA faça commit de senhas em produção!
// Sempre use variáveis de ambiente para dados sensíveis
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Fallback apenas para desenvolvimento
const FALLBACK_PASSWORD = process.env.NODE_ENV === 'development' ? 'admin123' : undefined;
export const EFFECTIVE_PASSWORD = ADMIN_PASSWORD || FALLBACK_PASSWORD;

// Lista de emails com acesso administrativo
export const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'rodrigogouveiarx@gmail.com',
  'developer@buscaaquibdc.com.br'
];

// Funções para gerenciar autenticação do administrador no lado do cliente
export const adminAuth = {
  // Verificar se está autenticado como administrador
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      // Verificar no localStorage
      const adminAuthData = localStorage.getItem('adminAuth');
      if (adminAuthData) {
        const data = JSON.parse(adminAuthData);
        if (data && (data.role === 'admin' || data.isAdmin === true)) {
          // Verificar se é um email administrativo
          if (data.email && ADMIN_EMAILS.includes(data.email.toLowerCase())) {
            return true;
          }
        }
      }
      
      // Verificar token Supabase
      const supabaseToken = localStorage.getItem('sb-access-token');
      if (supabaseToken) {
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Erro ao verificar autenticação de administrador:', e);
      return false;
    }
  },
  
  // Fazer login como administrador
  login: async (email: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    console.log('🔐 [ADMIN LOGIN] Tentando login administrativo para:', email);
    try {
      // Limpar sessão anterior
      console.log('🧹 [ADMIN LOGIN] Limpando sessão anterior...');
      adminAuth.logout(); 
      await new Promise(resolve => setTimeout(resolve, 200));

      // Usar a nova API de autenticação administrativa
      console.log('🌐 [ADMIN LOGIN] Fazendo requisição para /api/admin/auth...');
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
        email: email,
        password: password
        }),
      });

      console.log('📊 [ADMIN LOGIN] Status da resposta:', response.status, response.statusText);
      console.log('📋 [ADMIN LOGIN] Headers da resposta:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📄 [ADMIN LOGIN] Resultado da API:', result);

      if (!response.ok || !result.success) {
        console.error('Login administrativo falhou:', result.error);
        return false;
      }
      
      console.log('Login administrativo bem-sucedido para:', result.user.email);

      // Salvar dados da sessão administrativa
      const adminSessionData = {
        email: result.user.email,
        role: 'admin',
        name: result.user.name || 'Administrador',
        token: result.session.access_token,
        refreshToken: result.session.refresh_token,
        isAdmin: true,
        userId: result.user.id,
        expiresAt: result.session.expires_at,
        loginMethod: 'api'
      };
      
      localStorage.setItem('adminAuth', JSON.stringify(adminSessionData));
      localStorage.setItem('sb-access-token', result.session.access_token);
      localStorage.setItem('sb-refresh-token', result.session.refresh_token);
      localStorage.setItem('userId', result.user.id);
      localStorage.setItem('userEmail', result.user.email);
      localStorage.setItem('userName', result.user.name);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isAdmin', 'true');

      // Configurar cookies para o middleware
      const expiresDate = new Date(result.session.expires_at * 1000);
      document.cookie = `admin-auth=true; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax; Secure`;
      document.cookie = `sb-access-token=${result.session.access_token}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax; Secure`;
      document.cookie = `sb-refresh-token=${result.session.refresh_token}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax; Secure`;
      
      console.log('Sessão administrativa salva com sucesso.');
      return true;

    } catch (error) {
      console.error('Erro durante o login administrativo:', error);
      adminAuth.logout();
      return false;
    }
  },
  
  // Fazer logout
  logout: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Fazer logout no Supabase
      const supabase = getSupabaseClient();
      supabase.auth.signOut().catch(err => {
        console.error('Erro ao fazer logout no Supabase:', err);
      });
      
      // Remover do localStorage todos os itens relacionados
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('isAdmin');
      
      // Remover cookies
      document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
      document.cookie = 'admin_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    }
  },
  
  // Obter dados do administrador
  getAdminData: () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const adminAuthData = localStorage.getItem('adminAuth');
      if (!adminAuthData) return null;
      
      return JSON.parse(adminAuthData);
    } catch (e) {
      console.error('Erro ao obter dados do administrador:', e);
      return null;
    }
  },
  
  // Renovar token do Supabase
  refreshToken: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      console.log('Tentando renovar sessão Supabase...');
      const supabase = getSupabaseClient();
      
      // Verificar se já existe uma sessão
      const { data: existingSession } = await supabase.auth.getSession();
      if (!existingSession?.session) {
        console.warn('Nenhuma sessão encontrada para renovar');
        
        // Se não existe sessão, tentar obter dados do admin do localStorage
        const adminData = adminAuth.getAdminData();
        if (!adminData) {
          console.error('Sem sessão e sem dados de admin no localStorage');
          return false;
        }
        
        // Se o método de login não é Supabase, não é possível renovar
        if (adminData.loginMethod !== 'supabase') {
          console.error('Sessão não é do tipo Supabase, não é possível renovar');
          return false;
        }
      }
      
      // Tentar renovar sessão
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Erro ao renovar token:', error);
        
        // Se o erro for por sessão expirada, tentar fazer login novamente
        if (error.message.includes('expired') || error.message.includes('missing')) {
          console.log('Sessão expirada ou ausente, fazendo logout para nova autenticação');
          adminAuth.logout();
        }
        return false;
      }
      
      if (!data.session) {
        console.error('Renovação falhou - nenhuma sessão retornada');
        return false;
      }
      
      console.log('Sessão renovada com sucesso:', data.session.expires_at);
      
      // Atualizar token no localStorage
      const adminData = adminAuth.getAdminData();
      if (adminData) {
        adminData.token = data.session.access_token;
        adminData.refreshToken = data.session.refresh_token;
        adminData.expiresAt = data.session.expires_at;
        localStorage.setItem('adminAuth', JSON.stringify(adminData));
      }
      
      // Atualizar outros locais
      localStorage.setItem('sb-access-token', data.session.access_token);
      localStorage.setItem('sb-refresh-token', data.session.refresh_token);
      
      // Atualizar cookies
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax; Secure`;
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=2592000; SameSite=Lax; Secure`;
      
      return true;
    } catch (e) {
      console.error('Exceção ao renovar token:', e);
      return false;
    }
  }
};

// Para o lado do servidor, verificar apenas o email
export const isAdminEmail = (email: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Verifica se o usuário atual é um administrador (cliente)
 * Esta é uma versão para client components que não usa next/headers
 */
export async function verifyAdminAuthClient() {
  try {
    // Primeiro verificar se há dados de admin no localStorage
    if (typeof window !== 'undefined') {
      const adminAuthData = localStorage.getItem('adminAuth');
      if (adminAuthData) {
        try {
          const data = JSON.parse(adminAuthData);
          if (data && data.email && ADMIN_EMAILS.includes(data.email.toLowerCase())) {
            return { 
              success: true, 
              userId: data.userId || 'admin',
              userEmail: data.email 
            };
          }
        } catch (e) {
          console.error('Erro ao parsear dados do admin:', e);
        }
      }
    }

    // Caso não encontre no localStorage, verificar pela API do Supabase
    const supabase = getSupabaseClient();
    
    // Verificar a sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { success: false, error: 'Não autenticado' };
    }
    
    // Verificar se o email está na lista de admins
    if (session.user.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return { 
        success: true, 
        userId: session.user.id,
        userEmail: session.user.email 
      };
    }
    
    // Se não encontrou pelo email, verificar na tabela profiles
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userData) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // Verificar se o usuário é admin
    if (userData.is_admin !== true) {
      return { success: false, error: 'Acesso não autorizado' };
    }
    
    return { 
      success: true, 
      userId: session.user.id,
      userEmail: userData.email 
    };
  } catch (error) {
    console.error('Erro ao verificar autenticação de admin:', error);
    return { success: false, error: 'Erro ao verificar autenticação' };
  }
} 