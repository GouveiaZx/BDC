import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

// POST - Criar um novo destaque de forma direta e simples
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extrair apenas os campos necessários
    const { title, description = '', mediaUrl, mediaType, userId } = body;
    
    // Validações básicas
    if (!title || !mediaUrl || !mediaType || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos. Título, mídia e ID de usuário são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log('Inserção direta - Dados recebidos:', {
      title,
      mediaType,
      userId
    });
    
    // Usar cliente admin para acessar o banco de dados
    const adminClient = getSupabaseAdminClient();
    
    // Usar SQL direto para inserir o destaque
    const { data: destaque, error } = await adminClient.rpc('exec_sql', {
      sql_query: `
        INSERT INTO destaques (
          title, 
          description, 
          media_url, 
          media_type, 
          user_id,
          status,
          duration
        )
        VALUES (
          '${title.replace(/'/g, "''")}',
          '${description.replace(/'/g, "''")}',
          '${mediaUrl.replace(/'/g, "''")}',
          '${mediaType.replace(/'/g, "''")}',
          '${userId}',
          'pending',
          24
        )
        RETURNING id;
      `
    });
    
    if (error) {
      console.error('Erro ao inserir destaque via SQL direto:', error);
      return NextResponse.json(
        { error: 'Erro ao criar destaque', details: error.message },
        { status: 500 }
      );
    }
    
    // Inserção bem-sucedida
    console.log('Destaque inserido com sucesso via SQL direto:', destaque);
    
    return NextResponse.json({
      success: true,
      message: 'Destaque criado com sucesso',
      data: { id: destaque }
    });
  } catch (error: any) {
    console.error('Erro na rota de inserção de destaque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 