import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../../lib/supabase';
import { ADMIN_EMAILS } from '../../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Verificar autenticação admin
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Obter informações da assinatura atual do usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - privilégios de administrador necessários'
      }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const userId = params.id;

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Buscar assinatura ativa atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        starts_at,
        ends_at,
        created_at,
        plans!inner(
          id,
          name,
          slug,
          price_monthly,
          max_ads,
          max_highlights_per_day,
          ad_duration_days,
          statistics_level,
          support_type,
          has_search_highlight
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    let currentPlan = null;
    if (!subError && subscription) {
      currentPlan = {
        subscription_id: subscription.id,
        plan: subscription.plans,
        status: subscription.status,
        starts_at: subscription.starts_at,
        ends_at: subscription.ends_at,
        created_at: subscription.created_at
      };
    } else {
      // Se não tem assinatura ativa, está no plano gratuito
      const { data: freePlan } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', 'free')
        .single();
      
      if (freePlan) {
        currentPlan = {
          subscription_id: null,
          plan: freePlan,
          status: 'free',
          starts_at: null,
          ends_at: null,
          created_at: null
        };
      }
    }

    // Buscar todos os planos disponíveis para seleção
    const { data: availablePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (plansError) {
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        current_subscription: currentPlan,
        available_plans: availablePlans || []
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * PUT - Alterar plano do usuário (apenas para administradores)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - privilégios de administrador necessários'
      }, { status: 403 });
    }

    const body = await request.json();
    const { plan_id, reason } = body;

    if (!plan_id) {
      return NextResponse.json({
        success: false,
        error: 'ID do plano é obrigatório'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const userId = params.id;

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Verificar se o plano existe
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json({
        success: false,
        error: 'Plano não encontrado ou inativo'
      }, { status: 404 });
    }

    // Se o plano for gratuito, cancelar assinatura ativa
    if (newPlan.slug === 'free') {
      const { error: cancelError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (cancelError) {
      }
      return NextResponse.json({
        success: true,
        message: `Usuário ${user.name} foi movido para o plano gratuito`,
        data: {
          user: user,
          new_plan: newPlan,
          action: 'moved_to_free'
        }
      });
    }

    // Para planos pagos, verificar se já tem assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, plan_id, plans!inner(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription && existingSubscription.plan_id === plan_id) {
      return NextResponse.json({
        success: false,
        error: `Usuário já possui o plano ${newPlan.name}`
      }, { status: 400 });
    }

    // Cancelar assinatura existente se houver
    if (existingSubscription) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);
    }

    // Criar nova assinatura
    const newSubscriptionData = {
      user_id: userId,
      plan_id: plan_id,
      status: 'active',
      starts_at: new Date().toISOString(),
      ends_at: null, // Para alteração manual, não definir fim automático
      is_trial: false,
      payment_method: 'admin_change',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newSubscription, error: createError } = await supabase
      .from('subscriptions')
      .insert([newSubscriptionData])
      .select()
      .single();

    if (createError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar nova assinatura: ' + createError.message
      }, { status: 500 });
    }

    // Log da alteração administrativa
    const logData = {
      admin_id: userId, // Em um sistema real, seria o ID do admin logado
      action: 'subscription_change',
      entity_type: 'subscription',
      entity_id: newSubscription.id,
      old_values: existingSubscription ? {
        plan_id: existingSubscription.plan_id,
        plan_name: (existingSubscription.plans as any)?.name
      } : { plan: 'free' },
      new_values: {
        plan_id: newPlan.id,
        plan_name: newPlan.name,
        reason: reason || 'Alteração manual via admin'
      },
      created_at: new Date().toISOString()
    };

    await supabase.from('admin_logs').insert([logData]);
    return NextResponse.json({
      success: true,
      message: `Plano do usuário ${user.name} alterado para ${newPlan.name} com sucesso`,
      data: {
        user: user,
        old_plan: (existingSubscription?.plans as any)?.name || 'Gratuito',
        new_plan: newPlan.name,
        subscription: newSubscription
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * DELETE - Cancelar assinatura do usuário (mover para plano gratuito)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - privilégios de administrador necessários'
      }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const userId = params.id;

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Buscar e cancelar assinatura ativa
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, plans!inner(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não possui assinatura ativa para cancelar'
      }, { status: 404 });
    }

    // Cancelar a assinatura
    const { error: cancelError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (cancelError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao cancelar assinatura: ' + cancelError.message
      }, { status: 500 });
    }

    // Log da alteração administrativa
    const logData = {
      admin_id: userId, // Em um sistema real, seria o ID do admin logado
      action: 'subscription_cancelled',
      entity_type: 'subscription',
      entity_id: subscription.id,
      old_values: {
        plan_name: (subscription.plans as any).name,
        status: 'active'
      },
      new_values: {
        plan_name: 'Gratuito',
        status: 'cancelled'
      },
      created_at: new Date().toISOString()
    };

    await supabase.from('admin_logs').insert([logData]);
    return NextResponse.json({
      success: true,
      message: `Assinatura do usuário ${user.name} foi cancelada. Ele agora está no plano gratuito.`,
      data: {
        user: user,
        cancelled_plan: (subscription.plans as any).name,
        current_plan: 'Gratuito'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}