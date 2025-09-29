import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// GET - Buscar dados do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }
    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, user_type, phone, whatsapp, profile_image_url, is_active, created_at, updated_at')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Buscar dados do perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Buscar assinatura ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Combinar dados
    const user = {
      id: userData.id,
      email: userData.email,
      name: profileData?.name || userData.name,
      user_type: userData.user_type,
      phone: profileData?.phone || userData.phone,
      whatsapp: profileData?.whatsapp || userData.whatsapp,
      profile_image_url: profileData?.avatar_url || userData.profile_image_url,
      avatar_url: profileData?.avatar_url || userData.profile_image_url,
      account_type: profileData?.account_type || userData.user_type,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plans,
        status: subscription.status,
        starts_at: subscription.starts_at,
        ends_at: subscription.ends_at
      } : null,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// PATCH - Atualizar dados do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const updates = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }
    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Verificar se usuário existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Preparar dados para atualizar na tabela users
    const userUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) userUpdates.name = updates.name;
    if (updates.phone) userUpdates.phone = updates.phone;
    if (updates.whatsapp) userUpdates.whatsapp = updates.whatsapp;

    // Atualizar tabela users se há dados relevantes
    if (Object.keys(userUpdates).length > 1) { // > 1 porque sempre tem updated_at
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) {
      }
    }

    // Preparar dados para atualizar/inserir na tabela profiles
    const profileUpdates = {
      id: userId,
      user_id: userId,
      name: updates.name,
      phone: updates.phone,
      whatsapp: updates.whatsapp,
      avatar_url: updates.avatar_url,
      account_type: updates.account_type,
      subscription: updates.subscription,
      updated_at: new Date().toISOString()
    };

    // Remover campos undefined/null
    Object.keys(profileUpdates).forEach(key => {
      if (profileUpdates[key] === undefined || profileUpdates[key] === null) {
        delete profileUpdates[key];
      }
    });

    // Upsert na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdates);

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar perfil'
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 