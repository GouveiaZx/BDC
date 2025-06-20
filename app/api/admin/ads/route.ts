import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

async function checkManualAuth(request: NextRequest): Promise<boolean> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    if (adminAuthCookie === 'true') {
      console.log('(Ads API) Autenticação manual válida via cookie admin-auth');
      return true;
    }
    
    if (sbAccessToken) {
      console.log('(Ads API) Autenticação manual válida via sb-access-token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('(Ads API) Erro ao verificar autenticação manual:', error);
    return false;
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('(Ads API) Erro ao buscar perfil para verificação de admin:', profileError.message);
    } else if (profileData) {
      if (profileData.is_admin === true) {
        console.log('(Ads API) Usuário é admin (is_admin=true no perfil):', userId);
        return true;
      }
      if (profileData.email) {
        const adminEmails = ['admin@buscaaquibdc.com.br', 'rodrigogouveiarx@gmail.com', 'developer@buscaaquibdc.com.br'];
        if (adminEmails.includes(profileData.email.toLowerCase())) {
          console.log('(Ads API) Usuário é admin (email na lista de admins):', profileData.email);
          return true;
        }
      }
    }

    const { data: authData, error: authError } = await supabase.rpc('exec_sql', { 
      sql_query: `SELECT is_admin, email FROM auth.users WHERE id = '${userId}'`
    });
    
    if (authError) {
      console.warn('(Ads API) Aviso ao verificar admin em auth.users:', authError.message);
    } else if (authData && authData.length > 0) {
      const userAuthInfo = authData[0];
      if (userAuthInfo?.is_admin === true) {
        console.log('(Ads API) Usuário é admin (is_admin=true em auth.users via RPC):', userId);
        return true;
      }
      if (userAuthInfo?.email) {
        const adminEmails = ['admin@buscaaquibdc.com.br', 'rodrigogouveiarx@gmail.com', 'developer@buscaaquibdc.com.br'];
        if (adminEmails.includes(userAuthInfo.email.toLowerCase())) {
          console.log('(Ads API) Usuário é admin (email na lista de admins em auth.users via RPC):', userAuthInfo.email);
          return true;
        }
      }
    }
    
    console.log('(Ads API) Usuário NÃO é admin após todas as verificações:', userId);
    return false;
  } catch (error) {
    console.error('(Ads API) Erro crítico ao verificar se usuário é admin:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('(Ads API) Processando requisição GET para anúncios com parâmetros:', {
      status, category, search, limit, offset
    });
    
    const supabase = getSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let isUserAdmin = false;
    
    if (sessionError || !session) {
      console.log('(Ads API) Sem sessão Supabase, verificando autenticação manual...');
      const hasManualAuth = await checkManualAuth(request);
      
      if (hasManualAuth) {
        console.log('(Ads API) Usando autorização manual para a API de anúncios');
        isUserAdmin = true;
      } else {
        console.error('(Ads API) Sem sessão autenticada e sem autenticação manual');
        return NextResponse.json({ 
          success: false, 
          message: 'Não autenticado' 
        }, { status: 401 });
      }
    } else {
      console.log('(Ads API) Sessão encontrada para usuário:', session.user.id);
      isUserAdmin = await isAdmin(session.user.id);
      
      if (!isUserAdmin) {
        console.warn('(Ads API) Acesso negado para usuário:', session.user.id, session.user.email);
        return NextResponse.json({ 
          success: false, 
          message: 'Acesso negado' 
        }, { status: 403 });
      }
      
      console.log('(Ads API) Usuário autenticado como admin via Supabase:', session.user.id);
    }
    
    const admin = getSupabaseAdminClient();
    
    let adsData = [];
    let totalCount = 0;
    
    try {
      // Usar diretamente a tabela 'ads' que é a correta
      let adsQuery = admin
        .from('ads')
        .select('*', { count: 'exact' });
      
      if (status && status !== 'all') {
        // Mapear status para os valores corretos no banco
        if (status === 'pending') {
          // Buscar anúncios pendentes de moderação
          adsQuery = adsQuery.or('moderation_status.eq.pending,status.eq.pending');
        } else if (status === 'approved') {
          // Buscar anúncios aprovados e ativos
          adsQuery = adsQuery.eq('moderation_status', 'approved').eq('status', 'active');
        } else if (status === 'rejected') {
          // Buscar anúncios rejeitados
          adsQuery = adsQuery.eq('moderation_status', 'rejected');
        } else {
          adsQuery = adsQuery.eq('status', status);
        }
      }
      
      if (category && category !== 'all') {
        adsQuery = adsQuery.eq('category', category);
      }
      
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.toLowerCase()}%`;
        adsQuery = adsQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }
      
      const { data: adsTableData, error: adsError, count: adsCount } = await adsQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (!adsError && adsTableData && adsTableData.length > 0) {
          adsData = adsTableData;
          totalCount = adsCount || 0;
          console.log('(Ads API) ✅ Dados encontrados na tabela ads:', adsData.length);
          
          // Log para debug dos status
          const pendingAds = adsData.filter(ad => ad.moderation_status === 'pending' || ad.status === 'pending');
          const approvedAds = adsData.filter(ad => ad.moderation_status === 'approved');
          const rejectedAds = adsData.filter(ad => ad.moderation_status === 'rejected');
          
          console.log(`(Ads API) Status dos anúncios: ${pendingAds.length} pendentes, ${approvedAds.length} aprovados, ${rejectedAds.length} rejeitados`);
        } else {
          console.log('(Ads API) Tabela ads não encontrou dados:', adsError?.message || 'Nenhum dado');
        }
      } catch (error) {
        console.error('(Ads API) Erro ao buscar ads:', error);
    }
    
    console.log('(Ads API) Total de anúncios encontrados:', adsData?.length || 0);
    
    if (!adsData || adsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: totalCount || 0,
        stats: { pending: 0, approved: 0, rejected: 0 },
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      });
    }
    
    const userIds = adsData.map(ad => ad.user_id).filter(Boolean);
    const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
    
    let usersMap: Record<string, any> = {};
    
    if (uniqueUserIds.length > 0) {
      console.log('(Ads API) Buscando dados para', uniqueUserIds.length, 'usuários únicos');
      
      try {
        const { data: users, error: usersError } = await admin
          .from('users')
          .select(`id, name, email, user_type, profile_image_url, phone, whatsapp`)
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            usersMap[user.id] = {
              id: user.id,
              name: user.name,
              email: user.email,
              account_type: user.user_type === 'advertiser' ? 'personal' : user.user_type,
              avatar: user.profile_image_url,
              profile_image: user.profile_image_url,
              phone: user.phone,
              whatsapp: user.whatsapp,
              source: 'users'
            };
          });
          console.log('(Ads API) ✅ Tabela users encontrou', users.length, 'usuários');
        }
      } catch (error) {
        console.error('(Ads API) Erro ao buscar na tabela users:', error);
      }
      
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          console.log('(Ads API) Buscando', missingIds.length, 'usuários faltantes na tabela profiles');
          const { data: profiles, error: profilesError } = await admin
            .from('profiles')
            .select('id, name, email, account_type, avatar_url, phone')
            .in('id', missingIds);
          
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              usersMap[profile.id] = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                account_type: profile.account_type || 'personal',
                avatar: profile.avatar_url,
                profile_image: profile.avatar_url,
                phone: profile.phone,
                source: 'profiles'
              };
            });
            console.log('(Ads API) ✅ Tabela profiles encontrou', profiles.length, 'usuários');
          }
        } catch (error) {
          console.error('(Ads API) Erro ao buscar na tabela profiles:', error);
        }
      }
      
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          console.log('(Ads API) Buscando', stillMissingIds.length, 'empresas em business_profiles (LOGOS)');
          const { data: businessProfiles, error: businessError } = await admin
            .from('business_profiles')
            .select(`user_id, company_name, contact_email, contact_phone, logo_url`)
            .in('user_id', stillMissingIds);
          
          if (!businessError && businessProfiles) {
            businessProfiles.forEach(business => {
              usersMap[business.user_id] = {
                id: business.user_id,
                name: business.company_name,
                email: business.contact_email,
                account_type: 'business',
                avatar: business.logo_url,
                profile_image: business.logo_url,
                phone: business.contact_phone,
                source: 'business_profiles'
              };
            });
            console.log('(Ads API) ✅ Business profiles encontrou', businessProfiles.length, 'empresas com logos');
          }
        } catch (error) {
          console.error('(Ads API) Erro ao buscar business_profiles:', error);
        }
      }
      
      const finalMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (finalMissingIds.length > 0) {
        try {
          console.log('(Ads API) Buscando', finalMissingIds.length, 'empresas na tabela businesses');
          const { data: businesses, error: businessError } = await admin
            .from('businesses')
            .select(`user_id, business_name, email, phone, logo_url`)
            .in('user_id', finalMissingIds);
          
          if (!businessError && businesses) {
            businesses.forEach(business => {
              usersMap[business.user_id] = {
                id: business.user_id,
                name: business.business_name,
                email: business.email,
                account_type: 'business',
                avatar: business.logo_url,
                profile_image: business.logo_url,
                phone: business.phone,
                source: 'businesses'
              };
            });
            console.log('(Ads API) ✅ Tabela businesses encontrou', businesses.length, 'empresas');
          }
        } catch (error) {
          console.error('(Ads API) Erro ao buscar tabela businesses:', error);
        }
      }
      
      console.log('(Ads API) 📊 Total final de usuários mapeados:', Object.keys(usersMap).length, 'de', uniqueUserIds.length);
    }
    
    const formattedData = adsData.map(ad => {
      const user = usersMap[ad.user_id] || {};
      
      const userName = user.name || 'Usuário não encontrado';
      const userEmail = user.email || 'email@nao-encontrado.com';
      const userType = user.account_type || 'personal';
      const userAvatar = user.avatar || user.profile_image;
      
      if (user.name && user.email && !userName.includes('não encontrado')) {
        console.log('(Ads API) ✅ Usuário encontrado para anúncio', ad.id + ':', {
          userName,
          userEmail,
          userType,
          avatar: userAvatar ? 'Sim' : 'Não',
          source: user.source
        });
      } else {
        console.log('(Ads API) ⚠️ Usuário não encontrado para anúncio:', ad.id, 'user_id:', ad.user_id);
      }
      
      // Garantir que o status de moderação seja consistente
      let displayStatus = ad.status;
      let moderationStatus = ad.moderation_status || 'pending';
      
      // Se não tiver moderation_status mas status for 'pending', definir como pendente
      if (!ad.moderation_status && ad.status === 'pending') {
        moderationStatus = 'pending';
      }
      
      // Se foi aprovado mas ainda está como pending no status, corrigir
      if (moderationStatus === 'approved' && ad.status === 'pending') {
        displayStatus = 'active';
      }
      
      return {
        ...ad,
        status: displayStatus,
        moderation_status: moderationStatus,
        moderationStatus: moderationStatus, // Campo duplicado para compatibilidade
        moderationReason: ad.rejection_reason,
        profiles: user.name ? {
          id: ad.user_id,
          name: userName,
          email: userEmail,
          account_type: userType,
          avatar_url: userAvatar,
          phone: user.phone
        } : null,
        user: {
          id: ad.user_id,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
          type: userType
        }
      };
    });
    
    // Calcular estatísticas baseadas no moderation_status
    const pendingCount = formattedData.filter(ad => ad.moderation_status === 'pending').length;
    const approvedCount = formattedData.filter(ad => ad.moderation_status === 'approved').length;
    const rejectedCount = formattedData.filter(ad => ad.moderation_status === 'rejected').length;
    
    console.log('(Ads API) 📤 Retornando', formattedData.length, 'anúncios formatados com dados de usuários');
    console.log(`(Ads API) 📊 Estatísticas: ${pendingCount} pendentes, ${approvedCount} aprovados, ${rejectedCount} rejeitados`);
    
    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      total: totalCount,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('(Ads API) Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 