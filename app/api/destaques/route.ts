import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { convertTempIdToUUID } from '../../lib/utils';
import fs from 'fs';
import path from 'path';

// Sistema de armazenamento temporário para destaques
const TEMP_HIGHLIGHTS_FILE = path.join(process.cwd(), 'temp-destaques.json');

// Funções auxiliares para gerenciar destaques temporários
const saveHighlightTemporarily = (highlightData: any) => {
  try {
    let tempHighlights = [];
    if (fs.existsSync(TEMP_HIGHLIGHTS_FILE)) {
      const fileContent = fs.readFileSync(TEMP_HIGHLIGHTS_FILE, 'utf8');
      tempHighlights = JSON.parse(fileContent);
    }
    tempHighlights.unshift(highlightData); // Adicionar no início
    fs.writeFileSync(TEMP_HIGHLIGHTS_FILE, JSON.stringify(tempHighlights, null, 2));
    console.log('✅ Destaque salvo em arquivo temporário');
    return true;
  } catch (error) {
    console.error('Erro ao salvar destaque temporariamente:', error);
    return false;
  }
};

const getTemporaryHighlights = (userId?: string | null, status?: string | null, moderationStatus?: string | null) => {
  try {
    if (!fs.existsSync(TEMP_HIGHLIGHTS_FILE)) {
      return [];
    }
    
    const fileContent = fs.readFileSync(TEMP_HIGHLIGHTS_FILE, 'utf8');
    let tempHighlights = JSON.parse(fileContent);
    
    // Aplicar filtros
    if (userId) {
      tempHighlights = tempHighlights.filter((highlight: any) => highlight.user_id === userId);
    }
    
    if (status && status !== 'all') {
      tempHighlights = tempHighlights.filter((highlight: any) => highlight.status === status);
    }
    
    if (moderationStatus) {
      tempHighlights = tempHighlights.filter((highlight: any) => highlight.moderation_status === moderationStatus);
    }
    
    return tempHighlights;
  } catch (error) {
    console.error('Erro ao carregar destaques temporários:', error);
    return [];
  }
};

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
  is_admin?: boolean;
}

export const dynamic = 'force-dynamic';

// GET - Buscar destaques
export async function GET(request: NextRequest) {
  try {
    console.log('[Destaques API] Iniciando busca de destaques...');
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'approved'; // Padrão: apenas aprovados
    const onlyApproved = searchParams.get('onlyApproved') === 'true';
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const adminOnly = searchParams.get('adminOnly') === 'true';
    const isAdmin = searchParams.get('admin') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('[Destaques API] Parâmetros:', { 
      userId, status, onlyApproved, includeExpired, adminOnly, isAdmin, limit, offset 
    });

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
    
    // Por padrão, mostrar apenas aprovados (a menos que seja admin ou especificado diferente)
    if (status === 'approved' || (!isAdmin && !onlyApproved)) {
      query = query.eq('status', 'approved');
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (onlyApproved) {
      query = query.eq('status', 'approved');
    }
    
    // Filtro de expiração - por padrão não incluir expirados
    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`end_date.is.null,end_date.gte.${now}`);
    }

    // Executar query
    const { data: highlights, error, count } = await query;

    if (error) {
      console.error('[Destaques API] Erro ao buscar destaques:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar destaques',
        error: error.message,
        destaques: [],
        total: 0
      }, { status: 500 });
    }

    console.log('[Destaques API] Destaques encontrados:', highlights?.length || 0);

    if (!highlights || highlights.length === 0) {
      console.log('[Destaques API] Nenhum destaque encontrado');
      return NextResponse.json({
        success: true,
        destaques: [],
        total: 0
      });
    }

    // Buscar dados dos usuários
    const userIds = highlights.map(h => h.user_id).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(userIds));
    
    let usersMap: Record<string, any> = {};
    const ADMIN_EMAILS = [
      'admin@buscaaquibdc.com.br',
      'gouveiarx@gmail.com',
      'gouveiarx@hotmail.com',
      'rodrigogouveiarx@gmail.com'
    ];
    
    console.log('[Destaques API] Buscando dados para', uniqueUserIds.length, 'usuários únicos');
    
    if (uniqueUserIds.length > 0) {
      // Estratégia 1: Buscar na tabela users
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, user_type, profile_image_url, avatar_url, phone, whatsapp')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
            usersMap[user.id] = {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.profile_image_url || user.avatar_url,
              isAdmin: isAdmin,
              source: 'users'
            };
          });
          console.log('[Destaques API] ✅ Tabela users encontrou', users.length, 'usuários');
        }
      } catch (error) {
        console.error('[Destaques API] Erro ao buscar na tabela users:', error);
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
              const isAdmin = profile.is_admin || (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase()));
              usersMap[profile.user_id] = {
                id: profile.user_id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar_url,
                isAdmin: isAdmin,
                source: 'profiles'
              };
            });
            console.log('[Destaques API] ✅ Tabela profiles encontrou', profiles.length, 'usuários');
          }
        } catch (error) {
          console.error('[Destaques API] Erro ao buscar na tabela profiles:', error);
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
              const isAdmin = profile.business_email && ADMIN_EMAILS.includes(profile.business_email.toLowerCase());
              usersMap[profile.user_id] = {
                id: profile.user_id,
                name: profile.business_name || profile.company_name,
                email: profile.business_email,
                avatar: profile.business_logo_url,
                isAdmin: isAdmin,
                source: 'business_profiles'
              };
            });
            console.log('[Destaques API] ✅ Tabela business_profiles encontrou', businessProfiles.length, 'usuários');
          }
        } catch (error) {
          console.error('[Destaques API] Erro ao buscar na tabela business_profiles:', error);
        }
      }
    }

    console.log('[Destaques API] Total de usuários mapeados:', Object.keys(usersMap).length);

    // Mapear destaques com dados dos usuários
    const destaquesComUsuarios = highlights.map((highlight: any) => {
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
      
      return {
        id: highlight.id,
        title: highlight.title || 'Destaque sem título',
        description: highlight.description || '',
        mediaUrl: highlight.image_url || highlight.media_url || '', // Frontend espera mediaUrl
        mediaType: 'image', // Assumir que são imagens por padrão
        userId: highlight.user_id,
        userName: finalName, // Frontend espera userName
        userAvatar: userAvatar || '', // Frontend espera userAvatar  
        createdAt: highlight.created_at,
        expiresAt: highlight.end_date,
        priority: userData.isAdmin ? 10 : (userData.priority || 0), // Prioridade para admins
        moderationStatus: highlight.moderation_status || 'pending',
        status: highlight.status || 'pending'
      };
    });

    console.log('[Destaques API] Retornando', destaquesComUsuarios.length, 'destaques formatados');

    return NextResponse.json({
      success: true,
      destaques: destaquesComUsuarios,
      total: destaquesComUsuarios.length
    });

  } catch (error) {
    console.error('[Destaques API] Erro geral:', error);
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
      linkUrl,
      highlightType,
      backgroundColor,
      textColor,
      price,
      discountPercentage,
      duration
    } = body;

    if (!userId || !title || !highlightType) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios não fornecidos (userId, title, highlightType)'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Duração fixa de 24 horas (não é cobrado, vai de acordo com o plano)
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24); // Sempre 24 horas

    const destaque = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description: description || '',
      image_url: imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjZmNmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlc3RhcXVlPC90ZXh0Pjwvc3ZnPg==',
      media_type: 'image',
      link_url: linkUrl,
      highlight_type: highlightType,
      background_color: backgroundColor || '#FF6B35',
      text_color: textColor || '#FFFFFF',
      price: price ? parseFloat(price) : null,
      discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      status: 'pending', // Aguarda aprovação do admin
      payment_status: 'not_required', // Não requer pagamento
      is_paid: true, // Incluído no plano
      payment_amount: 0, // Sem custo adicional
      view_count: 0,
      click_count: 0,
      is_active: false, // Inativo até aprovação
      expires_at: endDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newDestaque, error } = await supabase
      .from('highlights')
      .insert(destaque)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar destaque:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar destaque: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque criado com sucesso',
      data: newDestaque
    });

  } catch (error) {
    console.error('Erro interno:', error);
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
      console.error('Erro ao atualizar destaque:', error);
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
    console.error('Erro interno:', error);
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
        updateData.status = 'approved';
      }
    }

    // Se é para atualizar diretamente o isActive
    if (isActive !== undefined) {
      updateData.is_active = isActive;
      updateData.status = isActive ? 'approved' : 'inactive';
    }

    const { data: updatedDestaque, error } = await supabase
      .from('highlights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar destaque:', error);
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
    console.error('Erro interno no PATCH:', error);
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
    const id = searchParams.get('id');
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
      console.error('Erro ao excluir destaque:', error);
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
    console.error('Erro interno:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 