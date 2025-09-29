import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Buscar dados completos do perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do perfil' },
        { status: 500 }
      );
    }

    if (!profileData) {
      // Se o perfil não existe, tentar buscar dados do anúncio para criar um perfil básico
      const { data: adData, error: adError } = await supabase
        .from('advertisements')
        .select('contact_email, contact_phone, contact_whatsapp, city, state, created_at, title')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!adError && adData) {
        // Criar perfil básico baseado nos dados do anúncio
        const basicProfile = {
          id: userId,
          user_id: userId,
          name: 'Anunciante',
          email: adData.contact_email,
          phone: adData.contact_phone,
          whatsapp: adData.contact_whatsapp,
          avatar_url: '/images/avatar-placeholder.png',
          account_type: 'personal',
          created_at: adData.created_at,
          updated_at: new Date().toISOString(),
          user_metadata: '{}',
          city: adData.city,
          state: adData.state
        };

        // Tentar inserir o perfil básico
        try {
          await supabase
            .from('profiles')
            .upsert(basicProfile, { onConflict: 'id' });
          
          // Retornar o perfil criado
          const completeProfile = {
            id: basicProfile.id,
            user_id: basicProfile.user_id,
            name: basicProfile.name,
            email: basicProfile.email,
            phone: basicProfile.phone,
            whatsapp: basicProfile.whatsapp,
            avatar_url: basicProfile.avatar_url,
            account_type: basicProfile.account_type,
            created_at: basicProfile.created_at,
            updated_at: basicProfile.updated_at,
            user_metadata: basicProfile.user_metadata,
            company: '',
            description: '',
            address: '',
            city: basicProfile.city,
            state: basicProfile.state,
            zipCode: '',
            website: '',
            banner: '',
            gallery: [],
            socialMedia: {
              instagram: '',
              facebook: '',
              twitter: '',
              youtube: '',
            },
            mostrarNomePessoal: true,
            businessProfile: null
          };

          return NextResponse.json({
            success: true,
            profile: completeProfile,
            message: 'Perfil básico criado a partir dos dados do anúncio'
          });

        } catch (insertError) {
        }
      }

      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados do business_profile se existir
    const { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (businessError && businessError.code !== 'PGRST116') {
    }
    // Estruturar resposta completa
    const completeProfile = {
      // Dados básicos do perfil
      id: profileData.id,
      user_id: profileData.user_id,
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      whatsapp: profileData.whatsapp || '',
      avatar_url: profileData.avatar_url || '/images/avatar-placeholder.png',
      account_type: profileData.account_type || 'personal',
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
      user_metadata: profileData.user_metadata || '{}',

      // Dados do business_profile (se existir)
      company: businessData?.company_name || businessData?.business_name || '',
      description: businessData?.description || businessData?.business_description || '',
      address: businessData?.address || businessData?.business_address || '',
      city: businessData?.city || '',
      state: businessData?.state || '',
      zipCode: businessData?.zip_code || '',
      website: businessData?.website || businessData?.business_website || '',
      banner: businessData?.banner_url || businessData?.business_cover_url || '',
      gallery: businessData?.gallery || [],

      // Redes sociais
      socialMedia: {
        instagram: businessData?.instagram || '',
        facebook: businessData?.facebook || '',
        twitter: businessData?.twitter || '',
        youtube: businessData?.metadata?.youtube || '',
      },

      // Configurações adicionais
      mostrarNomePessoal: businessData?.metadata?.mostrarNomePessoal !== false,

      // Dados do business_profile brutos (para debug)
      businessProfile: businessData
    };

    return NextResponse.json({
      success: true,
      profile: completeProfile
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profileData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Atualizar dados do perfil principal
    const profileUpdateData = {
      id: userId,
      user_id: userId,
      name: profileData.name || null,
      email: profileData.email || null,
      phone: profileData.phone || null,
      whatsapp: profileData.whatsapp || null,
      avatar_url: profileData.avatar || profileData.avatar_url || null,
      account_type: profileData.account_type || 'personal',
      updated_at: new Date().toISOString(),
      user_metadata: typeof profileData.user_metadata === 'object' 
        ? JSON.stringify(profileData.user_metadata) 
        : (profileData.user_metadata || '{}')
    };

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdateData, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      );
    }

    // Se há dados de empresa/negócio, atualizar business_profiles
    if (profileData.company || profileData.description || profileData.website || 
        profileData.socialMedia || profileData.address) {
      
      const businessUpdateData = {
        user_id: userId,
        company_name: profileData.company || null,
        description: profileData.description || null,
        address: profileData.address || null,
        city: profileData.city || null,
        state: profileData.state || null,
        zip_code: profileData.zipCode || null,
        website: profileData.website || null,
        contact_phone: profileData.whatsapp || profileData.phone || null,
        instagram: profileData.socialMedia?.instagram || null,
        facebook: profileData.socialMedia?.facebook || null,
        twitter: profileData.socialMedia?.twitter || null,
        banner_url: profileData.banner || null,
        gallery: profileData.gallery || [],
        metadata: {
          youtube: profileData.socialMedia?.youtube || null,
          mostrarNomePessoal: profileData.mostrarNomePessoal !== false
        },
        updated_at: new Date().toISOString()
      };

      // Verificar se já existe um business_profile
      const { data: existingBusiness } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingBusiness) {
        // Atualizar existente
        await supabase
          .from('business_profiles')
          .update(businessUpdateData)
          .eq('user_id', userId);
      } else {
        // Criar novo
        await supabase
          .from('business_profiles')
          .insert({
            ...businessUpdateData,
            id: crypto.randomUUID()
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      profile: updatedProfile
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 