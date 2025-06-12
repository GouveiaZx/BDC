"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AdCard from '../../components/AdCard';
import Link from 'next/link';
import Image from 'next/image';
import { FaFilter, FaSort, FaSearch, FaChevronDown, FaChevronUp, FaMapMarkerAlt } from 'react-icons/fa';
import { getSupabaseClient } from '../../lib/supabase';

// Lista de cidades permitidas no Maranhão
const cidadesPermitidas = [
  "Barra do Corda",
  "Fernando Falcão",
  "Jenipapo dos Vieiras",
  "Presidente Dutra",
  "Grajaú",
  "Formosa da Serra Negra",
  "Itaipava do Grajaú",
  "Esperantinópolis"
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

// Título das categorias - ordenados alfabeticamente pelos valores
const categoriaTitulosUnsorted: { [key: string]: string } = {
  todas: 'Todas as categorias',
  imoveis: 'Imóveis',
  veiculos: 'Veículos',
  autopecas: 'Autopeças',
  'casa-decoracao': 'Casa, Decoração e Utensílios',
  moveis: 'Móveis',
  eletro: 'Eletro',
  construcao: 'Materiais de Construção',
  celulares: 'Celulares e Telefonia',
  informatica: 'Informática',
  games: 'Games',
  'tvs-video': 'TVs e vídeo',
  audio: 'Áudio',
  cameras: 'Câmeras e Drones',
  moda: 'Moda e beleza',
  comercio: 'Comércio',
  escritorio: 'Escritório e Home Office',
  musica: 'Música e hobbies',
  esportes: 'Esportes e Fitness',
  infantis: 'Artigos infantis',
  animais: 'Animais de estimação',
  agro: 'Agro e indústria',
  servicos: 'Serviços',
  empregos: 'Vagas de emprego',
  alimentos: 'Alimentos'
};

// Ordenando os pares chave-valor pelo valor (nome da categoria)
const categoriaTitulosOrdenados = Object.entries(categoriaTitulosUnsorted)
  .sort(([,a], [,b]) => {
    // Manter "Todas as categorias" no topo
    if (a === 'Todas as categorias') return -1;
    if (b === 'Todas as categorias') return 1;
    return a.localeCompare(b);
  })
  .reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as {[key: string]: string});

const categoriaTitulos = categoriaTitulosOrdenados;

// Descrição de categorias
const categoriaDescricoesUnsorted: { [key: string]: string } = {
  todas: 'Todos os anúncios disponíveis em nossa plataforma',
  imoveis: 'Casas, apartamentos, terrenos e imóveis comerciais para venda e aluguel',
  veiculos: 'Encontre os melhores carros, motos e outros veículos para compra e venda',
  autopecas: 'Peças e acessórios para carros, motos e outros veículos',
  'casa-decoracao': 'Produtos para sua casa, decoração e utensílios domésticos',
  moveis: 'Móveis para sua casa ou escritório com os melhores preços',
  eletro: 'Eletrodomésticos e produtos para seu lar',
  construcao: 'Materiais para construção, reforma e ferramentas',
  celulares: 'Celulares, smartphones e acessórios para telefonia',
  informatica: 'Computadores, notebooks, tablets e equipamentos de informática',
  games: 'Videogames, consoles, jogos e acessórios para gamers',
  'tvs-video': 'Televisores, aparelhos de vídeo e home theater',
  audio: 'Equipamentos de áudio, som e acessórios',
  cameras: 'Câmeras fotográficas, drones e equipamentos de vídeo',
  moda: 'Roupas, calçados, acessórios e produtos de beleza',
  comercio: 'Produtos e equipamentos para comércio e lojas',
  escritorio: 'Mobiliário e equipamentos para escritório e home office',
  musica: 'Instrumentos musicais e acessórios para músicos e hobbistas',
  esportes: 'Artigos esportivos, equipamentos fitness e acessórios',
  infantis: 'Produtos para bebês, crianças e artigos infantis',
  animais: 'Produtos para pets, animais de estimação e acessórios',
  agro: 'Produtos e equipamentos para agricultura, pecuária e indústria',
  servicos: 'Prestadores de serviços qualificados para suas necessidades',
  empregos: 'Vagas de emprego e oportunidades de trabalho em diversas áreas',
  alimentos: 'Produtos alimentícios, bebidas e acessórios para culinária'
};

// Ordenando os pares chave-valor pelo valor que corresponde às descrições
const categoriaDescricoesOrdenadas = Object.entries(categoriaDescricoesUnsorted)
  .sort(([key1], [key2]) => {
    // Manter a mesma ordem do objeto categoriaTitulos
    const index1 = Object.keys(categoriaTitulos).indexOf(key1);
    const index2 = Object.keys(categoriaTitulos).indexOf(key2);
    return index1 - index2;
  })
  .reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as {[key: string]: string});

const categoriaDescricoes = categoriaDescricoesOrdenadas;

// Função para buscar anúncios da categoria do banco de dados
async function getApprovedAdsByCategory(categorySlug: string) {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar anúncios ativos e aprovados
    const { data: ads, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('moderation_status', 'approved')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar anúncios da categoria:', error);
      return [];
    }
    
    // Filtrar anúncios pela categoria
    const filteredAds = filterAdsByCategory(ads, categorySlug);
    
    // Mapear anúncios para o formato esperado pelo frontend
    return filteredAds.map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      subCategory: ad.sub_category,
      images: ad.images || [],
      location: ad.location,
      featured: ad.is_featured || false,
      createdAt: ad.created_at,
      views: ad.views || 0,
      clicks: ad.clicks || 0,
      userName: ad.user_name,
      userAvatar: ad.user_avatar
    }));
  } catch (error) {
    console.error('Erro ao processar busca de anúncios por categoria:', error);
    return [];
  }
}

// Função para filtrar anúncios por categoria
function filterAdsByCategory(ads: any[], categorySlug: string) {
  return ads.filter(ad => {
    // Normalizar a categoria do anúncio e a categoria selecionada para comparação consistente
    const adCategory = ad.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') || '';
    const normalizedCategorySlug = categorySlug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Sistema de mapeamento bidirecional de categorias
    const categoryMappings: {[key: string]: string[]} = {
      // Veículos e subcategorias
      'veiculos': ['carros', 'motos', 'caminhoes', 'caminhões', 'veiculos', 'veiculo'],
      'carros': ['veiculos'],
      'motos': ['veiculos'],
      'caminhoes': ['veiculos', 'caminhões'],
      'caminhões': ['veiculos', 'caminhoes'],
      
      // Imóveis e subcategorias
      'imoveis': ['imovel', 'imoveis', 'imóveis', 'imóvel', 'casa', 'apartamento', 'terreno', 'sala-comercial'],
      'imovel': ['imoveis', 'imóveis', 'imóvel'],
      'imóveis': ['imoveis', 'imovel', 'imóvel'],
      'imóvel': ['imoveis', 'imovel', 'imóveis'],
      'casa': ['imoveis', 'imóveis'],
      'apartamento': ['imoveis', 'imóveis'],
      'terreno': ['imoveis', 'imóveis'],
      'sala-comercial': ['imoveis', 'imóveis'],
      
      // Eletrônicos e subcategorias
      'eletronicos': ['eletro', 'eletronico', 'eletrônicos', 'eletrônico', 'eletrodomesticos', 'eletrodomésticos', 'celulares', 'tvs-video', 'computadores'],
      'eletro': ['eletronicos', 'eletrônicos', 'eletrodomesticos', 'eletrodomésticos'],
      'eletronico': ['eletronicos', 'eletrônicos'],
      'eletrônicos': ['eletronicos', 'eletro'],
      'eletrônico': ['eletronicos', 'eletrônicos'],
      'eletrodomesticos': ['eletro', 'eletronicos', 'eletrodomésticos'],
      'eletrodomésticos': ['eletro', 'eletronicos', 'eletrodomesticos'],
      'celulares': ['eletronicos', 'eletrônicos'],
      'tvs-video': ['eletronicos', 'eletrônicos'],
      'computadores': ['eletronicos', 'eletrônicos'],
      
      // Móveis e subcategorias
      'moveis': ['movel', 'móveis', 'móvel', 'sofa', 'sofá', 'cama', 'mesa'],
      'movel': ['moveis', 'móveis', 'móvel'],
      'móveis': ['moveis', 'movel', 'móvel'],
      'móvel': ['moveis', 'movel', 'móveis'],
      'sofa': ['moveis', 'móveis'],
      'sofá': ['moveis', 'móveis'],
      'cama': ['moveis', 'móveis'],
      'mesa': ['moveis', 'móveis'],
      
      // Serviços e subcategorias
      'servicos': ['servico', 'serviços', 'serviço', 'reformas', 'aulas', 'consertos'],
      'servico': ['servicos', 'serviços', 'serviço'],
      'serviços': ['servicos', 'servico', 'serviço'],
      'serviço': ['servicos', 'servico', 'serviços'],
      'reformas': ['servicos', 'serviços'],
      'aulas': ['servicos', 'serviços'],
      'consertos': ['servicos', 'serviços'],
      
      // Casa e decoração
      'casa-decoracao': ['decoracao', 'decoração', 'enxoval', 'utensilios', 'utensílios'],
      'decoracao': ['casa-decoracao'],
      'decoração': ['casa-decoracao'],
      
      // Outras categorias...
      'games': ['jogos', 'videogames', 'consoles'],
      'jogos': ['games'],
      'esportes': ['esporte', 'fitness', 'academia'],
      'esporte': ['esportes'],
      'infantis': ['bebe', 'bebê', 'crianca', 'criança', 'brinquedos'],
      'animais': ['pets', 'pet', 'animais-de-estimacao', 'animais-de-estimação'],
      'agro': ['agricultura', 'pecuaria', 'pecuária', 'fazenda', 'rural'],
    };
    
    // Verificar se a categoria do anúncio corresponde ao slug diretamente
    if (adCategory === normalizedCategorySlug) {
      return true;
    }
    
    // Verificar através do mapeamento de categorias
    if (categoryMappings[normalizedCategorySlug] && 
        categoryMappings[normalizedCategorySlug].some(cat => 
          adCategory === cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
        )) {
      return true;
    }
    
    // Verificar o mapeamento inverso (quando o anúncio está em uma categoria que mapeia para a categoria da URL)
    if (categoryMappings[adCategory] && 
        categoryMappings[adCategory].some(cat => 
          normalizedCategorySlug === cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
        )) {
      return true;
    }
    
    // Verificar relação entre as categorias considerando nomes mais descritivos
    const adCategoryActual = ad.category?.toLowerCase() || '';
    
    // Mapeamento específico de casos especiais para a categoria
    if (
      (normalizedCategorySlug === 'veiculos' && adCategoryActual === 'carros') ||
      (normalizedCategorySlug === 'imoveis' && adCategoryActual === 'imóveis') ||
      (normalizedCategorySlug === 'eletronicos' && adCategoryActual === 'eletrônicos') ||
      (normalizedCategorySlug === 'eletro' && adCategoryActual === 'eletrônicos') ||
      (normalizedCategorySlug === 'moveis' && adCategoryActual === 'móveis') ||
      (normalizedCategorySlug === 'casa' && adCategoryActual === 'imóveis')
    ) {
      return true;
    }
    
    return false;
  });
}

export default function CategoriaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoriaSlug = params.categoria as string;
  const subcategoria = searchParams.get('subcategoria');
  const categoriaTitle = categoriaTitulos[categoriaSlug] || 'Categoria';
  const categoriaDescricao = categoriaDescricoes[categoriaSlug] || '';
  
  // Estados para ordenação e filtros
  const [ordenacao, setOrdenacao] = useState('recent');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [busca, setBusca] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [anunciosFiltrados, setAnunciosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lista de cidades do estado selecionado
  const cidadesDoEstado = estadoFiltro && estadoFiltro !== 'TODOS' ? estadosCidades[estadoFiltro] || [] : [];
  
  // Efeito para verificar se estamos no lado do cliente e carregar anúncios
  useEffect(() => {
    setIsClient(true);
    
    // Se houver subcategoria na URL, usá-la na busca
    if (subcategoria) {
      setBusca(subcategoria.replace(/-/g, ' '));
    }
    
    // Buscar anúncios por categoria
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
          console.error('Erro ao buscar anúncios da categoria:', error);
          setAnuncios([]);
          setAnunciosFiltrados([]);
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
          featured: ad.is_featured || false,
          createdAt: ad.created_at,
          views: ad.views || 0,
          clicks: ad.clicks || 0,
          userName: ad.user_name,
          userAvatar: ad.user_avatar
        }));
        
        setAnuncios(formattedAds);
        console.log(`Carregados ${formattedAds.length} anúncios do banco de dados`);
      } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
        setAnuncios([]);
        setAnunciosFiltrados([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAds();
  }, [categoriaSlug, subcategoria]);
  
  // Filtragem e ordenação dos anúncios
  useEffect(() => {
    if (!anuncios.length) {
      setAnunciosFiltrados([]);
      return;
    }
    
    let filtered = [...anuncios];
    
    // Filtrar por categoria
    filtered = filtered.filter(ad => {
      // Normalizar a categoria do anúncio e a categoria selecionada para comparação consistente
      const adCategory = ad.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') || '';
      const normalizedCategoriaSlug = categoriaSlug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Sistema de mapeamento bidirecional de categorias
      const categoryMappings: {[key: string]: string[]} = {
        // Veículos e subcategorias
        'veiculos': ['carros', 'motos', 'caminhoes', 'caminhões', 'veiculos', 'veiculo'],
        'carros': ['veiculos'],
        'motos': ['veiculos'],
        'caminhoes': ['veiculos', 'caminhões'],
        'caminhões': ['veiculos', 'caminhoes'],
        
        // Imóveis e subcategorias
        'imoveis': ['imovel', 'imoveis', 'imóveis', 'imóvel', 'casa', 'apartamento', 'terreno', 'sala-comercial'],
        'imovel': ['imoveis', 'imóveis', 'imóvel'],
        'imóveis': ['imoveis', 'imovel', 'imóvel'],
        'imóvel': ['imoveis', 'imovel', 'imóveis'],
        'casa': ['imoveis', 'imóveis'],
        'apartamento': ['imoveis', 'imóveis'],
        'terreno': ['imoveis', 'imóveis'],
        'sala-comercial': ['imoveis', 'imóveis'],
        
        // Outras categorias mapeadas anteriormente...
      };
      
      // Verificar se a categoria do anúncio corresponde ao slug diretamente
      if (adCategory === normalizedCategoriaSlug) {
        return true;
      }
      
      // Verificar através do mapeamento de categorias
      if (categoryMappings[normalizedCategoriaSlug] && 
          categoryMappings[normalizedCategoriaSlug].some(cat => 
            adCategory === cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
          )) {
        return true;
      }
      
      // Verificar o mapeamento inverso
      if (categoryMappings[adCategory] && 
          categoryMappings[adCategory].some(cat => 
            normalizedCategoriaSlug === cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
          )) {
        return true;
      }
      
      // Verificar relação entre as categorias considerando nomes mais descritivos
      const adCategoryActual = ad.category?.toLowerCase() || '';
      
      // Mapeamento específico de casos especiais
      if (
        (normalizedCategoriaSlug === 'veiculos' && adCategoryActual === 'carros') ||
        (normalizedCategoriaSlug === 'imoveis' && adCategoryActual === 'imóveis') ||
        (normalizedCategoriaSlug === 'eletronicos' && adCategoryActual === 'eletrônicos') ||
        (normalizedCategoriaSlug === 'eletro' && adCategoryActual === 'eletrônicos') ||
        (normalizedCategoriaSlug === 'moveis' && adCategoryActual === 'móveis') ||
        (normalizedCategoriaSlug === 'casa' && adCategoryActual === 'imóveis')
      ) {
        return true;
      }
      
      return false;
    });
    
    // Filtrar por busca
    if (busca.trim() !== '') {
      const searchTerm = busca.toLowerCase();
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(searchTerm) || 
        ad.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtrar por estado e cidade
    if (estadoFiltro !== 'TODOS') {
      if (estadoFiltro && cidadeFiltro) {
        // Verificamos se a localização contém a cidade e o estado
        filtered = filtered.filter(ad => {
          const location = String(ad.location || '');
          return location.includes(cidadeFiltro) && location.includes(estadoFiltro);
        });
      } else {
        // Filtrar apenas por estado
      filtered = filtered.filter(ad => {
          const location = String(ad.location || '');
          return location.includes(estadoFiltro) || 
                (estadosCidades[estadoFiltro] && 
                estadosCidades[estadoFiltro].some(cidade => location.includes(cidade)));
      });
      }
    }
    
    // Filtrar por preço
    if (precoMin !== '') {
      filtered = filtered.filter(ad => parseFloat(ad.price) >= parseFloat(precoMin));
    }
    
    if (precoMax !== '') {
      filtered = filtered.filter(ad => parseFloat(ad.price) <= parseFloat(precoMax));
    }
    
    // Ordenação
    if (ordenacao === 'recent') {
      filtered.sort((a, b) => {
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
    } else if (ordenacao === 'price_asc') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (ordenacao === 'price_desc') {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (ordenacao === 'views') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    
    setAnunciosFiltrados(filtered);
  }, [anuncios, busca, precoMin, precoMax, ordenacao, estadoFiltro, cidadeFiltro, categoriaSlug]);
  
  // Função para alternar a exibição dos filtros em telas menores
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setPrecoMin('');
    setPrecoMax('');
    setBusca('');
    setEstadoFiltro('TODOS');
    setCidadeFiltro('');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mt-8 mb-10 border-b pb-6 border-gray-200">
        <h1 className="text-3xl font-bold mb-3 text-primary">
          {categoriaTitle}
          {subcategoria && (
            <span className="text-gray-500 ml-2 font-normal">
              &gt; {subcategoria.replace(/-/g, ' ').charAt(0).toUpperCase() + subcategoria.replace(/-/g, ' ').slice(1)}
            </span>
          )}
        </h1>
        <p className="text-gray-600">{categoriaDescricao}</p>
      </div>
      
      {/* Barra de filtros */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
          <div className="relative w-full lg:w-1/3 mb-4 lg:mb-0">
            <input
              type="text"
              placeholder="Buscar em anúncios"
              className="w-full py-2 px-4 pr-10 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <button 
              onClick={toggleFilters}
              className="flex items-center gap-2 py-2 px-4 bg-gray-100 rounded-lg text-gray-800 lg:hidden"
            >
              <FaFilter />
              <span>Filtros</span>
              {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-800 hidden lg:inline">Ordenar:</span>
              <select
                className="py-2 px-4 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
              >
                <option value="recent">Mais recentes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="views">Mais vistos</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Filtros responsivos */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
            <div className="flex flex-col">
              <label className="text-gray-700 mb-2">Estado</label>
              <select
                className="py-2 px-4 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="text-gray-700 mb-2">Cidade</label>
              <select
                className="py-2 px-4 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="text-gray-700 mb-2">Preço mínimo</label>
              <input
                type="number"
                placeholder="R$ Min"
                className="py-2 px-4 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={precoMin}
                onChange={(e) => setPrecoMin(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-gray-700 mb-2">Preço máximo</label>
              <input
                type="number"
                placeholder="R$ Max"
                className="py-2 px-4 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={precoMax}
                onChange={(e) => setPrecoMax(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-2">
              <button
                className="mt-4 lg:mt-0 py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors duration-300"
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
          <h2 className="text-xl font-semibold text-primary">
            {loading ? (
              <span>Carregando anúncios...</span>
            ) : (
              <span>
            {anunciosFiltrados.length} {anunciosFiltrados.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              </span>
            )}
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : anunciosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {anunciosFiltrados.map((ad) => (
              <AdCard key={ad.id} ad={ad} featured={ad.featured} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
              <div className="absolute inset-2 bg-primary/5 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Nenhum anúncio encontrado</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Não encontramos anúncios nesta categoria com os filtros aplicados. Tente ajustar os filtros ou volte mais tarde.
            </p>
            <button
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors duration-300 shadow-sm"
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