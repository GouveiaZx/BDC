import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Importar dinamicamente o serviço ASAAS
    const { default: asaas } = await import('../../../lib/asaas');
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      version: "2.0-FORCE-REBUILD",
      environment: process.env.NODE_ENV,
      asaasConfig: {
        apiKeyPresent: !!process.env.ASAAS_API_KEY,
        apiKeyPrefix: process.env.ASAAS_API_KEY?.substring(0, 15) + '...',
        apiUrl: process.env.ASAAS_API_URL,
        configLoaded: !!asaas
      },
      message: "ASAAS config check - version 2.0"
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao carregar ASAAS',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 