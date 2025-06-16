import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaasService from '../../../lib/asaas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para validar UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Função para gerar UUID válido
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função para garantir userId válido
function ensureValidUserId(userId: string): string {
  if (!userId) {
    console.log('⚠️ UserId vazio, gerando novo UUID');
    return generateUUID();
  }
  
  if (isValidUUID(userId)) {
    console.log('✅ UserId é um UUID válido:', userId);
    return userId;
  }
  
  console.log('⚠️ UserId não é um UUID válido:', userId, 'gerando novo');
  return generateUUID();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');

    if (!rawUserId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const userId = ensureValidUserId(rawUserId);
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
      userId: rawUserId,
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

    if (!rawUserId || !name || !email) {
      console.log('❌ Dados obrigatórios faltando:', { rawUserId, name, email });
      return NextResponse.json({ 
        error: 'userId, name e email são obrigatórios' 
      }, { status: 400 });
    }

    // Garantir que userId seja um UUID válido
    const userId = ensureValidUserId(rawUserId);
    console.log('🔧 UserId processado:', { original: rawUserId, processed: userId });

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

    try {
      // MODO REAL: Criar cliente real no ASAAS
      console.log('🔄 Criando cliente real no ASAAS...');
    
      const customerData = {
      name,
      email,
        phone: phone || undefined,
        cpfCnpj: cpfCnpj || undefined,
        postalCode: postalCode || undefined,
        address: address || undefined,
        addressNumber: addressNumber || undefined,
        complement: complement || undefined,
        province: province || undefined,
        city: city || undefined,
        state: state || undefined
    };

      console.log('📋 Dados para criar cliente no ASAAS:', customerData);

      const asaasCustomer = await asaasService.createCustomer(customerData);
      console.log('✅ Cliente criado no ASAAS:', asaasCustomer.id);

    // Salvar no banco local
    console.log('💾 Salvando cliente no banco local...');
      const localCustomerData = {
      user_id: userId, // Usar o userId validado
        asaas_customer_id: asaasCustomer.id,
        name: asaasCustomer.name || name,
        email: asaasCustomer.email || email,
        phone: asaasCustomer.phone || phone || null,
        cpf_cnpj: asaasCustomer.cpfCnpj || cpfCnpj || null,
        postal_code: asaasCustomer.postalCode || postalCode || null,
        address: asaasCustomer.address || address || null,
        address_number: asaasCustomer.addressNumber || addressNumber || null,
        complement: asaasCustomer.complement || complement || null,
        province: asaasCustomer.province || province || null,
        city: asaasCustomer.city || city || null,
        state: asaasCustomer.state || state || null
    };

      console.log('📋 Dados para inserir no banco:', localCustomerData);

    const { data: customer, error } = await supabase
      .from('asaas_customers')
        .insert(localCustomerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar cliente no banco:', error);
        console.error('📋 Dados que causaram erro:', localCustomerData);
      return NextResponse.json({ 
        error: 'Erro ao salvar cliente no banco de dados',
        details: error.message,
        supabaseError: error
      }, { status: 500 });
    }

      console.log('✅ Cliente salvo com sucesso no banco:', customer.id);
    return NextResponse.json({ 
      customer,
        success: 'Cliente criado com sucesso no ASAAS',
      processedUserId: userId // Retornar o userId processado para o frontend
    });

    } catch (asaasError) {
      console.error('❌ Erro ao criar cliente no ASAAS:', asaasError);
      return NextResponse.json({ 
        error: 'Erro ao criar cliente no ASAAS',
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      }, { status: 500 });
    }
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