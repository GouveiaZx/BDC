import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

// Enum para o status de moderação
enum HighlightModerationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Listar destaques
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Highlights API] Iniciando requisição GET');
    
    // Verificar autenticação
    if (!verifyAdminAuth(request)) {
      console.log('[Highlights API] Falha na autenticação');
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    // Extrair parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('[Highlights API] Parâmetros:', { status, type, limit, offset });
    
    // Buscar destaques
    let query = supabase
      .from('highlights')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (type !== 'all') {
      query = query.eq('highlight_type', type);
    }
    
    // Aplicar paginação e ordenação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: highlights, error: highlightsError, count } = await query;
    
    if (highlightsError) {
      console.error('[Highlights API] Erro ao buscar destaques:', highlightsError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar destaques: ' + highlightsError.message
      }, { status: 500 });
    }
    
    console.log('[Highlights API] Encontrados', highlights?.length || 0, 'destaques');
    
    // Se não há destaques, retornar resposta vazia
    if (!highlights || highlights.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: count || 0,
          offset,
          limit
        },
        stats: await getHighlightsStats()
      });
    }
    
    // Buscar dados dos usuários relacionados
    const userIds = highlights.map(h => h.user_id).filter(Boolean);
    const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
    
    let usersMap: Record<string, any> = {};
    
    // Buscar dados dos usuários usando estratégia robusta (similar aos anúncios)
    if (uniqueUserIds.length > 0) {
      console.log('[Highlights API] Buscando dados para', uniqueUserIds.length, 'usuários únicos');
      
      // Estratégia 1: Buscar na tabela users
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, user_type, profile_image_url, avatar_url, phone, whatsapp')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            usersMap[user.id] = {
              id: user.id,
              name: user.name,
              email: user.email,
              account_type: user.user_type === 'advertiser' ? 'personal' : user.user_type,
              avatar: user.profile_image_url || user.avatar_url,
              phone: user.phone,
              source: 'users'
            };
          });
          console.log('[Highlights API] ✅ Tabela users encontrou', users.length, 'usuários');
        }
      } catch (error) {
        console.error('[Highlights API] Erro ao buscar na tabela users:', error);
      }
      
      // Estratégia 2: Buscar usuários faltantes na tabela profiles
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          console.log('[Highlights API] Buscando', missingIds.length, 'usuários faltantes na tabela profiles');
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, account_type, avatar_url, phone')
            .in('id', missingIds);
          
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              usersMap[profile.id] = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                account_type: profile.account_type || 'personal',
                avatar: profile.avatar_url,
                phone: profile.phone,
                source: 'profiles'
              };
            });
            console.log('[Highlights API] ✅ Tabela profiles encontrou', profiles.length, 'usuários');
          }
        } catch (error) {
          console.error('[Highlights API] Erro ao buscar na tabela profiles:', error);
        }
      }
      
      // Estratégia 3: Buscar empresas em business_profiles (LOGOS)
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          console.log('[Highlights API] Buscando', stillMissingIds.length, 'empresas em business_profiles');
          const { data: businessProfiles, error: businessError } = await supabase
            .from('business_profiles')
            .select('user_id, company_name, contact_email, contact_phone, logo_url')
            .in('user_id', stillMissingIds);
          
          if (!businessError && businessProfiles) {
            businessProfiles.forEach(business => {
              usersMap[business.user_id] = {
                id: business.user_id,
                name: business.company_name,
                email: business.contact_email,
                account_type: 'business',
                avatar: business.logo_url,
                phone: business.contact_phone,
                source: 'business_profiles'
              };
            });
            console.log('[Highlights API] ✅ Business profiles encontrou', businessProfiles.length, 'empresas');
          }
        } catch (error) {
          console.error('[Highlights API] Erro ao buscar business_profiles:', error);
        }
      }
      
      console.log('[Highlights API] 📊 Total final de usuários mapeados:', Object.keys(usersMap).length, 'de', uniqueUserIds.length);
    }
    
    // Formatar dados para o frontend
    const formattedData = highlights.map(highlight => {
      const user = usersMap[highlight.user_id] || {};
      
      return {
        id: highlight.id,
        title: highlight.title || 'Sem título',
        description: highlight.description || '',
        type: highlight.highlight_type || 'story',
        mediaType: highlight.media_type || 'image',
        status: highlight.status || 'pending',
        imageUrl: highlight.image_url || '',
        linkUrl: highlight.link_url || '',
        linkText: highlight.link_text || '',
        viewCount: highlight.view_count || 0,
        clickCount: highlight.click_count || 0,
        isActive: highlight.is_active || false,
        isAdminPost: highlight.is_admin_post || false,
        isPaid: highlight.is_paid || false,
        paymentAmount: highlight.payment_amount,
        paymentStatus: highlight.payment_status,
        price: highlight.price,
        discountPercentage: highlight.discount_percentage,
        backgroundColor: highlight.background_color,
        textColor: highlight.text_color,
        mediaDuration: highlight.media_duration,
        startDate: highlight.start_date,
        endDate: highlight.end_date,
        expiresAt: highlight.expires_at,
        createdAt: highlight.created_at,
        updatedAt: highlight.updated_at,
        owner: {
          type: 'user',
          id: highlight.user_id,
          name: user.name || 'Proprietário desconhecido',
          email: user.email || 'email@desconhecido.com',
          avatar: user.avatar || null,
          account_type: user.account_type || 'personal',
          phone: user.phone || null
        }
      };
    });
    
    // Buscar estatísticas básicas
    const stats = await getHighlightsStats();
    
    console.log('[Highlights API] Retornando', formattedData.length, 'registros formatados');
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        total: count || 0,
        offset,
        limit
      },
      stats
    });
    
  } catch (error) {
    console.error('[Highlights API] Erro geral:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Função para obter estatísticas dos destaques
 */
async function getHighlightsStats() {
  try {
    console.log('[Highlights API] Buscando estatísticas...');
    
    const { data: allHighlights, error } = await supabase
      .from('highlights')
      .select('status, highlight_type, is_active');
    
    if (error) {
      console.error('[Highlights API] Erro ao buscar estatísticas:', error);
      return getDefaultHighlightsStats();
    }
    
    const highlightsData = allHighlights || [];
    
    const stats = {
      total: highlightsData.length,
      active: highlightsData.filter(h => h.is_active === true).length,
      pending: highlightsData.filter(h => h.status === 'pending').length,
      approved: highlightsData.filter(h => h.status === 'approved').length,
      rejected: highlightsData.filter(h => h.status === 'rejected').length,
      types: {
        story: highlightsData.filter(h => h.highlight_type === 'story').length,
        featured: highlightsData.filter(h => h.highlight_type === 'featured').length,
        promotion: highlightsData.filter(h => h.highlight_type === 'promotion').length
      }
    };
    
    console.log('[Highlights API] Estatísticas calculadas:', stats);
    
    return stats;
  } catch (error) {
    console.error('[Highlights API] Erro ao obter estatísticas:', error);
    return getDefaultHighlightsStats();
  }
}

/**
 * Retorna estatísticas padrão em caso de erro
 */
function getDefaultHighlightsStats() {
  return {
    total: 0,
    active: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    types: {
      story: 0,
      featured: 0,
      promotion: 0
    }
  };
}

/**
 * POST - Criar novo destaque
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validações básicas
    if (!body.title || !body.type) {
      return NextResponse.json({
        success: false,
        message: 'Título e tipo são obrigatórios'
      }, { status: 400 });
    }
    
    // Criar destaque
    const { data, error } = await supabase
      .from('highlights')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar destaque: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Destaque criado com sucesso',
      data
    });
    
  } catch (error) {
    console.error('[Highlights API] Erro no POST:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * PUT - Atualizar destaque
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
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID do destaque é obrigatório'
      }, { status: 400 });
    }
    
    // Atualizar destaque
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('highlights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar destaque: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Destaque atualizado com sucesso',
      data
    });
    
  } catch (error) {
    console.error('[Highlights API] Erro no PUT:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * DELETE - Excluir destaque
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
        message: 'ID do destaque é obrigatório'
      }, { status: 400 });
    }
    
    // Excluir destaque
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao excluir destaque: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Destaque excluído com sucesso'
    });
    
  } catch (error) {
    console.error('[Highlights API] Erro no DELETE:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 