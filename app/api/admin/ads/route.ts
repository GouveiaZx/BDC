import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

async function checkManualAuth(request: NextRequest): Promise<boolean> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    if (adminAuthCookie === 'true') {
      
      return true;
    }
    
    if (sbAccessToken) {
      
      return true;
    }
    
    return false;
  } catch (error) {
    
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
      
    } else if (profileData) {
      if (profileData.is_admin === true) {
        
        return true;
      }
      if (profileData.email) {
        const adminEmails = ['admin@buscaaquibdc.com.br', 'rodrigogouveiarx@gmail.com', 'developer@buscaaquibdc.com.br'];
        if (adminEmails.includes(profileData.email.toLowerCase())) {
          
          return true;
        }
      }
    }

    const { data: authData, error: authError } = await supabase.rpc('exec_sql', { 
      sql_query: `SELECT is_admin, email FROM auth.users WHERE id = '${userId}'`
    });
    
    if (authError) {
      
    } else if (authData && authData.length > 0) {
      const userAuthInfo = authData[0];
      if (userAuthInfo?.is_admin === true) {
        
        return true;
      }
      if (userAuthInfo?.email) {
        const adminEmails = ['admin@buscaaquibdc.com.br', 'rodrigogouveiarx@gmail.com', 'developer@buscaaquibdc.com.br'];
        if (adminEmails.includes(userAuthInfo.email.toLowerCase())) {
          
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    
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

    const supabase = getSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let isUserAdmin = false;
    
    if (sessionError || !session) {
      
      const hasManualAuth = await checkManualAuth(request);
      
      if (hasManualAuth) {
        
        isUserAdmin = true;
      } else {
        
        return NextResponse.json({ 
          success: false, 
          message: 'Não autenticado' 
        }, { status: 401 });
      }
    } else {
      
      isUserAdmin = await isAdmin(session.user.id);
      
      if (!isUserAdmin) {
        
        return NextResponse.json({ 
          success: false, 
          message: 'Acesso negado' 
        }, { status: 403 });
      }

    }
    
    const admin = getSupabaseAdminClient();
    
    let adsData = [];
    let totalCount = 0;
    
    try {
      // Usar diretamente a tabela 'ads' com JOIN para buscar as imagens
      let adsQuery = admin
        .from('ads')
        .select(`
          *,
          ad_photos(
            id,
            file_url,
            is_primary,
            sort_order
          )
        `, { count: 'exact' });
      
      if (status && status !== 'all') {
        // Mapear status para os valores corretos no banco
        if (status === 'pending') {
          // Buscar anúncios pendentes de moderação
          adsQuery = adsQuery.or('moderation_status.eq.pending,status.eq.pending,moderation_status.is.null');
        } else if (status === 'approved') {
          // Buscar anúncios aprovados (moderation_status = approved)
          adsQuery = adsQuery.eq('moderation_status', 'approved');
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
          
          // Log para debug dos status
          const pendingAds = adsData.filter(ad => 
            ad.moderation_status === 'pending' || 
            ad.status === 'pending' || 
            !ad.moderation_status
          );
          const approvedAds = adsData.filter(ad => 
            ad.moderation_status === 'approved' && ad.status === 'active'
          );
          const rejectedAds = adsData.filter(ad => ad.moderation_status === 'rejected');

        } else {
          
        }
      } catch (error) {
        
    }

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
          
        }
      } catch (error) {
        
      }
      
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          
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
            
          }
        } catch (error) {
          
        }
      }
      
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          
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
            
          }
        } catch (error) {
          
        }
      }
      
      const finalMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (finalMissingIds.length > 0) {
        try {
          
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
            
          }
        } catch (error) {
          
        }
      }

    }
    
    const formattedData = adsData.map(ad => {
      const user = usersMap[ad.user_id] || {};
      
      const userName = user.name || 'Usuário não encontrado';
      const userEmail = user.email || 'email@nao-encontrado.com';
      const userType = user.account_type || 'personal';
      const userAvatar = user.avatar || user.profile_image;
      
      if (user.name && user.email && !userName.includes('não encontrado')) {
        
      } else {
        
      }
      
      // Garantir que o status de moderação seja consistente
      let displayStatus = ad.status;
      let moderationStatus = ad.moderation_status || 'pending';
      
      // Se não tiver moderation_status mas status for 'pending', definir como pendente
      if (!ad.moderation_status && ad.status === 'pending') {
        moderationStatus = 'pending';
        displayStatus = 'pending';
      }
      
      // Se foi aprovado (moderation_status = 'approved'), garantir que apareça como aprovado
      if (moderationStatus === 'approved') {
        displayStatus = 'approved';
      }
      
      // Se foi rejeitado, garantir que apareça como rejeitado
      if (moderationStatus === 'rejected') {
        displayStatus = 'rejected';
      }

      return {
        ...ad,
        status: displayStatus,
        moderation_status: moderationStatus,
        moderationStatus: moderationStatus, // Campo duplicado para compatibilidade
        moderationReason: ad.rejection_reason,
        images: ad.ad_photos ? ad.ad_photos
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((photo: any) => photo.file_url) : [],
        photos: ad.ad_photos ? ad.ad_photos
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((photo: any) => ({
            id: photo.id,
            url: photo.file_url,
            is_primary: photo.is_primary,
            sort_order: photo.sort_order
          })) : [],
        primary_photo: ad.ad_photos && ad.ad_photos.length > 0 
          ? (ad.ad_photos.find((p: any) => p.is_primary)?.file_url || ad.ad_photos[0]?.file_url)
          : null,
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
    
    // Calcular estatísticas baseadas no displayStatus final
    const pendingCount = formattedData.filter(ad => ad.status === 'pending').length;
    const approvedCount = formattedData.filter(ad => ad.status === 'approved').length;
    const rejectedCount = formattedData.filter(ad => ad.status === 'rejected').length;

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
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}