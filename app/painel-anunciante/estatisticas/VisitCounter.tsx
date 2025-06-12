'use client';

import { useState, useEffect } from 'react';
import { 
  FaEye, FaChartLine, FaCalendarAlt, 
  FaMobileAlt, FaDesktop, FaFilter,
  FaSearch, FaExternalLinkAlt, FaInfoCircle
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, PieLabelRenderProps
} from 'recharts';

interface VisitData {
  date: string;
  count: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  adId: string;
  adTitle: string;
}

interface VisitCounterProps {
  visits?: VisitData[];
  adsData?: {id: string, title: string}[];
  isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function VisitCounter({ 
  visits = [], 
  adsData = [],
  isLoading = false 
}: VisitCounterProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedAdId, setSelectedAdId] = useState<string>('all');
  const [filteredVisits, setFilteredVisits] = useState<VisitData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [deviceStats, setDeviceStats] = useState<{name: string, value: number}[]>([]);
  const [sourceStats, setSourceStats] = useState<{name: string, value: number}[]>([]);
  const [dailyData, setDailyData] = useState<{date: string, count: number}[]>([]);
  
  useEffect(() => {
    if (isLoading || visits.length === 0) return;
    
    const now = new Date();
    let startDate: Date;
    
    // Determinar data de início baseada no filtro
    switch (dateRange) {
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(0); // Desde o início
    }
    
    // Filtrar por intervalo de datas e anúncio
    const filtered = visits.filter(visit => {
      const visitDate = new Date(visit.date);
      const matchesDate = visitDate >= startDate;
      const matchesAd = selectedAdId === 'all' || visit.adId === selectedAdId;
      return matchesDate && matchesAd;
    });
    
    setFilteredVisits(filtered);
    
    // Calcular estatísticas
    if (filtered.length > 0) {
      // Total de visitas
      const total = filtered.reduce((sum, visit) => sum + visit.count, 0);
      setTotalCount(total);
      
      // Estatísticas por dispositivo
      const devices: Record<string, number> = {};
      filtered.forEach(visit => {
        Object.entries(visit.devices).forEach(([device, count]) => {
          devices[device] = (devices[device] || 0) + count;
        });
      });
      
      const deviceData = Object.entries(devices)
        .map(([name, value]) => ({ 
          name: name === 'mobile' ? 'Celular' : 
                name === 'tablet' ? 'Tablet' : 
                name === 'desktop' ? 'Computador' : 
                'Outros', 
          value 
        }))
        .sort((a, b) => b.value - a.value);
      
      setDeviceStats(deviceData);
      
      // Estatísticas por fonte
      const sources: Record<string, number> = {};
      filtered.forEach(visit => {
        Object.entries(visit.sources).forEach(([source, count]) => {
          sources[source] = (sources[source] || 0) + count;
        });
      });
      
      const sourceData = Object.entries(sources)
        .map(([name, value]) => ({ 
          name: name === 'direct' ? 'Acesso Direto' : 
                name === 'google' ? 'Google' : 
                name === 'facebook' ? 'Facebook' : 
                name === 'instagram' ? 'Instagram' : 
                name === 'whatsapp' ? 'WhatsApp' : 
                name === 'telegram' ? 'Telegram' :
                name === 'internal' ? 'Interno (BuscaAquiBDC)' :
                'Outros', 
          value 
        }))
        .sort((a, b) => b.value - a.value);
      
      setSourceStats(sourceData);
      
      // Dados diários para o gráfico
      // Criar um mapa de datas para contar visitas por dia
      const dateMap = new Map<string, number>();
      
      // Inicializar o mapa com zeros para todos os dias no intervalo
      let current = new Date(startDate);
      while (current <= now) {
        const dateStr = current.toISOString().split('T')[0];
        dateMap.set(dateStr, 0);
        current.setDate(current.getDate() + 1);
      }
      
      // Preencher com dados reais
      filtered.forEach(visit => {
        const dateStr = new Date(visit.date).toISOString().split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + visit.count);
      });
      
      // Converter para array e ordenar por data
      const dailyVisits = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setDailyData(dailyVisits);
    } else {
      // Resetar estatísticas se não houver dados
      setTotalCount(0);
      setDeviceStats([]);
      setSourceStats([]);
      setDailyData([]);
    }
    
  }, [visits, dateRange, selectedAdId, isLoading]);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  const getEmptyStateMessage = () => {
    if (isLoading) {
      return "Carregando estatísticas...";
    }
    
    if (visits.length === 0) {
      return "Nenhuma visita registrada ainda.";
    }
    
    if (filteredVisits.length === 0) {
      if (selectedAdId !== 'all') {
        return "Nenhuma visita encontrada para o anúncio selecionado neste período.";
      }
      return "Nenhuma visita encontrada no período selecionado.";
    }
    
    return "";
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-5 border-b">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaEye className="mr-2 text-blue-600" /> Contador de Visitas
        </h2>
      </div>
      
      <div className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FaCalendarAlt className="mr-1 text-gray-500" /> Período:
            </label>
            <div className="flex">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 text-sm rounded-l-md ${
                  dateRange === '7d' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 dias
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 text-sm ${
                  dateRange === '30d' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1 text-sm ${
                  dateRange === '90d' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 dias
              </button>
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 text-sm rounded-r-md ${
                  dateRange === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="ad-filter" className="text-sm font-medium text-gray-700 mr-2 flex items-center">
              <FaFilter className="mr-1 text-gray-500" /> Anúncio:
            </label>
            <select
              id="ad-filter"
              value={selectedAdId}
              onChange={(e) => setSelectedAdId(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              <option value="all">Todos os anúncios</option>
              {adsData.map(ad => (
                <option key={ad.id} value={ad.id}>
                  {ad.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {getEmptyStateMessage() ? (
          <div className="text-center py-10 text-gray-500">
            {isLoading ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">{getEmptyStateMessage()}</span>
              </div>
            ) : (
              getEmptyStateMessage()
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Total de visitas</h3>
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <FaEye className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-900">{totalCount}</div>
                    <div className="text-sm text-blue-700">
                      {dateRange === '7d' ? 'Últimos 7 dias' : 
                       dateRange === '30d' ? 'Últimos 30 dias' : 
                       dateRange === '90d' ? 'Últimos 90 dias' : 
                       'Total'}
                    </div>
                  </div>
                </div>
                
                {selectedAdId !== 'all' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Anúncio:</span>{' '}
                      {adsData.find(ad => ad.id === selectedAdId)?.title || 'Anúncio selecionado'}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Dispositivos</h3>
                <div className="h-[160px]">
                  {deviceStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: PieLabelRenderProps) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Sem dados suficientes
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Fontes</h3>
                <div className="h-[160px]">
                  {sourceStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: PieLabelRenderProps) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sourceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Sem dados suficientes
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FaChartLine className="mr-2 text-blue-600" /> Visitas por dia
              </h3>
              <div className="h-[300px]">
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        // Limitando o número de ticks para não sobrecarregar o eixo X
                        interval={Math.ceil(dailyData.length / 10)}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} visitas`, 'Visitas']}
                        labelFormatter={(label: string) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('pt-BR');
                        }}
                      />
                      <Bar dataKey="count" fill="#4F46E5" name="Visitas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Sem dados suficientes para mostrar o gráfico diário
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="mb-2">
                    <span className="font-medium">Dica:</span> As estatísticas mostram o número de visualizações dos seus anúncios.
                  </p>
                  <p>
                    Compartilhe seus anúncios nas redes sociais para aumentar sua visibilidade. Quanto mais visitas, maiores as chances de venda!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 