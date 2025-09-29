import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// ⚠️ SEGURANÇA: NUNCA faça commit de chaves de produção no código!
// Sempre use variáveis de ambiente para dados sensíveis

// Credenciais do Supabase - SEMPRE usar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis essenciais estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  logger.error(`❌ ERRO: Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(', ')}`);
  logger.error('Configure as variáveis no arquivo .env.local ou no ambiente de produção');

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Configuração obrigatória ausente: ${missingVars.join(', ')}`);
  }
}

// Log seguro para debugging (sem expor chaves)
logger.debug('Configurações do Supabase carregadas:', {
  url: supabaseUrl ? 'Configurada' : 'Não configurada',
  anonKey: supabaseAnonKey ? 'Configurada' : 'Não configurada',
  adminKey: supabaseAdminKey ? 'Configurada' : 'Não configurada'
});

// Storage keys para autenticação - usar chaves únicas para evitar conflitos
const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.split('//')[1] || 'bdc-default';
const CLIENT_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;
const CLIENT_ADMIN_STORAGE_KEY = `sb-${PROJECT_REF}-admin-auth-token`;

// Singleton pattern otimizado
let _supabaseClient: SupabaseClient | null = null;
let _supabaseAdminClient: SupabaseClient | null = null;

// Timeout otimizado para operações com o Supabase (5s ao invés de 15s)
const SUPABASE_TIMEOUT = 5000;


// Função simplificada para verificar conexão com Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      logger.warn('Erro ao verificar conexão com Supabase:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    logger.error('Exceção ao verificar conexão com Supabase:', e);
    return false;
  }
}

/**
 * Diagnóstico simplificado da conexão com Supabase
 */
export async function diagnoseAndRecoverConnection(): Promise<{ success: boolean; error?: string }> {
  logger.debug('Iniciando diagnóstico de conexão com Supabase...');
  
  try {
    // Resetar cliente para forçar nova conexão
    _supabaseClient = null;
    const testClient = getSupabaseClient();
    
    // Testar com query simples
    const { error } = await testClient.from('profiles').select('id').limit(1);
        
    if (error) {
      logger.error('Cliente Supabase com erro:', error);
      return { success: false, error: error.message };
    }
    
    logger.debug('Cliente Supabase funcional: OK');
    return { success: true };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logger.error('Exceção ao testar cliente Supabase:', e);
    return { success: false, error: errorMsg };
  }
}

// Configurar auth listener simplificado
const setupAuthListener = (client: SupabaseClient) => {
  client.auth.onAuthStateChange((event, session) => {
    logger.debug('Evento de auth:', event, session ? 'Com sessão' : 'Sem sessão');
  });
};

/**
 * Cliente Supabase otimizado - Singleton pattern simplificado
 * @returns Cliente Supabase
 */
export function getSupabaseClient(): SupabaseClient {
  // Se o cliente já existe e é válido, retornar imediatamente
  if (_supabaseClient && typeof _supabaseClient.from === 'function') {
    return _supabaseClient;
  }

  // Verificar configurações básicas
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configurações Supabase não encontradas');
  }

  logger.debug('[SUPABASE] Criando novo cliente');
  
  try {
    // Criar cliente com configurações otimizadas
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: CLIENT_STORAGE_KEY,
        flowType: 'pkce'
      },
      global: {
        fetch: (url, options: any = {}) => {
          // Timeout reduzido para 5s
          const timeoutController = new AbortController();
          const timeoutId = setTimeout(() => timeoutController.abort(), SUPABASE_TIMEOUT);
          
          // Adicionar token de auth se disponível
          if (typeof window !== 'undefined' && !options.headers?.['Authorization']) {
            const accessToken = localStorage.getItem('sb-access-token');
            if (accessToken) {
              options.headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
            }
          }
          
          return fetch(url, { ...options, signal: timeoutController.signal })
            .finally(() => clearTimeout(timeoutId));
        }
      }
    });

    // Configurar auth listener apenas no browser
    if (typeof window !== 'undefined') {
      setupAuthListener(_supabaseClient);
    }

    logger.debug('[SUPABASE] Cliente criado com sucesso');
    return _supabaseClient;
  } catch (error) {
    logger.error('[SUPABASE] Erro ao criar cliente:', error);
    
    // Fallback simples
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storageKey: CLIENT_STORAGE_KEY + '_fallback_' + Date.now() }
    });
    
    return _supabaseClient;
  }
}

/**
 * Cria um cliente Supabase com escopo de administrador
 * @returns Cliente Supabase com permissões de admin
 */
export function getSupabaseAdminClient(): SupabaseClient {
  // Usar singleton para evitar múltiplas instâncias
  if (_supabaseAdminClient) {
    return _supabaseAdminClient;
  }

  try {
    // Verificar se as configurações estão disponíveis
    if (!supabaseUrl || !supabaseAdminKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseAdminKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      throw new Error(`Service role key obrigatória para cliente admin. Variáveis ausentes: ${missingVars.join(', ')}`);
    }
    
    _supabaseAdminClient = createClient(supabaseUrl, supabaseAdminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': supabaseAdminKey
        }
      }
    });
    
    return _supabaseAdminClient;
    
  } catch (error) {
    console.error('❌ [ADMIN-CLIENT] Erro ao criar cliente:', error);
    throw error;
  }
}

/**
 * Criar um cliente offline que não faz requisições reais
 * @returns Cliente Supabase offline
 */
function createOfflineClient(): SupabaseClient {
  // Criar um mock do cliente Supabase que não faz requisições reais
  const mockClient: any = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          limit: () => ({
            order: () => ({
              then: (cb: Function) => cb({ data: [], error: null })
            })
          }),
          then: (cb: Function) => cb({ data: [], error: null })
        }),
        order: () => ({
          limit: () => ({
            then: (cb: Function) => cb({ data: [], error: null })
          })
        }),
        limit: () => ({
          order: () => ({
            then: (cb: Function) => cb({ data: [], error: null })
          })
        }),
        then: (cb: Function) => cb({ data: [], error: null })
      }),
      insert: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null }),
      update: () => ({
        eq: () => ({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => ({ data: null, error: null })
      })
    }),
    rpc: () => ({ data: null, error: null }),
    auth: {
      onAuthStateChange: () => {},
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'offline-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '/images/placeholder.png' } }),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: null, error: null })
      }),
      listBuckets: async () => ({ data: [], error: null }),
      getBucket: async () => ({ data: null, error: null }),
      createBucket: async () => ({ data: null, error: null })
    },
    rest: {
      headers: {}
    }
  }
  
  return mockClient as SupabaseClient
}

/**
 * Verificar e criar buckets do storage se necessário
 */
async function checkAndCreateBuckets(supabase: SupabaseClient) {
  try {
    // Listar buckets existentes
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Erro ao verificar buckets:', error)
      return
    }
    
    // Verificar nomes dos buckets disponíveis
    const bucketNames = buckets ? buckets.map(b => b.name) : [];
    console.log('Buckets disponíveis:', bucketNames.join(', ') || 'nenhum')
    
        // Verificar se bucket public existe
    if (!bucketNames.includes('public')) {
      console.log('Bucket public não encontrado, mas buckets já foram criados via migração SQL');
    } else {
      console.log('Bucket public já existe.');
    }
    
    return true;
  } catch (e) {
    console.error('Erro ao verificar/criar buckets:', e);
    // Falha silenciosa para permitir o uso offline
    return false;
  }
}

// Exportar cliente Supabase para compatibilidade com código existente
export const supabaseClient = getSupabaseClient()

// Exportar supabaseAdmin apenas se não estivermos no browser
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdminClient() : null as any

// Exporta a instância do cliente para uso direto em outros módulos
export const supabase = getSupabaseClient()

/**
 * Limpa os dados do Supabase do localStorage e cookies
 */
export function clearSupabaseLocalData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem(CLIENT_STORAGE_KEY);
    localStorage.removeItem(CLIENT_ADMIN_STORAGE_KEY);
    document.cookie = 'sb-access-token=; path=/; max-age=0';
  }
}

/**
 * Reseta a instância do cliente Supabase para forçar sua recriação
 */
export function resetSupabaseClient() {
  _supabaseClient = null;
  _supabaseAdminClient = null;
}

/**
 * Inicializa o storage do Supabase, verificando e criando buckets necessários
 */
export async function initializeStorage() {
  try {
    const client = getSupabaseClient();
    await checkAndCreateBuckets(client);
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar storage:', error);
    return { success: false, error };
  }
}

// Status de conexão com Supabase
const connectionStatus = {
  isOffline: false,
  lastCheck: Date.now()
};

// Função interna para verificar conexão (usa a função exportada)
async function checkSupabaseConnectionInternal() {
  const isConnected = await checkSupabaseConnection();
  connectionStatus.isOffline = !isConnected;
  connectionStatus.lastCheck = Date.now();
  return isConnected;
}

// Exportar status de conexão
export const getConnectionStatus = () => ({ ...connectionStatus });

// Verificar periodicamente a conexão com Supabase (a cada 30s)
if (typeof window !== 'undefined') {
  setInterval(async () => {
    if (connectionStatus.isOffline) {
      await checkSupabaseConnectionInternal();
    }
  }, 30000);
} 

// Função para verificar e renovar a sessão de autenticação
export async function checkAndRefreshSession(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Verificar se há uma sessão válida
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError);
      return false;
    }
    
    if (!sessionData.session) {
      console.warn('Sem sessão ativa no Supabase');
      return false;
    }
    
    const session = sessionData.session;
    
    // Verificar se o token está próximo de expirar (menos de 10 minutos)
    const expiresAt = session.expires_at; // timestamp em segundos
    const now = Math.floor(Date.now() / 1000); // timestamp atual em segundos
    const timeToExpire = expiresAt - now;
    
    // Se o token vai expirar em menos de 10 minutos (600 segundos), renovar
    if (timeToExpire < 600) {
      console.log('Token prestes a expirar, renovando...');
      
      // Tentar renovar o token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        return false;
      }
      
      if (refreshData.session) {
        console.log('Token renovado com sucesso');
        return true;
      } else {
        console.warn('Falha ao renovar token');
        return false;
      }
    }
    
    // Se o token ainda é válido por mais de 10 minutos
    return true;
  } catch (error) {
    console.error('Erro ao verificar/renovar sessão:', error);
    return false;
  }
}

// POLLING REMOVIDO: O polling de conexão a cada 30s foi removido para melhorar performance
// Em caso de erro de conexão, a aplicação tentará reconectar automaticamente nas próximas requisições

// Exportar função para obter o cliente autenticado com checagem de token
export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  const supabase = getSupabaseClient();
  
  // Verificar e renovar sessão se necessário
  await checkAndRefreshSession(supabase);
  
  return supabase;
}

// POLLING REMOVIDO: O polling de conexão a cada 30s foi removido para melhorar performance
// Em caso de erro de conexão, a aplicação tentará reconectar automaticamente nas próximas requisições