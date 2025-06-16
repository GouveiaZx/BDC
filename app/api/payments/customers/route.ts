import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import asaas from '../../../../lib/asaas';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CustomerData {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomerData = await request.json();
    console.log('🚀 Criando cliente REAL no ASAAS:', body);

    const { userId, name, email, phone, cpfCnpj, postalCode, address, addressNumber, complement, province, city, state } = body;

    // Validações obrigatórias
    if (!userId || !name || !email) {
      return NextResponse.json({ 
        error: 'userId, name e email são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se já existe cliente para este usuário
    const { data: existingCustomer, error: searchError } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Erro na consulta ao banco:', searchError);
      return NextResponse.json({ 
        error: 'Erro ao verificar cliente existente',
        details: searchError.message
      }, { status: 500 });
    }

    if (existingCustomer) {
      console.log('✅ Cliente já existe:', existingCustomer.asaas_customer_id);
      return NextResponse.json({ 
        success: true,
        customer: existingCustomer,
        message: 'Cliente já cadastrado'
      });
    }

    // Preparar dados para o ASAAS
    const asaasCustomerData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.replace(/\D/g, '') || undefined,
      mobilePhone: phone?.replace(/\D/g, '') || undefined,
      cpfCnpj: cpfCnpj?.replace(/\D/g, '') || undefined,
      postalCode: postalCode?.replace(/\D/g, '') || undefined,
      address: address?.trim() || undefined,
      addressNumber: addressNumber?.trim() || undefined,
      complement: complement?.trim() || undefined,
      province: province?.trim() || undefined,
      city: city?.trim() || undefined,
      state: state?.trim() || undefined,
      country: 'Brasil',
      externalReference: `user_${userId}`,
      notificationDisabled: false
    };

    // Remover campos undefined para não enviar dados vazios
    Object.keys(asaasCustomerData).forEach(key => {
      if ((asaasCustomerData as any)[key] === undefined) {
        delete (asaasCustomerData as any)[key];
      }
    });

    console.log('📋 Dados formatados para ASAAS:', asaasCustomerData);

    try {
      // CRIAR CLIENTE REAL NO ASAAS
      console.log('👤 Criando cliente no ASAAS...');
      const asaasCustomer = await asaas.createCustomer(asaasCustomerData);
      console.log('✅ Cliente criado no ASAAS:', asaasCustomer);

      if (!asaasCustomer.id) {
        throw new Error('ASAAS não retornou ID do cliente');
      }

      // Salvar no banco de dados local
      const customerData = {
        user_id: userId,
        asaas_customer_id: asaasCustomer.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.replace(/\D/g, '') || null,
        cpf_cnpj: cpfCnpj?.replace(/\D/g, '') || null,
        postal_code: postalCode?.replace(/\D/g, '') || null,
        address: address?.trim() || null,
        address_number: addressNumber?.trim() || null,
        complement: complement?.trim() || null,
        province: province?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Salvando cliente no banco de dados...');
      const { data: customer, error: dbError } = await supabase
        .from('asaas_customers')
        .insert(customerData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Erro ao salvar cliente no banco:', dbError);
        
        // Tentar cancelar cliente no ASAAS se houve erro no banco
        try {
          // ASAAS não tem endpoint para deletar clientes, mas podemos tentar atualizar status
          console.log('⚠️ Cliente criado no ASAAS mas não salvo no banco local');
        } catch (cleanupError) {
          console.error('❌ Erro ao fazer cleanup:', cleanupError);
        }
        
        return NextResponse.json({ 
          error: 'Erro ao salvar cliente no banco de dados',
          details: dbError.message
        }, { status: 500 });
      }

      console.log('✅ Cliente salvo no banco:', customer);

      return NextResponse.json({ 
        success: true,
        customer: {
          ...customer,
          asaas_customer_id: asaasCustomer.id
        },
        asaasCustomer,
        message: 'Cliente criado com sucesso'
      });

    } catch (asaasError) {
      console.error('❌ Erro na API do ASAAS:', asaasError);
      return NextResponse.json({ 
        error: `Erro ao criar cliente no ASAAS: ${asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'}`,
        details: asaasError instanceof Error ? asaasError.stack : 'N/A'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro geral na API:', error);
    return NextResponse.json({ 
      error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Atualizando cliente:', body);

    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar cliente existente
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização no ASAAS
    const asaasUpdateData = {
      name: updateData.name?.trim(),
      email: updateData.email?.trim().toLowerCase(),
      phone: updateData.phone?.replace(/\D/g, ''),
      mobilePhone: updateData.phone?.replace(/\D/g, ''),
      cpfCnpj: updateData.cpfCnpj?.replace(/\D/g, ''),
      postalCode: updateData.postalCode?.replace(/\D/g, ''),
      address: updateData.address?.trim(),
      addressNumber: updateData.addressNumber?.trim(),
      complement: updateData.complement?.trim(),
      province: updateData.province?.trim(),
      city: updateData.city?.trim(),
      state: updateData.state?.trim()
    };

    // Remover campos undefined
    Object.keys(asaasUpdateData).forEach(key => {
      if ((asaasUpdateData as any)[key] === undefined) {
        delete (asaasUpdateData as any)[key];
      }
    });

    try {
      // Atualizar no ASAAS
      const asaasCustomer = await asaas.updateCustomer(existingCustomer.asaas_customer_id, asaasUpdateData);
      console.log('✅ Cliente atualizado no ASAAS');

      // Atualizar no banco local
      const localUpdateData = {
        name: updateData.name?.trim(),
        email: updateData.email?.trim().toLowerCase(),
        phone: updateData.phone?.replace(/\D/g, ''),
        cpf_cnpj: updateData.cpfCnpj?.replace(/\D/g, ''),
        postal_code: updateData.postalCode?.replace(/\D/g, ''),
        address: updateData.address?.trim(),
        address_number: updateData.addressNumber?.trim(),
        complement: updateData.complement?.trim(),
        province: updateData.province?.trim(),
        city: updateData.city?.trim(),
        state: updateData.state?.trim(),
        updated_at: new Date().toISOString()
      };

      // Remover campos undefined
      Object.keys(localUpdateData).forEach(key => {
        if ((localUpdateData as any)[key] === undefined) {
          delete (localUpdateData as any)[key];
        }
      });

      const { data: updatedCustomer, error: dbError } = await supabase
        .from('asaas_customers')
        .update(localUpdateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Erro ao atualizar cliente no banco:', dbError);
        return NextResponse.json({ error: 'Erro ao atualizar cliente no banco' }, { status: 500 });
      }

      console.log('✅ Cliente atualizado no banco');

      return NextResponse.json({ 
        success: true,
        customer: updatedCustomer,
        asaasCustomer,
        message: 'Cliente atualizado com sucesso'
      });

    } catch (asaasError) {
      console.error('❌ Erro ao atualizar cliente no ASAAS:', asaasError);
      return NextResponse.json({ 
        error: `Erro ao atualizar cliente no ASAAS: ${asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro na API PUT customers:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 