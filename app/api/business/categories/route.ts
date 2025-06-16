import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Dados recebidos para salvar categorias:', body);
    
    const { userId, categories } = body;

    if (!userId || !categories || !Array.isArray(categories)) {
      console.log('❌ Dados obrigatórios faltando:', { userId, categories });
      return NextResponse.json({ 
        error: 'userId e categories são obrigatórios' 
      }, { status: 400 });
    }

    console.log('💾 Salvando categorias no banco de dados...');
    
    // Primeiro, remover categorias existentes do usuário
    const { error: deleteError } = await supabase
      .from('business_categories')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Erro ao remover categorias antigas:', deleteError);
      // Não falhar se não houver categorias para remover
    }

    // Inserir novas categorias
    if (categories.length > 0) {
      const categoryData = categories.map((category: string) => ({
        user_id: userId,
        category: category,
        created_at: new Date().toISOString()
      }));

      console.log('📋 Dados de categorias para inserir:', categoryData);

      const { data, error } = await supabase
        .from('business_categories')
        .insert(categoryData)
        .select();

      if (error) {
        console.error('❌ Erro ao inserir categorias:', error);
        return NextResponse.json({ 
          error: 'Erro ao salvar categorias no banco de dados',
          details: error.message 
        }, { status: 500 });
      }

      console.log('✅ Categorias salvas com sucesso:', data);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Categorias salvas com sucesso',
      categoriesCount: categories.length
    });

  } catch (error) {
    console.error('❌ Erro na API business/categories POST:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando categorias para userId:', userId);

    // Buscar categorias do usuário
    const { data: categories, error } = await supabase
      .from('business_categories')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
    }

    console.log('✅ Categorias encontradas:', categories?.length || 0);
    return NextResponse.json({ 
      categories: categories || [],
      count: categories?.length || 0
    });

  } catch (error) {
    console.error('❌ Erro na API business/categories GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 