import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

// Rota para executar o setup do SQL
export async function GET(req: NextRequest) {
  try {
    console.log('============================================');
    console.log('API /api/admin/setup-sql SENDO CHAMADA');
    console.log('============================================');
    
    const admin = getSupabaseAdminClient();
    
    // SQL para criar função que busca empresas com informações completas
    const sql = `
    -- Função para buscar empresas com informações de usuário
    CREATE OR REPLACE FUNCTION get_businesses_with_users(
      p_status TEXT DEFAULT NULL,
      p_category TEXT DEFAULT NULL,
      p_search TEXT DEFAULT NULL,
      p_limit INT DEFAULT 50,
      p_offset INT DEFAULT 0
    )
    RETURNS TABLE (
      id UUID,
      business_name TEXT,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      logo_url TEXT,
      banner_url TEXT,
      description TEXT,
      categories TEXT[],
      website TEXT,
      facebook TEXT,
      instagram TEXT,
      whatsapp TEXT,
      other_social TEXT,
      is_verified BOOLEAN,
      is_active BOOLEAN,
      user_id UUID,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      moderation_status TEXT,
      moderation_reason TEXT,
      moderation_date TIMESTAMPTZ,
      moderated_by TEXT,
      user_email TEXT,
      user_name TEXT,
      user_phone TEXT,
      user_type TEXT,
      user_created_at TIMESTAMPTZ,
      user_avatar_url TEXT,
      user_is_blocked BOOLEAN,
      user_is_verified BOOLEAN
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY 
      SELECT 
        b.*,
        u.email as user_email,
        u.full_name as user_name,
        u.phone as user_phone,
        u.user_type::TEXT as user_type,
        u.created_at as user_created_at,
        u.avatar_url as user_avatar_url,
        u.is_blocked as user_is_blocked,
        u.is_verified as user_is_verified
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE 
        (p_status IS NULL OR b.moderation_status = p_status) AND
        (p_category IS NULL OR p_category = ANY(b.categories)) AND
        (p_search IS NULL OR 
          b.business_name ILIKE '%' || p_search || '%' OR 
          b.contact_name ILIKE '%' || p_search || '%' OR 
          b.description ILIKE '%' || p_search || '%'
        )
      ORDER BY b.created_at DESC
      LIMIT p_limit
      OFFSET p_offset;
    END;
    $$;
    
    -- Função para contar o total de empresas com base nos filtros
    CREATE OR REPLACE FUNCTION count_businesses_with_users(
      p_status TEXT DEFAULT NULL,
      p_category TEXT DEFAULT NULL,
      p_search TEXT DEFAULT NULL
    )
    RETURNS INTEGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
      total INTEGER;
    BEGIN
      SELECT COUNT(*)
      INTO total
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE 
        (p_status IS NULL OR b.moderation_status = p_status) AND
        (p_category IS NULL OR p_category = ANY(b.categories)) AND
        (p_search IS NULL OR 
          b.business_name ILIKE '%' || p_search || '%' OR 
          b.contact_name ILIKE '%' || p_search || '%' OR 
          b.description ILIKE '%' || p_search || '%'
        );
      
      RETURN total;
    END;
    $$;`;
    
    // Executar o SQL
    // Primeiro, tente usar a RPC, se disponível
    try {
      const { error } = await admin.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Erro ao executar SQL via RPC:', error);
        throw new Error(error.message);
      }
      
      console.log('Funções SQL criadas com sucesso via RPC!');
    } catch (rpcError) {
      // Se RPC falhar, tente executar diretamente usando a API REST
      console.log('Tentando método alternativo via REST API...');
      
      try {
        // Usar a API REST para executar SQL diretamente
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({ sql })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na API REST:', errorData);
          throw new Error(`Erro na API REST: ${JSON.stringify(errorData)}`);
        }
        
        console.log('SQL executado com sucesso via REST API');
      } catch (restError) {
        console.error('Erro ao executar SQL (método alternativo):', restError);
        return NextResponse.json({
          success: false,
          error: 'Erro em ambos os métodos de execução SQL',
          details: restError instanceof Error ? restError.message : 'Erro desconhecido'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Funções SQL criadas com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao configurar SQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 