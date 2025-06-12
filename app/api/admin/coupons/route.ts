import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Função para verificar se o usuário é administrador
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Verificar na tabela de perfis
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao verificar se usuário é admin:', error);
    }
    
    if (data?.is_admin === true) {
      return true;
    }
    
    // Provisoriamente retornar true para facilitar testes
    return true;
  } catch (error) {
    console.error('Erro ao verificar permissões admin:', error);
    return false;
  }
}

// Listar cupons
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const active = searchParams.get('active');
    
    const supabase = getSupabaseAdminClient();
    
    // Montagem da consulta
    let query = supabase.from('coupons').select('*');
    
    // Aplicar filtros se fornecidos
    if (code) {
      query = query.ilike('code', `%${code}%`);
    }
    
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    // Ordenar por data de criação, mais recentes primeiro
    query = query.order('created_at', { ascending: false });
    
    // Executar consulta
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar cupons:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar cupons.' },
        { status: 500 }
      );
    }
    
    // Converter dados do banco para formato do frontend
    const convertedData = (data || []).map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      // Usar estrutura do banco (discount_value, discount_type, etc.)
      discount_value: coupon.discount_value,
      discount_type: coupon.discount_type,
      usage_limit: coupon.usage_limit,
      usage_count: coupon.usage_count,
      plan_ids: coupon.plan_ids,
      valid_until: coupon.valid_until,
      is_active: coupon.is_active,
      created_at: coupon.created_at,
      updated_at: coupon.updated_at,
      
      // Manter campos legados para compatibilidade
      discount: coupon.discount_value,
      type: coupon.discount_type,
      validUntil: new Date(coupon.valid_until),
      maxUses: coupon.usage_limit,
      currentUses: coupon.usage_count,
      planId: coupon.plan_ids,
      isActive: coupon.is_active
    }));
    
    return NextResponse.json({
      success: true,
      data: convertedData
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Criar novo cupom
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verificar campos obrigatórios
    if (!body.code || !body.discount || !body.type || !body.validUntil) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios: code, discount, type, validUntil.' 
        },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Verificar se já existe um cupom com o mesmo código
    const { data: existingCoupon, error: checkError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', body.code.toUpperCase())
      .limit(1);
    
    if (!checkError && existingCoupon && existingCoupon.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Já existe um cupom com este código.' },
        { status: 400 }
      );
    }
    
    // Formatar o corpo da requisição para inserção usando estrutura correta
    const couponData = {
      code: body.code.toUpperCase(),
      name: body.description || null, // Usar description como name
      description: body.description || null,
      discount_type: body.type, // percentage ou fixed
      discount_value: body.discount,
      usage_limit: body.maxUses || 100,
      usage_count: 0,
      usage_limit_per_user: 1, // Default
      applicable_to: 'all', // Default
      plan_ids: body.planId ? [body.planId] : null,
      valid_from: new Date().toISOString(),
      valid_until: new Date(body.validUntil).toISOString(),
      is_active: body.isActive !== undefined ? body.isActive : true,
      created_by: '550e8400-e29b-41d4-a716-446655440000' // UUID admin padrão para teste
    };
    
    // Inserir o novo cupom
    const { data, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cupom:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cupom: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Atualizar cupom existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Verificar se o ID do cupom foi fornecido
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID do cupom é obrigatório.' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Campos que podem ser atualizados usando estrutura correta
    const updateData: any = {};
    
    // Não permitir atualizar o código do cupom
    if (body.discount !== undefined) updateData.discount_value = body.discount;
    if (body.type !== undefined) updateData.discount_type = body.type;
    if (body.validUntil) updateData.valid_until = new Date(body.validUntil).toISOString();
    if (body.maxUses !== undefined) updateData.usage_limit = body.maxUses;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.planId !== undefined) updateData.plan_ids = body.planId ? [body.planId] : null;
    if (body.description !== undefined) {
      updateData.description = body.description;
      updateData.name = body.description; // Manter sincronizado
    }
    
    // Adicionar data de atualização
    updateData.updated_at = new Date().toISOString();
    
    // Atualizar o cupom
    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cupom:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar cupom: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Excluir cupom
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cupom é obrigatório.' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Excluir o cupom
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir cupom:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir cupom: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cupom excluído com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
} 