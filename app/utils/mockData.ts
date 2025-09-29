import { createClient } from '@supabase/supabase-js';
import { Ad, Category, Seller, User, StoryMediaType, StoryPriority } from '../models/types';

// Cliente do Supabase
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Obtém anúncios em destaque diretamente do banco de dados
 */
export async function getFeaturedAds(limit: number = 6): Promise<Ad[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Erro ao buscar anúncios em destaque:', error);
      return [];
    }
    
    return data.map(transformAdFromDatabase) || [];
  } catch (err) {
    console.error('Erro ao buscar anúncios em destaque:', err);
    return [];
  }
}

/**
 * Obtém anúncios recentes diretamente do banco de dados
 */
export async function getRecentAds(limit: number = 12): Promise<Ad[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Erro ao buscar anúncios recentes:', error);
      return [];
    }
    
    return data.map(transformAdFromDatabase) || [];
  } catch (err) {
    console.error('Erro ao buscar anúncios recentes:', err);
    return [];
  }
}

/**
 * Transforma dados do banco em um objeto Ad compatível com a aplicação
 */
function transformAdFromDatabase(dbAd: any): Ad {
  return {
    id: dbAd.id,
    title: dbAd.title,
    description: dbAd.description,
    price: parseFloat(dbAd.price),
    priceFormatted: formatPrice(parseFloat(dbAd.price)),
    category: dbAd.category,
    location: `${dbAd.location || ''}`,
    city: dbAd.city || '',
    state: dbAd.state || '',
    images: dbAd.images ? (Array.isArray(dbAd.images) ? dbAd.images : []) : [],
    createdAt: dbAd.created_at,
    featured: dbAd.is_featured || false,
    seller: {
      id: dbAd.user_id,
      name: dbAd.user_name || 'Anunciante',
      avatar: dbAd.user_avatar || '',
      type: 'user',
      location: dbAd.location || '',
      verified: false,
      joinDate: dbAd.created_at
    },
    views: dbAd.views || 0,
    isFavorite: false,
    whatsapp: dbAd.whatsapp || ''
  };
}

/**
 * Obtém informações de um vendedor pelo ID
 */
export async function getSellerById(id: string): Promise<Seller | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Tentar buscar primeiro em business_profiles
    let { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (businessData) {
      return transformBusinessToSeller(businessData);
    }
    
    // Se não encontrar, buscar em profiles
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (userData) {
      return transformUserToSeller(userData);
    }
    
    return null;
  } catch (err) {
    console.error('Erro ao buscar vendedor:', err);
    return null;
  }
}

/**
 * Transforma dados de business_profiles em um objeto Seller
 */
function transformBusinessToSeller(business: any): Seller {
  return {
    id: business.id,
    name: business.company_name || 'Empresa',
    logo: business.logo_url || '',
    backgroundImage: business.banner_url || '',
    description: business.description || '',
    phone: business.contact_phone || '',
    email: business.email || '',
    address: business.address || '',
    website: business.website || '',
    socialMedia: {
      facebook: business.facebook || '',
      instagram: business.instagram || '',
      twitter: business.twitter || ''
    },
    rating: 0,
    reviewCount: 0,
    verified: true
  };
}

/**
 * Transforma dados de profiles em um objeto Seller
 */
function transformUserToSeller(user: any): Seller {
  return {
    id: user.id,
    name: user.name || 'Usuário',
    logo: user.avatar_url || '',
    backgroundImage: '',
    description: '',
    phone: user.phone || '',
    email: user.email || '',
    address: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
    rating: 0,
    reviewCount: 0,
    verified: false
  };
}

/**
 * Formata um valor para o formato de moeda
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
} 