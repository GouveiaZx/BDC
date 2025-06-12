import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.error('Erro ao extrair token:', error);
    return null;
  }
}

// GET - Buscar perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar dados completos do usuário com LEFT JOIN para evitar erros
    const { data: user, error: userError } = await supabase
      .from('users')
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
        is_active,
        email_verified,
        created_at,
        updated_at,
        last_login_at,
        login_count,
        asaas_customer_id,
        cpf_cnpj,
        cities:city_id (
          id,
          name,
          state
        )
      `)
      .eq('id', userToken.userId)
      .eq('is_active', true)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar assinatura ativa (separadamente para evitar conflitos)
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        starts_at,
        ends_at,
        is_trial,
        ads_used,
        highlights_used_today,
        last_highlight_date,
        payment_method,
        created_at,
        plans!inner (
          id,
          name,
          slug,
          description,
          price_monthly,
          price_yearly,
          max_ads,
          max_highlights_per_day,
          ad_duration_days,
          max_photos_per_ad,
          has_premium_features,
          max_business_categories,
          is_featured
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    // Buscar estatísticas do usuário
    const { data: adsStats, error: adsError } = await supabase
      .from('ads')
      .select('status')
      .eq('user_id', user.id);

    if (adsError) {
      console.error('Erro ao buscar estatísticas de anúncios:', adsError);
    }

    const stats = {
      total_ads: adsStats?.length || 0,
      active_ads: adsStats?.filter(ad => ad.status === 'approved').length || 0,
      pending_ads: adsStats?.filter(ad => ad.status === 'pending').length || 0,
      expired_ads: adsStats?.filter(ad => ad.status === 'expired').length || 0,
      rejected_ads: adsStats?.filter(ad => ad.status === 'rejected').length || 0
    };

    // Processar dados da assinatura
    let subscriptionData = null;
    if (subscriptions && subscriptions.length > 0) {
      const sub = subscriptions[0];
      const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans;
      subscriptionData = {
        id: sub.id,
        plan: plan,
        status: sub.status,
        starts_at: sub.starts_at,
        ends_at: sub.ends_at,
        is_trial: sub.is_trial,
        ads_used: sub.ads_used,
        ads_remaining: Math.max(0, (plan?.max_ads || 1) - sub.ads_used),
        highlights_used_today: sub.highlights_used_today,
        max_highlights_per_day: plan?.max_highlights_per_day || 0,
        payment_method: sub.payment_method,
        created_at: sub.created_at
      };
    }

    // Preparar resposta final
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.whatsapp,
      user_type: user.user_type,
      profile_image_url: user.profile_image_url,
      bio: user.bio,
      city_id: user.city_id,
      city: user.cities,
      state: user.state,
      address: user.address,
      zip_code: user.zip_code,
      website: user.website,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
      login_count: user.login_count,
      has_asaas_account: !!user.asaas_customer_id,
      subscription: subscriptionData,
      stats
    };

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
      console.error('Erro ao atualizar perfil:', updateError);
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
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 