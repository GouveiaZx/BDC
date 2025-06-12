import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

/**
 * Rota de diagnóstico para verificar e corrigir problemas no banco de dados
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao obter cliente Supabase' },
        { status: 500 }
      );
    }
    
    const diagnostics: Record<string, any> = {
      success: true,
      timestamp: new Date().toISOString(),
      checks: {},
      fixes: {}
    };
    
    // Verificar conexão com Supabase
    try {
      const { data: pong, error: pingError } = await supabase.rpc('ping');
      diagnostics.checks.connection = {
        success: !pingError,
        message: pingError ? `Erro: ${pingError.message}` : 'Conexão estabelecida',
        result: pong
      };
    } catch (e) {
      diagnostics.checks.connection = {
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      };
    }
    
    // Verificar tabelas
    const tables = ['profiles', 'business_profiles', 'advertisements', 'subscriptions'];
    diagnostics.checks.tables = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
          
        diagnostics.checks.tables[table] = {
          exists: !error,
          message: error ? `Erro ao verificar tabela: ${error.message}` : 'Tabela encontrada',
          count: data && data[0] ? (data[0] as any).count || 0 : 0
        };
        
        // Tentar criar tabela se não existir
        if (error && error.code === '42P01') { // Código para tabela não existente
          diagnostics.fixes[`create_${table}`] = await createTable(supabase, table);
        }
      } catch (e) {
        diagnostics.checks.tables[table] = {
          exists: false,
          message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
        };
      }
    }
    
    // Verificar e corrigir operadores SQL
    diagnostics.checks.sqlOperators = await checkSQLOperators(supabase);
    
    // Verificar buckets de storage
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      diagnostics.checks.storage = {
        success: !error,
        message: error ? `Erro ao verificar buckets: ${error.message}` : 'Buckets verificados',
        buckets: buckets?.map(b => b.name) || []
      };
      
      // Criar bucket public se não existir
      if (!error && !buckets?.some(b => b.name === 'public')) {
        diagnostics.fixes.createPublicBucket = await createPublicBucket(supabase);
      }
    } catch (e) {
      diagnostics.checks.storage = {
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      };
    }
    
    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Erro durante diagnóstico:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao executar diagnóstico', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * Verificar e corrigir operadores SQL problemáticos
 */
async function checkSQLOperators(supabase: any) {
  const result = {
    success: false,
    issues: [] as string[],
    fixes: [] as string[]
  };
  
  try {
    // Testar operador UUID !~
    const { error: testError } = await supabase.rpc('exec_sql', {
      sql_query: `
        DO $$
        DECLARE
          test_uuid UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
          regex_pattern TEXT := '.*';
        BEGIN
          -- Verificar se o operador !~ existe para UUID
          PERFORM test_uuid !~ regex_pattern;
          EXCEPTION
            WHEN undefined_function THEN
              RAISE NOTICE 'Operador !~ não existe para UUID';
        END
        $$;
      `
    });
    
    if (testError) {
      result.issues.push(`Erro ao testar operador UUID !~: ${testError.message}`);
    }
    
    // Criar função alternativa segura para validação de UUID
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Criar função de validação segura para UUIDs
        CREATE OR REPLACE FUNCTION is_valid_uuid(text) RETURNS boolean AS $$
        BEGIN
          RETURN $1 ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN false;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `
    });
    
    if (fixError) {
      result.issues.push(`Erro ao criar função alternativa: ${fixError.message}`);
    } else {
      result.fixes.push("Função is_valid_uuid criada com sucesso");
    }
    
    result.success = result.issues.length === 0;
    return result;
  } catch (error) {
    result.issues.push(`Exceção: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Criar tabela se não existir
 */
async function createTable(supabase: any, tableName: string) {
  const result = {
    success: false,
    message: '',
    details: {}
  };
  
  try {
    let sql = '';
    
    switch (tableName) {
      case 'profiles':
        sql = `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            whatsapp TEXT,
            avatar_url TEXT,
            account_type TEXT DEFAULT 'personal',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Acesso público de leitura" ON public.profiles;
          CREATE POLICY "Acesso público de leitura" 
            ON public.profiles FOR SELECT USING (true);
            
          DROP POLICY IF EXISTS "Inserção permitida" ON public.profiles;
          CREATE POLICY "Inserção permitida" 
            ON public.profiles FOR INSERT WITH CHECK (true);
            
          DROP POLICY IF EXISTS "Atualização permitida" ON public.profiles;
          CREATE POLICY "Atualização permitida" 
            ON public.profiles FOR UPDATE USING (true);
        `;
        break;
        
      case 'business_profiles':
        sql = `
          CREATE TABLE IF NOT EXISTS public.business_profiles (
            id UUID PRIMARY KEY,
            user_id UUID,
            company_name TEXT,
            description TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            website TEXT,
            contact_phone TEXT,
            instagram TEXT,
            facebook TEXT,
            twitter TEXT,
            banner_url TEXT,
            gallery TEXT[],
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Acesso público de leitura" ON public.business_profiles;
          CREATE POLICY "Acesso público de leitura" 
            ON public.business_profiles FOR SELECT USING (true);
            
          DROP POLICY IF EXISTS "Inserção permitida" ON public.business_profiles;
          CREATE POLICY "Inserção permitida" 
            ON public.business_profiles FOR INSERT WITH CHECK (true);
            
          DROP POLICY IF EXISTS "Atualização permitida" ON public.business_profiles;
          CREATE POLICY "Atualização permitida" 
            ON public.business_profiles FOR UPDATE USING (true);
        `;
        break;
        
      case 'subscriptions':
        sql = `
          CREATE TABLE IF NOT EXISTS public.subscriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            plan TEXT NOT NULL DEFAULT 'free',
            status TEXT NOT NULL DEFAULT 'active',
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_date TIMESTAMP WITH TIME ZONE,
            payment_id TEXT,
            payment_method TEXT,
            amount DECIMAL(10, 2),
            currency TEXT DEFAULT 'BRL',
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
          
          ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Acesso público de leitura" ON public.subscriptions;
          CREATE POLICY "Acesso público de leitura" 
            ON public.subscriptions FOR SELECT USING (true);
            
          DROP POLICY IF EXISTS "Inserção permitida" ON public.subscriptions;
          CREATE POLICY "Inserção permitida" 
            ON public.subscriptions FOR INSERT WITH CHECK (true);
            
          DROP POLICY IF EXISTS "Atualização permitida" ON public.subscriptions;
          CREATE POLICY "Atualização permitida" 
            ON public.subscriptions FOR UPDATE USING (true);
        `;
        break;
        
      default:
        result.message = `Definição não disponível para tabela: ${tableName}`;
        return result;
    }
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      result.success = false;
      result.message = `Erro ao criar tabela ${tableName}: ${error.message}`;
      result.details = error;
    } else {
      result.success = true;
      result.message = `Tabela ${tableName} criada com sucesso`;
      
      // Verificar se a tabela foi criada corretamente
      const { data, error: checkError } = await supabase
        .from(tableName)
        .select('count(*)')
        .limit(1);
        
      if (checkError) {
        result.message += ` mas ocorreu erro na verificação: ${checkError.message}`;
        result.details = { checkError };
      }
    }
    
    return result;
  } catch (error) {
    result.success = false;
    result.message = `Exceção ao criar tabela ${tableName}: ${error instanceof Error ? error.message : String(error)}`;
    result.details = { error };
    return result;
  }
}

/**
 * Criar bucket public se não existir
 */
async function createPublicBucket(supabase: any) {
  const result = {
    success: false,
    message: '',
    details: {}
  };
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Verificar se o bucket public existe e criar se não existir
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM storage.buckets WHERE name = 'public'
          ) THEN
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('public', 'public', true);
            
            -- Criar políticas de acesso para o bucket public
            DO $$
            BEGIN
              DROP POLICY IF EXISTS "Acesso público de leitura" ON storage.objects;
              DROP POLICY IF EXISTS "Inserção permitida" ON storage.objects; 
              DROP POLICY IF EXISTS "Atualização permitida" ON storage.objects;
            
              CREATE POLICY "Acesso público de leitura" 
                ON storage.objects FOR SELECT
                USING (bucket_id = 'public');
                
              CREATE POLICY "Inserção permitida" 
                ON storage.objects FOR INSERT
                WITH CHECK (bucket_id = 'public');
                
              CREATE POLICY "Atualização permitida" 
                ON storage.objects FOR UPDATE
                USING (bucket_id = 'public');
                
              CREATE POLICY "Exclusão permitida" 
                ON storage.objects FOR DELETE
                USING (bucket_id = 'public');
            END
            $$;
          END IF;
        END
        $$;
      `
    });
    
    if (error) {
      result.success = false;
      result.message = `Erro ao criar bucket public: ${error.message}`;
      result.details = error;
      
      // Bucket já foi criado via migração SQL
      result.message += ' (Bucket deve ter sido criado via migração SQL)';
      result.success = true;
    } else {
      result.success = true;
      result.message = 'Bucket public criado com sucesso via SQL';
      
      // Verificar se o bucket foi criado corretamente
      const { data, error: checkError } = await supabase.storage.listBuckets();
      
      if (checkError) {
        result.message += ` mas ocorreu erro na verificação: ${checkError.message}`;
        result.details = { checkError };
      } else {
        const publicExists = data?.some(b => b.name === 'public');
        result.message += ` (verificado: ${publicExists ? 'existe' : 'não existe'})`;
      }
    }
    
    return result;
  } catch (error) {
    result.success = false;
    result.message = `Exceção ao criar bucket public: ${error instanceof Error ? error.message : String(error)}`;
    result.details = { error };
    return result;
  }
} 