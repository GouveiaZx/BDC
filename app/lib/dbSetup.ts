import { getSupabaseAdminClient } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuração inicial do banco de dados para a aplicação
 */
export async function setupDatabase(): Promise<boolean> {
  console.log('Configurando banco de dados...');
  
  try {
    const supabase = getSupabaseAdminClient();
    
    // Verificar se já existe uma tabela básica antes de tentar criar
    const { data: existingData, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // Se a consulta funcionar, o banco já está configurado
    if (!checkError) {
      console.log('Banco de dados já configurado.');
      return true;
    }
    
    // Se há erro de API key, não tentar configurar
    if (checkError.message?.includes('Invalid API key')) {
      console.warn('Configuração do banco ignorada devido a problema de API key');
      return false;
    }
    
    console.log('Banco de dados precisa ser configurado...');
    return true;
  } catch (error) {
    console.warn('Erro ao verificar configuração do banco:', error);
    return false;
  }
}

/**
 * Cria as tabelas do banco de dados se não existirem
 */
async function setupTables(supabase: SupabaseClient): Promise<void> {
  // Criar tabela de perfis
  const { error: profilesError } = await supabase.rpc('create_profiles_table_if_not_exists');
  if (profilesError) console.error('Erro ao criar tabela de perfis:', profilesError);

  // Criar tabela de anúncios
  const { error: adsError } = await supabase.rpc('create_advertisements_table_if_not_exists');
  if (adsError) console.error('Erro ao criar tabela de anúncios:', adsError);

  // Criar tabela de destaques
  const { error: highlightsError } = await supabase.rpc('create_highlights_table_if_not_exists');
  if (highlightsError) console.error('Erro ao criar tabela de destaques:', highlightsError);
      
  // Criar tabela de visualizações
  const { error: viewsError } = await supabase.rpc('create_ad_views_table_if_not_exists');
  if (viewsError) console.error('Erro ao criar tabela de visualizações:', viewsError);

  // Criar tabela de assinaturas
  const { error: subscriptionsError } = await supabase.rpc('create_subscriptions_table_if_not_exists');
  if (subscriptionsError) console.error('Erro ao criar tabela de assinaturas:', subscriptionsError);
}

/**
 * Configura buckets de armazenamento para a aplicação
 */
async function setupStorage(supabase: SupabaseClient): Promise<void> {
  const buckets = [
    'ad-images',       // Imagens de anúncios
    'profile-images',  // Imagens de perfil
    'business-images', // Imagens de empresas/lojas
    'banners',         // Banners do site
    'highlights',      // Imagens de destaques
    'temp-uploads'     // Upload temporário
  ];

  // Criar cada bucket se não existir
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error && error.message.includes('not found')) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        console.error(`Erro ao criar bucket ${bucket}:`, createError);
      }
    }
  }
}

/**
 * Inicializa o banco de dados se necessário
 * Chamado apenas no lado do servidor durante a inicialização
 */
export async function initDatabaseIfNeeded(): Promise<boolean> {
  // Evitar inicialização durante build
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.log('Pulando inicialização do banco durante o build de produção');
    return true;
  }
  
  // Evitar inicialização no browser para reduzir logs de erro
  if (typeof window !== 'undefined') {
    console.log('Pulando inicialização do banco no browser');
    return true;
  }
  
  try {
    await setupDatabase();
    return true;
  } catch (error) {
    console.warn('Erro na inicialização do banco:', error);
    return false;
  }
} 