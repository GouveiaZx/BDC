import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 [SIMPLE-TEST] Testando ASAAS diretamente...');
    
    // Hardcode direto, sem usar lib/asaas.ts
    const ASAAS_API_KEY = 'prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNiZmZlNzcyLTZiZWEtNDhlNC05NjMxLTY0M2JkY2I5YjM3NTo6JGFhY2hfNTJiYjkzYjgtZDBhMi00ZjM0LWFmYjMtMmYzOWQ1NDY4MzE3';
    const ASAAS_API_URL = 'https://api.asaas.com/v3';
    
    // Teste simples: buscar informações da conta
    const response = await fetch(`${ASAAS_API_URL}/myAccount`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'BDC-System/1.0'
      }
    });
    
    console.log('🔍 [SIMPLE-TEST] Status da resposta:', response.status);
    console.log('🔍 [SIMPLE-TEST] Headers da resposta:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('🔍 [SIMPLE-TEST] Dados brutos:', data);
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      parsedData = { raw: data };
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      version: "1.0-SIMPLE-TEST",
      test: {
        apiKey: ASAAS_API_KEY.substring(0, 15) + '...',
        apiUrl: ASAAS_API_URL,
        keyLength: ASAAS_API_KEY.length
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data: parsedData
      },
      success: response.ok,
      message: response.ok ? 'ASAAS API funcionando!' : 'Erro na API ASAAS'
    });
    
  } catch (error: any) {
    console.error('❌ [SIMPLE-TEST] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao testar ASAAS',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 