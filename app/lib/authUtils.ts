/**
 * Utilitários para autenticação e verificação de tokens
 */

export interface TokenData {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}

/**
 * Verifica se um token é válido
 */
export function verifyToken(token: string): TokenData | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar se o token expirou
    if (decoded.exp && Date.now() > decoded.exp) {
      console.log('Token expirou');
      return null;
    }
    
    // Verificar se tem os campos necessários
    if (!decoded.userId || !decoded.email) {
      console.log('Token inválido - dados faltando');
      return null;
    }
    
    return decoded as TokenData;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Limpa todos os dados de autenticação
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Limpar localStorage
  const authKeys = [
    'isLoggedIn', 'userEmail', 'userName', 'userId', 'userAuthStatus',
    'sb-access-token', 'sb-refresh-token', 'supabase.auth.token',
    'userProfile', 'hasUserProfile', 'userAvatar', 'userPhone',
    'userWhatsapp', 'userCompany', 'userAddress', 'userCity',
    'userState', 'userZipCode', 'userWebsite', 'userBio', 'accountType'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Limpar cookies
  const cookiesToClear = [
    'auth_token', 'sb-access-token', 'user_logged_in', 'userId'
  ];
  
  cookiesToClear.forEach(cookie => {
    document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  });
}

/**
 * Salva dados de autenticação no navegador
 */
export function saveAuthData(user: any, token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Salvar no localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userAuthStatus', 'authenticated');
    localStorage.setItem('auth_token', token);
    
    if (user.user_type) {
      localStorage.setItem('accountType', user.user_type);
    }
    
    // Salvar cookie com expiração adequada
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 dias
    
    document.cookie = `auth_token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
    document.cookie = `user_logged_in=true; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    document.cookie = `userId=${user.id}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    
    console.log('✅ Dados de autenticação salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar dados de autenticação:', error);
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  const tokenData = verifyToken(token);
  return tokenData !== null;
}

/**
 * Obtém dados do usuário autenticado
 */
export function getAuthenticatedUser(): TokenData | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Redireciona para login se não autenticado
 */
export function requireAuth(redirectTo: string = '/auth'): boolean {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return false;
  }
  return true;
}

/**
 * Faz logout completo
 */
export async function logout(): Promise<void> {
  try {
    // Chamar API de logout se existir
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {}); // Ignorar erros de rede
    
  } catch (error) {
    console.log('Erro ao chamar API de logout, continuando...');
  } finally {
    // Sempre limpar dados locais
    clearAuthData();
    
    // Redirecionar para página inicial
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
} 