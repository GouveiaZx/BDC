import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';
import { supabaseAdmin, getSupabaseClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Verificar se estamos em modo simplificado
    const body = await req.json();
    // Extrair userId do corpo (caso estejamos em modo simplificado)
    const simplifiedUserId = body.userId;
    let isSimplifiedMode = !!simplifiedUserId;
    
    // Obter token de acesso dos cookies ou do cabeçalho Authorization
    let accessToken: string | undefined;
    let userId: string | undefined;
    
    // 1. Verificar cookies
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('sb-access-token')?.value;
    if (cookieToken) {
      
      accessToken = cookieToken;
    }
    
    // 2. Se não encontrar nos cookies, verificar o cabeçalho Authorization
    if (!accessToken) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        
      }
    }
    
    // 3. Verificar o corpo da requisição como última opção para token
    if (!accessToken && body.token) {
      accessToken = body.token;
      
    }
    
    // Se temos token, obter informações do usuário a partir dele
    if (accessToken) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (error || !user) {
        // Se temos modo simplificado, continuamos mesmo sem token válido
        if (!isSimplifiedMode) {
          return NextResponse.json(
            { success: false, message: 'Falha ao identificar usuário' },
            { status: 401 }
          );
        }
      } else {
        userId = user.id;
      }
    }
    
    // Se não temos userId de token, usar o userId simplificado
    if (!userId && isSimplifiedMode) {
      userId = simplifiedUserId;
    }
    
    // Verificar se temos um userId válido por algum método
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não identificado' },
        { status: 401 }
      );
    }
    // Verificar se o usuário já tem uma assinatura no banco de dados
    // Apenas se não estiver em modo simplificado
    let existingSubscription;
    
    if (!isSimplifiedMode) {
      const { data: subData, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (subError && subError.code !== 'PGRST116') {
      } else if (subData) {
        existingSubscription = subData;
      } else {
      }
    }
    
    // Data de término (30 dias a partir de hoje)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Atualizar assinatura apenas se não estiver em modo simplificado
    if (!isSimplifiedMode) {
      if (existingSubscription) {
        // Atualizar assinatura existente para o plano gratuito
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_id: SubscriptionPlan.FREE,
            plan_name: 'Gratuito',
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
        
        if (updateError) {
          // Continuamos mesmo com erro
        } else {
        }
      } else {
        // Criar uma nova assinatura para o plano gratuito
        const { error: insertError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: SubscriptionPlan.FREE,
            plan_name: 'Gratuito',
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          // Continuamos mesmo com erro
        } else {
        }
      }
      
      // Atualizar o perfil do usuário com o plano gratuito
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription: SubscriptionPlan.FREE,
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (profileError) {
        // Continuamos mesmo com erro no perfil
      } else {
      }
    }
    
    // Definir cookie de assinatura
    const response = NextResponse.json({ 
      success: true,
      message: 'Plano gratuito ativado com sucesso',
      plan: SubscriptionPlan.FREE,
      userId: userId,
      endDate: endDate.toISOString(),
      simplified: isSimplifiedMode
    });
    
    // Configurar cookies para manter o usuário logado
    response.cookies.set('user_subscription', SubscriptionPlan.FREE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      httpOnly: false, // Permitir acesso via JavaScript
      sameSite: 'lax',
    });
    
    response.cookies.set('user_logged_in', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      httpOnly: false, // Permitir acesso via JavaScript
      sameSite: 'lax',
    });
    
    // Reenviar o token para garantir que esteja disponível
    if (accessToken) {
      response.cookies.set('sb-access-token', accessToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        httpOnly: false, // Permitir acesso via JavaScript
        sameSite: 'lax',
      });
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Falha ao ativar plano gratuito' },
      { status: 500 }
    );
  }
} 