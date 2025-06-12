import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação em um ambiente real
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // }
    
    // Vamos criar as tabelas necessárias
    const supabase = getSupabaseAdminClient();
    
    // Verificar se as tabelas já existem
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['advertisements', 'ads']);
    
    if (tablesError) {
      console.error('Erro ao verificar tabelas existentes:', tablesError);
      return NextResponse.json({ error: 'Erro ao verificar tabelas' }, { status: 500 });
    }
    
    const tableNames = existingTables?.map(t => t.table_name) || [];
    console.log('Tabelas existentes:', tableNames);
    
    const results = {
      advertisements: false,
      ads: false,
      errors: [] as string[]
    };
    
    // Criar tabela advertisements se não existir
    if (!tableNames.includes('advertisements')) {
      const advertisementsQuery = `
        CREATE TABLE IF NOT EXISTS advertisements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          price TEXT NOT NULL,
          category TEXT DEFAULT 'Geral',
          sub_category TEXT,
          images JSONB DEFAULT '[]'::jsonb,
          location TEXT DEFAULT 'Não informado',
          zip_code TEXT,
          phone TEXT,
          whatsapp TEXT,
          show_phone BOOLEAN DEFAULT TRUE,
          is_free_ad BOOLEAN DEFAULT TRUE,
          moderation_status TEXT DEFAULT 'pending',
          user_id TEXT NOT NULL,
          user_email TEXT,
          user_name TEXT,
          user_avatar TEXT,
          status TEXT DEFAULT 'active',
          views INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
        );
        
        CREATE INDEX IF NOT EXISTS idx_advertisements_user_id ON advertisements(user_id);
        CREATE INDEX IF NOT EXISTS idx_advertisements_user_email ON advertisements(user_email);
        CREATE INDEX IF NOT EXISTS idx_advertisements_moderation_status ON advertisements(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
      `;
      
      try {
        const { error: createError } = await supabase.rpc('query', { query_text: advertisementsQuery }).single();
        if (createError) {
          console.error('Erro ao criar tabela advertisements:', createError);
          results.errors.push(`Erro advertisements: ${createError.message}`);
        } else {
          results.advertisements = true;
          console.log('Tabela advertisements criada com sucesso');
        }
      } catch (err: any) {
        console.error('Exceção ao criar tabela advertisements:', err);
        results.errors.push(`Exceção advertisements: ${err.message}`);
      }
    } else {
      results.advertisements = true;
      console.log('Tabela advertisements já existe');
    }
    
    // Criar tabela ads se não existir
    if (!tableNames.includes('ads')) {
      const adsQuery = `
        CREATE TABLE IF NOT EXISTS ads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          price TEXT NOT NULL,
          category TEXT DEFAULT 'Geral',
          sub_category TEXT,
          images JSONB DEFAULT '[]'::jsonb,
          location TEXT DEFAULT 'Não informado',
          zip_code TEXT,
          phone TEXT,
          whatsapp TEXT,
          show_phone BOOLEAN DEFAULT TRUE,
          is_free_ad BOOLEAN DEFAULT TRUE,
          moderation_status TEXT DEFAULT 'pending',
          user_id TEXT NOT NULL,
          user_email TEXT,
          user_name TEXT,
          user_avatar TEXT,
          status TEXT DEFAULT 'active',
          views INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
        );
        
        CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
        CREATE INDEX IF NOT EXISTS idx_ads_user_email ON ads(user_email);
        CREATE INDEX IF NOT EXISTS idx_ads_moderation_status ON ads(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
      `;
      
      try {
        const { error: createError } = await supabase.rpc('query', { query_text: adsQuery }).single();
        if (createError) {
          console.error('Erro ao criar tabela ads:', createError);
          results.errors.push(`Erro ads: ${createError.message}`);
        } else {
          results.ads = true;
          console.log('Tabela ads criada com sucesso');
        }
      } catch (err: any) {
        console.error('Exceção ao criar tabela ads:', err);
        results.errors.push(`Exceção ads: ${err.message}`);
      }
    } else {
      results.ads = true;
      console.log('Tabela ads já existe');
    }
    
    // Criar tabela de notificações
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ad_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,
          ad_title TEXT,
          data JSONB
        );
        
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      `
    });

    if (notificationsError) {
      console.error('Erro ao criar tabela de notificações:', notificationsError);
      return NextResponse.json({ error: notificationsError.message }, { status: 500 });
    }

    // Criar tabela de logs de visualização
    const { error: viewsLogError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS ad_views_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          viewer_ip TEXT,
          count INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          referrer TEXT,
          user_agent TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_ad_views_log_ad_id ON ad_views_log(ad_id);
        CREATE INDEX IF NOT EXISTS idx_ad_views_log_user_id ON ad_views_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_ad_views_log_created_at ON ad_views_log(created_at);
      `
    });

    if (viewsLogError) {
      console.error('Erro ao criar tabela de logs de visualização:', viewsLogError);
      return NextResponse.json({ error: viewsLogError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: results.advertisements || results.ads,
      tables: {
        advertisements: results.advertisements,
        ads: results.ads
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error: any) {
    console.error('Erro ao criar tabelas:', error);
    return NextResponse.json({ error: `Erro ao criar tabelas: ${error.message}` }, { status: 500 });
  }
} 