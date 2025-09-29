"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FaArrowLeft, FaChartBar, FaCalendarAlt, FaDownload, 
  FaEye, FaExternalLinkAlt, FaShoppingCart, FaUser, 
  FaMapMarkerAlt, FaChartLine, FaChartPie, FaChartArea
} from 'react-icons/fa';

export default function Relatorios() {
  const [period, setPeriod] = useState('7d');
  
  // Dados simulados para os gráficos
  const mockData = {
    views: [120, 145, 132, 178, 190, 210, 180],
    clicks: [45, 50, 48, 65, 80, 95, 75],
    conversions: [3, 4, 5, 7, 8, 10, 8],
    viewsByRegion: {
      'São Paulo': 35,
      'Rio de Janeiro': 25,
      'Minas Gerais': 15,
      'Paraná': 8,
      'Outros': 17
    },
    viewsByAge: {
      '18-24': 15,
      '25-34': 35,
      '35-44': 25,
      '45-54': 15,
      '55+': 10
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 mb-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/painel-anunciante" className="mr-4 text-gray-500 hover:text-gray-700">
                <FaArrowLeft />
              </Link>
              <div className="flex items-center">
                <FaChartBar className="text-green-600 mr-2" />
                <h1 className="text-xl font-medium text-gray-800">Relatório de Desempenho</h1>
              </div>
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <FaDownload className="mr-2" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filtros de período */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <FaCalendarAlt className="text-gray-500 mr-2" /> Período
            </h2>
            <div className="flex gap-2">
              <button 
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === '7d' ? 'bg-green-500 text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setPeriod('7d')}
              >
                7 dias
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === '30d' ? 'bg-green-500 text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setPeriod('30d')}
              >
                30 dias
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === '90d' ? 'bg-green-500 text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setPeriod('90d')}
              >
                90 dias
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === 'custom' ? 'bg-green-500 text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setPeriod('custom')}
              >
                Personalizado
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Visualizações</h3>
              <div className="bg-blue-100 p-2 rounded-full">
                <FaEye className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {mockData.views.reduce((sum, value) => sum + value, 0)}
            </p>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-green-600 font-medium flex items-center">
                <FaChartLine className="mr-1" /> +12.5%
              </span>
              <span className="text-gray-500 ml-2">vs. período anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Cliques</h3>
              <div className="bg-green-100 p-2 rounded-full">
                <FaExternalLinkAlt className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {mockData.clicks.reduce((sum, value) => sum + value, 0)}
            </p>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-green-600 font-medium flex items-center">
                <FaChartLine className="mr-1" /> +18.2%
              </span>
              <span className="text-gray-500 ml-2">vs. período anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Conversões</h3>
              <div className="bg-purple-100 p-2 rounded-full">
                <FaShoppingCart className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {mockData.conversions.reduce((sum, value) => sum + value, 0)}
            </p>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-green-600 font-medium flex items-center">
                <FaChartLine className="mr-1" /> +25.0%
              </span>
              <span className="text-gray-500 ml-2">vs. período anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Taxa de Conversão</h3>
              <div className="bg-amber-100 p-2 rounded-full">
                <FaChartPie className="text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {(mockData.conversions.reduce((sum, value) => sum + value, 0) / mockData.views.reduce((sum, value) => sum + value, 0) * 100).toFixed(1)}%
            </p>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-green-600 font-medium flex items-center">
                <FaChartLine className="mr-1" /> +2.3%
              </span>
              <span className="text-gray-500 ml-2">vs. período anterior</span>
            </div>
          </div>
        </div>

        {/* Gráfico principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaChartArea className="text-green-600 mr-2" /> Desempenho ao longo do tempo
            </h3>
            <div className="aspect-[16/9] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <FaChartLine className="mx-auto text-gray-300 text-4xl mb-2" />
                <p className="text-gray-500">Gráfico de desempenho ao longo do tempo</p>
                <p className="text-sm text-gray-400">Visualizações, cliques e conversões</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="text-green-600 mr-2" /> Distribuição geográfica
            </h3>
            <div className="aspect-[4/5] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <FaChartPie className="mx-auto text-gray-300 text-4xl mb-2" />
                <p className="text-gray-500">Gráfico de distribuição regional</p>
                <p className="text-sm text-gray-400">Visualizações por região</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de anúncios */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Desempenho por anúncio</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anúncio
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visualizações
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliques
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversões
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Honda Civic EXL 2020</div>
                      <div className="text-xs text-gray-500">Veículos • ID: F3</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      501
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      143
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        28.5%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      12
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">MacBook Pro 2021 - M1 Pro</div>
                      <div className="text-xs text-gray-500">Eletrônicos • ID: E2</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      218
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      42
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        19.3%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      5
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Apartamento 2 quartos</div>
                      <div className="text-xs text-gray-500">Imóveis • ID: I7</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      342
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      76
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        22.2%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      8
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Insights e recomendações */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Insights e recomendações</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Insight:</strong> Seus anúncios de veículos estão tendo desempenho 28% superior à média da categoria.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">
                  <strong>Recomendação:</strong> Considere adicionar mais fotos em seus anúncios de imóveis para aumentar a taxa de conversão.
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">
                  <strong>Oportunidade:</strong> Utilizar destaques pode aumentar em até 65% a visibilidade dos seus anúncios menos visualizados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 