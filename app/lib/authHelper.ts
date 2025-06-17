import { getSupabaseAdminClient } from './supabase';
import { convertTempIdToUUID } from './utils';

const supabaseAdmin = getSupabaseAdminClient();

export interface AuthResult {
  success: boolean;
  user_id?: string;
  error?: string;
  source?: 'token' | 'cookie' | 'query' | 'fallback';
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  try {
    // Extrair token de diferentes fontes
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token');
    const queryUserId = url.searchParams.get('userId');
    
    // Determinar token e método
    let token = '';
    let source: AuthResult['source'] = 'fallback';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      source = 'token';
      console.log('[AuthHelper] Usando token do cabeçalho Authorization');
    } else if (queryToken) {
      token = queryToken;
      source = 'query';
      console.log('[AuthHelper] Usando token da query string');
    }
    
    // Tentar autenticação com token
    if (token) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (user && !error) {
          console.log('[AuthHelper] ✅ Usuário autenticado via token:', user.id);
          return {
            success: true,
            user_id: user.id,
            source
          };
        } else {
          console.log('[AuthHelper] ❌ Token inválido ou expirado:', error?.message);
        }
      } catch (authError) {
        console.error('[AuthHelper] ❌ Erro ao validar token:', authError);
      }
    }
    
    // Fallback: Usar userId fornecido
    if (queryUserId) {
      console.log('[AuthHelper] Tentando userId alternativo:', queryUserId);
      
      // Normalizar userId se necessário
      let normalizedUserId = queryUserId;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidPattern.test(queryUserId)) {
        if (queryUserId.match(/^196d18[0-9a-f]{3,5}-/)) {
          normalizedUserId = convertTempIdToUUID(queryUserId);
          console.log('[AuthHelper] ID convertido:', queryUserId, '->', normalizedUserId);
        }
      }
      
      // Verificar se o usuário existe no banco
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('id', normalizedUserId)
        .single();
        
      if (user && !error) {
        console.log('[AuthHelper] ✅ Usuário encontrado no banco:', user.id);
        return {
          success: true,
          user_id: user.id,
          source: 'fallback'
        };
      } else {
        console.log('[AuthHelper] ❌ Usuário não encontrado no banco:', error?.message);
      }
    }
    
    console.log('[AuthHelper] ❌ Falha na autenticação - nem token nem userId válidos');
    return {
      success: false,
      error: 'Token de autenticação ausente ou inválido'
    };
    
  } catch (error) {
    console.error('[AuthHelper] ❌ Erro crítico na autenticação:', error);
    return {
      success: false,
      error: 'Erro interno na autenticação'
    };
  }
}

export async function getUserInfo(userId: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('[AuthHelper] Erro ao buscar dados do usuário:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[AuthHelper] Erro crítico ao buscar usuário:', error);
    return null;
  }
}

export function logAuthAttempt(req: Request, result: AuthResult) {
  const url = new URL(req.url);
  console.log('[AuthHelper] === LOG DE AUTENTICAÇÃO ===');
  console.log('URL:', url.pathname);
  console.log('Método:', req.method);
  console.log('Sucesso:', result.success);
  console.log('Fonte:', result.source);
  console.log('User ID:', result.user_id);
  console.log('Erro:', result.error);
  console.log('===========================================');
} 