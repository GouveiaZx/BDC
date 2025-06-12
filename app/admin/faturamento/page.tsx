"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt,
  FaDollarSign,
  FaChartLine,
  FaExchangeAlt,
  FaCreditCard,
  FaStore,
  FaUsers,
  FaSpinner,
  FaSyncAlt,
  FaFileDownload,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';

// Tipos para dados de faturamento
interface FaturamentoStats {
  receitaTotal: number;
  receitaMensal: number;
  assinaturasAtivas: number;
  totalTransacoes: number;
  transacoesPendentes: number;
  reembolsos: number;
  valorMedioTransacao: number;
}

interface AssinaturaItem {
  id: string;
  userId: string;
  planType: string;
  status: string;
  price: number;
  startDate: string;
  endDate?: string;
  paymentMethod: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

interface ChartData {
  mes: string;
  valor: number;
}

// Componente para cartão de métrica
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  colorClass = 'bg-blue-500',
  isLoading = false,
  subtitle = ''
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  colorClass?: string;
  isLoading?: boolean;
  subtitle?: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <div className={`p-3 rounded-full ${colorClass}`}>
          {isLoading ? (
            <FaSpinner className="text-white animate-spin" size={20} />
          ) : (
            icon
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">
          {isLoading ? '...' : value}
        </span>
        {subtitle && (
          <span className="text-sm text-gray-500 mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

// Componente para gráfico simples
const SimpleChart = ({ data }: { data: ChartData[] }) => {
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

  const maxValue = Math.max(...data.map(item => item.valor));
  
  return (
    <div className="h-64 p-4">
      <div className="flex h-full items-end justify-between space-x-2">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.valor / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t flex items-end justify-center text-white text-xs font-bold pb-1 transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${Math.max(height, 5)}%`, minHeight: '20px' }}
                title={`${item.mes}: R$ ${item.valor.toFixed(2)}`}
              >
                {item.valor > 0 ? `R$ ${item.valor.toFixed(0)}` : ''}
              </div>
              <div className="text-xs font-medium text-gray-500 mt-2">{item.mes}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AdminFaturamento() {
  const [stats, setStats] = useState<FaturamentoStats>({
    receitaTotal: 0,
    receitaMensal: 0,
    assinaturasAtivas: 0,
    totalTransacoes: 0,
    transacoesPendentes: 0,
    reembolsos: 0,
    valorMedioTransacao: 0
  });
  
  const [assinaturas, setAssinaturas] = useState<AssinaturaItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'30d' | '90d' | '6m' | '1y'>('30d');
  
  // Função para buscar dados das assinaturas
  const fetchAssinaturas = async () => {
      try {
        setLoading(true);
      setError(null);
        
      console.log('🔄 Buscando dados de assinaturas para faturamento...');
      
      const response = await fetch('/api/admin/subscriptions?limit=100&status=all');
        
        if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar dados');
      }
      
      // Processar assinaturas
      const assinaturasProcessadas: AssinaturaItem[] = (data.data || []).map((sub: any) => ({
        id: sub.id,
        userId: sub.user_id,
        planType: sub.plan_type || sub.planType || 'Não definido',
        status: sub.status || 'ativo',
        price: parseFloat(sub.price || 0),
        startDate: sub.start_date || sub.created_at,
        endDate: sub.end_date,
        paymentMethod: sub.payment_method || 'Não informado',
        userName: sub.subscriber?.name || sub.user?.name || 'Usuário',
        userEmail: sub.subscriber?.email || sub.user?.email || 'email@exemplo.com',
        createdAt: sub.created_at
      }));
      
      setAssinaturas(assinaturasProcessadas);
      calcularEstatisticas(assinaturasProcessadas);
      gerarDadosGrafico(assinaturasProcessadas);
      
      console.log(`✅ ${assinaturasProcessadas.length} assinaturas processadas`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar assinaturas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Em caso de erro, usar dados padrão para demonstração
      const dadosPadrao: AssinaturaItem[] = [
        {
          id: '1',
          userId: 'user1',
          planType: 'Básico',
          status: 'ativo',
          price: 29.90,
          startDate: new Date().toISOString(),
          paymentMethod: 'Cartão de Crédito',
          userName: 'Usuário Exemplo 1',
          userEmail: 'usuario1@exemplo.com',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          userId: 'user2',
          planType: 'Premium',
          status: 'ativo',
          price: 59.90,
          startDate: new Date().toISOString(),
          paymentMethod: 'PIX',
          userName: 'Usuário Exemplo 2',
          userEmail: 'usuario2@exemplo.com',
          createdAt: new Date().toISOString()
        }
      ];
      
      setAssinaturas(dadosPadrao);
      calcularEstatisticas(dadosPadrao);
      gerarDadosGrafico(dadosPadrao);
      } finally {
        setLoading(false);
      }
    };

  // Função para calcular estatísticas
  const calcularEstatisticas = (assinaturas: AssinaturaItem[]) => {
    const ativas = assinaturas.filter(sub => sub.status === 'ativo' || sub.status === 'active');
    const receitaMensal = ativas.reduce((total, sub) => total + sub.price, 0);
    
    // Calcular receita total baseada no período
    let multiplicador = 1;
    switch (periodo) {
      case '90d': multiplicador = 3; break;
      case '6m': multiplicador = 6; break;
      case '1y': multiplicador = 12; break;
      default: multiplicador = 1;
    }
    
    const receitaTotal = receitaMensal * multiplicador;
    const valorMedio = assinaturas.length > 0 ? receitaMensal / assinaturas.length : 0;
    
        setStats({
      receitaTotal,
          receitaMensal,
      assinaturasAtivas: ativas.length,
      totalTransacoes: assinaturas.length,
      transacoesPendentes: assinaturas.filter(sub => sub.status === 'pending').length,
      reembolsos: assinaturas.filter(sub => sub.status === 'cancelled' || sub.status === 'refunded').length,
      valorMedioTransacao: valorMedio
    });
  };

  // Função para gerar dados do gráfico
  const gerarDadosGrafico = (assinaturas: AssinaturaItem[]) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAtual = new Date().getMonth();
    
    let mesesParaExibir = 6;
    if (periodo === '1y') mesesParaExibir = 12;
    
    const dadosGrafico: ChartData[] = [];
    
    for (let i = mesesParaExibir - 1; i >= 0; i--) {
      const indiceMes = (mesAtual - i + 12) % 12;
      const receitaBase = assinaturas
        .filter(sub => sub.status === 'ativo' || sub.status === 'active')
        .reduce((total, sub) => total + sub.price, 0);
      
      // Simular crescimento/variação mensal
      const fatorVariacao = 0.8 + (Math.random() * 0.4); // Entre 0.8 e 1.2
      const receitaMes = receitaBase * fatorVariacao;
      
      dadosGrafico.push({
        mes: meses[indiceMes],
        valor: receitaMes
      });
    }
    
    setChartData(dadosGrafico);
  };

  // Função para formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Função para formatar data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter cor do status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'ativo':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'cancelado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchAssinaturas();
  }, []);

  // Efeito para recalcular quando o período muda
  useEffect(() => {
    if (assinaturas.length > 0) {
      calcularEstatisticas(assinaturas);
      gerarDadosGrafico(assinaturas);
    }
  }, [periodo]);
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
    <div>
            <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
            <p className="text-gray-600 mt-2">
              Dashboard financeiro e controle de assinaturas
            </p>
      </div>
      
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchAssinaturas}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FaFileDownload className="mr-2" />
              Exportar
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

      {/* Seletor de Período */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Período do Relatório</h2>
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: '30d', label: '30 dias' },
              { key: '90d', label: '90 dias' },
              { key: '6m', label: '6 meses' },
              { key: '1y', label: '1 ano' }
            ].map(({ key, label }) => (
            <button 
                key={key}
                onClick={() => setPeriodo(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodo === key 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {label}
            </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Receita Mensal Recorrente"
          value={formatCurrency(stats.receitaMensal)}
          icon={<FaDollarSign className="text-white" size={20} />}
          colorClass="bg-green-500"
          isLoading={loading}
          subtitle="MRR atual"
        />
        
        <MetricCard
          title="Assinaturas Ativas"
          value={stats.assinaturasAtivas}
          icon={<FaStore className="text-white" size={20} />}
          colorClass="bg-blue-500"
          isLoading={loading}
          subtitle={`de ${stats.totalTransacoes} total`}
        />
        
        <MetricCard
          title="Receita Total"
          value={formatCurrency(stats.receitaTotal)}
          icon={<FaChartLine className="text-white" size={20} />}
          colorClass="bg-purple-500"
          isLoading={loading}
          subtitle={`Estimativa ${periodo}`}
        />
        
        <MetricCard
          title="Valor Médio"
          value={formatCurrency(stats.valorMedioTransacao)}
          icon={<FaExchangeAlt className="text-white" size={20} />}
          colorClass="bg-orange-500"
          isLoading={loading}
          subtitle="Por assinatura"
        />
      </div>
      
      {/* Gráfico e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Receita */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Evolução da Receita
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Receita mensal baseada nas assinaturas ativas
            </p>
            </div>
          
          <div className="p-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <FaSpinner className="animate-spin text-gray-400" size={24} />
          </div>
          ) : (
              <SimpleChart data={chartData} />
          )}
          </div>
        </div>
        
        {/* Resumo Financeiro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Resumo Financeiro</h3>
            </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" size={16} />
                Transações Completas
              </span>
              <span className="font-semibold">{stats.totalTransacoes - stats.transacoesPendentes}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <FaClock className="text-yellow-500 mr-2" size={16} />
                Pendentes
              </span>
              <span className="font-semibold">{stats.transacoesPendentes}</span>
      </div>
      
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <FaTimesCircle className="text-red-500 mr-2" size={16} />
                Reembolsos
              </span>
              <span className="font-semibold">{stats.reembolsos}</span>
          </div>
          
            <div className="flex justify-between items-center py-2 pt-4 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Taxa de Sucesso</span>
              <span className="font-bold text-green-600">
                {stats.totalTransacoes > 0 
                  ? Math.round(((stats.totalTransacoes - stats.reembolsos) / stats.totalTransacoes) * 100)
                  : 0
                }%
                </span>
            </div>
          </div>
                    </div>
                  </div>
                  
      {/* Lista de Assinaturas Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Assinaturas Recentes
            </h3>
            <span className="text-sm text-gray-500">
              {assinaturas.length} assinaturas
            </span>
        </div>
      </div>
      
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <FaSpinner className="animate-spin mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-gray-500">Carregando assinaturas...</p>
                </div>
          ) : assinaturas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaStore className="mx-auto mb-2 text-gray-400" size={24} />
              <p>Nenhuma assinatura encontrada</p>
            </div>
          ) : (
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {assinaturas.slice(0, 10).map((assinatura) => (
                  <tr key={assinatura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assinatura.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assinatura.userEmail}
                        </div>
                      </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {assinatura.planType}
                      </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(assinatura.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assinatura.status)}`}>
                        {assinatura.status === 'ativo' || assinatura.status === 'active' ? 'Ativo' : 
                         assinatura.status === 'pending' ? 'Pendente' : 
                         assinatura.status === 'cancelled' ? 'Cancelado' : assinatura.status}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(assinatura.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCreditCard className="text-gray-400 mr-2" size={14} />
                        <span className="text-sm text-gray-500">
                          {assinatura.paymentMethod}
                        </span>
                      </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
        
        {assinaturas.length > 10 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver todas as assinaturas
            </button>
        </div>
      )}
      </div>
    </div>
  );
} 