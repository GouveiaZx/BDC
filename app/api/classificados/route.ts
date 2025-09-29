import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

// API para buscar CLASSIFICADOS (APENAS usuários com planos PAGOS)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sectorId = searchParams.get('sector'); // Novo filtro por ramo de atividade
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      throw new Error('Falha ao conectar com o banco de dados');
    }

    // 1. Buscar anúncios ativos na tabela ads (nova tabela - prioridade)
    const { data: adsFromAds, error: adsError } = await supabase
      .from('ads')
      .select('user_id')
      .eq('status', 'active')
      .eq('moderation_status', 'approved')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()); // Último ano

    // 2. Buscar anúncios na tabela advertisements (fallback)
    const { data: adsFromAdvertisements, error: advertError } = await supabase
      .from('advertisements')
      .select('user_id')
      .eq('status', 'active')
      .eq('moderation_status', 'approved')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()); // Último ano

    // 3. Combinar usuários com anúncios de ambas as tabelas e obter IDs únicos
    const activeAdvertisers = new Set<string>();
    
    if (adsFromAds && !adsError) {
      adsFromAds.forEach(ad => activeAdvertisers.add(ad.user_id));
    }
    
    if (adsFromAdvertisements && !advertError) {
      adsFromAdvertisements.forEach(ad => activeAdvertisers.add(ad.user_id));
    }

    if (activeAdvertisers.size === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'Nenhum anunciante encontrado'
      });
    }

    const advertiserIds = Array.from(activeAdvertisers);
    // 4. ✅ VERIFICAR ASSINATURAS ATIVAS (APENAS PLANOS PAGOS)
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        plan_id,
        status,
        ends_at,
        plans!inner(
          slug,
          name,
          price_monthly
        )
      `)
      .in('user_id', advertiserIds)
      .eq('status', 'active')
      .neq('plans.slug', 'free') // ✅ EXCLUIR PLANO FREE
      .gte('ends_at', new Date().toISOString()); // Apenas assinaturas não expiradas

    let paidAdvertisers = [];
    if (subscriptions && !subscriptionError) {
      paidAdvertisers = subscriptions.map(sub => sub.user_id);
    } else {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'Nenhum anunciante com plano pago encontrado'
      });
    }

    // 5. ✅ BUSCAR DADOS DOS USUÁRIOS/PERFIS (apenas anunciantes pagos)
    let profileQuery = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        name,
        email,
        phone,
        whatsapp,
        avatar_url,
        account_type,
        business_sector,
        business_sector_id,
        categories:business_sector_id(name, slug, icon)
      `)
      .in('user_id', paidAdvertisers)
      .eq('is_active', true);

    // ✅ NOVO: Filtro por ramo de atividade (apenas para planos pagos)
    if (sectorId) {
      profileQuery = profileQuery.eq('business_sector_id', sectorId);
    }

    const { data: profiles, error: profilesError } = await profileQuery
      .range(offset, offset + limit - 1)
      .order('name');

    if (profilesError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar perfis de usuários'
      }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: sectorId ? 'Nenhuma empresa encontrada neste ramo de atividade' : 'Nenhuma empresa encontrada'
      });
    }

    // 6. ✅ BUSCAR BUSINESS PROFILES (dados complementares de empresas)
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select(`
        user_id,
        company_name,
        company_description,
        contact_email,
        contact_phone,
        contact_whatsapp,
        website_url,
        logo_url,
        address,
        city,
        state,
        zip_code,
        opening_hours,
        social_media
      `)
      .in('user_id', profiles.map(p => p.user_id));

    // 7. ✅ MAPEAR BUSINESS PROFILES por user_id
    const businessMap: Record<string, any> = {};
    if (businessProfiles && !businessError) {
      businessProfiles.forEach(business => {
        businessMap[business.user_id] = business;
      });
    }

    // 8. ✅ COMBINAR DADOS e FORMATAR RESPOSTA
    const companies = profiles.map(profile => {
      const business = businessMap[profile.user_id];
      const subscription = subscriptions?.find(sub => sub.user_id === profile.user_id);
      
      return {
        id: profile.id,
        userId: profile.user_id,
        name: business?.company_name || profile.name || 'Empresa',
        description: business?.company_description || 'Empresa verificada',
        email: business?.contact_email || profile.email,
        phone: business?.contact_phone || profile.phone,
        whatsapp: business?.contact_whatsapp || profile.whatsapp,
        website: business?.website_url,
        logo: business?.logo_url || profile.avatar_url,
        address: business?.address,
        city: business?.city,
        state: business?.state,
        zipCode: business?.zip_code,
        openingHours: business?.opening_hours,
        socialMedia: business?.social_media,
        accountType: profile.account_type || 'business',
        isVerified: true, // ✅ Empresas com planos pagos são verificadas automaticamente
        isPaid: true, // ✅ Todas são pagas (filtro aplicado)
        planName: subscription?.plans ? (subscription.plans as any).name : null,
        planSlug: subscription?.plans ? (subscription.plans as any).slug : null,
        planPrice: subscription?.plans ? (subscription.plans as any).price_monthly : null,
        // ✅ NOVO: Dados do ramo de atividade
        businessSector: profile.business_sector,
        businessSectorId: profile.business_sector_id,
        businessSectorInfo: profile.categories ? {
          name: (profile.categories as any).name,
          slug: (profile.categories as any).slug,
          icon: (profile.categories as any).icon
        } : null
      };
    });
    
    return NextResponse.json({
      success: true,
      data: companies,
      total: companies.length,
      metadata: {
        totalPaidAdvertisers: paidAdvertisers.length,
        hasBusinessSectorFilter: !!sectorId,
        appliedFilters: {
          sector: sectorId,
          limit,
          offset
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}