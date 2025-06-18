import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 [TEST] Iniciando teste de configuração ASAAS...');
    
    // Testar environment variables direto
    const envTest = {
      ASAAS_API_KEY: process.env.ASAAS_API_KEY,
      ASAAS_API_URL: process.env.ASAAS_API_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('🔍 [TEST] Environment variables:', envTest);
    
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../lib/asaas');
    
    console.log('🔍 [TEST] ASAAS service imported:', !!asaas);
    
    // Hardcode direto para teste
    const DIRECT_TEST_CONFIG = {
      apiKey: 'prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNiZmZlNzcyLTZiZWEtNDhlNC05NjMxLTY0M2JkY2I5YjM3NTo6JGFhY2hfNTJiYjkzYjgtZDBhMi00ZjM0LWFmYjMtMmYzOWQ1NDY4MzE3',
      apiUrl: 'https://api.asaas.com/v3'
    };
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      version: "3.0-DIRECT-TEST",
      environment: process.env.NODE_ENV,
      envVars: {
        asaasApiKey: process.env.ASAAS_API_KEY ? 'PRESENTE' : 'AUSENTE',
        asaasApiUrl: process.env.ASAAS_API_URL || 'AUSENTE',
        nodeEnv: process.env.NODE_ENV || 'AUSENTE'
      },
      directTest: {
        hardcodedKeyLength: DIRECT_TEST_CONFIG.apiKey.length,
        hardcodedKeyPrefix: DIRECT_TEST_CONFIG.apiKey.substring(0, 15),
        hardcodedUrl: DIRECT_TEST_CONFIG.apiUrl
      },
      asaasConfig: {
        serviceLoaded: !!asaas,
        configPresent: true
      },
      message: "ASAAS config DIRECT test - version 3.0"
    });
    
  } catch (error: any) {
    console.error('❌ [TEST] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao carregar ASAAS',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 