'use client';

import React, { useEffect, useState } from 'react';
import { FaCheck, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { Store } from '../models/types';
import { getSupabaseClient } from '../lib/supabase';

interface StoreBannerProps {
  store: Store;
}

const StoreBanner: React.FC<StoreBannerProps> = ({ store }) => {
  const [isPaidSubscription, setIsPaidSubscription] = useState(false);
  
  useEffect(() => {
    // Verificar tipo de assinatura
    const checkSubscription = async () => {
      if (store?.userId) {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('subscription')
            .eq('id', store.userId)
            .single();
            
          if (!error && data) {
            // Se não for assinatura gratuita, é uma conta paga
            setIsPaidSubscription(data.subscription !== 'free');
          }
        } catch (err) {
          console.error('Erro ao verificar tipo de assinatura:', err);
        }
      }
    };
    
    checkSubscription();
  }, [store?.userId]);

  // URL da imagem padrão - sempre usar como fallback
  const defaultLogoUrl = '/images/logo.png';

  // Função para obter iniciais do nome da loja
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative w-full h-64 bg-gray-200 overflow-hidden -mt-1">
      {/* Imagem de fundo */}
      <div className={`absolute inset-0 ${(!store.banner || !isPaidSubscription) ? 'bg-blue-500' : ''}`}>
        {(store.banner && isPaidSubscription) && (
          <img
            src={store.banner}
            alt={`${store.name} banner`}
            className="object-cover w-full h-full"
            onError={(e) => {
              // Em caso de erro ao carregar a imagem, substituir por background azul
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.classList.add('bg-blue-500');
            }}
          />
        )}
        {/* Overlay gradiente para melhorar legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Conteúdo do banner */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-end h-full">
        <div className="flex items-center">
          {/* Avatar da loja - sempre exibir uma imagem */}
          <div className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
            <img
              src={store.logo || defaultLogoUrl}
              alt={store.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Em caso de erro ao carregar a imagem, usar logo padrão
                const target = e.target as HTMLImageElement;
                if (target.src !== defaultLogoUrl) {
                  target.src = defaultLogoUrl;
                }
              }}
            />
          </div>
          
          {/* Nome e informações da loja */}
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">{store.name || "Nome não informado"}</h1>
            {store.verifiedBusiness && (
              <div className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Verificado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreBanner; 