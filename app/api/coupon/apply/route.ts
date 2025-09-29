import { NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verificar campos obrigatórios
    if (!body.couponId || !body.userId || !body.subscriptionId || !body.amountSaved) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios: couponId, userId, subscriptionId, amountSaved.' 
        },
        { status: 400 }
      );
    }
    
    // Obter cliente supabase
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o cupom ainda é válido
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', body.couponId)
      .eq('is_active', true)
      .single();
    
    if (couponError || !coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupom não encontrado ou inválido.' },
        { status: 404 }
      );
    }
    
    // Verificar se o cupom não está expirado
    if (new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cupom expirado.' },
        { status: 400 }
      );
    }
    
    // Verificar se o cupom não atingiu o limite de uso
    if (coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json(
        { success: false, error: 'Cupom esgotado (limite de uso atingido).' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário já usou este cupom antes
    const { data: existingUsage, error: usageError } = await supabase
      .from('coupon_usages')
      .select('id')
      .eq('coupon_id', body.couponId)
      .eq('user_id', body.userId)
      .limit(1);
    
    if (!usageError && existingUsage && existingUsage.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Você já utilizou este cupom anteriormente.' },
        { status: 400 }
      );
    }
    
    // Registrar o uso do cupom
    const { data: usageData, error: insertError } = await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: body.couponId,
        user_id: body.userId,
        subscription_id: body.subscriptionId,
        amount_saved: body.amountSaved
      })
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao registrar uso do cupom.' },
        { status: 500 }
      );
    }
    
    // Atualizar a contagem de uso do cupom
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ current_uses: coupon.current_uses + 1 })
      .eq('id', body.couponId);
    
    if (updateError) {
      // Não retornar erro ao usuário, pois o uso já foi registrado
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      data: {
        usage: usageData,
        message: 'Cupom aplicado com sucesso!'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
} 