import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { asaas } from '../../../../lib/asaas';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper para extrair token do usuário
function extractUserFromRequest(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth_token');
    const authHeader = request.headers.get('authorization');
    
    let token = '';
    if (authCookie) {
      token = authCookie.value;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) return null;
    
    const decoded = JSON.parse(atob(token));
    
    // Verificar se token não expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

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

    // Verificar se usuário já tem assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Usuário já possui uma assinatura ativa' },
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

        const asaasCustomer = await asaas.createCustomer(customerData);
        asaasCustomerId = asaasCustomer.id;

        // Salvar ID do cliente Asaas no usuário
        await supabase
          .from('users')
          .update({
            asaas_customer_id: asaasCustomerId,
            asaas_created_at: new Date().toISOString()
          })
          .eq('id', user.id);

      } catch (asaasError: any) {
        console.error('Erro ao criar cliente no Asaas:', asaasError);
        return NextResponse.json(
          { success: false, error: 'Erro ao processar pagamento. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // Criar assinatura no banco local
    const subscriptionData = {
      user_id: user.id,
      plan_id: plan.id,
      status: 'pending',
      starts_at: new Date().toISOString(),
      ends_at: billing_cycle === 'YEARLY' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_trial: false,
      payment_method: payment_method,
      asaas_customer_id: asaasCustomerId,
      payment_method_asaas: payment_method,
      next_payment_date: new Date().toISOString(),
      payment_gateway: 'asaas'
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select('*')
      .single();

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar assinatura' },
        { status: 500 }
      );
    }

    // Criar cobrança no Asaas
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1); // Vencimento para amanhã

      const paymentData = {
        customer: asaasCustomerId!,
        billingType: payment_method as 'PIX' | 'BOLETO' | 'CREDIT_CARD',
        value: finalPrice,
        dueDate: dueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        description: `${plan.name} - BDC Classificados`,
        externalReference: subscription.id
      };

      const asaasPayment = await asaas.createPayment(paymentData);

      // Buscar QR Code PIX se o método for PIX
      let pixData = null;
      if (payment_method === 'PIX') {
        try {
          const pixResponse: any = await asaas.getPixQrCode(asaasPayment.id!);
          pixData = {
            qr_code: pixResponse.payload,
            qr_code_base64: pixResponse.encodedImage
          };
        } catch (pixError) {
          console.error('Erro ao gerar QR Code PIX:', pixError);
        }
      }

      // Criar registro de pagamento
      const asaasPaymentData: any = asaasPayment;
      const paymentRecord = {
        subscription_id: subscription.id,
        user_id: user.id,
        plan_id: plan.id,
        amount: finalPrice,
        payment_method: payment_method,
        asaas_payment_id: asaasPaymentData.id,
        asaas_customer_id: asaasCustomerId,
        asaas_invoice_url: null,
        asaas_bank_slip_url: null,
        pix_qr_code: pixData?.qr_code,
        pix_qr_code_base64: pixData?.qr_code_base64,
        status: 'pending',
        due_date: dueDate.toISOString(),
        description: `Assinatura ${plan.name}`,
        external_reference: subscription.id,
        coupon_code: coupon_code,
        discount_amount: discount,
        gateway_response: asaasPayment
      };

      const { data: payment } = await supabase
        .from('payments')
        .insert(paymentRecord)
        .select('*')
        .single();

      // Registrar uso do cupom se aplicado
      if (couponData && payment) {
        await supabase
          .from('coupon_usage')
          .insert({
            coupon_id: couponData.id,
            user_id: user.id,
            subscription_id: subscription.id,
            discount_amount: discount
          });

        await supabase
          .from('payment_coupons')
          .insert({
            payment_id: payment.id,
            coupon_id: couponData.id,
            discount_amount: discount
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Assinatura criada com sucesso',
        subscription: {
          id: subscription.id,
          plan: plan,
          status: subscription.status,
          payment_method: payment_method,
          next_payment_date: subscription.next_payment_date,
          amount: finalPrice,
          discount: discount,
          coupon_applied: couponData?.code || null
        },
        payment: {
          id: payment?.id,
          status: 'pending',
          amount: finalPrice,
          due_date: dueDate.toISOString(),
          payment_method: payment_method,
          asaas_payment_id: asaasPayment.id,
          invoice_url: null,
          bank_slip_url: null,
          pix_qr_code: pixData?.qr_code,
          pix_qr_code_base64: pixData?.qr_code_base64
        }
      });

    } catch (paymentError: any) {
      console.error('Erro ao criar cobrança no Asaas:', paymentError);
      
      // Remover assinatura criada em caso de erro
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);

      return NextResponse.json(
        { success: false, error: 'Erro ao processar pagamento. Tente novamente.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 