import jwt from 'jsonwebtoken';

// Verificar se JWT_SECRET está configurado
const JWT_SECRET = process.env.JWT_SECRET;

// Em produção, JWT_SECRET é obrigatório
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET é obrigatório em produção. Configure a variável de ambiente.');
}

// Em desenvolvimento, usar fallback seguro se necessário
const SECRET = JWT_SECRET || 'dev-only-fallback-secret-change-in-production';

// Interface para dados do token
export interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  userType?: string;
  isAdmin?: boolean;
  iat?: number; // issued at
  exp?: number; // expires
}

// Configurações padrão do token
const DEFAULT_EXPIRES_IN = '7d'; // 7 dias

/**
 * Gerar token JWT seguro
 */
export function generateToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresIn: string = DEFAULT_EXPIRES_IN
): string {
  try {
    return jwt.sign(payload, SECRET as any, {
      expiresIn,
      issuer: 'bdc-classificados',
      audience: 'bdc-users'
    } as any);
  } catch (error) {
    throw new Error('Falha ao gerar token de autenticação');
  }
}

/**
 * Verificar e decodificar token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET as string, {
      issuer: 'bdc-classificados',
      audience: 'bdc-users'
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    // Token inválido, expirado ou erro de verificação
    return null;
  }
}

/**
 * Extrair token das requisições (compatível com sistema atual)
 */
export function extractTokenFromRequest(request: Request): string | null {
  try {
    // Tentar header Authorization primeiro
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Tentar cookies como fallback (compatibilidade)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (cookies.auth_token) {
        return cookies.auth_token;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware para validar autenticação JWT
 */
export function validateAuth(request: Request): {
  isValid: boolean;
  user?: TokenPayload;
  error?: string;
} {
  const token = extractTokenFromRequest(request);

  if (!token) {
    return {
      isValid: false,
      error: 'Token de autenticação não encontrado'
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      isValid: false,
      error: 'Token de autenticação inválido ou expirado'
    };
  }

  return {
    isValid: true,
    user
  };
}

/**
 * Gerar token de refresh (duração maior)
 */
export function generateRefreshToken(userId: string): string {
  return generateToken(
    { userId, email: '', isAdmin: false },
    '30d' // 30 dias para refresh token
  );
}

/**
 * Validar se token está próximo do vencimento
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 60): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const threshold = thresholdMinutes * 60; // converter para segundos

    return (decoded.exp - now) < threshold;
  } catch (error) {
    return true; // Se não conseguir decodificar, considerar que precisa renovar
  }
}

/**
 * Validar autenticação admin específica
 */
export function validateAdminAuth(request: Request): {
  isValid: boolean;
  user?: TokenPayload;
  error?: string;
} {
  const validation = validateAuth(request);

  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error
    };
  }

  // Verificar se é admin
  if (!validation.user?.isAdmin || validation.user.userType !== 'admin') {
    return {
      isValid: false,
      error: 'Privilégios administrativos necessários'
    };
  }

  return {
    isValid: true,
    user: validation.user
  };
}