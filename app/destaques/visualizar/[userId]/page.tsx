"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaHourglassHalf, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { cleanImageUrl } from '../../../lib/utils';
import Avatar from '../../../components/Avatar';

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

interface Usuario {
  id: string;
  nome: string;
  avatar: string;
  isAdmin: boolean;
}

export default function VisualizarDestaquesPage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);

  // Buscar destaques do usuário específico
  useEffect(() => {
    const fetchDestaquesUsuario = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/destaques?userId=${userId}&onlyApproved=true`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar destaques do usuário');
        }
        
        const data = await response.json();
        console.log('Dados de destaques do usuário:', data);
        
        if (data.success && data.destaques && data.destaques.length > 0) {
          // Filtrar destaques ativos
          const now = new Date();
          const activeDestaques = data.destaques.filter((destaque: Destaque) => {
            const isApproved = destaque.status === 'approved' || destaque.moderationStatus === 'approved';
            if (!isApproved) return false;
            
            if (destaque.expiresAt) {
              const expiresAt = new Date(destaque.expiresAt);
              return expiresAt > now;
            }
            
            return true;
          });
          
          if (activeDestaques.length > 0) {
            setDestaques(activeDestaques);
            
            // Configurar dados do usuário baseado no primeiro destaque
            const firstDestaque = activeDestaques[0];
            
            // Melhorar lógica para nome do usuário
            let userName = firstDestaque.userName;
            if (!userName || userName === 'Anunciante') {
              // Se não tem nome ou é o fallback padrão, tentar outras fontes
              userName = 'Usuário'; // Fallback mais neutro
            }
            
            setUsuario({
              id: firstDestaque.userId,
              nome: userName,
              avatar: firstDestaque.userAvatar || '/images/placeholder.png',
              isAdmin: firstDestaque.priority && firstDestaque.priority >= 10
            });
          } else {
            setError('Nenhum destaque ativo encontrado para este usuário.');
          }
        } else {
          setError('Nenhum destaque encontrado para este usuário.');
        }
      } catch (err) {
        console.error('Erro ao buscar destaques do usuário:', err);
        setError('Não foi possível carregar os destaques deste usuário');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDestaquesUsuario();
    }
  }, [userId]);

  // Auto-play dos destaques
  useEffect(() => {
    if (!isPlaying || destaques.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % destaques.length);
    }, 5000); // 5 segundos por destaque

    return () => clearInterval(interval);
  }, [isPlaying, destaques.length]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + destaques.length) % destaques.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % destaques.length);
      } else if (e.key === 'Escape') {
        window.history.back();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [destaques.length, isPlaying]);

  const nextDestaque = () => {
    setCurrentIndex((prev) => (prev + 1) % destaques.length);
  };

  const prevDestaque = () => {
    setCurrentIndex((prev) => (prev - 1 + destaques.length) % destaques.length);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <FaHourglassHalf className="animate-pulse text-4xl mx-auto mb-3" />
          <p>Carregando destaques...</p>
        </div>
      </div>
    );
  }

  if (error || destaques.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md p-6">
          <p className="mb-4">{error || 'Nenhum destaque encontrado'}</p>
          <Link href="/destaques" className="text-blue-400 hover:underline">
            Voltar para destaques
          </Link>
        </div>
      </div>
    );
  }

  const currentDestaque = destaques[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Cabeçalho */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/destaques" 
              className="text-white hover:text-gray-300 transition-colors"
            >
              <FaArrowLeft className="text-lg" />
            </Link>
            
            {usuario && (
              <Link 
                href={`/loja/${usuario.id}`}
                className="flex items-center space-x-3 text-white hover:text-gray-300 transition-colors"
              >
                <div className="border border-white/30 rounded-full">
                  <Avatar
                    src={cleanImageUrl(usuario.avatar)}
                    alt={usuario.nome}
                    size={32}
                    fallbackName={usuario.nome}
                    showBorder={false}
                  />
                </div>
                <div>
                  <h2 className="font-medium text-sm">
                    {usuario.nome}
                    {usuario.isAdmin && (
                      <span className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded-full text-xs">
                        Admin
                      </span>
                    )}
                  </h2>
                </div>
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-gray-300 transition-colors"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <Link 
              href="/destaques" 
              className="text-white hover:text-gray-300 transition-colors"
            >
              <FaTimes className="text-lg" />
            </Link>
          </div>
        </div>
        
        {/* Indicador de progresso */}
        {destaques.length > 1 && (
          <div className="flex space-x-1 mt-3">
            {destaques.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative w-full h-full max-w-md mx-auto">
          {currentDestaque.mediaType === 'video' ? (
            <video
              src={cleanImageUrl(currentDestaque.mediaUrl)}
              className="w-full h-full object-contain"
              controls
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={cleanImageUrl(currentDestaque.mediaUrl)}
              alt={currentDestaque.title}
              fill
              className="object-contain"
              priority
            />
          )}
          
          {/* Navegação lateral */}
          {destaques.length > 1 && (
            <>
              <button
                onClick={prevDestaque}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
              >
                <FaChevronLeft className="text-2xl" />
              </button>
              
              <button
                onClick={nextDestaque}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
              >
                <FaChevronRight className="text-2xl" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rodapé com informações */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="max-w-md mx-auto text-white">
          <h3 className="font-semibold text-lg mb-2">{currentDestaque.title}</h3>
          {currentDestaque.description && (
            <p className="text-sm text-white/80 mb-2">{currentDestaque.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1" />
              <span>{new Date(currentDestaque.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {destaques.length > 1 && (
              <span>{currentIndex + 1} de {destaques.length}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Instruções de navegação */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
        <p>Use ← → para navegar • Espaço para pausar • ESC para sair</p>
      </div>
    </div>
  );
}