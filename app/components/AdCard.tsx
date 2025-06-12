"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaWhatsapp, FaEye, FaClock, FaMapMarkerAlt, FaCheckCircle, FaRegStar, FaStar, FaImages } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { VerifiedBadge } from './VerifiedBadge';
import { Ad } from '../models/types';
import useWhatsAppWarning from '../hooks/useWhatsAppWarning';
import WhatsAppWarningModal from './WhatsAppWarningModal';
import ReportButton from './ReportButton';
import { formatPrice, formatRelativeDate, formatViews, truncateText } from '../lib/utils';

/**
 * Props para o componente AdCard
 */
interface AdCardProps {
  /** Dados do anúncio a ser exibido */
  ad: Ad;
  /** Se verdadeiro, exibe o anúncio como destaque com visual diferenciado */
  featured?: boolean;
  /** Callback executado quando o usuário clica no botão de favoritar */
  onFavoriteToggle?: (adId: string, isFavorite: boolean) => void;
}

/**
 * Função utilitária para limpar URLs de imagens com aspas extras
 * @param url - URL da imagem a ser limpa
 * @returns URL limpa ou placeholder padrão
 */
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

/**
 * Componente AdCard - Exibe um cartão de anúncio com informações principais
 * 
 * Este componente renderiza um cartão responsivo contendo:
 * - Imagem principal do anúncio
 * - Título e preço
 * - Descrição resumida
 * - Informações do vendedor
 * - Botões de ação (favoritar, WhatsApp)
 * - Dados de localização e tempo
 * 
 * @param props - Props do componente
 * @returns JSX.Element
 */
const AdCard: React.FC<AdCardProps> = ({ ad, featured = false, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = useState(ad.isFavorite || false);
  
  // Hook para gerenciar o modal de aviso do WhatsApp
  const {
    isWhatsAppModalOpen,
    currentPhoneNumber,
    openWhatsAppModal,
    closeWhatsAppModal,
    proceedToWhatsApp
  } = useWhatsAppWarning();
  
  /**
   * Alterna o estado de favorito do anúncio
   */
  const toggleFavorite = () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    if (onFavoriteToggle) {
      onFavoriteToggle(ad.id, newState);
    }
  };
  
  /**
   * Handler para clique no botão WhatsApp
   * Abre modal de confirmação antes de redirecionar
   */
  const handleWhatsAppClick = () => {
    if (ad.whatsapp) {
      const message = `Olá! Vi seu anúncio "${ad.title}" no site e gostaria de mais informações.`;
      openWhatsAppModal(ad.whatsapp, message);
    }
  };
  
  /**
   * Calcula a média das avaliações do anúncio
   * @returns Média das avaliações ou 0 se não houver avaliações
   */
  const getRating = () => {
    if (!ad.ratings || ad.ratings.length === 0) return 0;
    const sum = ad.ratings.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / ad.ratings.length).toFixed(1));
  };
  
  const rating = getRating();
  
  // Garantir que temos uma imagem para exibir
  const adImage = ad.images && ad.images.length > 0 
    ? cleanImageUrl(ad.images[0]) 
    : '/images/placeholder.png';

  return (
    <>
    <Link href={`/anuncio/${ad.id}`} className="block h-full">
      <div 
        className={`card bg-white border border-gray-200 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-lg relative h-full flex flex-col ${
          featured ? 'ring-2 ring-primary' : ''
        }`}
      >
        {/* Badge de destaque */}
        {featured && (
          <div className="absolute top-3 left-3 z-10 bg-white text-primary text-xs font-bold py-1 px-3 rounded-full shadow-lg border border-primary">
            Anúncio Destaque
          </div>
        )}
        
        {/* Data de publicação */}
        <div className="absolute top-3 right-3 z-10 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded-full flex items-center">
          <FaClock className="mr-1" />
          {formatRelativeDate(ad.createdAt)}
        </div>
        
        {/* Imagem do anúncio */}
        <div className="relative h-48 md:h-56 w-full flex-shrink-0">
          <Image
            src={adImage}
            alt={ad.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            priority={featured}
            className={`transition-opacity duration-300 group-hover:opacity-90 ${featured ? 'brightness-105 contrast-105' : ''}`}
          />
          
          {/* Indicador de quantidade de imagens */}
          {ad.images && ad.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded-full">
              {ad.images.length} fotos
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          {/* Preço e título */}
          <div>
            <h4 className={`text-md font-bold line-clamp-2 ${
              featured ? 'text-black text-[1.1rem] drop-shadow-sm' : 'text-black'
            }`}>
              {truncateText(ad.title, 45)}
              {featured && <span className="ml-1 text-yellow-500">★</span>}
            </h4>
            <div className="flex justify-between items-start mt-1">
              <h3 className={`text-xl font-bold text-primary`}>
                {formatPrice(ad.price)}
              </h3>
            </div>
          </div>
          
          {/* Descrição */}
          <p className="text-sm text-gray-700 my-2 line-clamp-2">
            {truncateText(ad.description, 85)}
          </p>
          
          {/* Dados do vendedor */}
          <div className="flex items-start border-b border-gray-300 pb-2 mb-2">
            <div 
              className="relative h-10 w-10 mr-3 flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ad.userId) {
                  window.location.href = `/loja/${ad.userId}`;
                } else if (ad.id) {
                  // Se o userId não estiver disponível, usar o id do anúncio para obter o perfil do vendedor
                  window.location.href = `/api/anuncio/${ad.id}/vendedor`;
                } else {
                  console.warn("ID do vendedor não disponível");
                }
              }}
            >
              <Image 
                src={ad.userAvatar ? cleanImageUrl(ad.userAvatar) : '/images/avatar-placeholder.png'} 
                alt={ad.userName || 'Avatar do vendedor'}
                fill
                sizes="40px"
                style={{ objectFit: 'cover' }}
                className="rounded-full"
              />
              {ad.seller?.hasStories && (
                <div className="absolute inset-0 border-2 border-primary rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <div 
                  className="font-medium text-sm text-black hover:text-primary cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ad.userId) {
                      window.location.href = `/loja/${ad.userId}`;
                    } else if (ad.id) {
                      // Se o userId não estiver disponível, usar o id do anúncio para obter o perfil do vendedor
                      window.location.href = `/api/anuncio/${ad.id}/vendedor`;
                    } else {
                      console.warn("ID do vendedor não disponível");
                    }
                  }}
                >
                  {ad.userName || "Vendedor"}
                </div>
                {ad.user && ad.user.isVerified && (
                  <VerifiedBadge size="sm" />
                )}
                <div className="flex items-center text-xs text-gray-700 ml-1 flex-shrink-0">
                  <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {(ad.city && ad.state) ? `${ad.city}, ${ad.state}` : 
                     ad.location ? ad.location :
                     "Localização não informada"}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-700 mt-1 flex-wrap gap-2">
                <div className="flex items-center">
                  <FaStar className="text-yellow-500 mr-1 flex-shrink-0" />
                  <span>{getRating()}</span>
                </div>
                <div className="flex items-center">
                  <FaEye className="text-gray-500 mr-1 flex-shrink-0" />
                  <span>{formatViews(ad.views || 0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rodapé do card */}
          <div className="flex justify-between items-center mt-auto pt-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite();
              }}
              className="text-gray-500 hover:text-primary"
              aria-label="Toggle favorite"
            >
              {isFavorite ? <FaHeart className="text-primary" /> : <FaRegHeart />}
            </button>
            
            {ad.whatsapp && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWhatsAppClick();
                }}
                className="flex items-center text-sm text-green-600 font-medium hover:text-green-700"
                aria-label="Contact via WhatsApp"
              >
                <FaWhatsapp className="mr-1" />
                WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
    
    {/* Modal de aviso do WhatsApp */}
    {isWhatsAppModalOpen && (
      <WhatsAppWarningModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
        onProceed={proceedToWhatsApp}
        phoneNumber={currentPhoneNumber}
      />
    )}
    </>
  );
};

export default AdCard; 