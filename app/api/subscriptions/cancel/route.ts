import { NextRequest, NextResponse } from 'next/server';
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
    try {
      // Importar Asaas dinamicamente
      const { asaas } = await import('../../../../lib/asaas');

      // 1. Buscar informações da assinatura diretamente
      const targetSubscription = await asaas.getSubscription(subscriptionId);

      // 2. Cancelar a assinatura (manter ativa até a próxima data de cobrança)
      const cancelResult = await asaas.cancelSubscription(subscriptionId);

      // 3. Atualizar status no banco de dados (implementar conforme seu sistema)
      // Exemplo: await updateUserSubscriptionStatus(userId, 'cancelled');

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada com sucesso',
        subscription: {
          id: subscriptionId,
          status: 'CANCELLED',
          validUntil: (targetSubscription as any)?.nextDueDate || null
        }
      });

    } catch (error) {
      return NextResponse.json({ error: 'Assinatura não encontrada ou erro no Asaas' }, { status: 404 });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar o cancelamento da assinatura', details: (error as Error).message },
      { status: 500 }
    );
  }
} 