import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao obter cliente Supabase' },
        { status: 500 }
      );
    }
    
    // Verificar e criar tabela de destaques
    try {
      console.log('Verificando/Criando tabela de destaques...');
      const { error: destaquesError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS destaques (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            media_url TEXT NOT NULL,
            media_type TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            user_name TEXT,
            user_avatar TEXT,
            status TEXT DEFAULT 'pending',
            duration INTEGER DEFAULT 24,
            reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            views INTEGER DEFAULT 0,
            priority INTEGER DEFAULT 0,
            moderation_status TEXT DEFAULT 'pending',
            moderation_reason TEXT,
            moderated_at TIMESTAMP WITH TIME ZONE,
            moderated_by UUID,
            is_admin BOOLEAN DEFAULT FALSE
          );
          
          CREATE INDEX IF NOT EXISTS idx_destaques_user_id ON destaques(user_id);
          CREATE INDEX IF NOT EXISTS idx_destaques_status ON destaques(status);
          CREATE INDEX IF NOT EXISTS idx_destaques_created_at ON destaques(created_at);
        `
      });
      
      if (destaquesError) {
        console.error('Erro ao verificar/criar tabela de destaques:', destaquesError);
      } else {
        console.log('Tabela de destaques verificada/criada com sucesso');
      }
      
      // Criar função RPC para inserção segura em destaques
      console.log('Criando função RPC para inserção em destaques...');
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION insert_destaque(
            p_title TEXT,
            p_description TEXT,
            p_media_url TEXT,
            p_media_type TEXT,
            p_user_id UUID,
            p_user_name TEXT,
            p_user_avatar TEXT,
            p_status TEXT,
            p_duration INTEGER,
            p_priority INTEGER,
            p_is_admin BOOLEAN
          ) RETURNS UUID AS $$
          DECLARE
            new_id UUID;
          BEGIN
            INSERT INTO destaques (
              title, description, media_url, media_type, 
              user_id, user_name, user_avatar, status, 
              duration, views, priority, is_admin
            )
            VALUES (
              p_title, p_description, p_media_url, p_media_type,
              p_user_id, p_user_name, p_user_avatar, p_status,
              p_duration, 0, p_priority, p_is_admin
            )
            RETURNING id INTO new_id;
            
            RETURN new_id;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (rpcError) {
        console.error('Erro ao criar função RPC para inserção em destaques:', rpcError);
      } else {
        console.log('Função RPC para inserção em destaques criada com sucesso');
      }
    } catch (destaquesSetupError) {
      console.error('Erro ao configurar tabela de destaques:', destaquesSetupError);
    }
    
    // Criar tabela de notificações
    try {
      console.log('Criando tabela de notificações...');
      const { error: notificationError } = await supabase.rpc('exec_sql', {
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
      
      if (notificationError) {
        console.error('Erro ao criar tabela de notificações:', notificationError);
        return NextResponse.json(
          { error: 'Erro ao criar tabela de notificações', details: notificationError.message },
          { status: 500 }
        );
      }
      
      console.log('Tabela de notificações criada com sucesso');
    } catch (notifError) {
      console.error('Erro ao criar tabela de notificações:', notifError);
    }
    
    // Criar tabela de logs de visualização
    try {
      console.log('Criando tabela de logs de visualização...');
      const { error: viewLogError } = await supabase.rpc('exec_sql', {
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
      
      if (viewLogError) {
        console.error('Erro ao criar tabela de logs de visualização:', viewLogError);
        return NextResponse.json(
          { error: 'Erro ao criar tabela de logs de visualização', details: viewLogError.message },
          { status: 500 }
        );
      }
      
      console.log('Tabela de logs de visualização criada com sucesso');
    } catch (viewError) {
      console.error('Erro ao criar tabela de logs de visualização:', viewError);
    }
    
    // Adicionar notificações iniciais para teste
    try {
      console.log('Verificando usuários para notificações de teste...');
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name')
        .limit(1);
        
      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError);
      } else if (users && users.length > 0) {
        const userId = users[0].id;
        const userName = users[0].name;
        
        console.log(`Adicionando notificações de teste para usuário ${userName} (${userId})...`);
        
        // Buscar anúncios para referência
        const { data: ads, error: adsError } = await supabase
          .from('advertisements')
          .select('id, title')
          .eq('user_id', userId)
          .limit(2);
          
        if (adsError) {
          console.error('Erro ao buscar anúncios:', adsError);
        } else if (ads && ads.length > 0) {
          // Adicionar notificações de teste
          const { error: insertError } = await supabase
            .from('notifications')
            .insert([
              {
                user_id: userId,
                title: 'Anúncio Aprovado',
                message: `Seu anúncio "${ads[0].title}" foi aprovado e está ativo.`,
                type: 'approval',
                read: false,
                ad_id: ads[0].id,
                ad_title: ads[0].title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                user_id: userId,
                title: 'Novo Contato',
                message: `Você recebeu um novo contato sobre seu anúncio "${ads[0].title}".`,
                type: 'contact',
                read: false,
                ad_id: ads[0].id,
                ad_title: ads[0].title,
                created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
                updated_at: new Date(Date.now() - 86400000).toISOString()
              }
            ]);
            
          if (insertError) {
            console.error('Erro ao inserir notificações de teste:', insertError);
          } else {
            console.log('Notificações de teste adicionadas com sucesso');
          }
        }
      }
    } catch (testDataError) {
      console.error('Erro ao adicionar dados de teste:', testDataError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tabelas criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao executar setup de tabelas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 