/**
 * Validação obrigatória de variáveis de ambiente para produção
 * Este arquivo garante que todas as variáveis críticas estão configuradas
 */

interface EnvironmentConfig {
  // Supabase - Obrigatórias
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // JWT - Obrigatório
  JWT_SECRET: string;

  // URLs - Obrigatórias
  NEXT_PUBLIC_BASE_URL: string;

  // Opcionais para funcionalidades específicas
  ASAAS_API_KEY?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

/**
 * Valida todas as variáveis de ambiente obrigatórias
 */
export function validateEnvironmentVariables(): EnvironmentConfig {
  const errors: string[] = [];

  // Variáveis obrigatórias
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  };

  // Verificar variáveis obrigatórias
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`${key} é obrigatório`);
    }
  }

  // Validar formato das URLs
  if (requiredVars.NEXT_PUBLIC_SUPABASE_URL && !requiredVars.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL HTTPS válida');
  }

  if (requiredVars.NEXT_PUBLIC_BASE_URL && !requiredVars.NEXT_PUBLIC_BASE_URL.startsWith('http')) {
    errors.push('NEXT_PUBLIC_BASE_URL deve ser uma URL válida');
  }

  // Validar JWT_SECRET tem comprimento mínimo
  if (requiredVars.JWT_SECRET && requiredVars.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  // Verificar se chaves de produção não estão sendo usadas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    if (requiredVars.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') &&
        !requiredVars.NEXT_PUBLIC_SUPABASE_URL.includes('localhost')) {
      // Ok, supabase pode ser usado em dev
    }
  }

  // Se há erros, falhar
  if (errors.length > 0) {
    throw new Error(
      `❌ Configuração de ambiente inválida:\n${errors.map(err => `  - ${err}`).join('\n')}\n\n` +
      `Configure as variáveis no arquivo .env.local ou nas variáveis de ambiente do sistema.`
    );
  }

  // Retornar configuração validada
  return {
    NEXT_PUBLIC_SUPABASE_URL: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: requiredVars.SUPABASE_SERVICE_ROLE_KEY!,
    JWT_SECRET: requiredVars.JWT_SECRET!,
    NEXT_PUBLIC_BASE_URL: requiredVars.NEXT_PUBLIC_BASE_URL!,

    // Opcionais
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
  };
}

/**
 * Valida configuração específica para pagamentos
 */
export function validatePaymentConfig(): void {
  if (!process.env.ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY é obrigatório para funcionalidades de pagamento');
  }

  if (!process.env.ASAAS_API_KEY.startsWith('$aact_')) {
    throw new Error('ASAAS_API_KEY deve ter formato válido ($aact_...)');
  }
}

/**
 * Valida configuração específica para emails
 */
export function validateEmailConfig(): void {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY é obrigatório para funcionalidades de email');
  }

  if (!process.env.FROM_EMAIL) {
    throw new Error('FROM_EMAIL é obrigatório para funcionalidades de email');
  }

  if (!process.env.FROM_EMAIL.includes('@')) {
    throw new Error('FROM_EMAIL deve ser um email válido');
  }
}

// Executar validação na importação do módulo
let envConfig: EnvironmentConfig;

try {
  envConfig = validateEnvironmentVariables();
} catch (error) {
  // Em produção, falhar imediatamente
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }

  // Em desenvolvimento, continuar sem falhar

  // Configuração padrão para desenvolvimento (apenas para evitar crashes)
  envConfig = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
  };
}

export { envConfig };