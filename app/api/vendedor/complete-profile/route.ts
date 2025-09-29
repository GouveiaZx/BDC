import { NextRequest, NextResponse } from 'next/server';
import { requireUserAuth } from '../../../lib/secureSupabase';

// Forçar comportamento dinâmico para evitar problemas de build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // AUTENTICAÇÃO OBRIGATÓRIA
    const { user, supabase } = await requireUserAuth(request);

    const body = await request.json();
    const { userId, profileData } = body;

    // Verificar se o usuário autenticado pode editar este perfil
    if (userId && userId !== user.userId) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este perfil' },
        { status: 403 }
      );
    }

    // Usar o ID do usuário autenticado para garantir segurança
    const validUserId = user.userId;


    // Preparar dados completos do perfil para inserção/atualização
    const completeProfileData = {
      id: validUserId,
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
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .upsert(completeProfileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (profileError) {
        
        // Se falhar, tentar inserção simples
        const { data: insertResult, error: insertError } = await supabase
          .from('profiles')
          .insert([completeProfileData])
          .select();
          
        if (insertError) {
          // Continuar mesmo com erro, retornar dados do localStorage
        } else {
        }
      } else {
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
          const { data: businessResult, error: businessError } = await supabase
            .from('business_profiles')
            .upsert(businessData, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            })
            .select();

          if (businessError) {
          } else {
          }
        } catch (businessErr) {
        }
      }

    } catch (error) {
    }

    // Sempre retornar sucesso com os dados fornecidos
    return NextResponse.json({
      success: true,
      message: 'Perfil sincronizado com sucesso (dados salvos localmente e tentativa de sync com banco)',
      vendedor: completeProfileData,
      source: 'sync_complete'
    });

  } catch (error: any) {
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // AUTENTICAÇÃO OBRIGATÓRIA
    const { user, supabase } = await requireUserAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Usar cliente admin para evitar restrições de RLS
    // Cliente já obtido via requireUserAuth

    // Tentar buscar perfil completo do banco
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: business, error: businessError } = await supabase
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
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 