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

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar cliente Asaas salvo no banco
    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', error);
      return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }

    return NextResponse.json({ customer: customer || null });
  } catch (error) {
    console.error('Erro na API customers GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      email,
      phone,
      cpfCnpj,
      postalCode,
      address,
      addressNumber,
      complement,
      province,
      city,
      state
    } = body;

    if (!userId || !name || !email) {
      return NextResponse.json({ 
        error: 'userId, name e email são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o cliente já existe no banco
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      return NextResponse.json({ customer: existingCustomer });
    }

    // Verificar se já existe no Asaas pelo email
    let asaasCustomer = await asaasService.getCustomerByEmail(email);

    if (!asaasCustomer) {
      // Criar no Asaas
      asaasCustomer = await asaasService.createCustomer({
        name,
        email,
        phone,
        cpfCnpj,
        postalCode,
        address,
        addressNumber,
        complement,
        province,
        city,
        state
      });
    }

    // Salvar no banco local
    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .insert({
        user_id: userId,
        asaas_customer_id: asaasCustomer.id,
        name: asaasCustomer.name,
        email: asaasCustomer.email,
        phone: asaasCustomer.phone,
        cpf_cnpj: asaasCustomer.cpfCnpj,
        postal_code: asaasCustomer.postalCode,
        address: asaasCustomer.address,
        address_number: asaasCustomer.addressNumber,
        complement: asaasCustomer.complement,
        province: asaasCustomer.province,
        city: asaasCustomer.city,
        state: asaasCustomer.state
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar cliente no banco:', error);
      return NextResponse.json({ error: 'Erro ao salvar cliente' }, { status: 500 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Erro na API customers POST:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      email,
      phone,
      cpfCnpj,
      postalCode,
      address,
      addressNumber,
      complement,
      province,
      city,
      state
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar cliente existente
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar cliente:', fetchError);
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Atualizar no banco local
    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .update({
        name,
        email,
        phone,
        cpf_cnpj: cpfCnpj,
        postal_code: postalCode,
        address,
        address_number: addressNumber,
        complement,
        province,
        city,
        state
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Erro na API customers PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 