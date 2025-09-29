"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaClock, FaLink } from 'react-icons/fa';
import { Highlight, HighlightModerationStatus } from '../models/types';

export default function HighlightsBanner() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/destaques?onlyApproved=true');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar destaques: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Filtrar apenas destaques aprovados e mapear para o formato esperado
          const approvedHighlights = data.destaques
            .filter((destaque: any) => 
              destaque.moderationStatus === HighlightModerationStatus.APPROVED
            )
            .map((destaque: any) => ({
              id: destaque.id,
              title: destaque.title,
              description: destaque.description,
              image: destaque.mediaUrl, // Mapear mediaUrl para image
              url: destaque.url || '/destaques', // Usar URL se disponível, senão ir para página de destaques
              createdAt: destaque.createdAt,
              updatedAt: destaque.updatedAt,
              status: destaque.status,
              position: destaque.priority,
              isActive: destaque.status === 'approved',
              userId: destaque.userId,
              userName: destaque.userName,
              userAvatar: destaque.userAvatar,
              moderationStatus: destaque.moderationStatus,
              moderationReason: destaque.moderationReason,
              moderatedAt: destaque.moderatedAt
            }));
          
          setHighlights(approvedHighlights);
        } else {
          throw new Error(data.error || 'Erro ao buscar destaques');
        }
      } catch (err) {
        console.error('Erro ao buscar destaques:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHighlights();
  }, []);

  useEffect(() => {
    // Configurar o temporizador para trocar os destaques automaticamente
    if (highlights.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % highlights.length);
      }, 7000); // Trocar a cada 7 segundos
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [highlights]);

  const goToHighlight = (index: number) => {
    // Resetar o temporizador ao mudar manualmente
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setCurrentIndex(index);
    
    // Reiniciar o temporizador
    if (highlights.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % highlights.length);
      }, 7000);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-300 h-[300px] w-full rounded-lg"></div>
    );
  }

  if (error || highlights.length === 0) {
    return null; // Não mostrar nada se houver erro ou nenhum destaque
  }

  const currentHighlight = highlights[currentIndex];

  return (
    <div className="relative mb-6">
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
        <Image
          src={currentHighlight.image}
          alt={currentHighlight.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 75vw"
          className="object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-white text-2xl font-bold mb-2">{currentHighlight.title}</h2>
            
            {currentHighlight.description && (
              <p className="text-white/90 mb-4">{currentHighlight.description}</p>
            )}
            
            <div className="flex items-center text-white/80 mb-4">
              {currentHighlight.userName && (
                <div className="flex items-center mr-4">
                  <FaUser className="mr-1" />
                  <span>{currentHighlight.userName}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <FaClock className="mr-1" />
                <span>{new Date(currentHighlight.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            
            <Link 
              href={currentHighlight.url} 
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaLink className="mr-2" />
              Saiba mais
            </Link>
          </div>
        </div>
      </div>
      
      {/* Indicadores */}
      {highlights.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => goToHighlight(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Ir para destaque ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}