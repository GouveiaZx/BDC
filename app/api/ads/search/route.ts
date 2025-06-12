import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de busca
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const priceType = searchParams.get('price_type');
    const featured = searchParams.get('featured') === 'true';
    const premium = searchParams.get('premium') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort') || 'recent'; // recent, price_asc, price_desc, views

    // Construir query base
    let adsQuery = supabase
      .from('ads')
      .select(`
        *,
        users!inner (
          id,
          name,
          profile_image_url,
          user_type
        ),
        categories!inner (
          id,
          name,
          slug,
          icon
        ),
        cities!inner (
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
      .eq('status', 'approved')
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (query) {
      // Busca por texto no título e descrição
      adsQuery = adsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (category) {
      adsQuery = adsQuery.eq('categories.slug', category);
    }

    if (city) {
      adsQuery = adsQuery.eq('city_id', city);
    }

    if (priceMin) {
      adsQuery = adsQuery.gte('price', parseFloat(priceMin));
    }

    if (priceMax) {
      adsQuery = adsQuery.lte('price', parseFloat(priceMax));
    }

    if (priceType) {
      adsQuery = adsQuery.eq('price_type', priceType);
    }

    if (featured) {
      adsQuery = adsQuery.eq('is_featured', true);
    }

    if (premium) {
      adsQuery = adsQuery.eq('is_premium', true);
    }

    // Aplicar ordenação
    switch (sortBy) {
      case 'price_asc':
        adsQuery = adsQuery.order('price', { ascending: true });
        break;
      case 'price_desc':
        adsQuery = adsQuery.order('price', { ascending: false });
        break;
      case 'views':
        adsQuery = adsQuery.order('view_count', { ascending: false });
        break;
      case 'recent':
      default:
        adsQuery = adsQuery.order('published_at', { ascending: false });
        break;
    }

    const { data: ads, error } = await adsQuery;

    if (error) {
      console.error('Erro ao buscar anúncios:', error);
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
      is_featured: ad.is_featured,
      is_premium: ad.is_premium,
      view_count: ad.view_count,
      contact_count: ad.contact_count,
      published_at: ad.published_at,
      expires_at: ad.expires_at,
      user: {
        id: ad.users.id,
        name: ad.users.name,
        profile_image_url: ad.users.profile_image_url,
        user_type: ad.users.user_type
      },
      category: {
        id: ad.categories.id,
        name: ad.categories.name,
        slug: ad.categories.slug,
        icon: ad.categories.icon
      },
      city: {
        id: ad.cities.id,
        name: ad.cities.name,
        state: ad.cities.state
      },
      photos: ad.ad_photos
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((photo: any) => ({
          id: photo.id,
          url: photo.file_url,
          is_primary: photo.is_primary
        })),
      primary_photo: ad.ad_photos.find((p: any) => p.is_primary)?.file_url || 
                    ad.ad_photos[0]?.file_url || null
    }));

    // Buscar total de resultados para paginação (sem LIMIT)
    let countQuery = supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Aplicar os mesmos filtros para o count
    if (query) {
      countQuery = countQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      countQuery = countQuery.eq('category_id', category);
    }
    if (city) {
      countQuery = countQuery.eq('city_id', city);
    }
    if (priceMin) {
      countQuery = countQuery.gte('price', parseFloat(priceMin));
    }
    if (priceMax) {
      countQuery = countQuery.lte('price', parseFloat(priceMax));
    }
    if (priceType) {
      countQuery = countQuery.eq('price_type', priceType);
    }
    if (featured) {
      countQuery = countQuery.eq('is_featured', true);
    }
    if (premium) {
      countQuery = countQuery.eq('is_premium', true);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      ads: processedAds,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      filters_applied: {
        query: query || null,
        category,
        city,
        price_min: priceMin,
        price_max: priceMax,
        price_type: priceType,
        featured,
        premium,
        sort: sortBy
      }
    });

  } catch (error) {
    console.error('Erro na busca de anúncios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 