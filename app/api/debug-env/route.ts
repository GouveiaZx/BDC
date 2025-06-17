import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de DEBUG para verificar variáveis de ambiente no servidor
 * REMOVER APÓS DEBUG
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se todas as variáveis estão presentes
    const envCheck = {
      hasAsaasKey: !!process.env.ASAAS_API_KEY,
      asaasKeyLength: process.env.ASAAS_API_KEY?.length || 0,
      asaasKeyPrefix: process.env.ASAAS_API_KEY?.substring(0, 20) || 'NOT_FOUND',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 