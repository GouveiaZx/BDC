import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para verificar se é admin
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    return false;
  }
  
  return authHeader === `Bearer ${adminToken}`;
}

/**
 * POST - Sincronizar assinaturas do Asaas com a tabela principal
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    // Buscar todas as assinaturas Asaas ativas
    const { data: asaasSubscriptions, error: asaasError } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (asaasError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar assinaturas Asaas: ' + asaasError.message
      }, { status: 500 });
    }
    if (!asaasSubscriptions || asaasSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura Asaas ativa encontrada',
        synchronized: 0,
        errors: []
      });
    }
    
    // Mapear plan_type do Asaas para slug do sistema principal
    const planTypeToSlugMap: { [key: string]: string } = {
      'FREE': 'free',
      'free': 'free',
      'MICRO_EMPRESA': 'micro_business',
      'micro_business': 'micro_business',
      'PEQUENA_EMPRESA': 'small_business', 
      'small_business': 'small_business',
      'EMPRESA_SIMPLES': 'business_simple',
      'business_simple': 'business_simple',
      'EMPRESA_PLUS': 'business_plus',
      'business_plus': 'business_plus'
    };
    
    let synchronized = 0;
    const errors: string[] = [];
    const results: any[] = [];
    
    // Buscar todos os planos uma vez
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');
    
    if (plansError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar planos: ' + plansError.message
      }, { status: 500 });
    }
    
    const plansMap = plans?.reduce((acc, plan) => {
      acc[plan.slug] = plan;
      return acc;
    }, {} as any) || {};
    
    // Processar cada assinatura Asaas
    for (const asaasSubscription of asaasSubscriptions) {
      try {
        const planSlug = planTypeToSlugMap[asaasSubscription.plan_type] || 'free';
        const plan = plansMap[planSlug];
        
        if (!plan) {
          const errorMsg = `Plano não encontrado para slug: ${planSlug}`;
          errors.push(`Assinatura ${asaasSubscription.id}: ${errorMsg}`);
          continue;
        }
        
        // Verificar se já existe assinatura ativa para este usuário
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', asaasSubscription.user_id)
          .eq('status', 'active')
          .single();
        
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 30 dias
        
        if (existingSubscription) {
          // Verificar se precisa atualizar o plano
          if (existingSubscription.plan_id !== plan.id) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan_id: plan.id,
                ends_at: endDate.toISOString(),
                payment_method: 'asaas',
                updated_at: now.toISOString()
              })
              .eq('id', existingSubscription.id);
            
            if (updateError) {
              const errorMsg = `Erro ao atualizar assinatura: ${updateError.message}`;
              errors.push(`Assinatura ${asaasSubscription.id}: ${errorMsg}`);
            } else {
              synchronized++;
              results.push({
                userId: asaasSubscription.user_id,
                action: 'updated',
                planFrom: existingSubscription.plan_id,
                planTo: plan.id,
                subscriptionId: existingSubscription.id
              });
            }
          } else {
            results.push({
              userId: asaasSubscription.user_id,
              action: 'already_synced',
              plan: plan.id,
              subscriptionId: existingSubscription.id
            });
          }
        } else {
          // Criar nova assinatura na tabela principal
          const newSubscription = {
            user_id: asaasSubscription.user_id,
            plan_id: plan.id,
            status: 'active',
            starts_at: asaasSubscription.started_at || now.toISOString(),
            ends_at: endDate.toISOString(),
            payment_method: 'asaas',
            is_trial: false,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          };
          
          const { error: createError } = await supabase
            .from('subscriptions')
            .insert([newSubscription]);
          
          if (createError) {
            const errorMsg = `Erro ao criar assinatura: ${createError.message}`;
            errors.push(`Assinatura ${asaasSubscription.id}: ${errorMsg}`);
          } else {
            synchronized++;
            results.push({
              userId: asaasSubscription.user_id,
              action: 'created',
              plan: plan.id,
              asaasSubscriptionId: asaasSubscription.id
            });
          }
        }
        
      } catch (error) {
        const errorMsg = `Erro ao processar assinatura ${asaasSubscription.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(errorMsg);
      }
    }
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída. ${synchronized} assinaturas sincronizadas.`,
      synchronized,
      total: asaasSubscriptions.length,
      errors,
      results
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET - Listar status das assinaturas (Asaas vs Principal)
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    // Buscar assinaturas Asaas ativas
    const { data: asaasSubscriptions } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('status', 'ACTIVE');
    
    // Buscar assinaturas principais ativas
    const { data: mainSubscriptions } = await supabase
      .from('subscriptions')
      .select('*, plans(name, slug)')
      .eq('status', 'active');
    
    // Comparar e identificar discrepâncias
    const comparison = {
      asaasTotal: asaasSubscriptions?.length || 0,
      mainTotal: mainSubscriptions?.length || 0,
      needsSync: [],
      synced: []
    };
    
    const planTypeToSlugMap: { [key: string]: string } = {
      'FREE': 'free',
      'free': 'free',
      'MICRO_EMPRESA': 'micro_business',
      'micro_business': 'micro_business',
      'PEQUENA_EMPRESA': 'small_business', 
      'small_business': 'small_business',
      'EMPRESA_SIMPLES': 'business_simple',
      'business_simple': 'business_simple',
      'EMPRESA_PLUS': 'business_plus',
      'business_plus': 'business_plus'
    };
    
    if (asaasSubscriptions) {
      for (const asaasSub of asaasSubscriptions) {
        const mainSub = mainSubscriptions?.find(ms => ms.user_id === asaasSub.user_id);
        const expectedPlanSlug = planTypeToSlugMap[asaasSub.plan_type] || 'free';
        
        if (!mainSub) {
          (comparison.needsSync as any[]).push({
            userId: asaasSub.user_id,
            issue: 'missing_main_subscription',
            asaasPlan: asaasSub.plan_type,
            expectedPlanSlug
          });
        } else if (mainSub.plans?.slug !== expectedPlanSlug) {
          (comparison.needsSync as any[]).push({
            userId: asaasSub.user_id,
            issue: 'plan_mismatch',
            asaasPlan: asaasSub.plan_type,
            mainPlan: mainSub.plans?.slug,
            expectedPlanSlug
          });
        } else {
          (comparison.synced as any[]).push({
            userId: asaasSub.user_id,
            plan: mainSub.plans?.slug
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      comparison
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 