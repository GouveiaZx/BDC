import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaasService from '../../../lib/asaas';
import { PLANS_CONFIG, getPlanById, PLAN_ID_MAP } from '../../../lib/plansConfig';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para mapear ID do plano para o formato da API
function mapPlanIdToApiFormat(planId: string): string {
  console.log('🔄 Mapeando planId:', planId);
  
  // Mapeamento direto: frontend ID → database enum
  const planMap: Record<string, string> = {
    'free': 'FREE',
    'FREE': 'FREE',
    'micro_business': 'MICRO_EMPRESA',
    'MICRO_BUSINESS': 'MICRO_EMPRESA',
    'small_business': 'PEQUENA_EMPRESA',
    'SMALL_BUSINESS': 'PEQUENA_EMPRESA', 
    'business_simple': 'EMPRESA_SIMPLES',
    'BUSINESS_SIMPLE': 'EMPRESA_SIMPLES',
    'business_plus': 'EMPRESA_PLUS',
    'BUSINESS_PLUS': 'EMPRESA_PLUS'
  };
  
  const mappedValue = planMap[planId] || planId.toUpperCase();
  console.log('✅ Plano mapeado:', planId, '→', mappedValue);
  return mappedValue;
}

// Função para obter valor do plano usando a configuração centralizada
function getPlanValue(planId: string): number {
  console.log('🔍 getPlanValue chamada com planId:', planId);
  
  const plan = getPlanById(planId);
  console.log('📋 Plano encontrado:', plan ? {
    id: plan.id,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice
  } : 'null');
  
  if (!plan) {
    console.error('❌ Plano não encontrado:', planId);
    console.log('📋 IDs de planos disponíveis:', PLANS_CONFIG.map(p => p.id));
    return 0;
  }
  
  console.log('✅ Plano encontrado:', plan.name, 'Valor:', plan.monthlyPrice);
  return plan.monthlyPrice;
}

// Valores dos planos (mantido para compatibilidade, mas usando configuração centralizada)
const PLAN_VALUES = {
  'FREE': 0,
  'MICRO_EMPRESA': 24.90,
  'PEQUENA_EMPRESA': 49.90,
  'EMPRESA_SIMPLES': 99.90,
  'EMPRESA_PLUS': 149.90
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando assinatura para userId:', userId);

    // Buscar assinatura ativa do usuário
    const { data: subscription, error } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }

    console.log('📋 Assinatura encontrada:', subscription ? 'Sim' : 'Não');
    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('❌ Erro na API subscriptions GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Dados recebidos para criar assinatura:', body);
    
    const {
      userId,
      planType,
      billingType = 'PIX',
      cycle = 'MONTHLY',
      creditCard,
      creditCardHolderInfo
    } = body;

    if (!userId || !planType) {
      console.log('❌ Dados obrigatórios faltando:', { userId, planType });
      return NextResponse.json({ 
        error: 'userId e planType são obrigatórios' 
      }, { status: 400 });
    }

    console.log('🔍 Processando plano:', planType);

    // Verificar se o usuário já tem uma assinatura ativa
    console.log('🔄 Verificando assinatura existente...');
    const { data: existingSubscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      console.log('⚠️ Usuário já possui assinatura ativa:', existingSubscription.plan_type);
      return NextResponse.json({ 
        error: 'Usuário já possui uma assinatura ativa' 
      }, { status: 400 });
    }

    // Buscar cliente Asaas
    console.log('🔍 Buscando cliente Asaas...');
    const { data: customer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!customer) {
      console.log('❌ Cliente não encontrado para userId:', userId);
      return NextResponse.json({ 
        error: 'Cliente não encontrado. Crie um cliente primeiro.' 
      }, { status: 400 });
    }

    console.log('✅ Cliente encontrado:', customer.asaas_customer_id);

    // Obter valor do plano usando configuração centralizada
    const planValue = getPlanValue(planType);
    const apiPlanType = mapPlanIdToApiFormat(planType);
    
    console.log('💰 Detalhes do plano:', {
      planType,
      apiPlanType,
      planValue
    });

    if (planValue === 0 && planType !== 'free' && planType !== 'FREE') {
      console.log('❌ Plano inválido ou valor zero:', planType);
      console.log('📋 Planos disponíveis:', PLANS_CONFIG.map(p => p.id));
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Se for plano gratuito, criar apenas no banco local
    if (planType === 'free' || planType === 'FREE') {
      console.log('🆓 Criando assinatura gratuita...');
      const { data: subscription, error } = await supabase
        .from('asaas_subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'FREE', // Usar valor do enum
          status: 'ACTIVE',
          value: 0,
          cycle: 'MONTHLY',
          description: 'Plano Gratuito',
          expires_at: '2099-12-31'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar assinatura gratuita:', error);
        return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
      }

      console.log('✅ Assinatura gratuita criada:', subscription.id);
      return NextResponse.json({ subscription });
    }

    // MODO REAL: Para planos pagos, criar assinatura real no ASAAS
    console.log('💳 Criando assinatura paga no ASAAS...');
    
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + (cycle === 'YEARLY' ? 12 : 1));

    try {
      // Criar assinatura real no ASAAS
      console.log('🔄 Criando assinatura real no ASAAS...');
      
      const subscriptionData = {
        customer: customer.asaas_customer_id,
        billingType,
        value: planValue,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle,
        description: `Assinatura ${apiPlanType} - BDC Classificados`,
        creditCard,
        creditCardHolderInfo
      };

      console.log('📋 Dados para criar assinatura no ASAAS:', subscriptionData);

      const asaasSubscription = await asaasService.createSubscription(subscriptionData);
      console.log('✅ Assinatura criada no ASAAS:', asaasSubscription.id);

      // Salvar no banco local
      console.log('💾 Salvando assinatura no banco local...');
      
      // Validar dados antes de inserir
      const validPlanTypes = ['FREE', 'MICRO_EMPRESA', 'PEQUENA_EMPRESA', 'EMPRESA_SIMPLES', 'EMPRESA_PLUS'];
      if (!validPlanTypes.includes(apiPlanType)) {
        console.error('❌ Tipo de plano inválido para o banco:', apiPlanType);
        console.log('✅ Tipos válidos:', validPlanTypes);
        return NextResponse.json({ error: 'Tipo de plano inválido' }, { status: 400 });
      }
      
      const localSubscriptionData = {
        user_id: userId,
        asaas_subscription_id: asaasSubscription.id,
        asaas_customer_id: customer.asaas_customer_id,
        plan_type: apiPlanType, // Usar valor mapeado para o enum
        status: 'ACTIVE',
        value: parseFloat(planValue.toString()), // Garantir que é número
        cycle,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        description: `Assinatura ${apiPlanType} - BDC Classificados`
      };

      console.log('📋 Dados da assinatura para inserir no banco:', localSubscriptionData);
      console.log('🔍 Validações:');
      console.log('  - userId:', userId, typeof userId, 'válido UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));
      console.log('  - asaas_subscription_id:', asaasSubscription.id, typeof asaasSubscription.id);
      console.log('  - asaas_customer_id:', customer.asaas_customer_id, typeof customer.asaas_customer_id);
      console.log('  - plan_type:', apiPlanType, typeof apiPlanType, 'válido:', validPlanTypes.includes(apiPlanType));
      console.log('  - value:', planValue, typeof planValue, 'parseado:', parseFloat(planValue.toString()));
      console.log('  - cycle:', cycle, typeof cycle);
      console.log('  - next_due_date:', nextDueDate.toISOString().split('T')[0]);

      const { data: subscription, error } = await supabase
        .from('asaas_subscriptions')
        .insert(localSubscriptionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar assinatura no banco:', error);
        console.error('📋 Código do erro:', error.code);
        console.error('📋 Mensagem do erro:', error.message);
        console.error('📋 Detalhes do erro:', error.details);
        console.error('📋 Dados que causaram erro:', localSubscriptionData);
        
        // Tentar cancelar a assinatura no ASAAS se falhou ao salvar no banco
        try {
          console.log('🔄 Tentando cancelar assinatura no ASAAS devido ao erro...');
          await asaasService.cancelSubscription(asaasSubscription.id);
          console.log('✅ Assinatura cancelada no ASAAS');
        } catch (cancelError) {
          console.error('❌ Erro ao cancelar assinatura no ASAAS:', cancelError);
        }
        
        return NextResponse.json({ 
          error: 'Erro ao salvar assinatura',
          details: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        }, { status: 500 });
      }

      console.log('✅ Assinatura salva com sucesso no banco:', subscription.id);
      return NextResponse.json({ 
        subscription, 
        asaasSubscription,
        success: 'Assinatura criada com sucesso no ASAAS'
      });

    } catch (asaasError) {
      console.error('❌ Erro ao criar assinatura no ASAAS:', asaasError);
      return NextResponse.json({ 
        error: 'Erro ao criar assinatura no ASAAS',
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Erro na API subscriptions POST:', error);
    console.error('❌ Stack trace completo:', error.stack);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar assinatura ativa
    const { data: subscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Se tem ID do Asaas, cancelar lá também
    if (subscription.asaas_subscription_id) {
      await asaasService.cancelSubscription(subscription.asaas_subscription_id);
    }

    // Atualizar status no banco local
    const { error } = await supabase
      .from('asaas_subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
    }

    // Criar assinatura gratuita
    const { data: freeSubscription, error: freeError } = await supabase
      .from('asaas_subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'FREE',
        status: 'ACTIVE',
        value: 0,
        cycle: 'MONTHLY',
        description: 'Plano Gratuito - Downgrade',
        expires_at: '2099-12-31'
      })
      .select()
      .single();

    if (freeError) {
      console.error('Erro ao criar assinatura gratuita:', freeError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura cancelada com sucesso',
      newSubscription: freeSubscription
    });
  } catch (error) {
    console.error('Erro na API subscriptions DELETE:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 