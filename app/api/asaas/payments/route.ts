import { NextRequest, NextResponse } from 'next/server';
import asaasService from '../../../lib/asaas';

/**
 * API Route para gerenciar pagamentos Asaas via backend
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const paymentId = searchParams.get('paymentId');
    const subscriptionId = searchParams.get('subscriptionId');

    if (paymentId) {
      const payment = await asaasService.getPayment(paymentId);
      return NextResponse.json({ success: true, payment });
    }

    if (customerId) {
      const payments = await asaasService.getCustomerPayments(customerId);
      return NextResponse.json({ success: true, data: payments });
    }

    if (subscriptionId) {
      const payments = await asaasService.getSubscriptionPayments(subscriptionId);
      return NextResponse.json({ success: true, data: payments });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Parâmetro customerId, paymentId ou subscriptionId é obrigatório' 
    }, { status: 400 });

  } catch (error) {
    console.error('Erro na API Asaas payments:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    const payment = await asaasService.createPayment(paymentData);
    
    return NextResponse.json({ success: true, payment });

  } catch (error) {
    console.error('Erro ao criar pagamento Asaas:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar pagamento' 
    }, { status: 500 });
  }
} 