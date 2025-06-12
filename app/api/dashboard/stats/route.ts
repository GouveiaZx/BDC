import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar se há userId nos headers ou query params
    const userId = request.nextUrl.searchParams.get('userId') || 
                   request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando estatísticas do dashboard para usuário:', userId);

    // Buscar contadores reais de anúncios
    const { data: adCounts, error: adCountsError } = await supabase
      .rpc('get_real_ad_counts', { target_user_id: userId });

    if (adCountsError) {
      console.error('Erro ao buscar contadores de anúncios:', adCountsError);
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas de anúncios' },
        { status: 500 }
      );
    }

    // Buscar notificações inteligentes
    const { data: smartNotifications, error: notificationsError } = await supabase
      .rpc('generate_user_notifications', { target_user_id: userId });

    if (notificationsError) {
      console.error('Erro ao gerar notificações:', notificationsError);
      return NextResponse.json(
        { error: 'Erro ao gerar notificações' },
        { status: 500 }
      );
    }

    // Buscar notificações reais não lidas
    const { data: realNotifications, error: realNotificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (realNotificationsError) {
      console.warn('Erro ao buscar notificações reais:', realNotificationsError);
    }

    // Buscar estatísticas de visualizações
    const { data: viewsData, error: viewsError } = await supabase
      .rpc('get_ad_views_data', { target_user_id: userId });

    if (viewsError) {
      console.warn('Erro ao buscar dados de visualizações:', viewsError);
    }

    // Compilar resposta
    const stats = {
      adCounts: adCounts?.[0] || {
        active_count: 0,
        pending_count: 0,
        rejected_count: 0,
        finished_count: 0
      },
      notifications: {
        smart: smartNotifications || [],
        real: realNotifications || [],
        unreadCount: realNotifications?.length || 0
      },
      views: {
        total: viewsData?.[0]?.total_views || 0,
        last7Days: viewsData?.[0]?.views_7d || 0,
        last30Days: viewsData?.[0]?.views_30d || 0
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Estatísticas compiladas:', {
      userId,
      adCounts: stats.adCounts,
      notificationsCount: stats.notifications.real.length,
      smartNotificationsCount: stats.notifications.smart.length,
      totalViews: stats.views.total
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro interno na API de estatísticas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, notificationId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (action === 'markAsRead' && notificationId) {
      // Marcar notificação como lida
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar notificação' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro na API POST de estatísticas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 