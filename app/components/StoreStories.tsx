"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaTimes, FaPlay, FaChevronLeft, FaChevronRight, FaUser, FaExternalLinkAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Interface para o tipo de Story
interface Story {
  id: string;
  title: string;
  description?: string;
  image: string;
  createdAt: string;
  isAdmin?: boolean;
  userId?: string;
  userAvatar?: string;
  userName?: string;
}

// Interface para usuário com múltiplos stories
interface UserWithStories {
  userId: string;
  userName: string;
  userAvatar: string;
  isAdmin: boolean;
  stories: Story[];
}

interface StoreStoriesProps {
  stories: Story[];
  showTitle?: boolean;
}

// Função para limpar URLs de imagens com aspas extras
const cleanImageUrl = (url: string): string => {
  if (!url) return '/images/placeholder.png';
  
  // Limpar aspas extras e caracteres de escape
  let cleanUrl = url;
  if (typeof url === 'string') {
    // Remover aspas duplas extras e caracteres de escape
    cleanUrl = url.replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, '');
    
    // Se após a limpeza ainda tiver aspas, fazer nova tentativa
    if (cleanUrl.includes('\"')) {
      cleanUrl = cleanUrl.replace(/\"/g, '');
    }
  }
  
  return cleanUrl;
};

const StoreStories: React.FC<StoreStoriesProps> = ({ stories, showTitle = false }) => {
  // Estado para controle dos stories
  const [viewingStory, setViewingStory] = useState<Story[] | null>(null);
  const [currentUserStories, setCurrentUserStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const storyDuration = 5000; // 5 segundos por story
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Agrupar stories por usuário
  const [usersWithStories, setUsersWithStories] = useState<UserWithStories[]>([]);
  
  // Agrupar stories por usuário ao receber as stories
  useEffect(() => {
    if (!stories || stories.length === 0) return;
    
    const usersMap = new Map<string, UserWithStories>();
    
    // Priorizar stories de admin (colocá-los no início)
    const adminStories: Story[] = [];
    const userStories: Story[] = [];
    
    stories.forEach(story => {
      if (story.isAdmin) {
        adminStories.push(story);
      } else {
        userStories.push(story);
      }
    });
    
    // Processar primeiro os stories de admin
    adminStories.forEach(story => {
      const userId = story.userId || 'admin';
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId,
          userName: story.userName || 'Admin',
          userAvatar: story.userAvatar || '/logo.png',
          isAdmin: true,
          stories: []
        });
      }
      usersMap.get(userId)?.stories.push(story);
    });
    
    // Depois processar os stories de usuários normais
    userStories.forEach(story => {
      const userId = story.userId || 'unknown';
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId,
          userName: story.userName || 'Usuário',
          userAvatar: story.userAvatar || '/images/placeholder.png',
          isAdmin: false,
          stories: []
        });
      }
      usersMap.get(userId)?.stories.push(story);
    });
    
    // Ordenar dentro de cada grupo de usuário (mais recentes primeiro) - para miniatura na tela inicial
    usersMap.forEach(user => {
      user.stories.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    
    // Converter o Map para array para usar no componente
    setUsersWithStories(Array.from(usersMap.values()));
  }, [stories]);
  
  // Função para abrir os stories de um usuário específico
  const openUserStories = (user: UserWithStories, initialIndex: number = 0) => {
    // Ordenar do mais antigo para o mais novo antes de abrir - para visualização
    const storiesOrdenados = [...user.stories].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    setCurrentUserStories(storiesOrdenados);
    setViewingStory(storiesOrdenados);
    setStoryIndex(initialIndex);
    setStoryProgress(0);
    document.body.style.overflow = 'hidden'; // Impede rolagem da página
  };
  
  // Função para fechar os stories
  const closeStory = () => {
    setViewingStory(null);
    document.body.style.overflow = ''; // Restaura rolagem da página
  };
  
  // Função para navegar para o próximo story
  const nextStory = () => {
    if (viewingStory && storyIndex < viewingStory.length - 1) {
      setStoryIndex(storyIndex + 1);
      setStoryProgress(0);
    } else {
      closeStory();
    }
  };
  
  // Função para navegar para o story anterior
  const prevStory = () => {
    if (viewingStory && storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setStoryProgress(0);
    }
  };
  
  // Scroll horizontal para navegação
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };
  
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };
  
  // Detectar se há overflow para mostrar as setas
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setShowArrows(container.scrollWidth > container.clientWidth);
      
      const checkOverflow = () => {
        setShowArrows(container.scrollWidth > container.clientWidth);
      };
      
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }
  }, [usersWithStories]);
  
  // Efeito para controlar o progresso dos stories
  useEffect(() => {
    if (!viewingStory) return;
    
    let interval: NodeJS.Timeout;
    let startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed / storyDuration) * 100;
      
      if (progress >= 100) {
        nextStory();
      } else {
        setStoryProgress(progress);
      }
    };
    
    interval = setInterval(updateProgress, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [viewingStory, storyIndex]);

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') nextStory();
      if (e.key === 'ArrowLeft') prevStory();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyIndex]);

  // Se não houver stories, não renderiza nada
  if (!stories || stories.length === 0 || usersWithStories.length === 0) return null;

  return (
    <div className="relative">
      {/* Lista horizontal de stories agrupados por usuário */}
      <div className="relative">
        {showArrows && (
          <>
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 opacity-75 hover:opacity-100 transition-opacity"
              onClick={scrollLeft}
            >
              <FaChevronLeft className="text-gray-700" />
            </button>
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 opacity-75 hover:opacity-100 transition-opacity"
              onClick={scrollRight}
            >
              <FaChevronRight className="text-gray-700" />
            </button>
          </>
        )}
        
        <div 
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto hide-scrollbar py-3 px-6 mt-2 scroll-snap-x overscroll-x-contain touch-pan-x"
        >
        {usersWithStories.map((user) => (
          <div 
            key={user.userId} 
              className="flex-shrink-0 cursor-pointer flex flex-col items-center scroll-snap-start"
            onClick={() => openUserStories(user)}
          >
            <div className={`relative w-18 h-18 sm:w-24 sm:h-24 rounded-full overflow-hidden p-1 hover:scale-110 transition-transform duration-200 ${
              user.isAdmin 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-2 border-emerald-600 shadow-md shadow-green-300/40' 
                : 'bg-gradient-to-r from-primary to-primary-light border-2 border-primary-dark'
            }`}>
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image 
                  src={cleanImageUrl(user.userAvatar || (user.stories[0]?.image || '/images/placeholder.png'))} 
                  alt={user.userName} 
                  fill 
                  className="object-cover" 
                    sizes="(max-width: 640px) 80px, 96px"
                />
                {user.stories.length > 1 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {user.stories.length}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <FaPlay className="text-white text-xs" />
                </div>
                {user.isAdmin && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                    <div className="bg-green-500 text-white text-[9px] rounded-md px-2 py-0.5 shadow-md font-bold">
                      Admin
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <p className={`text-sm text-center mt-3 truncate max-w-[90px] font-medium ${user.isAdmin ? 'text-green-600' : ''}`}>
              {user.userName.length > 10 ? `${user.userName.substring(0, 10)}...` : user.userName}
            </p>
              {!user.isAdmin && user.userId && (
                <p 
                  className="text-xs text-gray-400 text-center truncate max-w-[90px] hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navegar para a página da loja com o ID do usuário
                    router.push(`/loja/${user.userId}`);
                  }}
                >
                  {user.stories.length > 1 ? `${user.stories.length} destaques` : '1 destaque'}
                </p>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Modal de visualização dos stories */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          {/* Barra de progresso no topo */}
          <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2">
            {viewingStory.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                {idx === storyIndex && (
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear" 
                    style={{ width: `${storyProgress}%` }} 
                  />
                )}
                {idx < storyIndex && (
                  <div className="h-full bg-white w-full" />
                )}
              </div>
            ))}
          </div>
          
          {/* Botão fechar */}
          <button 
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-3 rounded-full z-50 hover:bg-opacity-70" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeStory();
            }}
          >
            <FaTimes className="text-xl" />
          </button>
          
          {/* Controles laterais com botões visíveis */}
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-3 rounded-full z-40 hover:bg-opacity-70 transition-opacity md:opacity-50 opacity-80 md:hover:opacity-100"
            onClick={prevStory}
            disabled={storyIndex === 0}
            style={{ opacity: storyIndex === 0 ? 0.3 : undefined }}
          >
            <FaChevronLeft className="text-white text-xl" />
          </button>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-3 rounded-full z-40 hover:bg-opacity-70 transition-opacity md:opacity-50 opacity-80 md:hover:opacity-100"
            onClick={nextStory}
            disabled={storyIndex === viewingStory.length - 1}
            style={{ opacity: storyIndex === viewingStory.length - 1 ? 0.3 : undefined }}
          >
            <FaChevronRight className="text-white text-xl" />
          </button>
          
          {/* Áreas clicáveis maiores para navegação */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-30" onClick={(e) => {
            e.stopPropagation();
            prevStory();
          }} />
          <div className="absolute inset-y-0 right-0 w-1/4 z-30" onClick={(e) => {
            e.stopPropagation();
            nextStory();
          }} />
          
          {/* Conteúdo do story */}
          <div className="w-full max-w-md md:max-w-lg h-full max-h-[90vh] relative">
            <div className="absolute inset-0 flex flex-col">
              {viewingStory[storyIndex] && (
                <>
                  <div className="relative flex-1">
                    <Image
                      src={cleanImageUrl(viewingStory[storyIndex].image)}
                      alt={viewingStory[storyIndex].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority
                    />
                    
                    {/* Perfil do anunciante */}
                    <div className="absolute top-4 left-4 flex items-center z-10">
                      {viewingStory[storyIndex].userAvatar ? (
                        <div className={`relative ${!viewingStory[storyIndex].isAdmin && viewingStory[storyIndex].userId ? 'cursor-pointer' : ''}`}>
                          <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${viewingStory[storyIndex].isAdmin ? 'border-green-500' : 'border-white'} relative`}>
                            <Image
                              src={cleanImageUrl(viewingStory[storyIndex].userAvatar)}
                              alt={viewingStory[storyIndex].userName || ''}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                            {!viewingStory[storyIndex].isAdmin && viewingStory[storyIndex].userId && (
                              <div className="absolute bottom-0 right-0 bg-primary rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                                <FaUser size={8} className="text-white" />
                              </div>
                            )}
                          </div>
                          {!viewingStory[storyIndex].isAdmin && viewingStory[storyIndex].userId && (
                            <Link 
                              href={`/loja/${viewingStory[storyIndex].userId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeStory();
                              }}
                              className="absolute inset-0 z-10"
                            >
                              <span className="sr-only">Ver perfil</span>
                            </Link>
                          )}
                        </div>
                      ) : null}
                      <div className="ml-2 relative">
                        <p className="text-white text-sm font-medium drop-shadow-md">
                          {viewingStory[storyIndex].userName || 'Anunciante'}
                          {viewingStory[storyIndex].isAdmin && (
                            <span className="ml-1 inline-block bg-green-500 text-white text-[9px] rounded-full px-2 py-0.5 shadow-md font-bold">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-white/70 text-xs drop-shadow-md">
                          {new Date(viewingStory[storyIndex].createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        
                        {/* Link para perfil no nome também */}
                        {!viewingStory[storyIndex].isAdmin && viewingStory[storyIndex].userId && (
                          <div className="absolute -right-5 top-0">
                            <Link 
                              href={`/loja/${viewingStory[storyIndex].userId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeStory();
                              }}
                              className="flex items-center justify-center bg-primary rounded-full p-1 text-white hover:bg-primary-dark transition-colors duration-200 shadow-md"
                              title="Ver perfil do anunciante"
                            >
                              <FaExternalLinkAlt size={10} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Gradiente para garantir a legibilidade do texto */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                  </div>
                  <div className={`p-4 ${viewingStory[storyIndex].isAdmin ? 'bg-gradient-to-r from-green-900 to-emerald-900' : 'bg-black bg-opacity-70'}`}>
                    <h3 className="text-white text-lg font-bold">{viewingStory[storyIndex].title}</h3>
                    {viewingStory[storyIndex].description && (
                      <p className="text-white text-sm mt-1">{viewingStory[storyIndex].description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .scroll-snap-x {
          scroll-snap-type: x mandatory;
        }
        .scroll-snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </div>
  );
};

export default StoreStories; 