import { NextRequest, NextResponse } from 'next/server';
import { AdModerationStatus } from '../../../models/types';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateUUID } from '../../../lib/utils';

// Interface para os anúncios
interface Ad {
  id: string;
  title: string;
  description: string;
  price: string | number;
  category: string;
  subCategory: string;
  images: string[];
  location: string;
  zipCode: string;
  phone: string;
  whatsapp: string;
  showPhone: boolean;
  isFreeAd: boolean;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  views: number;
  clicks: number;
  status: string;
  expires: string;
}

// Interface para os dados do Supabase
interface SupabaseAd {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  sub_category: string;
  images: string[];
  location: string;
  zip_code: string;
  phone: string;
  whatsapp: string;
  show_phone: boolean;
  is_free_ad: boolean;
  moderation_status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  views: number;
  clicks: number;
  status: string;
  expires_at: string;
}

// Banco de dados temporário (apenas para desenvolvimento)
let adsDatabase: Ad[] = [];

// Inicializa o cliente Supabase no lado do servidor
const getSupabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltam variáveis de ambiente do Supabase');
  }
  
  // Recuperar o token de autenticação dos cookies
  const cookieStore = cookies();
  const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
  
  // Criar cliente com token de autenticação, se disponível
  if (supabaseAccessToken) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`
        }
      }
    });
  }
  
  // Fallback para cliente anônimo
  return createClient(supabaseUrl, supabaseKey);
};

// Helper para extrair token do usuário
function extractUserFromRequest(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth_token');
    const authHeader = request.headers.get('authorization');
    
    let token = '';
    if (authCookie) {
      token = authCookie.value;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) return null;
    
    const decoded = JSON.parse(atob(token));
    
    // Verificar se token não expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const { 
      title, 
      description, 
      category_id,
      city_id,
      price, 
      price_type = 'fixed',
      contact_phone,
      contact_whatsapp,
      contact_email,
      photos = []
    } = await request.json();

    // Validações básicas
    if (!title || !description || !category_id || !city_id) {
      return NextResponse.json(
        { success: false, error: 'Título, descrição, categoria e cidade são obrigatórios' },
        { status: 400 }
      );
    }

    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Título deve ter entre 5 e 100 caracteres' },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Descrição deve ter entre 10 e 2000 caracteres' },
        { status: 400 }
      );
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        subscriptions!inner (
          *,
          plans (*)
        )
      `)
      .eq('id', userToken.userId)
      .eq('subscriptions.status', 'active')
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou sem assinatura ativa' },
        { status: 404 }
      );
    }

    const subscription = user.subscriptions[0];
    const plan = subscription.plans;

    // Verificar se usuário atingiu limite de anúncios
    if (subscription.ads_used >= plan.max_ads) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Limite de ${plan.max_ads} anúncio(s) atingido. Faça upgrade do seu plano.`,
          limit_reached: true
        },
        { status: 400 }
      );
    }

    // Verificar se categoria existe
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category_id)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      );
    }

    // Verificar se cidade existe
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', city_id)
      .eq('is_active', true)
      .single();

    if (cityError || !city) {
      return NextResponse.json(
        { success: false, error: 'Cidade não encontrada' },
        { status: 400 }
      );
    }

    // Calcular data de expiração
    let expiresAt = null;
    if (plan.ad_duration_days > 0) {
      // Duração específica em dias
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.ad_duration_days);
    } else {
      // Duração ilimitada (para planos Business)
      expiresAt = new Date('2099-12-31'); // Data muito distante para duração "ilimitada"
    }

    // Dados do anúncio
    const adData = {
      user_id: user.id,
      category_id,
      city_id,
      title: title.trim(),
      description: description.trim(),
      price: price ? parseFloat(price) : null,
      price_type,
      contact_phone: contact_phone || user.phone,
      contact_whatsapp: contact_whatsapp || user.whatsapp,
      contact_email: contact_email || user.email,
      status: 'pending', // Sempre começa como pendente para moderação
      is_featured: plan.has_premium_features && plan.is_featured,
      is_premium: plan.has_premium_features,
      published_at: null, // Será definido após aprovação
      expires_at: expiresAt.toISOString()
    };

    // Criar anúncio
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .insert(adData)
      .select(`
        *,
        categories (*),
        cities (*),
        users!inner (
          id,
          name,
          profile_image_url,
          user_type
        )
      `)
      .single();

    if (adError) {
      console.error('Erro ao criar anúncio:', adError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar anúncio' },
        { status: 500 }
      );
    }

    // Adicionar fotos se fornecidas
    const adPhotos = [];
    if (photos.length > 0) {
      const maxPhotos = plan.max_photos_per_ad;
      const photosToAdd = photos.slice(0, maxPhotos);

      for (let i = 0; i < photosToAdd.length; i++) {
        const photo = photosToAdd[i];
        const photoData = {
          ad_id: ad.id,
          file_url: photo.url,
          file_name: photo.name || `foto_${i + 1}.jpg`,
          file_size: photo.size || null,
          sort_order: i,
          is_primary: i === 0 // Primeira foto é sempre primária
        };

        const { data: addedPhoto } = await supabase
          .from('ad_photos')
          .insert(photoData)
          .select('*')
          .single();

        if (addedPhoto) {
          adPhotos.push(addedPhoto);
        }
      }
    }

    // Atualizar contador de anúncios usados na assinatura
    await supabase
      .from('subscriptions')
      .update({
        ads_used: subscription.ads_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    // Criar notificação para o usuário
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Anúncio enviado para moderação',
        message: `Seu anúncio "${ad.title}" foi enviado para análise. Você será notificado quando for aprovado.`,
        type: 'ad_submitted',
        related_entity_type: 'ad',
        related_entity_id: ad.id
      });

    return NextResponse.json({
      success: true,
      message: 'Anúncio criado com sucesso e enviado para moderação',
      ad: {
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        price_type: ad.price_type,
        status: ad.status,
        expires_at: ad.expires_at,
        is_featured: ad.is_featured,
        is_premium: ad.is_premium,
        category: ad.categories,
        city: ad.cities,
        user: ad.users,
        photos: adPhotos,
        created_at: ad.created_at
      },
      plan_usage: {
        ads_used: subscription.ads_used + 1,
        ads_remaining: plan.max_ads - (subscription.ads_used + 1),
        max_ads: plan.max_ads
      }
    });

  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obter todos os anúncios ou filtrar por status de moderação
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const moderationStatus = searchParams.get('moderationStatus');
    const status = searchParams.get('status');
    
    let ads: Ad[] = [];
    
    try {
      // Tentar buscar anúncios do Supabase
      const supabase = getSupabaseServer();
      
      // Construir a query base
      let query = supabase.from('advertisements').select('*');
      
      // Adicionar filtros conforme necessário
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (moderationStatus) {
        query = query.eq('moderation_status', moderationStatus);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });
      
      const { data: supabaseAds, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar anúncios do Supabase:', error);
        
        // Fallback: usar dados em memória
        ads = [...adsDatabase];
        console.log('Usando dados em memória como fallback. Total:', ads.length);
      } else if (supabaseAds && supabaseAds.length > 0) {
        // Mapear os dados do Supabase para o formato esperado
        ads = supabaseAds.map((ad: SupabaseAd) => ({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          price: ad.price,
          category: ad.category,
          subCategory: ad.sub_category,
          images: ad.images || [],
          location: ad.location,
          zipCode: ad.zip_code,
          phone: ad.phone,
          whatsapp: ad.whatsapp,
          showPhone: ad.show_phone,
          isFreeAd: ad.is_free_ad,
          moderationStatus: ad.moderation_status,
          createdAt: ad.created_at,
          updatedAt: ad.updated_at,
          userId: ad.user_id,
          userName: ad.user_name,
          userAvatar: ad.user_avatar,
          views: ad.views,
          clicks: ad.clicks,
          status: ad.status,
          expires: ad.expires_at
        }));
        
        console.log('Anúncios buscados do Supabase. Total:', ads.length);
      } else {
        // Se não houver anúncios no Supabase, usar dados em memória
        ads = [...adsDatabase];
        console.log('Nenhum anúncio encontrado no Supabase. Usando memória. Total:', ads.length);
      }
    } catch (dbError) {
      console.error('Erro ao conectar ao Supabase:', dbError);
      
      // Fallback: filtrar dados em memória
      ads = [...adsDatabase];
      console.log('Usando dados em memória como fallback. Total:', ads.length);
    }
    
    // Aplicar filtros aos dados em memória (caso os dados venham do fallback)
    if (userId) {
      ads = ads.filter(ad => ad.userId === userId);
    }
    
    if (moderationStatus) {
      ads = ads.filter(ad => ad.moderationStatus === moderationStatus);
    }
    
    if (status) {
      ads = ads.filter(ad => ad.status === status);
    }
    
    // Ordenar do mais recente para o mais antigo
    ads.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      total: ads.length,
      ads: ads
    });
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar anúncios' },
      { status: 500 }
    );
  }
} 