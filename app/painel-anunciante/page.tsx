"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaEye, FaChartLine, FaListAlt, FaPlus, FaPlusCircle, 
  FaMoneyBillWave, FaBullhorn, FaUser, FaWhatsapp, FaRegClock,
  FaCheckCircle, FaTimesCircle, FaPauseCircle, FaEdit, FaTrash,
  FaRegChartBar, FaPlay, FaCreditCard, FaLock, FaUnlock, FaCrown, FaInfo,
  FaTags, FaBell, FaUserCircle, FaMapMarkerAlt, FaClipboardList, FaQuestionCircle, FaHeart, FaStore, FaArrowRight, FaCalendarAlt, FaCog
} from 'react-icons/fa';
import { SubscriptionPlan } from '../models/types';
import { useSubscriptionSync } from '../lib/useSubscriptionSync';
import { useProfileSync } from '../lib/useProfileSync';
import ViewsStatsWidget from '../components/ViewsStatsWidget';
import NotificationsWidget from '../components/NotificationsWidget';
import ProfilePanel from '../components/ProfilePanel';
import { getSupabaseClient } from '../lib/supabase';
import { convertTempIdToUUID } from '../lib/utils';
import { fetchNotifications as getFetchNotifications } from '../lib/notificationService';

// Dados simulados para o dashboard
const dashboardData = {
  stats: [
    { id: 'views', label: 'Visualizações', value: '2.358', change: '+14%', isPositive: true },
    { id: 'clicks', label: 'Cliques', value: '486', change: '+8%', isPositive: true },
    { id: 'ctr', label: 'Taxa de Clique', value: '20.6%', change: '+1.8%', isPositive: true },
    { id: 'active_ads', label: 'Anúncios Ativos', value: '3', change: '+1', isPositive: true },
  ],
  activeAds: [
    { 
      id: 1, 
      title: 'Apartamento 2 quartos - Centro', 
      category: 'Imóveis',
      subcategory: 'Apartamentos',
      price: 'R$ 1.200/mês',
      views: 342,
      clicks: 89,
      status: 'active',
      image: '/images/apartment-thumb.jpg',
      created: '2023-10-15',
      expires: '2024-01-15'
    },
    { 
      id: 2, 
      title: 'MacBook Pro 2021 - M1 Pro 16GB', 
      category: 'Eletrônicos',
      subcategory: 'Notebooks',
      price: 'R$ 8.999',
      views: 218,
      clicks: 42,
      status: 'active',
      image: '/images/macbook-thumb.jpg',
      created: '2023-11-02',
      expires: '2024-02-02'
    },
    { 
      id: 3, 
      title: 'Honda Civic EXL 2020', 
      category: 'Veículos',
      subcategory: 'Carros',
      price: 'R$ 125.900',
      views: 501,
      clicks: 143,
      status: 'pending',
      image: '/images/car-thumb.jpg',
      created: '2023-11-10',
      expires: '2024-02-10'
    },
    { 
      id: 4, 
      title: 'Serviços de Design Gráfico', 
      category: 'Serviços',
      subcategory: 'Design',
      price: 'Sob consulta',
      views: 92,
      clicks: 18,
      status: 'paused',
      image: '/images/design-thumb.jpg',
      created: '2023-09-28',
      expires: '2023-12-28'
    },
  ],
  currentPlan: {
    name: 'Microempresa',
    price: 'R$ 29,90/mês',
    adsLimit: 15,
    storiesLimit: 3,
    validUntil: '15/12/2023',
    features: [
      '15 anúncios ativos',
      'Duração de 60 dias',
      '3 stories por mês',
      'Estatísticas avançadas'
    ]
  }
};

// Status de anúncio para exibição visual
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'active':
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center font-medium"><FaCheckCircle className="mr-1" /> Ativo</span>;
    case 'pending':
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center font-medium"><FaPauseCircle className="mr-1" /> Pendente</span>;
    case 'paused':
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center font-medium"><FaPauseCircle className="mr-1" /> Pausado</span>;
    case 'rejected':
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center font-medium"><FaTimesCircle className="mr-1" /> Rejeitado</span>;
    default:
      return null;
  }
};

// Definição de tipo para o objeto de informações do plano
interface PlanInfoType {
  name: string;
  price: string;
  adsLimit: number;
  storiesLimit: number;
  validUntil: string;
  features: string[];
}

// Definição de tipo para o objeto que mapeia planos para suas informações
interface PlanInfoMapType {
  [key: string]: PlanInfoType;
}

export default function AdvertiserDashboard() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/avatar.jpg');
  const [stories, setStories] = useState<any[]>([]);
  const [storiesLimit, setStoriesLimit] = useState(3);
  const [showPaymentOption, setShowPaymentOption] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statsData, setStatsData] = useState({
    totalViews: 0,
    monthlyViews: 0,
    responseRate: 0,
    favoriteCount: 0,
  });
  
  // Estados para armazenar dados reais
  const [adCounts, setAdCounts] = useState({
    active: 0,
    pending: 0,
    rejected: 0,
    finished: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [hasAnyAds, setHasAnyAds] = useState(false);
  
  // Tentar obter dados de assinatura do hook de sincronização
  const { plan, planName, isLoading: loadingSubscription } = useSubscriptionSync();
  const { profile, isLoading: profileLoading } = useProfileSync();
  
  // Garantir que temos um plano válido para exibir na interface
  const [userPlan, setUserPlan] = useState<PlanInfoType>({
    name: 'Gratuito',
    price: 'R$ 0,00/mês',
    adsLimit: 3,
    storiesLimit: 0,
    validUntil: 'Sem validade',
    features: [
      'Até 3 anúncios ativos',
      'Duração de 30 dias',
      'Sem destaques incluídos',
      'Destaques avulsos por R$ 14,90'
    ]
  });

  // Mapeamento de planos para informações legíveis
  const planInfo: PlanInfoMapType = {
    [SubscriptionPlan.FREE]: {
      name: 'Gratuito',
      price: 'R$ 0,00/mês',
      adsLimit: 3,
      storiesLimit: 0,
      validUntil: 'Sem validade',
      features: [
        'Até 3 anúncios ativos',
        'Duração de 30 dias',
        'Sem destaques incluídos',
        'Destaques avulsos por R$ 14,90'
      ]
    },
    [SubscriptionPlan.MICRO_BUSINESS]: {
      name: 'Micro-Empresa',
      price: 'R$ 49,90/mês',
      adsLimit: 4, // 3 + 1 anúncio extra
      storiesLimit: 0,
      validUntil: '--/--/----',
      features: [
        'Até 4 anúncios ativos',
        'Sem opção de destaque incluída',
        'Duração de 60 dias',
        'Destaques avulsos por R$ 9,90'
      ]
    },
    [SubscriptionPlan.SMALL_BUSINESS]: {
      name: 'Pequena Empresa',
      price: 'R$ 149,90/mês',
      adsLimit: 5,
      storiesLimit: 1,
      validUntil: '--/--/----',
      features: [
        'Até 5 anúncios simultâneos',
        '1 destaque por dia',
        'Duração de 90 dias',
        'Destaques extras por R$ 9,90'
      ]
    },
    [SubscriptionPlan.BUSINESS_SIMPLE]: {
      name: 'Empresa Simples',
      price: 'R$ 249,90/mês',
      adsLimit: 10,
      storiesLimit: 2,
      validUntil: '--/--/----',
      features: [
        'Até 10 anúncios simultâneos',
        '2 destaques por dia',
        'Duração ilimitada',
        'Perfil de loja personalizado',
        'Destaques extras por R$ 9,90'
      ]
    },
    [SubscriptionPlan.BUSINESS_PLUS]: {
      name: 'Empresa Plus',
      price: 'R$ 349,90/mês',
      adsLimit: 20,
      storiesLimit: 3,
      validUntil: '--/--/----',
      features: [
        'Até 20 anúncios simultâneos',
        '3 destaques por dia',
        'Duração ilimitada',
        'Perfil de loja personalizado',
        'Suporte prioritário',
        'Destaques extras por R$ 9,90'
      ]
    }
  };

  useEffect(() => {
    // Recuperar informações do usuário
    const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'Usuário';
    const name = localStorage.getItem('userName') || email.split('@')[0];
    const profileImage = localStorage.getItem('userAvatarPreview');
    const savedStories = localStorage.getItem('userStories');
    
    setUserEmail(email);
    setUserName(name);
    
    // Se tiver uma imagem de perfil salva, usar ela
    if (profileImage) {
      setAvatarSrc(profileImage);
    }

    // Recuperar stories salvos
    if (savedStories) {
      const parsedStories = JSON.parse(savedStories);
      setStories(parsedStories);
    }

    // Buscar dados do usuário da API
    const fetchUserData = async () => {
      try {
        console.log('Buscando dados do usuário no painel-anunciante...');
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            console.log('Usuário autenticado:', data.user.name);
            console.log('Plano atual do usuário:', data.user.subscription || SubscriptionPlan.FREE);
            
            // Definir plano com base nos dados do usuário
            const userSubscription = data.user.subscription || SubscriptionPlan.FREE;
            
            // Usar o mapeamento para obter os dados do plano
            if (planInfo[userSubscription]) {
              const planData = {...planInfo[userSubscription]};
              
              // Se tivermos dados de validade na resposta da API, sobrescrever
              if (data.user.subscriptionEndDate) {
                const endDate = new Date(data.user.subscriptionEndDate);
                planData.validUntil = endDate.toLocaleDateString('pt-BR');
              }
              
              console.log('Dados do plano aplicados:', planData);
              setUserPlan(planData);
              
              // Definir limite de stories com base no plano
              setStoriesLimit(planData.storiesLimit || 0);
              
              // Verificar se atingiu o limite de stories
              if (savedStories) {
                const parsedStories = JSON.parse(savedStories);
                setShowPaymentOption(parsedStories.length >= planData.storiesLimit);
              }
            } else {
              console.warn('Plano não encontrado no mapeamento:', userSubscription);
            }
          } else {
            console.log('Usuário não autenticado no painel-anunciante');
          }
        } else {
          console.error('Erro na resposta da API de verificação:', response.status);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário no painel-anunciante:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Usar o plano do hook para definir as informações a serem exibidas
    if (!loadingSubscription && plan && planInfo[plan]) {
      console.log('Aplicando plano do hook de sincronização:', plan, planName);
      setUserPlan(planInfo[plan]);
    }
  }, [plan, planName, loadingSubscription]);

  useEffect(() => {
    // Verificar se temos ID de usuário no localStorage ou sessionStorage
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (!userId) {
      console.warn('Usuário não encontrado, redirecionando...');
      // O redirecionamento será feito pelo middleware
      return;
    }
    
    // Buscar informações do plano do usuário
    // Será implementado quando tivermos assinaturas
    
    // Função para buscar contagem real de anúncios por status
    const fetchAdCounts = async () => {
      try {
        setIsLoadingAds(true);
        
        if (!userId) {
          console.error('ID do usuário não encontrado para buscar anúncios');
          setIsLoadingAds(false);
          return;
        }
        
        console.log('📊 Buscando estatísticas do dashboard via nova API...');
        
        // Usar a nova API de estatísticas consolidada
        const response = await fetch(`/api/dashboard/stats?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar estatísticas do dashboard');
        }
        
        const result = await response.json();
        
        if (result.success && result.data?.adCounts) {
          const counts = result.data.adCounts;
          
          setAdCounts({
            active: counts.active_count || 0,
            pending: counts.pending_count || 0,
            rejected: counts.rejected_count || 0,
            finished: counts.finished_count || 0
          });
          
          // Verificar se o usuário tem algum anúncio (independente do status)
          const totalAds = (counts.active_count || 0) + 
                          (counts.pending_count || 0) + 
                          (counts.rejected_count || 0) + 
                          (counts.finished_count || 0);
          
          setHasAnyAds(totalAds > 0);
          
          console.log('✅ Contadores de anúncios atualizados:', {
            active: counts.active_count,
            pending: counts.pending_count,
            rejected: counts.rejected_count,
            finished: counts.finished_count,
            hasAds: totalAds > 0
          });
        } else {
          throw new Error('Dados de contagem não encontrados na resposta');
        }
        
        setIsLoadingAds(false);
      } catch (error) {
        console.error('Erro ao buscar contagem de anúncios:', error);
        
        // Em caso de erro, usar fallback com API direta de anúncios
        try {
          const fallbackResponse = await fetch(`/api/ads?userId=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });
          
          if (fallbackResponse.ok) {
            const adsData = await fallbackResponse.json();
            const ads = adsData.ads || [];
            
            const activeCount = ads.filter((ad: any) => ad.status === 'active' && ad.moderation_status === 'approved').length;
            const pendingCount = ads.filter((ad: any) => ad.moderation_status === 'pending').length;
            const rejectedCount = ads.filter((ad: any) => ad.moderation_status === 'rejected').length;
            const finishedCount = ads.filter((ad: any) => ad.status === 'expired' || ad.status === 'finished').length;
            
            setAdCounts({
              active: activeCount,
              pending: pendingCount,
              rejected: rejectedCount,
              finished: finishedCount
            });
            
            setHasAnyAds(ads.length > 0);
            
            console.log('📋 Fallback: Contadores calculados via API de anúncios');
          } else {
            throw new Error('Fallback também falhou');
          }
        } catch (fallbackError) {
          console.warn('Fallback falhou, usando contadores padrão:', fallbackError);
          
          // Último recurso: usar contadores padrão baseados no status real
          setAdCounts({
            active: 0,
            pending: 0,
            rejected: 0,
            finished: 0
          });
          setHasAnyAds(false);
        }
        
        setIsLoadingAds(false);
      }
    };
    
    // Função para buscar notificações reais
    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        
        if (!userId) {
          console.error('ID do usuário não encontrado para buscar notificações');
          setIsLoadingNotifications(false);
          return;
        }
        
        console.log('🔔 Buscando notificações via nova API de estatísticas...');
        
        // Usar a nova API de estatísticas que já busca notificações
        const response = await fetch(`/api/dashboard/stats?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar estatísticas do dashboard');
        }
        
        const result = await response.json();
        
        if (result.success && result.data?.notifications) {
          // Combinar notificações reais e inteligentes
          const realNotifications = result.data.notifications.real || [];
          const smartNotifications = result.data.notifications.smart || [];
          
          // Converter notificações inteligentes para o formato do dashboard
          const convertedSmartNotifications = smartNotifications.map((smart: any) => ({
            id: smart.notification_id,
            title: smart.title,
            message: smart.message,
            type: smart.type,
            read: false,
            created_at: smart.created_at
          }));
          
          // Combinar e limitar as notificações (máximo 5)
          const allNotifications = [...realNotifications, ...convertedSmartNotifications];
          setNotifications(allNotifications.slice(0, 5));
          
          console.log('✅ Notificações carregadas:', {
            realCount: realNotifications.length,
            smartCount: smartNotifications.length,
            totalShown: Math.min(allNotifications.length, 5)
          });
          
          setIsLoadingNotifications(false);
          return;
        } else {
          throw new Error('Dados de notificações não encontrados na resposta');
        }
        
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        
        // Fallback para notificações básicas baseadas no estado do sistema
        const fallbackNotifications = [
          {
            id: 'system-1',
            title: 'Sistema funcionando',
            message: 'Seu painel está carregado e funcionando corretamente.',
            type: 'system',
            read: false,
            created_at: new Date().toISOString()
          }
        ];
        
        setNotifications(fallbackNotifications);
        setIsLoadingNotifications(false);
      }
    };
    
    // Buscar dados reais do usuário
    fetchAdCounts();
    fetchNotifications();
    
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Painel do Anunciante</h1>
      </div>
      
      {/* Mensagem informativa para novos usuários sem anúncios */}
      {!isLoadingAds && !hasAnyAds && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Bem-vindo ao seu painel!</h3>
          <p className="text-blue-700 mb-4">
            Você ainda não tem nenhum anúncio publicado. Comece agora mesmo criando seu primeiro anúncio gratuito!
          </p>
          <Link 
            href="/painel-anunciante/criar-anuncio" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
          >
            Criar meu primeiro anúncio
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da esquerda - Ações principais */}
        <div className="space-y-6">
          {/* Botões de ação principais */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações rápidas</h2>
            <div className="space-y-3">
              <Link 
                href="/painel-anunciante/criar-anuncio" 
                className="flex items-center p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <div className="bg-green-200 p-2 rounded-full">
                  <FaPlus className="text-green-600" />
                </div>
                <span className="ml-3 font-medium">Criar novo anúncio</span>
              </Link>
              
              <Link 
                href="/painel-anunciante/meus-anuncios" 
                className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="bg-blue-100 p-2 rounded-full">
                  <FaTags className="text-blue-600" />
                </div>
                <span className="ml-3 font-medium">Gerenciar anúncios</span>
              </Link>
              
              <Link 
                href="/painel-anunciante/meus-destaques" 
                className="flex items-center p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="bg-amber-100 p-2 rounded-full">
                  <FaBullhorn className="text-amber-600" />
                </div>
                <span className="ml-3 font-medium">Gerenciar destaques</span>
              </Link>
              
              <Link 
                href="/painel-anunciante/estatisticas" 
                className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="bg-purple-100 p-2 rounded-full">
                  <FaChartLine className="text-purple-600" />
                </div>
                <span className="ml-3 font-medium">Ver estatísticas</span>
              </Link>
              
              <Link 
                href="/painel-anunciante/meu-perfil" 
                className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="bg-purple-100 p-2 rounded-full">
                  <FaUser className="text-purple-600" />
                </div>
                <span className="ml-3 font-medium">Gerenciar meu perfil</span>
              </Link>
            </div>
          </div>
          
          {/* Widget de Estatísticas */}
          <ViewsStatsWidget userId="current-user" />
          
          {/* Notificações */}
          <NotificationsWidget 
            userId={localStorage.getItem('userId') || sessionStorage.getItem('userId') || ''}
            limit={3}
          />
        </div>
        
        {/* Coluna do meio - Anúncios e relatórios */}
        <div className="space-y-6">
          {/* Meus anúncios - resumo */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-800 flex items-center mb-4">
              <FaClipboardList className="mr-2 text-blue-600" /> Status dos anúncios
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {isLoadingAds ? (
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin"></span>
                  ) : adCounts.active}
                </p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {isLoadingAds ? (
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin"></span>
                  ) : adCounts.pending}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {isLoadingAds ? (
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-red-300 border-t-red-600 animate-spin"></span>
                  ) : adCounts.rejected}
                </p>
                <p className="text-sm text-gray-600">Rejeitados</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {isLoadingAds ? (
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></span>
                  ) : adCounts.finished}
                </p>
                <p className="text-sm text-gray-600">Finalizados</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/painel-anunciante/meus-anuncios"
                className="text-blue-600 hover:text-blue-800 text-sm inline-block"
              >
                Ver todos anúncios
              </Link>
            </div>
          </div>
          
          {/* Plano atual */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-800 mb-3">Plano de Assinatura</h3>
            <div className="p-3 bg-gray-50 rounded-lg mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    Plano {userPlan.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {userPlan.name === 'Gratuito' ? 'Limite: 1 anúncio gratuito a cada 90 dias' : 'Seu plano expira em 30 dias'}
                  </p>
                </div>
                {userPlan.name === 'Gratuito' && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-md">
                    Básico
                  </div>
                )}
                {userPlan.name !== 'Gratuito' && (
                  <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                    Ativo
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {userPlan.name === 'Gratuito' ? (
                <>
                  <Link 
                    href="/painel-anunciante/planos?upgrade=true" 
                    className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    Fazer upgrade
                  </Link>
                  <Link 
                    href="/painel-anunciante/anuncio-extra" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    Comprar anúncio extra
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/painel-anunciante/assinatura" 
                    className="text-blue-600 hover:text-blue-800 text-sm mr-4"
                  >
                    Gerenciar assinatura
                  </Link>
                  <Link 
                    href="/painel-anunciante/anuncio-extra" 
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Comprar anúncio extra
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Coluna da direita - Perfil e ajuda */}
        <div className="space-y-6">
          {/* Perfil */}
          <ProfilePanel 
            profile={profile} 
            name={userName} 
            avatar={profile?.avatar} 
            planName={planName} 
          />
          
          {/* Ajuda e Suporte */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-800 flex items-center mb-4">
              <FaQuestionCircle className="mr-2 text-blue-600" /> Ajuda e Suporte
            </h3>
            <div className="space-y-3">
              <Link 
                href="/ajuda/como-anunciar"
                className="block p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Como criar um anúncio de sucesso
              </Link>
              <Link 
                href="/ajuda/dicas-fotos"
                className="block p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Dicas para fotos atrativas
              </Link>
              <Link 
                href="/ajuda/faq"
                className="block p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Perguntas frequentes
              </Link>
            </div>
            <div className="mt-4 p-3 border border-blue-100 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Precisa de ajuda?</strong> Entre em contato com nosso suporte:
              </p>
              <p className="text-sm text-blue-800 mt-1">
                suporte@bdcclassificados.com.br
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 