"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBuilding, FaFilter, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import CompanyCard from '../components/CompanyCard';

// Tipos de ramos de atividade que podem ser filtrados
const businessTypes = [
  { id: 'all', name: 'Todos' },
  { id: 'realestate', name: 'Imobiliária' },
  { id: 'vehicles', name: 'Loja de veículos' },
  { id: 'it', name: 'Informática' },
  { id: 'electronics', name: 'Eletrônicos em geral' },
  { id: 'construction', name: 'Material para construção' },
  { id: 'furniture', name: 'Móveis e decoração' },
  { id: 'homegoods', name: 'Cama, mesa e banho' },
  { id: 'imported', name: 'Importados' },
  { id: 'clothes', name: 'Loja de Roupas' },
  { id: 'pharmacy', name: 'Farmácia' },
  { id: 'hamburger', name: 'Hamburgeria' },
  { id: 'pizza', name: 'Pizzaria' },
  { id: 'icecream', name: 'Sorveterias' },
  { id: 'snackbar', name: 'Lanchonete' },
  { id: 'bars', name: 'Bares e Restaurantes' },
  { id: 'sushi', name: 'Sushi' },
  { id: 'drinks', name: 'Bebidas' },
  { id: 'professional', name: 'Profissional Liberal' },
  { id: 'autoparts', name: 'Loja de Autopeças' },
  { id: 'workshop', name: 'Oficinas' },
  { id: 'caraesthetics', name: 'Estética Automotiva' },
  { id: 'perfumery', name: 'Perfumaria' },
  { id: 'eyewear', name: 'Óticas' },
  { id: 'bicycle', name: 'Bicicleta' },
  { id: 'clinic', name: 'Clínica' },
  { id: 'laboratory', name: 'Laboratório' },
  { id: 'beauty', name: 'Estética e Beleza' },
  { id: 'health', name: 'Saúde em geral' },
  { id: 'sports', name: 'Esportes' },
  { id: 'entertainment', name: 'Entretenimento' },
  { id: 'jewelry', name: 'Joias e Acessórios' },
  { id: 'pets', name: 'Pets e Animais' },
  { id: 'printing', name: 'Gráfica' },
  { id: 'agriculture', name: 'Agricultura' },
  { id: 'plants', name: 'Plantas' },
  { id: 'leisure', name: 'Lazer' },
  { id: 'refrigeration', name: 'Refrigeração' },
  { id: 'grocery', name: 'Supermercados e Mercearias' },
  { id: 'services', name: 'Emprego e Serviços' },
  { id: 'education', name: 'Instituição de Ensino' },
  { id: 'gym', name: 'Academia e Musculação' },
  { id: 'fruitshop', name: 'Frutaria' },
  { id: 'industry', name: 'Indústria' },
  { id: 'metalwork', name: 'Serralheria' },
  { id: 'livestock', name: 'Pecuária' },
  { id: 'fishfarming', name: 'Piscicultura' },
  { id: 'butcher', name: 'Açougues' },
  { id: 'motoparts', name: 'Motopeças' },
  { id: 'other', name: 'OUTROS' },
];

// Interface para o mapa de estados e cidades
interface EstadosCidadesMap {
  [estado: string]: string[];
}

// Mapa de estados e suas cidades
const estadosCidades: EstadosCidadesMap = {
  MA: [
  "Barra do Corda",
  "Fernando Falcão",
  "Jenipapo dos Vieiras",
  "Presidente Dutra",
  "Grajaú",
  "Formosa da Serra Negra",
  "Itaipava do Grajaú",
  "Esperantinópolis"
  ],
  PI: [
    "Teresina",
    "Parnaíba",
    "Picos"
  ],
  CE: [
    "Fortaleza",
    "Juazeiro do Norte",
    "Sobral"
  ]
};

// Lista de estados disponíveis
const estados = ['TODOS', ...Object.keys(estadosCidades)];

// Interface para dados da empresa
interface Business {
  id: string | number;
  name: string;
  type: string;
  logo: string;
  banner: string;
  address: string;
  rating: number;
  description: string;
  phone: string;
  verified: boolean;
  plan: string;
  city?: string;
  state?: string;
}

const ClassificadosPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedState, setSelectedState] = useState('TODOS');
  const [selectedCity, setSelectedCity] = useState('');
  const [companies, setCompanies] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados reais de empresas do banco
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Função para buscar empresas aprovadas da API
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Logging para depuração
      console.log('==================================');
      console.log('INICIANDO BUSCA DE EMPRESAS REAIS');
      console.log('==================================');
      
      // Usar a nova API de classificados com parâmetros para evitar cache
      const timestamp = new Date().getTime();
      const randomParam = Math.random().toString(36).substring(7);
      
      const response = await fetch(`/api/classificados?_t=${timestamp}&_r=${randomParam}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.error(`ERRO HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erro ao buscar empresas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('RESPOSTA DA API:', JSON.stringify(data, null, 2));
      
      // Verificar se há dados de classificados (mesmo que success não esteja definido)
      if (data.classificados && Array.isArray(data.classificados)) {
        // Os dados já vêm formatados da API, apenas atribuímos ao estado
        const formattedCompanies = data.classificados.map((business: any) => ({
          id: business.id,
          name: business.business_name || business.name || 'Empresa',
          type: business.categories && business.categories[0] ? business.categories[0] : 'other',
          logo: business.logo_url || business.logo || '/images/avatar-placeholder.png',
          banner: business.banner_url || business.banner || '/images/banner-placeholder.jpg',
          address: business.address ? 
                  `${business.address}${business.city ? ', ' + business.city : ''}${business.state ? ' - ' + business.state : ''}` :
                  `${business.city || ''} ${business.state ? ' - ' + business.state : ''}`,
          description: business.description || '',
          phone: business.phone || '',
          verified: business.verified || false,
          rating: 4.8, // Valor padrão de rating
          plan: 'Empresa', // Valor padrão de plano
          city: business.city,
          state: business.state,
          userId: business.user_id
        }));
        
        console.log(`EMPRESAS ENCONTRADAS: ${formattedCompanies.length}`);
        if (formattedCompanies.length > 0) {
          console.log('EXEMPLO DE EMPRESA:', formattedCompanies[0]);
          // Adicionar log para verificar quantas empresas são verificadas
          const verifiedCount = formattedCompanies.filter(c => c.verified).length;
          console.log(`EMPRESAS VERIFICADAS: ${verifiedCount} de ${formattedCompanies.length}`);
        }
        
        if (formattedCompanies.length === 0) {
          console.warn('AVISO: Nenhuma empresa retornada da API para exibição');
        }
        
        setCompanies(formattedCompanies);
      } else {
        // Se não há businesses ou há erro explícito
        if (data.error) {
          console.error('ERRO NA RESPOSTA DA API:', data.error);
          setError(data.error);
        } else {
          console.log('API retornou estrutura inesperada:', data);
          setError('Formato de resposta inesperado da API');
        }
        setCompanies([]); // Limpar o estado para não mostrar dados antigos
      }
    } catch (error) {
      console.error('ERRO AO BUSCAR EMPRESAS:', error);
      setError('Erro ao carregar empresas. Tente novamente mais tarde.');
      setCompanies([]); // Limpar o estado para não mostrar dados antigos
    } finally {
      setLoading(false);
    }
  };

  // Obter cidades do estado selecionado
  const cidadesDoEstado = selectedState && selectedState !== 'TODOS' ? estadosCidades[selectedState] || [] : [];

  // Filtrar empresas baseado no tipo e cidade selecionados
  const filteredCompanies = companies.filter(company => {
    // Filtro por verificação removido para mostrar todas as empresas
    
    // Filtro por tipo
    const matchesType = selectedType === 'all' || company.type === selectedType;
    
    // Filtro por cidade se uma cidade específica for selecionada
    const matchesCity = !selectedCity || 
                       (company.address && company.address.includes(selectedCity)) || 
                       (company.city && company.city.includes(selectedCity));
    
    // Filtro por estado 
    let matchesState = true;
    
    if (selectedState !== 'TODOS') {
      matchesState = (company.state === selectedState) || 
                    (company.address && company.address.includes(selectedState)) ||
                    (estadosCidades[selectedState] && 
                     estadosCidades[selectedState].some(cidade => 
                       company.address?.includes(cidade) || company.city?.includes(cidade)
                     ));
    }
    
    return matchesType && matchesCity && matchesState;
  });

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Classificados</h1>
          <p className="text-gray-600 mb-4">
            Encontre os melhores serviços e empresas na sua região
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Classificados Premium:</strong> Apenas empresas com planos pagos aparecem nesta seção, garantindo serviços profissionais e de qualidade.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm mb-8">
          {/* Filtro por ramo */}
          <div className="flex-1">
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              <FaBuilding className="inline mr-1" /> Ramo
            </label>
            <select
              id="typeFilter"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {businessTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div className="flex-1">
            <label htmlFor="stateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Estado
            </label>
            <select
              id="stateFilter"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="TODOS">Todos os estados</option>
              {Object.keys(estadosCidades).map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por cidade */}
          <div className="flex-1">
            <label htmlFor="cityFilter" className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Cidade
            </label>
            <input
              type="text"
              id="cityFilter"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
              placeholder="Digite uma cidade"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
          </div>

          {/* Busca */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              <FaSearch className="inline mr-1" /> Buscar
            </label>
            <input
              type="text"
              id="search"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
              placeholder="Nome da empresa"
            />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700 text-center">
              {error}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-gray-500 mb-2">
                Não encontramos empresas com planos pagos que atendam aos filtros selecionados.
              </p>
              <p className="text-sm text-blue-600 mb-4">
                💡 Apenas empresas com planos Micro Negócio, Pequeno Negócio, Negócio Simples ou Negócio Plus aparecem nos classificados.
              </p>
              <button 
                className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                onClick={() => {
                  setSelectedType('all');
                  setSelectedState('TODOS');
                  setSelectedCity('');
                }}
              >
                <FaFilter className="mr-1" /> Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassificadosPage; 