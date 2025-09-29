/**
 * Validação global de variáveis de ambiente para produção
 * Centraliza todas as validações obrigatórias do sistema
 */

interface EnvironmentConfig {
  // Supabase (obrigatórias)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // JWT (obrigatória)
  JWT_SECRET: string;

  // Asaas (opcional em desenvolvimento)
  ASAAS_API_KEY?: string;
  ASAAS_WEBHOOK_SECRET?: string;

  // Email (opcional)
  RESEND_API_KEY?: string;

  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvironmentConfig>;
}

/**
 * Lista de variáveis obrigatórias por ambiente
 */
const REQUIRED_VARS = {
  development: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'ASAAS_API_KEY',
    'ASAAS_WEBHOOK_SECRET'
  ],
  test: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
};

/**
 * Lista de variáveis opcionais mas recomendadas
 */
const RECOMMENDED_VARS = {
  development: ['ASAAS_API_KEY'],
  production: ['RESEND_API_KEY'],
  test: []
};

/**
 * Valida se uma URL do Supabase é válida
 */
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('supabase.co') || parsed.hostname.includes('localhost');
  } catch {
    return false;
  }
}

/**
 * Valida se uma chave API tem formato válido
 */
function isValidApiKey(key: string, minLength: number = 20): boolean {
  return typeof key === 'string' && key.length >= minLength;
}

/**
 * Validação global de variáveis de ambiente
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvironmentConfig> = {};

  // Determinar ambiente
  const nodeEnv = (process.env.NODE_ENV || 'development') as keyof typeof REQUIRED_VARS;
  config.NODE_ENV = nodeEnv;

  // Verificar variáveis obrigatórias
  const requiredVars = REQUIRED_VARS[nodeEnv] || REQUIRED_VARS.development;

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      errors.push(`❌ Variável obrigatória não configurada: ${varName}`);
      continue;
    }

    // Validações específicas
    switch (varName) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        if (!isValidSupabaseUrl(value)) {
          errors.push(`❌ URL do Supabase inválida: ${varName}`);
        } else {
          config.NEXT_PUBLIC_SUPABASE_URL = value;
        }
        break;

      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        if (!isValidApiKey(value, 100)) {
          errors.push(`❌ Chave anônima do Supabase inválida: ${varName}`);
        } else {
          config.NEXT_PUBLIC_SUPABASE_ANON_KEY = value;
        }
        break;

      case 'SUPABASE_SERVICE_ROLE_KEY':
        if (!isValidApiKey(value, 100)) {
          errors.push(`❌ Chave de serviço do Supabase inválida: ${varName}`);
        } else {
          config.SUPABASE_SERVICE_ROLE_KEY = value;
        }
        break;

      case 'JWT_SECRET':
        if (value.length < 32) {
          errors.push(`❌ JWT_SECRET muito curto (mínimo 32 caracteres): ${varName}`);
        } else {
          config.JWT_SECRET = value;
        }
        break;

      case 'ASAAS_API_KEY':
        if (!isValidApiKey(value, 10)) {
          errors.push(`❌ Chave da API do Asaas inválida: ${varName}`);
        } else {
          config.ASAAS_API_KEY = value;
        }
        break;

      case 'ASAAS_WEBHOOK_SECRET':
        if (value.length < 16) {
          errors.push(`❌ ASAAS_WEBHOOK_SECRET muito curto (mínimo 16 caracteres): ${varName}`);
        } else {
          config.ASAAS_WEBHOOK_SECRET = value;
        }
        break;

      default:
        // Para outras variáveis, apenas verificar se não está vazia
        (config as any)[varName] = value;
    }
  }

  // Verificar variáveis recomendadas
  const recommendedVars = RECOMMENDED_VARS[nodeEnv] || [];

  for (const varName of recommendedVars) {
    const value = process.env[varName];

    if (!value) {
      warnings.push(`⚠️  Variável recomendada não configurada: ${varName}`);
    } else {
      (config as any)[varName] = value;
    }
  }

  // Verificar variáveis opcionais
  if (process.env.RESEND_API_KEY) {
    if (isValidApiKey(process.env.RESEND_API_KEY, 10)) {
      config.RESEND_API_KEY = process.env.RESEND_API_KEY;
    } else {
      warnings.push(`⚠️  RESEND_API_KEY configurada mas inválida`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Valida ambiente e lança erro se houver problemas críticos
 */
export function requireValidEnvironment(): EnvironmentConfig {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    const errorMessage = [
      '🚫 ERRO: Configuração de ambiente inválida!',
      '',
      ...validation.errors,
      '',
      'Configure as variáveis no arquivo .env.local ou no ambiente de produção.',
      'Exemplo: https://docs.supabase.com/guides/getting-started/local-development'
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Mostrar warnings se houver
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Avisos de configuração:\n' + validation.warnings.join('\n'));
  }

  return validation.config as EnvironmentConfig;
}

/**
 * Função utilitária para verificar se uma feature está disponível
 */
export function isFeatureAvailable(feature: 'asaas' | 'email' | 'supabase'): boolean {
  const validation = validateEnvironment();

  switch (feature) {
    case 'asaas':
      return !!validation.config.ASAAS_API_KEY;
    case 'email':
      return !!validation.config.RESEND_API_KEY;
    case 'supabase':
      return !!(validation.config.NEXT_PUBLIC_SUPABASE_URL &&
                validation.config.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                validation.config.SUPABASE_SERVICE_ROLE_KEY);
    default:
      return false;
  }
}