import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Listar denúncias
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
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    // Buscar denúncias na tabela ad_reports
    let query = supabase
      .from('ad_reports')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Aplicar paginação e ordenação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: reports, error: reportsError, count } = await query;
    
    if (reportsError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar denúncias: ' + reportsError.message
      }, { status: 500 });
    }
    // Se não há denúncias, retornar resposta vazia
    if (!reports || reports.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: count || 0,
          offset,
          limit
        },
        stats: await getReportsStats()
      });
    }
    
    // Buscar dados dos usuários que fizeram as denúncias
    const userIds = reports.map(report => report.reporter_id).filter(Boolean);
    const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
    
    let usersMap: Record<string, any> = {};
    
    if (uniqueUserIds.length > 0) {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
        }
      } catch (error) {
      }
    }
    
    // Formatar dados para o frontend (ajustado para ad_reports)
    const formattedData = reports.map(report => {
      const reporter = usersMap[report.reporter_id] || {};
      
      // Mapear status do banco para o frontend
      let frontendStatus = report.status || 'pending';
      switch (report.status) {
        case 'resolved':
          frontendStatus = 'approved';
          break;
        case 'dismissed':
          frontendStatus = 'rejected';
          break;
        default:
          frontendStatus = report.status || 'pending';
      }
      
      return {
        id: report.id,
        type: 'ad', // Sempre 'ad' pois é ad_reports
        reason: report.reason || 'Não informado',
        description: report.description || '',
        status: frontendStatus,
        reportedItemId: report.ad_id,
        reportedItemType: 'ad',
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        processedAt: report.updated_at,
        adminNotes: report.admin_notes || '',
        resolvedBy: report.resolved_by || '',
        reporter: {
          id: report.reporter_id,
          name: reporter.name || report.reporter_name || 'Usuário anônimo',
          email: reporter.email || report.reporter_email || 'email@anonimo.com'
        }
      };
    });
    
    // Buscar estatísticas básicas
    const stats = await getReportsStats();
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
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Função para obter estatísticas das denúncias
 */
async function getReportsStats() {
  try {
    const { data: allReports, error } = await supabase
      .from('ad_reports')
      .select('status, ad_id');
    
    if (error) {
      return getDefaultReportsStats();
    }
    
    const reportsData = allReports || [];
    
    const stats = {
      total: reportsData.length,
      pending: reportsData.filter(r => r.status === 'pending').length,
      approved: reportsData.filter(r => r.status === 'resolved').length,
      rejected: reportsData.filter(r => r.status === 'dismissed').length,
      types: {
        ad: reportsData.length, // Todos são de anúncios
        user: 0,
        highlight: 0,
        other: 0
      }
    };
    return stats;
  } catch (error) {
    return getDefaultReportsStats();
  }
}

/**
 * Retorna estatísticas padrão em caso de erro
 */
function getDefaultReportsStats() {
  return {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    types: {
      ad: 0,
      user: 0,
      highlight: 0,
      other: 0
    }
  };
}

/**
 * PUT - Atualizar denúncia
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
    const { id, status, admin_notes, resolved_by, resolved_at } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID da denúncia é obrigatório'
      }, { status: 400 });
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Mapear campos do frontend para o banco
    if (status) {
      // Mapear status do frontend para os valores aceitos pelo banco
      let mappedStatus = status;
      switch (status) {
        case 'approved':
          mappedStatus = 'resolved';
          break;
        case 'rejected':
          mappedStatus = 'dismissed';
          break;
        default:
          mappedStatus = status;
      }
      updateData.status = mappedStatus;
    }
    
    // Só incluir admin_notes se for string (não undefined)
    if (typeof admin_notes === 'string') {
      updateData.admin_notes = admin_notes;
    }
    
    // Só incluir resolved_by se tiver valor
    if (resolved_by) {
      updateData.resolved_by = resolved_by;
    }
    
    // Se status foi alterado para approved ou rejected, marcar como resolvido
    if (status && status !== 'pending') {
      updateData.resolved_at = resolved_at || new Date().toISOString();
      if (!updateData.resolved_by) {
        updateData.resolved_by = 'admin';
      }
    }
    // Atualizar denúncia na tabela ad_reports
    const { data, error } = await supabase
      .from('ad_reports')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      throw new Error(`Erro ao atualizar denúncia: ${error.message}`);
    }
    return NextResponse.json({
      success: true,
      message: 'Denúncia atualizada com sucesso',
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
 * DELETE - Excluir denúncia
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
        message: 'ID da denúncia é obrigatório'
      }, { status: 400 });
    }
    
    // Excluir denúncia da tabela ad_reports
    const { error } = await supabase
      .from('ad_reports')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao excluir denúncia: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Denúncia excluída com sucesso'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 