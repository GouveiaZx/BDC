import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Definir interface para o tipo de perfil
interface ProfileType {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

// Buscar negócios/classificados (versão melhorada para incluir business_profiles)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const city = searchParams.get('city');

    const supabase = getSupabaseAdminClient();

    console.log('Buscando empresas com parâmetros:', { limit, offset, search, city });

    // Query principal com todos os campos necessários
    let query = supabase
      .from('business_profiles')
      .select(`
        id,
        user_id,
        business_name,
        company_name,
        description,
        business_description,
        address,
        business_address,
        city,
        state,
        zip_code,
        website,
        business_website,
        contact_phone,
        business_phone,
        business_email,
        business_whatsapp,
        banner_url,
        business_cover_url,
        business_logo_url,
        instagram,
        facebook,
        twitter,
        rating,
        reviews_count,
        total_views,
        is_verified,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true); // Só empresas ativas

    // Aplicar filtros
    if (search) {
      // Buscar em múltiplos campos
      query = query.or(`
        business_name.ilike.%${search}%,
        company_name.ilike.%${search}%,
        description.ilike.%${search}%,
        business_description.ilike.%${search}%
      `);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    // Aplicar paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: businesses, error } = await query;

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return NextResponse.json({
        success: false,
        businesses: [],
        total: 0,
        error: 'Erro ao buscar empresas'
      });
    }

    // Formatar empresas para o frontend
    const formattedBusinesses = (businesses || []).map((business: any) => {
      // Usar campos prioritários business_* ou fallback para campos simples
      const name = business.business_name || business.company_name || 'Empresa';
      const description = business.description || business.business_description || '';
      const phone = business.contact_phone || business.business_phone || '';
      const email = business.business_email || '';
      const whatsapp = business.business_whatsapp || phone;
      const website = business.website || business.business_website || '';
      const address = business.address || business.business_address || '';
      const banner = business.banner_url || business.business_cover_url || '/images/placeholder-banner.jpg';
      const logo = business.business_logo_url || '/images/avatar-placeholder.png';
      
      return {
        id: business.id,
        businessName: name,
        name: name, // Compatibilidade com componentes
        description: description,
        phone: phone,
        whatsapp: whatsapp,
        email: email,
        website: website,
        address: `${address}${business.city ? `, ${business.city}` : ''}${business.state ? ` - ${business.state}` : ''}`,
        city: business.city || '',
        state: business.state || '',
        zipCode: business.zip_code || '',
        banner: banner,
        logo: logo,
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        twitter: business.twitter || '',
        rating: parseFloat(business.rating || '0'),
        reviewsCount: business.reviews_count || 0,
        totalViews: business.total_views || 0,
        isVerified: business.is_verified || false,
        verified: business.is_verified || false, // Compatibilidade com componentes
        type: 'Empresa', // Tipo fixo para empresas
        plan: business.is_verified ? 'Premium' : 'Básico',
        createdAt: business.created_at,
        updatedAt: business.updated_at,
        userId: business.user_id
      };
    });

    console.log(`Encontradas ${formattedBusinesses.length} empresas`);

    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
      total: formattedBusinesses.length
    });

  } catch (error) {
    console.error('Erro na API de businesses:', error);
    return NextResponse.json({
      success: false,
      businesses: [],
      total: 0,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 