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
  FaBicycle, FaHeart, FaTractor, FaCamera,
  FaTv, FaAppleAlt, FaTruck, FaHammer, FaGem,
  FaPaintBrush, FaLeaf, FaShoppingCart, FaPlug,
  FaShip, FaBriefcaseMedical, FaGraduationCap,
  FaFilm, FaUtensils, FaMicrochip, FaWrench
} from 'react-icons/fa';

// ✅ LISTA COMPLETA - Todas as categorias do banco de dados organizadas por grupos
const categoriesListUnordered = [
  {
    id: 'todas',
    name: 'Todas as categorias',
    icon: <FaHome className="text-primary text-2xl" />
  },
  
  // === VEÍCULOS ===
  {
    id: 'carros',
    name: 'Carros',
    icon: <FaCar className="text-primary text-2xl" />
  },
  {
    id: 'motos', 
    name: 'Motos',
    icon: <FaMotorcycle className="text-primary text-2xl" />
  },
  {
    id: 'caminhoes',
    name: 'Caminhões',
    icon: <FaTruck className="text-primary text-2xl" />
  },
  {
    id: 'onibus-vans',
    name: 'Ônibus e Vans', 
    icon: <FaTruck className="text-primary text-2xl" />
  },
  {
    id: 'barcos-lanchas',
    name: 'Barcos e Lanchas',
    icon: <FaShip className="text-primary text-2xl" />
  },
  {
    id: 'bicicletas',
    name: 'Bicicletas',
    icon: <FaBicycle className="text-primary text-2xl" />
  },
  {
    id: 'pecas-acessorios',
    name: 'Peças e Acessórios',
    icon: <FaWrench className="text-primary text-2xl" />
  },

  // === IMÓVEIS ===
  {
    id: 'casas',
    name: 'Casas',
    icon: <FaHome className="text-primary text-2xl" />
  },
  {
    id: 'apartamentos',
    name: 'Apartamentos',
    icon: <FaBuilding className="text-primary text-2xl" />
  },
  {
    id: 'terrenos',
    name: 'Terrenos',
    icon: <FaLeaf className="text-primary text-2xl" />
  },
  {
    id: 'comercial',
    name: 'Comercial',
    icon: <FaBuilding className="text-primary text-2xl" />
  },
  {
    id: 'rural',
    name: 'Rural',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'temporada',
    name: 'Temporada',
    icon: <FaHome className="text-primary text-2xl" />
  },

  // === ELETRÔNICOS ===
  {
    id: 'celulares',
    name: 'Celulares',
    icon: <FaMobile className="text-primary text-2xl" />
  },
  {
    id: 'computadores',
    name: 'Computadores',
    icon: <FaLaptop className="text-primary text-2xl" />
  },
  {
    id: 'games',
    name: 'Games',
    icon: <FaGamepad className="text-primary text-2xl" />
  },
  {
    id: 'tv-som',
    name: 'TV e Som',
    icon: <FaTv className="text-primary text-2xl" />
  },
  {
    id: 'cameras-filmadoras',
    name: 'Câmeras e Filmadoras',
    icon: <FaCamera className="text-primary text-2xl" />
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: <FaMicrochip className="text-primary text-2xl" />
  },

  // === CASA E DECORAÇÃO ===
  {
    id: 'moveis',
    name: 'Móveis',
    icon: <FaCouch className="text-primary text-2xl" />
  },
  {
    id: 'decoracao',
    name: 'Decoração',
    icon: <FaPaintBrush className="text-primary text-2xl" />
  },
  {
    id: 'eletrodomesticos',
    name: 'Eletrodomésticos',
    icon: <FaPlug className="text-primary text-2xl" />
  },
  {
    id: 'ferramentas',
    name: 'Ferramentas',
    icon: <FaHammer className="text-primary text-2xl" />
  },
  {
    id: 'jardim',
    name: 'Jardim',
    icon: <FaLeaf className="text-primary text-2xl" />
  },
  {
    id: 'materiais-construcao',
    name: 'Materiais de Construção',
    icon: <FaTools className="text-primary text-2xl" />
  },

  // === MODA E BELEZA ===
  {
    id: 'roupas-femininas',
    name: 'Roupas Femininas',
    icon: <FaTshirt className="text-primary text-2xl" />
  },
  {
    id: 'roupas-masculinas',
    name: 'Roupas Masculinas',
    icon: <FaTshirt className="text-primary text-2xl" />
  },
  {
    id: 'calcados',
    name: 'Calçados',
    icon: <FaShoppingCart className="text-primary text-2xl" />
  },
  {
    id: 'bolsas-acessorios',
    name: 'Bolsas e Acessórios',
    icon: <FaShoppingCart className="text-primary text-2xl" />
  },
  {
    id: 'beleza-perfumaria',
    name: 'Beleza e Perfumaria',
    icon: <FaHeart className="text-primary text-2xl" />
  },
  {
    id: 'joias-relogios',
    name: 'Joias e Relógios',
    icon: <FaGem className="text-primary text-2xl" />
  },

  // === ESPORTES ===
  {
    id: 'fitness',
    name: 'Fitness',
    icon: <FaBasketballBall className="text-primary text-2xl" />
  },
  {
    id: 'futebol',
    name: 'Futebol',
    icon: <FaBasketballBall className="text-primary text-2xl" />
  },
  {
    id: 'ciclismo',
    name: 'Ciclismo',
    icon: <FaBicycle className="text-primary text-2xl" />
  },
  {
    id: 'natacao',
    name: 'Natação',
    icon: <FaBasketballBall className="text-primary text-2xl" />
  },
  {
    id: 'camping',
    name: 'Camping',
    icon: <FaLeaf className="text-primary text-2xl" />
  },

  // === MÚSICA E ENTRETENIMENTO ===
  {
    id: 'instrumentos-musicais',
    name: 'Instrumentos Musicais',
    icon: <FaGuitar className="text-primary text-2xl" />
  },
  {
    id: 'livros',
    name: 'Livros',
    icon: <FaBook className="text-primary text-2xl" />
  },
  {
    id: 'cursos',
    name: 'Cursos',
    icon: <FaGraduationCap className="text-primary text-2xl" />
  },
  {
    id: 'musica-filmes',
    name: 'Música e Filmes',
    icon: <FaFilm className="text-primary text-2xl" />
  },

  // === ANIMAIS ===
  {
    id: 'cachorros',
    name: 'Cachorros',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'gatos',
    name: 'Gatos',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'peixes',
    name: 'Peixes',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'aves',
    name: 'Aves',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'acessorios-pets',
    name: 'Acessórios para Pets',
    icon: <FaDog className="text-primary text-2xl" />
  },
  {
    id: 'outros-animais',
    name: 'Outros Animais',
    icon: <FaDog className="text-primary text-2xl" />
  },

  // === INFANTIL ===
  {
    id: 'roupas-bebe',
    name: 'Roupas de Bebê',
    icon: <FaBaby className="text-primary text-2xl" />
  },
  {
    id: 'moveis-bebe',
    name: 'Móveis de Bebê',
    icon: <FaBaby className="text-primary text-2xl" />
  },
  {
    id: 'brinquedos',
    name: 'Brinquedos',
    icon: <FaBaby className="text-primary text-2xl" />
  },
  {
    id: 'roupas-infantis',
    name: 'Roupas Infantis',
    icon: <FaBaby className="text-primary text-2xl" />
  },

  // === SERVIÇOS ===
  {
    id: 'servicos-automotivos',
    name: 'Serviços Automotivos',
    icon: <FaWrench className="text-primary text-2xl" />
  },
  {
    id: 'reformas-reparos',
    name: 'Reformas e Reparos',
    icon: <FaHammer className="text-primary text-2xl" />
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },
  {
    id: 'servicos-beleza',
    name: 'Beleza e Estética',
    icon: <FaHeart className="text-primary text-2xl" />
  },
  {
    id: 'eventos',
    name: 'Eventos',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: <FaTruck className="text-primary text-2xl" />
  },
  {
    id: 'consultoria',
    name: 'Consultoria',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },

  // === AGRO E INDÚSTRIA ===
  {
    id: 'tratores',
    name: 'Tratores',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'gado',
    name: 'Gado',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'cavalos',
    name: 'Cavalos',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'aves-granja',
    name: 'Aves de Granja',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'sementes-mudas',
    name: 'Sementes e Mudas',
    icon: <FaLeaf className="text-primary text-2xl" />
  },
  {
    id: 'equipamentos-rurais',
    name: 'Equipamentos Rurais',
    icon: <FaTractor className="text-primary text-2xl" />
  },
  {
    id: 'maquinas-industriais',
    name: 'Máquinas Industriais',
    icon: <FaTools className="text-primary text-2xl" />
  },
  {
    id: 'equipamentos-comerciais',
    name: 'Equipamentos Comerciais',
    icon: <FaBuilding className="text-primary text-2xl" />
  },

  // === ESCRITÓRIO E OUTROS ===
  {
    id: 'material-escritorio',
    name: 'Material de Escritório',
    icon: <FaBriefcase className="text-primary text-2xl" />
  },
  {
    id: 'antiguidades',
    name: 'Antiguidades',
    icon: <FaGem className="text-primary text-2xl" />
  },
  {
    id: 'artesanato',
    name: 'Artesanato',
    icon: <FaPaintBrush className="text-primary text-2xl" />
  },

  // === ✅ ALIMENTOS - NOVA CATEGORIA ADICIONADA ===
  {
    id: 'alimentos',
    name: 'Alimentos',
    icon: <FaAppleAlt className="text-primary text-2xl" />
  },

  // === OUTROS ===
  {
    id: 'outros',
    name: 'Outros',
    icon: <FaShoppingCart className="text-primary text-2xl" />
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