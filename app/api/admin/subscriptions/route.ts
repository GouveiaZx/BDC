import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}

// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

// Lista de emails autorizados como administradores
const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'gouveiarx@gmail.com',
  'gouveiarx@hotmail.com'
];

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Listar assinaturas (versão ultra-simplificada)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    // Extrair parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    // Buscar assinaturas primeiro (sem JOIN para ser mais flexível)
    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Aplicar paginação e ordenação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: subscriptions, error: subsError, count } = await query;
    
    if (subsError) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar assinaturas: ' + subsError.message
      }, { status: 500 });
    }
    // Se não há assinaturas, retornar resposta vazia
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: count || 0,
          offset,
          limit
        },
        stats: await getBasicStats()
      });
    }
    
    // Buscar dados dos usuários de forma robusta usando múltiplas estratégias
    const userIds = subscriptions.map(sub => sub.user_id).filter(Boolean);
    const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
    
    let usersMap: Record<string, any> = {};
    
    if (uniqueUserIds.length > 0) {
      // Estratégia 1: Buscar na tabela principal 'users' (do schema)
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
        .select(`
            id, 
            name, 
            email, 
            user_type,
            profile_image_url,
            phone,
            whatsapp
          `)
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
              phone: user.phone
            };
          });
        }
      } catch (error) {
      }
      
      // Estratégia 2: Para usuários não encontrados, buscar na tabela profiles
      const missingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (missingIds.length > 0) {
        try {
          const { data: profiles, error: profilesError } = await supabase
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
                phone: profile.phone
              };
            });
          }
        } catch (error) {
        }
      }
      
      // Estratégia 3: Para usuários ainda não encontrados, buscar empresas em business_profiles
      const stillMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (stillMissingIds.length > 0) {
        try {
          const { data: businessProfiles, error: businessError } = await supabase
            .from('business_profiles')
            .select(`
              user_id,
              company_name,
              contact_email,
              contact_phone,
              logo_url,
              banner_url
            `)
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
                phone: business.contact_phone
              };
            });
          }
        } catch (error) {
        }
      }
      
      // Estratégia 4: Para usuários ainda não encontrados, buscar na tabela businesses (alternativa)
      const finalMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (finalMissingIds.length > 0) {
        try {
          const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select(`
              user_id,
              business_name,
              email,
              phone,
              logo_url
            `)
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
                phone: business.phone
              };
            });
          }
        } catch (error) {
        }
      }
      
      // Estratégia 5: Para usuários ainda não encontrados, buscar dados do auth.users
      const authMissingIds = uniqueUserIds.filter(id => !usersMap[id]);
      if (authMissingIds.length > 0) {
        try {
          // Buscar usuários do sistema de autenticação
          for (const userId of authMissingIds.slice(0, 5)) { // Limitar para não sobrecarregar
            try {
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
              
              if (!authError && authUser?.user) {
                const user = authUser.user;
                usersMap[userId] = {
                  id: userId,
                  name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
                  email: user.email || 'email@nao-encontrado.com',
                  account_type: user.user_metadata?.account_type || 'personal',
                  avatar: user.user_metadata?.avatar || null,
                  profile_image: user.user_metadata?.profile_image || null
                };
              }
            } catch (singleUserError) {
            }
          }
          
          const authFoundCount = authMissingIds.filter(id => usersMap[id]).length;
          if (authFoundCount > 0) {
          }
        } catch (error) {
        }
      }

    }
    
    // Buscar dados dos planos de forma segura
    const planIds = subscriptions.map(sub => sub.plan_id).filter(Boolean);
    const uniquePlanIds = planIds.filter((id, index) => planIds.indexOf(id) === index);
    
    let plansMap: Record<string, any> = {};
    
    if (uniquePlanIds.length > 0) {
      try {
        const { data: plans, error: plansError } = await supabase
          .from('plans')
          .select('id, name, slug, price_monthly, price_yearly')
          .in('id', uniquePlanIds);
        
        if (!plansError && plans) {
          plansMap = plans.reduce((acc, plan) => {
            acc[plan.id] = plan;
            return acc;
          }, {} as Record<string, any>);
        }
      } catch (error) {
      }
    }
    
    // Formatar dados para o frontend usando dados do usersMap
    const formattedData = subscriptions.map(sub => {
      const plan = plansMap[sub.plan_id] || {};
      const user = usersMap[sub.user_id] || {};
      
      // Usar dados reais do usuário encontrado
      const userName = user.name || 'Usuário não encontrado';
      const userEmail = user.email || 'email@nao-encontrado.com';
      const userType = user.account_type || 'personal';
      
      // Log dos dados do usuário encontrado
      if (user.name && user.email && !userName.includes('não encontrado')) {
    } else {
      }
      
      return {
        id: sub.id,
        planType: plan.slug || 'unknown',
        planName: plan.name || 'Plano Desconhecido',
        status: sub.status || 'unknown',
        startDate: sub.starts_at,
        endDate: sub.ends_at,
        renewalDate: sub.ends_at,
        price: parseFloat(plan.price_monthly || '0'),
        paymentMethod: sub.payment_method || 'Cartão de Crédito',
        paymentId: sub.stripe_subscription_id,
        isTrialPeriod: sub.is_trial || false,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        subscriber: {
          id: sub.user_id,
          name: userName,
          email: userEmail,
          avatar: user.avatar || user.profile_image || null,
          type: userType
        }
      };
    });
    
    // Buscar estatísticas básicas
    const stats = await getBasicStats();
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        total: count || 0,
        offset,
        limit
      },
      stats
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Função para obter estatísticas básicas de forma segura
 */
async function getBasicStats() {
  try {
    // Buscar assinaturas para estatísticas básicas
    const { data: statsSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        user_id,
        plan_id
      `);
    
    if (error) {
      return getDefaultStats();
    }
    
    const allSubscriptions = statsSubscriptions || [];
    
    // Buscar dados dos planos para calcular receita
    const planIds = allSubscriptions.map(sub => sub.plan_id).filter(Boolean);
    const uniquePlanIds = planIds.filter((id, index) => planIds.indexOf(id) === index);
    
    let plansData: Record<string, any> = {};
    
    if (uniquePlanIds.length > 0) {
      try {
        const { data: plans, error: plansError } = await supabase
          .from('plans')
          .select('id, price_monthly')
          .in('id', uniquePlanIds);
        
        if (!plansError && plans) {
          plansData = plans.reduce((acc, plan) => {
            acc[plan.id] = plan;
            return acc;
          }, {} as Record<string, any>);
        }
      } catch (error) {
      }
    }
    
    // Contar assinaturas pagas vs gratuitas
    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active');
    const paidActiveSubscriptions = activeSubscriptions.filter(sub => {
      const plan = plansData[sub.plan_id];
      return plan && parseFloat(plan.price_monthly || '0') > 0;
    });
    
    const freeActiveSubscriptions = activeSubscriptions.filter(sub => {
      const plan = plansData[sub.plan_id];
      return !plan || parseFloat(plan.price_monthly || '0') === 0;
    });
    
    // Contar todas as assinaturas pagas (independente do status)
    const allPaidSubscriptions = allSubscriptions.filter(sub => {
      const plan = plansData[sub.plan_id];
      return plan && parseFloat(plan.price_monthly || '0') > 0;
    });
    
    // Calcular estatísticas
    const stats = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(s => s.status === 'active').length,
      pending: allSubscriptions.filter(s => s.status === 'pending').length,
      cancelled: allSubscriptions.filter(s => s.status === 'cancelled').length,
      expired: allSubscriptions.filter(s => s.status === 'expired').length,
      paid: allPaidSubscriptions.length, // Total de assinaturas pagas (todos status)
      free: allSubscriptions.length - allPaidSubscriptions.length, // Assinaturas gratuitas
      revenue: { monthly: 0 }
    };
    
    // Calcular receita apenas de assinaturas ativas e pagas
    stats.revenue.monthly = paidActiveSubscriptions.reduce((total, sub) => {
      const plan = plansData[sub.plan_id];
      const price = parseFloat(plan?.price_monthly || '0');
      return total + price;
    }, 0);
    return stats;
  } catch (error) {
    return getDefaultStats();
  }
}

/**
 * Retorna estatísticas padrão em caso de erro
 */
function getDefaultStats() {
  return {
    total: 0,
    active: 0,
    pending: 0,
    cancelled: 0,
    expired: 0,
    paid: 0,
    free: 0,
    revenue: { monthly: 0 }
  };
}

/**
 * PUT - Atualizar assinatura
 */
export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, plan_id, status, ...otherData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID da assinatura é obrigatório'
      }, { status: 400 });
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...otherData
    };
    
    // Se plan_id foi fornecido, atualizar o plano
    if (plan_id) {
      // Buscar o novo plano para validar se existe
      const { data: newPlan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();
      
      if (planError || !newPlan) {
        return NextResponse.json({
          success: false,
          message: 'Plano não encontrado'
        }, { status: 400 });
      }
      
      updateData.plan_id = plan_id;
      // Não atualizar o preço por enquanto devido a problemas de cache
    }
    
    if (status) {
      updateData.status = status;
    }
    // Atualizar assinatura
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar assinatura: ${error.message}`);
    }
    return NextResponse.json({
      success: true,
      message: 'Assinatura atualizada com sucesso',
      data
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * DELETE - Excluir assinatura
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID da assinatura é obrigatório'
      }, { status: 400 });
    }
    
    // Excluir assinatura
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao excluir assinatura: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Assinatura excluída com sucesso'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 