import { NextRequest, NextResponse } from 'next/server';
import { AdModerationStatus } from '../../../models/types';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateUUID } from '../../../lib/utils';
import { validateAdCreation, calculateAdExpirationDate } from '../../../lib/planLimits';

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
  showWhatsapp: boolean;
  email: string;
  showEmail: boolean;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'sold';
  moderationStatus: AdModerationStatus;
  views: number;
  highlights: number;
  isHighlighted: boolean;
  userId: string;
  userName: string;
  userType: 'personal' | 'business';
}

// Interface para anúncios do Supabase
interface SupabaseAd {
  id: string;
  title: string;
  description: string;
  price: number;
  price_type: string;
  category_id: number;
  city_id: number;
  user_id: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  moderation_status: string;
  status: string;
  created_at: string;
  expires_at: string;
  views: number;
  is_highlighted: boolean;
  highlight_expires_at?: string;
}

// Função para obter cliente Supabase no servidor
function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Função para extrair token do usuário da requisição
function extractUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    if (!userToken || !userToken.sub) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const userId = userToken.sub;

    // Validar se o usuário pode criar um novo anúncio baseado no seu plano
    const validation = await validateAdCreation(userId);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.message,
          plan_limits: validation.limits,
          current_usage: validation.current_usage
        },
        { status: 403 }
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

    // Calcular data de expiração baseada no plano
    const expirationDate = calculateAdExpirationDate(validation.limits!);
    // Criar o anúncio no banco de dados
    const supabase = getSupabaseServer();
    
    const adData = {
      id: generateUUID(),
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category_id,
      city_id,
      price: price ? parseFloat(price) : null,
      price_type,
      contact_phone: contact_phone?.trim() || null,
      contact_whatsapp: contact_whatsapp?.trim() || null,
      contact_email: contact_email?.trim() || null,
      status: 'pending', // Aguardando moderação
      moderation_status: 'pending',
      expires_at: expirationDate?.toISOString() || null,
      images: photos || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdAd, error: createError } = await supabase
      .from('ads')
      .insert([adData])
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar anúncio: ' + createError.message },
        { status: 500 }
      );
    }
    // Atualizar o contador de uso (opcional para estatísticas futuras)
    const newUsage = await validation.current_usage;
    
    return NextResponse.json({
      success: true,
      message: 'Anúncio criado com sucesso e está aguardando moderação',
      data: {
        id: createdAd.id,
        title: createdAd.title,
        status: createdAd.status,
        expires_at: createdAd.expires_at,
        plan_info: {
          limits: validation.limits,
          usage_after_creation: {
            active_ads: (newUsage?.active_ads || 0) + 1,
            highlights_today: newUsage?.highlights_today || 0
          }
        }
      }
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obter todos os anúncios ou filtrar por status de moderação
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'GET funcionando',
      ads: []
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar anúncios' },
      { status: 500 }
    );
  }
}