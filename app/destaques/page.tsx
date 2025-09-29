"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaHourglassHalf, FaPlay } from 'react-icons/fa';
import { cleanImageUrl } from '../lib/utils';
import Avatar from '../components/Avatar';

// Interface para os destaques
interface Destaque {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  expiresAt: string;
  priority?: number;
  moderationStatus?: string;
  status?: string;
}

export default function DestaquesPage() {
  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  
  // Buscar destaques
  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        setLoading(true);
        // Não filtrar apenas por status=approved, pois podemos ter destaques com moderation_status='approved'
        const response = await fetch('/api/destaques');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar destaques');
        }
        
        const data = await response.json();
        console.log('Dados de destaques recebidos:', data);
        
        if (data.success && data.destaques) {
          // A API já filtra destaques aprovados e não expirados, então apenas ordena
          console.log('📋 Destaques recebidos da API:', data.destaques);
          
          // Ordenar por prioridade (admin primeiro) e data de criação
          const sortedDestaques = data.destaques.sort((a: Destaque, b: Destaque) => {
            // Primeiro por prioridade (decrescente)
            if ((b.priority || 0) !== (a.priority || 0)) {
              return (b.priority || 0) - (a.priority || 0);
            }
            // Depois por data de criação (mais recente primeiro)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          console.log('📊 Destaques após ordenação:', sortedDestaques.length);
          setDestaques(sortedDestaques);
        } else {
          setDestaques([]);
        }
      } catch (err) {
        console.error('Erro ao buscar destaques:', err);
        setError('Não foi possível carregar os destaques');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDestaques();
    
    // Atualizar destaques a cada 5 minutos
    const interval = setInterval(fetchDestaques, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Se estiver carregando, mostrar indicador
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FaHourglassHalf className="animate-pulse text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Carregando destaques...</p>
        </div>
      </div>
    );
  }

  // Se ocorreu um erro
  if (error) {
  return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  // Se não houver destaques
  if (destaques.length === 0) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6">
          <p className="text-gray-500 mb-4">Não há destaques disponíveis no momento.</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Voltar para a página inicial
          </Link>
          </div>
      </div>
    );
  }

  // Agrupar destaques por usuário
  const destaquesPorUsuario = destaques.reduce((acc, destaque) => {
    const userId = destaque.userId || 'desconhecido';
    if (!acc[userId]) {
      acc[userId] = {
        usuario: {
          id: userId,
          nome: destaque.userName || 'Anunciante',
          avatar: destaque.userAvatar || '/images/placeholder.png',
          isAdmin: destaque.priority && destaque.priority >= 10
        },
        destaques: []
      };
    }
    acc[userId].destaques.push(destaque);
    return acc;
  }, {} as Record<string, { usuario: any, destaques: Destaque[] }>);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center">
          <Link href="/" className="text-gray-700 hover:text-gray-900 mr-3 md:mr-4">
            <FaArrowLeft className="text-base md:text-lg" />
          </Link>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">Destaques</h1>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <p className="text-sm md:text-base text-gray-700">
            Confira os destaques publicados pelos anunciantes do BuscaAquiBdC.
          </p>
        </div>
        
        {/* Lista de destaques por usuário (estilo Instagram) */}
        <div 
          ref={horizontalScrollRef}
          className="flex space-x-4 md:space-x-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar overscroll-x-contain touch-pan-x"
        >
          {Object.values(destaquesPorUsuario).map(({usuario, destaques}) => (
            <div 
              key={usuario.id} 
              className="flex-shrink-0 w-56 sm:w-64 md:w-72 bg-white rounded-lg shadow-md overflow-hidden snap-start"
            >
              {/* Cabeçalho do card com info do usuário */}
              <div className={`p-3 md:p-4 flex items-center space-x-3 ${usuario.isAdmin ? 'bg-green-50 border-b border-green-100' : 'border-b border-gray-100'}`}>
                <Link 
                  href={`/loja/${usuario.id}`}
                  className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  title={`Ver perfil de ${usuario.nome}`}
                >
                  <Avatar
                    src={cleanImageUrl(usuario.avatar)}
                    alt={usuario.nome}
                    size={40}
                    fallbackName={usuario.nome}
                    showBorder={true}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/loja/${usuario.id}`}
                    className="block hover:text-blue-600 transition-colors cursor-pointer"
                    title={`Ver perfil de ${usuario.nome}`}
                  >
                    <h3 className="font-medium text-gray-800 text-xs md:text-sm truncate">
                      {usuario.nome}
                      {usuario.isAdmin && (
                        <span className="ml-1 md:ml-2 px-1 md:px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-normal">
                          Admin
                        </span>
                      )}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500">{destaques.length} {destaques.length === 1 ? 'destaque' : 'destaques'}</p>
                </div>
              </div>
              
              {/* Preview do primeiro destaque - TODA A ÁREA CLICÁVEL */}
              <div className="relative">
                {/* Link para o perfil (área principal) */}
                <Link 
                  href={`/loja/${usuario.id}`} 
                  className="block hover:opacity-95 transition-opacity"
                  title={`Ver perfil de ${usuario.nome}`}
                >
                  <div className="relative aspect-[4/3] md:aspect-video bg-gray-200">
                    {destaques[0].mediaType === 'video' ? (
                      <video
                        src={destaques[0].mediaUrl}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <Image
                        src={cleanImageUrl(destaques[0].mediaUrl)}
                        alt={destaques[0].title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 224px, (max-width: 1024px) 256px, 288px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    
                    {/* Badge de quantidade de destaques */}
                    {destaques.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {destaques.length} itens
                      </div>
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 p-2 md:p-3">
                      <h3 className="text-white font-semibold text-xs md:text-sm mb-1 line-clamp-2 leading-tight">{destaques[0].title}</h3>
                      <div className="flex items-center text-xs text-white/80">
                        <FaCalendarAlt className="mr-1 flex-shrink-0" />
                        <span className="truncate">{new Date(destaques[0].createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    {/* Ícone de perfil para indicar que é clicável */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-black/50 text-white rounded-full p-1.5 md:p-2 hover:bg-black/70 transition-colors">
                        <FaUser size={10} className="md:w-3 md:h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Botão para visualizar destaques (sobreposto) */}
                <Link
                  href={`/destaques/visualizar/${usuario.id}`}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors z-10"
                  title="Visualizar destaques"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 md:p-3 hover:bg-white/30 transition-colors opacity-0 hover:opacity-100">
                    <FaPlay size={12} className="md:w-4 md:h-4" />
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}