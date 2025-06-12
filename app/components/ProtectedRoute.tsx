"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        // Verificar se está logado
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        console.log('🔐 Verificando autenticação:', {
          isLoggedIn,
          hasUserId: !!userId,
          hasEmail: !!userEmail,
          hasName: !!userName
        });

        if (!requireAuth) {
          setIsAuthenticated(true);
          return;
        }

        if (isLoggedIn && userId && userEmail) {
          console.log('✅ Usuário autenticado:', { userId, userEmail, userName });
          
          setUserInfo({
            id: userId,
            email: userEmail,
            name: userName || userEmail.split('@')[0]
          });
          
          setIsAuthenticated(true);
        } else {
          console.log('❌ Usuário não autenticado, redirecionando para login');
          setIsAuthenticated(false);
          
          // Redirecionar para login após um pequeno delay
          setTimeout(() => {
            router.push(redirectTo);
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        router.push(redirectTo);
      }
    };

    checkAuthentication();
  }, [requireAuth, redirectTo, router]);

  // Estado de carregamento
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado e requer autenticação
  if (!isAuthenticated && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <Link 
            href={redirectTo}
            className="inline-block bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute; 