"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '../lib/logger';
import { 
  FaHome, 
  FaCreditCard, 
  FaImages, 
  FaClipboardList, 
  FaChartLine,
  FaCog, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaUser,
  FaBell,
  FaTags,
  FaStore,
  FaExclamationTriangle,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaTicketAlt,
  FaRegFlag,
  FaAd,
  FaUsers,
  FaStar,
  FaBriefcase
} from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { AdminProvider, useAdmin } from './AdminContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Estilo global para ocultar o cabeçalho padrão do site nas páginas de administração
const AdminGlobalStyle = () => {
  return (
    <style jsx global>{`
      /* Oculta o cabeçalho padrão do site nas páginas de administração */
      body > header:not(.admin-header) {
        display: none !important;
      }
      
      /* Garante que o layout administrativo não seja afetado por outros estilos globais */
      .admin-layout-wrapper {
        position: relative;
        min-height: 100vh;
        z-index: 50;
      }
    `}</style>
  );
};

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  toggleOpen: () => void;
  children: React.ReactNode;
}

const NavGroup = ({ label, icon, isOpen, toggleOpen, children }: NavGroupProps) => {
  return (
    <div className="mb-1">
      <button 
        className="flex items-center w-full p-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
        onClick={toggleOpen}
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
        <svg 
          className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="pl-9 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Componente principal que provê o contexto administrativo
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </AdminProvider>
    </ErrorBoundary>
  );
};

// Componente interno que usa o contexto administrativo
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [pendingAdsCount, setPendingAdsCount] = useState<number>(0);
  const [isAnunciosGroupOpen, setIsAnunciosGroupOpen] = useState(true);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // Cache simples para contagens (2 minutos TTL)
  const [countsCache, setCountsCache] = useState<{
    data: { ads: number; reports: number } | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });
  
  const COUNTS_CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  // Memoizar menuItems para evitar recriação desnecessária (DEVE ESTAR ANTES DE QUALQUER RETURN CONDICIONAL)
  const menuItems = useMemo(() => [
    { href: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
    { 
      href: '/admin/anuncios', 
      icon: FaAd, 
      label: 'Anúncios',
      badge: pendingAdsCount > 0 ? pendingAdsCount : null,
      badgeColor: 'bg-yellow-500'
    },
    { href: '/admin/classificados', icon: FaBriefcase, label: 'Classificados' },
    { 
      href: '/admin/destaques', 
      icon: FaStar, 
      label: 'Destaques'
    },
    { href: '/admin/usuarios', icon: FaUsers, label: 'Usuários' },
    { href: '/admin/cupons', icon: FaTicketAlt, label: 'Cupons' },
    { href: '/admin/assinaturas', icon: FaCreditCard, label: 'Assinaturas' },
    { href: '/admin/faturamento', icon: FaChartLine, label: 'Faturamento' },
    { 
      href: '/admin/denuncias', 
      icon: FaExclamationTriangle, 
      label: 'Denúncias',
      badge: pendingReportsCount > 0 ? pendingReportsCount : null,
      badgeColor: 'bg-red-500'
    },
  ], [pendingAdsCount, pendingReportsCount]);

  // Função memoizada para buscar contagens pendentes
  const fetchPendingCounts = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    // Verificar cache primeiro
    const now = Date.now();
    if (countsCache.data && (now - countsCache.timestamp < COUNTS_CACHE_TTL)) {
      logger.debug('[AdminLayout] Usando cache para contagens pendentes');
      setPendingAdsCount(countsCache.data.ads);
      setPendingReportsCount(countsCache.data.reports);
      return;
    }

    try {
      logger.debug('[AdminLayout] Buscando contagens pendentes da API');
      const response = await fetch('/api/admin/pending-counts', {
        credentials: 'include'
      });
        
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.counts) {
          const adsCount = Math.max(0, data.counts.ads || 0);
          const reportsCount = Math.max(0, data.counts.reports || 0);
          
          setPendingAdsCount(adsCount);
          setPendingReportsCount(reportsCount);
          
          // Atualizar cache
          setCountsCache({
            data: { ads: adsCount, reports: reportsCount },
            timestamp: now
          });
          
          logger.debug('✅ Contagens atualizadas e cacheadas:', { ads: adsCount, reports: reportsCount });
        }
      } else if (response.status === 401) {
        logger.warn('fetchPendingCounts: Não autorizado (401)');
        setPendingAdsCount(0);
        setPendingReportsCount(0);
        // Limpar cache
        setCountsCache({ data: null, timestamp: 0 });
      } else {
        // Fallback simples: definir contagens como 0
        setPendingAdsCount(0);
        setPendingReportsCount(0);
        setCountsCache({ data: null, timestamp: 0 });
      }
    } catch (error) {
      logger.error('[AdminLayout] Erro ao buscar contagens pendentes:', error);
      setPendingAdsCount(0);
      setPendingReportsCount(0);
      setCountsCache({ data: null, timestamp: 0 });
    }
  }, [isAuthenticated, countsCache.data, countsCache.timestamp]);

  // UseEffect otimizado com polling reduzido
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingCounts();
      
      // Reduzir polling de 30s para 60s (menos requisições)
      const interval = setInterval(fetchPendingCounts, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchPendingCounts]);

  // Se estiver na página de login, não mostrar o layout admin
  if (pathname === '/admin/login') {
    return (
      <>
        <AdminGlobalStyle />
        {children}
      </>
    );
  }

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, só mostrar na página de login
  if (!isAuthenticated && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para área de login...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
  };
  
  const NavItem = ({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count?: number }) => {
    const isActive = pathname === href;
    
    return (
      <Link 
        href={href}
        className={`flex items-center p-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-white' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminGlobalStyle />
      <Toaster position="top-right" />
      
      {/* Cabeçalho Admin */}
      <header className="admin-header bg-white border-b border-gray-200 shadow-sm h-16 fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center h-full px-4 md:px-6">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 mr-2 md:hidden text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <FaBars size={20} />
            </button>
            <Link href="/admin/dashboard" className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold text-gray-800">BuscaAqui</span>
                <span className="text-lg font-medium text-blue-600 ml-1">Admin</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative transition-colors"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <FaBell size={20} />
                {(pendingAdsCount > 0 || pendingReportsCount > 0) && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                      {(pendingAdsCount + pendingReportsCount) > 99 ? '99+' : (pendingAdsCount + pendingReportsCount)}
                    </span>
                  </div>
                )}
              </button>
              
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-3 px-4 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                      <FaBell className="mr-2 text-blue-600" size={14} />
                      Notificações
                    </h4>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {pendingAdsCount > 0 && (
                      <Link 
                        href="/admin/anuncios?status=pending"
                        className="block px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50"
                        onClick={() => setShowNotificationMenu(false)}
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <FaAd className="text-yellow-600" size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {pendingAdsCount} {pendingAdsCount === 1 ? 'anúncio aguardando' : 'anúncios aguardando'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Revisar e aprovar novos anúncios
                            </p>
                          </div>
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                            {pendingAdsCount}
                          </span>
                        </div>
                      </Link>
                    )}
                    
                    {pendingReportsCount > 0 && (
                      <Link 
                        href="/admin/denuncias?status=pending"
                        className="block px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-50"
                        onClick={() => setShowNotificationMenu(false)}
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <FaExclamationTriangle className="text-red-600" size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {pendingReportsCount} {pendingReportsCount === 1 ? 'denúncia pendente' : 'denúncias pendentes'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Analisar denúncias de usuários
                            </p>
                          </div>
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {pendingReportsCount}
                          </span>
                        </div>
                      </Link>
                    )}
                    
                    {pendingAdsCount === 0 && pendingReportsCount === 0 && (
                      <div className="px-4 py-6 text-center">
                        <FaCheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                        <p className="text-sm text-gray-500">Nenhuma notificação pendente</p>
                        <p className="text-xs text-gray-400 mt-1">Tudo está em ordem!</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="py-2 px-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                    <div className="flex justify-between">
                      <Link 
                        href="/admin/anuncios"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setShowNotificationMenu(false)}
                      >
                        Ver anúncios
                      </Link>
                      <Link 
                        href="/admin/denuncias"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setShowNotificationMenu(false)}
                      >
                        Ver denúncias
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-3 hidden md:block">Administrador</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <FaUser className="text-white" size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar para dispositivos móveis */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
          <div 
            className="h-full w-64 bg-gray-50 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-900"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href || 
                                 (item.href === '/admin/anuncios' && pathname.includes('/admin/anuncios'));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <div className="flex items-center">
                        <item.icon className={`mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} size={18} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`${item.badgeColor || 'bg-red-500'} text-white text-xs rounded-full px-2 py-1 font-bold min-w-[20px] text-center ${item.badge > 0 ? 'animate-pulse' : ''}`}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center px-3 py-3 w-full text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                  >
                    <FaSignOutAlt className="mr-3 text-red-500" size={18} />
                    <span>Sair</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Layout principal */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar (para telas maiores) */}
        <aside className="hidden md:block w-64 bg-gray-50 shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || 
                               (item.href === '/admin/anuncios' && pathname.includes('/admin/anuncios'));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`${item.badgeColor || 'bg-red-500'} text-white text-xs rounded-full px-2 py-1 font-bold min-w-[20px] text-center ${item.badge > 0 ? 'animate-pulse' : ''}`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-3 py-3 w-full text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                >
                  <FaSignOutAlt className="mr-3 text-red-500" size={18} />
                  <span>Sair</span>
                </button>
              </div>
            </nav>
          </div>
        </aside>
        
        {/* Conteúdo principal */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Mostrar alerta se houver muitos itens pendentes */}
          {(pendingAdsCount > 5 || pendingReportsCount > 5) && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Você tem {pendingAdsCount > 5 && `${pendingAdsCount} anúncios`}
                    {pendingAdsCount > 5 && pendingReportsCount > 5 && ' e '}
                    {pendingReportsCount > 5 && `${pendingReportsCount} denúncias`} aguardando revisão.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}