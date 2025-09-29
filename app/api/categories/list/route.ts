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
    
    // Buscar categorias ativas ordenadas
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar categorias' },
        { status: 500 }
      );
    }

    // Buscar estatísticas de anúncios por categoria (opcional)
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';
    
    let categoriesWithStats = categories;
    
    if (includeStats) {
      // Buscar contagem de anúncios ativos por categoria
      const { data: adStats } = await supabase
        .from('ads')
        .select('category_id')
        .eq('status', 'approved');

      const statsMap = adStats?.reduce((acc: any, ad) => {
        acc[ad.category_id] = (acc[ad.category_id] || 0) + 1;
        return acc;
      }, {}) || {};

      categoriesWithStats = categories.map(category => ({
        ...category,
        active_ads_count: statsMap[category.id] || 0
      }));
    }

    return NextResponse.json({
      success: true,
      categories: categoriesWithStats,
      total: categories.length
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 