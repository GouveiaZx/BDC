"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaEye, FaWhatsapp, FaPhone } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { VerifiedBadge } from './VerifiedBadge';
import useWhatsAppWarning from '../hooks/useWhatsAppWarning';
import WhatsAppWarningModal from './WhatsAppWarningModal';
import Avatar from './Avatar';

interface Company {
  id: string | number;
  name: string;
  type: string;
  logo: string;
  banner: string;
  address: string;
  rating?: number;
  description: string;
  phone: string;
  verified: boolean;
  plan?: string;
  userId?: string; // ID do usuário dono da empresa
}

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  // Estado para armazenar o número de visualizações e rating real
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [realRating, setRealRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Adicionar hook para gerenciar o modal de aviso do WhatsApp
  const {
    isWhatsAppModalOpen,
    currentPhoneNumber,
    openWhatsAppModal,
    closeWhatsAppModal,
    proceedToWhatsApp
  } = useWhatsAppWarning();

  // Buscar contagem de visualizações e dados reais da empresa ao carregar o componente
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        // Só buscar se tivermos um ID válido
        if (!company.id) {
          setIsLoading(false);
          return;
        }
        
        // Buscar visualizações da API
        const viewsResponse = await fetch(`/api/businesses/views?businessId=${company.id}`);
        
        if (viewsResponse.ok) {
          const viewsData = await viewsResponse.json();
          if (viewsData.success) {
            setViewCount(viewsData.views);
          }
        }
        
        // Buscar dados reais da empresa incluindo rating e reviews
        const companyResponse = await fetch(`/api/businesses/company-data?businessId=${company.id}`);
        
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          if (companyData.success && companyData.data) {
            setRealRating(companyData.data.rating || 0);
            setReviewsCount(companyData.data.reviews_count || 0);
          }
        } else {
          // Se a API não existir ainda, usar dados que já vêm do componente
          setRealRating(company.rating || 0);
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        // Usar dados que já vêm do componente como fallback
        setRealRating(company.rating || 0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyData();
  }, [company.id, company.rating]);

  // Função para formatar o número de visualizações
  const formatViewCount = (count: number | null): string => {
    if (count === null) return '0 visualizações';
    
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K visualizações`;
    }
    
    return `${count} visualizações`;
  };

  // Função para formatar rating com estrelas
  const formatRating = (rating: number | null): string => {
    if (rating === null || rating === 0) return '0.0';
    return rating.toFixed(1);
  };

  // Função para limpar URLs de imagens
  const cleanImageUrl = (url: string, fallback: string): string => {
    if (!url) return fallback;
    
    // Limpar aspas extras e caracteres de escape
    let cleanUrl = url;
    if (typeof url === 'string') {
      cleanUrl = url.replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, '');
      if (cleanUrl.includes('\"')) {
        cleanUrl = cleanUrl.replace(/\"/g, '');
      }
    }
    
    return cleanUrl || fallback;
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Em vez de abrir diretamente, agora vamos abrir o modal de aviso
    openWhatsAppModal(
      company.phone,
      'Olá! Vi o perfil da sua empresa no BDC Classificados e gostaria de mais informações.'
    );
  };

  return (
    <>
    <Link 
      href={company.userId ? `/loja/${company.userId}` : `/loja/${company.id}`} 
      className="block h-full" 
      onClick={(e) => {
        if (!company.userId && !company.id) {
          e.preventDefault();
          console.warn("ID do anunciante não disponível");
        }
      }}
    >
      <div style={{backgroundColor: 'white'}} className="card bg-white border border-gray-200 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-lg relative h-full flex flex-col">
        {/* Banner da empresa */}
        <div className="relative h-48 md:h-56 w-full flex-shrink-0">
          <Image
            src={cleanImageUrl(company.banner, '/images/placeholder-banner.jpg')}
            alt={company.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="transition-opacity duration-300 group-hover:opacity-90"
          />
          
          {/* Selo de verificado */}
          {company.verified && (
            <div className="absolute top-3 right-3 bg-white text-black text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
              <VerifiedBadge size="sm" />
              <span className="ml-1">Parceiro Verificado</span>
            </div>
          )}

          {/* Tipo de plano */}
          <div className="absolute top-3 left-3 z-10 bg-black bg-opacity-70 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
            {company.plan || "Classificado"}
          </div>
        </div>
        
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          <div>
            <h4 className="text-black text-lg font-bold line-clamp-1">{company.name}</h4>
            <div className="flex items-center text-sm text-gray-700">
              <FaMapMarkerAlt className="mr-1 text-gray-700" />
              <span className="truncate">{company.address}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 my-2 line-clamp-2">{company.description}</p>
          
          {/* Informações da empresa */}
          <div className="flex items-start border-b border-gray-300 pb-2 mb-2">
            <div className="mr-3 flex-shrink-0">
              <Avatar
                src={company.logo}
                alt={`Logo ${company.name}`}
                size={40}
                fallbackName={company.name}
                className=""
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <h4 className="font-medium text-sm text-black">{company.name}</h4>
                {company.verified && (
                  <VerifiedBadge size="sm" />
                )}
              </div>
              <div className="flex items-center text-xs text-gray-700 mt-1 flex-wrap gap-2">
                <div className="flex items-center">
                  <FaStar className="text-yellow-500 mr-1 flex-shrink-0" />
                  <span>
                    {isLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <>
                        {formatRating(realRating)}
                        {reviewsCount > 0 && (
                          <span className="text-gray-500 ml-1">({reviewsCount})</span>
                        )}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <BiTimeFive className="mr-1 flex-shrink-0" />
                  <span>Atualizado recentemente</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rodapé com estatísticas e botão */}
          <div className="flex justify-between items-center mt-auto pt-1">
            <div className="flex items-center text-sm text-gray-700">
              <FaEye className="mr-1 flex-shrink-0" />
              {isLoading ? (
                <span className="animate-pulse">Carregando...</span>
              ) : (
                <span>{formatViewCount(viewCount)}</span>
              )}
            </div>
            
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center bg-primary text-white hover:bg-primary-dark px-2 py-1.5 rounded-lg text-sm transition-colors duration-300"
            >
              <FaWhatsapp className="mr-1 flex-shrink-0" />
              <span>Contato</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
      
      {/* Adicionar o modal de aviso */}
      <WhatsAppWarningModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
        onProceed={proceedToWhatsApp}
        phoneNumber={currentPhoneNumber}
      />
    </>
  );
};

export default CompanyCard;