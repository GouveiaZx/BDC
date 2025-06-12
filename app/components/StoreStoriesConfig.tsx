"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

// Interface para o tipo de Story
interface Story {
  id: string;
  title: string;
  description?: string;
  image: string;
  createdAt: string;
}

interface StoreStoriesConfigProps {
  stories: Story[];
  showTitle?: boolean;
  showViewAll?: boolean;
  sellerId?: string | number;
  hideNavigation?: boolean;
  className?: string;
}

const StoreStoriesConfig: React.FC<StoreStoriesConfigProps> = ({ 
  stories, 
  showTitle = true, 
  showViewAll = true,
  sellerId,
  hideNavigation = false,
  className = ''
}) => {
  // Estado para controle dos stories
  const [viewingStory, setViewingStory] = useState<Story[] | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const storyDuration = 5000; // 5 segundos por story
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Função para abrir os stories
  const openStory = (initialIndex: number = 0) => {
    setViewingStory(stories);
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
  }, [stories]);
  
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
  if (!stories || stories.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Cabeçalho com título e link "Ver todos" */}
      {showTitle && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Stories
          </h2>
          {showViewAll && sellerId && (
            <Link href={`/empresa/${sellerId}/todos-stories`} className="text-blue-600 text-xs hover:underline">
              Ver todos
            </Link>
          )}
        </div>
      )}

      {/* Lista horizontal de stories */}
      <div className="relative">
        {showArrows && !hideNavigation && (
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
          className="flex space-x-6 overflow-x-auto hide-scrollbar py-3 px-6 mt-2 scroll-snap-x"
        >
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              className="flex-shrink-0 cursor-pointer flex flex-col items-center scroll-snap-start"
              onClick={() => openStory(index)}
            >
              <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-primary p-1 hover:scale-110 transition-transform duration-200">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image 
                    src={story.image} 
                    alt={story.title} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <FaPlay className="text-white text-xs" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-center mt-3 truncate max-w-[90px] font-medium">
                {story.title.length > 10 ? `${story.title.substring(0, 10)}...` : story.title}
              </p>
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
                      src={viewingStory[storyIndex].image}
                      alt={viewingStory[storyIndex].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority
                    />
                  </div>
                  <div className="bg-black bg-opacity-50 p-4">
                    <h3 className="text-white text-lg font-bold">{viewingStory[storyIndex].title}</h3>
                    {viewingStory[storyIndex].description && (
                      <p className="text-white text-sm mt-1">{viewingStory[storyIndex].description}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(viewingStory[storyIndex].createdAt).toLocaleDateString('pt-BR')}
                    </p>
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

export default StoreStoriesConfig; 