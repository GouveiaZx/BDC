import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';

// API para verificar manualmente um usuário (uso administrativo)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, verified, reason } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Em um ambiente real, aqui você verificaria permissões (somente admin)
    // e atualizaria o status de verificação no banco de dados

    // Simular resposta de sucesso com dados mockados
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        isVerified: verified ?? true,
        verifiedReason: reason || 'Manualmente verificado por administrador',
        verifiedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
}

// API para verificar automaticamente quando um usuário assina um plano pago
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, planId } = data;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'ID do usuário e plano são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o plano é um plano pago
    const isPaidPlan = planId !== SubscriptionPlan.FREE;
    
    // Em um ambiente real, aqui você atualizaria o status de verificação no banco de dados
    // se o plano for pago
    
    if (!isPaidPlan) {
      return NextResponse.json(
        { error: 'Apenas planos pagos podem receber selo de verificação' },
        { status: 400 }
      );
    }

    // Simular resposta de sucesso com dados mockados
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        isVerified: true,
        verifiedReason: 'Assinante de plano pago',
        verifiedAt: new Date().toISOString(),
        plan: planId
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
} 