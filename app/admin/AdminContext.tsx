"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logger } from '../lib/logger';
import { ADMIN_EMAILS, isAdminEmail } from '../config/admin';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Safe router and pathname hooks usage
  // Sempre chamar hooks no topo do componente
  const router = useRouter();
  const pathname = usePathname();

  // Função memoizada para verificar autenticação
  const checkAuth = useCallback(() => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const adminAuth = localStorage.getItem('admin-auth');
      const adminEmail = localStorage.getItem('admin-email');

      if (adminAuth === 'true' && adminEmail && isAdminEmail(adminEmail)) {
        setIsAuthenticated(true);
        // Definir cookie para as APIs
        document.cookie = 'admin-auth=true; path=/; max-age=86400'; // 24 horas
      } else {
        setIsAuthenticated(false);
        // Limpar cookie
        document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (error) {
      logger.error('[AdminContext] Erro ao verificar autenticação admin:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Verificar mudanças na autenticação (storage events) com debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-auth' || e.key === 'admin-email') {
        logger.debug('[AdminContext] Mudança detectada no localStorage, reverificando...');
        
        // Debounce para evitar múltiplas verificações
        clearTimeout(timeoutId);
        timeoutId = setTimeout(checkAuth, 300);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  // Monitorar mudanças de rota para usuários não autenticados
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname?.startsWith('/admin') && pathname !== '/admin/login') {
      console.log('[AdminContext] Usuário não autenticado tentando acessar área admin, redirecionando...');
      if (router) {
        router.push('/admin/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Verificar se é um email admin autorizado
      if (!isAdminEmail(email)) {
        return false;
      }

      // Fazer login via API que verifica no banco de dados
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Armazenar estado de autenticação
        localStorage.setItem('admin-auth', 'true');
        localStorage.setItem('admin-email', email);

        // Cookie já é definido pela API
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error('[AdminContext] Erro durante login administrativo:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      // Only work with localStorage if in browser
      if (typeof window !== 'undefined') {
        // Limpar localStorage
        localStorage.removeItem('admin-auth');
        localStorage.removeItem('admin-email');

        // Limpar cookie
        document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      setIsAuthenticated(false);

      // Redirecionar para login
      if (router) {
        router.push('/admin/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      logger.error('[AdminContext] Erro durante logout administrativo:', error);
    }
  }, [router]);

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  try {
    const context = useContext(AdminContext);
    if (context === undefined) {
      console.warn('useAdmin called outside of AdminProvider, returning default values');
      // Return safe default values instead of throwing
      return {
        isAuthenticated: false,
        isLoading: false,
        login: async () => false,
        logout: () => {}
      };
    }
    return context;
  } catch (error) {
    console.error('Error in useAdmin hook:', error);
    // Return safe defaults if context access fails
    return {
      isAuthenticated: false,
      isLoading: false,
      login: async () => false,
      logout: () => {}
    };
  }
}