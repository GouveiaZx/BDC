import { NextRequest, NextResponse } from 'next/server';
import asaasService from '../../../../lib/asaas';
import { SubscriptionPlan } from '../../../models/types';

export async function POST(req: NextRequest) {
  try {
    // Ler dados da solicitação
    const body = await req.json();
    const { subscriptionId, userId } = body;
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura não fornecido' }, { status: 400 });
    }

    // Verificar autenticação básica (em produção, usar seu sistema de autenticação)
    // O userId seria normalmente extraído do token de autenticação
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // No ambiente de desenvolvimento, simular sucesso sem chamar o Asaas
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_ASAAS === 'true') {
      console.log('[MOCK] Cancelando assinatura:', subscriptionId);
      // Adicionar um atraso para simular uma chamada de API real
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada com sucesso (MOCK)',
        subscription: {
          id: subscriptionId,
          status: 'CANCELLED',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
        }
      });
    }
    
    // Em produção, cancelar assinatura no Asaas
    // 1. Verificar se o usuário é dono da assinatura
    const customer = await asaasService.getCustomerByCpfCnpj(userId);
    
    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado no Asaas' }, { status: 404 });
    }
    
    const subscriptions = await asaasService.getCustomerSubscriptions(customer.id);
    const targetSubscription = subscriptions.find((sub: any) => sub.id === subscriptionId);
    
    if (!targetSubscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }
    
    // 2. Cancelar a assinatura (delirateDelete: false para manter ativa até a próxima data de cobrança)
    const cancelResult = await asaasService.cancelSubscription(subscriptionId);
    
    // 3. Atualizar status no banco de dados (implementar conforme seu sistema)
    // Exemplo: await updateUserSubscriptionStatus(userId, 'cancelled');
    
    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: {
        id: subscriptionId,
        status: 'CANCELLED',
        validUntil: targetSubscription.nextDueDate
      }
    });
    
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o cancelamento da assinatura', details: (error as Error).message },
      { status: 500 }
    );
  }
} 