import { NextRequest } from 'next/server';
import { getSupabaseAdminClient } from './supabase';
import { logger } from './logger';

/**
 * Lista de emails administrativos autorizados
 */
export const ADMIN_EMAILS = [
  'admin@bdcclassificados.com.br',
  'delasdesouza@gmail.com'
];

/**
 * Email administrativo principal
 */
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

/**
 * Verifica se um email é de desenvolvedor/admin
 */
export function isDeveloperEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

/**
 * Valida se o token de acesso pertence a um usuário admin
 */
export async function validateAdminAuth(request: NextRequest): Promise<{
  isValid: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Obter token do cookie ou header
    const token = request.cookies.get('sb-access-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return {
        isValid: false,
        error: 'Token de acesso não encontrado'
      };
    }

    const supabase = getSupabaseAdminClient();
    
    // Verificar token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.warn('[AdminAuth] Token inválido:', authError?.message);
      return {
        isValid: false,
        error: 'Token inválido ou expirado'
      };
    }

    const userEmail = user.email;
    if (!userEmail) {
      return {
        isValid: false,
        error: 'Usuário sem email'
      };
    }

    // Verificar se é admin via função do banco
    const { data: adminData, error: adminError } = await supabase
      .rpc('get_admin_by_email', { email_param: userEmail });

    if (adminError) {
      logger.error('[AdminAuth] Erro ao verificar admin:', adminError);
      return {
        isValid: false,
        error: 'Erro ao verificar permissões'
      };
    }

    if (!adminData || adminData.length === 0) {
      logger.warn('[AdminAuth] Usuário não é admin:', userEmail);
      return {
        isValid: false,
        error: 'Usuário não possui permissões administrativas'
      };
    }

    const admin = adminData[0];
    return {
      isValid: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        is_admin: admin.is_admin
      }
    };

  } catch (error) {
    logger.error('[AdminAuth] Erro na validação:', error);
    return {
      isValid: false,
      error: 'Erro interno na validação'
    };
  }
}

/**
 * Middleware helper para APIs admin
 */
export async function requireAdminAuth(request: NextRequest): Promise<{
  authorized: boolean;
  user?: AdminUser;
  response?: Response;
}> {
  const validation = await validateAdminAuth(request);
  
  if (!validation.isValid) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: validation.error || 'Não autorizado',
          code: 'ADMIN_AUTH_REQUIRED'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    };
  }

  return {
    authorized: true,
    user: validation.user
  };
}

/**
 * Alias para validateAdminAuth para compatibilidade
 */
export const adminAuth = validateAdminAuth; 