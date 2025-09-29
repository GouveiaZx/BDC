import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { SubscriptionPlan } from '../../../models/types';

// Função para verificar se o usuário pode criar um anúncio gratuito
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Conectar ao Supabase
    const supabase = getSupabaseAdminClient();
    
    // Buscar dados do usuário no banco de dados
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
    }

    // Buscar anúncios gratuitos do usuário (is_free_ad = true)
    const { data: freeAds, error: adsError } = await supabase
      .from('ads')
      .select('id, created_at, status')
      .eq('user_id', userId)
      .eq('is_free_ad', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (adsError) {
    }

    // Determinar o plano do usuário (default: FREE)
    const userSubscription = userProfile?.subscription_plan || SubscriptionPlan.FREE;
    const isSubscriber = userSubscription !== SubscriptionPlan.FREE;
    
    // Verificar se o usuário tem anúncio gratuito ativo
    const hasActiveFreeAd = freeAds && freeAds.length > 0;
    let freeAdDate: Date | null = null;
    let freeAdExpiryDate: Date | null = null;
    let daysRemaining = 0;

    if (hasActiveFreeAd && freeAds![0]) {
      freeAdDate = new Date(freeAds![0].created_at);
      freeAdExpiryDate = new Date(freeAdDate);
      freeAdExpiryDate.setDate(freeAdExpiryDate.getDate() + 90); // Próximo anúncio gratuito em 90 dias
      
      const today = new Date();
      const diffTime = freeAdExpiryDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
    }
    
    // Determinar os slots de anúncios disponíveis com base no plano
    let availableAdSlots = 0;
    switch (userSubscription) {
      case SubscriptionPlan.MICRO_BUSINESS:
        availableAdSlots = 4; // 4 anúncios
        break;
      case SubscriptionPlan.SMALL_BUSINESS:
        availableAdSlots = 5; // 5 anúncios
        break;
      case SubscriptionPlan.BUSINESS_SIMPLE:
        availableAdSlots = 10; // 10 anúncios
        break;
      case SubscriptionPlan.BUSINESS_PLUS:
        availableAdSlots = 20; // 20 anúncios
        break;
      default:
        availableAdSlots = 0; // Plano gratuito - apenas anúncio gratuito
    }
    
    // Determinar se o usuário pode criar um anúncio gratuito
    const canCreateFreeAd = !hasActiveFreeAd || daysRemaining === 0;
    
    return NextResponse.json({
      user: {
        id: userId,
        subscription: userSubscription,
        isSubscriber
      },
      freeAd: {
        used: hasActiveFreeAd || false,
        canCreate: canCreateFreeAd,
        daysRemaining,
        adId: hasActiveFreeAd ? freeAds![0].id : null,
        expiryDate: freeAdExpiryDate
      },
      subscription: {
        type: userSubscription,
        availableAdSlots
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status do anúncio gratuito' }, 
      { status: 500 }
    );
  }
}

// API para consumir o anúncio gratuito - quando o usuário cria um anúncio gratuito
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, adId } = data;
    
    if (!userId || !adId) {
      return NextResponse.json(
        { error: 'ID de usuário e anúncio são obrigatórios' },
        { status: 400 }
      );
    }
    
         // Conectar ao Supabase
     const supabase = getSupabaseAdminClient();
     
     // Marcar o anúncio como gratuito no banco de dados
    const { error: updateError } = await supabase
      .from('ads')
      .update({ is_free_ad: true })
      .eq('id', adId)
      .eq('user_id', userId);
    
    if (updateError) {
      throw updateError;
    }
    
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + 90); // 90 dias a partir de hoje
    
    return NextResponse.json({
      success: true,
      freeAd: {
        used: true,
        adId,
        createdAt: today.toISOString(),
        expiryDate: expiryDate.toISOString(),
        canCreateNextOn: expiryDate.toISOString()
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao registrar anúncio gratuito' }, 
      { status: 500 }
    );
  }
} 