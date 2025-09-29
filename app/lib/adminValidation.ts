import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from './jwt';

/**
 * Middleware para validar autenticação admin
 */
export function validateAdminAuth(request: NextRequest): {
  isValid: boolean;
  user?: any;
  error?: string;
  response?: NextResponse;
} {
  try {
    // Validar JWT
    const validation = validateAuth(request);

    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error,
        response: NextResponse.json(
          { success: false, error: 'Token de autenticação inválido' },
          { status: 401 }
        )
      };
    }

    // Verificar se é admin
    if (!validation.user?.isAdmin || validation.user.userType !== 'admin') {
      return {
        isValid: false,
        error: 'Usuário não possui privilégios administrativos',
        response: NextResponse.json(
          { success: false, error: 'Acesso negado. Privilégios administrativos necessários.' },
          { status: 403 }
        )
      };
    }

    return {
      isValid: true,
      user: validation.user
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Erro interno na validação',
      response: NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    };
  }
}

/**
 * Lista de emails autorizados para acesso administrativo
 */
export const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'rodrigogouveiarx@gmail.com',
  'developer@buscaaquibdc.com.br'
];

/**
 * Verificar se email está na lista de admins
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}