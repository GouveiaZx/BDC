import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

/**
 * Rota GET para listar denúncias com bypass de segurança
 * Acesso direto sem verificação de permissões
 */
export async function GET(request: Request) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log(`[API:reports-bypass] Buscando denúncias com bypass. Status: ${status || 'todos'}, Limite: ${limit}, Offset: ${offset}`);
    
    // Usar cliente admin para consultas - acesso direto sem verificação de credenciais
    const admin = getSupabaseAdminClient();
    
    // Consulta base para buscar denúncias
    let query = admin
      .from('ad_reports')
      .select(`*`);
    
    // Adicionar filtros se fornecidos
    if (status) {
      query = query.eq('status', status);
    }
    
    // Ordenar por data de criação, mais recentes primeiro
    query = query.order('created_at', { ascending: false });
    
    // Limitar e paginar resultados
    query = query.range(offset, offset + limit - 1);
    
    const { data: reports, error } = await query;
    
    if (error) {
      console.error('[API:reports-bypass] Erro ao buscar denúncias:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar denúncias',
        details: error.message
      }, { status: 500 });
    }
    
    console.log(`[API:reports-bypass] Encontradas ${reports?.length || 0} denúncias`);
    
    // Consulta para contar total de denúncias
    const { count, error: countError } = await admin
      .from('ad_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status || '')
      .match(status ? { status } : {});
    
    if (countError) {
      console.error('[API:reports-bypass] Erro ao contar denúncias:', countError);
    }
    
    // Buscar os anúncios referenciados (pode ser na tabela ads ou advertisements)
    const adIds = reports?.map(report => report.ad_id) || [];
    
    let adData: Record<string, any> = {};
    
    if (adIds.length > 0) {
      // Tentar buscar primeiro na tabela ads
      const { data: ads, error: adsError } = await admin
        .from('ads')
        .select('id, title, price, images, user_id, user_name, user_email')
        .in('id', adIds);
      
      if (!adsError && ads && ads.length > 0) {
        ads.forEach(ad => {
          adData[ad.id] = ad;
        });
      }
      
      // Buscar também na tabela advertisements para os que não foram encontrados
      const remainingIds = adIds.filter(id => !adData[id]);
      
      if (remainingIds.length > 0) {
        const { data: advertisements, error: advError } = await admin
          .from('advertisements')
          .select('id, title, price, images, user_id, user_name, user_email')
          .in('id', remainingIds);
        
        if (!advError && advertisements && advertisements.length > 0) {
          advertisements.forEach(ad => {
            adData[ad.id] = ad;
          });
        }
      }
    }
    
    // Formatar dados para resposta
    const formattedReports = reports.map(report => ({
      id: report.id,
      adId: report.ad_id,
      reporterId: report.reporter_id,
      reporterName: report.reporter_name,
      reporterEmail: report.reporter_email,
      reason: report.reason,
      description: report.description,
      status: report.status,
      adminNotes: report.admin_notes,
      reviewedBy: report.reviewed_by,
      reviewedAt: report.reviewed_at,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      ad: adData[report.ad_id] || null
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedReports,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error) {
    console.error('[API:reports-bypass] Erro ao processar solicitação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 