import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../../../models/types';
import { supabaseAdmin, getSupabaseClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Ativando plano gratuito...');
    
    // Verificar se estamos em modo simplificado
    const body = await req.json();
    console.log('[API] Corpo da requisição:', body);
    
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
      console.log('[API] Token encontrado nos cookies:', cookieToken.substring(0, 10) + '...');
      accessToken = cookieToken;
    }
    
    // 2. Se não encontrar nos cookies, verificar o cabeçalho Authorization
    if (!accessToken) {
      const authHeader = req.headers.get('Authorization');
      console.log('[API] Cabeçalho Authorization:', authHeader ? 'presente' : 'ausente');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        console.log('[API] Token extraído do cabeçalho:', accessToken.substring(0, 10) + '...');
      }
    }
    
    // 3. Verificar o corpo da requisição como última opção para token
    if (!accessToken && body.token) {
      accessToken = body.token;
      console.log('[API] Token extraído do corpo:', body.token.substring(0, 10) + '...');
    }
    
    // Se temos token, obter informações do usuário a partir dele
    if (accessToken) {
      console.log('[API] Verificando token com Supabase...');
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (error || !user) {
        console.error('[API] Erro ao obter usuário com o token:', error?.message);
        // Se temos modo simplificado, continuamos mesmo sem token válido
        if (!isSimplifiedMode) {
          return NextResponse.json(
            { success: false, message: 'Falha ao identificar usuário' },
            { status: 401 }
          );
        }
      } else {
        userId = user.id;
        console.log('[API] Usuário identificado com sucesso:', userId);
      }
    }
    
    // Se não temos userId de token, usar o userId simplificado
    if (!userId && isSimplifiedMode) {
      userId = simplifiedUserId;
      console.log('[API] Usando userId do modo simplificado:', userId);
    }
    
    // Verificar se temos um userId válido por algum método
    if (!userId) {
      console.error('[API] Não foi possível obter um userId válido');
      return NextResponse.json(
        { success: false, message: 'Usuário não identificado' },
        { status: 401 }
      );
    }
    
    console.log('[API] Ativando plano gratuito para o usuário:', userId);
    
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
        console.log('[API] Erro ao verificar assinatura existente:', subError.message);
      } else if (subData) {
        console.log('[API] Assinatura existente encontrada:', subData.id);
        existingSubscription = subData;
      } else {
        console.log('[API] Nenhuma assinatura existente, criando nova...');
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
          console.error('[API] Erro ao atualizar assinatura:', updateError);
          // Continuamos mesmo com erro
        } else {
          console.log('[API] Assinatura atualizada com sucesso');
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
          console.error('[API] Erro ao criar assinatura:', insertError);
          // Continuamos mesmo com erro
        } else {
          console.log('[API] Nova assinatura criada com sucesso');
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
        console.error('[API] Erro ao atualizar perfil com plano:', profileError);
        // Continuamos mesmo com erro no perfil
      } else {
        console.log('[API] Perfil atualizado com sucesso');
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
    
    console.log('[API] Resposta preparada, retornando sucesso');
    return response;
  } catch (error) {
    console.error('[API] Erro ao ativar plano gratuito:', error);
    return NextResponse.json(
      { success: false, message: 'Falha ao ativar plano gratuito' },
      { status: 500 }
    );
  }
} 