import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Helper para extrair token do usuário
function extractUserFromRequest(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth_token');
    const authHeader = request.headers.get('authorization');
    
    let token = '';
    if (authCookie) {
      token = authCookie.value;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) return null;
    
    const decoded = JSON.parse(atob(token));
    
    // Verificar se token não expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, expired
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Construir query base
    let adsQuery = supabase
      .from('ads')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          icon
        ),
        cities (
          id,
          name,
          state
        ),
        ad_photos (
          id,
          file_url,
          sort_order,
          is_primary
        )
      `)
      .eq('user_id', userToken.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por status se especificado
    if (status) {
      adsQuery = adsQuery.eq('status', status);
    }

    const { data: ads, error } = await adsQuery;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar anúncios' },
        { status: 500 }
      );
    }

    // Processar resultados
    const processedAds = ads.map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      price_type: ad.price_type,
      status: ad.status,
      rejection_reason: ad.rejection_reason,
      is_featured: ad.is_featured,
      is_premium: ad.is_premium,
      view_count: ad.view_count,
      contact_count: ad.contact_count,
      created_at: ad.created_at,
      published_at: ad.published_at,
      expires_at: ad.expires_at,
      category: ad.categories,
      city: ad.cities,
      photos: ad.ad_photos
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((photo: any) => ({
          id: photo.id,
          url: photo.file_url,
          is_primary: photo.is_primary
        })),
      primary_photo: ad.ad_photos.find((p: any) => p.is_primary)?.file_url || 
                    ad.ad_photos[0]?.file_url || null,
      // Status helpers
      is_pending: ad.status === 'pending',
      is_approved: ad.status === 'approved',
      is_rejected: ad.status === 'rejected',
      is_expired: ad.status === 'expired' || new Date(ad.expires_at) < new Date(),
      can_edit: ['pending', 'rejected'].includes(ad.status),
      can_renew: ad.status === 'expired'
    }));

    // Buscar estatísticas
    const { data: statsData } = await supabase
      .from('ads')
      .select('status')
      .eq('user_id', userToken.userId);

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(ad => ad.status === 'pending').length || 0,
      approved: statsData?.filter(ad => ad.status === 'approved').length || 0,
      rejected: statsData?.filter(ad => ad.status === 'rejected').length || 0,
      expired: statsData?.filter(ad => ad.status === 'expired').length || 0
    };

    // Buscar dados da assinatura para mostrar limites
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', userToken.userId)
      .eq('status', 'active')
      .single();

    let planInfo = null;
    if (subscription) {
      planInfo = {
        plan_name: subscription.plans.name,
        ads_used: subscription.ads_used,
        ads_remaining: Math.max(0, subscription.plans.max_ads - subscription.ads_used),
        max_ads: subscription.plans.max_ads,
        can_create_more: subscription.ads_used < subscription.plans.max_ads
      };
    }

    return NextResponse.json({
      success: true,
      ads: processedAds,
      pagination: {
        total: stats.total,
        limit,
        offset,
        has_more: stats.total > offset + limit
      },
      stats,
      plan_info: planInfo,
      filtered_by_status: status || null
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 