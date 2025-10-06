import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, validateAdminAuth } from './app/lib/jwt';
import { logger } from './app/lib/secureLogger';
import { applyRateLimit } from './app/lib/rateLimiting';

/**
 * Middleware global de autenticação e segurança
 * Protege automaticamente todas as rotas da API usando JWT
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early return para arquivos estáticos
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.') && !pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Log da requisição para auditoria
  logger.apiRequest(request.method, pathname);

  // === PROTEÇÃO PÁGINAS ADMIN ===
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const validation = validateAdminAuth(request);

    if (!validation.isValid) {
      logger.authAttempt('unknown', false, 'Admin page access denied');

      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '?reason=auth_required';

      return NextResponse.redirect(url);
    }

    logger.adminAction(validation.user!.email, `Page access: ${pathname}`);
  }

  // === PROTEÇÃO APIs ===
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rate limiting especial para auth routes
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const rateLimitResult = applyRateLimit(request, 'auth');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
  }

  // Rotas públicas que não requerem autenticação
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/validate-token',
    '/api/categories/list',
    '/api/cities/list',
    '/api/manifest',
    '/api/payments/webhooks',
    '/api/webhooks/asaas',
    '/api/webhooks/resend'
  ];

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // GETs públicos específicos
  const publicGETRoutes = [
    '/api/ads', // Listar anúncios públicos
    '/api/vendedor', // Perfis públicos
    '/api/anuncio', // Redirecionamentos
    '/api/categories',
    '/api/cities'
  ];

  const isPublicGET = request.method === 'GET' &&
    publicGETRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute || isPublicGET) {
    return addSecurityHeaders(NextResponse.next());
  }

  // === ROTAS ADMIN - AUTENTICAÇÃO OBRIGATÓRIA ===
  if (pathname.startsWith('/api/admin/')) {
    // Rate limiting para rotas admin
    const rateLimitResult = applyRateLimit(request, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const validation = validateAdminAuth(request);

    if (!validation.isValid) {
      logger.authAttempt('unknown', false, `Admin API access denied: ${pathname}`);

      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Privilégios administrativos necessários'
        },
        { status: 403 }
      );
    }

    logger.adminAction(validation.user!.email, `API: ${request.method} ${pathname}`);

    // Headers com informações do admin para as APIs
    const response = addSecurityHeaders(NextResponse.next());
    response.headers.set('X-Admin-User', validation.user!.userId);
    response.headers.set('X-Admin-Email', validation.user!.email);
    return response;
  }

  // === ROTAS USUÁRIO - AUTENTICAÇÃO OBRIGATÓRIA ===
  const userAuthRoutes = [
    '/api/ads/create',
    '/api/ads/my-ads',
    '/api/upload/',
    '/api/profile/',
    '/api/subscriptions/',
    '/api/users/profile',
    '/api/users/verify', // Operação sensível
    '/api/destaques/',
    '/api/payments/',
    '/api/vendedor/complete-profile'
  ];

  const requiresUserAuth = userAuthRoutes.some(route =>
    pathname.startsWith(route)
  ) || (request.method !== 'GET' && !isPublicRoute);

  if (requiresUserAuth) {
    const validation = validateAuth(request);

    if (!validation.isValid) {
      logger.authAttempt('unknown', false, `User API access denied: ${pathname}`);

      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Autenticação necessária'
        },
        { status: 401 }
      );
    }

    logger.info(`User API access: ${request.method} ${pathname}`, {
      userId: validation.user!.userId
    });

    // Headers com informações do usuário para as APIs
    const response = addSecurityHeaders(NextResponse.next());
    response.headers.set('X-User-Id', validation.user!.userId);
    response.headers.set('X-User-Email', validation.user!.email);
    return response;
  }

  return addSecurityHeaders(NextResponse.next());
}

/**
 * Adicionar headers de segurança para todas as respostas
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // CORS Headers
  const allowedOrigins = process.env.ALLOWED_ORIGINS || 'https://www.buscaaquibdc.com';
  response.headers.set(
    'Access-Control-Allow-Origin',
    allowedOrigins
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Powered-By', 'BDC-Classificados'); // Custom header

  // Cache Control para APIs (não cache dados sensíveis)
  if (response.url.includes('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

/**
 * Configuração do matcher - quais rotas aplicar o middleware
 */
export const config = {
  matcher: [
    // Todas as páginas admin
    '/admin/:path*',
    // Todas as APIs
    '/api/:path*',
    // Excluir arquivos estáticos Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ]
};