import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '../../../lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação usando função segura
    const authValidation = validateAuth(request);

    if (!authValidation.isValid || !authValidation.user) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const userToken = authValidation.user;

    const {
      plan_id,
      payment_method = 'PIX',
      coupon_code,
      billing_cycle = 'MONTHLY',
      cpf_cnpj,
      phone
    } = await request.json();

    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'ID do plano é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userToken.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é plano gratuito
    if (plan.price_monthly === 0) {
      return NextResponse.json(
        { success: false, error: 'Plano gratuito não requer pagamento' },
        { status: 400 }
      );
    }

    // Verificar se usuário já tem assinatura ativa ou em trial
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Usuário já possui uma assinatura ativa ou em período trial' },
        { status: 400 }
      );
    }

    // Aplicar cupom se fornecido
    let discount = 0;
    let couponData = null;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          // Verificar limite de uso do cupom
          const { data: usageCount } = await supabase
            .from('coupon_usage')
            .select('id')
            .eq('coupon_id', coupon.id);

          const totalUsage = usageCount?.length || 0;
          
          if (!coupon.usage_limit || totalUsage < coupon.usage_limit) {
            // Verificar limite por usuário
            const { data: userUsage } = await supabase
              .from('coupon_usage')
              .select('id')
              .eq('coupon_id', coupon.id)
              .eq('user_id', user.id);

            const userUsageCount = userUsage?.length || 0;
            
            if (userUsageCount < coupon.usage_limit_per_user) {
              couponData = coupon;
              
              if (coupon.discount_type === 'percentage') {
                discount = (plan.price_monthly * coupon.discount_value) / 100;
                if (coupon.max_discount_amount) {
                  discount = Math.min(discount, coupon.max_discount_amount);
                }
              } else {
                discount = coupon.discount_value;
              }
            }
          }
        }
      }
    }

    const finalPrice = Math.max(0, plan.price_monthly - discount);

    // Criar ou atualizar cliente no Asaas
    let asaasCustomerId = user.asaas_customer_id;
    
    if (!asaasCustomerId) {
      try {
        // Atualizar dados do usuário se fornecidos
        if (cpf_cnpj || phone) {
          await supabase
            .from('users')
            .update({
              cpf_cnpj: cpf_cnpj || user.cpf_cnpj,
              phone: phone || user.phone,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        }

        const customerData = {
          name: user.name,
          email: user.email,
          phone: phone || user.phone || undefined,
          mobilePhone: phone || user.whatsapp || user.phone || undefined,
          cpfCnpj: cpf_cnpj || user.cpf_cnpj || undefined,
          externalReference: user.id,
          notificationDisabled: false
        };

        // Importar Asaas dinamicamente para evitar erros se não configurado
        let asaasCustomer;
        try {
          const { asaas } = await import('../../../../lib/asaas');
          asaasCustomer = await asaas.createCustomer(customerData);
          asaasCustomerId = asaasCustomer.id;
        } catch (asaasImportError) {
          return NextResponse.json(
            { success: false, error: 'Serviço de pagamento temporiamente indisponível. Tente novamente.' },
            { status: 503 }
          );
        }

        // Salvar ID do cliente Asaas no usuário
        await supabase
          .from('users')
          .update({
            asaas_customer_id: asaasCustomerId,
            asaas_created_at: new Date().toISOString()
          })
          .eq('id', user.id);

      } catch (asaasError: any) {
        return NextResponse.json(
          { success: false, error: 'Erro ao processar dados do cliente. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // ✅ CRIAR ASSINATURA COM PERÍODO TRIAL DE 30 DIAS
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    const firstPaymentDate = new Date(trialEndDate.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 dia após fim do trial
    
    const subscriptionData = {
      user_id: user.id,
      plan_id: plan.id,
      status: 'trialing', // ← Status inicial: período de teste
      starts_at: now.toISOString(),
      trial_ends_at: trialEndDate.toISOString(), // ← Fim do período de teste
      ends_at: billing_cycle === 'YEARLY' 
        ? new Date(trialEndDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_trial: true, // ← Marcar como período trial
      payment_method: payment_method,
      asaas_customer_id: asaasCustomerId,
      payment_method_asaas: payment_method,
      next_payment_date: firstPaymentDate.toISOString(), // ← Primeira cobrança após trial
      payment_gateway: 'asaas'
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select('*')
      .single();

    if (subscriptionError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar assinatura' },
        { status: 500 }
      );
    }

    // ✅ DURANTE TRIAL: NÃO CRIAR COBRANÇA IMEDIATA
    // A primeira cobrança será criada automaticamente quando o trial acabar
    // Trial de 30 dias iniciado com sucesso

    // Registrar uso do cupom se aplicado (mesmo durante trial)
    if (couponData) {
        await supabase
          .from('coupon_usage')
          .insert({
            coupon_id: couponData.id,
            user_id: user.id,
            subscription_id: subscription.id,
            discount_amount: discount
          });
      }

      return NextResponse.json({
        success: true,
      message: `🎉 Trial de 30 dias iniciado! Você tem acesso completo ao plano ${plan.name} até ${trialEndDate.toLocaleDateString('pt-BR')}`,
        subscription: {
          id: subscription.id,
          plan: plan,
        status: 'trialing',
        is_trial: true,
        trial_ends_at: trialEndDate.toISOString(),
        next_payment_date: firstPaymentDate.toISOString(),
          payment_method: payment_method,
          amount: finalPrice,
          discount: discount,
          coupon_applied: couponData?.code || null
        },
      trial_info: {
        is_trial: true,
        trial_days_remaining: 30,
        trial_ends_at: trialEndDate.toISOString(),
        first_charge_date: firstPaymentDate.toISOString(),
        message: "Durante o período trial, você tem acesso completo a todos os recursos do plano escolhido!"
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 