import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { validate as isUUID } from 'uuid';

// Tornar a API dinâmica para evitar cache
export const dynamic = 'force-dynamic';

// Obter dados completos de uma empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    // Validar se é um UUID válido
    if (!isUUID(businessId)) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa inválido'
      }, { status: 400 });
    }
    
    console.log(`Buscando dados da empresa ID: ${businessId}`);
    
    const supabase = getSupabaseAdminClient();
    
    // Buscar dados da empresa incluindo rating e reviews_count
    const { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select(`
        id,
        rating,
        reviews_count,
        total_views,
        is_verified,
        business_name,
        company_name,
        description,
        business_description,
        contact_phone,
        business_phone,
        banner_url,
        business_cover_url,
        business_logo_url,
        city,
        state,
        address,
        business_address,
        website,
        business_website,
        updated_at
      `)
      .eq('id', businessId)
      .single();
    
    if (businessError) {
      console.error('Erro ao buscar dados da empresa:', businessError);
      return NextResponse.json({
        success: false,
        error: 'Empresa não encontrada'
      }, { status: 404 });
    }
    
    // Formatar dados da empresa
    const formattedData = {
      id: businessData.id,
      rating: parseFloat(businessData.rating || '0'),
      reviews_count: businessData.reviews_count || 0,
      total_views: businessData.total_views || 0,
      is_verified: businessData.is_verified || false,
      name: businessData.business_name || businessData.company_name || 'Empresa',
      description: businessData.description || businessData.business_description || '',
      phone: businessData.contact_phone || businessData.business_phone || '',
      banner: businessData.banner_url || businessData.business_cover_url || '/images/placeholder-banner.jpg',
      logo: businessData.business_logo_url || '/images/avatar-placeholder.png',
      city: businessData.city || '',
      state: businessData.state || '',
      address: businessData.address || businessData.business_address || '',
      website: businessData.website || businessData.business_website || '',
      updated_at: businessData.updated_at
    };
    
    return NextResponse.json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error('Erro na API de dados da empresa:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 