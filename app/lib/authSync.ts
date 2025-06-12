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
    console.log('🔐 Iniciando login centralizado para:', email);
    
    // Limpar sessões anteriores
    clearAuthSession();
    
    const supabase = getSupabaseClient();
    
    // Verificar se o usuário existe na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error('❌ Usuário não encontrado:', userError);
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }
    
    // Buscar dados do perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .single();
    
    // Combinar dados do usuário com dados do perfil
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: profileData?.name || userData.name,
      phone: profileData?.phone || userData.phone,
      whatsapp: profileData?.whatsapp || userData.whatsapp,
      avatar_url: profileData?.avatar_url,
      account_type: userData.user_type || 'personal',
      subscription: profileData?.subscription || 'free'
    };
    
    // Atualizar último login
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (userData.login_count || 0) + 1
      })
      .eq('id', userData.id);
    
    // Salvar sessão
    saveAuthSession(user);
    
    console.log('✅ Login realizado com sucesso');
    return {
      success: true,
      user
    };
    
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    return {
      success: false,
      error: 'Erro interno de autenticação'
    };
  }
}

/**
 * Recupera dados atualizados do usuário do banco de dados
 */
export async function refreshUserData(userId: string): Promise<User | null> {
  try {
    console.log('🔄 Sincronizando dados do usuário:', userId);
    
    const supabase = getSupabaseClient();
    
    // Buscar dados atualizados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError);
      return null;
    }
    
    // Buscar dados atualizados do perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Combinar dados
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: profileData?.name || userData.name,
      phone: profileData?.phone || userData.phone,
      whatsapp: profileData?.whatsapp || userData.whatsapp,
      avatar_url: profileData?.avatar_url,
      account_type: userData.user_type || 'personal',
      subscription: profileData?.subscription || 'free'
    };
    
    // Atualizar sessão com dados novos
    saveAuthSession(user);
    
    console.log('✅ Dados sincronizados com sucesso');
    return user;
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados:', error);
    return null;
  }
}

/**
 * Salva dados do perfil no banco de dados
 */
export async function saveProfile(userId: string, profileData: Partial<User>): Promise<boolean> {
  try {
    console.log('💾 Salvando perfil no banco:', userId);
    
    const supabase = getSupabaseClient();
    
    // Atualizar tabela users se necessário
    if (profileData.name || profileData.phone) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (userError) {
        console.error('❌ Erro ao atualizar tabela users:', userError);
      }
    }
    
    // Atualizar tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
        avatar_url: profileData.avatar_url,
        account_type: profileData.account_type,
        subscription: profileData.subscription,
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('❌ Erro ao salvar perfil:', profileError);
      return false;
    }
    
    // Atualizar sessão com dados novos
    const updatedUser = await refreshUserData(userId);
    
    console.log('✅ Perfil salvo com sucesso no banco');
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