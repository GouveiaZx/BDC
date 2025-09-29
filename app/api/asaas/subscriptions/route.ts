import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para gerenciar assinaturas Asaas via backend
 */

export async function GET(request: NextRequest) {
  try {
    // Importar dinamicamente apenas quando necessário
    const { default: asaasService } = await import('../../../../lib/asaas');
    
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const subscriptionId = searchParams.get('subscriptionId');

    if (subscriptionId) {
      const subscription = await asaasService.getSubscription(subscriptionId);
      return NextResponse.json({ success: true, subscription });
    }

    if (customerId) {
      // Método getCustomerSubscriptions não existe - retornar array vazio por enquanto
      return NextResponse.json({ success: true, subscriptions: [] });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Parâmetro customerId ou subscriptionId é obrigatório' 
    }, { status: 400 });

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
    
    const subscriptionData = await request.json();
    const subscription = await asaasService.createSubscription(subscriptionData);
    
    return NextResponse.json({ success: true, subscription });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar assinatura' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Importar dinamicamente apenas quando necessário
    const { default: asaasService } = await import('../../../../lib/asaas');
    
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'subscriptionId é obrigatório' 
      }, { status: 400 });
    }

    const result = await asaasService.cancelSubscription(subscriptionId);
    return NextResponse.json({ success: true, result });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao cancelar assinatura' 
    }, { status: 500 });
  }
} 