import { supabaseAdmin, initializeStorage } from './supabase';
import { setupDatabase, initDatabaseIfNeeded } from './dbSetup';
import { getSupabaseAdminClient, getSupabaseClient } from './supabase';

// Variáveis globais
const isBrowser = typeof window !== 'undefined';
const CLIENT_STORAGE_KEY = 'sb-xjguzxwwydlpvudwmiyv-auth-token';

/**
 * Função para verificar se as tabelas necessárias para o funcionamento do sistema existem
 * e criar as que não existirem.
 */
export async function initializeSupabaseTables(): Promise<{ success: boolean, error?: string }> {
  try {
    console.log('Verificando tabelas do Supabase...');
    
    // Verificar se a tabela profiles existe
    const { error: profilesExistError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
    
    // Se não existir, criar a tabela
    if (profilesExistError && profilesExistError.code === '42P01') { // Código para tabela não existe
      console.log('Criando tabela profiles...');
      
      // SQL para criar tabela profiles
      const { error: createProfilesError } = await supabaseAdmin.rpc('create_profiles_table', {});
      
      if (createProfilesError) {
        console.error('Erro ao criar tabela profiles:', createProfilesError);
        return { success: false, error: 'Erro ao criar tabela profiles.' };
      }
    }
    
    // Verificar se a tabela business_profiles existe
    const { error: businessExistError } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .limit(1);
      
    // Se não existir, criar a tabela
    if (businessExistError && businessExistError.code === '42P01') {
      console.log('Criando tabela business_profiles...');
      
      // SQL para criar tabela business_profiles
      const { error: createBusinessError } = await supabaseAdmin.rpc('create_business_profiles_table', {});
      
      if (createBusinessError) {
        console.error('Erro ao criar tabela business_profiles:', createBusinessError);
        return { success: false, error: 'Erro ao criar tabela business_profiles.' };
      }
    }
    
    console.log('Tabelas verificadas com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar tabelas do Supabase:', error);
    return { success: false, error: 'Erro ao inicializar tabelas do Supabase.' };
  }
}

/**
 * Função para verificar se a função RPC para criar a tabela profiles existe
 * e criar caso não exista.
 */
export async function createProfilesTableFunction(): Promise<{ success: boolean, error?: string }> {
  try {
    // Query para criar a função que cria a tabela profiles
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_profiles_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT,
          phone TEXT,
          avatar_url TEXT,
          account_type TEXT DEFAULT 'personal',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- RLS Policies
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Public profiles are viewable by everyone."
          ON public.profiles FOR SELECT
          USING (true);
        
        CREATE POLICY "Users can update their own profile."
          ON public.profiles FOR UPDATE
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can insert their own profile."
          ON public.profiles FOR INSERT
          WITH CHECK (auth.uid() = id);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Executar a query via SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      console.error('Erro ao criar função create_profiles_table:', error);
      return { success: false, error: 'Erro ao criar função create_profiles_table.' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar função create_profiles_table:', error);
    return { success: false, error: 'Erro ao criar função create_profiles_table.' };
  }
}

/**
 * Função para verificar se a função RPC para criar a tabela business_profiles existe
 * e criar caso não exista.
 */
export async function createBusinessProfilesTableFunction(): Promise<{ success: boolean, error?: string }> {
  try {
    // Query para criar a função que cria a tabela business_profiles
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_business_profiles_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.business_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          company_name TEXT NOT NULL,
          cnpj TEXT,
          description TEXT,
          logo_url TEXT,
          banner_url TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          contact_phone TEXT,
          contact_email TEXT,
          website TEXT,
          instagram TEXT,
          facebook TEXT,
          twitter TEXT,
          established_year TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          verification_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- RLS Policies
        ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Public business profiles are viewable by everyone."
          ON public.business_profiles FOR SELECT
          USING (true);
        
        CREATE POLICY "Users can update their own business profile."
          ON public.business_profiles FOR UPDATE
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert their own business profile."
          ON public.business_profiles FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Executar a query via SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      console.error('Erro ao criar função create_business_profiles_table:', error);
      return { success: false, error: 'Erro ao criar função create_business_profiles_table.' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar função create_business_profiles_table:', error);
    return { success: false, error: 'Erro ao criar função create_business_profiles_table.' };
  }
}

/**
 * Função para criar a função exec_sql que permite executar SQL diretamente
 */
export async function createExecSQLFunction(): Promise<{ success: boolean, error?: string }> {
  try {
    // Esta operação precisa ser feita diretamente no SQL Editor do Supabase
    console.log(`
    ATENÇÃO: A função exec_sql precisa ser criada manualmente no SQL Editor do Supabase.
    
    Execute o seguinte SQL:
    
    CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar função exec_sql:', error);
    return { success: false, error: 'Erro ao criar função exec_sql.' };
  }
}

/**
 * Função para inicializar todas as configurações do Supabase
 * - Configuração das tabelas
 * - Configuração do storage (buckets)
 * - Configuração das funções SQL otimizadas
 */
export async function initializeSupabaseServices() {
  console.log('Inicializando serviços do Supabase...');
  
  try {
    // Inicializar o storage
    await initializeStorage();
    
    // Configurar o banco de dados (tabelas, funções, índices)
    await setupDatabase();
    
    console.log('Serviços do Supabase inicializados com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar serviços do Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Exporta a função de inicialização para ser usada em app/layout.tsx ou qualquer outro ponto de inicialização da aplicação
 */
export default initializeSupabaseServices; 

/**
 * Inicializa a conexão com o Supabase e configura o cliente
 * Importante: Esta função garante a persistência da autenticação entre diferentes localhosts/dispositivos
 */
export async function initializeSupabase() {
  try {
    console.log('Inicializando Supabase...');
    
    // Garantir que estamos usando o cliente admin para operações de leitura pública
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Status de autenticação:', session ? 'Usuário autenticado' : 'Sem autenticação');
    
    // Se o usuário estiver autenticado, verificar se as tabelas necessárias existem
    if (session) {
      await initDatabaseIfNeeded();
    }
    
    // Garantir que as cookies de autenticação são armazenadas corretamente
    // Isto é importante para persistência entre diferentes localhosts/dispositivos
    if (isBrowser) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Armazenar o token no localStorage com domínio específico
          try {
            localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(session));
            
            // Persistir dados críticos para identificação entre dispositivos
            localStorage.setItem('user_id', session.user?.id || '');
            localStorage.setItem('user_email', session.user?.email || '');
            
            console.log('Dados de autenticação armazenados no localStorage');
          } catch (e) {
            console.error('Erro ao armazenar dados de autenticação:', e);
          }
        }
      });
    }
    
    return { supabase, session };
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    throw error;
  }
} 