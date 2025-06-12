import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Verificar autenticação admin
async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    if (adminAuthCookie === 'true') {
      console.log('(Subscription API) ✅ Autenticação admin válida via cookie');
      return true;
    }
    
    if (sbAccessToken) {
      console.log('(Subscription API) ✅ Autenticação admin válida via sb-access-token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('(Subscription API) ❌ Erro ao verificar autenticação:', error);
    return false;
  }
}

// GET: Obter detalhes de uma assinatura específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('(Subscription API) 🔍 Buscando assinatura:', params.id);
    
    if (!await checkAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID da assinatura não fornecido' 
      }, { status: 400 });
    }
    
    // Buscar assinatura com dados do plano e usuário
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans!inner(
          id,
          name,
          slug,
          description,
          price_monthly,
          price_yearly,
          max_ads,
          max_highlights_per_day,
          ad_duration_days,
          max_photos_per_ad,
          has_premium_features,
          max_business_categories
        ),
        users!inner(
          id,
          name,
          email,
          phone,
          user_type
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !subscription) {
      console.error('(Subscription API) ❌ Assinatura não encontrada:', error?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Assinatura não encontrada' 
      }, { status: 404 });
    }
    
    console.log('(Subscription API) ✅ Assinatura encontrada:', {
      id: subscription.id,
      user: subscription.users.name,
      plan: subscription.plans.name
    });
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        user_id: subscription.user_id,
        plan_id: subscription.plan_id,
        status: subscription.status,
        starts_at: subscription.starts_at,
        ends_at: subscription.ends_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        ads_used: subscription.ads_used,
        is_trial: subscription.is_trial,
        payment_method: subscription.payment_method_asaas,
        user: {
          id: subscription.users.id,
          name: subscription.users.name,
          email: subscription.users.email,
          phone: subscription.users.phone
        },
        plan: {
          id: subscription.plans.id,
          name: subscription.plans.name,
          slug: subscription.plans.slug,
          description: subscription.plans.description,
          price_monthly: subscription.plans.price_monthly,
          max_ads: subscription.plans.max_ads,
          features: {
            max_highlights_per_day: subscription.plans.max_highlights_per_day,
            ad_duration_days: subscription.plans.ad_duration_days,
            max_photos_per_ad: subscription.plans.max_photos_per_ad,
            has_premium_features: subscription.plans.has_premium_features,
            max_business_categories: subscription.plans.max_business_categories
          }
        }
      }
    });
    
  } catch (error) {
    console.error('(Subscription API) ❌ Erro ao buscar assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PATCH: Atualizar assinatura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('(Subscription API) 📝 Atualizando assinatura:', params.id);
    
    if (!await checkAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    const { id } = params;
    const body = await request.json();
    
    console.log('(Subscription API) 📋 Dados recebidos:', body);
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID da assinatura não fornecido' 
      }, { status: 400 });
    }
    
    // 1. Verificar se a assinatura existe
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingSubscription) {
      console.error('(Subscription API) ❌ Assinatura não encontrada:', fetchError?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Assinatura não encontrada' 
      }, { status: 404 });
    }
    
    // 2. Validar novo plano se fornecido
    let newPlan = null;
    if (body.plan_id && body.plan_id !== existingSubscription.plan_id) {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', body.plan_id)
        .single();
      
      if (planError || !planData) {
        console.error('(Subscription API) ❌ Plano não encontrado:', body.plan_id);
        return NextResponse.json({ 
          success: false, 
          message: 'Plano não encontrado' 
        }, { status: 400 });
      }
      
      newPlan = planData;
      console.log('(Subscription API) ✅ Novo plano validado:', newPlan.name);
    }
    
    // 3. Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Campos permitidos para atualização
    const allowedFields = [
      'plan_id', 'status', 'starts_at', 'ends_at', 
      'payment_method_asaas', 'ads_used', 'is_trial',
      'trial_ends_at', 'next_payment_date'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    console.log('(Subscription API) 📋 Dados de atualização:', updateData);
    
    // 4. Atualizar assinatura
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        plans!inner(id, name, slug, price_monthly, max_ads),
        users!inner(id, name, email)
      `)
      .single();
    
    if (updateError) {
      console.error('(Subscription API) ❌ Erro ao atualizar:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar assinatura: ' + updateError.message 
      }, { status: 500 });
    }
    
    // 5. Log de auditoria
    const auditLog = {
      action: 'subscription_updated',
      subscription_id: id,
      user_id: existingSubscription.user_id,
      changes: updateData,
      old_plan: existingSubscription.plan_id,
      new_plan: body.plan_id || existingSubscription.plan_id,
      admin_timestamp: new Date().toISOString()
    };
    
    console.log('(Subscription API) 📊 AUDITORIA:', auditLog);
    
    // 6. Resposta de sucesso
    console.log('(Subscription API) ✅ Assinatura atualizada com sucesso:', {
      id: updatedSubscription.id,
      user: updatedSubscription.users.name,
      plan: updatedSubscription.plans.name,
      status: updatedSubscription.status
    });
    
    return NextResponse.json({
      success: true,
      message: `Assinatura atualizada com sucesso${newPlan ? ` - Plano alterado para ${newPlan.name}` : ''}`,
      subscription: {
        id: updatedSubscription.id,
        user_id: updatedSubscription.user_id,
        plan_id: updatedSubscription.plan_id,
        status: updatedSubscription.status,
        updated_at: updatedSubscription.updated_at,
        user: updatedSubscription.users,
        plan: updatedSubscription.plans
      },
      audit: auditLog
    });
    
  } catch (error) {
    console.error('(Subscription API) ❌ Erro crítico:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE: Excluir assinatura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('(Subscription API) 🗑️ Excluindo assinatura:', params.id);
    
    if (!await checkAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID da assinatura não fornecido' 
      }, { status: 400 });
    }
    
    // 1. Verificar se existe
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingSubscription) {
      console.error('(Subscription API) ❌ Assinatura não encontrada para exclusão');
      return NextResponse.json({ 
        success: false, 
        message: 'Assinatura não encontrada' 
      }, { status: 404 });
    }
    
    // 2. Excluir dados relacionados primeiro
    await supabase
      .from('coupon_usage')
      .delete()
      .eq('subscription_id', id);
    
    await supabase
      .from('payments')
      .delete()
      .eq('subscription_id', id);
    
    // 3. Excluir assinatura principal
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('(Subscription API) ❌ Erro ao excluir:', deleteError);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao excluir assinatura: ' + deleteError.message 
      }, { status: 500 });
    }
    
    console.log('(Subscription API) ✅ Assinatura excluída com sucesso:', {
      id: existingSubscription.id,
      user_id: existingSubscription.user_id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Assinatura excluída com sucesso',
      deleted_id: existingSubscription.id
    });
    
  } catch (error) {
    console.error('(Subscription API) ❌ Erro ao excluir assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 