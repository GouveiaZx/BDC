'use client';

import React, { useEffect, useState } from 'react';
import { 
  FaBullhorn, FaEye, FaMousePointer, FaClock, 
  FaArrowUp, FaArrowDown, FaMinus, FaCheckCircle,
  FaHourglassHalf, FaTimesCircle, FaChartLine,
  FaCalendarAlt, FaTrophy
} from 'react-icons/fa';
import { getSupabaseClient } from '../lib/supabase';

interface HighlightStats {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  viewCount: number;
  clickCount: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  daysRemaining: number;
}

interface HighlightsStatsProps {
  userId: string;
  period?: '7d' | '30d' | '90d';
}

export default function HighlightsStats({ userId, period = '30d' }: HighlightsStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<HighlightStats[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [activeHighlights, setActiveHighlights] = useState(0);
  const [pendingHighlights, setPendingHighlights] = useState(0);
  const [expiredHighlights, setExpiredHighlights] = useState(0);
  const [performanceData, setPerformanceData] = useState<{[date: string]: {views: number, clicks: number}}>({});
  
  useEffect(() => {
    const fetchHighlightsStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getSupabaseClient();
        
        // Calcular datas baseadas no período
        const endDate = new Date();
        const startDate = new Date();
        
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
        
        // Buscar todos os destaques do usuário no período
        const { data: highlightsData, error: highlightsError } = await supabase
          .from('highlights')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });
        
        if (highlightsError) {
          throw new Error('Erro ao carregar destaques: ' + highlightsError.message);
        }
        
        if (!highlightsData || highlightsData.length === 0) {
          // Usuário não tem destaques no período
          setHighlights([]);
          setTotalViews(0);
          setTotalClicks(0);
          setActiveHighlights(0);
          setPendingHighlights(0);
          setExpiredHighlights(0);
          setPerformanceData({});
          setLoading(false);
          return;
        }
        
        // Processar dados dos destaques
        const now = new Date();
        const processedHighlights: HighlightStats[] = [];
        let totalViewsCount = 0;
        let totalClicksCount = 0;
        let activeCount = 0;
        let pendingCount = 0;
        let expiredCount = 0;
        
        for (const highlight of highlightsData) {
          const createdAt = new Date(highlight.created_at);
          const expiresAt = new Date(highlight.expires_at || highlight.end_date);
          const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          
          // Determinar status atual
          let currentStatus = highlight.status;
          if (highlight.is_active && now < expiresAt) {
            currentStatus = 'active';
            activeCount++;
          } else if (highlight.status === 'pending') {
            pendingCount++;
          } else if (now >= expiresAt) {
            currentStatus = 'expired';
            expiredCount++;
          }
          
          const viewCount = highlight.view_count || 0;
          const clickCount = highlight.click_count || 0;
          
          totalViewsCount += viewCount;
          totalClicksCount += clickCount;
          
          processedHighlights.push({
            id: highlight.id,
            title: highlight.title,
            imageUrl: highlight.image_url,
            status: currentStatus,
            viewCount,
            clickCount,
            createdAt,
            expiresAt,
            isActive: highlight.is_active && now < expiresAt,
            daysRemaining
          });
        }
        
        // Ordenar por performance (views + clicks)
        processedHighlights.sort((a, b) => (b.viewCount + b.clickCount) - (a.viewCount + a.clickCount));
        
        // Processar dados de performance por data usando dados reais
        const performanceByDate: {[date: string]: {views: number, clicks: number}} = {};
        
        console.log('🔥 Processando dados reais de destaques:', { 
          totalViews: totalViewsCount, 
          totalClicks: totalClicksCount,
          highlightsCount: highlightsData.length 
        });
        
        // Se há dados reais, distribuir proporcionalmente entre os dias
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (totalViewsCount > 0 || totalClicksCount > 0) {
          // Distribuir dados reais proporcionalmente
          const avgDailyViews = Math.floor(totalViewsCount / daysDiff);
          const avgDailyClicks = Math.floor(totalClicksCount / daysDiff);
          
          for (let i = 0; i < daysDiff; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            performanceByDate[dateStr] = {
              views: avgDailyViews,
              clicks: avgDailyClicks
            };
          }
          
          // Distribuir o resto nos primeiros dias
          const remainingViews = totalViewsCount - (avgDailyViews * daysDiff);
          const remainingClicks = totalClicksCount - (avgDailyClicks * daysDiff);
          
          if (remainingViews > 0 || remainingClicks > 0) {
            const firstDayStr = startDate.toISOString().split('T')[0];
            if (performanceByDate[firstDayStr]) {
              performanceByDate[firstDayStr].views += remainingViews;
              performanceByDate[firstDayStr].clicks += remainingClicks;
            }
          }
        } else {
          // Sem dados reais - mostrar zeros
          for (let i = 0; i < daysDiff; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            performanceByDate[dateStr] = {
              views: 0,
              clicks: 0
            };
          }
        }
        
        // Atualizar estados
        setHighlights(processedHighlights);
        setTotalViews(totalViewsCount);
        setTotalClicks(totalClicksCount);
        setActiveHighlights(activeCount);
        setPendingHighlights(pendingCount);
        setExpiredHighlights(expiredCount);
        setPerformanceData(performanceByDate);
        setLoading(false);
        
      } catch (error) {
        console.error('Erro ao carregar estatísticas de destaques:', error);
        setError('Não foi possível carregar as estatísticas de destaques.');
        setLoading(false);
      }
    };
    
    fetchHighlightsStats();
  }, [userId, period]);
  
  // Função para formatar data relativa
  const formatDateRelative = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };
  
  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaHourglassHalf className="text-yellow-500" />;
      case 'expired':
        return <FaTimesCircle className="text-gray-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };
  
  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Desconhecido';
    }
  };
  
  // Calcular CTR (Click Through Rate)
  const calculateCTR = (clicks: number, views: number) => {
    if (views === 0) return 0;
    return ((clicks / views) * 100).toFixed(1);
  };
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <FaBullhorn className="text-orange-500 text-2xl mr-3" />
        <h2 className="text-xl font-semibold text-gray-800">Estatísticas de Destaques</h2>
      </div>
      
      {highlights.length === 0 ? (
        <div className="text-center py-12">
          <FaBullhorn className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum destaque encontrado</h3>
          <p className="text-gray-600 mb-6">
            Você ainda não criou destaques no período selecionado.
          </p>
          <a 
            href="/painel-anunciante/publicar-destaques"
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <FaBullhorn className="mr-2" />
            Criar Primeiro Destaque
          </a>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <FaEye className="text-orange-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total de Visualizações</p>
                  <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <FaMousePointer className="text-blue-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total de Cliques</p>
                  <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Destaques Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{activeHighlights}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <FaChartLine className="text-purple-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">CTR Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateCTR(totalClicks, totalViews)}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaHourglassHalf className="text-yellow-500 text-xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Aguardando Aprovação</p>
                  <p className="text-xl font-semibold text-gray-900">{pendingHighlights}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaTimesCircle className="text-gray-500 text-xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Expirados</p>
                  <p className="text-xl font-semibold text-gray-900">{expiredHighlights}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaTrophy className="text-blue-500 text-xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total de Destaques</p>
                  <p className="text-xl font-semibold text-gray-900">{highlights.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de destaques com performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Performance por Destaque</h3>
            
            {highlights.map((highlight) => (
              <div key={highlight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Imagem do destaque */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {highlight.imageUrl ? (
                        <img 
                          src={highlight.imageUrl} 
                          alt={highlight.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNEgzMlYzNkgyMFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM2IDI0SDQ4VjM2SDM2VjI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBullhorn className="text-gray-400 text-xl" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Informações do destaque */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {highlight.title}
                        </h4>
                        <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                          <span>Criado {formatDateRelative(highlight.createdAt)}</span>
                          {highlight.daysRemaining > 0 ? (
                            <span className="text-green-600">
                              {highlight.daysRemaining} dias restantes
                            </span>
                          ) : (
                            <span className="text-gray-500">Expirado</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status badge */}
                      <div className="flex items-center ml-4">
                        {getStatusIcon(highlight.status)}
                        <span className="ml-1 text-xs text-gray-600">
                          {getStatusText(highlight.status)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Métricas */}
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <FaEye className="text-blue-500 mr-2" />
                        <span className="text-gray-600">Visualizações:</span>
                        <span className="ml-1 font-medium">{highlight.viewCount}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FaMousePointer className="text-green-500 mr-2" />
                        <span className="text-gray-600">Cliques:</span>
                        <span className="ml-1 font-medium">{highlight.clickCount}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FaChartLine className="text-purple-500 mr-2" />
                        <span className="text-gray-600">CTR:</span>
                        <span className="ml-1 font-medium">{calculateCTR(highlight.clickCount, highlight.viewCount)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Links de ação */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a 
              href="/painel-anunciante/meus-destaques"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <FaBullhorn className="mr-2" />
              Gerenciar Destaques
            </a>
            
            <a 
              href="/painel-anunciante/publicar-destaques"
              className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              <FaCalendarAlt className="mr-2" />
              Criar Novo Destaque
            </a>
          </div>
        </>
      )}
    </div>
  );
} 