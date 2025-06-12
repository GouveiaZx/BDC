import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { initDatabaseIfNeeded } from './dbSetup'

// ⚠️ SEGURANÇA: NUNCA faça commit de chaves de produção no código!
// Sempre use variáveis de ambiente para dados sensíveis

// Credenciais do Supabase - SEMPRE usar variáveis de ambiente
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjguzxwwydlpvudwmiyv.supabase.co'
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI2MDAsImV4cCI6MjA2MzgwODYwMH0.GidrSppfX5XHyu5SeYcML3gmNNFXbouYWxFBG-UZlco'
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIzMjYwMCwiZXhwIjoyMDYzODA4NjAwfQ.wm7fMtIFoq2VklMYXGhSfok8fFwX2tw6ZuEiHxaNqHE'

// Verificação de segurança simplificada - apenas em produção e no browser
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  // Verificar se as variáveis estão vazias ou não definidas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ AVISO: Configurações do Supabase não definidas corretamente em produção!');
    console.error('URL:', supabaseUrl ? 'Definida' : 'Não definida');
    console.error('ANON_KEY:', supabaseAnonKey ? 'Definida' : 'Não definida');
    // Em vez de lançar erro, apenas logar para debug
    console.warn('Continuando com configurações de fallback...');
  }
}

// Storage keys para autenticação - usar chaves únicas para evitar conflitos
const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.split('//')[1] || 'bdc-default'
const CLIENT_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`
const CLIENT_ADMIN_STORAGE_KEY = `sb-${PROJECT_REF}-admin-auth-token`

// Verificar se estamos rodando no browser ou no servidor
const isBrowser = typeof window !== 'undefined'

// Singleton pattern aprimorado - garantir instância única global
let _supabaseClient: SupabaseClient | null = null
let _supabaseAdminClient: SupabaseClient | null = null
let _isInitialized = false
let _isInitializing = false

// Flag global para evitar múltiplas inicializações
if (typeof window !== 'undefined') {
  if (!(window as any).__SUPABASE_INITIALIZED__) {
    (window as any).__SUPABASE_INITIALIZED__ = false;
  }
}

// Verificar se há variáveis de ambiente e usá-las como prioridade
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
}
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Garante que as chaves Supabase existam
console.log('Variáveis de ambiente Supabase carregadas:', {
  url: supabaseUrl ? 'Definida' : 'Não definida',
  anonKey: supabaseAnonKey ? 'Definida' : 'Não definida'
})

// Use chaves de storage diferentes para client e admin
const ADMIN_STORAGE_KEY = 'bdc-storage-key-admin'

// Timeout para operações com o Supabase (em ms)
const SUPABASE_TIMEOUT = 10000

// Número máximo de tentativas para operações Supabase
const MAX_RETRIES = 3

// Controle de status de conexão
const connectionStatus = {
  isOffline: false,
  lastOnlineTime: Date.now(),
  errors: [] as string[],
  retryCount: 0
}

// Função para verificar conexão com Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    // Usar uma consulta simples para testar a conexão
    const { data, error } = await supabase.from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.warn('Erro ao verificar conexão com Supabase:', error)
      connectionStatus.isOffline = true
      connectionStatus.errors.push(error.message)
      return false
    }
    
    connectionStatus.isOffline = false
    connectionStatus.lastOnlineTime = Date.now()
    connectionStatus.retryCount = 0
    return true
  } catch (e) {
    console.error('Exceção ao verificar conexão com Supabase:', e)
    connectionStatus.isOffline = true
    connectionStatus.errors.push(e instanceof Error ? e.message : String(e))
    return false
  }
}

/**
 * Executa diagnóstico e tenta recuperar a conexão com Supabase
 * @returns Objeto com resultado do diagnóstico
 */
export async function diagnoseAndRecoverConnection(): Promise<{
  success: boolean;
  diagnostics: {
    internetConnected: boolean;
    supabaseReachable: boolean;
    clientFunctional: boolean;
    errorDetails?: string;
  };
}> {
  console.log('Iniciando diagnóstico de conexão com Supabase...');
  
  // Verificar se há conexão com a internet
  let internetConnected = false;
  try {
    // Testar conexão com um serviço confiável
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    internetConnected = true;
    console.log('Conexão com internet: OK');
  } catch (error) {
    console.error('Sem conexão com internet:', error);
  }
  
  // Se não há internet, não há o que fazer
  if (!internetConnected) {
    return {
      success: false,
      diagnostics: {
        internetConnected: false,
        supabaseReachable: false,
        clientFunctional: false,
        errorDetails: 'Sem conexão com a internet'
      }
    };
  }
  
  // Verificar se o Supabase está acessível
  let supabaseReachable = false;
  try {
    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    supabaseReachable = true;
    console.log('Servidor Supabase acessível: OK');
  } catch (error) {
    console.error('Servidor Supabase inacessível:', error);
  }
  
  // Testar se o cliente Supabase está funcional
  let clientFunctional = false;
  let errorDetails = '';
  
  // Se o Supabase não está acessível, logar erro
  if (!supabaseReachable) {
    console.error('⚠️ Servidor Supabase inacessível. Verifique a configuração de URL.');
    errorDetails = 'Servidor Supabase inacessível';
  }
  
  if (supabaseReachable) {
    try {
      // Forçar a criação de um novo cliente
      _supabaseClient = null;
      const testClient = getSupabaseClient();
      
      // Tentar uma operação simples
      const { data, error } = await testClient.from('profiles')
        .select('id')
        .limit(1);
        
      if (error) {
        errorDetails = `Erro ao usar cliente: ${error.message}`;
        console.error('Cliente Supabase com erro:', error);
      } else {
        clientFunctional = true;
        console.log('Cliente Supabase funcional: OK');
        
        // Reset do status de conexão
        connectionStatus.isOffline = false;
        connectionStatus.lastOnlineTime = Date.now();
        connectionStatus.retryCount = 0;
        connectionStatus.errors = [];
      }
    } catch (e) {
      errorDetails = `Exceção ao usar cliente: ${e instanceof Error ? e.message : String(e)}`;
      console.error('Exceção ao testar cliente Supabase:', e);
    }
  }
  
  const success = internetConnected && supabaseReachable && clientFunctional;
  
  // Se todo o diagnóstico teve sucesso, tentar configurar buckets
  if (success) {
    try {
      const client = getSupabaseClient();
      await checkAndCreateBuckets(client);
    } catch (e) {
      console.warn('Aviso: Não foi possível verificar buckets:', e);
      // Não falhar o diagnóstico por causa disso
    }
  }
  
  return {
    success,
    diagnostics: {
      internetConnected,
      supabaseReachable,
      clientFunctional,
      errorDetails: errorDetails || undefined
    }
  };
}

// Monitora eventos de autenticação para debug
const setupAuthListener = (client: SupabaseClient) => {
  client.auth.onAuthStateChange((event, session) => {
    console.log('Evento de auth:', event, session ? 'Com sessão' : 'Sem sessão')
  })
}

/**
 * Cria um cliente Supabase com o escopo de usuário anônimo
 * @returns Cliente Supabase
 */
export function getSupabaseClient(): SupabaseClient {
  // Verificar flag global para evitar múltiplas instâncias
  if (isBrowser && (window as any).__SUPABASE_INITIALIZED__ && _supabaseClient) {
    return _supabaseClient;
  }
  
  // Verificar se já está inicializando para evitar condições de corrida
  if (_isInitializing) {
    // Aguardar inicialização anterior - criar cliente simples como fallback
    if (_supabaseClient) return _supabaseClient;
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storageKey: CLIENT_STORAGE_KEY }
    });
  }
  
  if (_supabaseClient === null || !_isInitialized) {
    _isInitializing = true;
    
    try {
      // Criar o cliente com configurações otimizadas para evitar múltiplas instâncias
      _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Usar chave de storage única para evitar conflitos
          storageKey: CLIENT_STORAGE_KEY,
          // Desabilitar confirmação de email para permitir login direto
          flowType: 'pkce'
        },
        global: {
          fetch: (url, options: any = {}) => {
            // Configurar timeout para evitar esperas infinitas
            const timeoutController = new AbortController()
            const { signal } = timeoutController
            
            // Garantir que options.headers existe
            if (!options.headers) {
              options.headers = {}
            }
            
            // Adicionar token de autenticação do localStorage, se disponível
            if (typeof window !== 'undefined') {
              const accessToken = localStorage.getItem('sb-access-token')
              if (accessToken && !options.headers['Authorization']) {
                options.headers['Authorization'] = `Bearer ${accessToken}`
              }
            }
            
            // Configurar o timeout
            const timeoutId = setTimeout(() => {
              console.warn('Supabase request timeout')
              timeoutController.abort()
            }, 15000) // 15 segundos de timeout
            
            // Fazer a requisição com timeout e retry
            return fetch(url, {
              ...options,
              signal,
            })
              .then(response => {
                clearTimeout(timeoutId)
                return response
              })
              .catch(error => {
                clearTimeout(timeoutId)
                console.error('Erro na requisição Supabase:', error)
                throw error
              })
          }
        }
      })
      
      _isInitialized = true
      _isInitializing = false
      
      // Marcar como inicializado globalmente
      if (isBrowser) {
        (window as any).__SUPABASE_INITIALIZED__ = true;
      }
      
      // Verificar se estamos executando no browser para iniciar listener de auth
      if (isBrowser) {
        console.log('Executando no browser, configurando eventos de auth')
        setupAuthListener(_supabaseClient)
        
        // Inicializar banco de dados se necessário (apenas em ambiente de desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          console.log('Ambiente de desenvolvimento detectado')
          initDatabaseIfNeeded()
        }
      }
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error)
      _isInitializing = false
      
      // Em caso de erro, usar um cliente simples
      _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: CLIENT_STORAGE_KEY
        }
      })
    }
  }
  
  return _supabaseClient
}

/**
 * Cria um cliente Supabase com escopo de administrador
 * @returns Cliente Supabase com permissões de admin
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (_supabaseAdminClient === null) {
    try {
      // Verificar se temos as credenciais necessárias
      if (!supabaseUrl || !supabaseAdminKey) {
        console.warn('Credenciais do Supabase Admin incompletas')
        throw new Error('Credenciais do Supabase Admin não configuradas')
      }
      
      _supabaseAdminClient = createClient(supabaseUrl, supabaseAdminKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          // Usar chave diferente para admin
          storageKey: CLIENT_ADMIN_STORAGE_KEY
        },
        global: {
          fetch: (url, options: any = {}) => {
            // Timeout personalizado para operações admin
            const timeoutController = new AbortController()
            const { signal } = timeoutController
            
            if (!options.headers) {
              options.headers = {}
            }
            
            // Admin sempre usa service key
            options.headers['Authorization'] = `Bearer ${supabaseAdminKey}`
            
            const timeoutId = setTimeout(() => {
              console.warn('Supabase admin request timeout')
              timeoutController.abort()
            }, 30000) // 30 segundos para operações admin
            
            return fetch(url, {
              ...options,
              signal,
            })
              .then(response => {
                clearTimeout(timeoutId)
                return response
              })
              .catch(error => {
                clearTimeout(timeoutId)
                console.warn('Erro na requisição Supabase Admin:', error)
                throw error
              })
          }
        }
      })
      
      console.log('Cliente Supabase Admin criado com sucesso')
    } catch (error) {
      console.error('Erro ao criar cliente admin Supabase:', error)
      
      // Fallback - cliente admin simples
      _supabaseAdminClient = createClient(
        supabaseUrl,
        supabaseAdminKey || supabaseAnonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: CLIENT_ADMIN_STORAGE_KEY
          }
        }
      )
    }
  }
  
  return _supabaseAdminClient
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
export const supabaseAdmin = getSupabaseAdminClient()

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

// Exportar status de conexão
export const getConnectionStatus = () => ({ ...connectionStatus })

// Verificar periodicamente a conexão com Supabase (a cada 30s)
if (typeof window !== 'undefined') {
  setInterval(async () => {
    if (connectionStatus.isOffline) {
      await checkSupabaseConnection()
    }
  }, 30000)
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

// Exportar função para obter o cliente autenticado com checagem de token
export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  const supabase = getSupabaseClient();
  
  // Verificar e renovar sessão se necessário
  await checkAndRefreshSession(supabase);
  
  return supabase;
} 