import { NextResponse } from 'next/server';

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

/**
 * Rota de fallback que redireciona para a rota principal
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Construir nova URL para a rota principal
  const redirectUrl = `/api/admin/subscriptions?${params.toString()}`;
  
  console.log(`[API:subscriptions-fallback] Redirecionando para: ${redirectUrl}`);
  
  // Responder com um redirecionamento 307 (redirecionamento temporário)
  return NextResponse.redirect(new URL(redirectUrl, request.url));
} 