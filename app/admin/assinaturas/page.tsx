"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaSearch, 
  FaFilter, 
  FaSortUp, 
  FaSortDown,
  FaSort,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaCreditCard,
  FaUserTie,
  FaUser,
  FaBuilding
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAdmin } from '../AdminContext';

// Tipos
type Subscription = {
  id: string;
  planType: string;
  planName: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  price: number;
  renewalDate: string;
  paymentMethod: string;
  paymentId?: string;
  isTrialPeriod?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subscriber: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    type: 'personal' | 'business';
  };
};

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  maxAds: number;
  highlighted: boolean;
  userType: string;
  active: boolean;
  order: number;
};

type SortConfig = {
  key: keyof Subscription | 'subscriber.name';
  direction: 'asc' | 'desc';
};

export default function AdminAssinaturas() {
  const { isAuthenticated, logout } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'cancelled' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'pro'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'startDate', direction: 'desc' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    pending: 0,
    cancelled: 0,
    expired: 0,
    paid: 0,
    free: 0,
    revenue: {
      monthly: 0
    }
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    currentPage: 1
  });
  
  // Redirecionar se não autenticado - VERSÃO CORRIGIDA
  useEffect(() => {
    // Aguardar o loading inicial terminar antes de fazer redirecionamento
    if (!isLoading && !isAuthenticated) {
      console.log('[Admin Assinaturas] Usuário não autenticado após loading, redirecionando...');
      
      // Usar router.push ao invés de window.location para evitar loop
      const timeout = setTimeout(() => {
        window.location.href = '/admin/login';
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isLoading]);
  
  // Função para buscar assinaturas da API - Usando useCallback para memoizar
  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construir URL com parâmetros de filtro
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (planFilter !== 'all') {
        params.append('plan', planFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());
      
      // URL da API principal de assinaturas
      const apiUrl = `/api/admin/subscriptions?${params.toString()}`;
      
      console.log(`[Assinaturas] Buscando da API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });
      
      if (response.status === 401) {
        console.error('[Assinaturas] Erro de autenticação: 401');
          setError('Sessão expirada. Por favor, faça login novamente.');
          setTimeout(() => {
          logout();
        }, 2000);
          return;
      }
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Assinaturas] Dados recebidos:', data.data?.length || 0, 'registros');
      
      if (data.success) {
        setSubscriptions(data.data || []);
        setFilteredSubscriptions(data.data || []);
        
        if (data.stats) {
          setSummary(data.stats);
        }
        
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0
        }));
      } else {
        throw new Error(data.message || 'Erro ao buscar assinaturas');
      }
    } catch (err) {
      console.error('[Assinaturas] Erro ao buscar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar assinaturas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, planFilter, searchTerm, pagination.limit, pagination.offset, logout]);
  
  // Buscar assinaturas quando os filtros ou paginação mudar
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions();
    }
  }, [isAuthenticated, fetchSubscriptions]);
  
  // Alternar página
  const goToPage = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({
      ...prev,
      offset: newOffset,
      currentPage: page
    }));
  };
  
  // Atualizar uma assinatura
  const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...data
        }),
        credentials: 'include'
      });
      
        if (response.status === 401) {
            toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
            return;
        }
        
      if (!response.ok) {
        throw new Error(`Erro ao atualizar assinatura: ${response.status}`);
      }
      
      toast.success('Assinatura atualizada com sucesso!');
      await fetchSubscriptions();
      setIsDetailModalOpen(false);
      
    } catch (err) {
      console.error('Erro ao atualizar assinatura:', err);
      toast.error('Erro ao atualizar assinatura');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Excluir uma assinatura
  const deleteSubscription = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assinatura?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/subscriptions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir assinatura: ${response.status}`);
      }
      
      toast.success('Assinatura excluída com sucesso!');
      await fetchSubscriptions();
      
    } catch (err) {
      console.error('Erro ao excluir assinatura:', err);
      toast.error('Erro ao excluir assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  // Visualizar detalhes de uma assinatura
  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsDetailModalOpen(true);
  };
  
  // Buscar planos disponíveis
  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch('/api/admin/plans', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ao buscar planos: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAvailablePlans(data.data || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar planos');
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao buscar planos disponíveis');
    }
  };

  // Abrir modal de troca de plano
  const handleChangePlan = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setSelectedPlan('');
    setIsChangePlanModalOpen(true);
    if (availablePlans.length === 0) {
      fetchAvailablePlans();
    }
  };

  // Confirmar troca de plano
  const confirmChangePlan = async () => {
    if (!selectedSubscription || !selectedPlan) {
      toast.error('Selecione um plano');
      return;
    }

    const selectedPlanData = availablePlans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) {
      toast.error('Plano não encontrado');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedSubscription.id,
          plan_id: selectedPlan
        }),
        credentials: 'include'
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ao alterar plano: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Plano alterado para "${selectedPlanData.name}" com sucesso!`);
        await fetchSubscriptions();
        setIsChangePlanModalOpen(false);
        setSelectedSubscription(null);
        setSelectedPlan('');
      } else {
        throw new Error(data.message || 'Erro ao alterar plano');
      }
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast.error('Erro ao alterar plano');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Ordenação
  const handleSort = (key: keyof Subscription | 'subscriber.name') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Formatação de data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };
  
  // Classes CSS para badges de plano
  const getPlanBadgeClass = (planType: string) => {
    const classes = {
      'free': 'bg-gray-100 text-gray-800',
      'gratuito': 'bg-gray-100 text-gray-800',
      'basic': 'bg-blue-100 text-blue-800',
      'microempresa': 'bg-blue-100 text-blue-800',
      'premium': 'bg-purple-100 text-purple-800',
      'pequena-empresa': 'bg-purple-100 text-purple-800',
      'pro': 'bg-green-100 text-green-800',
      'empresa': 'bg-green-100 text-green-800',
      'empresa-plus': 'bg-yellow-100 text-yellow-800'
    };
    return classes[planType as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };
  
  // Tradução de planos
  const getPlanTranslation = (planType: string) => {
    const translations = {
      'free': 'Gratuito',
      'gratuito': 'Gratuito',
      'basic': 'Básico',
      'microempresa': 'Microempresa',
      'premium': 'Premium',
      'pequena-empresa': 'Pequena Empresa',
      'pro': 'Profissional',
      'empresa': 'Empresa',
      'empresa-plus': 'Empresa Plus'
    };
    return translations[planType as keyof typeof translations] || planType;
  };
  
  // Classes CSS para badges de status
  const getStatusBadgeClass = (status: string) => {
    const classes = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };
  
  // Tradução de status
  const getStatusTranslation = (status: string) => {
    const translations = {
      'active': 'Ativa',
      'pending': 'Pendente',
      'cancelled': 'Cancelada',
      'expired': 'Expirada'
    };
    return translations[status as keyof typeof translations] || status;
  };
  
  // Ícones de ordenação
  const getSortIcon = (key: keyof Subscription | 'subscriber.name') => {
    if (sortConfig.key !== key) {
      return <FaSort className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="text-blue-500" /> : 
      <FaSortDown className="text-blue-500" />;
  };

  // Não renderizar nada se ainda está carregando ou não autenticado
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie as assinaturas de clientes e empresas</p>
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assinaturas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{summary.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheck className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">R$ {summary.revenue.monthly.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaCreditCard className="text-yellow-600 text-xl" />
          </div>
        </div>
            </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assinaturas Pagas</p>
              <p className="text-2xl font-bold text-gray-900">{summary.paid || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUserTie className="text-blue-600 text-xl" />
          </div>
        </div>
      </div>
            </div>

      {/* Controles de Busca e Filtro */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
            <input
              type="text"
                placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativa</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelada</option>
              <option value="expired">Expirada</option>
            </select>
            
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Planos</option>
              <option value="basic">Básico</option>
              <option value="premium">Premium</option>
              <option value="pro">Profissional</option>
            </select>
          </div>
                    </div>
                  </div>
                  
      {/* Estado de Carregamento */}
      {isLoading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assinaturas...</p>
                </div>
              )}

      {/* Estado de Erro */}
      {error && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <FaTimes className="text-4xl mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Erro ao carregar assinaturas</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
            <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
      )}

      {/* Tabela de Assinaturas */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('subscriber.name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Assinante</span>
                      {getSortIcon('subscriber.name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('planType')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Plano</span>
                      {getSortIcon('planType')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data de Início</span>
                      {getSortIcon('startDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Valor</span>
                      {getSortIcon('price')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {subscription.subscriber.avatar ? (
                          <Image
                              className="h-10 w-10 rounded-full object-cover"
                            src={subscription.subscriber.avatar}
                            alt={subscription.subscriber.name}
                            width={40}
                            height={40}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Se erro no carregamento, esconde a imagem e mostra ícone
                                target.style.display = 'none';
                                const iconDiv = target.nextElementSibling as HTMLDivElement;
                                if (iconDiv) iconDiv.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${subscription.subscriber.avatar ? 'hidden' : 'flex'}`}
                          >
                            {subscription.subscriber.type === 'business' ? (
                              <FaBuilding className="text-gray-600 text-lg" />
                            ) : (
                              <FaUser className="text-gray-600 text-lg" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.subscriber.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.subscriber.email}
                          </div>
                          <div className="flex items-center mt-1">
                            {subscription.subscriber.type === 'business' ? (
                              <FaUserTie className="text-blue-500 text-xs mr-1" />
                            ) : (
                              <FaUser className="text-gray-500 text-xs mr-1" />
                            )}
                            <span className="text-xs text-gray-500">
                              {subscription.subscriber.type === 'business' ? 'Empresa' : 'Pessoal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeClass(subscription.planType)}`}>
                        {subscription.planName || getPlanTranslation(subscription.planType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(subscription.status)}`}>
                        {getStatusTranslation(subscription.status)}
                      </span>
                      {subscription.isTrialPeriod && (
                        <div className="text-xs text-blue-600 mt-1">Período de teste</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(subscription.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {subscription.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSubscription(subscription)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Visualizar detalhes"
                      >
                        <FaEye />
                      </button>
                        <button
                          onClick={() => handleChangePlan(subscription)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Trocar plano"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Excluir assinatura"
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
      
          {/* Paginação */}
          {pagination.total > pagination.limit && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
              <button
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.limit)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
              </button>
            </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{pagination.offset + 1}</span>
                    {' '}até{' '}
                    <span className="font-medium">
                      {Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>
                    {' '}de{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}resultados
                  </p>
                      </div>
                      <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                      .filter(page => {
                        const current = pagination.currentPage;
                        return page === 1 || page === Math.ceil(pagination.total / pagination.limit) ||
                               (page >= current - 2 && page <= current + 2);
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.limit)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </nav>
                      </div>
                      </div>
                    </div>
          )}

          {/* Mensagem quando não há dados */}
          {!isLoading && !error && filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <FaUser className="text-4xl mx-auto mb-2 opacity-50" />
                <h3 className="text-lg font-medium">Nenhuma assinatura encontrada</h3>
              </div>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Quando houver assinaturas, elas aparecerão aqui.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {isDetailModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detalhes da Assinatura
              </h3>
              
              <div className="space-y-3">
                      <div>
                  <span className="font-medium text-gray-700">Assinante:</span>
                  <p className="text-gray-900">{selectedSubscription.subscriber.name}</p>
                  <p className="text-gray-600 text-sm">{selectedSubscription.subscriber.email}</p>
                      </div>
                      
                      <div>
                  <span className="font-medium text-gray-700">Plano:</span>
                  <p className="text-gray-900">{selectedSubscription.planName || getPlanTranslation(selectedSubscription.planType)}</p>
                      </div>
                      
                      <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedSubscription.status)}`}>
                          {getStatusTranslation(selectedSubscription.status)}
                  </span>
                </div>
                
                      <div>
                  <span className="font-medium text-gray-700">Valor:</span>
                  <p className="text-gray-900">R$ {selectedSubscription.price.toFixed(2)}</p>
                      </div>
                      
                      <div>
                  <span className="font-medium text-gray-700">Data de Início:</span>
                  <p className="text-gray-900">{formatDate(selectedSubscription.startDate)}</p>
                </div>
                
                {selectedSubscription.endDate && (
                  <div>
                    <span className="font-medium text-gray-700">Data de Término:</span>
                    <p className="text-gray-900">{formatDate(selectedSubscription.endDate)}</p>
                      </div>
                )}
                      
                      <div>
                  <span className="font-medium text-gray-700">Método de Pagamento:</span>
                  <p className="text-gray-900">{selectedSubscription.paymentMethod || 'N/A'}</p>
                </div>
                
                {selectedSubscription.paymentId && (
                  <div>
                    <span className="font-medium text-gray-700">ID do Pagamento:</span>
                    <p className="text-gray-900 text-sm font-mono">{selectedSubscription.paymentId}</p>
                    </div>
                )}
                  </div>
                  
              <div className="flex justify-end space-x-3 mt-6">
                      <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                  Fechar
                      </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Troca de Plano */}
      {isChangePlanModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Alterar Plano de {selectedSubscription.subscriber.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Plano Atual:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900 font-medium">
                      {selectedSubscription.planName || getPlanTranslation(selectedSubscription.planType)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      R$ {selectedSubscription.price.toFixed(2)}/mês
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Plano:
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um plano</option>
                    {availablePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toFixed(2)}/mês
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && availablePlans.find(p => p.id === selectedPlan) && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Novo Plano:</p>
                      <p className="text-blue-800">
                        {availablePlans.find(p => p.id === selectedPlan)?.name}
                      </p>
                      <p className="text-blue-700">
                        R$ {availablePlans.find(p => p.id === selectedPlan)?.price.toFixed(2)}/mês
                      </p>
                      <div className="mt-2">
                        <p className="font-medium text-blue-900">Recursos:</p>
                        <ul className="text-blue-700 text-xs mt-1">
                          {availablePlans.find(p => p.id === selectedPlan)?.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                      <button 
                  onClick={() => {
                    setIsChangePlanModalOpen(false);
                    setSelectedPlan('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={actionLoading}
                >
                  Cancelar
                      </button>
                    <button 
                  onClick={confirmChangePlan}
                  disabled={!selectedPlan || actionLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                  {actionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {actionLoading ? 'Alterando...' : 'Confirmar Alteração'}
                      </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 