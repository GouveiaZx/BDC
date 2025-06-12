import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

/**
 * Rota GET para listar assinaturas com bypass de segurança
 * Acesso direto sem verificação de permissões
 */
export async function GET(request: Request) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log(`[API:subscriptions-bypass] Buscando assinaturas com bypass. Limite: ${limit}, Offset: ${offset}`);
    
    // Usar cliente admin para consultas - acesso direto sem verificação de credenciais
    const admin = getSupabaseAdminClient();
    
    // Consulta simplificada sem join para evitar erro de relação
    let query = admin
      .from('subscriptions')
      .select('*');
    
    // Adicionar filtros se fornecidos
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (plan && plan !== 'all') {
      query = query.eq('plan_type', plan);
    }
    
    // Ordenar por data de início, mais recentes primeiro
    query = query.order('created_at', { ascending: false });
    
    // Limitar e paginar resultados
    query = query.range(offset, offset + limit - 1);
    
    const { data: subscriptions, error } = await query;
    
    if (error) {
      console.error('[API:subscriptions-bypass] Erro ao buscar assinaturas:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar assinaturas',
        details: error.message
      }, { status: 500 });
    }
    
    console.log(`[API:subscriptions-bypass] Encontradas ${subscriptions?.length || 0} assinaturas`);
    
    // Consulta para contar total de assinaturas
    const { count, error: countError } = await admin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[API:subscriptions-bypass] Erro ao contar assinaturas:', countError);
    }
    
    // Calcular receita mensal total (apenas assinaturas ativas)
    const { data: revenueData, error: revenueError } = await admin
      .from('subscriptions')
      .select('price')
      .eq('status', 'active');
    
    let monthlyRevenue = 0;
    
    if (!revenueError && revenueData) {
      monthlyRevenue = revenueData.reduce((acc, sub) => acc + Number(sub.price), 0);
    }
    
    // Formatar dados para resposta
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      planType: sub.plan_type,
      status: sub.status,
      startDate: sub.started_at || sub.created_at,
      endDate: sub.expires_at,
      price: sub.price,
      renewalDate: sub.expires_at,
      paymentMethod: sub.payment_provider || 'Não especificado',
      paymentId: sub.payment_id,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
      subscriber: {
        id: sub.user_id,
        name: 'Usuário', // Nome genérico pois não podemos fazer join
        email: 'Não disponível', // Email genérico pois não podemos fazer join
        avatar: '/images/avatar-placeholder.png',
        type: 'personal'
      }
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedSubscriptions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      stats: {
        monthlyRevenue
      }
    });
    
  } catch (error) {
    console.error('[API:subscriptions-bypass] Erro ao processar solicitação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 