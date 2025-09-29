import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

// Lista de emails autorizados como administradores
const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'gouveiarx@gmail.com',
  'gouveiarx@hotmail.com'
];

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

// Cache para estatísticas (TTL: 5 minutos)
let cachedStats: any = null;
let cacheTimestamp: number = 0;
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Enum para status de highlights
enum HighlightStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
  EXPIRED = 'expired'
}

enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Mapeia status do banco para valores esperados pelo frontend admin
 */
function mapStatusForAdmin(dbStatus: string, moderationStatus: string): string {
  if (dbStatus === HighlightStatus.PENDING_REVIEW ||
     (dbStatus === HighlightStatus.PENDING_PAYMENT && moderationStatus === ModerationStatus.PENDING)) {
    return 'pending';
  }
  if (dbStatus === HighlightStatus.ACTIVE && moderationStatus === ModerationStatus.APPROVED) {
    return 'approved';
  }
  if (dbStatus === HighlightStatus.REJECTED || moderationStatus === ModerationStatus.REJECTED) {
    return 'rejected';
  }
  if (dbStatus === HighlightStatus.INACTIVE) {
    return 'inactive';
  }
  return dbStatus;
}

/**
 * GET - Listar highlights/destaques com consulta otimizada
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    // Extrair parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const adminOnly = searchParams.get('adminOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const supabase = getSupabaseAdminClient();

    // Query básica otimizada (sem JOINs - Supabase não suporta JOIN syntax)
    let query = supabase
      .from('highlights')
      .select(`
        id,
        title,
        description,
        image_url,
        video_url,
        media_type,
        media_duration,
        is_active,
        is_admin_post,
        view_count,
        status,
        moderation_status,
        payment_status,
        is_paid,
        expires_at,
        created_at,
        updated_at,
        moderated_by,
        moderated_at,
        moderation_reason,
        user_id
      `, { count: 'exact' });

    // Aplicar filtros
    if (adminOnly) {
      query = query.eq('is_admin_post', true);
    }

    if (status !== 'all') {
      switch (status) {
        case 'pending':
        case 'pendente':
          query = query.in('status', [HighlightStatus.PENDING_PAYMENT, HighlightStatus.PENDING_REVIEW]);
          break;
        case 'approved':
        case 'active':
        case 'ativo':
          query = query.eq('status', HighlightStatus.ACTIVE).eq('moderation_status', ModerationStatus.APPROVED);
          break;
        case 'rejected':
        case 'rejeitado':
          query = query.or(`status.eq.${HighlightStatus.REJECTED},moderation_status.eq.${ModerationStatus.REJECTED}`);
          break;
        case 'inactive':
        case 'inativo':
          query = query.eq('is_active', false);
          break;
        case 'expired':
        case 'expirado':
          query = query.lt('expires_at', new Date().toISOString());
          break;
      }
    }

    // Aplicar paginação e ordenação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: highlights, error: highlightsError, count } = await query;

    if (highlightsError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar highlights: ' + highlightsError.message
      }, { status: 500 });
    }
    // Se não há highlights, retornar resposta vazia
    if (!highlights || highlights.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        highlights: [],
        pagination: {
          total: count || 0,
          offset,
          limit
        },
        stats: await getHighlightStatsCached()
      });
    }

    // Buscar dados dos usuários separadamente (otimizado com batch query)
    const userIds = Array.from(new Set(highlights.map(h => h.user_id).filter(Boolean)));
    // Buscar dados dos usuários em paralelo
    const [usersData, profilesData, businessData] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('users')
        .select('id, name, email, user_type, profile_image_url, phone')
        .in('id', userIds) : Promise.resolve({ data: [] }),

      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, name, email, account_type, avatar_url, phone')
        .in('id', userIds) : Promise.resolve({ data: [] }),

      userIds.length > 0 ? supabase
        .from('business_profiles')
        .select('user_id, company_name, contact_email, logo_url, contact_phone')
        .in('user_id', userIds) : Promise.resolve({ data: [] })
    ]);

    // Criar mapa de usuários para lookup rápido
    const usersMap = new Map();
    const profilesMap = new Map();
    const businessMap = new Map();

    (usersData.data || []).forEach(user => usersMap.set(user.id, user));
    (profilesData.data || []).forEach(profile => profilesMap.set(profile.id, profile));
    (businessData.data || []).forEach(business => businessMap.set(business.user_id, business));
    // Processar dados otimizadamente
    const formattedData = highlights.map(highlight => {
      const user = usersMap.get(highlight.user_id);
      const profile = profilesMap.get(highlight.user_id);
      const business = businessMap.get(highlight.user_id);

      // Resolver dados do usuário priorizando: users > profiles > business_profiles
      const userData = {
        id: highlight.user_id,
        name: user?.name || profile?.name || business?.company_name || 'Usuário não encontrado',
        email: user?.email || profile?.email || business?.contact_email || 'email@nao-encontrado.com',
        avatar: user?.profile_image_url || profile?.avatar_url || business?.logo_url || null,
        phone: user?.phone || profile?.phone || business?.contact_phone || null,
        type: user?.user_type || profile?.account_type || (business?.company_name ? 'business' : 'personal')
      };

      // Detectar tipo de mídia e URL correta
      const correctedMediaType = detectMediaType(highlight.image_url, highlight.video_url, highlight.media_type);
      const correctedMediaUrl = getCorrectMediaUrl(highlight.image_url, highlight.video_url, highlight.media_type);

      return {
        id: highlight.id,
        title: highlight.title || 'Destaque',
        description: highlight.description || '',
        mediaUrl: correctedMediaUrl,
        mediaType: correctedMediaType,
        mediaDuration: highlight.media_duration,
        isActive: highlight.is_active,
        isAdminPost: highlight.is_admin_post,
        viewCount: highlight.view_count || 0,
        status: mapStatusForAdmin(highlight.status, highlight.moderation_status),
        moderationStatus: highlight.moderation_status || ModerationStatus.PENDING,
        paymentStatus: highlight.payment_status,
        isPaid: highlight.is_paid,
        expiresAt: highlight.expires_at,
        createdAt: highlight.created_at,
        moderatedBy: highlight.moderated_by,
        moderatedAt: highlight.moderated_at,
        moderationReason: highlight.moderation_reason,
        user: userData
      };
    });

    // Buscar estatísticas (com cache)
    const stats = await getHighlightStatsCached();
    return NextResponse.json({
      success: true,
      data: formattedData,
      highlights: formattedData, // Campo duplicado para compatibilidade
      pagination: {
        total: count || 0,
        offset,
        limit
      },
      stats
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Detecta o tipo de mídia baseado nas URLs disponíveis
 */
function detectMediaType(imageUrl: string, videoUrl: string, originalType: string): 'image' | 'video' {
  if (videoUrl && videoUrl.trim() !== '') {
    return 'video';
  }
  if (imageUrl && imageUrl.trim() !== '') {
    return 'image';
  }
  return originalType === 'video' ? 'video' : 'image';
}

/**
 * Retorna a URL de mídia correta baseada no tipo
 */
function getCorrectMediaUrl(imageUrl: string, videoUrl: string, mediaType: string): string {
  if (mediaType === 'video' && videoUrl && videoUrl.trim() !== '') {
    return videoUrl;
  }
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  return videoUrl || imageUrl || '/images/placeholder.jpg';
}

/**
 * Obtém estatísticas dos highlights com cache
 */
async function getHighlightStatsCached() {
  const now = Date.now();

  // Verificar se o cache ainda é válido
  if (cachedStats && (now - cacheTimestamp) < STATS_CACHE_TTL) {
    return cachedStats;
  }

  // Cache expirado ou inexistente, buscar novos dados
  const stats = await getHighlightStats();

  // Atualizar cache
  cachedStats = stats;
  cacheTimestamp = now;

  return stats;
}

/**
 * Função para obter estatísticas dos highlights
 */
async function getHighlightStats() {
  try {
    const supabase = getSupabaseAdminClient();
    
    const { data: highlights, error } = await supabase
      .from('highlights')
      .select(`
        id,
        status,
        moderation_status,
        is_active,
        expires_at,
        created_at
      `);
    
    if (error) {
      return getDefaultHighlightStats();
    }
    
    const allHighlights = highlights || [];
    const now = new Date();
    
    // Calcular estatísticas baseadas no novo fluxo de status
    const total = allHighlights.length;
    const pending_payment = allHighlights.filter(h => h.status === 'pending_payment').length;
    const pending_review = allHighlights.filter(h => h.status === 'pending_review').length;
    const active = allHighlights.filter(h => h.status === 'active' && h.moderation_status === 'approved').length;
    const rejected = allHighlights.filter(h => h.moderation_status === 'rejected').length;
    const expired = allHighlights.filter(h => h.expires_at && new Date(h.expires_at) < now).length;
    
    const stats = {
      total,
      pending_payment,
      pending_review, 
      active,
      rejected,
      expired,
      // Manter campos antigos para compatibilidade
      pending: pending_payment + pending_review,
      inactive: total - active
    };
    return stats;
    
  } catch (error) {
    return getDefaultHighlightStats();
  }
}

/**
 * Retorna estatísticas padrão em caso de erro
 */
function getDefaultHighlightStats() {
  return {
    total: 0,
    pending_payment: 0,
    pending_review: 0,
    active: 0,
    rejected: 0,
    expired: 0,
    // Campos antigos para compatibilidade
    pending: 0,
    inactive: 0
  };
}

/**
 * PUT - Atualizar highlight
 */
export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, is_active, expires_at, moderationStatus, rejectionReason, ...otherData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID do highlight é obrigatório'
      }, { status: 400 });
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...otherData
    };
    
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }
    
    if (expires_at) {
      updateData.expires_at = expires_at;
    }
    
    // Lógica de moderação - garantir consistência em todos os campos de status
    if (moderationStatus) {
      updateData.moderation_status = moderationStatus;
      updateData.moderated_at = new Date().toISOString();
      
      if (moderationStatus === 'approved') {
        // Aprovação: ativar destaque com todos os campos consistentes
        updateData.status = 'active';
        updateData.moderation_status = 'approved';
        updateData.is_active = true;
      } else if (moderationStatus === 'rejected') {
        // Rejeição: rejeitar destaque com todos os campos consistentes
        updateData.status = 'rejected';
        updateData.moderation_status = 'rejected';
        updateData.is_active = false;
        if (rejectionReason) {
          updateData.moderation_reason = rejectionReason;
        }
      }
    }
    const supabase = getSupabaseAdminClient();
    
    // Atualizar highlight
    const { data, error } = await supabase
      .from('highlights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar highlight: ${error.message}`);
    }
    return NextResponse.json({
      success: true,
      message: 'Highlight atualizado com sucesso',
      data
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * DELETE - Excluir highlight
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID do highlight é obrigatório'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Excluir highlight
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao excluir highlight: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Highlight excluído com sucesso'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}