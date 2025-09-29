import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// API para registrar uma visualização em um anúncio
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { adId, userId } = data;

    if (!adId) {
      return NextResponse.json(
        { error: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const visitorId = userId || 'anonymous';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    try {
      // Registrar visualização na tabela ad_views
      const { error: insertError } = await supabase
        .from('ad_views')
        .insert({
          ad_id: adId,
          viewer_id: userId || null,
          ip_address: ipAddress,
          viewed_at: new Date().toISOString()
        });
      
      if (insertError) {
        
      }
      
      // Buscar total de visualizações para este anúncio
      const { count: totalViews, error: countError } = await supabase
        .from('ad_views')
        .select('*', { count: 'exact', head: true })
        .eq('ad_id', adId);
      
      return NextResponse.json({
        success: true,
        views: totalViews || 0,
        uniqueViews: totalViews || 0, // Simplificado por enquanto
        lastViewedAt: new Date()
      });
      
    } catch (error) {
      return NextResponse.json({
        success: true,
        views: 0,
        uniqueViews: 0,
        lastViewedAt: new Date()
      });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao registrar visualização' },
      { status: 500 }
    );
  }
}

// API para obter estatísticas de visualizações de um anúncio específico
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const adId = searchParams.get('adId');
    const userId = searchParams.get('userId');
    const supabase = getSupabaseAdminClient();
    
    // Se adId for fornecido, retornar estatísticas para esse anúncio específico
    if (adId) {
      try {
        const { count: totalViews, error: countError } = await supabase
          .from('ad_views')
          .select('*', { count: 'exact', head: true })
          .eq('ad_id', adId);
        
        return NextResponse.json({
          success: true,
          adId,
          views: {
            totalViews: totalViews || 0,
            uniqueViews: totalViews || 0, // Simplificado
            viewsByDate: {}, // Pode ser implementado depois
            lastViewedAt: null
          }
        });
      } catch (error) {
        // Tabela não existe, retornar dados vazios
        return NextResponse.json({
          success: true,
          adId,
          views: {
            totalViews: 0,
            uniqueViews: 0,
            viewsByDate: {},
            lastViewedAt: null
          }
        });
      }
    }
    
    // Se userId for fornecido, retornar estatísticas de todos os anúncios desse usuário
    if (userId) {
      try {
        // Buscar todos os anúncios do usuário
        const { data: userAds, error: adsError } = await supabase
          .from('ads')
          .select('id')
          .eq('user_id', userId);
        
        if (adsError || !userAds) {
          return NextResponse.json({
            success: true,
            userId,
            totalViews: 0,
            viewsByDate: {},
            ads: []
          });
        }
        
        // Buscar visualizações para todos os anúncios do usuário
        const adIds = userAds.map(ad => ad.id);
        const { count: totalViews, error: viewsError } = await supabase
          .from('ad_views')
          .select('*', { count: 'exact', head: true })
          .in('ad_id', adIds);
        
        return NextResponse.json({
          success: true,
          userId,
          totalViews: totalViews || 0,
          viewsByDate: {}, // Pode ser implementado depois
          ads: userAds.map(ad => ({
            adId: ad.id,
            views: 0, // Seria necessário uma query mais complexa
            uniqueViews: 0,
            lastViewedAt: null
          }))
        });
        
      } catch (error) {
        // Tabelas não existem, retornar dados vazios
        return NextResponse.json({
          success: true,
          userId,
          totalViews: 0,
          viewsByDate: {},
          ads: []
        });
      }
    }
    
    return NextResponse.json(
      { error: 'É necessário fornecer adId ou userId' },
      { status: 400 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de visualizações' },
      { status: 500 }
    );
  }
} 