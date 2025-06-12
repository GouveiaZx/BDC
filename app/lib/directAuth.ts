// Funções para autenticação direta via APIs locais
import { getSupabaseClient, clearSupabaseLocalData } from './supabase';
import { clearAuthData, saveAuthData } from './authUtils';

// Interface de resultado
interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    provider?: string;
  };
  session?: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
  error: string;
}

/**
 * Faz login usando a API local híbrida
 */
export const directLogin = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    console.log('Iniciando login direto híbrido:', email);
    
    // Usar nossa API local de login
    const functionUrl = `/api/auth/login`;
    
    console.log('Enviando requisição para API de login:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      credentials: 'same-origin'
    });
    
    console.log('Resposta da API de login recebida, status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta da API de login:', errorData);
      
      return {
        success: false,
        error: errorData.error || 'Erro no login. Verifique suas credenciais.'
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Login não foi bem-sucedido:', data.error);
      return {
        success: false,
        error: data.error || 'Erro no login. Verifique suas credenciais.'
      };
    }
    
    console.log('Login realizado com sucesso via API híbrida!');
    
    // Salvar dados de autenticação
    if (data.user && data.token) {
      saveAuthData(data.user, data.token);
    }
    
    return {
      success: true,
      user: data.user,
      session: data.session,
      error: ''
    };
    
  } catch (error: any) {
    console.error('Erro na função de login direto:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado durante o login. Tente novamente mais tarde.'
    };
  }
};

/**
 * Registra um usuário usando a API local
 */
export const directRegister = async (
  email: string,
  password: string,
  name: string,
  accountType: string = 'proprietario'
): Promise<AuthResult> => {
  try {
    console.log('Iniciando registro direto:', email);
    
    // IMPORTANTE: Verificar e bloquear o uso do email "contatotrapstore@gmail.com"
    if (email.toLowerCase() === 'contatotrapstore@gmail.com') {
      console.warn('⚠️ Tentativa de usar email reservado:', email);
      return {
        success: false,
        error: 'Este email já está em uso e é reservado. Por favor, utilize outro email para seu cadastro.'
      };
    }
    
    // Limpar dados de autenticação anteriores
    if (typeof window !== 'undefined') {
      clearSupabaseLocalData();
      clearLocalAuthData();
    }
    
    // Usar nossa API local em vez da edge function do Supabase
    const functionUrl = `/api/auth/register`;
    
    console.log('Enviando requisição para API local:', functionUrl);
    
    try {
      // Configurar um controlador de timeout para abortar operações que demoram muito
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
      
      // Chamar a API local com cabeçalhos otimizados e controle de timeout
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Custom-Request-Time': new Date().getTime().toString()
        },
        body: JSON.stringify({
          email,
          password,
          name,
          accountType
        }),
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'same-origin'
      });
      
      // Limpar o timeout após receber a resposta
      clearTimeout(timeoutId);
      
      console.log('Resposta da API recebida, status:', response.status);
      
      // Tentar obter a resposta JSON com tratamento de erros
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Erro ao analisar resposta JSON:', parseError);
        return {
          success: false,
          error: 'Erro ao processar resposta do servidor. Tente novamente em alguns minutos.'
        };
      }
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error('Erro na resposta da API:', data);
        
        // Tratar erro específico de email já em uso
        if (data?.error && (
            data.error.includes('email já está em uso') || 
            data.error.includes('already') || 
            data.error.includes('duplicate')
           )) {
          return {
            success: false,
            error: 'Este email já está em uso. Por favor, use outro email ou faça login.'
          };
        }
        
        // Tratar erro específico de banco de dados
        if (data?.error && (
            data.error.includes('database') || 
            data.error.includes('Database') ||
            data.error.includes('checking email')
           )) {
          return {
            success: false,
            error: 'Erro temporário no banco de dados. Por favor, tente novamente em alguns instantes.'
          };
        }
        
        // Retornar o erro da API ou um erro padrão
        return {
          success: false,
          error: data?.error || getErrorMessageForStatus(response.status)
        };
      }
      
      // Verificar se a operação foi bem-sucedida
      if (!data.success) {
        console.error('Resposta da API indicou erro:', data);
        return {
          success: false,
          error: data.error || 'Erro não especificado no registro. Tente novamente.'
        };
      }
      
      // Sucesso: temos usuário e sessão
      if (data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name || name,
          email: data.user.email || email
        };
        
        console.log('Usuário registrado com sucesso:', userData.email);
        
        // Salvar dados no navegador
        if (typeof window !== 'undefined') {
          // Salvar dados de autenticação usando o utilitário
          if (data.token) {
            saveAuthData(userData, data.token);
          } else {
            console.warn('Token não disponível após registro');
          }
        }
        
        return {
          success: true,
          user: userData,
          session: data.session ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          } : undefined,
          error: ''
        };
      }
      
      // Resposta inesperada
      console.error('Resposta em formato inesperado:', data);
      return {
        success: false,
        error: 'Resposta em formato inesperado. Tente novamente ou contate o suporte.'
      };
      
    } catch (fetchError: any) {
      // Identificar o tipo específico de erro
      if (fetchError.name === 'AbortError') {
        console.error('Timeout na requisição de registro');
        return {
          success: false,
          error: 'Tempo limite excedido. O servidor está demorando para responder. Tente novamente mais tarde.'
        };
      }
      
      console.error('Erro na requisição de registro:', fetchError);
      return {
        success: false,
        error: fetchError.message || 'Falha na conexão com o servidor. Tente novamente em alguns instantes.'
      };
    }
  } catch (error: any) {
    console.error('Erro na função de registro direto:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado durante o cadastro. Tente novamente mais tarde.'
    };
  }
};

/**
 * Salva o token de autenticação nos locais necessários
 */
function saveAuthToken(accessToken: string, refreshToken?: string) {
  // Local Storage
  localStorage.setItem('sb-access-token', accessToken);
  if (refreshToken) {
    localStorage.setItem('sb-refresh-token', refreshToken);
  }
  
  // Cookies para uso no lado do servidor
  const maxAge = 30 * 24 * 60 * 60; // 30 dias em segundos
  document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_logged_in=true; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Salva os dados do usuário no localStorage
 */
function saveUserData(userData: { id: string, name: string, email: string }) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', userData.email);
  localStorage.setItem('userName', userData.name);
  localStorage.setItem('userId', userData.id);
  localStorage.setItem('userAuthStatus', 'verified');
}

/**
 * Limpa dados de autenticação salvos no navegador
 */
function clearLocalAuthData() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userAuthStatus');
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('sb-refresh-token');
  
  // Limpar cookies
  document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Retorna uma mensagem de erro apropriada para o código de status HTTP
 */
function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Dados de cadastro inválidos. Verifique as informações e tente novamente.';
    case 401:
      return 'Não autorizado. Verifique suas credenciais.';
    case 403:
      return 'Acesso negado. Você não tem permissão para realizar esta operação.';
    case 404:
      return 'Servidor de autenticação não encontrado. Tente novamente mais tarde.';
    case 409:
      return 'Conflito - este email já pode estar cadastrado.';
    case 429:
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Erro interno no servidor. Por favor, tente novamente mais tarde.';
    default:
      return `Erro no cadastro (${status}). Tente novamente.`;
  }
} 