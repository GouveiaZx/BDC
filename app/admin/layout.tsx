"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  FaChevronDown,
  FaChevronUp,
  FaTicketAlt,
  FaRegFlag
} from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { AdminProvider, useAdmin } from './AdminContext';

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
    <AdminProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminProvider>
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

  // Verificar quantidade de anúncios pendentes de moderação e denúncias pendentes
  useEffect(() => {
    const fetchPendingCounts = async () => {
      if (!isAuthenticated) {
        return;
      }
      try {
        // Usar timestamp para evitar cache
        const timestamp = Date.now();
        const response = await fetch(`/api/admin/pending-counts?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.counts) {
            // Só mostrar notificação se realmente houver itens pendentes
            const adsCount = Math.max(0, data.counts.ads || 0);
            const reportsCount = Math.max(0, data.counts.reports || 0);
            
            setPendingAdsCount(adsCount);
            setPendingReportsCount(reportsCount);
            console.log('✅ Contagens atualizadas:', { ads: adsCount, reports: reportsCount });
          }
        } else if (response.status === 401) {
          console.warn('fetchPendingCounts: Não autorizado (401). A sessão pode ser manual ou inválida.');
          // Limpar contagens se não autorizado
          setPendingAdsCount(0);
          setPendingReportsCount(0);
        } else {
          console.error(`Erro ao buscar contagens pendentes: ${response.status} ${response.statusText}`);
          
          // Fallback: tentar o método antigo se a nova API falhar
          try {
            // Verificar anúncios pendentes
            const adsResponse = await fetch(`/api/admin/ads?status=pending&limit=1&t=${timestamp}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            });
            if (adsResponse.ok) {
              const adsData = await adsResponse.json();
              if (adsData.success && typeof adsData.total === 'number') {
                setPendingAdsCount(Math.max(0, adsData.total));
              } else if (adsData.success && adsData.stats && typeof adsData.stats.pending === 'number') {
                setPendingAdsCount(Math.max(0, adsData.stats.pending));
              } else {
                setPendingAdsCount(0);
              }
            }
            
            // Verificar denúncias pendentes
            const reportsResponse = await fetch(`/api/admin/reports?status=pending&limit=1&t=${timestamp}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            });
            if (reportsResponse.ok) {
              const reportsData = await reportsResponse.json();
              if (reportsData.success && typeof reportsData.total === 'number') {
                setPendingReportsCount(Math.max(0, reportsData.total));
              } else {
                setPendingReportsCount(0);
              }
            }
          } catch (fallbackError) {
            console.error('Erro no fallback para obter contagens:', fallbackError);
            // Em caso de erro, zerar as contagens para evitar notificações falsas
            setPendingAdsCount(0);
            setPendingReportsCount(0);
          }
        }
      } catch (error) {
        console.error('Erro na execução de fetchPendingCounts:', error);
        // Em caso de erro, zerar as contagens para evitar notificações falsas
        setPendingAdsCount(0);
        setPendingReportsCount(0);
      }
    };

    if (isAuthenticated) {
      fetchPendingCounts();
      
      // Atualizar a cada 30 segundos para ser mais responsivo
      const interval = setInterval(fetchPendingCounts, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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

  // Se estiver na página de login, não mostrar o layout admin
  if (pathname === '/admin/login') {
    return (
      <>
        <AdminGlobalStyle />
        {children}
      </>
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
      
      {/* Cabeçalho Admin (fundo preto com logo) */}
      <header className="admin-header bg-black shadow-sm h-16 fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center h-full px-4 md:px-6">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 mr-2 md:hidden text-white hover:text-primary"
            >
              <FaBars size={20} />
            </button>
            <Link href="/admin/dashboard" className="flex items-center">
              <span className="text-lg font-bold text-green-500">BuscaAquiBdC Admin</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                className="p-2 text-white hover:text-primary relative"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <FaBell />
                {pendingAdsCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {pendingAdsCount > 99 ? '99+' : pendingAdsCount}
                    </span>
                  </div>
                )}
              </button>
              
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                  <div className="py-2 border-b border-gray-100">
                    <h4 className="px-4 text-sm font-medium text-gray-700">Notificações</h4>
                  </div>
                  
                  {pendingAdsCount > 0 ? (
                    <Link 
                      href="/admin/anuncios?status=pending"
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowNotificationMenu(false)}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {pendingAdsCount} {pendingAdsCount === 1 ? 'anúncio aguardando' : 'anúncios aguardando'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Clique para revisar e aprovar
                      </p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500">Nenhuma notificação</p>
                    </div>
                  )}
                  
                  <div className="py-2 border-t border-gray-100">
                    <Link 
                      href="/admin/anuncios"
                      className="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
                      onClick={() => setShowNotificationMenu(false)}
                    >
                      Ver todos os anúncios
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-white mr-2 hidden md:block">Admin</span>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <FaUser className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar para dispositivos móveis */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
          <div 
            className="h-full w-64 bg-white p-4 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-700"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="space-y-1">
              <NavItem href="/admin/dashboard" icon={<FaHome />} label="Dashboard" />
              <NavItem href="/admin/assinaturas" icon={<FaCreditCard />} label="Assinaturas" />
              
              <NavGroup 
                label="Anúncios" 
                icon={<FaClipboardList />} 
                isOpen={isAnunciosGroupOpen} 
                toggleOpen={() => setIsAnunciosGroupOpen(!isAnunciosGroupOpen)}
              >
                <NavItem 
                  href="/admin/anuncios?status=all" 
                  icon={<FaClipboardList />} 
                  label="Todos" 
                />
                <NavItem 
                  href="/admin/anuncios?status=pending" 
                  icon={<FaExclamationTriangle className="text-yellow-500" />} 
                  label="Aguardando" 
                  count={pendingAdsCount}
                />
                <NavItem 
                  href="/admin/anuncios?status=approved" 
                  icon={<FaCheck className="text-green-500" />} 
                  label="Publicados" 
                />
                <NavItem 
                  href="/admin/anuncios?status=rejected" 
                  icon={<FaTimes className="text-red-500" />} 
                  label="Recusados" 
                />
              </NavGroup>
              
              <NavItem 
                href="/admin/denuncias" 
                icon={<FaRegFlag className="text-red-500" />} 
                label="Denúncias" 
                count={pendingReportsCount}
              />
              
              <NavItem href="/admin/destaques" icon={<FaImages />} label="Destaques/Stories" />
              <NavItem href="/admin/classificados" icon={<FaStore />} label="Classificados" />
              <NavItem href="/admin/faturamento" icon={<FaChartLine />} label="Faturamento" />
              <NavItem href="/admin/cupons" icon={<FaTicketAlt />} label="Cupons" />
              
              <button 
                onClick={handleLogout}
                className="flex items-center p-3 w-full text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FaSignOutAlt className="mr-3" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Layout principal */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar (para telas maiores) */}
        <aside className="hidden md:block w-64 p-4 bg-white shadow-md">
          <div className="space-y-1">
            <NavItem href="/admin/dashboard" icon={<FaHome />} label="Dashboard" />
            <NavItem href="/admin/assinaturas" icon={<FaCreditCard />} label="Assinaturas" />
            
            <NavGroup 
              label="Anúncios" 
              icon={<FaClipboardList />} 
              isOpen={isAnunciosGroupOpen} 
              toggleOpen={() => setIsAnunciosGroupOpen(!isAnunciosGroupOpen)}
            >
              <NavItem 
                href="/admin/anuncios?status=all" 
                icon={<FaClipboardList />} 
                label="Todos" 
              />
              <NavItem 
                href="/admin/anuncios?status=pending" 
                icon={<FaExclamationTriangle className="text-yellow-500" />} 
                label="Aguardando" 
                count={pendingAdsCount}
              />
              <NavItem 
                href="/admin/anuncios?status=approved" 
                icon={<FaCheck className="text-green-500" />} 
                label="Publicados" 
              />
              <NavItem 
                href="/admin/anuncios?status=rejected" 
                icon={<FaTimes className="text-red-500" />} 
                label="Recusados" 
              />
            </NavGroup>
            
            <NavItem 
              href="/admin/denuncias" 
              icon={<FaRegFlag className="text-red-500" />} 
              label="Denúncias" 
              count={pendingReportsCount}
            />
            
            <NavItem href="/admin/destaques" icon={<FaImages />} label="Destaques/Stories" />
            <NavItem href="/admin/classificados" icon={<FaStore />} label="Classificados" />
            <NavItem href="/admin/faturamento" icon={<FaChartLine />} label="Faturamento" />
            <NavItem href="/admin/cupons" icon={<FaTicketAlt />} label="Cupons" />
            
            <button 
              onClick={handleLogout}
              className="flex items-center p-3 w-full text-left rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FaSignOutAlt className="mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </aside>
        
        {/* Conteúdo principal */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 