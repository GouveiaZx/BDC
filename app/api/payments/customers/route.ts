import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import asaasService from '../../../lib/asaas'; // Temporariamente removido

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

    console.log('🔍 Buscando cliente para userId:', userId);

    // Buscar cliente Asaas salvo no banco
    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar cliente:', error);
      return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }

    console.log('✅ Cliente encontrado:', customer ? 'Sim' : 'Não');
    return NextResponse.json({ customer: customer || null });
  } catch (error) {
    console.error('❌ Erro na API customers GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Dados recebidos para criar cliente:', body);
    
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
      console.log('❌ Dados obrigatórios faltando:', { userId, name, email });
      return NextResponse.json({ 
        error: 'userId, name e email são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o cliente já existe no banco
    console.log('🔍 Verificando se cliente já existe...');
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      console.log('✅ Cliente já existe no banco:', existingCustomer.asaas_customer_id);
      return NextResponse.json({ customer: existingCustomer });
    }

    console.log('🔄 Cliente não existe, criando...');

    // MODO TEMPORÁRIO: Criar cliente mock sem usar Asaas
    console.log('⚠️ MODO TEMPORÁRIO: Criando cliente mock sem Asaas');
    
    const mockAsaasCustomer = {
      id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone: phone || null,
      cpfCnpj: cpfCnpj || null,
      postalCode: postalCode || null,
      address: address || null,
      addressNumber: addressNumber || null,
      complement: complement || null,
      province: province || null,
      city: city || null,
      state: state || null
    };

    console.log('✅ Cliente mock criado:', mockAsaasCustomer.id);

    // Salvar no banco local
    console.log('💾 Salvando cliente no banco local...');
    const customerData = {
      user_id: userId,
      asaas_customer_id: mockAsaasCustomer.id,
      name: mockAsaasCustomer.name || name,
      email: mockAsaasCustomer.email || email,
      phone: mockAsaasCustomer.phone || phone || null,
      cpf_cnpj: mockAsaasCustomer.cpfCnpj || cpfCnpj || null,
      postal_code: mockAsaasCustomer.postalCode || postalCode || null,
      address: mockAsaasCustomer.address || address || null,
      address_number: mockAsaasCustomer.addressNumber || addressNumber || null,
      complement: mockAsaasCustomer.complement || complement || null,
      province: mockAsaasCustomer.province || province || null,
      city: mockAsaasCustomer.city || city || null,
      state: mockAsaasCustomer.state || state || null
    };

    console.log('📋 Dados para inserir:', customerData);

    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar cliente no banco:', error);
      console.error('📋 Dados que causaram erro:', customerData);
      return NextResponse.json({ 
        error: 'Erro ao salvar cliente no banco de dados',
        details: error.message,
        supabaseError: error
      }, { status: 500 });
    }

    console.log('✅ Cliente salvo com sucesso:', customer.id);
    return NextResponse.json({ 
      customer,
      warning: 'Cliente criado em modo temporário sem Asaas'
    });
  } catch (error) {
    console.error('❌ Erro na API customers POST:', error);
    console.error('❌ Stack trace completo:', error.stack);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
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

    console.log('🔄 Atualizando cliente para userId:', userId);

    // Buscar cliente existente
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar cliente:', fetchError);
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Atualizar no banco local
    const updateData = {
      name: name || existingCustomer.name,
      email: email || existingCustomer.email,
      phone: phone || existingCustomer.phone,
      cpf_cnpj: cpfCnpj || existingCustomer.cpf_cnpj,
      postal_code: postalCode || existingCustomer.postal_code,
      address: address || existingCustomer.address,
      address_number: addressNumber || existingCustomer.address_number,
      complement: complement || existingCustomer.complement,
      province: province || existingCustomer.province,
      city: city || existingCustomer.city,
      state: state || existingCustomer.state,
      updated_at: new Date().toISOString()
    };

    const { data: customer, error } = await supabase
      .from('asaas_customers')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
    }

    console.log('✅ Cliente atualizado com sucesso');
    return NextResponse.json({ customer });
  } catch (error) {
    console.error('❌ Erro na API customers PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 