import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '../../../lib/jwt';
import { requireUserAuth } from '../../../lib/secureSupabase';
import { logger } from '../../../lib/secureLogger';

/**
 * API para verificar se o usuário está autenticado
 * Usa JWT seguro sem fallbacks inseguros
 */
export async function GET(req: NextRequest) {
  try {
    // Validar autenticação usando JWT
    const validation = validateAuth(req);

    if (!validation.isValid) {
      logger.authAttempt('unknown', false, validation.error);
      return NextResponse.json(
        {
          authenticated: false,
          message: validation.error || 'Token inválido'
        },
        { status: 401 }
      );
    }

    // Buscar dados completos do usuário autenticado
    const { user, supabase } = requireUserAuth(req);

    // Buscar dados do perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.userId)
      .maybeSingle();

    // Buscar dados de assinatura
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Retornar informações do usuário autenticado
    const userResponse = {
      id: user.userId,
      email: user.email,
      name: profileData?.name || user.name || user.email.split('@')[0],
      account_type: profileData?.account_type || 'personal',
      subscription: subscriptionData?.plan || 'free',
      subscriptionStartDate: subscriptionData?.start_date || new Date().toISOString(),
      subscriptionEndDate: subscriptionData?.end_date || null
    };

    logger.authAttempt(user.email, true, 'Token validation successful');

    return NextResponse.json({
      authenticated: true,
      user: userResponse
    });

  } catch (error: any) {
    logger.error('Erro ao verificar autenticação:', { error: error.message });

    return NextResponse.json(
      {
        authenticated: false,
        message: 'Erro interno no servidor'
      },
      { status: 500 }
    );
  }
}

/**
 * Versão POST - também usa apenas JWT seguro
 */
export async function POST(req: NextRequest) {
  try {
    // Validar autenticação usando JWT
    const validation = validateAuth(req);

    if (!validation.isValid) {
      logger.authAttempt('unknown', false, validation.error);
      return NextResponse.json(
        {
          authenticated: false,
          error: validation.error || 'Token inválido'
        },
        { status: 401 }
      );
    }

    // Buscar dados completos do usuário autenticado
    const { user, supabase } = requireUserAuth(req);

    // Buscar dados do perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.userId)
      .maybeSingle();

    // Buscar dados de assinatura
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Montar objeto de resposta
    const userResponse = {
      id: user.userId,
      email: user.email,
      name: profileData?.name || user.name || user.email.split('@')[0],
      account_type: profileData?.account_type || 'personal',
      subscription: subscriptionData?.plan || 'free',
      subscriptionStartDate: subscriptionData?.start_date || new Date().toISOString(),
      subscriptionEndDate: subscriptionData?.end_date || null
    };

    logger.authAttempt(user.email, true, 'POST token validation successful');

    return NextResponse.json({
      authenticated: true,
      user: userResponse
    });

  } catch (error: any) {
    logger.error('Erro na verificação de autenticação (POST):', { error: error.message });

    return NextResponse.json({
      authenticated: false,
      error: 'Erro de servidor ao verificar autenticação'
    }, { status: 500 });
  }
}