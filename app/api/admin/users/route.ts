import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '../../../lib/adminValidation';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET - Listar TODOS os usuários da plataforma com informações reais
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação admin
    const adminValidation = validateAdminAuth(request);
    if (!adminValidation.isValid) {
      return adminValidation.response!;
    }

    // Cliente admin seguro
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    // Buscar TODOS os usuários da tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        user_type,
        phone,
        whatsapp,
        profile_image_url,
        is_active,
        created_at,
        updated_at,
        last_login_at,
        login_count
      `)
      .order('created_at', { ascending: false });
      
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: usersError.message
      }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      const response = NextResponse.json({
        success: true,
        users: [],
        pagination: { total: 0, offset: 0, limit: 0, hasMore: false },
        timestamp: new Date().toISOString()
      });
      
      // Adicionar headers para evitar cache
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }
    // Buscar assinaturas ativas para todos os usuários
    const userIds = users.map(user => user.id);
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        plan_id,
        status,
        starts_at,
        ends_at,
        created_at,
        plans!inner(
          name,
          slug
        )
      `)
      .in('user_id', userIds)
      .eq('status', 'active');
      
    if (subError) {
      
    }
    
    // Buscar perfis de negócio
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select('user_id, business_name, is_active')
      .in('user_id', userIds);
      
    if (businessError) {
      
    }
    
    // Criar mapas para facilitar a busca
    const subscriptionsMap = new Map();
    if (subscriptions) {
      subscriptions.forEach(sub => {
        subscriptionsMap.set(sub.user_id, sub);
      });
    }
    
    const businessMap = new Map();
    if (businessProfiles) {
      businessProfiles.forEach(bp => {
        businessMap.set(bp.user_id, bp);
      });
    }
    
    // Formatar dados completos
    const formattedUsers = users.map(user => {
      const subscription = subscriptionsMap.get(user.id);
      const businessProfile = businessMap.get(user.id);
      
      // Determinar o plano atual
      let planName = 'Gratuito';
      if (subscription && subscription.plans) {
        planName = subscription.plans.name || subscription.plans.slug || 'Gratuito';
      }
      
      return {
        id: user.id,
        name: user.name || 'Usuário sem nome',
        email: user.email || 'Email não informado',
        phone: user.phone,
        whatsapp: user.whatsapp,
        user_type: user.user_type || 'advertiser',
        profile_image_url: user.profile_image_url,
        
        // Status reais
        is_active: user.is_active !== false, // true por padrão
        is_blocked: !user.is_active, // inverso de is_active
        
        // Datas reais
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        login_count: user.login_count || 0,
        
        // Plano atual
        subscription_plan: planName,
        
        // Perfis
        hasProfile: true, // todos têm pelo menos perfil básico
        hasBusinessProfile: !!businessProfile,
        business_name: businessProfile?.business_name || null,
        business_status: businessProfile?.is_active ? 'active' : 'inactive'
      };
    });
    const response = NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        total: formattedUsers.length,
        offset: 0,
        limit: formattedUsers.length,
        hasMore: false
      },
      timestamp: new Date().toISOString()
    });
    
    // Adicionar headers para evitar cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Last-Modified', new Date().toUTCString());
    
    return response;
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno'
    }, { status: 500 });
  }
}

/**
 * PUT - Bloquear/Desbloquear usuário
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isBlocked, action } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }
    
    if (action !== 'block' && action !== 'unblock') {
      return NextResponse.json({
        success: false,
        error: 'Ação inválida. Use "block" ou "unblock"'
      }, { status: 400 });
    }
    
    // Cliente admin
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o usuário existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    // Atualizar status do usuário
    const updates = {
      is_active: !isBlocked, // Se está bloqueando, is_active = false
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar usuário: ' + updateError.message
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Usuário ${isBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso`,
      user: {
        ...existingUser,
        is_active: !isBlocked
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno'
    }, { status: 500 });
  }
}

/**
 * DELETE - Excluir usuário permanentemente
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }
    
    // Cliente admin
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o usuário existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();
    
    if (fetchError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    // EXCLUSÃO CASCATA - A ordem é importante para manter integridade referencial
    
    // 1. Excluir registros de visualizações de anúncios
    const { error: adViewsError } = await supabase
      .from('ad_views_log')
      .delete()
      .eq('user_id', userId);
    if (adViewsError) {
      // Log do erro mas continua o processo
    }

    // 2. Excluir estatísticas de email
    const { error: emailStatsError } = await supabase
      .from('user_email_stats')
      .delete()
      .eq('user_id', userId);
    if (emailStatsError) {
      // Log do erro mas continua o processo
    }

    // 3. Excluir categorias de negócio
    const { error: businessCategoriesError } = await supabase
      .from('business_categories')
      .delete()
      .eq('user_id', userId);
    if (businessCategoriesError) {
      // Log do erro mas continua o processo
    }

    // 4. Excluir avaliações de negócios
    const { error: businessReviewsError } = await supabase
      .from('business_reviews')
      .delete()
      .eq('reviewer_id', userId);
    if (businessReviewsError) {
      // Log do erro mas continua o processo
    }

    // 5. Excluir visualizações de negócios
    const { error: businessViewsError } = await supabase
      .from('business_views')
      .delete()
      .eq('viewer_id', userId);
    if (businessViewsError) {
      // Log do erro mas continua o processo
    }

    // 6. Excluir perfis de negócio
    const { error: businessProfilesError } = await supabase
      .from('business_profiles')
      .delete()
      .eq('user_id', userId);
    if (businessProfilesError) {
      // Log do erro mas continua o processo
    }

    // 7. Excluir relatórios de anúncios
    const { error: adReportsError } = await supabase
      .from('ad_reports')
      .delete()
      .eq('reporter_id', userId);
    if (adReportsError) {
      // Log do erro mas continua o processo
    }

    // 8. Excluir assinaturas do Asaas
    const { error: asaasSubsError } = await supabase
      .from('asaas_subscriptions')
      .delete()
      .eq('user_id', userId);
    if (asaasSubsError) {
      // Log do erro mas continua o processo
    }

    // 9. Excluir highlights/destaques
    const { error: highlightsError } = await supabase
      .from('highlights')
      .delete()
      .eq('user_id', userId);
    if (highlightsError) {
      // Log do erro mas continua o processo
    }

    // 10. Buscar e excluir fotos de anúncios
    const { data: userAds } = await supabase
      .from('ads')
      .select('id')
      .eq('user_id', userId);
    
    if (userAds && userAds.length > 0) {
      const adIds = userAds.map(ad => ad.id);
      const { error: adPhotosError } = await supabase
        .from('ad_photos')
        .delete()
        .in('ad_id', adIds);
      if (adPhotosError) {
        // Log do erro mas continua o processo
      }
    }
    
    // 11. Excluir anúncios
    const { error: adsError } = await supabase
      .from('ads')
      .delete()
      .eq('user_id', userId);
    if (adsError) {
      // Log do erro mas continua o processo
    }

    // 12. Excluir uso de cupons
    const { error: couponUsageError } = await supabase
      .from('coupon_usage')
      .delete()
      .eq('user_id', userId);
    if (couponUsageError) {
      // Log do erro mas continua o processo
    }

    // 13. Excluir cupons criados pelo usuário
    const { error: couponsError } = await supabase
      .from('coupons')
      .delete()
      .eq('created_by', userId);
    if (couponsError) {
      // Log do erro mas continua o processo
    }

    // 14. Excluir relatórios
    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId},resolved_by.eq.${userId}`);
    if (reportsError) {
      // Log do erro mas continua o processo
    }

    // 15. Excluir logs administrativos
    const { error: adminLogsError } = await supabase
      .from('admin_logs')
      .delete()
      .eq('admin_id', userId);
    if (adminLogsError) {
      // Log do erro mas continua o processo
    }

    // 16. Excluir notificações
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notificationsError) {
      // Log do erro mas continua o processo
    }

    // 17. Excluir pagamentos
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId);
    if (paymentsError) {
      // Log do erro mas continua o processo
    }

    // 18. Excluir assinaturas
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    if (subscriptionsError) {
      // Log do erro mas continua o processo
    } 
    // 19. Por fim, excluir o usuário principal
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (deleteUserError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao excluir usuário: ' + deleteUserError.message
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Usuário ${existingUser.email} excluído permanentemente com sucesso`,
      deletedUser: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno'
    }, { status: 500 });
  }
}