"use client";

import React, { useState, useEffect } from 'react';
import AdCard from '../components/AdCard';
import Link from 'next/link';
import { FaFilter, FaSearch, FaChevronDown, FaChevronUp, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import Image from 'next/image';
import { AdModerationStatus } from '../models/types';
import { getSupabaseClient } from '../lib/supabase';

// Lista completa de categorias - importada das categorias principais
const categoriesListUnsorted = [
  {
    id: 'todas',
    name: 'Todas as categorias'
  },
  {
    id: 'imoveis',
    name: 'Imóveis'
  },
  {
    id: 'veiculos',
    name: 'Veículos'
  },
  {
    id: 'autopecas',
    name: 'Autopeças'
  },
  {
    id: 'casa-decoracao',
    name: 'Casa, Decoração e Utensílios'
  },
  {
    id: 'moveis',
    name: 'Móveis'
  },
  {
    id: 'eletro',
    name: 'Eletro'
  },
  {
    id: 'construcao',
    name: 'Materiais de Construção'
  },
  {
    id: 'celulares',
    name: 'Celulares e Telefonia'
  },
  {
    id: 'informatica',
    name: 'Informática'
  },
  {
    id: 'games',
    name: 'Games'
  },
  {
    id: 'tvs-video',
    name: 'TVs e vídeo'
  },
  {
    id: 'audio',
    name: 'Áudio'
  },
  {
    id: 'cameras',
    name: 'Câmeras e Drones'
  },
  {
    id: 'moda',
    name: 'Moda e beleza'
  },
  {
    id: 'comercio',
    name: 'Comércio'
  },
  {
    id: 'escritorio',
    name: 'Escritório e Home Office'
  },
  {
    id: 'musica',
    name: 'Música e hobbies'
  },
  {
    id: 'esportes',
    name: 'Esportes e Fitness'
  },
  {
    id: 'infantis',
    name: 'Artigos infantis'
  },
  {
    id: 'animais',
    name: 'Animais de estimação'
  },
  {
    id: 'agro',
    name: 'Agro e indústria'
  },
  {
    id: 'servicos',
    name: 'Serviços'
  },
  {
    id: 'empregos',
    name: 'Vagas de emprego'
  },
  {
    id: 'alimentos',
    name: 'Alimentos'
  }
];

// Separar a categoria "Todas" e ordenar o restante alfabeticamente
const todasCategoria = categoriesListUnsorted.find(cat => cat.id === 'todas');
const restCategories = categoriesListUnsorted
  .filter(cat => cat.id !== 'todas')
  .sort((a, b) => a.name.localeCompare(b.name));

// Combinar "Todas" com o restante ordenado
const categoriesList = todasCategoria ? [todasCategoria, ...restCategories] : restCategories;

// Interface para o tipo de anúncio
interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  location?: string; // Localização pode ser indefinida
  category: string;
  subcategory?: string;
  createdAt: string | Date;
  views: number;
  featured?: boolean;
  image?: string;
  moderationStatus?: AdModerationStatus; // Status de moderação
}

export default function AnunciosPage() {
  // Estados para ordenação e filtros
  const [ordenacao, setOrdenacao] = useState('recent');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [anunciosFiltrados, setAnunciosFiltrados] = useState<any[]>([]);
  
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
  
  // Lista de cidades do estado selecionado
  const cidadesDoEstado = estadoFiltro && estadoFiltro !== 'TODOS' ? estadosCidades[estadoFiltro] || [] : [];
  
  // Quantidade de anúncios por página
  const anunciosPorPagina = 9;
  
  // Verificar os parâmetros da URL para aplicar filtros iniciais e carregar anúncios
  useEffect(() => {
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const buscaParam = urlParams.get('busca');
    const categoriaParam = urlParams.get('categoria');
    const estadoParam = urlParams.get('estado');
    const cidadeParam = urlParams.get('cidade');
    
    // Aplicar filtros da URL
    if (buscaParam) {
      setBusca(buscaParam);
      setTermoBusca(buscaParam);
    }
    
    if (categoriaParam) {
      setCategoriaFiltro(categoriaParam);
    }
    
    if (estadoParam && estados.includes(estadoParam)) {
      setEstadoFiltro(estadoParam);
    }
    
    if (cidadeParam) {
      setCidadeFiltro(cidadeParam);
    }
    
    // Buscar anúncios do banco de dados
    const fetchAds = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        
        // Buscar anúncios aprovados e ativos
        const { data: ads, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('moderation_status', 'approved')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Erro ao buscar anúncios:', error);
          setAnuncios([]);
          return;
        }
        
        // Transformar dados para o formato esperado pelo frontend
        const formattedAds = ads.map(ad => ({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          price: parseFloat(ad.price) || 0,
          category: ad.category,
          subCategory: ad.sub_category,
          images: ad.images || [],
          location: ad.location,
          city: ad.city,
          state: ad.state,
          featured: ad.is_featured || false,
          createdAt: ad.created_at,
          views: ad.views || 0,
          clicks: ad.clicks || 0,
          userName: ad.user_name,
          userAvatar: ad.user_avatar,
          userId: ad.user_id,
          whatsapp: ad.whatsapp,
          moderationStatus: ad.moderation_status
        }));
        
        setAnuncios(formattedAds);
        console.log(`Carregados ${formattedAds.length} anúncios do banco de dados`);
      } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
        setAnuncios([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAds();
  }, []);
  
  // Categorias extraídas dos anúncios atuais
  const categoriasSet = new Set(anuncios.map(ad => ad.category));
  const categoriasDosAnuncios = Array.from(categoriasSet);
  
  // Aplicar filtros sempre que qualquer critério mudar ou quando anúncios são carregados
  useEffect(() => {
    aplicarFiltros();
  }, [busca, categoriaFiltro, estadoFiltro, cidadeFiltro, precoMin, precoMax, ordenacao, anuncios]);

  // Função para aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...anuncios];
    
    // Filtrar apenas anúncios aprovados
    filtered = filtered.filter(ad => 
      ad.moderationStatus === 'approved'
    );
    
    // Filtrar por busca (nome, descrição)
    if (busca) {
      const termo = busca.toLowerCase();
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(termo) || 
        ad.description.toLowerCase().includes(termo)
      );
    }
    
    // Filtrar por categoria
    if (categoriaFiltro && categoriaFiltro !== '') {
      // Sistema de mapeamento de categorias para maior compatibilidade
      const categoryMappings: {[key: string]: string[]} = {
        // Veículos e subcategorias
        'veiculos': ['carros', 'motos', 'caminhões', 'veículos'],
        // Imóveis e subcategorias
        'imoveis': ['imóveis', 'casas', 'apartamentos', 'terrenos'],
        // Eletrônicos e subcategorias
        'eletronicos': ['eletrônicos', 'celulares', 'computadores'],
        'eletro': ['eletrodomésticos', 'eletrônicos'],
        // Mais mapeamentos conforme necessário...
      };
      
      filtered = filtered.filter(ad => {
        // Verificação direta da categoria
        if (ad.category && ad.category.toLowerCase() === categoriaFiltro.toLowerCase()) {
          return true;
        }
        
        // Verificar usando o nome exibido da categoria selecionada
        const selectedCategoryName = categoriesList.find(c => c.id === categoriaFiltro)?.name;
        if (selectedCategoryName && ad.category === selectedCategoryName) {
          return true;
        }
        
        // Verificação através do mapeamento
        if (categoryMappings[categoriaFiltro] && 
            categoryMappings[categoriaFiltro].some(cat => 
              ad.category.toLowerCase().includes(cat.toLowerCase())
            )) {
          return true;
        }
        
        return false;
      });
    }
    
    // Filtrar por estado e cidade
    if (estadoFiltro !== 'TODOS') {
      if (estadoFiltro && cidadeFiltro) {
        // Verificamos se a localização contém a cidade selecionada e o estado
        filtered = filtered.filter(ad => {
          const location = String(ad.location || '');
          return location.includes(cidadeFiltro) && location.includes(estadoFiltro);
      });
    } else {
        // Filtrar apenas por estado - verificamos se o endereço contém o estado 
        // OU se contém alguma das cidades daquele estado
      filtered = filtered.filter(ad => {
          const location = String(ad.location || '');
          return location.includes(estadoFiltro) || 
                (estadosCidades[estadoFiltro] && 
                 estadosCidades[estadoFiltro].some(cidade => location.includes(cidade)));
      });
      }
    }
    
    // Filtrar por preço mínimo
    if (precoMin) {
      filtered = filtered.filter(ad => ad.price >= parseFloat(precoMin));
    }
    
    // Filtrar por preço máximo
    if (precoMax) {
      filtered = filtered.filter(ad => ad.price <= parseFloat(precoMax));
    }
    
    // Ordenar
    if (ordenacao === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (ordenacao === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (ordenacao === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (ordenacao === 'views') {
      filtered.sort((a, b) => b.views - a.views);
    }
    
    setAnunciosFiltrados(filtered);
    setCurrentPage(1); // Voltar para a primeira página ao aplicar filtros
  };
  
  // Função para alternar a exibição dos filtros em telas menores
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setPrecoMin('');
    setPrecoMax('');
    setBusca('');
    setCategoriaFiltro('');
    setEstadoFiltro('TODOS');
    setCidadeFiltro('');
    setOrdenacao('recent');
  };
  
  // Paginação
  const totalPaginas = Math.ceil(anunciosFiltrados.length / anunciosPorPagina);
  const indexUltimoAnuncio = currentPage * anunciosPorPagina;
  const indexPrimeiroAnuncio = indexUltimoAnuncio - anunciosPorPagina;
  const anunciosExibidos = anunciosFiltrados.slice(indexPrimeiroAnuncio, indexUltimoAnuncio);
  
  const paginaAnterior = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const proximaPagina = () => {
    if (currentPage < totalPaginas) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const irParaPagina = (pagina: number) => {
    setCurrentPage(pagina);
    window.scrollTo(0, 0);
  };
  
  // Renderizar números de página para navegação
  const renderPaginacao = () => {
    const paginas = [];
    
    // Mostra até 5 números de página, com elipses se necessário
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Primeira página
    if (startPage > 1) {
      paginas.push(
        <button 
          key="1" 
          onClick={() => irParaPagina(1)} 
          className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        paginas.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
      paginas.push(
        <button 
          key={i} 
          onClick={() => irParaPagina(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i ? 'bg-primary text-black font-medium' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Última página
    if (endPage < totalPaginas) {
      if (endPage < totalPaginas - 1) {
        paginas.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      
      paginas.push(
        <button 
          key={totalPaginas} 
          onClick={() => irParaPagina(totalPaginas)} 
          className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700"
        >
          {totalPaginas}
        </button>
      );
    }
    
    return paginas;
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mt-10 mb-8 border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-bold mb-3 text-primary">Todos os Anúncios</h1>
        <p className="text-gray-600">Encontre os melhores produtos e serviços</p>
      </div>
      
      {/* Barra de filtros */}
      <div className="mb-8 bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div className="relative w-full lg:w-1/3 mb-4 lg:mb-0">
        <input
          type="text"
              placeholder="Buscar em anúncios"
              className="w-full py-3 px-4 pr-10 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setBusca(termoBusca);
              // Atualizar a URL para refletir a busca
              const url = new URL(window.location.href);
              if (termoBusca) {
                url.searchParams.set('busca', termoBusca);
              } else {
                url.searchParams.delete('busca');
              }
              window.history.pushState({}, '', url);
            }
          }}
        />
        <button 
          onClick={() => {
            setBusca(termoBusca);
            // Atualizar a URL para refletir a busca
            const url = new URL(window.location.href);
            if (termoBusca) {
              url.searchParams.set('busca', termoBusca);
            } else {
              url.searchParams.delete('busca');
            }
            window.history.pushState({}, '', url);
          }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
        >
              <FaSearch />
        </button>
          </div>
          
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <button 
              onClick={toggleFilters}
              className="flex items-center gap-2 py-2 px-4 bg-gray-700 rounded-lg text-white lg:hidden"
            >
              <FaFilter />
              <span>Filtros</span>
              {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-white hidden lg:inline">Ordenar:</span>
              <select
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="views">Mais vistos</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Filtros responsivos */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <label className="text-white mb-2">Categoria</label>
              <select
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categoriesList.filter(cat => cat.id !== 'todas').map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-white mb-2">Estado</label>
              <select
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value);
                  setCidadeFiltro(''); // Limpar seleção de cidade ao mudar o estado
                }}
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>{estado === 'TODOS' ? 'Todos os estados' : estado}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-white mb-2">Cidade</label>
              <select
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
              >
                <option value="">Todas as cidades</option>
                {cidadesDoEstado.map((cidade: string) => (
                  <option key={cidade} value={cidade}>{cidade}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-white mb-2">Preço mínimo</label>
              <input
                type="number"
                placeholder="R$ Min"
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={precoMin}
                onChange={(e) => setPrecoMin(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-white mb-2">Preço máximo</label>
              <input
                type="number"
                placeholder="R$ Max"
                className="py-2 px-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={precoMax}
                onChange={(e) => setPrecoMax(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col justify-end">
              <button
                className="py-2 px-4 bg-primary text-black font-medium rounded-lg hover:bg-primary-light transition-colors duration-300"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resultados */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {loading ? (
              <span>Carregando anúncios...</span>
            ) : (
              <span>
                {anunciosFiltrados.length} {anunciosFiltrados.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              </span>
            )}
          </h2>
          
          {!loading && (
            <div className="text-gray-400">
              Mostrando {anunciosFiltrados.length > 0 ? indexPrimeiroAnuncio + 1 : 0}-{Math.min(indexUltimoAnuncio, anunciosFiltrados.length)} de {anunciosFiltrados.length}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : anunciosExibidos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {anunciosExibidos.map((ad) => (
                <AdCard key={ad.id} ad={ad} featured={ad.featured} />
              ))}
            </div>
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={paginaAnterior}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1 ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Anterior
                </button>
                
                <div className="flex space-x-2">
                  {renderPaginacao()}
                </div>
                
                <button
                  onClick={proximaPagina}
                  disabled={currentPage === totalPaginas}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPaginas ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Nenhum anúncio encontrado</h3>
            <p className="text-gray-400 mb-6">Tente mudar os filtros ou fazer uma nova busca</p>
            <button
              className="py-2 px-6 bg-primary text-black font-medium rounded-lg hover:bg-primary-light transition-colors duration-300"
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 