"use client";

import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../lib/authSync';

interface LikeButtonProps {
  highlightId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  highlightId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'medium',
  showCount = true,
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Tamanhos baseados na prop size
  const sizeClasses = {
    small: { icon: 14, container: 'text-sm px-2 py-1' },
    medium: { icon: 18, container: 'text-base px-3 py-2' },
    large: { icon: 22, container: 'text-lg px-4 py-2' }
  };

  const currentSize = sizeClasses[size];

  // Buscar status de curtida e contagem ao carregar
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchLikeStatus();
    } else {
      // Para usuários não logados, apenas buscar a contagem
      fetchLikeCount();
    }
  }, [highlightId, user?.id, isAuthenticated]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/destaques/${highlightId}/likes`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.userLiked || false);
        setLikeCount(data.totalLikes || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar status de curtida:', error);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const response = await fetch(`/api/destaques/${highlightId}/likes?countOnly=true`);
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.totalLikes || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de curtidas:', error);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated || !user?.id) {
      alert('Você precisa estar logado para curtir destaques');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const newLikedState = !liked;
    const optimisticCount = newLikedState ? likeCount + 1 : likeCount - 1;

    // Atualização otimista da UI
    setLiked(newLikedState);
    setLikeCount(optimisticCount);

    // Animação de curtida
    if (newLikedState) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 600);
    }

    try {
      const method = newLikedState ? 'POST' : 'DELETE';
      const response = await fetch(`/api/destaques/${highlightId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const actualCount = data.totalLikes || optimisticCount;
        setLikeCount(actualCount);
        onLikeChange?.(newLikedState, actualCount);

        console.log(`${newLikedState ? '❤️' : '💔'} [LikeButton] ${newLikedState ? 'Curtiu' : 'Descurtiu'} destaque:`, {
          highlightId,
          newCount: actualCount
        });
      } else {
        // Reverter em caso de erro
        setLiked(!newLikedState);
        setLikeCount(likeCount);
        throw new Error('Erro ao processar curtida');
      }
    } catch (error) {
      console.error('Erro ao curtir/descurtir:', error);
      // Reverter mudanças otimistas
      setLiked(!newLikedState);
      setLikeCount(likeCount);
      alert('Erro ao processar curtida. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLikeCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleLikeClick}
        disabled={isLoading}
        className={`
          flex items-center gap-2
          ${currentSize.container}
          rounded-full transition-all duration-200
          ${liked
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            : 'bg-black/20 text-white hover:bg-black/40'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:scale-105 active:scale-95
        `}
      >
        {/* Ícone de coração */}
        <div className="relative">
          {liked ? (
            <FaHeart
              size={currentSize.icon}
              className="text-red-500 drop-shadow-sm"
            />
          ) : (
            <FaRegHeart
              size={currentSize.icon}
              className="drop-shadow-sm"
            />
          )}

          {/* Animação de curtida */}
          {showAnimation && (
            <div className="absolute inset-0 animate-ping">
              <FaHeart
                size={currentSize.icon}
                className="text-red-500 opacity-75"
              />
            </div>
          )}
        </div>

        {/* Contador de curtidas */}
        {showCount && (
          <span className="font-medium drop-shadow-sm">
            {formatLikeCount(likeCount)}
          </span>
        )}
      </button>

      {/* Efeito de partículas ao curtir */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${20 + i * 10}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '600ms'
              }}
            >
              <FaHeart size={8 + i} className="text-red-500 opacity-70" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikeButton;