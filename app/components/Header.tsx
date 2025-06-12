"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FaSearch, FaUser, FaPlus, FaBars, FaTimes, FaCarAlt, 
  FaHome, FaLaptop, FaCouch, FaTools, FaBriefcase, FaEllipsisH,
  FaSignOutAlt, FaCog, FaListAlt, FaStore, FaChartLine, FaMapMarkerAlt, FaInfo, FaBell, FaHeart, FaCrown
} from 'react-icons/fa';
import { useProfileSync } from '../lib/useProfileSync';

// Criação do hook useLongPress logo antes do componente Header
const useLongPress = (onLongPress: () => void, onClick?: () => void, ms = 500) => {
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setPressing(false);
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback(() => {
    if (pressing && onClick) {
      onClick();
    }
    setPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [pressing, onClick]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    longPressProps: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        onLongPress();
      }
    }
  };
};

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/avatar-placeholder.png');
  const { profile, isLoading: profileLoading } = useProfileSync();

  const toggleUserMenu = () => {
    setUserMenuOpen(prevState => !prevState);
  };

  const goDashboard = () => {
    if (isLoggedIn) {
      router.push('/painel-anunciante');
    }
  };

  // Modificando para separar clique normal e pressão longa
  // Usando apenas clique normal para abrir o menu
  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleUserMenu();
  };

  const { longPressProps } = useLongPress(
    goDashboard,  // Invertendo as funções - pressão longa vai para dashboard
    undefined    // Não usamos mais o clique aqui pois está no onClick direto
  );

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkAuth = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true' || 
                        sessionStorage.getItem('isLoggedIn') === 'true';
      
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const email = localStorage.getItem('userEmail') || 
                     sessionStorage.getItem('userEmail') || 'Usuário';
        const name = localStorage.getItem('userName') || 
                     sessionStorage.getItem('userName') || email.split('@')[0];
        
        setUserEmail(email);
        setUserName(name);
        
        // Buscar a foto de perfil do localStorage
        const profileImage = localStorage.getItem('userAvatarPreview');
        if (profileImage) {
          setAvatarSrc(profileImage);
        }
      }
    };

    checkAuth();
    
    // Fechar o menu de usuário ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current && 
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname]);

  // Atualizar o avatar quando o perfil for carregado
  useEffect(() => {
    if (profile && profile.avatar) {
      console.log('Avatar atualizado no header:', profile.avatar);
      setAvatarSrc(profile.avatar);
      
      // Armazenar a URL da imagem de forma segura
      import('../lib/storageUtils').then(({ setAvatarUrl }) => {
        const success = setAvatarUrl(profile.avatar);
        if (!success) {
          console.warn('Falha ao armazenar URL do avatar');
        }
      });
    } else {
      console.log('Perfil sem avatar ou avatar não encontrado');
      // Usar imagem padrão
      setAvatarSrc('/images/avatar-placeholder.png');
    }
  }, [profile]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    // Limpar dados usando utilitários seguros
    import('../lib/storageUtils').then(({ clearUserData }) => {
      clearUserData();
    });
    
    // Limpar dados legados
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatarPreview');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('userEmail');
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
    
    setIsLoggedIn(false);
    setUserEmail('');
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/anuncios?busca=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-black border-b border-gray-800 shadow-lg">
      {/* Barra superior com logo e ações */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo - Ajustado para melhor responsividade */}
          <Link href="/" className="flex items-center py-2">
            <div className="relative w-32 h-16 sm:w-48 sm:h-24">
              <Image
                src="/images/logo.png"
                alt="BuscaAquiBdC"
                fill
                sizes="(max-width: 640px) 128px, 192px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </Link>
          
          {/* Barra de pesquisa - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-xl mx-4 lg:mx-8">
            <input
              type="text"
              placeholder="O que você está procurando?"
              className="w-full px-4 py-2 sm:px-5 sm:py-3 rounded-full bg-white text-gray-800 border border-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <FaSearch className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>
          
          {/* Botões de ação - Desktop */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link href={isLoggedIn ? "/painel-anunciante/criar-anuncio" : "/cadastro"} className="flex items-center gap-1 sm:gap-2 bg-primary hover:bg-primary-light text-black font-medium py-2 px-3 sm:py-3 sm:px-5 rounded-full transition-all duration-200 transform hover:scale-105 text-sm sm:text-base">
              <FaPlus className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
              <span>Anunciar</span>
            </Link>
            
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  ref={userButtonRef}
                  onClick={handleUserClick}
                  {...longPressProps}
                  className="flex items-center gap-1 sm:gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 sm:py-3 sm:px-5 rounded-full transition-all duration-200 text-sm sm:text-base"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                    <Image 
                      src={avatarSrc} 
                      alt="Perfil" 
                      width={32} 
                      height={32}
                      className="object-cover h-full w-full"
                      onError={() => {
                        // Em caso de erro, usar a imagem padrão
                        setAvatarSrc('/images/avatar-placeholder.png');
                      }}
                    />
                  </div>
                  <span className="text-white max-w-[100px] truncate">{profile?.name || userName}</span>
                </button>
                
                {userMenuOpen && (
                  <div 
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl z-50 py-2 border border-gray-200 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <div className="flex items-center px-4 py-3 border-b border-gray-200">
                      <div className="h-10 w-10 bg-primary rounded-full overflow-hidden">
                        <Image 
                          src={avatarSrc} 
                          alt="Perfil" 
                          width={40} 
                          height={40}
                          className="object-cover"
                          onError={() => {
                            // Em caso de erro, usar a imagem padrão
                            setAvatarSrc('/images/avatar-placeholder.png');
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 truncate">{profile?.name || userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                    </div>
                    
                    <Link href="/painel-anunciante" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaChartLine className="mr-3 text-primary" />
                      Dashboard
                    </Link>
                    
                    <Link href="/painel-anunciante/meus-anuncios" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaListAlt className="mr-3 text-primary" />
                      Meus Anúncios
                    </Link>
                    
                    <Link href="/painel-anunciante/criar-anuncio" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaPlus className="mr-3 text-primary" />
                      Criar Anúncio
                    </Link>
                    
                    <Link href="/painel-anunciante/meu-perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaUser className="mr-3 text-primary" />
                      Meu Perfil
                    </Link>
                    
                    <Link href="/painel-anunciante/planos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaCrown className="mr-3 text-primary" />
                      Meu Plano
                    </Link>
                    
                    <div className="border-t border-gray-200 mt-2"></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-3" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1 sm:gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 sm:py-3 sm:px-5 rounded-full transition-all duration-200 text-sm sm:text-base">
                <FaUser className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                <span className="text-white">Entrar</span>
              </Link>
            )}
          </div>
          
          {/* Botão de menu - Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Link href={isLoggedIn ? "/painel-anunciante/criar-anuncio" : "/cadastro"} className="flex items-center justify-center bg-primary hover:bg-primary-light text-black font-medium h-9 w-9 rounded-full transition-all duration-200">
              <FaPlus className="h-3 w-3" />
            </Link>
            
            {isLoggedIn ? (
              <button
                ref={userButtonRef}
                onClick={handleUserClick}
                {...longPressProps}
                className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white h-9 w-9 rounded-full transition-all duration-200 overflow-hidden"
              >
                <Image 
                  src={avatarSrc} 
                  alt="Perfil" 
                  width={36} 
                  height={36}
                  className="object-cover"
                  onError={() => {
                    // Em caso de erro, usar a imagem padrão
                    setAvatarSrc('/images/avatar-placeholder.png');
                  }}
                />
              </button>
            ) : (
              <Link href="/login" className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white h-9 w-9 rounded-full transition-all duration-200">
                <FaUser className="h-4 w-4" />
              </Link>
            )}
            
            <button 
              onClick={toggleMobileMenu}
              className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white h-9 w-9 rounded-full transition-all duration-200"
            >
              {mobileMenuOpen ? <FaTimes className="h-4 w-4" /> : <FaBars className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Barra de navegação por categorias - Desktop */}
      <div className="hidden md:block bg-primary border-t border-primary-dark">
        <div className="container mx-auto">
          <div className="flex justify-between items-center overflow-x-auto py-3 px-4 no-scrollbar">
            <Link href="/classificados" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaBriefcase className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Classificados</span>
            </Link>
            <Link href="/categoria/carros" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaCarAlt className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Veículos</span>
            </Link>
            <Link href="/categoria/imoveis" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaHome className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Imóveis</span>
            </Link>
            <Link href="/categoria/eletronicos" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaLaptop className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Eletrônicos</span>
            </Link>
            <Link href="/categoria/moveis" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaCouch className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Móveis</span>
            </Link>
            <Link href="/categoria/servicos" className="hidden lg:flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaTools className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Serviços</span>
            </Link>
            <Link href="/categoria/empregos" className="hidden lg:flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaBriefcase className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Empregos</span>
            </Link>
            <Link href="/categorias" className="flex items-center gap-2 text-black hover:text-white transition-colors duration-200 font-medium whitespace-nowrap px-1">
              <FaEllipsisH className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Mais</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Barra de pesquisa - Mobile */}
      <div className="block md:hidden px-4 py-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="O que você está procurando?"
            className="w-full px-4 py-2 rounded-full bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:border-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            <FaSearch className="h-4 w-4" />
          </button>
        </form>
      </div>
      
      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fadeIn">
          <div className="container mx-auto py-4 px-4">
            <nav className="space-y-4">
              <div className="pb-3 border-b border-gray-200">
                {isLoggedIn ? (
                  <>
                    <div className="py-2 flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary rounded-full overflow-hidden">
                        <Image 
                          src={avatarSrc} 
                          alt="Perfil" 
                          width={40} 
                          height={40}
                          className="object-cover"
                          onError={() => {
                            // Em caso de erro, usar a imagem padrão
                            setAvatarSrc('/images/avatar-placeholder.png');
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{profile?.name || userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Link href="/painel-anunciante" className="flex items-center gap-3 py-1 text-gray-700 hover:text-primary">
                        <FaChartLine className="h-4 w-4 text-primary" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <Link href="/painel-anunciante/meus-anuncios" className="flex items-center gap-3 py-1 text-gray-700 hover:text-primary">
                        <FaListAlt className="h-4 w-4 text-primary" />
                        <span className="text-sm">Meus Anúncios</span>
                      </Link>
                      <Link href="/painel-anunciante/criar-anuncio" className="flex items-center gap-3 py-1 text-gray-700 hover:text-primary">
                        <FaPlus className="h-4 w-4 text-primary" />
                        <span className="text-sm">Criar Anúncio</span>
                      </Link>
                      <Link href="/painel-anunciante/meu-perfil" className="flex items-center gap-3 py-1 text-gray-700 hover:text-primary">
                        <FaUser className="h-4 w-4 text-primary" />
                        <span className="text-sm">Meu Perfil</span>
                      </Link>
                      <Link href="/painel-anunciante/planos" className="flex items-center gap-3 py-1 text-gray-700 hover:text-primary">
                        <FaCrown className="h-4 w-4 text-primary" />
                        <span className="text-sm">Meu Plano</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 py-1 text-red-600 hover:text-red-700 w-full text-left"
                      >
                        <FaSignOutAlt className="h-4 w-4" />
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center gap-3 py-2">
                    <FaUser className="h-4 w-4 text-primary" />
                    <span className="font-medium text-gray-800 text-sm">Entrar ou Cadastrar</span>
                  </Link>
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-gray-600 text-xs uppercase font-medium">Categorias</h3>
                <div className="grid grid-cols-2 gap-y-3">
                  <Link href="/classificados" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaBriefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm">Classificados</span>
                  </Link>
                  <Link href="/categoria/carros" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaCarAlt className="h-4 w-4 text-primary" />
                    <span className="text-sm">Veículos</span>
                  </Link>
                  <Link href="/categoria/imoveis" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaHome className="h-4 w-4 text-primary" />
                    <span className="text-sm">Imóveis</span>
                  </Link>
                  <Link href="/categoria/eletronicos" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaLaptop className="h-4 w-4 text-primary" />
                    <span className="text-sm">Eletrônicos</span>
                  </Link>
                  <Link href="/categoria/moveis" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaCouch className="h-4 w-4 text-primary" />
                    <span className="text-sm">Móveis</span>
                  </Link>
                  <Link href="/categoria/servicos" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaTools className="h-4 w-4 text-primary" />
                    <span className="text-sm">Serviços</span>
                  </Link>
                  <Link href="/categoria/empregos" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors duration-200">
                    <FaBriefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm">Empregos</span>
                  </Link>
                </div>
                <Link href="/categorias" className="block text-primary hover:underline pt-1 font-medium text-sm">
                  Ver todas as categorias
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
      
      {/* Estilo para animação e eliminar a barra de rolagem horizontal */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </header>
  );
};

export default Header;