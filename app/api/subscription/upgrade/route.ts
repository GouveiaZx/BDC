import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, planId } = data;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'ID do usuário e plano são obrigatórios' },
        { status: 400 }
      );
    }

    // Em um ambiente real, aqui faríamos a atualização no banco de dados
    // Simular resposta de sucesso com dados mockados
    
    // Verificar se o plano é um plano pago
    const isPaidPlan = planId !== SubscriptionPlan.FREE;
    
    // Calcular data de término baseada no plano (um mês a partir de hoje)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    return NextResponse.json({
      success: true,
      subscription: {
        userId,
        plan: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isVerified: isPaidPlan, // Definir como verificado se for um plano pago
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar assinatura' },
      { status: 500 }
    );
  }
} 