import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '../../lib/jwt';
import { convertTempIdToUUID } from '../../lib/utils';
import { sendAdCreatedEmail } from '../../lib/email-templates/index';

export const dynamic = 'force-dynamic';

// Função auxiliar para criar cliente Supabase seguro
function getSecureSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuração Supabase incompleta');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

// GET - Buscar anúncios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSecureSupabaseClient();

    // Tentar primeiro na tabela ads (nova)
    let query = supabase
      .from('ads')
      .select(`
        *,
        categories!inner(name, slug),
        cities!inner(name, state),
        ad_photos(
          id,
          file_url,
          is_primary,
          sort_order
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (status !== 'all') {
      // Para buscar anúncios públicos, incluir anúncios ativos E aprovados
      if (status === 'active') {
        query = query.eq('status', 'active').eq('moderation_status', 'approved');
      } else {
        query = query.eq('status', status);
      }
    }

    let { data: ads, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar anúncios' },
        { status: 500 }
      );
    }

    // Se não encontrou anúncios na tabela ads, tentar na tabela advertisements (fallback)
    if (!ads || ads.length === 0) {
      try {
        let fallbackQuery = supabase
          .from('advertisements')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Aplicar os mesmos filtros para a tabela advertisements
        if (userId) {
          fallbackQuery = fallbackQuery.eq('user_id', userId);
        }
        
        if (category) {
          fallbackQuery = fallbackQuery.eq('category', category);
        }
        
        if (search) {
          fallbackQuery = fallbackQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        if (status !== 'all') {
          if (status === 'active') {
            fallbackQuery = fallbackQuery.eq('status', 'active').eq('moderation_status', 'approved');
          } else {
            fallbackQuery = fallbackQuery.eq('status', status);
          }
        }

        const { data: advertisementsData, error: advertError } = await fallbackQuery;
        
        if (!advertError && advertisementsData && advertisementsData.length > 0) {
          // Converter dados da tabela advertisements para o formato esperado
          ads = advertisementsData.map(ad => ({
            ...ad,
            // Mapeamento de campos se necessário
            contact_phone: ad.contact_phone || ad.phone,
            contact_whatsapp: ad.contact_whatsapp || ad.whatsapp,
            sub_category: ad.sub_category || 'Geral'
          }));
        } else {
          return NextResponse.json({
            success: true,
            ads: [],
            total: 0
          });
        }
      } catch (fallbackError) {
        return NextResponse.json({
          success: true,
          ads: [],
          total: 0
        });
      }
    }
    // ✅ BUSCAR DADOS DOS USUÁRIOS/VENDEDORES
    const userIds = ads.map(ad => ad.user_id).filter(Boolean);
    const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
    
    let usersMap: Record<string, any> = {};

    if (uniqueUserIds.length > 0) {
      // ESTRATÉGIA 1: Buscar na tabela users (PRIORIDADE - dados mais confiáveis)
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select(`id, name, email, user_type, profile_image_url, phone, whatsapp`)
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            usersMap[user.id] = {
              id: user.id,
              name: user.name || 'Usuário',
              email: user.email,
              account_type: user.user_type || 'personal',
              avatar: user.profile_image_url,
              phone: user.phone,
              whatsapp: user.whatsapp,
              source: 'users',
              priority: 1 // Maior prioridade
            };
          });
          
        }
      } catch (error) {
      }
      
      // ESTRATÉGIA 2: Buscar usuários faltantes na tabela profiles (sem sobrescrever dados do users)
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, account_type, avatar_url, phone')
            .in('id', missingIds);
          
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              // Só adicionar se ainda não existe no map (não sobrescrever dados da tabela users)
              if (!usersMap[profile.id]) {
                usersMap[profile.id] = {
                  id: profile.id,
                  name: profile.name || 'Usuário',
                  email: profile.email,
                  account_type: profile.account_type || 'personal',
                  avatar: profile.avatar_url,
                  phone: profile.phone,
                  source: 'profiles',
                  priority: 2 // Menor prioridade que users
                };
              }
            });
          }
        } catch (error) {
        }
      }
      
      // ESTRATÉGIA 3: Buscar empresas em business_profiles (sem sobrescrever dados anteriores)
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          const { data: businessProfiles, error: businessError } = await supabase
            .from('business_profiles')
            .select(`user_id, company_name, contact_email, contact_phone, logo_url`)
            .in('user_id', stillMissingIds);
          
          if (!businessError && businessProfiles) {
            businessProfiles.forEach(business => {
              // Só adicionar se ainda não existe no map
              if (!usersMap[business.user_id]) {
                usersMap[business.user_id] = {
                  id: business.user_id,
                  name: business.company_name || 'Empresa',
                  email: business.contact_email,
                  account_type: 'business',
                  avatar: business.logo_url,
                  phone: business.contact_phone,
                  source: 'business_profiles',
                  priority: 3 // Menor prioridade
                };
              }
            });
          }
        } catch (error) {
        }
      }
      
      // ESTRATÉGIA 4: Criar perfis básicos para usuários sem dados (última opção)
      const finalMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (finalMissingIds.length > 0 && ads && ads.length > 0) {
        finalMissingIds.forEach(userId => {
          // Buscar dados do anúncio deste usuário para criar perfil básico
          const userAd = ads.find(ad => ad.user_id === userId);
          if (userAd && !usersMap[userId]) {
            usersMap[userId] = {
              id: userId,
              name: 'Anunciante',
              email: userAd.contact_email || '',
              account_type: 'personal',
              avatar: '/images/avatar-placeholder.png',
              phone: userAd.contact_phone || userAd.phone || '',
              whatsapp: userAd.contact_whatsapp || userAd.whatsapp || '',
              source: 'ad_fallback',
              priority: 4 // Menor prioridade de todas
            };
          }
        });
      }
    }

    // ✅ COMBINAR ANÚNCIOS COM DADOS DOS USUÁRIOS
    const adsWithUsers = ads.map(ad => {
      const userData = usersMap[ad.user_id];
      
      // ✅ MANTER COMPATIBILIDADE com propriedades esperadas pelo AdCard
      const userName = userData?.name || 'Anunciante';
      const userAvatar = userData?.avatar || '';
      
      // ✅ FORMATAR IMAGENS DO ANÚNCIO
      const adPhotos = ad.ad_photos || [];
      const sortedPhotos = adPhotos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      const primaryPhoto = adPhotos.find((photo: any) => photo.is_primary) || sortedPhotos[0];
      
      return {
        ...ad,
        // ✅ PROPRIEDADES COMPATÍVEIS com AdCard (formato antigo)
        userName,
        userAvatar,
        userId: ad.user_id,
        // ✅ CAMPOS DE IMAGENS
        images: sortedPhotos.map((photo: any) => photo.file_url),
        photos: sortedPhotos,
        primary_photo: primaryPhoto?.file_url || null,
        // ✅ ADICIONAR DADOS DO SELLER/VENDEDOR (formato novo e completo)
        seller: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar || '',
          type: userData.account_type === 'business' ? 'business' : 'personal',
          phone: userData.phone || ad.contact_phone,
          whatsapp: userData.whatsapp || ad.contact_whatsapp,
          source: userData.source
        } : {
          id: ad.user_id,
          name: userName,
          email: '',
          avatar: userAvatar,
          type: 'personal',
          phone: ad.contact_phone || '',
          whatsapp: ad.contact_whatsapp || '',
          source: 'fallback'
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      ads: adsWithUsers,
      total: adsWithUsers.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo anúncio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      price,
      category,
      subCategory,
      images,
      location,
      city,
      state,
      zipCode,
      phone,
      whatsapp
    } = body;

    if (!userId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = getSecureSupabaseClient();
    
    if (!supabase) {
      throw new Error('Falha ao conectar com o banco de dados');
    }

    // ✅ VALIDAÇÃO CRÍTICA DE PLANOS - Impedir usuários FREE de criar múltiplos anúncios
    // ✅ USAR A MESMA LÓGICA DA API /api/subscriptions/current
    // Buscar assinatura ativa do usuário (nova lógica unificada)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans!inner(
          id,
          name,
          slug,
          plan_type,
          max_ads,
          max_highlights_per_day
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
    }

    // Determinar o plano do usuário
    let userPlan = 'free';
    let maxAds = 1;
    
    if (subscription?.plans) {
      userPlan = subscription.plans.slug || 'free';
      maxAds = subscription.plans.max_ads || 1;
    } else {
      // Buscar dados do usuário (fallback para casos antigos)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .single();

      if (!profileError && userProfile?.subscription_plan && userProfile.subscription_plan !== 'FREE') {
      // Fallback para o campo subscription_plan antigo
        userPlan = userProfile.subscription_plan.toLowerCase();
      // Mapear planos antigos para limites
      const planLimits = {
          'micro_business': 2,
          'small_business': 5,
          'business_simple': 10,
          'business_plus': 20
      };
        maxAds = planLimits[userPlan as keyof typeof planLimits] || 1;
      }
    }
    // Buscar anúncios ativos do usuário
    const { data: activeAds, error: adsError } = await supabase
      .from('ads')
      .select('id, created_at, is_free_ad')
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (adsError) {
    }

    const activeAdsCount = activeAds?.length || 0;
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se usuário pode criar novo anúncio
    if (activeAdsCount >= maxAds) {
      if (userPlan === 'free') {
        // Para usuários FREE: verificar período de espera de 60 dias
        const lastFreeAd = activeAds?.find(ad => ad.is_free_ad);
        if (lastFreeAd) {
          const lastAdDate = new Date(lastFreeAd.created_at);
          const waitingPeriodMs = 60 * 24 * 60 * 60 * 1000; // 60 dias
          const timeSinceLastAd = Date.now() - lastAdDate.getTime();
          
          if (timeSinceLastAd < waitingPeriodMs) {
            const daysRemaining = Math.ceil((waitingPeriodMs - timeSinceLastAd) / (24 * 60 * 60 * 1000));
            
            return NextResponse.json({
              error: `Limite atingido! Usuários gratuitos podem publicar apenas 1 anúncio a cada 60 dias. Aguarde ${daysRemaining} dias ou faça upgrade para um plano pago.`,
              code: 'FREE_PLAN_LIMIT',
              waiting_days: daysRemaining,
              upgrade_needed: true
            }, { status: 403 });
          }
        }
      } else {
        // Para usuários pagos: oferecer anúncio extra
        const extraAdPrice = userPlan === 'free' ? 24.90 : 14.90;
        
        return NextResponse.json({
          error: `Limite de ${maxAds} anúncios atingido. Você pode comprar um anúncio extra por R$ ${extraAdPrice.toFixed(2)} ou fazer upgrade do seu plano.`,
          code: 'PLAN_LIMIT',
          extra_ad_price: extraAdPrice,
          current_limit: maxAds,
          active_ads: activeAdsCount
        }, { status: 403 });
      }
    }

    // Determinar se este é um anúncio gratuito (primeiro do usuário FREE)
    const isFirstFreeAd = userPlan === 'free' && activeAdsCount === 0;

    // Buscar categoria_id baseado na string category (aceita UUID, slug ou nome)
    let categoryQuery = supabase
      .from('categories')
      .select('id, name, slug');
    
    // Verificar se é um UUID válido
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
    
    if (isUUID) {
      // Se for UUID, buscar por ID
      categoryQuery = categoryQuery.eq('id', category);
    } else {
      // Se não for UUID, buscar por slug ou nome
      categoryQuery = categoryQuery.or(`slug.eq.${category},name.ilike.%${category}%`);
    }
    
    const { data: categoryData, error: categoryError } = await categoryQuery
      .limit(1)
      .single();

    if (categoryError || !categoryData) {
      return NextResponse.json(
        { error: `Categoria '${category}' não encontrada. Verifique se a categoria existe no sistema.` },
        { status: 400 }
      );
    }

    // Buscar city_id baseado na cidade
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id, name')
      .ilike('name', `%${city}%`)
      .limit(1)
      .single();

    if (cityError || !cityData) {
      return NextResponse.json(
        { error: `Cidade '${city}' não encontrada. Verifique se a cidade existe no sistema.` },
        { status: 400 }
      );
    }

    const adData = {
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: categoryData.id,
      city_id: cityData.id,
      title,
      description,
      price: parseFloat(price) || 0,
      category,
      sub_category: subCategory || 'Geral',
      images: images || [],
      location: location || `${city}, ${state}`,
      city,
      state,
      zip_code: zipCode || null,
      contact_phone: phone,
      contact_whatsapp: whatsapp,
      whatsapp,
      phone,
      is_free_ad: isFirstFreeAd, // Marcar como anúncio gratuito se for o primeiro do usuário
      status: 'pending', // Anúncios devem começar como pendentes
      moderation_status: 'pending', // Aguardando moderação
      view_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null, // Só será definido quando aprovado
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
    };
    const { data: newAd, error } = await supabase
      .from('ads')
      .insert(adData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar anúncio: ' + error.message },
        { status: 500 }
      );
    }

    // Buscar dados do usuário para envio de email de confirmação
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', userId)
        .single();
      
      if (!userError && userData?.email) {
        // Enviar email de confirmação de criação do anúncio
        const emailResult = await sendAdCreatedEmail({
          userEmail: userData.email,
          userName: userData.name || 'Usuário',
          adTitle: title,
          adId: newAd.id,
          category: categoryData.name
        });
        
        if (emailResult.success) {
        } else {
        }
      }
    } catch (emailError) {
      // Não falhar a criação do anúncio por causa do email
    }

    return NextResponse.json({
      success: true,
      message: 'Anúncio criado com sucesso',
      ad: newAd
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar anúncio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, userId, category, city, ...updateData } = body;
    
    if (!adId || !userId) {
      return NextResponse.json(
        { error: 'ID do anúncio e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSecureSupabaseClient();
    
    if (!supabase) {
      throw new Error('Falha ao conectar com o banco de dados');
    }

    // Verificar se o usuário é dono do anúncio
    const { data: existingAd, error: checkError } = await supabase
      .from('ads')
      .select('user_id, category_id, city_id, category, city')
      .eq('id', adId)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Erro ao verificar anúncio: ' + checkError.message },
        { status: 500 }
      );
    }

    if (!existingAd || existingAd.user_id !== userId) {
      return NextResponse.json(
        { error: 'Anúncio não encontrado ou acesso negado' },
        { status: 403 }
      );
    }
    // Preparar dados para atualização
    let finalUpdateData = {
      ...updateData,
      moderation_status: 'pending',
      status: 'pending',
      updated_at: new Date().toISOString()
    };

    // Converter campos camelCase para snake_case
    
    if (finalUpdateData.subCategory) {
      finalUpdateData.sub_category = finalUpdateData.subCategory;
      delete finalUpdateData.subCategory;
    }
    if (finalUpdateData.zipCode) {
      finalUpdateData.zip_code = finalUpdateData.zipCode;
      delete finalUpdateData.zipCode;
    }
    
    // Outros campos que podem estar em camelCase
    if (finalUpdateData.contactPhone) {
      finalUpdateData.contact_phone = finalUpdateData.contactPhone;
      delete finalUpdateData.contactPhone;
    }
    if (finalUpdateData.contactWhatsapp) {
      finalUpdateData.contact_whatsapp = finalUpdateData.contactWhatsapp;
      delete finalUpdateData.contactWhatsapp;
    }
    if (finalUpdateData.moderationStatus) {
      finalUpdateData.moderation_status = finalUpdateData.moderationStatus;
      delete finalUpdateData.moderationStatus;
    }
    if (finalUpdateData.viewCount) {
      finalUpdateData.view_count = finalUpdateData.viewCount;
      delete finalUpdateData.viewCount;
    }
    if (finalUpdateData.contactCount) {
      finalUpdateData.contact_count = finalUpdateData.contactCount;
      delete finalUpdateData.contactCount;
    }
    if (finalUpdateData.createdAt) {
      finalUpdateData.created_at = finalUpdateData.createdAt;
      delete finalUpdateData.createdAt;
    }
    if (finalUpdateData.updatedAt) {
      finalUpdateData.updated_at = finalUpdateData.updatedAt;
      delete finalUpdateData.updatedAt;
    }
    if (finalUpdateData.publishedAt) {
      finalUpdateData.published_at = finalUpdateData.publishedAt;
      delete finalUpdateData.publishedAt;
    }
    if (finalUpdateData.expiresAt) {
      finalUpdateData.expires_at = finalUpdateData.expiresAt;
      delete finalUpdateData.expiresAt;
    }

    // Se categoria foi alterada, buscar category_id
    if (category && category !== existingAd.category) {
      // Verificar se é um UUID válido
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      
      let categoryQuery = supabase
        .from('categories')
        .select('id, name, slug');
      
      if (isUUID) {
        categoryQuery = categoryQuery.eq('id', category);
      } else {
        categoryQuery = categoryQuery.or(`slug.eq.${category},name.ilike.%${category}%`);
      }
      
      const { data: categoryData, error: categoryError } = await categoryQuery
        .limit(1)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: `Categoria '${category}' não encontrada` },
          { status: 400 }
        );
      }

      finalUpdateData.category_id = categoryData.id;
      finalUpdateData.category = category;
    }

    // Se cidade foi alterada, buscar city_id
    if (city && city !== existingAd.city) {
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('id, name')
        .ilike('name', `%${city}%`)
        .limit(1)
        .single();

      if (cityError || !cityData) {
        return NextResponse.json(
          { error: `Cidade '${city}' não encontrada` },
          { status: 400 }
        );
      }

      finalUpdateData.city_id = cityData.id;
      finalUpdateData.city = city;
    }

    // Remover campos que não devem ser atualizados
    delete finalUpdateData.adId;
    delete finalUpdateData.userId;

    const { data: updatedAd, error } = await supabase
      .from('ads')
      .update(finalUpdateData)
      .eq('id', adId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar anúncio: ' + error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Anúncio atualizado com sucesso',
      ad: updatedAd
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir anúncio
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('adId');
    const userId = searchParams.get('userId');

    if (!adId || !userId) {
      return NextResponse.json(
        { error: 'ID do anúncio e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSecureSupabaseClient();
    
    if (!supabase) {
      throw new Error('Falha ao conectar com o banco de dados');
    }

    // Verificar se o usuário é dono do anúncio
    const { data: existingAd } = await supabase
      .from('ads')
      .select('user_id')
      .eq('id', adId)
      .single();

    if (!existingAd || existingAd.user_id !== userId) {
      return NextResponse.json(
        { error: 'Anúncio não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao excluir anúncio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Anúncio excluído com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}