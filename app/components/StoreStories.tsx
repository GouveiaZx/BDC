"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaTimes, FaPlay, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';

// Interface para os stories
interface Story {
  id: string;
  title: string;
  description?: string;
  image?: string; // ✅ Tornar opcional
  image_url?: string; // ✅ Adicionar campo da API
  media_url?: string; // ✅ Adicionar campo da API
  video_url?: string; // ✅ Adicionar campo de vídeo da API
  videoUrl?: string; // ✅ Formato alternativo para vídeo
  media_type?: string; // ✅ Tipo de mídia (image/video)
  createdAt: string;
  isAdmin?: boolean;
  userId?: string;
  userAvatar?: string;
  userName?: string;
  user_name?: string; // ✅ Adicionar formato alternativo da API
  user_avatar?: string; // ✅ Adicionar formato alternativo da API
}

// Interface para usuários com stories
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

// Função para limpar URLs de imagem
const cleanImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove caracteres especiais e espaços
  let cleanUrl = url.trim();
  
  // Se a URL não começar com http/https, adiciona o protocolo
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // Se começar com //, adiciona https:
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    }
    // Se começar com /, é uma URL relativa
    else if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl; // Mantém como está para URLs relativas
    }
    // Caso contrário, adiciona https://
    else {
      cleanUrl = 'https://' + cleanUrl;
    }
  }
  
  // Remove espaços e caracteres especiais que podem quebrar a URL
  cleanUrl = cleanUrl.replace(/\s+/g, '');
  
  // Verifica se a URL é válida
  try {
    new URL(cleanUrl);
    return cleanUrl;
  } catch {
    // Se não for uma URL válida, retorna string vazia
    return '';
  }
};

// Função para obter a melhor URL de imagem disponível
const getBestImageUrl = (story: Story): string => {
  // Debug: log dos dados do story
  console.log('Story data:', {
    id: story.id,
    title: story.title,
    media_url: story.media_url,
    image_url: story.image_url,
    image: story.image,
    media_type: story.media_type
  });
  
  // Prioridade: media_url > image_url > image
  const possibleUrls = [
    story.media_url,
    story.image_url,
    story.image
  ].filter(Boolean);
  
  console.log('Possible URLs:', possibleUrls);
  
  for (const url of possibleUrls) {
    const cleanUrl = cleanImageUrl(url!);
    console.log('Clean URL result:', { original: url, clean: cleanUrl });
    if (cleanUrl) return cleanUrl;
  }
  
  console.log('No valid URL found for story:', story.id);
  return '';
};

// Função para obter o melhor nome de usuário
const getBestUserName = (story: Story): string => {
  return story.user_name || story.userName || 'Usuário';
};

// Função para obter o melhor avatar de usuário
const getBestUserAvatar = (story: Story): string => {
  return story.user_avatar || story.userAvatar || '';
};

// Função para verificar se é um story de vídeo
const isVideoStory = (story: Story): boolean => {
  console.log('🎥 Checking if story is video:', {
    id: story.id,
    title: story.title,
    media_type: story.media_type,
    video_url: story.video_url,
    videoUrl: story.videoUrl,
    media_url: story.media_url,
    image_url: story.image_url,
    image: story.image,
    image_url_is_video: story.image_url?.startsWith('data:video/') ? 'SIM' : 'NÃO'
  });

  // Verifica o tipo de mídia
  if (story.media_type === 'video') {
    console.log('✅ Video detected by media_type');
    return true;
  }
  
  // Verifica se há URL de vídeo
  if (story.video_url || story.videoUrl) {
    console.log('✅ Video detected by video URL fields');
    return true;
  }
  
  // Verifica se image_url contém vídeo (data:video/)
  if (story.image_url && story.image_url.startsWith('data:video/')) {
    console.log('✅ Video detected by image_url containing data:video/');
    return true;
  }
  
  // Verifica extensões de vídeo nas URLs
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const urls = [story.media_url, story.image_url, story.image].filter(Boolean);
  
  const hasVideoExtension = urls.some(url => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  });

  if (hasVideoExtension) {
    console.log('✅ Video detected by file extension');
  } else {
    console.log('❌ No video detected for story:', story.title);
  }
  
  return hasVideoExtension;
};

// Função para obter a melhor URL de vídeo
const getBestVideoUrl = (story: Story): string => {
  console.log('🎬 Getting best video URL for story:', story.title);
  
  // Prioridade: video_url > videoUrl > image_url (se for data:video/) > media_url (se for vídeo)
  
  // Verificar video_url primeiro
  if (story.video_url) {
    const cleanUrl = cleanImageUrl(story.video_url);
    if (cleanUrl) {
      console.log('✅ Using video_url:', cleanUrl);
      return cleanUrl;
    }
  }
  
  // Verificar videoUrl
  if (story.videoUrl) {
    const cleanUrl = cleanImageUrl(story.videoUrl);
    if (cleanUrl) {
      console.log('✅ Using videoUrl:', cleanUrl);
      return cleanUrl;
    }
  }
  
  // Verificar se image_url contém vídeo (data:video/)
  if (story.image_url && story.image_url.startsWith('data:video/')) {
    console.log('✅ Using image_url (contains video data):', story.image_url.substring(0, 50) + '...');
    return story.image_url; // Não aplicar cleanImageUrl em data URLs
  }
  
  // Por último, verificar media_url se for vídeo
  if (story.media_url && isVideoStory(story)) {
    const cleanUrl = cleanImageUrl(story.media_url);
    if (cleanUrl) {
      console.log('✅ Using media_url (is video):', cleanUrl);
      return cleanUrl;
    }
  }
  
  console.log('❌ No valid video URL found for story:', story.title);
  return '';
};

const StoreStories: React.FC<StoreStoriesProps> = ({ stories, showTitle = false }) => {
  
  console.log('🎬 [StoreStories] Componente renderizado com:', { 
    stories, 
    showTitle,
    storiesType: typeof stories,
    storiesIsArray: Array.isArray(stories),
    storiesLength: stories ? stories.length : 'undefined',
    firstStory: stories && stories[0] ? stories[0] : 'nenhuma story'
  });
  
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
    console.log('🔄 [StoreStories] useEffect executado com stories:', {
      storiesLength: stories ? stories.length : 0,
      stories: stories
    });
    
    if (!stories || stories.length === 0) {
      console.log('⚠️ [StoreStories] Nenhum story encontrado, saindo do useEffect');
      setUsersWithStories([]);
      return;
    }
    
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
          userName: getBestUserName(story) || 'Admin',
          userAvatar: getBestUserAvatar(story) || '/logo.png',
          isAdmin: true,
          stories: []
        });
      }
      usersMap.get(userId)!.stories.push(story);
    });
    
    // Depois processar stories de usuários
    userStories.forEach(story => {
      const userId = story.userId || 'user';
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId,
          userName: getBestUserName(story) || 'Usuário',
          userAvatar: getBestUserAvatar(story) || '',
          isAdmin: false,
          stories: []
        });
      }
      usersMap.get(userId)!.stories.push(story);
    });
    
    const finalUsersWithStories = Array.from(usersMap.values());
    console.log('✅ [StoreStories] usersWithStories criado:', {
      totalUsers: finalUsersWithStories.length,
      users: finalUsersWithStories
    });
    
    setUsersWithStories(finalUsersWithStories);
  }, [stories]);

  // Verificar se precisa mostrar setas de navegação
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowArrows(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [usersWithStories]);

  // Controle de progresso do story
  useEffect(() => {
    if (!viewingStory || viewingStory.length === 0) return;
    
    setStoryProgress(0);
    
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



  // Funções de controle dos stories
  const openStory = (userStories: Story[], startIndex: number = 0) => {
    setCurrentUserStories(userStories);
    setViewingStory(userStories);
    setStoryIndex(startIndex);
    setStoryProgress(0);
  };

  const closeStory = () => {
    setViewingStory(null);
    setCurrentUserStories([]);
    setStoryIndex(0);
    setStoryProgress(0);
  };

  const nextStory = () => {
    if (storyIndex < currentUserStories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setStoryProgress(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setStoryProgress(0);
    }
  };

  // Funções de navegação horizontal
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Lista horizontal de stories agrupados por usuário */}
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        {showTitle && (
          <div className="px-6 py-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#7ad38e] to-[#5baf6f] rounded-full flex items-center justify-center mr-4 shadow-sm">
                <FaPlay className="text-white text-base ml-0.5" />
              </div>
              Destaques
             </h2>
          </div>
        )}
        
        {/* Verificar se há stories para exibir */}
        {(() => {
          console.log('🎯 [StoreStories] Verificando condição de renderização:', {
            storiesLength: stories ? stories.length : 0,
            usersWithStoriesLength: usersWithStories.length,
            usersWithStories: usersWithStories,
            shouldShow: stories && stories.length > 0 && usersWithStories.length > 0
          });
          // Aguardar o processamento: só mostrar "nenhum destaque" se stories existe mas usersWithStories está vazio
          return stories && stories.length > 0 && usersWithStories.length > 0;
        })() ? (
          <div className="relative">
            {/* Setas de navegação */}
            {showArrows && (
              <>
                <button
                  onClick={scrollLeft}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <FaChevronLeft className="text-gray-600 text-base" />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <FaChevronRight className="text-gray-600 text-base" />
                </button>
              </>
            )}
            
            {/* Container dos stories */}
            <div 
              ref={scrollContainerRef}
              className="flex space-x-8 overflow-x-auto pb-8 scrollbar-none px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {usersWithStories.map((user) => (
              <div key={user.userId} className="flex-shrink-0">
                <div 
                  className="relative w-32 h-44 cursor-pointer group transition-transform duration-300 hover:scale-105"
                  onClick={() => openStory(user.stories)}
                >
                  {/* Container principal sem fundo */}
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    
                    {/* Imagem de fundo ou fallback com gradiente */}
                    {getBestImageUrl(user.stories[0]) ? (
                      <Image
                        src={getBestImageUrl(user.stories[0])}
                        alt={user.stories[0].title}
                        fill
                        className="object-cover"
                        sizes="128px"
                        onError={(e) => {
                          console.error('Image failed to load:', getBestImageUrl(user.stories[0]));
                          // Esconder a imagem e mostrar o fallback
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', getBestImageUrl(user.stories[0]));
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback sempre presente, mas só visível se não houver imagem ou se ela falhar */}
                    <div className={`w-full h-full flex items-center justify-center text-white text-2xl font-bold ${
                      user.isAdmin 
                        ? 'bg-gradient-to-br from-[#7ad38e] via-[#5baf6f] to-[#8CE7A4]' 
                        : 'bg-gradient-to-br from-[#8CE7A4] via-[#7ad38e] to-[#5baf6f]'
                    } ${getBestImageUrl(user.stories[0]) ? 'absolute inset-0 -z-10' : ''}`}>
                      {user.userName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Overlay gradiente para melhor contraste */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
                      
                    {/* Avatar do usuário no topo */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`w-12 h-12 rounded-full p-[2px] shadow-lg ${
                        user.isAdmin 
                          ? 'bg-gradient-to-tr from-[#7ad38e] to-[#5baf6f]' 
                          : 'bg-gradient-to-tr from-[#8CE7A4] to-[#7ad38e]'
                      }`}>
                        <div className="w-full h-full rounded-full bg-white p-[1px]">
                          <Avatar
                            src={user.userAvatar}
                            alt={user.userName}
                            size={0}
                            fallbackName={user.userName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores no canto superior direito */}
                    <div className="absolute top-4 right-4 flex gap-1">
                      {user.stories.length > 1 && (
                        <div className="bg-black/50 text-white text-sm px-2.5 py-1 rounded-full font-medium">
                          {user.stories.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Nome do usuário na parte inferior */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-base font-medium break-words leading-tight">
                        {user.userName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            {/* Se stories existe mas usersWithStories ainda está vazio, mostrar loading */}
            {stories && stories.length > 0 && usersWithStories.length === 0 ? (
              <div className="text-gray-500 text-lg">
                <div className="animate-spin w-8 h-8 border-2 border-[#7ad38e] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Carregando destaques...</p>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <FaUser className="mx-auto mb-4 text-4xl" />
                <p>Nenhum destaque disponível no momento</p>
                <p className="text-sm mt-2">Volte mais tarde para ver novos conteúdos!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de visualização dos stories */}
      {viewingStory && currentUserStories.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="relative w-full max-w-md h-full max-h-[80vh] bg-black rounded-lg overflow-hidden">
            
            {/* Barra de progresso */}
            <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
              {currentUserStories.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#7ad38e] to-[#8CE7A4] transition-all duration-100 ease-linear"
                    style={{ 
                      width: index < storyIndex ? '100%' : 
                             index === storyIndex ? `${storyProgress}%` : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Botão fechar */}
            <button
              onClick={closeStory}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <FaTimes className="text-white text-sm" />
            </button>
            
            {/* Controles laterais invisíveis */}
            <div className="absolute inset-0 flex">
              <div 
                className="w-1/3 h-full cursor-pointer z-10"
                onClick={prevStory}
              />
              <div 
                className="w-1/3 h-full cursor-pointer z-10"
                onClick={() => setStoryProgress(0)}
              />
              <div 
                className="w-1/3 h-full cursor-pointer z-10"
                onClick={nextStory}
              />
            </div>
            
            {/* Conteúdo do story */}
            {currentUserStories[storyIndex] && (
              <div className="relative w-full h-full bg-gray-900">
                {isVideoStory(currentUserStories[storyIndex]) ? (
                  <video
                    src={getBestVideoUrl(currentUserStories[storyIndex])}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    onError={(e) => {
                      console.error('Video failed to load:', getBestVideoUrl(currentUserStories[storyIndex]));
                    }}
                  />
                ) : (
                  <>
                    {getBestImageUrl(currentUserStories[storyIndex]) ? (
                      <Image
                        src={getBestImageUrl(currentUserStories[storyIndex])}
                        alt={currentUserStories[storyIndex].title}
                        fill
                        className="object-cover"
                        priority
                        onError={(e) => {
                          console.error('Modal image failed to load:', getBestImageUrl(currentUserStories[storyIndex]));
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Modal image loaded successfully:', getBestImageUrl(currentUserStories[storyIndex]));
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback para quando não há imagem */}
                    <div className={`w-full h-full flex flex-col items-center justify-center text-white ${
                      getBestImageUrl(currentUserStories[storyIndex]) ? 'absolute inset-0 -z-10' : ''
                    }`}>
                      <div className="w-24 h-24 bg-gradient-to-br from-[#7ad38e] to-[#5baf6f] rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                        {currentUserStories[storyIndex].title.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-lg font-medium text-center px-4">
                        {currentUserStories[storyIndex].title}
                      </p>
                    </div>
                  </>
                )}
                
                {/* Overlay com informações */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    {currentUserStories[storyIndex].title}
                  </h3>
                  {currentUserStories[storyIndex].description && (
                    <p className="text-white/90 text-sm">
                      {currentUserStories[storyIndex].description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreStories;