import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Tornar a API dinâmica para evitar cache
export const dynamic = 'force-dynamic';

// Obter dados completos de uma empresa
export async function GET(request: NextRequest) {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json({
        success: false,
        error: 'ID fornecido não é um UUID válido'
      }, { status: 400 });
    }
    
    // Buscar dados reais da empresa no banco de dados
    const supabase = getSupabaseAdminClient();
    let businessData = null;
    
    // 1. Tentar buscar em business_profiles primeiro
    try {
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (!businessError && businessProfile) {
        businessData = {
          id: businessProfile.id,
          business_name: businessProfile.company_name || businessProfile.business_name || 'Empresa',
          contact_name: businessProfile.contact_name || 'Responsável',
          description: businessProfile.description || 'Empresa cadastrada na plataforma',
          phone: businessProfile.contact_phone || businessProfile.phone || '',
          email: businessProfile.contact_email || businessProfile.email || '',
          website: businessProfile.website || '',
          address: businessProfile.address || '',
          city: businessProfile.city || '',
          state: businessProfile.state || '',
          zip_code: businessProfile.zip_code || '',
          categories: businessProfile.categories || [],
          is_featured: businessProfile.is_featured || false,
          logo_url: businessProfile.logo_url || '',
          banner_url: businessProfile.banner_url || '',
          facebook: businessProfile.facebook || '',
          instagram: businessProfile.instagram || '',
          whatsapp: businessProfile.whatsapp || businessProfile.contact_phone || businessProfile.phone || '',
          created_at: businessProfile.created_at,
          updated_at: businessProfile.updated_at,
          source: 'business_profiles'
        };
      }
    } catch (error) {
    }
    
    // 2. Se não encontrou, tentar buscar em profiles
    if (!businessData) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', businessId)
          .single();
        
        if (!profileError && profile) {
          businessData = {
            id: profile.id,
            business_name: profile.business_name || profile.name || 'Empresa',
            contact_name: profile.name || 'Responsável',
            description: profile.bio || 'Perfil cadastrado na plataforma',
            phone: profile.phone || '',
            email: profile.email || '',
            website: profile.website || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip_code: profile.zip_code || '',
            categories: profile.categories || [],
            is_featured: false,
            logo_url: profile.avatar_url || '',
            banner_url: profile.banner_url || '',
            facebook: profile.facebook || '',
            instagram: profile.instagram || '',
            whatsapp: profile.whatsapp || profile.phone || '',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            source: 'profiles'
          };
        }
      } catch (error) {
      }
    }
    
    // 3. Se não encontrou, tentar buscar em users
    if (!businessData) {
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', businessId)
          .single();
        
        if (!userError && user) {
          businessData = {
            id: user.id,
            business_name: user.name || 'Empresa',
            contact_name: user.name || 'Responsável',
            description: user.bio || 'Usuário cadastrado na plataforma',
            phone: user.phone || '',
            email: user.email || '',
            website: user.website || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zip_code: user.zip_code || '',
            categories: [],
            is_featured: false,
            logo_url: user.profile_image_url || '',
            banner_url: '',
            facebook: '',
            instagram: '',
            whatsapp: user.whatsapp || user.phone || '',
            created_at: user.created_at,
            updated_at: user.updated_at,
            source: 'users'
          };
        }
      } catch (error) {
      }
    }
    
    if (!businessData) {
      return NextResponse.json({
        success: false,
        error: 'Empresa não encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: businessData
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 