import { createClient } from '@supabase/supabase-js';
import { Store, Review, Ad } from '../models/types';
import { getFeaturedAds } from './mockData';

// Cliente do Supabase
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Busca uma loja ou empresa pelo ID ou slug
 */
export async function getStore(idOrSlug: string): Promise<Store | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Tentar buscar por ID
    let { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();
    
    if (error || !data) {
      console.error('Erro ao buscar loja:', error);
      return null;
    }
    
    // Buscar anúncios da loja
    const { data: storeAds, error: adsError } = await supabase
      .from('advertisements')
      .select('*')
      .eq('user_id', data.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    // Buscar anúncios destacados
    const { data: featuredAds, error: featuredError } = await supabase
      .from('advertisements')
      .select('*')
      .eq('user_id', data.id)
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(4);
    
    // Formatar os dados conforme a interface Store
    return {
      id: data.id,
      name: data.company_name || 'Empresa',
      slug: data.slug || data.id,
      description: data.description || '',
      logo: data.logo_url || '',
      banner: data.banner_url || '',
      bannerImage: data.banner_url || '',
      address: data.address || '',
      location: `${data.city || ''}, ${data.state || ''}`,
      city: data.city || '',
      state: data.state || '',
      established: data.created_at ? new Date(data.created_at).getFullYear().toString() : '',
      categories: data.categories || [],
  socialMedia: {
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
        website: data.website || ''
  },
  contactInfo: {
        email: data.email || '',
        phone: data.contact_phone || '',
        whatsapp: data.whatsapp || ''
  },
      contactEmail: data.email || '',
      contactPhone: data.contact_phone || '',
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      featured: !!data.is_featured,
  verifiedBusiness: true,
      featuredProducts: featuredAds || [],
      products: storeAds || [],
      allProducts: storeAds || [],
  ratings: [],
      createdAt: data.created_at || '',
      updatedAt: data.updated_at || ''
};
  } catch (err) {
    console.error('Erro ao buscar loja:', err);
    return null;
  }
}

/**
 * Busca avaliações para uma loja específica
 */
export async function getStoreReviews(storeId: string): Promise<Review[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('business_reviews')
      .select('*')
      .eq('business_id', storeId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
    
    // Transformar dados do banco para o formato Review
    return (data || []).map(review => ({
      id: review.id,
      name: review.author_name || 'Usuário',
      email: review.author_email || '',
      rating: review.rating || 0,
      comment: review.comment || '',
      date: review.created_at || ''
    }));
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    return [];
  }
} 