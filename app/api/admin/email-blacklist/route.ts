import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { addToBlacklist, removeFromBlacklist, isEmailBlacklisted } from '../../../lib/resend';

// GET - Listar emails na blacklist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('email_blacklist')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtrar por email se pesquisa fornecida
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Admin Blacklist] Erro ao buscar:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('[Admin Blacklist] Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar email à blacklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason, notes } = body;

    // Validações
    if (!email || !reason) {
      return NextResponse.json(
        { error: 'Email e motivo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar se já está na blacklist
    if (await isEmailBlacklisted(email)) {
      return NextResponse.json(
        { error: 'Email já está na blacklist' },
        { status: 400 }
      );
    }

    // Adicionar à blacklist
    const success = await addToBlacklist(email, reason, notes);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao adicionar à blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email adicionado à blacklist com sucesso',
      email,
      reason
    });

  } catch (error) {
    console.error('[Admin Blacklist] Erro ao adicionar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Remover email da blacklist (desbloquear)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se está na blacklist
    if (!(await isEmailBlacklisted(email))) {
      return NextResponse.json(
        { error: 'Email não está na blacklist' },
        { status: 400 }
      );
    }

    // Remover da blacklist
    const success = await removeFromBlacklist(email);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao remover da blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email removido da blacklist com sucesso',
      email
    });

  } catch (error) {
    console.error('[Admin Blacklist] Erro ao remover:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar entrada da blacklist permanentemente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('email_blacklist')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('[Admin Blacklist] Erro ao deletar:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar da blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email deletado da blacklist permanentemente',
      email
    });

  } catch (error) {
    console.error('[Admin Blacklist] Erro ao deletar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 