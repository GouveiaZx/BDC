import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function POST(request: NextRequest) {
  try {
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // ✅ BUSCAR TRIALS QUE EXPIRARAM
    const now = new Date();
    const { data: expiredTrials, error: trialError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users!inner(id, name, email, asaas_customer_id),
        plans!inner(id, name, price_monthly)
      `)
      .eq('status', 'trialing')
      .eq('is_trial', true)
      .lt('trial_ends_at', now.toISOString());

    if (trialError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar trials expirados' },
        { status: 500 }
      );
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum trial expirado para processar',
        processed: 0
      });
    }


    const results = [];

    // ✅ PROCESSAR CADA TRIAL EXPIRADO
    for (const subscription of expiredTrials) {
      try {
        const user = subscription.users;
        const plan = subscription.plans;
        
        // Verificar se usuário tem customer ID do Asaas
        if (!user.asaas_customer_id) {
          await cancelExpiredTrial(supabase, subscription.id);
          results.push({
            subscriptionId: subscription.id,
            status: 'cancelled',
            reason: 'No Asaas customer ID'
          });
          continue;
        }

        // ✅ CRIAR COBRANÇA NO ASAAS
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // 3 dias para pagamento

        const paymentData = {
          customer: user.asaas_customer_id,
          billingType: 'PIX' as const,
          value: plan.price_monthly,
          dueDate: dueDate.toISOString().split('T')[0],
          description: `${plan.name} - Primeira cobrança pós-trial`,
          externalReference: subscription.id
        };

        // Importar Asaas dinamicamente para evitar erros se não configurado
        let asaasPayment;
        try {
          const { asaas } = await import('../../../../lib/asaas');
          asaasPayment = await asaas.createPayment(paymentData);
        } catch (asaasError) {
          // Se o Asaas não estiver disponível, cancelar o trial
          await cancelExpiredTrial(supabase, subscription.id);
          results.push({
            subscriptionId: subscription.id,
            status: 'cancelled',
            reason: 'Asaas service unavailable'
          });
          continue;
        }

        // ✅ ATUALIZAR STATUS DA ASSINATURA
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due', // Aguardando primeiro pagamento
            trial_ends_at: now.toISOString(),
            next_payment_date: dueDate.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          results.push({
            subscriptionId: subscription.id,
            status: 'error',
            reason: updateError.message
          });
          continue;
        }

        // ✅ CRIAR REGISTRO DE PAGAMENTO
        const paymentRecord = {
          subscription_id: subscription.id,
          user_id: user.id,
          plan_id: plan.id,
          amount: plan.price_monthly,
          payment_method: 'PIX',
          asaas_payment_id: asaasPayment.id,
          asaas_customer_id: user.asaas_customer_id,
          status: 'pending',
          due_date: dueDate.toISOString(),
          description: `Primeira cobrança pós-trial - ${plan.name}`,
          external_reference: subscription.id,
          gateway_response: asaasPayment
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentRecord);

        if (paymentError) {
        }

        // ✅ CRIAR NOTIFICAÇÃO PARA O USUÁRIO
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title: '⏰ Trial Expirado - Primeira Cobrança',
            message: `Seu período trial de 30 dias expirou. Criamos sua primeira cobrança de R$ ${plan.price_monthly.toFixed(2)} com vencimento em ${dueDate.toLocaleDateString('pt-BR')}. Pague para continuar com todos os benefícios!`,
            type: 'trial_expired',
            related_entity_type: 'subscription',
            related_entity_id: subscription.id
          });

        results.push({
          subscriptionId: subscription.id,
          status: 'payment_created',
          paymentId: asaasPayment.id,
          dueDate: dueDate.toISOString()
        });

      } catch (error) {
        // Em caso de erro, cancelar a assinatura
        await cancelExpiredTrial(supabase, subscription.id);
        
        results.push({
          subscriptionId: subscription.id,
          status: 'cancelled',
          reason: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    return NextResponse.json({
      success: true,
      message: `Processados ${expiredTrials.length} trial(s) expirado(s)`,
      processed: expiredTrials.length,
      results: results
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ✅ FUNÇÃO HELPER: CANCELAR TRIAL EXPIRADO
async function cancelExpiredTrial(supabase: any, subscriptionId: string) {
  const now = new Date();
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      trial_ends_at: now.toISOString(),
      ends_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', subscriptionId);

  if (error) {
  } else {
  }
}

// ✅ ENDPOINT GET PARA VERIFICAR STATUS
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Buscar estatísticas de trials
    const now = new Date();
    const { data: trialStats, error } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, is_trial')
      .eq('is_trial', true);

    if (error) {
      throw error;
    }

    const activeTrials = trialStats?.filter(t => 
      t.status === 'trialing' && new Date(t.trial_ends_at) > now
    ).length || 0;

    const expiredTrials = trialStats?.filter(t => 
      t.status === 'trialing' && new Date(t.trial_ends_at) <= now
    ).length || 0;

    const convertedTrials = trialStats?.filter(t => 
      t.status === 'active' && t.is_trial === false
    ).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        active_trials: activeTrials,
        expired_trials_pending: expiredTrials,
        converted_trials: convertedTrials,
        total_trials: trialStats?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
} 