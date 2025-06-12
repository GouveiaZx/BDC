import { getSupabaseAdminClient } from '../../lib/supabase';

// Script para criar ou atualizar o schema da tabela advertisements
// Este arquivo serve como referência para o schema correto da tabela

export async function setupAdvertisementsTable() {
  try {
    console.log('Iniciando configuração da tabela advertisements...');
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      console.error('Falha ao obter cliente Supabase Admin');
      return { success: false, error: 'Falha ao obter cliente Supabase Admin' };
    }
    
    // Verificar se a tabela existe
    const { data: tablesData, error: tablesError } = await supabase.from('advertisements').select('id').limit(1);
    
    if (tablesError && tablesError.code === '42P01') { // Código para "tabela não existe"
      console.log('Tabela advertisements não existe, criando...');
      
      // SQL para criar a tabela
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.advertisements (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT,
          price NUMERIC(10,2) DEFAULT 0,
          category TEXT,
          sub_category TEXT,
          images TEXT[],
          location TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          phone TEXT,
          whatsapp TEXT,
          show_phone BOOLEAN DEFAULT true,
          is_free_ad BOOLEAN DEFAULT false,
          is_featured BOOLEAN DEFAULT false,
          moderation_status TEXT DEFAULT 'pending',
          moderation_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          moderated_at TIMESTAMP WITH TIME ZONE,
          user_id UUID,
          user_name TEXT,
          user_avatar TEXT,
          views INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          status TEXT DEFAULT 'inactive',
          expires_at TIMESTAMP WITH TIME ZONE,
          seller_type TEXT DEFAULT 'personal'
        );
        
        CREATE INDEX IF NOT EXISTS idx_advertisements_user_id ON public.advertisements(user_id);
        CREATE INDEX IF NOT EXISTS idx_advertisements_moderation_status ON public.advertisements(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_advertisements_status ON public.advertisements(status);
        CREATE INDEX IF NOT EXISTS idx_advertisements_category ON public.advertisements(category);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('Erro ao criar tabela advertisements:', createError);
        return { success: false, error: `Erro ao criar tabela: ${createError.message}` };
      }
      
      console.log('Tabela advertisements criada com sucesso');
      return { success: true, message: 'Tabela advertisements criada com sucesso' };
    }
    
    // Verificar se precisa atualizar a tabela (adicionar colunas faltantes)
    const { data, error } = await supabase.from('advertisements').select('*').limit(1);
    
    if (error) {
      console.error('Erro ao verificar estrutura da tabela:', error);
      return { success: false, error: `Erro ao verificar estrutura: ${error.message}` };
    }
    
    const sample = data && data.length > 0 ? data[0] : null;
    
    if (!sample) {
      console.log('Nenhum registro encontrado na tabela advertisements');
      return { success: true, message: 'Tabela existe mas não tem dados' };
    }
    
    const columns = Object.keys(sample);
    
    // Colunas que devem existir na tabela
    const requiredColumns = [
      'moderation_status',
      'moderation_reason',
      'moderated_at',
      'status'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`Adicionando colunas faltantes: ${missingColumns.join(', ')}`);
      
      // Adicionar colunas faltantes
      const alterTableSQL = `
        ${missingColumns.includes('moderation_status') ? 
          "ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending';" : ''}
        ${missingColumns.includes('moderation_reason') ? 
          "ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS moderation_reason TEXT;" : ''}
        ${missingColumns.includes('moderated_at') ? 
          "ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;" : ''}
        ${missingColumns.includes('status') ? 
          "ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive';" : ''}
      `;
      
      const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
      
      if (alterError) {
        console.error('Erro ao adicionar colunas faltantes:', alterError);
        return { success: false, error: `Erro ao adicionar colunas: ${alterError.message}` };
      }
      
      console.log('Colunas adicionadas com sucesso');
      return { success: true, message: `Colunas adicionadas: ${missingColumns.join(', ')}` };
    }
    
    console.log('Tabela advertisements já possui todas as colunas necessárias');
    return { success: true, message: 'Tabela já possui todas as colunas necessárias' };
  } catch (error) {
    console.error('Erro ao configurar tabela advertisements:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// API para executar o setup (pode ser chamada por uma rota administrativa)
export async function runDatabaseSetup() {
  const result = await setupAdvertisementsTable();
  console.log('Resultado do setup da tabela advertisements:', result);
  return result;
} 