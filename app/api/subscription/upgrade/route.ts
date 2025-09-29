import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';
import { getSupabaseAdminClient } from '../../../lib/supabase';

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

    // Atualizar assinatura no banco de dados
    const supabase = getSupabaseAdminClient();
    const isPaidPlan = planId !== SubscriptionPlan.FREE;
    
    // Calcular data de término baseada no plano (um mês a partir de hoje)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    try {
      // Inserir ou atualizar assinatura
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: planId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (subscriptionError) {
        return NextResponse.json(
          { error: 'Erro ao atualizar assinatura no banco de dados' },
          { status: 500 }
        );
      }
      
      // Se for plano pago, verificar o usuário automaticamente
      if (isPaidPlan) {
        const { error: verifyError } = await supabase
          .from('profiles')
          .update({
            is_verified: true,
            verified_reason: 'Assinante de plano pago',
            verified_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (verifyError) {
        }
      }
      
      return NextResponse.json({
        success: true,
        subscription: {
          userId,
          plan: planId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isVerified: isPaidPlan,
          status: 'active'
        }
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro interno ao processar upgrade' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar assinatura' },
      { status: 500 }
    );
  }
} 