import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  userType: string;
}

/**
 * Verifica se um token é válido
 */
function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar se o token expirou
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }
    
    // Verificar se tem os campos necessários
    if (!decoded.userId || !decoded.email) {
      return null;
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType || 'advertiser'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Middleware para verificar autenticação
 */
export function authenticateUser(request: NextRequest): AuthenticatedUser | null {
  // Tentar obter token do header Authorization
  const authHeader = request.headers.get('authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Se não encontrou no header, tentar no cookie
  if (!token) {
    token = request.cookies.get('auth_token')?.value;
  }
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * Middleware para verificar se é admin
 */
export function requireAdmin(user: AuthenticatedUser | null): boolean {
  return user?.userType === 'admin';
}

/**
 * Middleware para verificar se é proprietário ou admin
 */
export function requireOwnerOrAdmin(user: AuthenticatedUser | null): boolean {
  return user?.userType === 'admin' || user?.userType === 'owner';
} 