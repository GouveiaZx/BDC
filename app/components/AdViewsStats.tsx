'use client';

import React, { useEffect, useState } from 'react';
import { 
  FaEye, FaChartLine, FaCalendarAlt, FaHourglassHalf, 
  FaArrowUp, FaArrowDown, FaMinus 
} from 'react-icons/fa';
import { getSupabaseClient } from '../lib/supabase';

interface ViewStats {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: {
    [date: string]: number;
  };
  lastViewedAt: Date | null;
}

interface AdStats {
  adId: string;
  title: string;
  image: string;
  views: number;
  uniqueViews: number;
  lastViewedAt: Date | null;
}

interface AdViewsStatsProps {
  userId: string;
  period?: '7d' | '30d' | '90d';
}

export default function AdViewsStats({ userId, period = '30d' }: AdViewsStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalViews, setTotalViews] = useState(0);
  const [viewsByDate, setViewsByDate] = useState<{[date: string]: number}>({});
  const [adStats, setAdStats] = useState<AdStats[]>([]);
  const [viewsComparedToPrevious, setViewsComparedToPrevious] = useState(0);
  
  useEffect(() => {
    const fetchViewStats = async () => {
      try {
        setLoading(true);
        
        console.log('📊 Iniciando busca de estatísticas de visualizações para usuário:', userId);
        
        // Obter o client do Supabase
        const supabase = getSupabaseClient();
        
        // Calcular as datas baseadas no período selecionado
        const endDate = new Date();
        const startDate = new Date();
        
        // Configurar o período conforme selecionado
        switch(period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '30d':
          default:
            startDate.setDate(endDate.getDate() - 30);
            break;
        }
        
        // Para comparação, também precisamos do período anterior
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const previousEndDate = new Date(startDate);
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
        
        // Formatar datas para ISO
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();
        const previousStartDateISO = previousStartDate.toISOString();
        const previousEndDateISO = previousEndDate.toISOString();
        
        // Carregar os anúncios do usuário
        const { data: userAds, error: adsError } = await supabase
          .from('advertisements')
          .select('id, title, images')
          .eq('user_id', userId);
          
        if (adsError) {
          throw new Error('Erro ao carregar anúncios do usuário: ' + adsError.message);
        }
        
        // Se não tiver anúncios, retornar dados vazios
        if (!userAds || userAds.length === 0) {
          setTotalViews(0);
          setViewsByDate({});
          setAdStats([]);
          setViewsComparedToPrevious(0);
          setLoading(false);
          return;
        }
        
        // Obter IDs dos anúncios para usar nas consultas
        const adIds = userAds.map(ad => ad.id);
        
        console.log('📊 Buscando visualizações reais para anúncios:', adIds);
        
        // Carregar visualizações reais do banco de dados usando SQL direto
        // Isso bypassa problemas de autenticação RLS
        const adIdsStr = adIds.map(id => `'${id}'`).join(',');
        
        console.log('📊 Consultando período:', { startDateISO, endDateISO });
        console.log('📊 Consultando período anterior:', { previousStartDateISO, previousEndDateISO });
        
        // Consulta para o período atual
        const { data: viewsData, error: viewsError } = await supabase
          .rpc('get_ad_views_data', {
            p_ad_ids: adIds,
            p_start_date: startDateISO,
            p_end_date: endDateISO
          });
        
        // Consulta para o período anterior  
        const { data: previousViewsData, error: previousViewsError } = await supabase
          .rpc('get_ad_views_data', {
            p_ad_ids: adIds,
            p_start_date: previousStartDateISO,
            p_end_date: previousEndDateISO
          });
        
        if (viewsError) {
          console.error('❌ Erro ao buscar visualizações:', viewsError);
          throw new Error('Erro ao carregar visualizações: ' + viewsError.message);
        }
        
        if (previousViewsError) {
          console.error('❌ Erro ao buscar visualizações anteriores:', previousViewsError);
          // Continuar mesmo com erro no período anterior
        }
        
        console.log('📊 Dados reais carregados:', { 
          currentPeriod: viewsData?.length || 0, 
          previousPeriod: previousViewsData?.length || 0 
        });
        
        // Processar dados de visualizações por data
        const viewsByDateMap: {[date: string]: number} = {};
        viewsData?.forEach(view => {
          const dateStr = new Date(view.viewed_at).toISOString().split('T')[0];
          viewsByDateMap[dateStr] = (viewsByDateMap[dateStr] || 0) + 1;
        });
        
        // Calcular estatísticas por anúncio
        const adStatsData: AdStats[] = [];
        
        for (const ad of userAds) {
          // Filtrar visualizações deste anúncio
          const adViews = viewsData?.filter(view => view.ad_id === ad.id) || [];
          
          // Calcular visualizações únicas por IP
          const uniqueIPs = new Set(adViews.map(view => view.ip_address));
          
          // Encontrar a última visualização
          let lastViewedAt: Date | null = null;
          if (adViews.length > 0) {
            const sortedViews = [...adViews].sort((a, b) => 
              new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
            );
            lastViewedAt = new Date(sortedViews[0].viewed_at);
          }
          
          adStatsData.push({
            adId: ad.id,
            title: ad.title,
            image: ad.images,
            views: adViews.length,
            uniqueViews: uniqueIPs.size,
            lastViewedAt
          });
        }
        
        // Ordenar anúncios por número de visualizações (decrescente)
        adStatsData.sort((a, b) => b.views - a.views);
        
        // Calcular o total de visualizações
        const totalViewsCount = viewsData?.length || 0;
        const previousTotalViewsCount = previousViewsData?.length || 0;
        
        // Calcular a porcentagem de aumento/diminuição
        let percentChange = 0;
        if (previousTotalViewsCount > 0) {
          percentChange = ((totalViewsCount - previousTotalViewsCount) / previousTotalViewsCount) * 100;
        }
        
        // Atualizar o estado
        setTotalViews(totalViewsCount);
        setViewsByDate(viewsByDateMap);
        setAdStats(adStatsData);
          setViewsComparedToPrevious(Math.round(percentChange));
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar estatísticas de visualizações:', error);
        setError('Não foi possível carregar as estatísticas de visualizações.');
        setLoading(false);
      }
    };
    
    fetchViewStats();
  }, [userId, period]);
  
  // Função para formatar data
  const formatDateRelative = (date: Date | null) => {
    if (!date) return 'Sem visualizações';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'} atrás`;
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hora' : 'horas'} atrás`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };
  
  // Calcular dados para o gráfico de barras simplificado
  const getChartData = () => {
    // Determinar número de dias baseado no período selecionado
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
    }

    // Pegar os últimos X dias
    const lastDays = [...Array(days)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0]; // formato YYYY-MM-DD
    });
    
    // Mapear os dados de visualizações
    return lastDays.map(date => ({
      date,
      views: viewsByDate[date] || 0,
      weekday: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
    }));
  };
  
  const chartData = getChartData();
  const maxViews = Math.max(...chartData.map(d => d.views), 10); // mínimo 10 para evitar divisão por zero
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-red-700 font-medium hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  // Se não houver visualizações
  if (totalViews === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Estatísticas de Visualizações</h2>
        <div className="text-center py-8">
          <FaEye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-gray-700 font-medium mb-2">Sem visualizações no período selecionado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Seus anúncios ainda não receberam visualizações neste período. Experimente compartilhar seus anúncios ou criar destaques para aumentar sua visibilidade.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Estatísticas de Visualizações</h2>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-start">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <FaEye className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de visualizações</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalViews}</h3>
              <div className="flex items-center mt-1 text-xs">
                {viewsComparedToPrevious > 0 ? (
                  <span className="text-green-600 flex items-center">
                    <FaArrowUp className="mr-1" /> {viewsComparedToPrevious}% em relação ao período anterior
                  </span>
                ) : viewsComparedToPrevious < 0 ? (
                  <span className="text-red-600 flex items-center">
                    <FaArrowDown className="mr-1" /> {Math.abs(viewsComparedToPrevious)}% em relação ao período anterior
                  </span>
                ) : (
                  <span className="text-gray-600 flex items-center">
                    <FaMinus className="mr-1" /> Sem alteração em relação ao período anterior
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <FaChartLine className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Média diária</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {period === '7d' 
                  ? Math.round(totalViews / 7 * 10) / 10 
                  : period === '30d' 
                    ? Math.round(totalViews / 30 * 10) / 10 
                    : Math.round(totalViews / 90 * 10) / 10} 
              </h3>
              <p className="text-xs text-gray-500 mt-1">Visualizações por dia</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-start">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <FaCalendarAlt className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Último período</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {period === '7d' 
                  ? '7 dias' 
                  : period === '30d' 
                    ? '30 dias' 
                    : '90 dias'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {viewsComparedToPrevious !== 0 
                  ? (viewsComparedToPrevious > 0 ? 'Crescendo' : 'Diminuindo') 
                  : 'Estável'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico simplificado */}
      <div className="mb-10">
        <h3 className="font-semibold text-gray-800 mb-4">Visualizações por dia</h3>
        <div className="h-64 flex items-end space-x-1 border-b border-l border-gray-200 relative pt-6">
          {/* Eixo Y */}
          <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between text-xs text-gray-500">
            <span>{maxViews}</span>
            <span>{Math.floor(maxViews * 0.75)}</span>
            <span>{Math.floor(maxViews * 0.5)}</span>
            <span>{Math.floor(maxViews * 0.25)}</span>
            <span>0</span>
                </div>
          
          {chartData.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full bg-blue-400 rounded-t transition-all ${
                  chartData.length <= 15 ? 'max-w-[24px]' : 'max-w-[16px]'
                } mx-auto`}
                style={{ 
                  height: `${Math.max((day.views / maxViews) * 100, 2)}%`,
                  opacity: day.views > 0 ? 1 : 0.3
                }}
              />
              <div className="w-full text-center mt-2">
                <p className={`text-xs ${
                  chartData.length > 30 ? 'transform rotate-90 origin-left mt-6' : 
                  chartData.length > 15 ? 'transform rotate-45 origin-left mt-2' : ''
                } text-gray-500`}>
                  {chartData.length <= 15 
                    ? day.weekday 
                    : chartData.length <= 30 
                      ? i % 3 === 0 ? day.weekday : '' 
                      : i % 7 === 0 ? day.weekday : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tabela de anúncios */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Seus anúncios mais visualizados</h3>
        
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anúncio
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visualizações
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Visitas únicas
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Última visualização
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adStats.map((ad) => (
                <tr key={ad.adId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {ad.image && (
                        <div className="flex-shrink-0 h-10 w-10 mr-3">
                        <img 
                            className="h-10 w-10 rounded object-cover"
                          src={ad.image} 
                          alt={ad.title} 
                        />
                      </div>
                      )}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{ad.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{ad.views}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">{ad.uniqueViews}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {formatDateRelative(ad.lastViewedAt)}
                  </td>
                </tr>
              ))}
              
              {adStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhum anúncio com visualizações no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 