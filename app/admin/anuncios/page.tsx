"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  FaSearch, 
  FaFilter, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTrash,
  FaExclamationTriangle,
  FaExclamationCircle
} from 'react-icons/fa';
import AdDetailsModal from '../../components/admin/AdDetailsModal';
import UserProfileModal from '../../components/admin/UserProfileModal';

type Advertisement = {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  images: string[];
  isFeatured: boolean;
  moderationReason?: string;
  seller: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    type: 'personal' | 'business';
  };
};

export default function AdminAnunciosPage() {
  // Envolver o componente que usa useSearchParams em um Suspense boundary
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <AdminAnuncios />
    </Suspense>
  );
}

function AdminAnuncios() {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get('status') as 'all' | 'pending' | 'approved' | 'rejected' | null;
  
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([]);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    statusFromUrl || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Advertisement | 'seller.name',
    direction: 'asc' | 'desc'
  }>({ key: 'createdAt', direction: 'desc' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<Advertisement['seller'] | null>(null);
  
  // Categorias disponíveis
  const categories = [
    'Todas',
    'Eletrônicos',
    'Veículos',
    'Imóveis',
    'Móveis',
    'Roupas',
    'Serviços',
    'Outros'
  ];
  
  // Dados de exemplo
  useEffect(() => {
    // Função para buscar anúncios reais
    const fetchAdvertisements = async () => {
      try {
        setFilteredAds([]); // Limpar lista enquanto carrega
        
        // Usar a API correta que busca dados completos dos usuários
        const apiUrl = `/api/admin/ads?status=${statusFilter}&limit=50`;
        console.log(`Buscando anúncios com dados completos de usuários - status: ${statusFilter}`);
        
        // Buscar anúncios com dados robustos de usuários
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar anúncios: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          // Mapear para o formato esperado pelo componente usando dados robustos
          const fetchedAds = data.data.map((ad: any) => {
            // Extrair dados do usuário das múltiplas fontes
            const userName = ad.user?.name || ad.profiles?.name || 'Usuário não encontrado';
            const userEmail = ad.user?.email || ad.profiles?.email || 'email@nao-encontrado.com';
            const userAvatar = ad.user?.avatar || ad.profiles?.avatar_url || null;
            const userType = ad.user?.type || ad.profiles?.account_type || 'personal';
            
            return {
              id: ad.id,
              title: ad.title,
              price: parseFloat(ad.price) || 0,
              description: ad.description,
              category: ad.category || 'Sem categoria',
              status: ad.status || 'pending',
              createdAt: ad.created_at || ad.createdAt,
              updatedAt: ad.updated_at || ad.updatedAt,
              images: Array.isArray(ad.images) ? ad.images : [],
              isFeatured: ad.isFeatured || ad.is_featured || false,
              moderationReason: ad.moderationReason || ad.moderation_reason,
              seller: {
                id: ad.user_id || ad.userId || 'unknown',
                name: userName,
                email: userEmail,
                avatar: userAvatar || 'https://ui-avatars.io/api/?name=' + encodeURIComponent(userName) + '&background=0d6efd&color=fff',
                type: userType === 'business' ? 'business' : 'personal'
              }
            };
          });
          
          console.log(`✅ Carregados ${fetchedAds.length} anúncios com dados completos de usuários`);
          
          // Verificar quantos usuários têm dados completos
          const usersWithData = fetchedAds.filter(ad => ad.seller.name !== 'Usuário não encontrado').length;
          const usersWithAvatars = fetchedAds.filter(ad => ad.seller.avatar && !ad.seller.avatar.includes('ui-avatars.io')).length;
          console.log(`📊 Usuários com dados: ${usersWithData}/${fetchedAds.length}, com avatars: ${usersWithAvatars}/${fetchedAds.length}`);
          
          // Ordenar por data de criação (mais recentes primeiro)
          fetchedAds.sort((a: Advertisement, b: Advertisement) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          
          setAdvertisements(fetchedAds);
          setFilteredAds(fetchedAds);
        } else {
          console.warn('Nenhum anúncio encontrado ou formato de resposta inesperado');
          setAdvertisements([]);
          setFilteredAds([]);
        }
      } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
        setAdvertisements([]);
        setFilteredAds([]);
      }
    };
    
    fetchAdvertisements();
  }, [statusFilter]); // Refaz a busca quando o filtro de status muda
  
  // Atualizar o status do filtro quando mudar na URL
  useEffect(() => {
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);
  
  // Função para moderar anúncio (aprovar ou rejeitar)
  const moderateAd = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setIsProcessing(true);
    setProcessingMessage(action === 'approve' ? 'Publicando anúncio...' : 'Recusando anúncio...');
    
    try {
      console.log(`Iniciando requisição para ${action} anúncio ${id}`);
      
      const requestBody = {
        id,
        action,
        reason: action === 'reject' ? reason : undefined
      };
      
      console.log('Dados da requisição:', requestBody);
      
      const response = await fetch('/api/admin/ads/moderate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`Resposta recebida com status: ${response.status}`);
      
      // Se a resposta não for OK, tentar capturar o texto da resposta para mais detalhes
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Resposta de erro (${response.status}):`, errorText);
        throw new Error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} anúncio: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      if (data.success) {
        // Atualizar a lista de anúncios
        setFilteredAds(filteredAds.filter(ad => ad.id !== id));
        setIsDetailsModalOpen(false);
        
        // Mostrar mensagem de sucesso
        setProcessingMessage(action === 'approve' ? 'Anúncio publicado com sucesso!' : 'Anúncio recusado com sucesso!');
        setTimeout(() => {
          setIsProcessing(false);
          setProcessingMessage('');
        }, 2000);
      } else {
        console.error('Resposta indica falha:', data);
        throw new Error(data.error || `Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} anúncio`);
      }
    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} anúncio:`, error);
      setProcessingMessage(`Erro ao ${action === 'approve' ? 'publicar' : 'recusar'} anúncio. Tente novamente.`);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage('');
      }, 3000);
    }
  };
  
  // Funções para manipular filtros e ordenação
  useEffect(() => {
    // Aplicar filtros e ordenação aos anúncios
    let result = [...advertisements];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ad => 
        ad.title.toLowerCase().includes(term) || 
        ad.description.toLowerCase().includes(term) ||
        ad.seller.name.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por categoria
    if (categoryFilter !== 'all') {
      result = result.filter(ad => 
        ad.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // Ordenar
    result.sort((a, b) => {
      const aValue = sortConfig.key === 'seller.name' ? a.seller.name : a[sortConfig.key as keyof Advertisement];
      const bValue = sortConfig.key === 'seller.name' ? b.seller.name : b[sortConfig.key as keyof Advertisement];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Para datas em formato string
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setFilteredAds(result);
  }, [advertisements, searchTerm, categoryFilter, sortConfig]);
  
  // Tratador de clique em coluna para ordenação
  const handleSort = (key: keyof Advertisement | 'seller.name') => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Advertisement | 'seller.name') => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };
  
  const handleApprove = (id: string) => {
    moderateAd(id, 'approve');
  };
  
  const handleReject = (id: string, reason: string) => {
    console.log(`Iniciando rejeição do anúncio ${id} com motivo: "${reason}"`);
    
    if (!reason || reason.trim() === '') {
      console.error('Tentativa de rejeição sem informar motivo');
      alert('É necessário informar o motivo da rejeição.');
      return;
    }
    
    // Validar tamanho do motivo
    if (reason.length < 5) {
      console.error('Motivo de rejeição muito curto');
      alert('Por favor, forneça um motivo mais detalhado para a rejeição.');
      return;
    }
    
    moderateAd(id, 'reject', reason);
  };
  
  const openDetailsModal = (adId: string) => {
    setSelectedAdId(adId);
    setIsDetailsModalOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para acessar perfil do usuário
  const openUserProfile = (seller: Advertisement['seller']) => {
    setSelectedUserData(seller);
    setIsUserProfileModalOpen(true);
    console.log('Abrindo perfil do usuário:', seller);
  };
  
  // Função para deletar anúncio
  const deleteAd = async (id: string) => {
    setIsProcessing(true);
    setProcessingMessage('Excluindo anúncio...');
    
    try {
      console.log(`Iniciando requisição para excluir anúncio ${id}`);
      
      // Usar apenas a chave necessária para identificação básica
      const adminToken = localStorage.getItem('adminToken') || 'admin-token';
      
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      
      const response = await fetch(`/api/admin/ads/${id}?t=${timestamp}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      console.log(`Resposta recebida com status: ${response.status}`);
      let responseText;
      
      try {
        // Tentar obter o JSON da resposta
        const data = await response.json();
        console.log('Dados da resposta:', data);
        responseText = JSON.stringify(data);
        
        if (data.success) {
          // Remover anúncio da lista
          setAdvertisements(advertisements.filter(ad => ad.id !== id));
          setFilteredAds(filteredAds.filter(ad => ad.id !== id));
          setIsDeleteModalOpen(false);
          setAdToDelete(null);
          
          // Mostrar mensagem de sucesso
          setProcessingMessage('Anúncio excluído com sucesso!');
          setTimeout(() => {
            setIsProcessing(false);
            setProcessingMessage('');
          }, 2000);
          return;
        }
      } catch (jsonError) {
        // Se falhar ao parsear JSON, obter o texto da resposta
        console.error('Erro ao parsear JSON da resposta:', jsonError);
        responseText = await response.text();
        console.log('Texto da resposta:', responseText);
      }
      
      // Se chegou aqui, houve algum erro
      throw new Error(`Erro ao excluir anúncio: ${response.status} - ${responseText}`);
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      setProcessingMessage('Erro ao excluir anúncio. Tente novamente.');
      alert(`Falha ao excluir anúncio: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage('');
      }, 3000);
    }
  };
  
  const openDeleteModal = (ad: Advertisement) => {
    setAdToDelete(ad);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAdToDelete(null);
  };
  
  const confirmDelete = () => {
    if (adToDelete) {
      deleteAd(adToDelete.id);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        {statusFilter === 'pending' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Anúncios Aguardando Aprovação</h1>
            <p className="text-gray-600">Aprove para publicar ou recuse os anúncios</p>
          </>
        ) : statusFilter === 'approved' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Anúncios Publicados</h1>
            <p className="text-gray-600">Anúncios que foram aprovados e estão disponíveis para visualização</p>
          </>
        ) : statusFilter === 'rejected' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Anúncios Recusados</h1>
            <p className="text-gray-600">Anúncios que não foram aprovados para publicação</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Todos os Anúncios</h1>
            <p className="text-gray-600">Visualize e gerencie os anúncios da plataforma</p>
          </>
        )}
      </div>
      
      {/* Barra de ferramentas */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar anúncios..."
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaFilter className="inline-block mr-2" />
              Filtros
            </button>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Aguardando Aprovação</option>
              <option value="approved">Publicados</option>
              <option value="rejected">Recusados</option>
            </select>
          </div>
        </div>
        
        {/* Painel de filtros expandido */}
        <div className={`mt-4 ${isFilterOpen ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status de processamento */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-800">{processingMessage}</p>
          </div>
        </div>
      )}
      
      {/* Listagem de anúncios */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredAds.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum anúncio encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou fazer uma nova busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      Preço
                      <span className="ml-1">{getSortIcon('price')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('seller.name')}
                  >
                    <div className="flex items-center">
                      Anunciante
                      <span className="ml-1">{getSortIcon('seller.name')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Data
                      <span className="ml-1">{getSortIcon('createdAt')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className={`hover:bg-gray-50 ${ad.isFeatured ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {ad.images.length > 0 && (
                            <Image 
                              src={ad.images[0]} 
                              alt={ad.title}
                              width={40}
                              height={40}
                              className="object-cover h-full w-full"
                            />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{ad.title}</div>
                          <div className="text-xs text-gray-500">{ad.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(ad.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center">
                        <button
                          onClick={() => openUserProfile(ad.seller)}
                          className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 mr-2 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                          title={`Ver perfil de ${ad.seller.name}`}
                        >
                          <Image 
                            src={ad.seller.avatar} 
                            alt={ad.seller.name}
                            width={32}
                            height={32}
                            className="object-cover h-full w-full"
                          />
                        </button>
                        <div className="flex flex-col">
                          <button
                            onClick={() => openUserProfile(ad.seller)}
                            className="text-sm text-gray-900 hover:text-blue-600 transition-colors text-left"
                            title={`Ver perfil de ${ad.seller.name}`}
                          >
                            {ad.seller.name}
                          </button>
                          <span className="text-xs text-gray-500">
                            {ad.seller.type === 'business' ? '🏢 Empresa' : '👤 Pessoa Física'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-500">
                        {formatDate(ad.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${ad.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          ad.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {ad.status === 'approved' ? 'Publicado' : 
                         ad.status === 'rejected' ? 'Recusado' : 
                         'Aguardando'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openDetailsModal(ad.id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Ver detalhes"
                        >
                          <FaEye />
                        </button>
                        
                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Aprovar"
                            >
                              <FaCheck />
                            </button>
                            
                            <button
                              onClick={() => {
                                console.log('Abrindo modal de rejeição para:', ad.id);
                                setSelectedAdId(ad.id);
                                setIsRejectModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Rejeitar"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        
                        {/* Botão de excluir para todos os anúncios */}
                        <button
                          onClick={() => openDeleteModal(ad)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Excluir anúncio"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de detalhes */}
      {isDetailsModalOpen && selectedAdId && (
        <AdDetailsModal
          adId={selectedAdId}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      
      {/* Modal de perfil do usuário */}
      {isUserProfileModalOpen && selectedUserData && (
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => {
            setIsUserProfileModalOpen(false);
            setSelectedUserData(null);
          }}
          userData={{
            id: selectedUserData.id,
            name: selectedUserData.name,
            email: selectedUserData.email,
            avatar: selectedUserData.avatar,
            type: selectedUserData.type,
            // TODO: Buscar dados adicionais do usuário se necessário
          }}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && adToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center text-red-600 mb-4">
              <FaExclamationCircle className="text-2xl mr-2" />
              <h3 className="text-xl font-bold">Confirmar exclusão</h3>
            </div>
            
            <p className="mb-2">Tem certeza que deseja excluir permanentemente este anúncio?</p>
            <div className="bg-gray-100 p-3 rounded-lg mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0">
                  <img 
                    src={adToDelete.images[0] || '/images/placeholder.jpg'} 
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{adToDelete.title}</p>
                  <p className="text-sm text-gray-500">
                    Anunciante: {adToDelete.seller.name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir anúncio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 