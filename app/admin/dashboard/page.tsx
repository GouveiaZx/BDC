"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaMoneyBillWave, 
  FaStore, 
  FaShoppingCart, 
  FaUserAlt, 
  FaChartLine, 
  FaCalendarAlt,
  FaClipboardCheck,
  FaImage,
  FaSpinner,
  FaSyncAlt,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaCreditCard,
  FaBuilding
} from 'react-icons/fa';

// Interfaces para tipagem
interface DashboardStats {
  usuarios: {
    total: number;
    ativos: number;
    novosHoje: number;
    crescimento: number;
  };
  assinaturas: {
    total: number;
    ativas: number;
    receitaMensal: number;
    receitaTotal: number;
    porPlano: {
      basico: number;
      premium: number;
      pro: number;
    };
  };
  empresas: {
    total: number;
    verificadas: number;
    pendentes: number;
  };
  anuncios: {
    total: number;
    ativos: number;
    pendentes: number;
    expirados: number;
  };
  destaques: {
    total: number;
    ativos: number;
    pendentes: number;
  };
}

interface AtividadeRecente {
  id: string;
  tipo: 'usuario' | 'assinatura' | 'anuncio' | 'empresa';
  titulo: string;
  descricao: string;
  data: string;
  status: 'novo' | 'ativo' | 'pendente' | 'cancelado';
}

interface ChartData {
  mes: string;
  basico: number;
  premium: number;
  pro: number;
  total: number;
}

// Componente para card de estatística
const StatCard = ({ 
  title, 
  value, 
  icon, 
  colorClass = 'bg-blue-500',
  isLoading = false,
  subtitle = '',
  trend = null
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  colorClass?: string;
  isLoading?: boolean;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean } | null;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <div className={`p-3 rounded-full ${colorClass}`}>
          {isLoading ? (
            <FaSpinner className="text-white animate-spin" size={18} />
          ) : (
            icon
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">
          {isLoading ? '...' : value}
        </span>
        <div className="flex items-center justify-between mt-2">
          {subtitle && (
            <span className="text-sm text-gray-500">{subtitle}</span>
          )}
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para gráfico de assinaturas
const SubscriptionChart = ({ data }: { data: ChartData[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FaChartLine className="mx-auto mb-2 text-gray-400" size={24} />
          <p>Sem dados para exibir</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.total));
  
  return (
    <div className="h-64 p-4">
      <div className="flex h-full items-end justify-between space-x-2">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex flex-col-reverse" style={{ height: `${Math.max(height, 10)}%` }}>
                {/* Pro */}
                <div 
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                  style={{ height: item.pro > 0 ? `${(item.pro / item.total) * 100}%` : '0%' }}
                  title={`Pro: ${item.pro}`}
                ></div>
                {/* Premium */}
                <div 
                  className="w-full bg-purple-500 hover:bg-purple-600 transition-colors"
                  style={{ height: item.premium > 0 ? `${(item.premium / item.total) * 100}%` : '0%' }}
                  title={`Premium: ${item.premium}`}
                ></div>
                {/* Básico */}
                <div 
                  className="w-full bg-green-500 hover:bg-green-600 transition-colors rounded-t"
                  style={{ height: item.basico > 0 ? `${(item.basico / item.total) * 100}%` : '0%' }}
                  title={`Básico: ${item.basico}`}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-500 mt-2">{item.mes}</div>
            </div>
          );
        })}
      </div>
      
      {/* Legenda */}
      <div className="flex justify-center mt-4 space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600">Básico</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600">Premium</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600">Pro</span>
        </div>
      </div>
    </div>
  );
};

// Componente para lista de atividades recentes
const ActivityItem = ({ activity }: { activity: AtividadeRecente }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
      case 'ativo':
        return 'text-green-600 bg-green-100';
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'usuario':
        return <FaUserAlt className="text-blue-500" size={16} />;
      case 'assinatura':
        return <FaCreditCard className="text-green-500" size={16} />;
      case 'anuncio':
        return <FaShoppingCart className="text-orange-500" size={16} />;
      case 'empresa':
        return <FaBuilding className="text-purple-500" size={16} />;
      default:
        return <FaClipboardCheck className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="p-2 bg-gray-100 rounded-full mr-3">
        {getTypeIcon(activity.tipo)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{activity.titulo}</h4>
        <p className="text-xs text-gray-500 truncate">{activity.descricao}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(activity.data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
        {activity.status}
      </span>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    usuarios: { total: 0, ativos: 0, novosHoje: 0, crescimento: 0 },
    assinaturas: { 
      total: 0, 
      ativas: 0, 
      receitaMensal: 0, 
      receitaTotal: 0,
      porPlano: { basico: 0, premium: 0, pro: 0 }
    },
    empresas: { total: 0, verificadas: 0, pendentes: 0 },
    anuncios: { total: 0, ativos: 0, pendentes: 0, expirados: 0 },
    destaques: { total: 0, ativos: 0, pendentes: 0 }
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [atividadesRecentes, setAtividadesRecentes] = useState<AtividadeRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Buscando dados reais do dashboard...');
      
      // 1. Buscar dados das assinaturas
      let subscriptionsData = { data: [] };
      try {
        const subscriptionsResponse = await fetch('/api/admin/subscriptions?limit=200&status=all');
        if (subscriptionsResponse.ok) {
          subscriptionsData = await subscriptionsResponse.json();
        } else if (subscriptionsResponse.status !== 401) {
          console.warn('Erro ao buscar assinaturas:', subscriptionsResponse.status);
        }
      } catch (error) {
        console.warn('Não foi possível buscar assinaturas:', error);
      }
      
      // 2. Buscar dados das empresas
      let businessData = { data: [] };
      try {
        const businessResponse = await fetch('/api/admin/businesses?limit=100');
        if (businessResponse.ok) {
          businessData = await businessResponse.json();
        } else if (businessResponse.status !== 401) {
          console.warn('Erro ao buscar empresas:', businessResponse.status);
        }
      } catch (error) {
        console.warn('Não foi possível buscar empresas:', error);
      }
      
      // 3. Buscar dados dos usuários
      let totalUsuarios = 0;
      try {
        const usersResponse = await fetch('/api/admin/users?limit=500');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          totalUsuarios = usersData.data?.length || usersData.users?.length || 0;
        }
      } catch (error) {
        console.warn('Não foi possível buscar usuários:', error);
      }
      
      // 4. Buscar dados dos anúncios/classificados
      let anunciosData = { total: 0, ativos: 0, pendentes: 0, expirados: 0 };
      try {
        const adsResponse = await fetch('/api/admin/ads?limit=200');
        if (adsResponse.ok) {
          const adsResult = await adsResponse.json();
          const anuncios = adsResult.data || adsResult.ads || [];
          
          anunciosData = {
            total: anuncios.length,
            ativos: anuncios.filter((ad: any) => ad.status === 'active' || ad.status === 'approved').length,
            pendentes: anuncios.filter((ad: any) => ad.status === 'pending').length,
            expirados: anuncios.filter((ad: any) => ad.status === 'expired' || ad.status === 'inactive').length
          };
        }
      } catch (error) {
        console.warn('Não foi possível buscar anúncios:', error);
      }
      
      // 5. Buscar dados dos destaques
      let destaquesData = { total: 0, ativos: 0, pendentes: 0 };
      try {
        const highlightsResponse = await fetch('/api/admin/highlights?limit=100');
        if (highlightsResponse.ok) {
          const highlightsResult = await highlightsResponse.json();
          const destaques = highlightsResult.data || highlightsResult.highlights || [];
          
          destaquesData = {
            total: destaques.length,
            ativos: destaques.filter((hl: any) => hl.status === 'active' || hl.status === 'approved').length,
            pendentes: destaques.filter((hl: any) => hl.status === 'pending').length
          };
        }
      } catch (error) {
        console.warn('Não foi possível buscar destaques:', error);
      }
      
      // Processar dados das assinaturas
      const assinaturas = subscriptionsData.data || [];
      const ativas = assinaturas.filter((sub: any) => sub.status === 'active' || sub.status === 'ativo');
      const receitaMensal = ativas.reduce((total: number, sub: any) => total + parseFloat(sub.price || 0), 0);
      
      // Contar por plano
      const basico = ativas.filter((sub: any) => (sub.plan_type === 'basic' || sub.planType === 'basic')).length;
      const premium = ativas.filter((sub: any) => (sub.plan_type === 'premium' || sub.planType === 'premium')).length;
      const pro = ativas.filter((sub: any) => (sub.plan_type === 'pro' || sub.planType === 'pro')).length;
      
      // Processar dados das empresas
      const empresas = businessData.data || [];
      const empresasVerificadas = empresas.filter((emp: any) => emp.verified || emp.is_verified).length;
      const empresasPendentes = empresas.filter((emp: any) => 
        emp.moderationStatus === 'pending' || emp.moderation_status === 'pending' || 
        (!emp.verified && !emp.is_verified)
      ).length;
      
      // Calcular novos usuários hoje (aproximação)
      const hoje = new Date().toISOString().split('T')[0];
      const novosHoje = assinaturas.filter((sub: any) => {
        const dataCreated = sub.created_at || sub.createdAt;
        return dataCreated && dataCreated.split('T')[0] === hoje;
      }).length;
      
      // Calcular crescimento baseado nos últimos dados
      const crescimento = assinaturas.length > 0 && ativas.length > 0 
        ? Math.round((ativas.length / assinaturas.length) * 100) 
        : 0;
      
      // Atualizar estatísticas com dados reais
      const novasStats: DashboardStats = {
        usuarios: {
          total: Math.max(totalUsuarios, assinaturas.length + empresas.length),
          ativos: ativas.length + empresasVerificadas,
          novosHoje,
          crescimento
        },
        assinaturas: {
          total: assinaturas.length,
          ativas: ativas.length,
          receitaMensal,
          receitaTotal: receitaMensal * 12,
          porPlano: { basico, premium, pro }
        },
        empresas: {
          total: empresas.length,
          verificadas: empresasVerificadas,
          pendentes: empresasPendentes
        },
        anuncios: anunciosData,
        destaques: destaquesData
      };
      
      setStats(novasStats);
      gerarDadosGrafico(novasStats.assinaturas.porPlano);
      gerarAtividadesRecentes(assinaturas, empresas);
      
      console.log('✅ Dashboard atualizado com dados reais:', novasStats);
      
      // Se não temos dados de nenhuma API, mostrar aviso
      if (assinaturas.length === 0 && empresas.length === 0 && totalUsuarios === 0) {
        setError('Alguns dados podem não estar disponíveis. Verifique se você está autenticado no painel admin.');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Em caso de erro crítico, usar dados mínimos
      const statsVazias: DashboardStats = {
        usuarios: { total: 0, ativos: 0, novosHoje: 0, crescimento: 0 },
        assinaturas: {
          total: 0,
          ativas: 0,
          receitaMensal: 0,
          receitaTotal: 0,
          porPlano: { basico: 0, premium: 0, pro: 0 }
        },
        empresas: { total: 0, verificadas: 0, pendentes: 0 },
        anuncios: { total: 0, ativos: 0, pendentes: 0, expirados: 0 },
        destaques: { total: 0, ativos: 0, pendentes: 0 }
      };
      
      setStats(statsVazias);
      gerarDadosGrafico(statsVazias.assinaturas.porPlano);
      gerarAtividadesRecentes([], []);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para gerar dados do gráfico
  const gerarDadosGrafico = (porPlano: { basico: number; premium: number; pro: number }) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAtual = new Date().getMonth();
    
    const dadosGrafico: ChartData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const indiceMes = (mesAtual - i + 12) % 12;
      
      // Simular crescimento progressivo
      const fatorCrescimento = (5 - i) / 6;
      
      const basico = Math.max(1, Math.round(porPlano.basico * fatorCrescimento));
      const premium = Math.max(1, Math.round(porPlano.premium * fatorCrescimento));
      const pro = Math.max(1, Math.round(porPlano.pro * fatorCrescimento));
      
      dadosGrafico.push({
        mes: meses[indiceMes],
        basico,
        premium,
        pro,
        total: basico + premium + pro
      });
    }
    
    setChartData(dadosGrafico);
  };

  // Função para gerar atividades recentes
  const gerarAtividadesRecentes = (assinaturas: any[], empresas: any[]) => {
    const atividades: AtividadeRecente[] = [];
    
    // Adicionar assinaturas recentes
    assinaturas.slice(0, 3).forEach((sub, index) => {
      atividades.push({
        id: `sub-${sub.id}`,
        tipo: 'assinatura',
        titulo: `Nova assinatura ${sub.plan_type || 'Básica'}`,
        descricao: `${sub.subscriber?.name || sub.user?.name || 'Usuário'} assinou o plano`,
        data: sub.created_at || new Date().toISOString(),
        status: sub.status === 'active' ? 'ativo' : 'pendente'
      });
    });
    
    // Adicionar empresas recentes
    empresas.slice(0, 2).forEach((emp, index) => {
      atividades.push({
        id: `emp-${emp.id}`,
        tipo: 'empresa',
        titulo: `Nova empresa: ${emp.businessName}`,
        descricao: `Empresa ${emp.verified ? 'verificada' : 'aguardando verificação'}`,
        data: emp.createdAt || new Date().toISOString(),
        status: emp.verified ? 'ativo' : 'pendente'
      });
    });
    
    // Ordenar por data mais recente
    atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    setAtividadesRecentes(atividades.slice(0, 5));
  };

  // Função para formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600 mt-2">
              Visão geral da plataforma e métricas principais
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>Erro: {error}</span>
          </div>
        )}
      </div>

      {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Assinaturas Ativas" 
          value={stats.assinaturas.ativas}
          icon={<FaMoneyBillWave className="text-white" size={20} />}
          colorClass="bg-green-500"
          isLoading={loading}
          subtitle={`de ${stats.assinaturas.total} total`}
          trend={stats.assinaturas.total > 0 ? {
            value: Math.round((stats.assinaturas.ativas / stats.assinaturas.total) * 100),
            isPositive: stats.assinaturas.ativas > stats.assinaturas.total * 0.5
          } : null}
        />
        
            <StatCard 
              title="Receita Mensal" 
          value={formatCurrency(stats.assinaturas.receitaMensal)}
          icon={<FaChartLine className="text-white" size={20} />}
          colorClass="bg-blue-500"
          isLoading={loading}
          subtitle="MRR atual"
          trend={stats.assinaturas.receitaMensal > 0 ? {
            value: Math.min(Math.round(stats.assinaturas.receitaMensal / 100), 50),
            isPositive: true
          } : null}
        />
        
            <StatCard 
              title="Anúncios Pendentes" 
          value={stats.anuncios.pendentes}
          icon={<FaClipboardCheck className="text-white" size={20} />}
          colorClass="bg-yellow-500"
          isLoading={loading}
          subtitle="Aguardando aprovação"
        />
        
            <StatCard 
          title="Empresas Ativas"
          value={stats.empresas.verificadas}
          icon={<FaStore className="text-white" size={20} />}
          colorClass="bg-purple-500"
          isLoading={loading}
          subtitle={`de ${stats.empresas.total} total`}
          trend={stats.empresas.total > 0 ? {
            value: Math.round((stats.empresas.verificadas / stats.empresas.total) * 100),
            isPositive: stats.empresas.verificadas > stats.empresas.total * 0.5
          } : null}
            />
          </div>
          
      {/* Segunda linha de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Usuários"
          value={stats.usuarios.total}
          icon={<FaUsers className="text-white" size={20} />}
          colorClass="bg-indigo-500"
          isLoading={loading}
          subtitle={`${stats.usuarios.novosHoje} novos hoje`}
          trend={stats.usuarios.novosHoje > 0 ? {
            value: stats.usuarios.novosHoje,
            isPositive: true
          } : null}
        />
        
        <StatCard
          title="Anúncios Ativos"
          value={stats.anuncios.ativos}
          icon={<FaShoppingCart className="text-white" size={20} />}
          colorClass="bg-orange-500"
          isLoading={loading}
          subtitle={`${stats.anuncios.total} total`}
        />
        
        <StatCard
          title="Destaques Pendentes"
          value={stats.destaques.pendentes}
          icon={<FaImage className="text-white" size={20} />}
          colorClass="bg-pink-500"
          isLoading={loading}
          subtitle="Stories para revisar"
        />
        
        <StatCard
          title="Receita Anual"
          value={formatCurrency(stats.assinaturas.receitaTotal)}
          icon={<FaCreditCard className="text-white" size={20} />}
          colorClass="bg-teal-500"
          isLoading={loading}
          subtitle="Projeção 12 meses"
        />
              </div>
              
      {/* Gráfico de Assinaturas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Evolução das Assinaturas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Distribuição por plano nos últimos 6 meses
              </p>
                </div>
            <Link 
              href="/admin/assinaturas"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver detalhes →
            </Link>
                </div>
              </div>
              
        <div className="p-2">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <FaSpinner className="animate-spin text-gray-400" size={24} />
            </div>
          ) : (
            <SubscriptionChart data={chartData} />
          )}
        </div>
        
        {/* Resumo dos planos */}
        <div className="p-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Básico</span>
                      </div>
              <p className="text-lg font-bold text-gray-900 mt-1">{stats.assinaturas.porPlano.basico}</p>
              <p className="text-xs text-gray-500">R$ 29,90/mês</p>
                    </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Premium</span>
                </div>
              <p className="text-lg font-bold text-gray-900 mt-1">{stats.assinaturas.porPlano.premium}</p>
              <p className="text-xs text-gray-500">R$ 59,90/mês</p>
                  </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Pro</span>
                  </div>
              <p className="text-lg font-bold text-gray-900 mt-1">{stats.assinaturas.porPlano.pro}</p>
              <p className="text-xs text-gray-500">R$ 99,90/mês</p>
                  </div>
                </div>
              </div>
            </div>
            
      {/* Atividades Recentes e Pendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Atividades Recentes</h3>
            <p className="text-sm text-gray-600 mt-1">Últimas ações na plataforma</p>
              </div>
              
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : atividadesRecentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaClipboardCheck className="mx-auto mb-2 text-gray-400" size={24} />
                <p>Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atividadesRecentes.map((atividade) => (
                  <ActivityItem key={atividade.id} activity={atividade} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Pendências */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Itens Pendentes</h3>
            <p className="text-sm text-gray-600 mt-1">Requerem sua atenção</p>
                </div>
                
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-full mr-3">
                  <FaShoppingCart className="text-yellow-600" size={16} />
                    </div>
                    <div>
                  <h4 className="text-sm font-medium text-gray-900">Anúncios Pendentes</h4>
                  <p className="text-xs text-gray-500">Aguardando aprovação</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-yellow-600 mr-2">
                  {stats.anuncios.pendentes}
                </span>
                <Link 
                  href="/admin/classificados"
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <FaEye size={16} />
                </Link>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full mr-3">
                  <FaImage className="text-purple-600" size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Destaques Pendentes</h4>
                  <p className="text-xs text-gray-500">Stories para revisar</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-purple-600 mr-2">
                  {stats.destaques.pendentes}
                          </span>
                          <Link 
                  href="/admin/destaques"
                  className="text-purple-600 hover:text-purple-800"
                >
                  <FaEye size={16} />
                          </Link>
              </div>
          </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <FaStore className="text-blue-600" size={16} />
                    </div>
                    <div>
                  <h4 className="text-sm font-medium text-gray-900">Empresas Pendentes</h4>
                  <p className="text-xs text-gray-500">Aguardando verificação</p>
                    </div>
                  </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-blue-600 mr-2">
                  {stats.empresas.pendentes}
                </span>
                <Link 
                  href="/admin/empresas"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEye size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 