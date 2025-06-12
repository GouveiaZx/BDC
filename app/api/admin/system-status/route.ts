import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Definições de tipos para evitar erros de tipagem
type ServiceStatus = 'ok' | 'error' | 'pending';

interface ServiceInfo {
  status: ServiceStatus;
  message: string;
  [key: string]: any; // Permite propriedades adicionais
}

interface SystemStatus {
  success: boolean;
  timestamp: string;
  services: {
    database: ServiceInfo;
    api: ServiceInfo;
    env: ServiceInfo;
    rpc?: ServiceInfo; // Propriedade opcional para o status da função RPC
    [key: string]: ServiceInfo | undefined;
  }
}

/**
 * Rota para verificar o status do sistema e conexões com serviços externos
 */
export async function GET() {
  const results: SystemStatus = {
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'pending',
        message: 'Testando conexão...'
      },
      api: {
        status: 'ok',
        message: 'API respondendo normalmente'
      },
      env: {
        status: 'ok',
        message: 'Variáveis de ambiente carregadas',
        variables: {
          NODE_ENV: process.env.NODE_ENV || 'não definido',
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'definido' : 'não definido',
          SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'definido' : 'não definido',
          ASAAS_API_KEY: process.env.ASAAS_API_KEY ? 'definido' : 'não definido'
        }
      }
    }
  };
  
  // Verificar conexão com o banco de dados
  try {
    console.log('[API:system-status] Verificando conexão com o banco de dados...');
    const supabase = getSupabaseAdminClient();
    
    // Executar uma consulta simples
    const { data, error } = await supabase
      .from('subscriptions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('[API:system-status] Erro na conexão com o banco de dados:', error);
      results.services.database = {
        status: 'error',
        message: `Erro na conexão: ${error.message}`
      };
      results.success = false;
    } else {
      console.log('[API:system-status] Conexão com o banco de dados OK');
      results.services.database = {
        status: 'ok',
        message: 'Conexão estabelecida com sucesso',
        subscriptions_count: data
      };
    }
    
    // Verificar função RPC
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_subscriptions_all', { p_limit: 1, p_offset: 0 });
      
      if (rpcError) {
        console.error('[API:system-status] Erro ao chamar função RPC:', rpcError);
        results.services.rpc = {
          status: 'error',
          message: `Erro na função RPC: ${rpcError.message}`
        };
      } else {
        console.log('[API:system-status] Função RPC OK');
        results.services.rpc = {
          status: 'ok',
          message: 'Função RPC executada com sucesso',
          results_count: rpcData?.length || 0
        };
      }
    } catch (rpcErr) {
      console.error('[API:system-status] Exceção ao chamar função RPC:', rpcErr);
      results.services.rpc = {
        status: 'error',
        message: `Exceção na função RPC: ${(rpcErr as Error).message}`
      };
    }
    
  } catch (err) {
    console.error('[API:system-status] Erro ao verificar status do sistema:', err);
    results.services.database = {
      status: 'error',
      message: `Exceção: ${(err as Error).message}`
    };
    results.success = false;
  }
  
  return NextResponse.json(results);
} 