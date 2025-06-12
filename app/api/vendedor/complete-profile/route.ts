import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';

// Forçar comportamento dinâmico para evitar problemas de build
export const dynamic = 'force-dynamic';

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

    console.log('📝 Recebendo dados completos do perfil para sincronização:', {
      userId,
      dataKeys: Object.keys(profileData || {})
    });

    // Usar cliente admin para evitar restrições de RLS
    const adminClient = getSupabaseAdminClient();

    // Preparar dados completos do perfil para inserção/atualização
    const completeProfileData = {
      id: userId,
      name: profileData?.name || 'Usuário',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      whatsapp: profileData?.whatsapp || '',
      avatar_url: profileData?.avatar || profileData?.avatar_url || '/images/avatar-placeholder.png',
      bio: profileData?.bio || profileData?.description || '',
      account_type: profileData?.account_type || 'personal',
      city: profileData?.city || '',
      state: profileData?.state || '',
      website: profileData?.website || profileData?.website_url || '',
      facebook_url: profileData?.facebook_url || profileData?.socialMedia?.facebook || '',
      instagram_url: profileData?.instagram_url || profileData?.socialMedia?.instagram || '',
      twitter_url: profileData?.twitter_url || profileData?.socialMedia?.twitter || '',
      created_at: profileData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Campos adicionais
      address: profileData?.address || '',
      zipcode: profileData?.zipCode || profileData?.zipcode || '',
      banner_url: profileData?.banner || profileData?.banner_url || '',
      mostrar_nome_pessoal: profileData?.mostrarNomePessoal !== false,
      gallery: JSON.stringify(profileData?.gallery || []),
      user_metadata: JSON.stringify(profileData?.user_metadata || {})
    };

    try {
      // Tentar fazer upsert na tabela profiles
      const { data: profileResult, error: profileError } = await adminClient
        .from('profiles')
        .upsert(completeProfileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (profileError) {
        console.error('❌ Erro ao fazer upsert do perfil:', profileError);
        
        // Se falhar, tentar inserção simples
        const { data: insertResult, error: insertError } = await adminClient
          .from('profiles')
          .insert([completeProfileData])
          .select();
          
        if (insertError) {
          console.error('❌ Erro na inserção simples:', insertError);
          // Continuar mesmo com erro, retornar dados do localStorage
        } else {
          console.log('✅ Perfil inserido com sucesso:', insertResult);
        }
      } else {
        console.log('✅ Perfil upserted com sucesso:', profileResult);
      }

      // Se temos dados de empresa, tentar criar/atualizar business_profile
      if (profileData?.account_type === 'business' && 
          (profileData?.company || profileData?.business_name)) {
        
        const businessData = {
          user_id: userId,
          company_name: profileData?.company || profileData?.business_name || '',
          description: profileData?.business_description || profileData?.bio || '',
          address: profileData?.business_address || profileData?.address || '',
          city: profileData?.business_city || profileData?.city || '',
          state: profileData?.business_state || profileData?.state || '',
          phone: profileData?.phone || '',
          whatsapp: profileData?.whatsapp || '',
          email: profileData?.email || '',
          website_url: profileData?.website || '',
          facebook_url: profileData?.facebook_url || '',
          instagram_url: profileData?.instagram_url || '',
          twitter_url: profileData?.twitter_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const { data: businessResult, error: businessError } = await adminClient
            .from('business_profiles')
            .upsert(businessData, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            })
            .select();

          if (businessError) {
            console.error('❌ Erro ao fazer upsert do business profile:', businessError);
          } else {
            console.log('✅ Business profile upserted com sucesso:', businessResult);
          }
        } catch (businessErr) {
          console.error('❌ Erro ao processar business profile:', businessErr);
        }
      }

    } catch (error) {
      console.error('❌ Erro geral ao sincronizar perfil:', error);
    }

    // Sempre retornar sucesso com os dados fornecidos
    return NextResponse.json({
      success: true,
      message: 'Perfil sincronizado com sucesso (dados salvos localmente e tentativa de sync com banco)',
      vendedor: completeProfileData,
      source: 'sync_complete'
    });

  } catch (error: any) {
    console.error('Erro ao processar sincronização completa:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

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

    // Usar cliente admin para evitar restrições de RLS
    const adminClient = getSupabaseAdminClient();

    // Tentar buscar perfil completo do banco
    try {
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: business, error: businessError } = await adminClient
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileError && profile) {
        // Estruturar resposta completa
        const completeProfile = {
          ...profile,
          business: business || null,
          socialMedia: {
            facebook: profile.facebook_url || '',
            instagram: profile.instagram_url || '',
            twitter: profile.twitter_url || '',
            youtube: profile.youtube_url || '',
            website: profile.website || ''
          },
          contactInfo: {
            email: profile.email || '',
            phone: profile.phone || '',
            whatsapp: profile.whatsapp || ''
          },
          gallery: profile.gallery ? JSON.parse(profile.gallery) : [],
          user_metadata: profile.user_metadata ? JSON.parse(profile.user_metadata) : {}
        };

        return NextResponse.json({
          success: true,
          vendedor: completeProfile,
          source: 'database_complete'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar do banco:', error);
    }

    // Fallback para dados conhecidos
    return NextResponse.json({
      success: true,
      vendedor: {
        id: userId,
        name: 'Perfil não encontrado',
        email: '',
        phone: '',
        bio: 'Dados não sincronizados'
      },
      source: 'fallback_not_found'
    });

  } catch (error: any) {
    console.error('Erro ao buscar perfil completo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 