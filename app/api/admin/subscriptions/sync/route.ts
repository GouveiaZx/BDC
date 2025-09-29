import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Cliente Supabase com chave de serviço para operações admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verificar se o usuário é administrador a partir do token de autenticação
 */
async function checkAdminAuth(request: NextRequest) {
  try {
    // Obter o token de autenticação do cabeçalho
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'Token não fornecido' };
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return { isAdmin: false, error: 'Token inválido' };
    }
    
    // Verificar o token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return { isAdmin: false, error: 'Token inválido' };
    }
    
    // Verificar se o email está na lista de admins
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return { 
        isAdmin: true, 
        userId: user.id,
        userEmail: user.email 
      };
    }
    
    // Se não encontrou pelo email, verificar na tabela profiles
    const { data: userData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();
    
    if (profileError || !userData) {
      return { isAdmin: false, error: 'Perfil não encontrado' };
    }
    
    // Verificar se o usuário é admin
    if (userData.is_admin !== true) {
      return { isAdmin: false, error: 'Acesso não autorizado' };
    }
    
    return { 
      isAdmin: true, 
      userId: user.id,
      userEmail: userData.email 
    };
  } catch (error) {
    return { isAdmin: false, error: 'Erro ao verificar autenticação' };
  }
}

/**
 * POST - Sincronizar manualmente assinaturas entre asaas_subscriptions e subscriptions
 * Esta API deve ser chamada apenas por administradores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é administrador
    const adminStatus = await checkAdminAuth(request);
    if (!adminStatus.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar todas as assinaturas do Asaas
    const { data: asaasSubscriptions, error: asaasError } = await supabaseAdmin
      .from('asaas_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (asaasError) {
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
    }

    if (!asaasSubscriptions || asaasSubscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhuma assinatura Asaas encontrada para sincronização' });
    }

    // Buscar todos os planos para mapear plan_type para plan_id
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('id, plan_type');

    if (plansError) {
      return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 });
    }

    // Criar um mapa de plan_type para plan_id
    const planMap = plans.reduce((acc: Record<string, string>, plan: any) => {
      acc[plan.plan_type] = plan.id;
      return acc;
    }, {});

    // Processar cada assinatura do Asaas
    const results = [];
    for (const asaasSub of asaasSubscriptions) {
      try {
        // Verificar se já existe uma assinatura para este usuário
        const { data: existingSub, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', asaasSub.user_id)
          .single();

        const planId = planMap[asaasSub.plan_type] || planMap['free']; // Fallback para plano gratuito

        if (existingSub) {
          // Atualizar assinatura existente
          const { data: updatedSub, error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_id: planId,
              status: mapAsaasStatusToSubscriptionStatus(asaasSub.status),
              asaas_subscription_id: asaasSub.asaas_subscription_id,
              asaas_customer_id: asaasSub.asaas_customer_id,
              payment_method_asaas: asaasSub.cycle,
              next_payment_date: asaasSub.next_due_date,
              starts_at: asaasSub.started_at,
              ends_at: asaasSub.expires_at,
              cancelled_at: asaasSub.cancelled_at,
              updated_at: new Date().toISOString(),
              payment_gateway: 'asaas'
            })
            .eq('user_id', asaasSub.user_id)
            .select();

          if (updateError) {
            results.push({
              user_id: asaasSub.user_id,
              status: 'error',
              message: 'Erro ao atualizar assinatura',
              error: updateError
            });
          } else {
            results.push({
              user_id: asaasSub.user_id,
              status: 'updated',
              subscription: updatedSub
            });
          }
        } else {
          // Criar nova assinatura
          const { data: newSub, error: insertError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              user_id: asaasSub.user_id,
              plan_id: planId,
              status: mapAsaasStatusToSubscriptionStatus(asaasSub.status),
              asaas_subscription_id: asaasSub.asaas_subscription_id,
              asaas_customer_id: asaasSub.asaas_customer_id,
              payment_method_asaas: asaasSub.cycle,
              next_payment_date: asaasSub.next_due_date,
              starts_at: asaasSub.started_at,
              ends_at: asaasSub.expires_at,
              cancelled_at: asaasSub.cancelled_at,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              payment_gateway: 'asaas'
            })
            .select();

          if (insertError) {
            results.push({
              user_id: asaasSub.user_id,
              status: 'error',
              message: 'Erro ao criar assinatura',
              error: insertError
            });
          } else {
            results.push({
              user_id: asaasSub.user_id,
              status: 'created',
              subscription: newSub
            });
          }
        }
      } catch (error) {
        results.push({
          user_id: asaasSub.user_id,
          status: 'error',
          message: 'Erro ao processar assinatura',
          error
        });
      }
    }

    return NextResponse.json({
      message: 'Sincronização concluída',
      total: asaasSubscriptions.length,
      results
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao sincronizar assinaturas' }, { status: 500 });
  }
}

/**
 * Mapear status do Asaas para status da tabela subscriptions
 */
function mapAsaasStatusToSubscriptionStatus(asaasStatus: string): string {
  switch (asaasStatus) {
    case 'ACTIVE':
      return 'active';
    case 'INACTIVE':
      return 'inactive';
    case 'EXPIRED':
      return 'expired';
    case 'OVERDUE':
      return 'overdue';
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'inactive';
  }
} 