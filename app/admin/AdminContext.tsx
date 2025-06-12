"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Lista de emails autorizados como administradores
const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'gouveiarx@gmail.com',
  'gouveiarx@hotmail.com'
];

// Credenciais válidas para login administrativo
const ADMIN_CREDENTIALS = [
  { email: 'admin@buscaaquibdc.com.br', password: 'admin123' },
  { email: 'gouveiarx@gmail.com', password: 'admin123' },
  { email: 'gouveiarx@hotmail.com', password: 'admin123' }
];

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verificar se há autenticação administrativa válida
    const checkAuth = () => {
      try {
        console.log('[AdminContext] Verificando autenticação...');
        
        const adminAuth = localStorage.getItem('admin-auth');
        const adminEmail = localStorage.getItem('admin-email');
        
        console.log('[AdminContext] LocalStorage:', { adminAuth, adminEmail });
        
        if (adminAuth === 'true' && adminEmail && ADMIN_EMAILS.includes(adminEmail)) {
          console.log('[AdminContext] ✅ Usuário autenticado:', adminEmail);
          setIsAuthenticated(true);
          // Definir cookie para as APIs
          document.cookie = 'admin-auth=true; path=/; max-age=86400'; // 24 horas
        } else {
          console.log('[AdminContext] ❌ Usuário NÃO autenticado');
          setIsAuthenticated(false);
          // Limpar cookie
          document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('[AdminContext] Erro ao verificar autenticação admin:', error);
        setIsAuthenticated(false);
      } finally {
        // Aguardar um pouco antes de marcar como carregado para evitar flicker
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }
    };

    checkAuth();
    
    // Verificar mudanças na autenticação (storage events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-auth' || e.key === 'admin-email') {
        console.log('[AdminContext] Mudança detectada no localStorage, reverificando...');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Monitorar mudanças de rota para usuários não autenticados
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname?.startsWith('/admin') && pathname !== '/admin/login') {
      console.log('[AdminContext] Usuário não autenticado tentando acessar área admin, redirecionando...');
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Verificar credenciais
      const validCredential = ADMIN_CREDENTIALS.find(
        cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
      );
      
      if (validCredential) {
        // Armazenar estado de autenticação
        localStorage.setItem('admin-auth', 'true');
        localStorage.setItem('admin-email', email);
        
        // Definir cookie para as APIs
        document.cookie = 'admin-auth=true; path=/; max-age=86400'; // 24 horas
        
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro durante login administrativo:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Limpar localStorage
      localStorage.removeItem('admin-auth');
      localStorage.removeItem('admin-email');
      
      // Limpar cookie
      document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setIsAuthenticated(false);
      
      // Redirecionar para login
      router.push('/admin/login');
    } catch (error) {
      console.error('Erro durante logout administrativo:', error);
    }
  };

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
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 