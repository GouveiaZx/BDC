import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';
import { requireAdminAuth } from '../../../lib/secureSupabase';

// API para verificar manualmente um usuário (uso administrativo)
export async function POST(req: NextRequest) {
  try {
    // AUTENTICAÇÃO ADMIN OBRIGATÓRIA
    const { admin, supabase } = await requireAdminAuth(req);

    const data = await req.json();
    const { userId, verified, reason } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    try {
      const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update({
          is_verified: verified ?? true,
          verified_reason: reason || 'Manualmente verificado por administrador',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Erro ao atualizar verificação no banco de dados' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          isVerified: updatedUser.is_verified,
          verifiedReason: updatedUser.verified_reason,
          verifiedAt: updatedUser.verified_at
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro interno ao verificar usuário' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
}

// API para verificar automaticamente quando um usuário assina um plano pago
export async function PUT(req: NextRequest) {
  try {
    // AUTENTICAÇÃO OBRIGATÓRIA (usuário deve estar logado para assinar)
    const { admin, supabase } = await requireAdminAuth(req);

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
    
    if (!isPaidPlan) {
      return NextResponse.json(
        { error: 'Apenas planos pagos podem receber selo de verificação' },
        { status: 400 }
      );
    }
    
    // Atualizar status de verificação no banco de dados para plano pago
    // Cliente já obtido via requireAdminAuth
    
    try {
      const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_reason: 'Assinante de plano pago',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Erro ao atualizar verificação no banco de dados' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          isVerified: updatedUser.is_verified,
          verifiedReason: updatedUser.verified_reason,
          verifiedAt: updatedUser.verified_at,
          plan: planId
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro interno ao verificar usuário' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
} 