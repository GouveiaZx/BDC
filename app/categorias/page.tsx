"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaChevronRight, FaSearch } from 'react-icons/fa';
import { 
  FaHome, FaCar, FaMotorcycle, FaCouch, 
  FaLaptop, FaMobile, FaTshirt, FaBaby, 
  FaGamepad, FaTools, FaGuitar, FaBriefcase,
  FaDog, FaBasketballBall, FaBuilding, FaBook,
  FaBicycle, FaHeart, FaTractor, FaCamera
} from 'react-icons/fa';

// Lista de categorias com ícones (sem subcategorias)
const categoriesListUnordered = [
  {
    id: 'todas',
    name: 'Todas as categorias',
    icon: <FaHome className="text-primary text-2xl" />
  },
  {
    id: 'imoveis',
    name: 'Imóveis',
    icon: <FaHome className="text-primary text-2xl" />
  },
  {
    id: 'veiculos',
    name: 'Veículos',
    icon: <FaCar className="text-primary text-2xl" />
  },
  {
    id: 'autopecas',
    name: 'Autopeças',
    icon: <FaCar className="text-primary text-2xl" />
  },
  {
    id: 'casa-decoracao',
    name: 'Casa, Decoração e Utensílios',
    icon: <FaCouch className="text-primary text-2xl" />
  },
  {
    id: 'moveis',
    name: 'Móveis',
    icon: <FaCouch className="text-primary text-2xl" />
  },
  {
    id: 'eletro',
    name: 'Eletro',
    icon: <FaLaptop className="text-primary text-2xl" />
  },
  {
    id: 'construcao',
    name: 'Materiais de Construção',
    icon: <FaTools className="text-primary text-2xl" />
  },
  {
    id: 'celulares',
    name: 'Celulares e Telefonia',
    icon: <FaMobile className="text-primary text-2xl" />
  },
  {
    id: 'informatica',
    name: 'Informática',
    icon: <FaLaptop className="text-primary text-2xl" />
  },
  {
    id: 'games',
    name: 'Games',
    icon: <FaGamepad className="text-primary text-2xl" />
  },
  {
    id: 'tvs-video',
    name: 'TVs e vídeo',
    icon: <FaLaptop className="text-primary text-2xl" />
  },
  {
    id: 'audio',
    name: 'Áudio',
    icon: <FaGuitar className="text-primary text-2xl" />
  },
  {
    id: 'cameras',
    name: 'Câmeras e Drones',
    icon: <FaCamera className="text-primary text-2xl" />
  },
  {
    id: 'moda',
    name: 'Moda e beleza',
    icon: <FaTshirt className="text-primary text-2xl" />
  },
  {
    id: 'comercio',
    name: 'Comércio',
    icon: <FaBuilding className="text-primary text-2xl" />
  },
  {
    id: 'escritorio',
    name: 'Escritório e Home Office',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },
  {
    id: 'musica',
    name: 'Música e hobbies',
    icon: <FaGuitar className="text-primary text-2xl" />
  },
  {
    id: 'esportes',
    name: 'Esportes e Fitness',
    icon: <FaBasketballBall className="text-primary text-2xl" />
  },
  {
    id: 'infantis',
    name: 'Artigos infantis',
    icon: <FaBaby className="text-primary text-2xl" />
  },
  {
    id: 'animais',
    name: 'Animais de estimação',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'agro',
    name: 'Agro e indústria',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'servicos',
    name: 'Serviços',
    icon: <FaHeart className="text-primary text-2xl" />
  },
  {
    id: 'empregos',
    name: 'Vagas de emprego',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },
  {
    id: 'alimentos',
    name: 'Alimentos',
    icon: <FaHeart className="text-primary text-2xl" />
  }
];

// Separar a categoria "Todas" e ordenar o restante alfabeticamente
const todasCategoria = categoriesListUnordered.find(cat => cat.id === 'todas');
const restCategories = categoriesListUnordered
  .filter(cat => cat.id !== 'todas')
  .sort((a, b) => a.name.localeCompare(b.name));

// Combinar "Todas" com o restante ordenado
const categoriesList = todasCategoria ? [todasCategoria, ...restCategories] : restCategories;

export default function Categories() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está logado
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    setIsLoggedIn(!!userId);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/anuncios?busca=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCreateAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push('/painel-anunciante/criar-anuncio');
    } else {
      router.push('/login?redirect=painel-anunciante/criar-anuncio');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Cabeçalho */}
      <div className="mb-10 text-center mt-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">Categorias</h1>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Encontre o que você procura entre nossas diversas categorias de produtos e serviços. 
          Navegue por categoria ou utilize a busca para encontrar itens específicos.
        </p>
      </div>
      
      {/* Busca */}
      <div className="max-w-xl mx-auto mb-12 relative">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Buscar em todas as categorias..."
            className="w-full px-5 py-4 pl-12 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
          >
            <FaSearch />
          </button>
        </form>
      </div>
      
      {/* Lista de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesList.map((category) => (
          <div key={category.id} className="bg-gray-800 rounded-xl overflow-hidden transition-transform hover:scale-[1.02]">
            <Link href={`/categoria/${category.id}`}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {category.icon}
                  <h2 className="text-xl font-bold ml-3 text-white">{category.name}</h2>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Banner informativo */}
      <div className="bg-gray-800 rounded-xl p-8 mt-12">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Quer anunciar em uma categoria específica?</h2>
            <p className="text-gray-400 mb-6">
              Crie seu anúncio em poucos minutos e escolha a categoria mais adequada para seu produto ou serviço. 
              Anúncios bem categorizados têm mais chances de serem encontrados pelos compradores certos.
            </p>
            <button 
              onClick={handleCreateAdClick}
              className="inline-flex items-center bg-primary hover:bg-primary-light hover:text-white text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Criar anúncio agora
            </button>
          </div>
          <div className="md:w-1/3 relative h-48 md:h-64 w-full md:w-auto rounded-xl overflow-hidden">
            <Image 
              src="/images/category-banner.jpg" 
              alt="Criar anúncio" 
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 