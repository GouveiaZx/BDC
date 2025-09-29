import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { getEmailStats } from '../../../lib/resend';

// Interfaces para tipagem
interface GroupedStat {
  period: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  emails: string[];
}

interface ReportItem extends GroupedStat {
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
}

// GET - Obter estatísticas de emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const emailId = searchParams.get('email_id');

    const supabase = getSupabaseAdminClient();

    // Se é para um email específico
    if (emailId) {
      const stats = await getEmailStats(emailId);
      return NextResponse.json(stats || {});
    }

    // Calcular data de início baseada no período
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Buscar estatísticas gerais
    const { data: stats, error } = await supabase
      .from('email_stats')
      .select('*')
      .gte('sent_at', startDate.toISOString())
      .order('sent_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    // Calcular métricas agregadas
    const totalSent = stats?.length || 0;
    const delivered = stats?.filter(s => s.delivered_at).length || 0;
    const bounced = stats?.filter(s => s.bounced_at).length || 0;
    const complained = stats?.filter(s => s.complained_at).length || 0;
    const opened = stats?.filter(s => s.opened_at).length || 0;
    const clicked = stats?.filter(s => s.clicked_at).length || 0;

    // Calcular taxas
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (complained / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;

    // Estatísticas por dia (para gráficos)
    const dailyStats = {};
    stats?.forEach(stat => {
      const date = new Date(stat.sent_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          sent: 0,
          delivered: 0,
          bounced: 0,
          complained: 0,
          opened: 0,
          clicked: 0
        };
      }
      
      dailyStats[date].sent++;
      if (stat.delivered_at) dailyStats[date].delivered++;
      if (stat.bounced_at) dailyStats[date].bounced++;
      if (stat.complained_at) dailyStats[date].complained++;
      if (stat.opened_at) dailyStats[date].opened++;
      if (stat.clicked_at) dailyStats[date].clicked++;
    });

    // Buscar contagem de emails na blacklist
    const { count: blacklistCount } = await supabase
      .from('email_blacklist')
      .select('*', { count: 'exact', head: true })
      .is('unblocked_at', null);

    // Buscar logs de erros recentes
    const { data: recentErrors } = await supabase
      .from('email_logs')
      .select('*')
      .not('error', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      period,
      summary: {
        totalSent,
        delivered,
        bounced,
        complained,
        opened,
        clicked,
        blacklisted: blacklistCount || 0
      },
      rates: {
        delivery: Math.round(deliveryRate * 100) / 100,
        bounce: Math.round(bounceRate * 100) / 100,
        complaint: Math.round(complaintRate * 100) / 100,
        open: Math.round(openRate * 100) / 100,
        click: Math.round(clickRate * 100) / 100
      },
      dailyStats,
      recentErrors: recentErrors || [],
      alerts: {
        highBounceRate: bounceRate > 5,
        highComplaintRate: complaintRate > 0.5,
        lowDeliveryRate: deliveryRate < 90 && totalSent > 10
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Gerar relatório detalhado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, groupBy = 'day' } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Buscar dados no período especificado
    const { data: stats, error } = await supabase
      .from('email_stats')
      .select('*')
      .gte('sent_at', startDate)
      .lte('sent_at', endDate)
      .order('sent_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao gerar relatório' },
        { status: 500 }
      );
    }

    // Agrupar dados por período
    const groupedStats = {};
    const dateFormat = groupBy === 'hour' ? 'YYYY-MM-DD HH:00' : 'YYYY-MM-DD';

    stats?.forEach(stat => {
      const date = new Date(stat.sent_at);
      let key;
      
      if (groupBy === 'hour') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!groupedStats[key]) {
        groupedStats[key] = {
          period: key,
          sent: 0,
          delivered: 0,
          bounced: 0,
          complained: 0,
          opened: 0,
          clicked: 0,
          emails: []
        };
      }

      const group = groupedStats[key];
      group.sent++;
      group.emails.push(stat.email_id);
      
      if (stat.delivered_at) group.delivered++;
      if (stat.bounced_at) group.bounced++;
      if (stat.complained_at) group.complained++;
      if (stat.opened_at) group.opened++;
      if (stat.clicked_at) group.clicked++;
    });

    // Converter para array e adicionar taxas
    const report = Object.values(groupedStats).map((group: GroupedStat) => ({
      ...group,
      deliveryRate: group.sent > 0 ? (group.delivered / group.sent) * 100 : 0,
      bounceRate: group.sent > 0 ? (group.bounced / group.sent) * 100 : 0,
      complaintRate: group.sent > 0 ? (group.complained / group.sent) * 100 : 0,
      openRate: group.delivered > 0 ? (group.opened / group.delivered) * 100 : 0,
      clickRate: group.delivered > 0 ? (group.clicked / group.delivered) * 100 : 0
    }));

    return NextResponse.json({
      startDate,
      endDate,
      groupBy,
      report,
      summary: {
        totalPeriods: report.length,
        totalSent: report.reduce((sum, r) => sum + r.sent, 0),
        totalDelivered: report.reduce((sum, r) => sum + r.delivered, 0),
        totalBounced: report.reduce((sum, r) => sum + r.bounced, 0),
        totalComplained: report.reduce((sum, r) => sum + r.complained, 0),
        totalOpened: report.reduce((sum, r) => sum + r.opened, 0),
        totalClicked: report.reduce((sum, r) => sum + r.clicked, 0)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 