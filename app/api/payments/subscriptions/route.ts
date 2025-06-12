import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaasService from '../../../lib/asaas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valores dos planos
const PLAN_VALUES = {
  'FREE': 0,
  'MICRO_EMPRESA': 29.90,
  'PEQUENA_EMPRESA': 49.90,
  'EMPRESA_SIMPLES': 79.90,
  'EMPRESA_PLUS': 129.90
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }

    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Erro na API subscriptions GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      planType,
      billingType = 'PIX',
      cycle = 'MONTHLY',
      creditCard,
      creditCardHolderInfo
    } = body;

    if (!userId || !planType) {
      return NextResponse.json({ 
        error: 'userId e planType são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'Usuário já possui uma assinatura ativa' 
      }, { status: 400 });
    }

    // Buscar cliente Asaas
    const { data: customer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!customer) {
      return NextResponse.json({ 
        error: 'Cliente não encontrado. Crie um cliente primeiro.' 
      }, { status: 400 });
    }

    const planValue = PLAN_VALUES[planType as keyof typeof PLAN_VALUES];
    if (planValue === undefined) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Se for plano gratuito, criar apenas no banco local
    if (planType === 'FREE') {
      const { data: subscription, error } = await supabase
        .from('asaas_subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'ACTIVE',
          value: 0,
          cycle: 'MONTHLY',
          description: 'Plano Gratuito',
          expires_at: '2099-12-31'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar assinatura gratuita:', error);
        return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
      }

      return NextResponse.json({ subscription });
    }

    // Para planos pagos, criar no Asaas
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + (cycle === 'YEARLY' ? 12 : 1));

    const subscriptionData = {
      customer: customer.asaas_customer_id,
      billingType,
      cycle,
      value: planValue,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      description: `Assinatura ${planType}`,
      creditCard,
      creditCardHolderInfo
    };

    // Criar assinatura no Asaas
    const asaasSubscription = await asaasService.createSubscription(subscriptionData);

    // Salvar no banco local
    const { data: subscription, error } = await supabase
      .from('asaas_subscriptions')
      .insert({
        user_id: userId,
        asaas_subscription_id: asaasSubscription.id,
        asaas_customer_id: customer.asaas_customer_id,
        plan_type: planType,
        status: 'ACTIVE',
        value: planValue,
        cycle,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        description: `Assinatura ${planType}`
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar assinatura no banco:', error);
      return NextResponse.json({ error: 'Erro ao salvar assinatura' }, { status: 500 });
    }

    return NextResponse.json({ subscription, asaasSubscription });
  } catch (error) {
    console.error('Erro na API subscriptions POST:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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