import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

// Rota para executar o setup do banco de dados
export async function GET(req: NextRequest) {
  try {
    console.log('============================================');
    console.log('API /api/admin/setup SENDO CHAMADA');
    console.log('============================================');
    
    const admin = getSupabaseAdminClient();
    
    // Verificar se já existem empresas no banco
    const { count, error: countError } = await admin
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return NextResponse.json({
        success: false,
        error: countError.message
      }, { status: 500 });
    }
    
    console.log(`Total de empresas encontradas: ${count}`);
    
    // Se já existirem empresas, não fazer nada
    if (count && count > 0) {
      return NextResponse.json({
        success: true,
        message: 'Banco de dados já contém empresas',
        count
      });
    }
    
    // Verificar se a tabela existe
    const { error: tableCheckError } = await admin
      .from('businesses')
      .select('id')
      .limit(1);
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      return NextResponse.json({
        success: false,
        error: 'Tabela businesses não existe'
      }, { status: 500 });
    }
    
    // Inserir dados de exemplo para as empresas reais
    const empresas = [
      {
        business_name: 'Autopeças São Luís',
        contact_name: 'Maria Oliveira',
        phone: '(98) 99123-4567',
        email: 'contato@autopecas.com',
        address: 'Av. Jerônimo de Albuquerque, 123',
        city: 'São Luís',
        state: 'MA',
        logo_url: 'https://via.placeholder.com/150',
        banner_url: 'https://via.placeholder.com/800x400',
        description: 'Loja especializada em peças automotivas para todas as marcas e modelos.',
        categories: ['automotivo'],
        website: 'www.autopecas.com.br',
        facebook: 'autopecassl',
        instagram: 'autopecassl',
        whatsapp: '98991234567',
        is_verified: false,
        is_active: true,
        moderation_status: 'pending'
      },
      {
        business_name: 'Clínica Vida Saudável',
        contact_name: 'Dr. Roberto Santos',
        phone: '(98) 3232-5678',
        email: 'contato@clinicavida.com',
        address: 'Rua Grande, 456, Centro',
        city: 'São Luís',
        state: 'MA',
        logo_url: 'https://via.placeholder.com/150',
        banner_url: 'https://via.placeholder.com/800x400',
        description: 'Clínica médica com diversas especialidades para cuidar da sua saúde.',
        categories: ['saude'],
        website: 'www.clinicavida.com.br',
        facebook: 'clinicavida',
        instagram: 'clinicavida',
        whatsapp: '98988885678',
        is_verified: true,
        is_active: true,
        moderation_status: 'approved'
      },
      {
        business_name: 'Colégio Futuro Brilhante',
        contact_name: 'Profa. Carla Mendes',
        phone: '(98) 3221-7890',
        email: 'contato@colegiofuturo.com',
        address: 'Av. dos Holandeses, 789',
        city: 'São Luís',
        state: 'MA',
        logo_url: 'https://via.placeholder.com/150',
        banner_url: 'https://via.placeholder.com/800x400',
        description: 'Escola de qualidade com ensino fundamental e médio, preparando alunos para o futuro.',
        categories: ['educacao'],
        website: 'www.colegiofuturo.com.br',
        facebook: 'colegiofuturo',
        instagram: 'colegiofuturo',
        whatsapp: '98987654321',
        is_verified: true,
        is_active: true,
        moderation_status: 'approved'
      },
      {
        business_name: 'Salão de Beleza Glamour',
        contact_name: 'Ana Paula Costa',
        phone: '(98) 99456-7890',
        email: 'contato@salaoglamour.com.br',
        address: 'Rua das Flores, 123, Centro',
        city: 'São Luís',
        state: 'MA',
        logo_url: 'https://via.placeholder.com/150',
        banner_url: 'https://via.placeholder.com/800x400',
        description: 'Salão de beleza completo com serviços de cabelo, manicure, pedicure, maquiagem e estética.',
        categories: ['beleza'],
        website: null,
        facebook: null,
        instagram: 'salaoglamour',
        whatsapp: '98994567890',
        is_verified: false,
        is_active: true,
        moderation_status: 'rejected',
        moderation_reason: 'Imagens inadequadas'
      },
      {
        business_name: 'Restaurante Sabor da Terra',
        contact_name: 'João Silva',
        phone: '(98) 3221-4567',
        email: 'contato@sabordaterra.com',
        address: 'Av. Litorânea, 987',
        city: 'São Luís',
        state: 'MA',
        logo_url: 'https://via.placeholder.com/150',
        banner_url: 'https://via.placeholder.com/800x400',
        description: 'Restaurante especializado em culinária regional maranhense, com pratos típicos e ambiente familiar.',
        categories: ['alimentacao'],
        website: 'www.sabordaterra.com.br',
        facebook: 'restaurantesabor',
        instagram: 'sabordaterra',
        whatsapp: '98991234444',
        is_verified: false,
        is_active: true,
        moderation_status: 'pending'
      }
    ];
    
    // Inserir empresas no banco de dados
    const { data, error } = await admin
      .from('businesses')
      .insert(empresas)
      .select();
    
    if (error) {
      console.error('Erro ao inserir empresas:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    console.log(`${data?.length || 0} empresas inseridas com sucesso!`);
    
    return NextResponse.json({
      success: true,
      message: 'Setup concluído com sucesso',
      data: {
        empresasInseridas: data?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar setup:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 