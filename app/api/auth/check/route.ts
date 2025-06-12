import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';
import { convertTempIdToUUID } from '../../../lib/utils';

// Enum de planos de assinatura
enum SubscriptionPlan {
  FREE = 'free',
  MICRO_BUSINESS = 'micro_business',
  SMALL_BUSINESS = 'small_business',
  MEDIUM_BUSINESS = 'medium_business',
  LARGE_BUSINESS = 'large_business'
}

/**
 * API para verificar se o usuário está autenticado
 */
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient();
  try {
    // Verificar token no cookie ou cabeçalho
    const accessToken = 
      req.cookies.get('sb-access-token')?.value || 
      req.headers.get('Authorization')?.replace('Bearer ', '') ||
      '';
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: 'Nenhum token fornecido' 
        }
      );
    }
    
    // Verificar token consultando o usuário atual
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: error?.message || 'Token inválido' 
        }
      );
    }
    
    // Buscar dados do perfil
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Retornar informações do usuário autenticado
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: profileData?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
        account_type: profileData?.account_type || user.user_metadata?.account_type || 'personal'
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        message: error.message || 'Erro interno no servidor' 
      }
    );
  }
}

// Versão POST que aceita o token no corpo da requisição
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient();
  try {
    let token = '';
    let body = {};
    let userId = '';
    
    try {
      body = await req.json();
      if (body && (body as any).token) {
        token = (body as any).token;
        console.log('Usando token do corpo da requisição');
      }
      
      // Verificar ID do usuário no corpo
      if (body && (body as any).userId) {
        userId = (body as any).userId;
        console.log('Usando userId do corpo da requisição');
      }
    } catch (e) {
      console.log('Erro ao processar corpo da requisição:', e);
    }
    
    // Se não encontrou no corpo, verificar outros locais
    if (!token) {
      const authHeader = req.headers.get('authorization');
      const cookieStore = cookies();
      const cookieToken = cookieStore.get('sb-access-token')?.value;
      const queryToken = req.nextUrl.searchParams.get('token');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Usando token do cabeçalho de autorização');
      } else if (cookieToken) {
        token = cookieToken;
        console.log('Usando token do cookie');
      } else if (queryToken) {
        token = queryToken;
        console.log('Usando token da query string');
      }
    }
    
    // Tentar obter userId dos cookies se não encontrado no corpo
    if (!userId) {
      const cookieUserId = req.cookies.get('userId')?.value;
      if (cookieUserId) {
        userId = cookieUserId;
        console.log('Usando userId do cookie:', userId);
      }
    }
    
    // Validar e normalizar userId se não for um UUID válido
    if (userId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(userId)) {
        const oldId = userId;
        userId = convertTempIdToUUID(userId);
        console.log(`ID malformado detectado e convertido: ${oldId} -> ${userId}`);
      }
    }
    
    console.log('Token presente:', !!token);
    console.log('UserId presente:', !!userId);
    
    // Verificar se é um ID temporário para email não confirmado (em qualquer fonte)
    const isTempId = token.startsWith('temp-id-') || (userId && userId.startsWith('temp-id-'));
    
    if (isTempId) {
      console.log('ID temporário detectado para email não confirmado');
      
      // Usar o ID temporário disponível e convertê-lo para UUID válido
      const rawTempId = token.startsWith('temp-id-') ? token : userId;
      const tempId = convertTempIdToUUID(rawTempId);
      
      const userEmail = (body as any).email || req.cookies.get('userEmail')?.value || '';
      const userName = (body as any).name || req.cookies.get('userName')?.value || userEmail?.split('@')[0] || 'Usuário';
      
      // Retornar um usuário simulado
      const userResponse = {
        id: tempId,
        name: userName,
        email: userEmail,
        subscription: SubscriptionPlan.FREE,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: null
      };
      
      return NextResponse.json({ 
        authenticated: true,
        user: userResponse
      });
    }
    
    // Se não houver token nem userId, o usuário não está autenticado
    if (!token && !userId) {
      // Usar userId do localStorage em modo dev como fallback
      if (process.env.NODE_ENV === 'development') {
        const localUserId = req.cookies.get('userId')?.value;
        
        if (localUserId) {
          console.log('Usando userId do localStorage em modo dev:', localUserId);
          const validUUID = convertTempIdToUUID(localUserId);
          const userEmail = req.cookies.get('userEmail')?.value || '';
          const userName = req.cookies.get('userName')?.value || userEmail?.split('@')[0] || 'Usuário';
          
          // Criar resposta simulada
          const userResponse = {
            id: validUUID,
            name: userName,
            email: userEmail,
            subscription: SubscriptionPlan.FREE,
            subscriptionStartDate: new Date().toISOString(),
            subscriptionEndDate: null
          };
          
          return NextResponse.json({ 
            authenticated: true,
            user: userResponse
          });
        }
      }
      
      console.log('Sem token de autenticação e sem userId');
      return NextResponse.json({ authenticated: false, error: 'Token de autenticação ausente' }, { status: 401 });
    }
    
    // Para tokens normais, verificar com o Supabase
    let user = null;
    let error = null;
    
    if (token) {
      try {
        const result = await supabaseAdmin.auth.getUser(token);
        user = result.data?.user;
        error = result.error;
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        error = { message: 'Erro ao verificar token' };
      }
    }
    
    if (error || !user) {
      console.warn('Erro de autenticação ou usuário não encontrado:', error);
      
      // Se temos um userId e não é vazio, usar como fallback
      if (userId) {
        console.log('Usando userId como fallback:', userId);
        
        // Converter para UUID válido se necessário
        const validUUID = convertTempIdToUUID(userId);
        
        const userEmail = (body as any).email || req.cookies.get('userEmail')?.value || '';
        const userName = (body as any).name || req.cookies.get('userName')?.value || userEmail?.split('@')[0] || 'Usuário';
        
        // Criar resposta simulada
        const userResponse = {
          id: validUUID,
          name: userName,
          email: userEmail,
          subscription: SubscriptionPlan.FREE,
          subscriptionStartDate: new Date().toISOString(),
          subscriptionEndDate: null
        };
        
        return NextResponse.json({ 
          authenticated: true,
          user: userResponse
        });
      }
      
      return NextResponse.json({ authenticated: false, error: 'Usuário não autenticado' }, { status: 401 });
    }
    
    console.log('Usuário autenticado com sucesso:', user.id);
    
    // Buscar detalhes adicionais do perfil do usuário
    let profile = null;
    try {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      profile = profileData;
    } catch (profileError) {
      console.warn('Erro ao buscar perfil:', profileError);
    }
      
    // Buscar dados de assinatura
    let subscription = null;
    try {
      const { data: subscriptionData } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
        .maybeSingle();
        
      subscription = subscriptionData;
    } catch (subError) {
      console.warn('Erro ao buscar assinatura:', subError);
    }
      
    // Determinar o plano de assinatura do usuário
    let plan = SubscriptionPlan.FREE;
    let startDate: Date | null = null;
    let endDate: Date | null = null;
      
    if (subscription) {
      plan = subscription.plan;
      startDate = new Date(subscription.start_date);
      endDate = subscription.end_date ? new Date(subscription.end_date) : null;
    }
    
    // Montar objeto de resposta
    const userResponse = {
      id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Usuário',
      email: user.email,
      subscription: plan,
      subscriptionStartDate: startDate?.toISOString() || new Date().toISOString(),
      subscriptionEndDate: endDate?.toISOString() || null
    };
    
    return NextResponse.json({ 
      authenticated: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Erro na verificação de autenticação (POST):', error);
    
    // Mesmo em caso de erro, tentar usar o userId como fallback
    try {
      const userId = req.cookies.get('userId')?.value;
      if (userId) {
        const validUUID = convertTempIdToUUID(userId);
        const userEmail = req.cookies.get('userEmail')?.value || '';
        const userName = req.cookies.get('userName')?.value || userEmail?.split('@')[0] || 'Usuário';
        
        // Criar resposta simulada
        const userResponse = {
          id: validUUID,
          name: userName,
          email: userEmail,
          subscription: SubscriptionPlan.FREE,
          subscriptionStartDate: new Date().toISOString(),
          subscriptionEndDate: null
        };
        
        return NextResponse.json({ 
          authenticated: true,
          user: userResponse
        });
      }
    } catch (fallbackError) {
      console.error('Erro ao usar fallback:', fallbackError);
    }
    
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Erro de servidor ao verificar autenticação' 
    }, { status: 500 });
  }
} 