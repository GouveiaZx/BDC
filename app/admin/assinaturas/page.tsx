'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  FaCreditCard, 
  FaUser, 
  FaCheck, 
  FaTimes, 
  FaEdit,
  FaTrash,
  FaEye, 
  FaUserTie,
  FaBuilding,
  FaSearch,
  FaChevronUp,
  FaChevronDown
} from 'react-icons/fa';

import AdminPageHeader from '../../components/admin/AdminPageHeader';
import SyncAsaasButton from '../../components/admin/SyncAsaasButton';

// Interfaces
interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  payment_gateway: string;
  next_payment_date: string | null;
  users: {
    email: string;
    full_name: string;
    avatar?: string;
    type?: string;
  };
  plans: {
    name: string;
    plan_type: string;
    price_monthly: number;
};
}

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
  const router = useRouter();
  
  // Estados
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'cancelled' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'pro'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'starts_at', direction: 'desc' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    total: 0
  });
  
  // Estados dos modais
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  // Estados de carregamento
  const [syncLoading, setSyncLoading] = useState(false);
  
  // Buscar assinaturas
  const fetchSubscriptions = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        plan: planFilter === 'all' ? '' : planFilter,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      
      const response = await fetch(`/api/admin/subscriptions?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar assinaturas');
      }
      
      const data = await response.json();
      
      setSubscriptions(data.subscriptions || []);
        setPagination(prev => ({
          ...prev,
        currentPage: page,
        total: data.total || 0
        }));
    } catch (error: any) {
      console.error('Erro ao buscar assinaturas:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
      fetchSubscriptions();
    fetchAvailablePlans();
  }, [searchTerm, statusFilter, planFilter, sortConfig]);
  
  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchSubscriptions(1);
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtros e ordenação
  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Aplicar filtros
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
        }
        
    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => sub.plans?.plan_type === planFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.users?.full_name?.toLowerCase().includes(term) ||
        sub.users?.email?.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortConfig.key === 'subscriber.name') {
        aVal = a.users?.full_name || '';
        bVal = b.users?.full_name || '';
      } else {
        aVal = a[sortConfig.key as keyof Subscription];
        bVal = b[sortConfig.key as keyof Subscription];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscriptions, searchTerm, statusFilter, planFilter, sortConfig]);
  
  // Buscar planos disponíveis
  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      if (!response.ok) throw new Error('Erro ao buscar planos');

      const data = await response.json();
      setAvailablePlans(data.plans || []);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos disponíveis');
    }
  };
  
  // Formatação de data
  const formatDate = (dateString: string) => {
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
  
  // Classes para badges de plano
  const getPlanBadgeClass = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Tradução de planos
  const getPlanTranslation = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'Básico';
      case 'premium':
        return 'Premium';
      case 'pro':
        return 'Profissional';
      default:
        return planType;
    }
  };
  
  // Classes para badges de status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Tradução de status
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };
  
  // Ícones de ordenação
  const getSortIcon = (key: keyof Subscription | 'subscriber.name') => {
    if (sortConfig.key !== key) {
      return <FaChevronUp className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaChevronUp className="text-blue-500" />
      : <FaChevronDown className="text-blue-500" />;
  };

  // Resumo dos dados
  const summary = useMemo(() => {
    const active = subscriptions.filter(sub => sub.status === 'active').length;
    const pending = subscriptions.filter(sub => sub.status === 'pending').length;
    const cancelled = subscriptions.filter(sub => sub.status === 'cancelled').length;
    const expired = subscriptions.filter(sub => sub.status === 'expired').length;
    const paid = subscriptions.filter(sub => ['active', 'pending'].includes(sub.status)).length;
    
    const monthlyRevenue = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => total + (sub.plans?.price_monthly || 0), 0);
    
    const yearlyRevenue = monthlyRevenue * 12;

    return {
      active,
      pending,
      cancelled,
      expired,
      paid,
      total: subscriptions.length,
      revenue: {
        monthly: monthlyRevenue,
        yearly: yearlyRevenue
      }
    };
  }, [subscriptions]);

  // Dados do cabeçalho
  const getHeaderData = () => {
    return {
      title: "Gerenciar Assinaturas",
      subtitle: "Visualize e gerencie todas as assinaturas do sistema",
      stats: [
        {
          label: "Total de Assinaturas",
          value: summary.total.toString(),
          color: "blue" as const
        },
        {
          label: "Assinaturas Ativas",
          value: summary.active.toString(),
          color: "green" as const
        },
        {
          label: "Receita Mensal",
          value: `R$ ${summary.revenue.monthly.toFixed(2)}`,
          color: "purple" as const
        }
      ]
    };
  };

  const headerData = getHeaderData();

  return (
    <div className="container mx-auto px-4 py-6">
      <AdminPageHeader
        title={headerData.title}
        subtitle={headerData.subtitle}
        icon={FaCreditCard}
        stats={headerData.stats}
      />
      
      {/* Botão de sincronização */}
      <div className="flex justify-end mb-4">
        <SyncAsaasButton onSyncComplete={fetchSubscriptions} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Assinante</span>
                    </div>
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Plano</span>
                    </div>
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                    </div>
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Data de Início</span>
                    </div>
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Valor</span>
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
                            {subscription.users?.avatar ? (
                          <Image
                              className="h-10 w-10 rounded-full object-cover"
                                src={subscription.users.avatar}
                                alt={subscription.users.full_name}
                            width={40}
                            height={40}
                            />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {subscription.users?.type === 'business' ? (
                              <FaBuilding className="text-gray-600 text-lg" />
                            ) : (
                              <FaUser className="text-gray-600 text-lg" />
                                )}
                              </div>
                            )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                              {subscription.users?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                              {subscription.users?.email}
                          </div>
                          <div className="flex items-center mt-1">
                              {subscription.users?.type === 'business' ? (
                              <FaUserTie className="text-blue-500 text-xs mr-1" />
                            ) : (
                              <FaUser className="text-gray-500 text-xs mr-1" />
                            )}
                            <span className="text-xs text-gray-500">
                                {subscription.users?.type === 'business' ? 'Empresa' : 'Pessoa Física'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeClass(subscription.plans?.plan_type || '')}`}>
                          {subscription.plans?.name || getPlanTranslation(subscription.plans?.plan_type || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(subscription.status)}`}>
                        {getStatusTranslation(subscription.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(subscription.starts_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {subscription.plans?.price_monthly?.toFixed(2) || '0.00'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                      <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Ver detalhes"
                      >
                        <FaEye />
                      </button>
                        <button
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Alterar plano"
                        >
                          <FaEdit />
                        </button>
                        <button
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Excluir"
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
    </div>
  );
} 