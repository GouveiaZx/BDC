import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
 * POST - Processar pagamento para anúncio extra
 * Esta API cria uma cobrança para um anúncio extra e salva as informações no banco de dados
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se usuário está autenticado
    const cookieStore = cookies();
    const supabaseAuthCookie = cookieStore.get('sb-' + supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1])?.value || '';
    
    // Cliente Supabase para auth do usuário
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          cookie: `sb-${supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]}=${supabaseAuthCookie}`
        }
      }
    });
    
    // Obter usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado', details: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Obter body da requisição
    const body = await request.json();
    const { 
      paymentMethod,
      cardDetails
    } = body;
    // Verificar se o usuário já tem um cliente Asaas
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('asaas_customers')
      .select('asaas_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do cliente' },
        { status: 500 }
      );
    }
    
    let customerId;
    
    if (!customerData) {
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email, phone, name, cpf')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar dados do usuário' },
          { status: 500 }
        );
      }
      
      // Criar cliente no Asaas
      const { default: asaas } = await import('../../../../lib/asaas');
      
      const customerPayload = {
        name: userData.name || 'Usuário',
        email: userData.email,
        phone: userData.phone || undefined,
        cpfCnpj: userData.cpf || undefined,
        notificationDisabled: false
      };
      
      try {
        const asaasCustomer = await asaas.createCustomer(customerPayload);
        customerId = (asaasCustomer as any).id;
        
        // Salvar cliente no banco
        await supabaseAdmin.from('asaas_customers').insert({
          user_id: user.id,
          asaas_customer_id: customerId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          cpf_cnpj: userData.cpf || null,
          created_at: new Date().toISOString()
        });
      } catch (asaasError) {
        return NextResponse.json(
          { success: false, error: 'Erro ao criar perfil de pagamento', details: asaasError },
          { status: 500 }
        );
      }
    } else {
      customerId = customerData.asaas_customer_id;
    }
    
    // Criar cobrança usando a API charges centralizada
    try {
      // Determinar tipo de cobrança com base no método de pagamento
      let billingType;
      switch (paymentMethod) {
        case 'credit':
          billingType = 'CREDIT_CARD';
          break;
        case 'pix':
          billingType = 'PIX';
          break;
        case 'boleto':
          billingType = 'BOLETO';
          break;
        default:
          billingType = 'PIX';
      }
      // Preparar dados da cobrança
      const chargeData = {
        customer: customerId,
        billingType: billingType,
        value: 24.90, // Valor fixo do anúncio extra
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencimento amanhã
        description: 'Anúncio Extra - Validade de 90 dias',
        externalReference: `extra_ad_${user.id}_${Date.now()}`,
        ...(billingType === 'CREDIT_CARD' && cardDetails ? {
          creditCard: {
            holderName: cardDetails.cardName,
            number: cardDetails.cardNumber.replace(/\s/g, ''),
            expiryMonth: cardDetails.expiryDate.split('/')[0],
            expiryYear: '20' + cardDetails.expiryDate.split('/')[1],
            ccv: cardDetails.cvv
          },
          creditCardHolderInfo: {
            name: cardDetails.cardName,
            email: user.email,
            cpfCnpj: cardDetails.cpfCnpj || '',
            postalCode: cardDetails.postalCode || '',
            addressNumber: cardDetails.addressNumber || '',
            phone: cardDetails.phone || ''
          }
        } : {})
      };
      
      // Chamar API de cobranças centralizada
      const chargeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/payments/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chargeData)
      });
      
      if (!chargeResponse.ok) {
        const errorData = await chargeResponse.text();
        return NextResponse.json(
          { success: false, error: 'Erro ao processar pagamento', details: errorData },
          { status: 500 }
        );
      }
      
      const chargeResult = await chargeResponse.json();
      const chargeId = chargeResult.charge?.id || chargeResult.payment?.id;
      const transactionId = chargeResult.transaction?.id;
      
      if (!chargeId) {
        return NextResponse.json(
          { success: false, error: 'Erro ao processar pagamento - ID não encontrado' },
          { status: 500 }
        );
      }
      
      // Salvar referência do anúncio extra a ser ativado após pagamento
      const { error: pendingError } = await supabaseAdmin.from('extra_ads_pending').insert({
        user_id: user.id,
        asaas_payment_id: chargeId,
        transaction_id: transactionId,
        status: 'pending',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        created_at: new Date().toISOString()
      });
      
      if (pendingError) {
        // Continuar mesmo com erro, pois o pagamento foi criado
      }
      
      // Atualizar transação para incluir user_id
      if (transactionId) {
        await supabaseAdmin
          .from('transactions')
          .update({ user_id: user.id })
          .eq('id', transactionId);
      }
      // Preparar resposta baseada no método de pagamento
      const responseData = {
        success: true,
        message: 'Pagamento processado com sucesso',
        data: {
          paymentId: chargeId,
          status: chargeResult.charge?.status || chargeResult.payment?.status,
          invoiceUrl: chargeResult.charge?.invoiceUrl || chargeResult.payment?.invoiceUrl,
          ...(billingType === 'BOLETO' ? { 
            bankSlipUrl: chargeResult.charge?.bankSlipUrl || chargeResult.payment?.bankSlipUrl
          } : {}),
          ...(billingType === 'PIX' ? { 
            pixQrCode: chargeResult.charge?.pixQrCode || chargeResult.payment?.pixQrCode || chargeResult.pixQrCodeUrl,
            pixCode: chargeResult.charge?.pixCode || chargeResult.payment?.pixCode || chargeResult.pixCopyAndPaste
          } : {})
        }
      };
      return NextResponse.json(responseData);
      
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao processar pagamento', details: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 