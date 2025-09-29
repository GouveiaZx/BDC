import { getSupabaseClient } from './supabase';

/**
 * Sistema centralizado de autenticação e sincronização de dados
 * Força 100% dos dados virem do banco de dados, eliminando dependência do localStorage
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  avatar_url?: string;
  account_type?: string;
  subscription?: string;
}

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
  token?: string;
}

const AUTH_COOKIE_NAME = 'bdc_auth_session';
const AUTH_EXPIRY_DAYS = 30;

/**
 * Salva sessão de autenticação nos cookies
 */
function saveAuthSession(user: User): void {
  try {
    const session = {
      user,
      timestamp: Date.now(),
      expires: Date.now() + (AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    
    const sessionData = btoa(JSON.stringify(session));
    const expires = new Date(session.expires).toUTCString();
    
    // Salvar cookie principal
    document.cookie = `${AUTH_COOKIE_NAME}=${sessionData}; path=/; expires=${expires}; SameSite=Lax`;
    
    // Cookies individuais para facilitar acesso
    document.cookie = `bdc_user_id=${user.id}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `bdc_user_email=${user.email}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `bdc_user_name=${encodeURIComponent(user.name)}; path=/; expires=${expires}; SameSite=Lax`;
    
    // Sincronizar com localStorage apenas como cache
    localStorage.setItem('bdc_auth_cache', JSON.stringify(session));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('isLoggedIn', 'true');
    
    console.log('✅ Sessão de autenticação salva com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar sessão:', error);
  }
}

/**
 * Recupera sessão de autenticação (cookies têm prioridade)
 */
function getAuthSession(): AuthSession | null {
  try {
    // Primeiro tentar cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies[AUTH_COOKIE_NAME]) {
      try {
        const sessionData = JSON.parse(atob(cookies[AUTH_COOKIE_NAME]));
        
        // Verificar se não expirou
        if (sessionData.expires > Date.now()) {
          console.log('✅ Sessão recuperada dos cookies');
          return {
            user: sessionData.user,
            isAuthenticated: true
          };
        }
      } catch (e) {
        console.warn('⚠️ Erro ao decodificar sessão dos cookies');
      }
    }
    
    // Fallback para localStorage
    const cachedSession = localStorage.getItem('bdc_auth_cache');
    if (cachedSession) {
      try {
        const sessionData = JSON.parse(cachedSession);
        if (sessionData.expires > Date.now()) {
          console.log('✅ Sessão recuperada do cache local');
          return {
            user: sessionData.user,
            isAuthenticated: true
          };
        }
      } catch (e) {
        console.warn('⚠️ Erro ao decodificar sessão do cache');
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao recuperar sessão:', error);
    return null;
  }
}

/**
 * Limpa todas as sessões de autenticação
 */
function clearAuthSession(): void {
  try {
    // Limpar cookies
    const cookiesToClear = [
      AUTH_COOKIE_NAME, 'bdc_user_id', 'bdc_user_email', 'bdc_user_name',
      'sb-access-token', 'sb-refresh-token', 'user-id', 'user-email', 'user-name'
    ];
    
    cookiesToClear.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    
    // Limpar localStorage
    const keysToRemove = [
      'bdc_auth_cache', 'userId', 'userEmail', 'userName', 'isLoggedIn',
      'sb-access-token', 'userProfile', 'hasUserProfile', 'auth-session'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Sessão limpa com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar sessão:', error);
  }
}

/**
 * Faz login com email e senha
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    console.log('🔐 [NEW CODE v2.0] Iniciando login centralizado para:', email);
    
    // Limpar sessões anteriores
    console.log('[LOGIN DEBUG v2.0] Limpando sessões anteriores...');
    clearAuthSession();
    console.log('✅ Sessão limpa com sucesso');
    
    // ✅ CORREÇÃO: Usar APENAS a API de login, nunca acessar tabela users diretamente
    console.log('[LOGIN DEBUG v2.0] NOVO SISTEMA: Verificando credenciais via API...');
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        remember_me: true
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('[LOGIN DEBUG v2.0] Resposta da API de login:', {
      status: loginResponse.status,
      success: loginResult.success,
      hasUser: !!loginResult.user,
      error: loginResult.error
    });
    
    if (!loginResult.success) {
      console.error('❌ [v2.0] Falha na autenticação:', loginResult.error);
      return {
        success: false,
        error: loginResult.error || 'Email ou senha incorretos'
      };
    }
    
    if (!loginResult.user) {
      console.error('❌ [v2.0] API não retornou dados do usuário');
      return {
        success: false,
        error: 'Dados do usuário não encontrados'
      };
    }
    
    // Converter dados da API para o formato User
    const user: User = {
      id: loginResult.user.id,
      email: loginResult.user.email,
      name: loginResult.user.name,
      phone: loginResult.user.phone,
      whatsapp: loginResult.user.whatsapp,
      avatar_url: loginResult.user.profile_image_url,
      account_type: loginResult.user.user_type || 'personal',
      subscription: loginResult.user.subscription?.plan?.name || 'free'
    };
    
    console.log('[LOGIN DEBUG v2.0] Dados do usuário processados:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPhone: !!user.phone,
      accountType: user.account_type,
      subscription: user.subscription
    });
    
    // Salvar sessão
    console.log('[LOGIN DEBUG v2.0] Salvando sessão de autenticação...');
    saveAuthSession(user);
    
    console.log('✅ [v2.0] Login realizado com sucesso');
    return {
      success: true,
      user
    };
    
  } catch (error: any) {
    console.error('❌ [v2.0] Erro no login:', error);
    console.error('[LOGIN DEBUG v2.0] Stack trace:', error.stack);
    return {
      success: false,
      error: 'Erro de conexão. Verifique sua internet e tente novamente.'
    };
  }
}

/**
 * Recupera dados atualizados do usuário do banco de dados
 */
export async function refreshUserData(userId: string): Promise<User | null> {
  try {
    console.log('🔄 Sincronizando dados do usuário:', userId);
    
    // ✅ CORREÇÃO: Usar API segura em vez de acessar tabelas diretamente
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar dados do usuário via API:', response.status);
      return null;
    }
    
    const userData = await response.json();
    
    if (!userData.success || !userData.user) {
      console.error('❌ API não retornou dados válidos do usuário');
      return null;
    }
    
    // Converter dados da API para o formato User
    const user: User = {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.name,
      phone: userData.user.phone,
      whatsapp: userData.user.whatsapp,
      avatar_url: userData.user.profile_image_url || userData.user.avatar_url,
      account_type: userData.user.user_type || userData.user.account_type || 'personal',
      subscription: userData.user.subscription?.plan?.name || userData.user.subscription || 'free'
    };
    
    // Atualizar sessão com dados novos
    saveAuthSession(user);
    
    console.log('✅ Dados sincronizados com sucesso');
    return user;
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados:', error);
    
    // ✅ FALLBACK: Tentar recuperar da sessão local se a API falhar
    const session = getAuthSession();
    if (session?.user && session.user.id === userId) {
      console.log('🔄 Usando dados da sessão local como fallback');
      return session.user;
    }
    
    return null;
  }
}

/**
 * Salva dados do perfil no banco de dados
 */
export async function saveProfile(userId: string, profileData: Partial<User>): Promise<boolean> {
  try {
    console.log('💾 Salvando perfil via API:', userId);
    
    // ✅ CORREÇÃO: Usar API segura em vez de acessar tabelas diretamente
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: profileData.name,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
        avatar_url: profileData.avatar_url,
        account_type: profileData.account_type,
        subscription: profileData.subscription
      })
    });
    
    if (!response.ok) {
      console.error('❌ Erro ao salvar perfil via API:', response.status);
      return false;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API retornou erro ao salvar perfil:', result.error);
      return false;
    }
    
    // Atualizar sessão com dados novos
    const updatedUser = await refreshUserData(userId);
    
    console.log('✅ Perfil salvo com sucesso via API');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao salvar perfil:', error);
    return false;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  const session = getAuthSession();
  return session?.isAuthenticated || false;
}

/**
 * Obtém dados do usuário atual
 */
export function getCurrentUser(): User | null {
  const session = getAuthSession();
  return session?.user || null;
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  try {
    console.log('🚪 Fazendo logout...');
    
    // Limpar sessões
    clearAuthSession();
    
    // Tentar logout no Supabase também
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    
    console.log('✅ Logout realizado com sucesso');
  } catch (error) {
    console.error('❌ Erro durante logout:', error);
  }
}

/**
 * Hook para verificar autenticação e sincronizar dados
 */
export function useAuth(): {
  user: User | null;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  saveProfile: (data: Partial<User>) => Promise<boolean>;
  logout: () => Promise<void>;
} {
  const session = getAuthSession();
  
  const refreshUser = async () => {
    if (session?.user) {
      await refreshUserData(session.user.id);
    }
  };
  
  const saveUserProfile = async (data: Partial<User>) => {
    if (session?.user) {
      return await saveProfile(session.user.id, data);
    }
    return false;
  };
  
  return {
    user: session?.user || null,
    isAuthenticated: session?.isAuthenticated || false,
    refreshUser,
    saveProfile: saveUserProfile,
    logout
  };
} 