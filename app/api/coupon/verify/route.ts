import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verificar se o código do cupom foi fornecido
    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Código do cupom é obrigatório.' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Buscar o cupom com o código fornecido
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', body.code.toUpperCase())
      .eq('is_active', true)
      .single();
    
    // Verificar se houve erro ou se o cupom não existe
    if (error || !coupon) {
      return NextResponse.json(
        { success: false, error: 'Cupom não encontrado ou inválido.' },
        { status: 404 }
      );
    }
    
    // Verificar se o cupom está expirado
    if (new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cupom expirado.' },
        { status: 400 }
      );
    }
    
    // Verificar se o cupom atingiu o limite de uso
    if (coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json(
        { success: false, error: 'Cupom esgotado (limite de uso atingido).' },
        { status: 400 }
      );
    }
    
    // Verificar se o plano específico do cupom corresponde ao plano selecionado (se aplicável)
    if (coupon.plan_id && body.planId && coupon.plan_id !== body.planId) {
      return NextResponse.json(
        { success: false, error: 'Cupom não é válido para este plano.' },
        { status: 400 }
      );
    }
    
    // Calcular o desconto
    let discountAmount = 0;
    let discountPercentage = 0;
    
    if (body.price) {
      if (coupon.type === 'percentage') {
        discountAmount = (parseFloat(body.price) * coupon.discount) / 100;
        discountPercentage = coupon.discount;
      } else { // fixed
        discountAmount = coupon.discount;
        discountPercentage = (coupon.discount / parseFloat(body.price)) * 100;
      }
    }
    
    // Retornar informações do cupom
    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount,
        discountAmount: discountAmount,
        discountPercentage: discountPercentage,
        description: coupon.description
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar cupom:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
} 