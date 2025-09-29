"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../lib/supabase';

interface AuthCheckProps {
  children: ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkAuth = async () => {
      const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
      
      console.log('[AuthCheck] Verificando autenticação...');
      console.log('[AuthCheck] localStorage isLoggedIn:', isLoggedInLS);
      
      // Verificar token
      let accessToken = localStorage.getItem('sb-access-token');
      
      // Se não houver token, verificar o formato antigo
      if (!accessToken) {
        try {
          const sbStorage = localStorage.getItem('sb-xjguzxwwydlpvudwmiyv-auth-token');
          if (sbStorage) {
            const sbData = JSON.parse(sbStorage);
            if (sbData?.access_token) {
              accessToken = sbData.access_token;
              // Migrar para o novo formato
              localStorage.setItem('sb-access-token', accessToken);
              console.log('[AuthCheck] Token migrado do formato antigo');
            }
          }
        } catch (e) {
          console.error('[AuthCheck] Erro ao tentar migrar token antigo:', e);
        }
      }
      
      console.log('[AuthCheck] Token encontrado:', accessToken ? `${accessToken.substring(0, 10)}...` : 'não encontrado');
      
      // Verificar cookies também
      console.log('[AuthCheck] Cookies disponíveis:', document.cookie);
      
      // Verificar valores relevantes em localStorage
      console.log('[AuthCheck] Valores em localStorage:',
        'userId:', localStorage.getItem('userId'),
        'userEmail:', localStorage.getItem('userEmail'),
        'userName:', localStorage.getItem('userName')
      );
      
      // Se não há flag de login, redirecionar para login
      if (!isLoggedInLS) {
        console.log('[AuthCheck] Usuário não autenticado, redirecionando para login');
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
      
      // Tentar obter a sessão atual do Supabase
      const supabaseClient = getSupabaseClient();
      
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (data?.session) {
          console.log('[AuthCheck] Sessão válida encontrada no Supabase');
          
          // Atualizar token no localStorage e cookies, se necessário
          if (data.session.access_token !== accessToken) {
            console.log('[AuthCheck] Atualizando token com valor da sessão atual');
            localStorage.setItem('sb-access-token', data.session.access_token);
            document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=28800; SameSite=Lax`;
            
            // Garantir que o userId também está armazenado
            if (data.session.user && data.session.user.id) {
              localStorage.setItem('userId', data.session.user.id);
            }
          }
          
          setIsAuthenticated(true);
          return;
        }
        
        console.log('[AuthCheck] Não foi possível encontrar sessão válida no Supabase');
        
        // Se tem flag de login mas não tem token, permitir acesso simplificado
        if (!accessToken) {
          console.log('[AuthCheck] Usuário marcado como logado mas sem token - permitindo acesso simplificado');
          setIsAuthenticated(true);
          
          // Verificar se tem userId, que é necessário
          if (!localStorage.getItem('userId')) {
            console.log('[AuthCheck] Gerando userId temporário para acesso simplificado');
            const tempId = 'temp-user-' + Date.now();
            localStorage.setItem('userId', tempId);
          }
          
          return;
        }
        
        // Token está presente mas sessão não é válida, verificar token
        console.log('[AuthCheck] Token inválido, tentando atualizar usando refreshToken');
        try {
          // Tentar atualizar a sessão com o Supabase
          const refreshToken = localStorage.getItem('sb-refresh-token');
          
          if (refreshToken) {
            const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
              refresh_token: refreshToken,
            });
            
            if (refreshData?.session) {
              console.log('[AuthCheck] Sessão atualizada com refreshToken');
              localStorage.setItem('sb-access-token', refreshData.session.access_token);
              localStorage.setItem('sb-refresh-token', refreshData.session.refresh_token || '');
              document.cookie = `sb-access-token=${refreshData.session.access_token}; path=/; max-age=28800; SameSite=Lax`;
              setIsAuthenticated(true);
              return;
            } else {
              console.log('[AuthCheck] Falha ao atualizar sessão:', refreshError);
            }
          } else {
            console.log('[AuthCheck] Não há refresh token disponível para atualizar a sessão');
          }
        } catch (refreshError) {
          console.error('[AuthCheck] Erro ao atualizar sessão:', refreshError);
        }
        
        console.log('[AuthCheck] Permitindo acesso simplificado mesmo com token inválido');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AuthCheck] Erro ao validar token:', error);
        // Em caso de erro ao validar o token, permitimos acesso simplificado
        console.log('[AuthCheck] Permitindo acesso simplificado após erro de validação');
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router]);

  // Estado de carregamento inicial
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Renderizar o conteúdo protegido se estiver autenticado
  return isAuthenticated ? <>{children}</> : null;
} 