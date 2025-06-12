import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaasService from '../../../lib/asaas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar histórico de transações do usuário
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Erro na API transactions GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      amount,
      billingType = 'PIX',
      description,
      dueDate,
      creditCard,
      creditCardHolderInfo
    } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json({ 
        error: 'userId, type e amount são obrigatórios' 
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

    const paymentDueDate = dueDate || new Date().toISOString().split('T')[0];

    // Criar cobrança no Asaas
    const paymentData = {
      customer: customer.asaas_customer_id,
      billingType,
      value: amount,
      dueDate: paymentDueDate,
      description: description || `Pagamento ${type}`,
      externalReference: `${type}_${userId}_${Date.now()}`,
      creditCard,
      creditCardHolderInfo
    };

    const asaasPayment = await asaasService.createPayment(paymentData);

    // Salvar transação no banco local
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        asaas_payment_id: asaasPayment.id,
        asaas_customer_id: customer.asaas_customer_id,
        type,
        status: asaasPayment.status,
        amount,
        net_amount: asaasPayment.netValue,
        billing_type: billingType,
        due_date: paymentDueDate,
        description: description || `Pagamento ${type}`,
        external_reference: paymentData.externalReference,
        invoice_url: asaasPayment.invoiceUrl,
        bank_slip_url: asaasPayment.bankSlipUrl,
        pix_qr_code: asaasPayment.pixTransaction?.qrCode?.encodedImage,
        pix_payload: asaasPayment.pixTransaction?.qrCode?.payload
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar transação no banco:', error);
      return NextResponse.json({ error: 'Erro ao salvar transação' }, { status: 500 });
    }

    return NextResponse.json({ transaction, asaasPayment });
  } catch (error) {
    console.error('Erro na API transactions POST:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Buscar transação específica
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, userId } = body;

    if (!transactionId || !userId) {
      return NextResponse.json({ 
        error: 'transactionId e userId são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar transação no banco
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    // Atualizar status da transação consultando o Asaas
    if (transaction.asaas_payment_id) {
      const asaasPayment = await asaasService.getPayment(transaction.asaas_payment_id);
      
      // Atualizar no banco local
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update({
          status: asaasPayment.status,
          paid_date: asaasPayment.paymentDate ? new Date(asaasPayment.paymentDate).toISOString() : null,
          transaction_receipt_url: asaasPayment.transactionReceiptUrl
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 });
      }

      return NextResponse.json({ transaction: updatedTransaction, asaasPayment });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Erro na API transactions PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 