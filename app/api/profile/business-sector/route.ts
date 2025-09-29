import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH - Atualizar ramo de atividade do perfil
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, businessSectorId, businessSector } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    if (!businessSectorId && !businessSector) {
      return NextResponse.json({
        success: false,
        error: 'Pelo menos um campo (businessSectorId ou businessSector) é obrigatório'
      }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();

    // ✅ VERIFICAR SE USUÁRIO TEM PLANO PAGO
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        status,
        plans!inner(slug, name)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('plans.slug', 'free')
      .gte('ends_at', new Date().toISOString())
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Ramo de atividade disponível apenas para usuários com planos pagos'
      }, { status: 403 });
    }

    // ✅ VALIDAR CATEGORIA SE businessSectorId for fornecido
    if (businessSectorId) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', businessSectorId)
        .eq('is_active', true)
        .single();

      if (categoryError || !category) {
        return NextResponse.json({
          success: false,
          error: 'Categoria/ramo de atividade inválido'
        }, { status: 400 });
      }
    }

    // ✅ ATUALIZAR PERFIL COM RAMO DE ATIVIDADE
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (businessSectorId) {
      updateData.business_sector_id = businessSectorId;
    }

    if (businessSector) {
      updateData.business_sector = businessSector;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select(`
        id,
        user_id,
        name,
        business_sector,
        business_sector_id,
        categories:business_sector_id(name, slug, icon)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar ramo de atividade'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ramo de atividade atualizado com sucesso',
      data: {
        userId: updatedProfile.user_id,
        businessSector: updatedProfile.business_sector,
        businessSectorId: updatedProfile.business_sector_id,
        businessSectorInfo: updatedProfile.categories ? {
          name: (updatedProfile.categories as any).name,
          slug: (updatedProfile.categories as any).slug,
          icon: (updatedProfile.categories as any).icon
        } : null
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET - Buscar ramo de atividade do perfil
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Buscar dados do perfil com ramo de atividade
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        name,
        business_sector,
        business_sector_id,
        categories:business_sector_id(name, slug, icon)
      `)
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Perfil não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: profile.user_id,
        businessSector: profile.business_sector,
        businessSectorId: profile.business_sector_id,
        businessSectorInfo: profile.categories ? {
          name: (profile.categories as any).name,
          slug: (profile.categories as any).slug,
          icon: (profile.categories as any).icon
        } : null
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 