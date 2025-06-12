"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaStore, FaTimes, FaArrowLeft, FaTags } from 'react-icons/fa';
import AdCard from '../../components/AdCard';
import { Store, Product, Rating, Ad, SubscriptionPlan } from '../../models/types';
import StoreBanner from '../../components/StoreBanner';
import StoreFeaturedProducts from '../../components/StoreFeaturedProducts';
import StoreProducts from '../../components/StoreProducts';
import StoreRatings from '../../components/StoreRatings';
import StoreSocialLinks from '../../components/StoreSocialLinks';
import { MdVerified } from 'react-icons/md';
import { getSupabaseClient } from '../../lib/supabase';
import { convertTempIdToUUID } from '@/lib/utils';

// Adicionando um comentário explicativo sobre a padronização de nomenclatura
// Este componente representa a página de loja/empresa e substitui a versão antiga em pages/store/[id]
// Foi padronizado para seguir a nomenclatura em português (loja) em vez de inglês (store)

export default function LojaPage({ params }: { params: { id: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingStory, setViewingStory] = useState<any>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaidAccount, setIsPaidAccount] = useState(false);

  useEffect(() => {
    const fetchUserAndAds = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Verificar se o ID é válido
        if (!params.id) {
          console.error('ID do vendedor não fornecido');
          setError('ID do vendedor não encontrado');
          setLoading(false);
          return;
        }
        
        // Definir URL da imagem de logo padrão
        const defaultLogoUrl = '/images/logo.png';
        
        // Verificar se o ID é um ID temporário
        const isTempId = params.id.startsWith('temp-id-');
        
        let userData;
        let userError;
        let businessProfile = null;
        
        if (isTempId) {
          // Para IDs temporários, convertemos para um formato UUID válido
          const validUUID = convertTempIdToUUID(params.id);
          
          // Para IDs temporários, usamos dados do localStorage mas simulamos um usuário completo
          const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
          const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
          const userAvatar = localStorage.getItem('userAvatar') || sessionStorage.getItem('userAvatar');
          const businessName = localStorage.getItem('businessName') || sessionStorage.getItem('businessName');
          
          // Criar dados de usuário enriquecidos para testes
          userData = {
            id: validUUID, // Usar o UUID válido em vez do ID temporário
            name: userName || 'Usuário Teste',
            business_name: businessName || 'Empresa Teste',
            email: userEmail || '',
            avatar_url: userAvatar || defaultLogoUrl,
            bio: localStorage.getItem('userBio') || 'Perfil para testes e demonstração',
            is_verified: true, // Simular como verificado para testes
            phone: localStorage.getItem('userPhone') || '(11) 98765-4321',
            whatsapp: localStorage.getItem('userWhatsapp') || '11987654321',
            location: localStorage.getItem('userLocation') || 'São Paulo, SP',
            city: localStorage.getItem('userCity') || 'São Paulo',
            state: localStorage.getItem('userState') || 'SP',
            account_type: 'premium', // Simular plano premium para testes
            created_at: localStorage.getItem('userCreatedAt') || new Date().toISOString(),
            facebook_url: localStorage.getItem('userFacebook') || 'perfilteste',
            instagram_url: localStorage.getItem('userInstagram') || 'perfilteste',
            twitter_url: localStorage.getItem('userTwitter') || 'perfilteste',
            website_url: localStorage.getItem('userWebsite') || 'meusite.com.br',
            banner_url: localStorage.getItem('userBanner') || null,
            rating: 4.5,
            business_profiles: [
              {
                id: 'temp-business-id',
                business_name: businessName || 'Empresa Teste',
                description: localStorage.getItem('businessDescription') || 'Descrição da empresa teste',
                address: localStorage.getItem('businessAddress') || 'Av. Paulista, 1000 - São Paulo',
                city: localStorage.getItem('businessCity') || 'São Paulo',
                state: localStorage.getItem('businessState') || 'SP',
                is_verified: true,
                facebook_url: localStorage.getItem('userFacebook') || 'perfilteste',
                instagram_url: localStorage.getItem('userInstagram') || 'perfilteste',
                twitter_url: localStorage.getItem('userTwitter') || 'perfilteste',
                whatsapp: localStorage.getItem('userWhatsapp') || '11987654321',
                phone: localStorage.getItem('userPhone') || '(11) 98765-4321',
                email: localStorage.getItem('userEmail') || '',
                website_url: localStorage.getItem('userWebsite') || 'meusite.com.br',
                user_id: params.id
              }
            ]
          };
          
          setIsPaidAccount(true);
          
          // Obter perfil de negócio para ID temporário
          businessProfile = userData.business_profiles && userData.business_profiles.length > 0 
            ? userData.business_profiles[0] 
            : null;
          
        } else {
          // Para IDs normais, usar a nova API completa de perfil
          try {
            const response = await fetch(`/api/profile/complete?userId=${params.id}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
              userData = data.profile;
              console.log('🔍 Dados completos do perfil recuperados via API:', userData);
              
              // Extrair businessProfile dos dados retornados
              if (userData.businessProfile) {
                businessProfile = userData.businessProfile;
                console.log('📊 Business profile encontrado nos dados da API:', businessProfile);
              } else {
                console.log('⚠️ Business profile não encontrado nos dados da API');
              }
            } else {
              throw new Error('Perfil não encontrado via API completa');
            }
          } catch (completeApiError) {
            console.warn('❌ API completa falhou, tentando API de vendedor:', completeApiError);
            
            // Fallback para API de vendedor
            const response = await fetch(`/api/vendedor?id=${params.id}`);
            const data = await response.json();
            
            if (!response.ok || !data.success) {
              console.error('Erro ao buscar dados do vendedor:', data.error || 'Erro desconhecido');
              throw new Error('Não foi possível carregar os dados do vendedor');
            }
            
            userData = data.vendedor;
            console.log('Dados do vendedor recuperados via API (fallback):', data.source, userData);
          }
          
          // Se os dados contêm um perfil de negócios, extraí-lo
          if (userData.business) {
            businessProfile = userData.business;
            delete userData.business; // Remover para evitar duplicação
          } else {
            // Buscar perfil de negócios separadamente
            const { data: businessProfiles, error: businessError } = await supabase
              .from('business_profiles')
              .select('*')
              .eq('user_id', params.id);
              
            if (businessError) {
              console.error('Erro ao buscar perfil de negócios:', businessError);
              // Não lançar erro, apenas registrar, pois o perfil de negócios pode não existir
            }
            
            businessProfile = businessProfiles && businessProfiles.length > 0 
              ? businessProfiles[0] 
              : null;
          }
          
          // Verificar o tipo de conta para saber se é pago
          const isPaid = userData.account_type && userData.account_type !== 'personal';
          setIsPaidAccount(isPaid);
        }
        
        // Buscar anúncios do usuário
        const { data: userAds, error: adsError } = await supabase
          .from('advertisements')
          .select('*')
          .eq('user_id', params.id)
          .eq('moderation_status', 'approved')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (adsError) {
          console.error('Erro ao buscar anúncios do vendedor:', adsError);
        }
        
        // Mapear os anúncios para o formato esperado
        const mappedAds: Ad[] = (userAds || []).map(ad => ({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          price: parseFloat(ad.price) || 0,
          images: ad.images || [],
          category: ad.category,
          subCategory: ad.sub_category,
          createdAt: ad.created_at,
          views: ad.views || 0,
          featured: ad.is_featured || false,
          userId: ad.user_id,
          userName: businessProfile?.business_name || userData.business_name || userData.name || 'Anunciante',
          userAvatar: userData.avatar_url || defaultLogoUrl,
          whatsapp: ad.whatsapp,
          city: ad.city,
          state: ad.state,
          location: ad.location
        }));
        
        // Extrair categorias únicas dos anúncios
        const uniqueCategories: string[] = [];
        mappedAds.forEach(ad => {
          if (ad.category && !uniqueCategories.includes(ad.category)) {
            uniqueCategories.push(ad.category);
          }
        });
                
        console.log("userData:", {
          business_name: userData.business_name,
          company: userData.company,
          whatsapp: userData.whatsapp,
          facebook: userData.facebook_url,
          instagram: userData.instagram_url,
        });
        
        console.log("businessProfile:", businessProfile);
        
        // Criar o objeto da loja com dados reais
        const storeData: Store = {
          id: userData.id,
          userId: userData.id,
          name: businessProfile?.business_name || businessProfile?.company_name || userData.business_name || userData.company || userData.name || 'Anunciante',
          userName: userData.name,
          showUserName: userData.mostrarNomePessoal !== false,
          description: businessProfile?.description || userData.bio || userData.description || 'Sem descrição',
          logo: userData.avatar_url || defaultLogoUrl,
          banner: userData.banner_url,
          address: businessProfile?.address || userData.address || '',
          location: userData.location || '',
          city: businessProfile?.city || userData.city || '',
          state: businessProfile?.state || userData.state || '',
          contactPhone: businessProfile?.phone || userData.phone || '',
          contactEmail: businessProfile?.email || userData.email || '',
          contactInfo: {
            email: businessProfile?.email || userData.email || '',
            phone: businessProfile?.phone || userData.phone || '',
            whatsapp: businessProfile?.contact_phone || businessProfile?.whatsapp || userData.whatsapp || ''
          },
          socialMedia: {
            facebook: userData.socialMedia?.facebook || businessProfile?.facebook || businessProfile?.facebook_url || userData.facebook_url || '',
            instagram: userData.socialMedia?.instagram || businessProfile?.instagram || businessProfile?.instagram_url || userData.instagram_url || '',
            twitter: userData.socialMedia?.twitter || businessProfile?.twitter || businessProfile?.twitter_url || userData.twitter_url || '',
            youtube: userData.socialMedia?.youtube || businessProfile?.youtube || businessProfile?.youtube_url || userData.youtube_url || '',
            website: userData.website || userData.socialMedia?.website || businessProfile?.website || businessProfile?.website_url || userData.website_url || ''
          },
          rating: userData.rating || 0,
          ratings: [],
          products: mappedAds,
          featuredProducts: mappedAds.filter(ad => ad.featured),
          categories: uniqueCategories,
          createdAt: userData.created_at || new Date().toISOString(),
          updatedAt: userData.updated_at || new Date().toISOString(),
          verifiedBusiness: businessProfile?.is_verified || userData.is_verified || false,
          subscriptionPlan: userData.account_type || 'free'
        };
        
        console.log('Store data:', {
          name: storeData.name,
          socialMedia: storeData.socialMedia,
          contactInfo: storeData.contactInfo
        });
        
        setStore(storeData);
        setLoading(false);
        
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar os dados');
    setLoading(false);
      }
    };
    
    fetchUserAndAds();
  }, [params.id]);

  // Registrar visualização quando a página carrega
  useEffect(() => {
    // Função para registrar visualização na empresa
    const registerBusinessView = async () => {
      // Só registrar visualização se temos os dados da loja e um ID válido
      if (store && store.id) {
        try {
          // Buscar o ID do usuário logado (se disponível)
          let viewerId = null;
          if (typeof localStorage !== 'undefined') {
            viewerId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || null;
          }
          
          // Fazer uma requisição POST para a API de visualizações
          const response = await fetch('/api/businesses/views', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              businessId: store.id,
              viewerId: viewerId
            })
          });
          
          if (!response.ok) {
            console.error('Erro ao registrar visualização da empresa');
          }
        } catch (error) {
          console.error('Erro ao registrar visualização:', error);
        }
      }
    };
    
    // Registrar visualização quando o componente montar e tiver os dados da loja
    if (store && !loading) {
      registerBusinessView();
    }
  }, [store, loading]);

  useEffect(() => {
    // Controlar a visualização da story
    if (viewingStory) {
      const timer = setInterval(() => {
        if (storyProgress < 100) {
          setStoryProgress(prev => prev + 1);
        } else {
          // Quando o progresso atinge 100, move para a próxima story
          if (storyIndex < viewingStory.stories.length - 1) {
            setStoryIndex(prev => prev + 1);
            setStoryProgress(0);
          } else {
            // Fechar as stories se estamos na última
            closeStory();
          }
        }
      }, 50); // 5 segundos para cada story (50ms * 100)
      
      return () => clearInterval(timer);
    }
  }, [viewingStory, storyProgress, storyIndex]);

  const openStory = (highlight: any) => {
    setViewingStory(highlight);
    setStoryIndex(0);
    setStoryProgress(0);
    document.body.style.overflow = 'hidden'; // Prevenir rolagem quando as stories estão abertas
  };

  const closeStory = () => {
    setViewingStory(null);
    setStoryProgress(0);
    document.body.style.overflow = 'auto'; // Habilitar rolagem novamente
  };

  const nextStory = () => {
    if (storyIndex < viewingStory.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setStoryProgress(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setStoryProgress(0);
    }
  };

  const handleStoryClick = (e: React.MouseEvent) => {
    const { clientX } = e;
    const { innerWidth } = window;
    
    // Se clicou no lado esquerdo da tela (menos de 30%)
    if (clientX < innerWidth * 0.3) {
      prevStory();
    } 
    // Se clicou no lado direito da tela (mais de 70%)
    else if (clientX > innerWidth * 0.7) {
      nextStory();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error || 'Perfil não encontrado'}</p>
          <button
            onClick={() => {
              // Usando window.location para forçar recarregamento completo
              window.location.href = '/';
            }}
            className="text-red-600 font-medium underline mt-2 inline-block cursor-pointer"
          >
            Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen loja-profile-page">
      {/* Banner da loja - sempre exibir, independente se tem banner ou não */}
      <StoreBanner store={store} /> 

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-1">
        {/* Botões de navegação */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button 
            onClick={() => {
              // Verifica se veio de um anúncio específico através do histórico
              const referrer = document.referrer;
              if (referrer && referrer.includes('/anuncio/')) {
                window.history.back();
              } else {
                // Caso contrário, volta para a página inicial
                window.location.href = '/';
              }
            }}
            className="flex items-center text-gray-600 hover:text-primary"
          >
            <FaArrowLeft className="mr-2" /> Voltar
          </button>
                  </div>
        
        {/* Título da página com informações do vendedor */}
        <div className="mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {store.name}
            </h1>
            {store.verifiedBusiness && (
              <div className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <MdVerified className="mr-1" />
                Verificado
                </div>
            )}
            </div>
          {store.showUserName && store.userName && (
            <p className="text-sm text-gray-600">
              {store.userName}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-gray-600 flex items-center">
              <FaStore className="mr-1" /> Membro desde {formatDate(store.createdAt)}
            </p>
            <p className="text-gray-600 flex items-center">
              <FaMapMarkerAlt className="mr-1" /> 
              {store.city && store.state ? `${store.city}, ${store.state}` : (store.location || '')}
            </p>
            {store.products.length > 0 && (
              <p className="text-gray-600 flex items-center">
                <FaTags className="mr-1" /> {store.products.length} {store.products.length === 1 ? 'anúncio' : 'anúncios'}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {store.contactInfo?.whatsapp && (
              <a
                href={`https://wa.me/${store.contactInfo.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm text-sm transition-colors"
              >
                <FaWhatsapp className="mr-2" />
                Contato WhatsApp
              </a>
            )}
            {store.socialMedia?.website && (
              <a
                href={store.socialMedia.website.startsWith('http') ? store.socialMedia.website : `https://${store.socialMedia.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm text-sm transition-colors"
              >
                <FaGlobe className="mr-2" />
                Visitar site
              </a>
            )}
            {store.socialMedia?.instagram && (
              <a
                href={`https://instagram.com/${store.socialMedia.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md shadow-sm text-sm transition-colors"
              >
                <FaInstagram className="mr-2" />
                Instagram
              </a>
            )}
            {store.socialMedia?.facebook && (
              <a
                href={`https://facebook.com/${store.socialMedia.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm transition-colors"
              >
                <FaFacebook className="mr-2" />
                Facebook
              </a>
            )}
          </div>
        </div>

        {/* O resto do componente permanece igual */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Coluna Esquerda: Informações da Loja e Contato */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card sobre a loja */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Sobre a Loja</h2>
              <p className="text-gray-600 text-sm mb-4">{store.description}</p>
              {store.location && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FaMapMarkerAlt className="mr-2 text-primary" />
                {store.location}
              </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <FaStore className="mr-2 text-primary" />
                Membro desde {formatDate(store.createdAt)}
              </div>
            </div>
            
            {/* Card de Contato */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Contato</h2>
              
              <div className="space-y-3">
                {store.contactInfo?.phone && (
                  <a href={`tel:${store.contactInfo.phone}`} className="flex items-center text-sm text-gray-700 hover:text-primary">
                    <FaPhone className="mr-2 text-primary" />
                    {store.contactInfo.phone}
                  </a>
                )}
                {store.contactInfo?.email && (
                  <a href={`mailto:${store.contactInfo.email}`} className="flex items-center text-sm text-gray-700 hover:text-primary">
                    <FaEnvelope className="mr-2 text-primary" />
                    {store.contactInfo.email}
                  </a>
                )}
                {store.socialMedia?.website && (
                  <a 
                    href={store.socialMedia.website.startsWith('http') ? store.socialMedia.website : `https://${store.socialMedia.website}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-700 hover:text-primary"
                  >
                    <FaGlobe className="mr-2 text-primary" />
                    {store.socialMedia.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
            
            {/* Links Sociais */}
            <StoreSocialLinks store={store} />
          </div>

          {/* Coluna Direita: Produtos e Avaliações */}
          <div className="lg:col-span-3">
            {/* Produtos em Destaque */}
            {store.featuredProducts.length > 0 && (
            <StoreFeaturedProducts store={store} />
            )}

            {/* Todos os Produtos */}
            <StoreProducts store={store} />
            
            {/* Avaliações */}
            {store.ratings.length > 0 && (
            <StoreRatings store={store} />
            )}
          </div>
        </div>
      </main>

      {/* Modal de Visualização de Stories (mantido para futuro) */}
      {viewingStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={closeStory}
        >
          <div className="bg-white p-8 rounded-lg max-w-md">
            <div className="relative">
              <Image
                src={viewingStory.stories[storyIndex].image}
                alt={viewingStory.title}
                width={800}
                height={400}
                className="w-full h-auto rounded-lg"
              />
              <button
                className="absolute top-2 right-2 text-white"
                onClick={closeStory}
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-semibold mb-4">{viewingStory.title}</h2>
              <div className="flex justify-center">
                <div className="w-1/3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary"
                    style={{ width: `${storyProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 