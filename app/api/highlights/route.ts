import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar destaques
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'active';
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (status !== 'all') {
      if (status === 'active') {
        query = query
          .eq('status', 'active')
          .lte('start_date', new Date().toISOString())
          .gt('end_date', new Date().toISOString());
      } else {
        query = query.eq('status', status);
      }
    }

    if (!includeExpired && !userId) {
      // Para busca pública, só mostrar ativos
      query = query
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gt('end_date', new Date().toISOString());
    }

    const { data: highlights, error } = await query;

    if (error) {
      console.error('Erro ao buscar destaques:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar destaques' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      highlights: highlights || [],
      total: highlights?.length || 0
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo destaque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      imageUrl,
      linkUrl,
      linkText,
      highlightType,
      backgroundColor,
      textColor,
      price,
      discountPercentage,
      durationHours
    } = body;

    if (!userId || !title || !description) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Calcular datas de início e fim
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (durationHours || 24) * 60 * 60 * 1000);

    // Calcular valor do destaque baseado na duração
    const basePrice = 49.90; // Preço base para 24h
    const pricePerHour = basePrice / 24;
    const totalPrice = Math.max(basePrice, pricePerHour * (durationHours || 24));

    const highlightData = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description,
      image_url: imageUrl || '/images/highlight-default.jpg',
      media_type: 'image',
      link_url: linkUrl || '#',
      link_text: linkText || 'Ver mais',
      highlight_type: highlightType || 'promotion',
      background_color: backgroundColor || '#ff6b35',
      text_color: textColor || '#ffffff',
      price: price ? parseFloat(price) : null,
      discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'pending', // Pendente até pagamento
      is_paid: false,
      payment_amount: totalPrice,
      payment_status: 'pending',
      is_active: false,
      view_count: 0,
      click_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newHighlight, error } = await supabase
      .from('highlights')
      .insert(highlightData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar destaque:', error);
      return NextResponse.json(
        { error: 'Erro ao criar destaque: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque criado com sucesso',
      highlight: newHighlight,
      paymentRequired: true,
      paymentAmount: totalPrice
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar destaque
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { highlightId, userId, ...updateData } = body;

    if (!highlightId || !userId) {
      return NextResponse.json(
        { error: 'ID do destaque e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do destaque
    const { data: existingHighlight } = await supabase
      .from('highlights')
      .select('user_id, status, payment_status')
      .eq('id', highlightId)
      .single();

    if (!existingHighlight || existingHighlight.user_id !== userId) {
      return NextResponse.json(
        { error: 'Destaque não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    // Não permitir edição de destaques já pagos e ativos
    if (existingHighlight.payment_status === 'paid' && existingHighlight.status === 'active') {
      return NextResponse.json(
        { error: 'Não é possível editar destaques já ativos' },
        { status: 400 }
      );
    }

    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Remover campos que não devem ser atualizados
    delete finalUpdateData.highlightId;
    delete finalUpdateData.userId;

    const { data: updatedHighlight, error } = await supabase
      .from('highlights')
      .update(finalUpdateData)
      .eq('id', highlightId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar destaque:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar destaque' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque atualizado com sucesso',
      highlight: updatedHighlight
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir destaque
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const highlightId = searchParams.get('highlightId');
    const userId = searchParams.get('userId');

    if (!highlightId || !userId) {
      return NextResponse.json(
        { error: 'ID do destaque e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do destaque
    const { data: existingHighlight } = await supabase
      .from('highlights')
      .select('user_id, status, payment_status')
      .eq('id', highlightId)
      .single();

    if (!existingHighlight || existingHighlight.user_id !== userId) {
      return NextResponse.json(
        { error: 'Destaque não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    // Permitir exclusão apenas de destaques não pagos ou expirados
    if (existingHighlight.payment_status === 'paid' && existingHighlight.status === 'active') {
      return NextResponse.json(
        { error: 'Não é possível excluir destaques ativos. Aguarde a expiração ou cancele o destaque.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir destaque:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir destaque' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Destaque excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 