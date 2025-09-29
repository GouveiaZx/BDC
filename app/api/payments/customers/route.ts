import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
      return NextResponse.json({ 
        error: 'Erro ao verificar cliente existente',
        details: searchError.message
      }, { status: 500 });
    }

    if (existingCustomer) {
      
      // Verificar se o cliente existente precisa ser atualizado com CPF
      const needsUpdate = cpfCnpj && cpfCnpj.trim() && (!existingCustomer.cpf_cnpj || existingCustomer.cpf_cnpj.trim() === '');
      
      if (needsUpdate) {
        
        try {
          // Verificar se ASAAS está configurado
          if (!process.env.ASAAS_API_KEY) {
            return NextResponse.json({
              error: 'Serviços de pagamento não configurados no servidor',
              code: 'PAYMENT_SERVICE_UNAVAILABLE'
            }, { status: 503 });
          }

          // Importar dinamicamente o serviço ASAAS
          const { default: asaas } = await import('../../../../lib/asaas');
          
          // Atualizar cliente no ASAAS com CPF
          const updateData = {
            cpfCnpj: cpfCnpj.replace(/\D/g, ''),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            ...(phone && { phone: phone.replace(/\D/g, ''), mobilePhone: phone.replace(/\D/g, '') }),
            ...(postalCode && { postalCode: postalCode.replace(/\D/g, '') }),
            ...(address && { address: address.trim() }),
            ...(addressNumber && { addressNumber: addressNumber.trim() }),
            ...(complement && { complement: complement.trim() }),
            ...(province && { province: province.trim() }),
            ...(city && { city: city.trim() }),
            ...(state && { state: state.trim() })
          };
          
          await asaas.updateCustomer(existingCustomer.asaas_customer_id, updateData);
          
          // Atualizar no banco local
          const localUpdateData = {
            cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.replace(/\D/g, '') || null,
            postal_code: postalCode?.replace(/\D/g, '') || null,
            address: address?.trim() || null,
            address_number: addressNumber?.trim() || null,
            complement: complement?.trim() || null,
            province: province?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            updated_at: new Date().toISOString()
          };
          
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('asaas_customers')
            .update(localUpdateData)
            .eq('user_id', userId)
            .select()
            .single();
            
          if (updateError) {
            return NextResponse.json({ 
              error: 'Erro ao atualizar cliente no banco',
              details: updateError.message
            }, { status: 500 });
          }
          
          
          return NextResponse.json({ 
            success: true,
            customer: updatedCustomer,
            message: 'Cliente atualizado com CPF'
          });
          
        } catch (updateError) {
          return NextResponse.json({ 
            error: 'Erro ao atualizar cliente',
            details: updateError instanceof Error ? updateError.message : 'Erro desconhecido'
          }, { status: 500 });
        }
      }
      
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


    try {
      // Importar dinamicamente o serviço ASAAS
      const { default: asaas } = await import('../../../../lib/asaas');
      
      // CRIAR CLIENTE REAL NO ASAAS
      const asaasCustomer = await asaas.createCustomer(asaasCustomerData);

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

      const { data: customer, error: dbError } = await supabase
        .from('asaas_customers')
        .insert(customerData)
        .select()
        .single();

      if (dbError) {
        
        // Tentar cancelar cliente no ASAAS se houve erro no banco
        try {
          // ASAAS não tem endpoint para deletar clientes, mas podemos tentar atualizar status
        } catch (cleanupError) {
        }
        
        return NextResponse.json({ 
          error: 'Erro ao salvar cliente no banco de dados',
          details: dbError.message
        }, { status: 500 });
      }


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
      return NextResponse.json({ 
        error: `Erro ao criar cliente no ASAAS: ${asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'}`,
        details: asaasError instanceof Error ? asaasError.stack : 'N/A'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
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
      // Importar dinamicamente o serviço ASAAS
      const { default: asaas } = await import('../../../../lib/asaas');
      
      // Atualizar no ASAAS
      const asaasCustomer = await asaas.updateCustomer(existingCustomer.asaas_customer_id, asaasUpdateData);
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
        return NextResponse.json({ error: 'Erro ao atualizar cliente no banco' }, { status: 500 });
      }
      return NextResponse.json({ 
        success: true,
        customer: updatedCustomer,
        asaasCustomer,
        message: 'Cliente atualizado com sucesso'
      });

    } catch (asaasError) {
      return NextResponse.json({ 
        error: `Erro ao atualizar cliente no ASAAS: ${asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'}` 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 