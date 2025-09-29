import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

export const dynamic = 'force-dynamic';

// API para buscar todas as categorias ativas
export async function GET() {
  try {
    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Buscar categorias ativas ordenadas por sort_order e nome
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao carregar categorias',
        details: error.message
      }, { status: 500 });
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma categoria encontrada'
      }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      categories,
      total: categories.length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 