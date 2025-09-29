import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { validateAuth, validateAdminAuth } from './jwt';

/**
 * Criar cliente Supabase seguro com service role
 * APENAS para casos onde service role é realmente necessário
 */
export function createSecureSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuração Supabase incompleta - verifique variáveis de ambiente');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Criar cliente Supabase normal (anon key)
 * Para operações que não precisam de privilégios elevados
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuração Supabase incompleta - verifique variáveis de ambiente');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Middleware para APIs que requerem autenticação de usuário
 */
export function requireUserAuth(request: NextRequest) {
  const validation = validateAuth(request);

  if (!validation.isValid) {
    throw new Error('Usuário não autenticado');
  }

  return {
    user: validation.user!,
    supabase: createSecureSupabaseClient() // Service role para operações do usuário
  };
}

/**
 * Middleware para APIs que requerem autenticação de admin
 */
export function requireAdminAuth(request: NextRequest) {
  const validation = validateAdminAuth(request);

  if (!validation.isValid) {
    throw new Error('Acesso negado - privilégios administrativos necessários');
  }

  return {
    admin: validation.user!,
    supabase: createSecureSupabaseClient()
  };
}

// Helper para logs seguros
export function secureLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
}