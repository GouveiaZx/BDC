import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const state = searchParams.get('state');
    const includeStats = searchParams.get('include_stats') === 'true';
    
    let query = supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Filtrar por estado se especificado
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: cities, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar cidades' },
        { status: 500 }
      );
    }

    let citiesWithStats = cities;
    
    if (includeStats) {
      // Buscar contagem de anúncios ativos por cidade
      const { data: adStats } = await supabase
        .from('ads')
        .select('city_id')
        .eq('status', 'approved');

      const statsMap = adStats?.reduce((acc: any, ad) => {
        acc[ad.city_id] = (acc[ad.city_id] || 0) + 1;
        return acc;
      }, {}) || {};

      citiesWithStats = cities.map(city => ({
        ...city,
        active_ads_count: statsMap[city.id] || 0
      }));
    }

    // Agrupar por estado para facilitar exibição
    const citiesByState = citiesWithStats.reduce((acc: any, city) => {
      if (!acc[city.state]) {
        acc[city.state] = [];
      }
      acc[city.state].push(city);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      cities: citiesWithStats,
      cities_by_state: citiesByState,
      total: cities.length,
      filtered_by_state: state || null
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 