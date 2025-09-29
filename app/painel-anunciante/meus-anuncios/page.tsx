"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaSearch, FaFilter, FaEye, FaEdit, FaTrash, 
  FaPauseCircle, FaPlayCircle, FaCheckCircle, FaTimesCircle, 
  FaPlus, FaChartBar, FaExternalLinkAlt, FaListAlt, FaHourglassHalf, FaImages
} from 'react-icons/fa';
import { AdModerationStatus } from '../../models/types';

// Interface para os anúncios
interface Ad {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  price: string | number;
  views: number;
  clicks: number;
  status: string;
  moderationStatus: string;
  images: string[];
  photos?: Array<{
    id: string;
    file_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  primary_photo?: string;
  created?: string;
  createdAt: string;
  updatedAt: string;
  expires: string;
  description: string;
  location: string;
}

// Componente para o badge de status
const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'active') {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FaCheckCircle className="mr-1" /> Ativo
      </div>
    );
  }
  
  if (status === 'paused') {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FaPauseCircle className="mr-1" /> Pausado
      </div>
    );
  }
  
  if (status === 'pending') {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaHourglassHalf className="mr-1" /> Pendente
      </div>
    );
  }
  
  if (status === 'rejected') {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <FaTimesCircle className="mr-1" /> Rejeitado
      </div>
    );
  }
  
  return null;
};

// Função para validar URLs de imagens
const validateImageUrl = (url: string): string => {
  if (!url) return '/images/no-image.png';
  
  try {
    // Identificar o problema de URLs com aspas escapadas
    if (typeof url === 'string') {
      // Se for uma string com aspas escapadas como \"url\", vamos corrigir
      if (url.startsWith('\"') && url.endsWith('\"')) {
        url = url.substring(1, url.length - 1);
      }
      
      // Remover outras aspas escapadas (\\")
      url = url.replace(/\\"/g, '');
      
      // Remover aspas simples
      url = url.replace(/"/g, '');
    }
    
    // Verificar se é uma URL válida para imagem
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Imagem estática da pasta public
    if (url.startsWith('/')) {
      return url;
    }
    
    // Adicionar caminho para imagens relativas
    return `/images/no-image.png`;
  } catch (e) {
    console.error('Erro ao processar URL da imagem:', e);
    return '/images/no-image.png';
  }
};

export default function MyAds() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Adicionar estado para modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);

  // Buscar anúncios da API
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        let adsList: Ad[] = [];
        
        // Obter dados de autenticação
        const sbAccessToken = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        
        console.log('=== BUSCA DE ANÚNCIOS DO USUÁRIO ===');
        console.log('Token disponível:', !!sbAccessToken);
        console.log('User ID:', userId);
        console.log('User Email:', userEmail);
        
        if (!userId && !userEmail) {
          console.error('Nem ID nem email do usuário encontrados');
          setError('Você precisa estar logado para ver seus anúncios. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }
        
        // Buscar anúncios usando a nova API
        try {
          console.log('Buscando anúncios via API...');
          
          const response = await fetch(`/api/ads?userId=${userId}&status=all`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Erro ao buscar anúncios');
          }
          
          const supabaseAds = data.ads;
          
          if (supabaseAds && supabaseAds.length > 0) {
            console.log('Anúncios carregados via API:', supabaseAds.length);
            adsList = supabaseAds.map(ad => ({
              id: ad.id,
              title: ad.title,
              category: ad.category,
              subCategory: ad.sub_category,
              price: ad.price,
              views: ad.view_count || 0,
              clicks: ad.contact_count || 0,
              status: ad.status || 'active',
              moderationStatus: ad.moderation_status || 'pending',
              images: Array.isArray(ad.images) ? ad.images : [],
              created: ad.created_at,
              createdAt: ad.created_at,
              updatedAt: ad.updated_at || ad.created_at,
              expires: ad.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              description: ad.description,
              location: ad.location
            }));
          }
          
        } catch (error) {
          console.error('Erro ao buscar anúncios via API:', error);
          throw error;
        }
        
        // Se não encontrou anúncios, mostrar mensagem apropriada
        if (adsList.length === 0) {
          console.log('Nenhum anúncio encontrado para o usuário');
          setError(null); // Não é erro, apenas não há anúncios
        } else {
          console.log(`Total de anúncios encontrados: ${adsList.length}`);
          setError(null);
        }
        
        setAds(adsList);
        
      } catch (error) {
        console.error('Erro geral ao buscar anúncios:', error);
        setError('Erro ao carregar seus anúncios. Tente novamente mais tarde.');
        setAds([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAds();
    
    // Recarregar a cada 30 segundos para pegar novos anúncios
    const interval = setInterval(fetchAds, 30000);
    return () => clearInterval(interval);
  }, []);

  // Componente para o badge de status de moderação
  const ModerationBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'pending':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaHourglassHalf className="mr-1" /> Pendente de Aprovação
          </div>
        );
      case 'approved':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Aprovado
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" /> Rejeitado
          </div>
        );
      default:
        return null;
    }
  };

  // Total stats com base nos anúncios carregados
  const activeAds = ads.filter(ad => ad.status === 'active' && ad.moderationStatus === 'approved').length;
  const pendingModerationAds = ads.filter(ad => ad.status === 'pending' || ad.moderationStatus === 'pending').length;
  const totalViews = ads.reduce((sum, ad) => sum + ad.views, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);

  // Função para abrir modal de confirmação de exclusão
  const confirmDelete = (adId: string) => {
    setAdToDelete(adId);
    setShowDeleteModal(true);
  };
  
  // Função para cancelar exclusão
  const cancelDelete = () => {
    setAdToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Função para excluir anúncio
  const deleteAd = async () => {
    if (!adToDelete) return;
    
    try {
      // Obter token de autenticação do Supabase e ID do usuário
      const sbAccessToken = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      // Para login real ou simulado, usar o userId como token de autorização
      const tokenToUse = sbAccessToken || userId;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenToUse}`
      };
      
      // Enviar o cookie com a sessão
      document.cookie = `sb-access-token=${tokenToUse}; path=/; max-age=3600; SameSite=Lax`;
      
      // Em um ambiente real, chamaríamos a API para excluir
      const response = await fetch(`/api/ads/${adToDelete}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remover o anúncio da lista
        setAds(ads.filter(ad => ad.id !== adToDelete));
        alert('Anúncio excluído com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('Erro ao excluir anúncio:', response.status, errorText);
        
        // Para simulação, excluímos mesmo que dê erro na API
        if (userId && userId.startsWith('temp-id-')) {
          setAds(ads.filter(ad => ad.id !== adToDelete));
          alert('Simulação: Anúncio excluído com sucesso!');
        } else {
          alert(`Erro ao excluir anúncio: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Falha ao excluir anúncio:', error);
      
      // Para simulação, excluímos mesmo que dê erro
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (userId && userId.startsWith('temp-id-')) {
        setAds(ads.filter(ad => ad.id !== adToDelete));
        alert('Simulação: Anúncio excluído com sucesso!');
      } else {
        alert('Falha ao excluir anúncio. Tente novamente mais tarde.');
      }
    } finally {
      setAdToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Inicializar no useEffect após carregar os anúncios
  useEffect(() => {
    if (!loading && ads.length > 0) {
      console.log('Recalculando estatísticas com base no status de moderação...');
      
      // Verificar o status real de cada anúncio
      const realActiveCount = ads.filter(ad => ad.status === 'active' && ad.moderationStatus === 'approved').length;
      const realPendingCount = ads.filter(ad => ad.status === 'pending' || ad.moderationStatus === 'pending').length;
      
      console.log(`Estatísticas reais: ${realActiveCount} ativos, ${realPendingCount} pendentes`);
      
      // Forçar atualização da UI se necessário
      if (realActiveCount !== activeAds || realPendingCount !== pendingModerationAds) {
        console.log('Atualizando UI para refletir estatísticas corretas...');
        // Aqui poderíamos forçar uma atualização, mas o estado já está correto pela lógica acima
      }
    }
  }, [loading, ads, activeAds, pendingModerationAds]);

  if (loading) {
  return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-3 text-red-700 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
            </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Meus anúncios</h1>
            <p className="text-gray-600">Gerencie todos os seus anúncios publicados</p>
          </div>
          <Link href="/painel-anunciante/criar-anuncio" className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
            <FaPlus className="mr-2" /> Novo anúncio
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6 border border-gray-200 rounded-md overflow-hidden">
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Anúncios Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeAds}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaHourglassHalf className="text-yellow-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Aguardando Aprovação</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingModerationAds}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaEye className="text-amber-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Visualizações</p>
                <p className="text-2xl font-semibold text-gray-900">{totalViews}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-start">
              <FaExternalLinkAlt className="text-green-600 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Cliques</p>
                <p className="text-2xl font-semibold text-gray-900">{totalClicks}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="flex justify-between mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Buscar anúncios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* Lista de anúncios */}
        {ads.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-8 text-center border border-gray-200">
            <div className="text-gray-400 text-5xl mb-4">
              <FaListAlt className="mx-auto" />
              </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Você ainda não tem anúncios</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro anúncio e comece a vender!</p>
            <Link 
              href="/painel-anunciante/criar-anuncio" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-green-500 hover:bg-green-600"
            >
              <FaPlus className="mr-2" /> Criar Anúncio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.filter(ad => ad.title.toLowerCase().includes(searchTerm.toLowerCase())).map((ad) => (
              <div key={ad.id} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex">
                  <div className="w-1/3 relative">
                    <div className="h-full bg-gray-200">
                      {(() => {
                        // Priorizar primary_photo se existir
                        if (ad.primary_photo) {
                          return (
                            <img
                              src={validateImageUrl(ad.primary_photo)}
                              alt={ad.title.toString()}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.warn('Erro ao carregar imagem:', ad.primary_photo);
                                (e.target as HTMLImageElement).src = '/images/no-image.png';
                              }}
                            />
                          );
                        }
                        
                        // Usar photos se existir, ordenado por sort_order
                        if (ad.photos && ad.photos.length > 0) {
                          const sortedPhotos = ad.photos.sort((a, b) => a.sort_order - b.sort_order);
                          return (
                            <img
                              src={validateImageUrl(sortedPhotos[0].file_url)}
                              alt={ad.title.toString()}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.warn('Erro ao carregar imagem:', sortedPhotos[0].file_url);
                                (e.target as HTMLImageElement).src = '/images/no-image.png';
                              }}
                            />
                          );
                        }
                        
                        // Fallback para images array
                        if (ad.images && ad.images.length > 0) {
                          return (
                            <img
                              src={validateImageUrl(ad.images[0])}
                              alt={ad.title.toString()}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.warn('Erro ao carregar imagem:', ad.images[0]);
                                (e.target as HTMLImageElement).src = '/images/no-image.png';
                              }}
                            />
                          );
                        }
                        
                        // Sem imagens
                        return (
                          <div className="flex items-center justify-center h-full">
                            <FaImages className="text-gray-400 text-3xl" />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="w-2/3 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">{ad.title}</h3>
                      {/* Priorizar a exibição do status baseado em moderationStatus para evitar inconsistências */}
                      {ad.moderationStatus === 'pending' ? (
                        <StatusBadge status="pending" />
                      ) : (
                        <StatusBadge status={ad.status} />
                      )}
                    </div>
                    
                    {ad.moderationStatus && (
                      <div className="mb-2">
                        <ModerationBadge status={ad.moderationStatus} />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div>
                        <span className="inline-block bg-gray-100 rounded-full px-2 py-0.5">{ad.category}</span>
                        <span className="mx-1">•</span>
                        <span>ID: #{ad.id.substring(0, 8)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 font-bold mb-2">
                      {typeof ad.price === 'number' 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.price) 
                        : ad.price}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <FaEye className="mr-1 text-gray-400" />
                        <span>{ad.views} visualizações</span>
                      </div>
                      <div className="flex items-center">
                        <FaExternalLinkAlt className="mr-1 text-gray-400" />
                        <span>{ad.clicks} cliques</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                      <div className="flex space-x-1">
                        <Link 
                          href={`/painel-anunciante/editar-anuncio/${ad.id}`}
                          className="p-1.5 rounded text-green-600 hover:bg-green-50"
                        >
                          <FaEdit />
                        </Link>
                        <button 
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          onClick={() => confirmDelete(ad.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <button className="text-xs text-gray-500 hover:text-gray-700 p-1.5">
                        Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
              </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
                <button 
                onClick={deleteAd}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                Excluir
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}