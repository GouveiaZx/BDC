import { NextRequest, NextResponse } from 'next/server';
import { AsaasClient } from '../../../lib/asaas';
import { getSupabaseAdminClient } from '../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('[TEST] Iniciando testes dos sistemas...');
    
    const results = {
      asaas: { status: 'error', message: '', details: null },
      supabase: { status: 'error', message: '', details: null },
      timestamp: new Date().toISOString()
    };
    
    // Teste ASAAS
    try {
      console.log('[TEST] Testando ASAAS...');
      
      const asaasClient = new AsaasClient({
        apiKey: process.env.ASAAS_API_KEY || '',
        apiUrl: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3',
        environment: 'production'
      });
      
      // Tentar listar clientes (teste simples)
      const response = await fetch(`${process.env.ASAAS_API_URL}/customers?limit=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.ASAAS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        results.asaas = {
          status: 'success',
          message: 'ASAAS conectado com sucesso',
          details: {
            statusCode: response.status,
            totalCount: data.totalCount || 0,
            hasData: !!data.data
          }
        };
        console.log('[TEST] ✅ ASAAS funcionando!');
      } else {
        const errorData = await response.text();
        results.asaas = {
          status: 'error',
          message: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: { errorData, status: response.status }
        };
        console.log('[TEST] ❌ ASAAS com erro:', response.status);
      }
    } catch (asaasError: any) {
      results.asaas = {
        status: 'error',
        message: `Erro no ASAAS: ${asaasError.message}`,
        details: { error: asaasError.toString() }
      };
      console.error('[TEST] ❌ Erro ASAAS:', asaasError);
    }
    
    // Teste Supabase
    try {
      console.log('[TEST] Testando Supabase...');
      
      const supabase = getSupabaseAdminClient();
      
      // Testar consulta na tabela plans (que tem a nova coluna plan_type)
      const { data: plans, error } = await supabase
        .from('plans')
        .select('id, name, slug, plan_type, price_monthly')
        .limit(5);
        
      if (error) {
        results.supabase = {
          status: 'error',
          message: `Erro Supabase: ${error.message}`,
          details: { error: error.details, code: error.code }
        };
        console.log('[TEST] ❌ Supabase com erro:', error.message);
      } else {
        results.supabase = {
          status: 'success',
          message: 'Supabase conectado com sucesso',
          details: {
            plansCount: plans?.length || 0,
            hasPlans: !!plans && plans.length > 0,
            samplePlan: plans?.[0] || null
          }
        };
        console.log('[TEST] ✅ Supabase funcionando!');
      }
    } catch (supabaseError: any) {
      results.supabase = {
        status: 'error',
        message: `Erro no Supabase: ${supabaseError.message}`,
        details: { error: supabaseError.toString() }
      };
      console.error('[TEST] ❌ Erro Supabase:', supabaseError);
    }
    
    // Status geral
    const allSystemsOk = results.asaas.status === 'success' && results.supabase.status === 'success';
    
    console.log('[TEST] Status final:', {
      asaas: results.asaas.status,
      supabase: results.supabase.status,
      allOk: allSystemsOk
    });
    
    return NextResponse.json({
      success: true,
      message: allSystemsOk ? 'Todos os sistemas funcionando!' : 'Alguns sistemas com problemas',
      systems: results,
      overallStatus: allSystemsOk ? 'healthy' : 'degraded'
    });
    
  } catch (error: any) {
    console.error('[TEST] Erro crítico nos testes:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro crítico nos testes dos sistemas',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 