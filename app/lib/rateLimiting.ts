// Sistema de Rate Limiting - BDC Classificados
// Implementação simples baseada em memória para controle de requisições

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class MemoryRateLimit {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutos
      ...config
    };

    // Limpeza periódica das entradas expiradas
    setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.store.delete(key);
    });
  }

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  check(identifier: string, endpoint: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Nova janela de tempo
      entry = {
        count: 0,
        resetTime: resetTime
      };
    }

    entry.count++;
    this.store.set(key, entry);

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      total: this.config.maxRequests
    };
  }

  reset(identifier: string, endpoint?: string) {
    if (endpoint) {
      const key = this.getKey(identifier, endpoint);
      this.store.delete(key);
    } else {
      // Reset todos os endpoints para o identifier
      const keysToDelete: string[] = [];
      this.store.forEach((_, key) => {
        if (key.startsWith(`${identifier}:`)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.store.delete(key);
      });
    }
  }

  getStats(): {
    totalEntries: number;
    config: RateLimitConfig;
  } {
    return {
      totalEntries: this.store.size,
      config: this.config
    };
  }
}

// Instância global
const globalRateLimit = new MemoryRateLimit();

// Rate limit específico para APIs admin (mais restritivo)
const adminRateLimit = new MemoryRateLimit({
  maxRequests: 50,
  windowMs: 600000 // 10 minutos
});

// Rate limit para login/auth (muito restritivo)
const authRateLimit = new MemoryRateLimit({
  maxRequests: 10,
  windowMs: 300000 // 5 minutos
});

/**
 * Extrai identificador único da requisição
 * Prioridade: user_id > IP address > session
 */
function getIdentifier(request: Request): string {
  // Tentar extrair user_id do token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      // Aqui você decodificaria o JWT para extrair o user_id
      // Por simplicidade, vamos usar o hash do token
      const userId = btoa(token).slice(0, 10);
      return `user:${userId}`;
    } catch (error) {
      // Token inválido, continuar com IP
    }
  }

  // Usar IP como fallback
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  
  const ip = xForwardedFor?.split(',')[0] || 
            xRealIP || 
            'unknown';
  
  return `ip:${ip}`;
}

/**
 * Extrai endpoint da URL
 */
function getEndpoint(request: Request): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Normalizar IDs dinâmicos para evitar bypass
  return pathname.replace(/\/[0-9a-f-]{36}/g, '/[id]')
                .replace(/\/\d+/g, '/[id]');
}

/**
 * Aplica rate limiting em uma requisição
 */
export function applyRateLimit(
  request: Request,
  type: 'global' | 'admin' | 'auth' = 'global'
): {
  allowed: boolean;
  headers: Record<string, string>;
  error?: string;
} {
  const identifier = getIdentifier(request);
  const endpoint = getEndpoint(request);
  
  let rateLimit: MemoryRateLimit;
  
  switch (type) {
    case 'admin':
      rateLimit = adminRateLimit;
      break;
    case 'auth':
      rateLimit = authRateLimit;
      break;
    default:
      rateLimit = globalRateLimit;
  }

  const result = rateLimit.check(identifier, endpoint);
  
  const headers = {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'X-RateLimit-Used': (result.total - result.remaining).toString()
  };

  if (!result.allowed) {
    headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString();
  }

  return {
    allowed: result.allowed,
    headers,
    error: result.allowed ? undefined : 'Rate limit exceeded'
  };
}

/**
 * Middleware para Next.js API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  type: 'global' | 'admin' | 'auth' = 'global'
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResult = applyRateLimit(request, type);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
          retryAfter: rateLimitResult.headers['Retry-After']
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          }
        }
      );
    }

    // Executar handler original
    const response = await handler(request);
    
    // Adicionar headers de rate limit na resposta
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Função para resetar rate limit (útil para testes ou admin)
 */
export function resetRateLimit(
  identifier: string, 
  endpoint?: string, 
  type: 'global' | 'admin' | 'auth' = 'global'
) {
  let rateLimit: MemoryRateLimit;
  
  switch (type) {
    case 'admin':
      rateLimit = adminRateLimit;
      break;
    case 'auth':
      rateLimit = authRateLimit;
      break;
    default:
      rateLimit = globalRateLimit;
  }

  rateLimit.reset(identifier, endpoint);
}

/**
 * Função para obter estatísticas de rate limiting
 */
export function getRateLimitStats() {
  return {
    global: globalRateLimit.getStats(),
    admin: adminRateLimit.getStats(),
    auth: authRateLimit.getStats()
  };
}

// Log de configuração
if (typeof window === 'undefined') {
  console.log('🛡️ Rate Limiting configurado:', {
    global: globalRateLimit.getStats().config,
    admin: adminRateLimit.getStats().config,
    auth: authRateLimit.getStats().config
  });
} 