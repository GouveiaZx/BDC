import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
    
    // Usar Buffer para decodificar corretamente (compatível com authUtils.ts)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar se token não expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Buscar perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, phone, cpf_cnpj')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar dados do perfil na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('name, email, phone')
      .eq('user_id', userId)
      .single();

    // Combinar dados (priorizar dados do perfil se existirem)
    const combinedProfile = {
      id: userData.id,
      email: profileData?.email || userData.email,
      name: profileData?.name || userData.name,
      phone: profileData?.phone || userData.phone,
      cpf_cnpj: userData.cpf_cnpj
    };
    return NextResponse.json({ 
      success: true,
      profile: combinedProfile
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Campos permitidos para atualização
    const allowedFields = [
      'name', 'phone', 'whatsapp', 'bio', 'city_id', 'state', 
      'address', 'zip_code', 'website', 'profile_image_url', 'cpf_cnpj'
    ];

    // Filtrar apenas campos permitidos
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo válido para atualização' },
        { status: 400 }
      );
    }

    // Validações específicas
    if (filteredData.email) {
      delete filteredData.email; // Email não pode ser alterado via esta API
    }

    if (filteredData.cpf_cnpj && filteredData.cpf_cnpj.length > 0) {
      // Validar CPF/CNPJ (remover formatação)
      const cleaned = filteredData.cpf_cnpj.replace(/[^0-9]/g, '');
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        return NextResponse.json(
          { success: false, error: 'CPF/CNPJ inválido' },
          { status: 400 }
        );
      }
      filteredData.cpf_cnpj = cleaned;
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...filteredData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userToken.userId)
      .eq('is_active', true)
      .select(`
        id,
        email,
        name,
        phone,
        whatsapp,
        user_type,
        profile_image_url,
        bio,
        city_id,
        state,
        address,
        zip_code,
        website,
        cpf_cnpj,
        updated_at,
        cities:city_id (
          id,
          name,
          state
        )
      `)
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar perfil' },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        whatsapp: updatedUser.whatsapp,
        user_type: updatedUser.user_type,
        profile_image_url: updatedUser.profile_image_url,
        bio: updatedUser.bio,
        city_id: updatedUser.city_id,
        city: updatedUser.cities,
        state: updatedUser.state,
        address: updatedUser.address,
        zip_code: updatedUser.zip_code,
        website: updatedUser.website,
        cpf_cnpj: updatedUser.cpf_cnpj,
        updated_at: updatedUser.updated_at
      },
      updated_fields: Object.keys(filteredData)
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 