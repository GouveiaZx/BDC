import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function checkManualAuth(request: NextRequest): Promise<boolean> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    if (adminAuthCookie === 'true') {
      
      return true;
    }
    
    if (sbAccessToken) {
      
      return true;
    }
    
    return false;
  } catch (error) {
    
    return false;
  }
}

// Endpoint para obter detalhes completos de um anúncio
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adId = params.id;
    
    if (!adId) {
      return NextResponse.json(
        { error: 'ID do anúncio não fornecido' },
        { status: 400 }
      );
    }
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    
    // Primeiro vamos verificar se o anúncio existe
    try {
      const { data: adExists, error: checkError } = await supabase
        .from('ads')
        .select('id')
        .eq('id', adId)
        .single();
      
      if (checkError) {
        return NextResponse.json(
          { error: 'Erro ao verificar anúncio', details: checkError.message },
          { status: 500 }
        );
      }
      
      if (!adExists) {
        return NextResponse.json(
          { error: 'Anúncio não encontrado' },
          { status: 404 }
        );
      }
    } catch (checkAdError) {
      return NextResponse.json(
        { error: 'Erro interno ao verificar anúncio', details: checkAdError instanceof Error ? checkAdError.message : String(checkAdError) },
        { status: 500 }
      );
    }
    
    // Agora buscar os detalhes completos
    try {
      // Buscar anúncio com detalhes completos
      const { data: ad, error } = await supabase
        .from('ads')
        .select(`
          *
        `)
        .eq('id', adId)
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Erro ao buscar detalhes do anúncio', details: error.message },
          { status: 500 }
        );
      }
      
      if (!ad) {
        return NextResponse.json(
          { error: 'Anúncio não encontrado' },
          { status: 404 }
        );
      }
      // Buscar dados do usuário usando múltiplas estratégias (similar às assinaturas)
      let userData = null;
      const userId = ad.user_id;
      
      if (userId) {
        // Estratégia 1: Buscar na tabela principal 'users'
        try {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select(`
              id, 
              name, 
              email, 
              user_type,
              profile_image_url,
              avatar_url,
              phone,
              whatsapp,
              created_at,
              updated_at
            `)
            .eq('id', userId)
            .single();
          
          if (!usersError && users) {
            userData = {
              id: users.id,
              name: users.name,
              email: users.email,
              phone: users.phone,
              avatar_url: users.profile_image_url || users.avatar_url,
              profile_image: users.profile_image_url || users.avatar_url,
              profile_image_url: users.profile_image_url,
              account_type: users.user_type === 'advertiser' ? 'personal' : users.user_type,
              created_at: users.created_at,
              status: 'active'
            };
            
          }
        } catch (error) {
          
        }
        
        // Estratégia 2: Se não encontrou, buscar na tabela profiles
        if (!userData) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select(`
                id, 
                name, 
                email, 
                account_type, 
                avatar_url, 
                phone,
                created_at
              `)
              .eq('id', userId)
              .single();
            
            if (!profileError && profile) {
              userData = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                account_type: profile.account_type || 'personal',
                created_at: profile.created_at,
                status: 'active'
              };
              
            }
          } catch (error) {
            
          }
        }
        
        // Estratégia 3: Se não encontrou, buscar em business_profiles
        if (!userData) {
          try {
            const { data: business, error: businessError } = await supabase
              .from('business_profiles')
              .select(`
                user_id,
                company_name,
                contact_email,
                contact_phone,
                logo_url
              `)
              .eq('user_id', userId)
              .single();
            
            if (!businessError && business) {
              userData = {
                id: business.user_id,
                name: business.company_name,
                email: business.contact_email,
                phone: business.contact_phone,
                avatar_url: business.logo_url,
                account_type: 'business',
                created_at: null,
                status: 'active'
              };
              
            }
          } catch (error) {
            
          }
        }
        
        // Estratégia 4: Se não encontrou, buscar na tabela businesses
        if (!userData) {
          try {
            const { data: business, error: businessError } = await supabase
              .from('businesses')
              .select(`
                user_id,
                business_name,
                email,
                phone,
                logo_url
              `)
              .eq('user_id', userId)
              .single();
            
            if (!businessError && business) {
              userData = {
                id: business.user_id,
                name: business.business_name,
                email: business.email,
                phone: business.phone,
                avatar_url: business.logo_url,
                account_type: 'business',
                created_at: null,
                status: 'active'
              };
              
            }
          } catch (error) {
            
          }
        }
        
        // Estratégia 5: Se ainda não encontrou, buscar em auth.users
        if (!userData) {
          try {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
            
            if (!authError && authUser?.user) {
              const user = authUser.user;
              userData = {
                id: userId,
                name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
                email: user.email || 'email@nao-encontrado.com',
                phone: user.user_metadata?.phone || null,
                avatar_url: user.user_metadata?.avatar || user.user_metadata?.profile_image || null,
                account_type: user.user_metadata?.account_type || 'personal',
                created_at: user.created_at,
                status: 'active'
              };
              
            }
          } catch (error) {
            
          }
        }
        
        if (!userData) {
          
        }
      }
      
      // Mapear para o formato esperado pela aplicação
      const mappedAd = {
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        subCategory: ad.sub_category,
        images: ad.images || [],
        location: ad.location,
        city: ad.city,
        state: ad.state,
        zipCode: ad.zip_code,
        phone: ad.phone,
        whatsapp: ad.whatsapp,
        showPhone: ad.show_phone,
        isFreeAd: ad.is_free_ad,
        isFeatured: ad.is_featured || false,
        moderationStatus: ad.moderation_status,
        moderationReason: ad.moderation_reason,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at,
        moderatedAt: ad.moderated_at,
        views: ad.views || 0,
        clicks: ad.clicks || 0,
        status: ad.status,
        expiresAt: ad.expires_at,
        sellerType: ad.seller_type || 'personal',
        seller: userData ? {
          id: userData.id,
          name: userData.name || 'Usuário não identificado',
          email: userData.email || 'email@nao-encontrado.com',
          phone: userData.phone,
          avatar: userData.avatar_url || userData.profile_image || userData.profile_image_url || null,
          createdAt: userData.created_at,
          accountType: userData.account_type || 'personal',
          status: userData.status || 'active'
        } : {
          id: ad.user_id,
          name: ad.user_name || 'Usuário Anônimo',
          email: 'email@nao-encontrado.com',
          accountType: 'personal',
          avatar: ad.user_avatar || null
        }
      };
      return NextResponse.json({
        success: true,
        ad: mappedAd
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: 'Erro interno ao buscar dados completos', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar requisição', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// DELETE: Excluir um anúncio específico pelo ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const { id } = params;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do anúncio não fornecido' 
      }, { status: 400 });
    }
    
    // Verificar autenticação manual
    const hasManualAuth = await checkManualAuth(request);
    
    if (!hasManualAuth) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // 1. Verificar se o anúncio existe antes de excluir
    
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('id, title, user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingAd) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Anúncio não encontrado' 
      }, { status: 404 });
    }

    // 2. Excluir tabelas relacionadas primeiro (se houver)
    
    // Excluir visualizações de anúncios
    const { error: viewsError } = await supabase
      .from('ad_views_log')
      .delete()
      .eq('ad_id', id);
    
    if (viewsError) {
      
      // Continuar mesmo com erro - não é crítico
    }
    
    // Excluir fotos de anúncios
    const { error: photosError } = await supabase
      .from('ad_photos')
      .delete()
      .eq('ad_id', id);
    
    if (photosError) {
      
      // Continuar mesmo com erro - não é crítico
    }
    
    // Excluir relatórios de anúncios
    const { error: reportsError } = await supabase
      .from('ad_reports')
      .delete()
      .eq('ad_id', id);
    
    if (reportsError) {
      
      // Continuar mesmo com erro - não é crítico
    }
    
    // 3. Excluir o anúncio principal
    
    const { error: deleteError } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao excluir anúncio: ' + deleteError.message 
      }, { status: 500 });
    }
    
    // 4. Verificar se foi realmente excluído
    
    const { data: checkAd, error: checkError } = await supabase
      .from('ads')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!checkError && checkAd) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Falha na exclusão - anúncio ainda existe' 
      }, { status: 500 });
    }

    // Log da ação para auditoria
    
    return NextResponse.json({ 
      success: true, 
      message: 'Anúncio excluído com sucesso',
      data: {
        id: existingAd.id,
        title: existingAd.title
      }
    });
    
  } catch (error) {
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 