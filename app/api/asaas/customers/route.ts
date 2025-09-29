import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para interagir com Asaas via backend
 * Evita problemas de CORS fazendo chamadas server-side
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetro customerId é obrigatório' 
      }, { status: 400 });
    }

    // Importar dinamicamente apenas quando necessário
    const { default: asaasService } = await import('../../../../lib/asaas');
    
    const customer = await asaasService.getCustomer(customerId);
    return NextResponse.json({ success: true, customer });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Importar dinamicamente apenas quando necessário
    const { default: asaasService } = await import('../../../../lib/asaas');
    
    const customerData = await request.json();
    const customer = await asaasService.createCustomer(customerData);
    
    return NextResponse.json({ success: true, customer });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar cliente' 
    }, { status: 500 });
  }
} 