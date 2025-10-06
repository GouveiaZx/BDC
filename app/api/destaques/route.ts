import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { convertTempIdToUUID } from '../../lib/utils';
import { SubscriptionPlan } from '../../models/types';
import { canFeatureAd, getSubscriptionLimits } from '../../config/subscription-limits';
import { validateHighlightCreation, isSpecialUser } from '../../lib/planLimits';
import { ADMIN_EMAILS, isAdminEmail } from '../../config/admin';
// Sistema de arquivo JSON temporário removido por ser inadequado para produção
// Usando apenas banco de dados Supabase

// Interface para o destaque
interface Destaque {
  id?: string;
  title: string;
  description?: string;
  media_url: string;
  media_type: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  status?: 'pending' | 'approved' | 'rejected';
  duration?: number;
  reason?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  views?: number;
  priority?: number;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  moderated_at?: string;
  moderated_by?: string;
  is_admin_post?: boolean;
}

export const dynamic = 'force-dynamic';

// GET - Buscar destaques
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'public'; // Mudança: padrão public para exibição
    const onlyApproved = searchParams.get('onlyApproved') === 'true';
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const adminOnly = searchParams.get('adminOnly') === 'true';
    const isAdmin = searchParams.get('admin') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const supabase = getSupabaseAdminClient();

    // Query base
    let query = supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Lógica de filtro de status melhorada
    if (userId && status === 'all') {
      // Para usuários vendo seus próprios destaques, mostrar todos os status
    } else if (status === 'public' || (!isAdmin && !userId)) {
      // Para exibição pública, mostrar apenas ativos/aprovados
      query = query.eq('status', 'active').eq('moderation_status', 'approved');
    } else if (status === 'pending_review') {
      query = query.eq('status', 'pending_review');
    } else if (status === 'pending_payment') {
      query = query.eq('status', 'pending_payment');
    } else if (status === 'active') {
      query = query.eq('status', 'active');
    } else if (status === 'rejected') {
      query = query.eq('status', 'rejected');
    } else if (status !== 'all') {
      // Manter compatibilidade com valores antigos
      if (status === 'approved') {
        query = query.eq('status', 'active').eq('moderation_status', 'approved');
      } else if (status === 'pending') {
        query = query.in('status', ['pending_payment', 'pending_review']);
      } else {
        query = query.eq('status', status);
      }
    }
    
    if (onlyApproved) {
      query = query.eq('status', 'active').eq('moderation_status', 'approved');
    }
    
    // Filtro de expiração - usar apenas expires_at (24h padronizado)
    if (!includeExpired && !userId) {
      const now = new Date().toISOString();
      query = query.gte('expires_at', now);
    }

    // Executar query
    const { data: highlights, error, count } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar destaques',
        error: error.message,
        destaques: [],
        total: 0
      }, { status: 500 });
    }

    // Usar os resultados da query diretamente - filtros já aplicados
    const destaquesFiltrados = highlights || [];
    if (!destaquesFiltrados || destaquesFiltrados.length === 0) {
      return NextResponse.json({
        success: true,
        destaques: [],
        total: 0
      });
    }

    // Buscar dados dos usuários
    const userIds = destaquesFiltrados.map(h => h.user_id).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(userIds));

    let usersMap: Record<string, any> = {};
    if (uniqueUserIds.length > 0) {
      // Estratégia 1: Buscar na tabela users
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, user_type, profile_image_url, avatar_url, phone, whatsapp')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            const isAdmin = user.email && isAdminEmail(user.email);
            usersMap[user.id] = {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.profile_image_url || user.avatar_url,
              isAdmin: isAdmin,
              source: 'users'
            };
          });
        }
      } catch (error) {
      }
      
      // Estratégia 2: Buscar usuários faltantes na tabela profiles
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, name, email, account_type, avatar_url, phone, is_admin')
            .in('user_id', missingIds);
          
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              const isAdmin = profile.is_admin || (profile.email && isAdminEmail(profile.email));
              usersMap[profile.user_id] = {
                id: profile.user_id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar_url,
                isAdmin: isAdmin,
                source: 'profiles'
              };
            });
          }
        } catch (error) {
        }
      }
      
      // Estratégia 3: Buscar usuários ainda faltantes na tabela business_profiles
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          const { data: businessProfiles, error: businessError } = await supabase
            .from('business_profiles')
            .select('user_id, business_name, company_name, business_email, business_logo_url, business_phone, contact_phone')
            .in('user_id', stillMissingIds);
          
          if (!businessError && businessProfiles) {
            businessProfiles.forEach(profile => {
              const isAdmin = profile.business_email && isAdminEmail(profile.business_email);
              usersMap[profile.user_id] = {
                id: profile.user_id,
                name: profile.business_name || profile.company_name,
                email: profile.business_email,
                avatar: profile.business_logo_url,
                isAdmin: isAdmin,
                source: 'business_profiles'
              };
            });
          }
        } catch (error) {
        }
      }
    }

    // Mapear destaques com dados dos usuários
    const destaquesComUsuarios = destaquesFiltrados.map((highlight: any) => {
      const userData = usersMap[highlight.user_id] || {};
      
      // Lógica melhorada para avatar com fallback
      let userAvatar = userData.avatar || userData.avatar_url || userData.profile_image_url;
      
      // Se não tem avatar, gerar um avatar automático baseado no nome
      if (!userAvatar && userData.name) {
        const initials = userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
        userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff&size=128&bold=true&format=png`;
      }
      
      // Se ainda não tem nome nem avatar, usar fallbacks
      const finalName = userData.name || userData.business_name || userData.company_name || 'Anunciante';
      
      // Mapear status do banco para valores esperados pelo frontend - alinhado com admin
      const mapStatus = (dbStatus: string, moderationStatus: string) => {
        // Status aprovado: ativo no banco + moderação aprovada
        if (dbStatus === 'active' && moderationStatus === 'approved') return 'approved';
        
        // Status pendente: aguardando revisão ou pagamento  
        if (dbStatus === 'pending_review') return 'pending';
        if (dbStatus === 'pending_payment') return 'pending_payment';
        
        // Status rejeitado: explicitamente rejeitado ou com moderação rejeitada
        if (dbStatus === 'rejected' || moderationStatus === 'rejected') return 'rejected';
        
        // Status inativo
        if (dbStatus === 'inactive') return 'inactive';
        
        // Fallback para pendente
        return dbStatus || 'pending';
      };
      
      // Determinar o tipo de mídia correto baseado no conteúdo
      let actualMediaType = highlight.media_type || 'image';
      let mediaUrl = '';
      
      // Se há image_url, usar ela (pode ser imagem ou vídeo)
      if (highlight.image_url) {
        mediaUrl = highlight.image_url;
        // Verificar se o conteúdo é realmente um vídeo baseado no base64
        if (highlight.image_url.startsWith('data:video/')) {
          actualMediaType = 'video';
        }
      } 
      // Se há video_url, usar ela
      else if (highlight.video_url) {
        mediaUrl = highlight.video_url;
        actualMediaType = 'video';
      }
      // Fallback para media_url (compatibilidade)
      else if (highlight.media_url) {
        mediaUrl = highlight.media_url;
      }

      return {
        id: highlight.id,
        title: highlight.title || 'Destaque sem título',
        description: highlight.description || '',
        mediaUrl: mediaUrl, // URL da mídia correta
        mediaType: actualMediaType, // Tipo correto baseado no conteúdo
        videoUrl: actualMediaType === 'video' ? mediaUrl : undefined, // Para compatibilidade - undefined é melhor que null
        imageUrl: actualMediaType === 'image' ? mediaUrl : undefined, // Para compatibilidade - undefined é melhor que null
        userId: highlight.user_id,
        userName: finalName, // Frontend espera userName
        userAvatar: userAvatar || '', // Frontend espera userAvatar  
        createdAt: highlight.created_at,
        expiresAt: highlight.expires_at, // Usar expires_at padronizado
        priority: userData.isAdmin ? 10 : (userData.priority || 0), // Prioridade para admins
        moderationStatus: highlight.moderation_status || 'pending',
        status: mapStatus(highlight.status, highlight.moderation_status) // Status mapeado para frontend
      };
    });
    return NextResponse.json({
      success: true,
      destaques: destaquesComUsuarios,
      total: destaquesComUsuarios.length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// POST - Criar novo destaque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      imageUrl,
      videoUrl,
      linkUrl,
      highlightType,
      backgroundColor,
      textColor,
      price,
      discountPercentage,
      duration,
      adId,
      type,
      paymentId,
      paymentMethod,
      status: requestStatus
    } = body;

    if (!userId || !title || (!imageUrl && !videoUrl)) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios: userId, title e pelo menos uma mídia (imagem ou vídeo)'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // ✅ VALIDAÇÃO RIGOROSA: Usar nova função de validação completa
    let userPlan = SubscriptionPlan.FREE;
    
    try {
      // Buscar assinatura ativa do usuário
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plans(slug)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (subscription?.plans?.slug) {
        const planSlugToEnum: Record<string, SubscriptionPlan> = {
          'gratuito': SubscriptionPlan.FREE,
          'micro-empresa': SubscriptionPlan.MICRO_BUSINESS,
          'pequena-empresa': SubscriptionPlan.SMALL_BUSINESS,
          'empresa-simples': SubscriptionPlan.BUSINESS_SIMPLE,
          'empresa-plus': SubscriptionPlan.BUSINESS_PLUS,
        };
        
        userPlan = planSlugToEnum[subscription.plans.slug] || SubscriptionPlan.FREE;
      }
      
    } catch (error) {
    }

    // ✅ VERIFICAÇÃO ESPECIAL: Primeiro verificar se é usuário especial
    const specialUserCheck = await isSpecialUser(userId);
    let validation;
    
    if (specialUserCheck.isSpecial) {
      
      // Usuários especiais sempre podem criar destaques gratuitamente
      validation = {
        success: true,
        canCreate: true,
        price: 0,
        reason: `Conta ${specialUserCheck.isTest ? 'de teste' : 'administrativa'} com destaques gratuitos ilimitados`
      };
    } else {
      // Validação normal para usuários regulares
      const planValidation = await validateHighlightCreation(userId);
      
      if (!planValidation.success) {
        return NextResponse.json({
          success: false,
          message: planValidation.message || 'Não é possível criar o destaque',
          error: 'CREATION_NOT_ALLOWED'
        }, { status: 403 });
      }
      
      validation = {
        success: true,
        canCreate: true,
        price: userPlan === SubscriptionPlan.FREE ? 9.90 : 0, // Preço para plano free
        reason: userPlan === SubscriptionPlan.FREE ? 'Plano gratuito requer pagamento' : 'Destaque incluído no plano'
      };
    }

    // Se requer pagamento e não foi fornecido paymentId
    if (validation.price && validation.price > 0 && !paymentId) {
      return NextResponse.json({
        success: false,
        message: validation.reason || `Destaque requer pagamento de R$ ${validation.price.toFixed(2)}`,
        error: userPlan === SubscriptionPlan.FREE ? 'PLAN_UPGRADE_REQUIRED' : 'PLAN_LIMIT_EXCEEDED',
        requiresPayment: true,
        price: validation.price,
        upgradeOptions: userPlan === SubscriptionPlan.FREE ? {
          individual: `Pagar R$ ${validation.price.toFixed(2)} por este destaque`,
          subscription: 'Assinar um plano mensal e ter destaques inclusos'
        } : {
          individual: `Pagar R$ ${validation.price.toFixed(2)} por destaque adicional`,
          upgrade: 'Fazer upgrade para um plano superior'
        }
      }, { status: 402 }); // 402 Payment Required
    }

    // ✅ DURAÇÃO PADRONIZADA: Sempre 24 horas (será calculada pelo trigger)
    const now = new Date();

    // ✅ OBJETO CORRIGIDO - Usando status padronizado e campos de moderação
    const mediaType = videoUrl ? 'video' : 'image';
    const finalImageUrl = imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjZmNmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlc3RhcXVlPC90ZXh0Pjwvc3ZnPg==';
    
    // Determinar status e moderation_status baseado no fluxo correto
    let finalStatus, moderationStatus;
    
    if (validation.price && validation.price > 0 && !paymentId) {
      // Precisa pagar primeiro
      finalStatus = 'pending_payment';
      moderationStatus = 'pending';
    } else if (paymentId) {
      // Pago, aguardando confirmação de pagamento
      finalStatus = 'pending_payment';
      moderationStatus = 'pending';
    } else {
      // Não precisa pagar, vai direto para revisão
      finalStatus = 'pending_review';
      moderationStatus = 'pending';
    }
    
    const destaque = {
      user_id: userId,
      title,
      description: description || '',
      image_url: finalImageUrl,
      video_url: videoUrl || undefined,
      media_type: mediaType,
      link_url: linkUrl || undefined,
      highlight_type: type || highlightType || 'promotion',
      background_color: backgroundColor || '#FF6B35',
      text_color: textColor || '#FFFFFF',
      price: validation.price || 0,
      discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
      status: finalStatus,
      moderation_status: moderationStatus,
      payment_status: paymentId ? 'pending' : (validation.price ? 'required' : 'not_required'),
      payment_id: paymentId || null,
      is_paid: paymentId ? false : !validation.price,
      payment_amount: validation.price || 0,
      view_count: 0,
      click_count: 0,
      is_active: false,
      is_admin_post: specialUserCheck.isAdmin || false
      // ✅ expires_at será calculado automaticamente pelo trigger (24h)
      // ✅ created_at/updated_at têm valores padrão
    };

    const { data: newDestaque, error } = await supabase
      .from('highlights')
      .insert(destaque)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar destaque: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: paymentId ? 'Destaque criado e aguardando confirmação de pagamento' : 'Destaque criado com sucesso',
      data: newDestaque,
      userPlan: userPlan,
      requiresPayment: !!validation.price,
      validation: validation
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 });
  }
}

// PUT - Atualizar destaque
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...updateData } = body;

    if (!id || !userId) {
      return NextResponse.json({
        success: false,
        message: 'ID do destaque e usuário são obrigatórios'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do destaque
    const { data: existingDestaque } = await supabase
      .from('highlights')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingDestaque || existingDestaque.user_id !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Destaque não encontrado ou acesso negado'
      }, { status: 403 });
    }

    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const { data: updatedDestaque, error } = await supabase
      .from('highlights')
      .update(finalUpdateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar destaque'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque atualizado com sucesso',
      data: updatedDestaque
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// PATCH - Atualizar status do destaque (para moderação)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejectionReason, moderationStatus, isActive } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID do destaque é obrigatório'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Se é para atualizar o status principal
    if (status) {
      updateData.status = status;
      
      // Se for rejeição e houver motivo
      if (status === 'rejected' && rejectionReason) {
        updateData.moderation_reason = rejectionReason;
        updateData.moderated_at = new Date().toISOString();
      }
      
      // Se for aprovação, ativar o destaque
      if (status === 'approved') {
        updateData.is_active = true;
        updateData.moderated_at = new Date().toISOString();
      }
    }

    // Se é para atualizar o status de moderação
    if (moderationStatus !== undefined) {
      updateData.moderation_status = moderationStatus;
      updateData.moderated_at = new Date().toISOString();
      
      if (moderationStatus === 'approved') {
        updateData.is_active = true;
        updateData.status = 'active';
      } else if (moderationStatus === 'rejected') {
        updateData.is_active = false;
        updateData.status = 'rejected';
        if (rejectionReason) {
          updateData.moderation_reason = rejectionReason;
        }
      }
    }

    // Se é para atualizar diretamente o isActive
    if (isActive !== undefined) {
      updateData.is_active = isActive;
      if (isActive) {
        updateData.status = 'active';
        updateData.moderation_status = 'approved';
      } else {
        updateData.status = 'inactive';
      }
    }

    const { data: updatedDestaque, error } = await supabase
      .from('highlights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar destaque: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque atualizado com sucesso',
      data: updatedDestaque
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// DELETE - Excluir destaque
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Aceitar tanto 'id' quanto 'highlightId' para compatibilidade
    const id = searchParams.get('id') || searchParams.get('highlightId');
    const userId = searchParams.get('userId');
    if (!id || !userId) {
      return NextResponse.json({
        success: false,
        message: 'ID do destaque e usuário são obrigatórios'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do destaque
    const { data: existingDestaque } = await supabase
      .from('highlights')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (!existingDestaque || existingDestaque.user_id !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Destaque não encontrado ou acesso negado'
      }, { status: 403 });
    }

    // Apenas permitir exclusão se ainda não foi pago ou se está em rascunho
    if (existingDestaque.status === 'active') {
      return NextResponse.json({
        success: false,
        message: 'Não é possível excluir um destaque ativo. Você pode pausá-lo.'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao excluir destaque'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque excluído com sucesso'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}