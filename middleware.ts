import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Função para verificar a autenticação do administrador
const isAuthenticated = (request: NextRequest): boolean => {
  // Verificar cookies de autenticação
  const adminAuthCookie = request.cookies.get('admin-auth')?.value; // Note: admin-auth, não admin_auth
  const sbAccessToken = request.cookies.get('sb-access-token')?.value;
  
  console.log('🔍 [MIDDLEWARE] Verificando autenticação admin:');
  console.log('   admin-auth cookie:', adminAuthCookie);
  console.log('   sb-access-token:', !!sbAccessToken);
  
  // Se algum destes cookies existir, consideramos autenticado
  // (a validação completa acontece na API)
  const isAuth = !!adminAuthCookie || !!sbAccessToken;
  console.log('   resultado:', isAuth);
  
  return isAuth;
};

// Middleware para interceptar requisições
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Interceptar apenas requisições para rotas administrativas (exceto a página de login)
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
    // Verificar se está autenticado
    if (!isAuthenticated(request)) {
      console.log('Middleware: Redirecionando usuário não autenticado para login');
      
      // Criar URL de redirecionamento
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '?reason=auth_required';
      
      // Redirecionar para página de login
      return NextResponse.redirect(url);
    }
  }
  
  // Para requisições à API admin, verificar autenticação (EXCETO rota de login)
  if (pathname.startsWith('/api/admin') && !pathname.includes('/api/admin/auth')) {
    if (!isAuthenticated(request)) {
      console.log('Middleware: Bloqueando acesso não autenticado à API admin');
      
      // Retornar resposta de erro 401
      return new NextResponse(
        JSON.stringify({ 
          error: 'Não autenticado',
          details: 'Autenticação necessária para acessar esta API'
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
  
  // Permitir outras requisições normalmente
  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ],
}; 