'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import AdViewsStats from '../../components/AdViewsStats';
import HighlightsStats from '../../components/HighlightsStats';
import { getSupabaseClient } from '../../lib/supabase';

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'highlights'>('ads');
  
  // Obter o ID do usuário atual usando o sistema centralizado
  useEffect(() => {
    const getUserId = async () => {
      try {
        // Usar o novo sistema centralizado de autenticação
        const { getCurrentUser, isAuthenticated, refreshUserData } = await import('../../lib/authSync');
        
        // Verificar se está autenticado
        if (!isAuthenticated()) {
          console.error('❌ Usuário não autenticado - redirecionando para login');
          window.location.href = '/login';
          return;
        }
        
        // Obter dados do usuário atual
        const user = getCurrentUser();
        
        if (user) {
          console.log('✅ Usuário encontrado via sistema centralizado:', user.id);
          setUserId(user.id);
          
          // Sincronizar dados com o banco para garantir que estão atualizados
          await refreshUserData(user.id);
          
          setLoading(false);
          return;
        }
        
        // Se não encontrar, tentar fallback para localStorage
        const userIdFromStorage = localStorage.getItem('userId');
        
        if (userIdFromStorage) {
          console.log('⚠️ Usando fallback localStorage:', userIdFromStorage);
          setUserId(userIdFromStorage);
          setLoading(false);
          return;
        }
        
        // Se chegou aqui, não está autenticado
        console.error('❌ Nenhum usuário encontrado - redirecionando para login');
        window.location.href = '/login';
        
      } catch (error) {
        console.error('❌ Erro ao obter usuário:', error);
        window.location.href = '/login';
      }
    };
    
    getUserId();
  }, []);
  
  // Função para formatar o título do período
  const formatPeriodTitle = (selectedPeriod: '7d' | '30d' | '90d') => {
    switch (selectedPeriod) {
      case '7d': return 'dos últimos 7 dias';
      case '90d': return 'dos últimos 90 dias';
      case '30d': 
      default: return 'dos últimos 30 dias';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/painel-anunciante" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para o painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Estatísticas</h1>
        <p className="text-gray-600">
          Acompanhe o desempenho dos seus anúncios e destaques com métricas detalhadas
        </p>
      </div>
      
      {/* Abas de navegação */}
      <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex-1 px-6 py-3 text-center text-sm font-medium ${
              activeTab === 'ads'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Anúncios
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 px-6 py-3 text-center text-sm font-medium ${
              activeTab === 'highlights'
                ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔥 Destaques
          </button>
        </div>
      </div>
      
      {/* Período de tempo */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-2">
          <FaCalendarAlt className="text-gray-500 mr-2" />
          <h2 className="text-lg font-medium">Período de visualização</h2>
        </div>
        <div className="flex flex-wrap space-x-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-md mb-2 ${
              period === '7d' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-md mb-2 ${
              period === '30d' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => setPeriod('90d')}
            className={`px-4 py-2 rounded-md mb-2 ${
              period === '90d' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 90 dias
          </button>
        </div>
        <div className="mt-3 text-sm text-gray-500 flex items-start">
          <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <p>
            Mostrando estatísticas {formatPeriodTitle(period)}. 
            As visualizações são contadas quando alguém acessa a página detalhada do seu anúncio.
          </p>
        </div>
      </div>
      
      {/* Conteúdo baseado na aba ativa */}
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      ) : userId ? (
        <>
          {activeTab === 'ads' && <AdViewsStats userId={userId} period={period} />}
          {activeTab === 'highlights' && <HighlightsStats userId={userId} period={period} />}
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-700">
            Você precisa estar logado para visualizar suas estatísticas. 
            Por favor, faça login e tente novamente.
          </p>
        </div>
      )}
      
      {/* Dicas baseadas na aba ativa */}
      {activeTab === 'ads' && (
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📈 Dicas para aumentar visualizações dos anúncios
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                1
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Use fotos de qualidade:</span> Anúncios com fotos nítidas recebem até 70% mais visualizações.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                2
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Títulos descritivos:</span> Inclua informações importantes no título como marca, modelo e características principais.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                3
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Preço competitivo:</span> Pesquise valores de produtos similares para definir um preço atrativo.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                4
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Destaque seu anúncio:</span> Anúncios em destaque recebem até 3x mais visualizações.
                <Link href="/painel-anunciante/publicar-destaques" className="text-blue-600 hover:underline ml-1">
                  Criar destaque
                </Link>
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                5
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Responda rapidamente:</span> Anunciantes que respondem em até 1 hora têm 40% mais chances de fechar negócio.
              </p>
            </li>
          </ul>
        </div>
      )}
      
      {activeTab === 'highlights' && (
        <div className="mt-8 bg-orange-50 border border-orange-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🔥 Dicas para otimizar seus destaques
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 mt-0.5">
                1
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Imagens impactantes:</span> Use imagens de alta qualidade e chamativas para seus destaques.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 mt-0.5">
                2
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Títulos persuasivos:</span> Crie títulos que despertem curiosidade e urgência nos seus destaques.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 mt-0.5">
                3
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Timing estratégico:</span> Publique destaques em horários de maior movimento (18h-22h).
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 mt-0.5">
                4
              </div>
              <p className="text-gray-700">
                <span className="font-medium">Monitore a performance:</span> Acompanhe as métricas e ajuste sua estratégia baseada nos resultados.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 mt-0.5">
                5
              </div>
              <p className="text-gray-700">
                <span className="font-medium">CTR acima de 2%:</span> Destaques com boa taxa de cliques têm maior visibilidade no algoritmo.
                <Link href="/painel-anunciante/meus-destaques" className="text-orange-600 hover:underline ml-1">
                  Ver meus destaques
                </Link>
              </p>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 