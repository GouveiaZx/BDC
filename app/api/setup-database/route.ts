import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();
    
    console.log('Iniciando configuração do banco de dados...');
    
    // Script SQL para criar todas as tabelas
    const createTablesSQL = `
      -- Criar extensões necessárias
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Criar tabela de anúncios
      CREATE TABLE IF NOT EXISTS advertisements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        category TEXT,
        sub_category TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        location TEXT,
        zip_code TEXT,
        phone TEXT,
        whatsapp TEXT,
        show_phone BOOLEAN DEFAULT true,
        is_free_ad BOOLEAN DEFAULT true,
        moderation_status TEXT DEFAULT 'pending',
        user_id UUID,
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

      -- Criar tabela de destaques
      CREATE TABLE IF NOT EXISTS destaques (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT,
        description TEXT,
        media_url TEXT,
        user_id UUID,
        user_name TEXT,
        user_avatar TEXT,
        status TEXT DEFAULT 'pending',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela de empresas
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        logo_url TEXT,
        banner_url TEXT,
        description TEXT,
        categories JSONB DEFAULT '[]'::jsonb,
        website TEXT,
        facebook TEXT,
        instagram TEXT,
        whatsapp TEXT,
        user_id UUID,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela de perfis de empresas
      CREATE TABLE IF NOT EXISTS business_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        company_name TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        logo_url TEXT,
        banner_url TEXT,
        description TEXT,
        website TEXT,
        facebook TEXT,
        instagram TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Executar o script SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createTablesSQL
    });
    
    if (createError) {
      console.error('Erro ao criar tabelas:', createError);
      return NextResponse.json({ 
        success: false, 
        error: createError.message 
      }, { status: 500 });
    }
    
    console.log('Tabelas criadas com sucesso');
    
    // Criar índices
    const createIndexesSQL = `
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_advertisements_user_id ON advertisements(user_id);
      CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
      CREATE INDEX IF NOT EXISTS idx_advertisements_moderation_status ON advertisements(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_advertisements_created_at ON advertisements(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_destaques_status ON destaques(status);
      CREATE INDEX IF NOT EXISTS idx_destaques_is_active ON destaques(is_active);
      CREATE INDEX IF NOT EXISTS idx_destaques_created_at ON destaques(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_is_verified ON businesses(is_verified);
      CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_business_profiles_created_at ON business_profiles(created_at);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: createIndexesSQL
    });
    
    if (indexError) {
      console.warn('Aviso ao criar índices:', indexError);
    } else {
      console.log('Índices criados com sucesso');
    }
    
    // Inserir dados de exemplo
    const insertDataSQL = `
      -- Inserir alguns dados de exemplo
      INSERT INTO destaques (title, description, media_url, user_id, user_name, status, is_active) VALUES
      ('Destaque BDC', 'Bem-vindo ao BDC Classificados', '/images/placeholder.jpg', '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18', 'BuscaAquiBdC', 'approved', true)
      ON CONFLICT DO NOTHING;
      
      INSERT INTO businesses (business_name, description, city, state, is_verified) VALUES
      ('EG', 'Empresa de exemplo cadastrada na plataforma', 'São Paulo', 'SP', true),
      ('Loja Exemplo', 'Loja de exemplo para demonstração', 'Rio de Janeiro', 'RJ', true),
      ('Serviços Teste', 'Prestadora de serviços de exemplo', 'Belo Horizonte', 'MG', true)
      ON CONFLICT DO NOTHING;
    `;
    
    const { error: dataError } = await supabase.rpc('exec_sql', {
      sql_query: insertDataSQL
    });
    
    if (dataError) {
      console.warn('Aviso ao inserir dados de exemplo:', dataError);
    } else {
      console.log('Dados de exemplo inseridos com sucesso');
    }
    
    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['advertisements', 'destaques', 'businesses', 'business_profiles']);
    
    if (tablesError) {
      console.error('Erro ao verificar tabelas:', tablesError);
    }
    
    const createdTables = tables?.map(t => t.table_name) || [];
    console.log('Tabelas criadas:', createdTables);
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso',
      tables: createdTables
    });
    
  } catch (error) {
    console.error('Erro geral na configuração do banco:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 