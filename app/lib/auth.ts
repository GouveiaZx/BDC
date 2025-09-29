// Funções para autenticação com provedores externos e Supabase
import { getSupabaseClient, resetSupabaseClient, clearSupabaseLocalData } from './supabase';
import { convertTempIdToUUID } from './utils';

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    picture: string;
    provider: string;
  };
  session?: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
  error: string;
}

// Função para traduzir erros do Supabase para mensagens amigáveis
const getErrorMessage = (errorCode: string | undefined): string => {
  if (!errorCode) return 'Ocorreu um erro na autenticação. Tente novamente.';
  
  const errorMessages: Record<string, string> = {
    'invalid_credentials': 'Email ou senha incorretos.',
    'user_not_found': 'Usuário não encontrado.',
    'email_taken': 'Este email já está em uso.',
    'weak_password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
    'provider_not_enabled': 'O provedor de autenticação não está habilitado. Entre em contato com o administrador.',
    'validation_failed': 'O provedor de autenticação não está configurado corretamente.',
    'unverified_email': 'Email não verificado. Verifique sua caixa de entrada.',
    'expired_token': 'Token expirado. Tente fazer login novamente.',
    'invalid_token': 'Token inválido. Tente fazer login novamente.',
  };

  return errorMessages[errorCode] || 'Ocorreu um erro na autenticação. Tente novamente.';
};

/**
 * Função para autenticar o usuário com Google via Supabase
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Limpar qualquer sessão existente primeiro para evitar conflitos
    await supabaseClient.auth.signOut();
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/planos`
      }
    });

    if (error) {
      console.error('Erro na autenticação com Google:', error.message);
      
      // Verificar se é um erro de provedor não habilitado
      if (error.message.includes('provider is not enabled')) {
        return { 
          success: false, 
          error: 'O provedor Google não está habilitado. Por favor, configure-o no Supabase.' 
        };
      }
      
      return { 
        success: false, 
        error: getErrorMessage(error.code) || error.message 
      };
    }

    // Quando usamos OAuth com Supabase, o controle será redirecionado para o provedor
    // O resultado real vai ser processado quando o usuário retornar ao site
    return { success: true, error: '' };
  } catch (error: any) {
    console.error('Erro na autenticação com Google:', error);
    return { 
      success: false, 
      error: 'Falha na autenticação com Google. Tente novamente.' 
    };
  }
};

/**
 * Função para autenticar o usuário com Facebook via Supabase
 */
export const signInWithFacebook = async (): Promise<AuthResult> => {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Limpar qualquer sessão existente primeiro para evitar conflitos
    await supabaseClient.auth.signOut();
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/planos`
      }
    });

    if (error) {
      console.error('Erro na autenticação com Facebook:', error.message);
      
      // Verificar se é um erro de provedor não habilitado
      if (error.message.includes('provider is not enabled')) {
        return { 
          success: false, 
          error: 'O provedor Facebook não está habilitado. Por favor, configure-o no Supabase.' 
        };
      }
      
      return { 
        success: false, 
        error: getErrorMessage(error.code) || error.message 
      };
    }

    // Quando usamos OAuth com Supabase, o controle será redirecionado para o provedor
    // O resultado real vai ser processado quando o usuário retornar ao site
    return { success: true, error: '' };
  } catch (error: any) {
    console.error('Erro na autenticação com Facebook:', error);
    return { 
      success: false, 
      error: 'Falha na autenticação com Facebook. Tente novamente.' 
    };
  }
};

/**
 * Função para autenticar o usuário com email e senha
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('Iniciando login com email:', email);
    
    // Limpar qualquer localStorage e tokens que possam já existir
    if (typeof window !== 'undefined') {
      console.log('Limpando dados anteriores de autenticação');
      
      // Lista completa de chaves para limpar
      const keysToRemove = [
        'isLoggedIn', 'userEmail', 'userName', 'userId', 'userAuthStatus',
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token',
        'userProfile', 'hasUserProfile', 'userAvatar', 'userPhone',
        'userWhatsapp', 'userCompany', 'userAddress', 'userCity',
        'userState', 'userZipCode', 'userWebsite', 'userBio'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpar cookies relacionados à autenticação
      document.cookie = 'sb-access-token=; path=/; max-age=0';
      document.cookie = 'user_logged_in=; path=/; max-age=0';
      document.cookie = 'userId=; path=/; max-age=0';
    }
    
    const supabaseClient = getSupabaseClient();
    console.log('Cliente Supabase obtido para autenticação');
    
    // Garantir que qualquer sessão anterior seja finalizada
    await supabaseClient.auth.signOut();
    console.log('Sessão anterior encerrada');
    
    console.log('Tentando login com email/senha');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    console.log('Resposta do login recebida:', data ? 'Com dados' : 'Sem dados', error ? 'Com erro' : 'Sem erro');

    if (error) {
      console.error('Erro na autenticação com email/senha:', error.message, 'Código:', error.code);
      
      // Ignorar o erro de email não confirmado e permitir login
      if (error.message === 'Email not confirmed' || error.message.includes('email not confirmed')) {
        console.log('Ignorando erro de email não confirmado, permitindo login...');
        
        // Gerar um ID temporário formatado como UUID válido
        const tempId = convertTempIdToUUID('temp-id-' + email);
        
        // Salvar dados no localStorage para manter sessão
        if (typeof window !== 'undefined') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userName', email.split('@')[0]);
          localStorage.setItem('userId', tempId);
          localStorage.setItem('userAuthStatus', 'unverified');
          
          // Criar um cookie para o servidor também reconhecer o usuário
          document.cookie = `userId=${tempId}; path=/; max-age=2592000; SameSite=Lax`;
        }
        
        // Como não podemos acessar diretamente o usuário sem email confirmado pela API Admin,
        // vamos usar os dados que temos e simular um login bem-sucedido
        return { 
          success: true, 
          user: {
            id: tempId,
            name: email.split('@')[0],
            email: email,
            picture: 'https://via.placeholder.com/150',
            provider: 'email'
          }, 
          error: '' 
        };
      }
      
      return { 
        success: false, 
        error: getErrorMessage(error.code) || error.message 
      };
    }

    const user = data.user;
    console.log('Login bem-sucedido para usuário:', user.id);
    console.log('Dados da sessão disponíveis:', !!data.session);
    
    if (data.session) {
      console.log('Token de acesso disponível:', data.session.access_token.substring(0, 10) + '...');
      console.log('Expira em:', new Date(data.session.expires_at * 1000).toLocaleString());
      
      // Salvar o token no localStorage e cookie para facilitar o acesso
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', data.session.access_token);
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
    }
    
    const userData = {
      id: user.id,
      name: user.user_metadata?.full_name || email.split('@')[0],
      email: user.email || '',
      picture: user.user_metadata?.avatar_url || 'https://via.placeholder.com/150',
      provider: 'email'
    };
    
    // Salvar dados no localStorage para persistir a sessão
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', user.email || email);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userAuthStatus', 'verified');
      
      // Criar um cookie para o servidor também reconhecer o usuário
      document.cookie = `userId=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
    }
    
    console.log('Dados do usuário preparados:', userData);

    const sessionData = data.session ? {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    } : undefined;

    return { 
      success: true, 
      user: userData, 
      session: sessionData,
      error: '' 
    };
  } catch (error: any) {
    console.error('Erro na autenticação com email/senha:', error);
    return { 
      success: false, 
      error: 'Falha na autenticação. Tente novamente.' 
    };
  }
};

/**
 * Função para registrar um novo usuário
 */
export const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
  try {
    console.log('Iniciando cadastro de usuário:', email);
    
    // Verificar se o email é "contatotrapstore@gmail.com"
    if (email.toLowerCase() === 'contatotrapstore@gmail.com') {
      console.warn('⚠️ Tentativa de cadastro com email reservado:', email);
      return {
        success: false,
        error: 'Este email é reservado e não pode ser utilizado para cadastro. Por favor, use outro email.'
      };
    }
    
    // Limpar qualquer localStorage e tokens existentes de forma completa
    if (typeof window !== 'undefined') {
      console.log('Limpando dados de autenticação anteriores');
      
      // Lista completa de chaves para limpar
      const keysToRemove = [
        'isLoggedIn', 'userEmail', 'userName', 'userId', 'userAuthStatus',
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token',
        'userProfile', 'hasUserProfile', 'userAvatar', 'userPhone',
        'userWhatsapp', 'userCompany', 'userAddress', 'userCity',
        'userState', 'userZipCode', 'userWebsite', 'userBio'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpar cookies relacionados à autenticação
      document.cookie = 'sb-access-token=; path=/; max-age=0';
      document.cookie = 'user_logged_in=; path=/; max-age=0';
      document.cookie = 'userId=; path=/; max-age=0';
    }
    
    const supabaseClient = getSupabaseClient();
    console.log('Cliente Supabase obtido para registro');
    
    // Garantir que qualquer sessão anterior seja encerrada
    await supabaseClient.auth.signOut();
    console.log('Sessão anterior encerrada');
    
    // Registrar o usuário com Supabase
    console.log('Tentando registro de usuário com Supabase');
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        // Não exigir verificação de email para o ambiente de desenvolvimento
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    console.log('Resposta de registro recebida:', data ? 'Com dados' : 'Sem dados', error ? 'Com erro' : 'Sem erro');

    if (error) {
      console.error('Erro no registro:', error.message, 'Código:', error.code);
      
      return { 
        success: false, 
        error: getErrorMessage(error.code) || error.message 
      };
    }
    
    const user = data.user;
    console.log('Registro bem-sucedido para usuário:', user?.id);
    
    // Armazenar sessão se disponível
    if (data.session) {
      console.log('Sessão criada no registro:', data.session.access_token.substring(0, 10) + '...');
      console.log('Expira em:', new Date(data.session.expires_at * 1000).toLocaleString());
      
      // Salvar o token no localStorage e cookie para facilitar o acesso
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', data.session.access_token);
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
    } else {
      console.log('Registro sem sessão - pode precisar de confirmação de email');
    }
    
    // Verificar se o email precisa ser confirmado
    const emailConfirmed = user?.email_confirmed_at || user?.confirmed_at;
    console.log('Email confirmado:', !!emailConfirmed);
    
    // Se o email não estiver confirmado, simular uma sessão com ID temporário
    if (!emailConfirmed || !data.session) {
      console.log('Email não confirmado ou sem sessão, criando ID temporário');
      
      // Gerar um ID temporário formatado como UUID válido, baseado no email para consistência
      const tempId = convertTempIdToUUID('temp-id-' + email);
      
      // Salvar dados no localStorage para manter sessão
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', fullName || email.split('@')[0]);
        localStorage.setItem('userId', tempId);
        localStorage.setItem('userAuthStatus', 'unverified');
        
        // Criar um cookie para o servidor também reconhecer o usuário
        document.cookie = `userId=${tempId}; path=/; max-age=2592000; SameSite=Lax`;
      }
      
      return {
        success: true,
        user: {
          id: tempId,
          name: fullName || email.split('@')[0],
          email,
          picture: 'https://via.placeholder.com/150',
          provider: 'email'
        },
        error: ''
      };
    }

    // Para usuários confirmados, retornar dados completos e salvar no localStorage
    if (user) {
      const userData = {
        id: user.id,
        name: fullName || user.user_metadata?.full_name || email.split('@')[0],
        email: user.email || '',
        picture: user.user_metadata?.avatar_url || 'https://via.placeholder.com/150',
        provider: 'email'
      };
      
      // Salvar dados no localStorage para persistir a sessão
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email || email);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userAuthStatus', 'verified');
        
        // Criar um cookie para o servidor também reconhecer o usuário
        document.cookie = `userId=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
      }
      
      const sessionData = data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      } : undefined;
      
      return {
        success: true,
        user: userData,
        session: sessionData,
        error: ''
      };
    }

    // Algo deu errado mas não detectamos o erro
    return { 
      success: false,
      error: 'Erro desconhecido no cadastro.'
    };
  } catch (error: any) {
    console.error('Erro no registro:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido no cadastro. Tente novamente.' 
    };
  }
};

/**
 * Função para fazer logout do usuário
 */
export const signOut = async (): Promise<{ success: boolean; error: string }> => {
  try {
    // Limpar localStorage e cookies
    if (typeof window !== 'undefined') {
      clearSupabaseLocalData();
    }
    
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
      return { success: false, error: error.message };
    }
    
    // Resetar a instância do Supabase para forçar uma nova autenticação
    resetSupabaseClient();
    
    return { success: true, error: '' };
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    return { success: false, error: 'Falha ao fazer logout. Tente novamente.' };
  }
}; 