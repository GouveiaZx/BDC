import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';
import { ADMIN_EMAILS } from '../../../lib/adminAuth';

// Usar renderização dinâmica para evitar cache
export const dynamic = 'force-dynamic';

/**
 * API para renovar sessão de autenticação
 * Esta API tenta renovar a sessão atual usando o refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Tentar renovar sessão do Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('[refresh-session] Erro ao renovar sessão Supabase:', error?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao renovar sessão', 
        error: error?.message 
      }, { status: 401 });
    }
    
    console.log('[refresh-session] Sessão Supabase renovada para:', data.user?.email);
    
    // Definir cookies para a sessão Supabase renovada
    const response = NextResponse.json({ 
      success: true, 
      message: 'Sessão renovada com sucesso',
      loginMethod: 'supabase',
      email: data.user?.email
    });
    
    // Definir cookies para autenticação
    response.cookies.set('sb-access-token', data.session.access_token, { 
      path: '/',
      maxAge: data.session.expires_in,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' 
    });
    
    response.cookies.set('sb-refresh-token', data.session.refresh_token, { 
      path: '/',
      maxAge: 2592000, // 30 dias
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' 
    });
    
    return response;
  } catch (error) {
    console.error('[refresh-session] Erro não tratado:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 