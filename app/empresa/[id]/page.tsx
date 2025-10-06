'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaStarHalfAlt, FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaRegThumbsUp, FaShoppingBag, FaEye, FaShare, FaHeart, FaRegHeart, FaTimes, FaSearch } from 'react-icons/fa';
import { Ad, Seller } from '../../models/types';
import AdCard from '../../components/AdCard';
// Mock data removed - using real API data from Supabase
import { MapPin, Phone, Mail, Clock, Award, Share2, Bookmark, Star, Check } from 'lucide-react';
import StoreStories from '../../components/StoreStories';
import WhatsAppButton from '../../components/WhatsAppButton';
import StoreStoriesConfig from '../../components/StoreStoriesConfig';

// Adicionando alguns estilos globais
import './empresa.css';

interface EmpresaPageProps {
  params: { id: string };
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

interface Highlight {
  id: string;
  title: string;
  image: string;
  description: string;
  adId?: string;
}

// Função para formatar data
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long'
  });
};

export default function EmpresaPage({ params }: EmpresaPageProps) {
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anunciosAtivos, setAnunciosAtivos] = useState<any[]>([]);
  
  // Novos estados para a interface melhorada
  const [activeTab, setActiveTab] = useState<'anuncios' | 'sobre' | 'avaliacoes' | 'contato'>('anuncios');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Estados para as visualizações
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Estado para filtrar anúncios
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'recent'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do vendedor via API
        const sellerResponse = await fetch(`/api/users/${params.id}`);
        if (sellerResponse.ok) {
          const sellerData = await sellerResponse.json();
          if (sellerData.success && sellerData.user) {
            setSeller(sellerData.user);
          }
        }

        // Buscar anúncios do vendedor via API
        const adsResponse = await fetch(`/api/ads?userId=${params.id}&status=active&limit=20`);
        if (adsResponse.ok) {
          const adsData = await adsResponse.json();
          if (adsData.success && adsData.ads) {
            setAnunciosAtivos(adsData.ads);
          }
        }

        setLoading(false);
        setActiveTab('anuncios');
      } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Empresa não encontrada</h1>
        <p className="mt-4 text-gray-600">A empresa que você está procurando não existe ou foi removida.</p>
      </div>
    );
  }

  // Filtrar anúncios com base no filtro ativo
  const filteredAds = activeFilter === 'featured' 
    ? anunciosAtivos.filter(ad => ad.featured)
    : activeFilter === 'recent' 
      ? [...anunciosAtivos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
      : anunciosAtivos;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Cabeçalho principal */}
      <div className="relative bg-cover bg-center h-56 md:h-64 bg-gray-900 overflow-hidden" style={{ 
        backgroundImage: `url(${seller.banner})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/80"></div>
        
        {/* Informações da empresa sobrepostas no banner */}
        <div className="absolute inset-0 flex items-center justify-start">
          <div className="container mx-auto px-4">
            <div className="flex flex-row items-center gap-4 relative">
              {/* Logo */}
              <div className="relative z-10 bg-white rounded-lg shadow-md p-1 border border-gray-200">
                <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-lg overflow-hidden">
                  <Image 
                    src={seller.avatar} 
                    alt={`Logo de ${seller.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 64px, 80px"
                    priority
                  />
                </div>
              </div>
              
              <div className="ml-2 md:ml-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-white mr-1">{seller.name}</h1>
                  {seller.verified && (
                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center">
                      <Check className="w-3 h-3 mr-0.5" />
                      Verificado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <p className="text-gray-200 flex items-center gap-1">
                    <MapPin size={14} /> {seller.location}
                  </p>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <div className="flex items-center text-gray-200">
                    <div className="flex mr-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {seller.rating >= star ? (
                            <FaStar className="text-yellow-400 text-xs" />
                          ) : seller.rating >= star - 0.5 ? (
                            <FaStarHalfAlt className="text-yellow-400 text-xs" />
                          ) : (
                            <FaStar className="text-gray-300 text-xs" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="text-white font-medium">{seller.rating}</span>
                    <span className="text-gray-400 text-xs ml-1">({seller.reviewCount})</span>
                  </div>
                </div>
              </div>
              
              <div className="ml-auto flex gap-2">
                <WhatsAppButton
                  phoneNumber={seller.phone}
                  message={`Olá, vi seu perfil no classificado e gostaria de mais informações.`}
                  buttonText="WhatsApp"
                  size="sm"
                  variant="secondary"
                />
                <button 
                  onClick={() => setShowContactInfo(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 text-sm"
                >
                  <Phone size={14} />
                  <span className="text-white">Contato</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navegação por tabs - colado ao banner */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm -mt-1">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar text-sm">
            <button 
              onClick={() => setActiveTab('anuncios')}
              className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'anuncios' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              Anúncios
            </button>
            <button 
              onClick={() => setActiveTab('sobre')}
              className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'sobre' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              Sobre a Empresa
            </button>
            <button 
              onClick={() => setActiveTab('avaliacoes')}
              className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'avaliacoes' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              Avaliações
            </button>
            <button 
              onClick={() => setActiveTab('contato')}
              className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contato' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
            >
              Contato
            </button>
          </div>
        </div>
      </div>
      
      {/* Ações rápidas (fixas) */}
      <div className="bg-white border-t border-gray-100 shadow-md py-3 fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button className="text-gray-700 hover:text-blue-600 flex flex-col items-center text-xs">
                <Share2 size={20} />
                <span>Compartilhar</span>
              </button>
              <button 
                onClick={() => setIsFavorite(!isFavorite)} 
                className={`flex flex-col items-center text-xs ${isFavorite ? 'text-red-500' : 'text-gray-700 hover:text-blue-600'}`}
              >
                {isFavorite ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
              </button>
            </div>
            
            <div className="mt-6">
              <WhatsAppButton
                phoneNumber={seller.phone}
                message={`Olá, vi seu perfil no classificado e gostaria de mais informações.`}
                buttonText="Conversar pelo WhatsApp"
                size="lg"
                variant="secondary"
                fullWidth
                className="mb-3"
              />
              <button className="flex items-center justify-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <FaPhone className="mr-2" />
                Ligar agora
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 mb-20">
        {activeTab === 'anuncios' && (
          <div className="container mx-auto px-4 py-4 pb-24">
            {/* Sessão de Stories - Opção Alternativa sem "Ver todos" (apenas carrossel) */}
            {seller.stories && seller.stories.length > 0 && (
              <div className="mb-12 mt-6">
                {/* 
                  Exemplo de uso do componente StoreStoriesConfig com diferentes configurações:
                  
                  Opção 1: Com botão "Ver todos" (padrão):
                  <StoreStoriesConfig 
                    stories={seller.stories} 
                    showTitle={true}
                    showViewAll={true} 
                    sellerId={seller.id}
                  />
                  
                  Opção 2: Sem botão "Ver todos" (apenas carrossel):
                  <StoreStoriesConfig 
                    stories={seller.stories} 
                    showTitle={true}
                    showViewAll={false}
                  />
                */}
                
                {/* Usando o componente StoreStories padrão (mantendo compatibilidade) */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    Stories
                  </h2>
                  <Link href={`/empresa/${seller.id}/todos-stories`} className="text-blue-600 text-xs hover:underline">Ver todos</Link>
                </div>
                <div className="relative py-3">
                  <StoreStories stories={seller.stories} showTitle={false} />
                </div>
              </div>
            )}
            
            {/* Seção de todos os anúncios */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Todos os Anúncios <span className="text-sm text-gray-500 font-normal ml-1">({anunciosAtivos.length})</span></h2>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700">Mais recentes</button>
                  <span className="text-gray-300">|</span>
                  <button className="text-xs text-blue-600 font-medium">Ver todos</button>
                </div>
              </div>
              
              {anunciosAtivos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {anunciosAtivos.slice(0, 8).map((ad) => (
                    <div key={ad.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
                      <Link href={`/anuncio/${ad.id}`} className="block">
                        <div className="relative aspect-square">
                          {ad.images && ad.images.length > 0 && (
                            <Image
                              src={ad.images[0]}
                              alt={ad.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                          )}
                          {ad.featured && (
                            <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-sm font-medium">
                              Destaque
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1">
                            <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.price)}
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{ad.title}</h3>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center text-xs text-gray-500">
                              <FaEye className="mr-1 text-[10px]" />
                              {ad.views || 0}
                            </div>
                            <span className="text-xs text-gray-500">
                              {typeof ad.createdAt === 'string' 
                                ? new Date(ad.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) 
                                : ''}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <FaShoppingBag className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Esta empresa ainda não possui anúncios cadastrados.</p>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                    Notificar quando houver novos anúncios
                  </button>
                </div>
              )}
              
              {anunciosAtivos.length > 8 && (
                <div className="mt-4 flex justify-center">
                  <button className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 rounded-md font-medium text-sm transition-colors">
                    Carregar mais anúncios
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'sobre' && (
          <div className="container mx-auto px-4 py-6 pb-24">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {/* Cabeçalho da seção Sobre */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Sobre {seller.name}</h2>
                {seller.verified && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <FaCheck className="mr-1" /> Empresa verificada
                    </span>
                    <span className="text-gray-400 text-xs">Desde {formatDate(seller.joinDate)}</span>
                  </div>
                )}
              </div>
              
              {/* Descrição da empresa */}
              <div className="mb-8">
                <p className="text-gray-700 leading-relaxed">{seller.bio}</p>
              </div>
              
              {/* Estatísticas/Números */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-blue-600 mb-1">
                    <FaRegThumbsUp className="mx-auto text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{seller.reviewCount}</div>
                  <div className="text-sm text-gray-600">Avaliações</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-green-600 mb-1">
                    <FaStar className="mx-auto text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{seller.rating}</div>
                  <div className="text-sm text-gray-600">Média de Estrelas</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-purple-600 mb-1">
                    <FaShoppingBag className="mx-auto text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{anunciosAtivos.length}</div>
                  <div className="text-sm text-gray-600">Anúncios Ativos</div>
                </div>
                
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-amber-600 mb-1">
                    <FaCalendarAlt className="mx-auto text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.floor((new Date().getTime() - new Date(seller.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))}
                  </div>
                  <div className="text-sm text-gray-600">Meses no Site</div>
                </div>
              </div>
              
              {/* Informações da empresa em cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FaCalendarAlt className="text-blue-600 mr-2" />
                    Informações da Empresa
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="text-gray-600 mr-2 w-28">Fundada em:</span>
                      <span className="text-gray-900 font-medium">{seller.foundedIn || formatDate(seller.joinDate)}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-600 mr-2 w-28">Funcionários:</span>
                      <span className="text-gray-900 font-medium">{seller.employeeCount || "Não informado"}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-600 mr-2 w-28">Ingressou em:</span>
                      <span className="text-gray-900 font-medium">{formatDate(seller.joinDate)}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FaMapMarkerAlt className="text-blue-600 mr-2" />
                    Localização
                  </h3>
                  <div className="text-sm">
                    <address className="not-italic mb-3">
                      <p className="text-gray-900">{seller.address || seller.location}</p>
                    </address>
                    <div className="h-24 bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                      {/* Aqui poderia ser adicionado um mapa real */}
                      <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
                        <MapPin className="text-blue-600" />
                      </div>
                    </div>
                    <a 
                      href={`https://maps.google.com/?q=${seller.address || seller.location}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center w-full justify-center py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Ver no Google Maps <FaShare className="ml-1 text-xs" />
                    </a>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="text-blue-600 mr-2" />
                    Horário de Funcionamento
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-line">{seller.businessHours || "Não informado"}</p>
                    </div>
                    <p className="text-gray-600">Entre em contato pelo WhatsApp ou telefone para confirmar disponibilidade.</p>
                  </div>
                </div>
              </div>
              
              {/* Especialidades */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Award className="text-blue-600 mr-2" />
                  Especialidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {seller.categories && seller.categories.map((category: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Certificações */}
              {seller.certificates && seller.certificates.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FaCheck className="text-blue-600 mr-2" />
                    Certificações e Parcerias
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seller.certificates.map((cert: string, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full mr-3 flex-shrink-0">
                          <FaCheck />
                        </div>
                        <span className="text-gray-800">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Redes sociais */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaGlobe className="text-blue-600 mr-2" />
                  Redes Sociais e Contato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {seller.website && (
                    <a 
                      href={seller.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full mr-3 group-hover:bg-gray-300 transition-colors">
                        <FaGlobe />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Website</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">{seller.website.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </a>
                  )}
                  
                  {seller.email && (
                    <a 
                      href={`mailto:${seller.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full mr-3 group-hover:bg-red-200 transition-colors">
                        <FaEnvelope />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">E-mail</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">{seller.email}</p>
                      </div>
                    </a>
                  )}
                  
                  {seller.phone && (
                    <a 
                      href={`tel:${seller.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-3 group-hover:bg-green-200 transition-colors">
                        <FaPhone />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="text-sm font-medium">{seller.phone}</p>
                      </div>
                    </a>
                  )}
                  
                  {seller.social?.facebook && (
                    <a 
                      href={`https://facebook.com/${seller.social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full mr-3 group-hover:bg-blue-600 transition-colors">
                        <FaFacebook />
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Facebook</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">{seller.social.facebook}</p>
                      </div>
                    </a>
                  )}
                  
                  {seller.social?.instagram && (
                    <a 
                      href={`https://instagram.com/${seller.social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-lg transition-colors group mt-3 sm:mt-0"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 text-white rounded-full mr-3">
                        <FaInstagram />
                      </div>
                      <div>
                        <p className="text-xs text-pink-700">Instagram</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">@{seller.social.instagram}</p>
                      </div>
                    </a>
                  )}
                  
                  {seller.social?.twitter && (
                    <a 
                      href={`https://twitter.com/${seller.social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors group mt-3 md:mt-0"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-400 text-white rounded-full mr-3 group-hover:bg-blue-500 transition-colors">
                        <FaTwitter />
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Twitter</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">@{seller.social.twitter}</p>
                      </div>
                    </a>
                  )}
                    </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'avaliacoes' && (
          <div className="container mx-auto px-4 py-6 pb-24">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Avaliações e Comentários</h2>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center">
                    <FaStar className="mr-2" />
                    Adicionar Avaliação
                  </button>
                </div>
              </div>
              
              {/* Resumo das avaliações */}
              <div className="p-6 bg-blue-50 border-b border-blue-100">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Média e distribuição */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold text-gray-900">{seller.rating}</div>
                      <div>
                        <div className="flex mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {seller.rating >= star ? (
                                <FaStar className="text-yellow-400 text-xl" />
                              ) : seller.rating >= star - 0.5 ? (
                                <FaStarHalfAlt className="text-yellow-400 text-xl" />
                              ) : (
                                <FaStar className="text-gray-300 text-xl" />
                              )}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600">{seller.reviewCount} avaliações</p>
                      </div>
                    </div>
                    
                    {/* Distribuição por estrelas */}
                    <div className="mt-4 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        // Simular percentuais
                        const percentage = rating === 5 ? 70 : 
                                           rating === 4 ? 20 : 
                                           rating === 3 ? 5 : 
                                           rating === 2 ? 3 : 2;
                        
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 w-12">
                              <span className="text-sm text-gray-600">{rating}</span>
                              <FaStar className="text-yellow-400 text-xs" />
                            </div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 w-12 text-right">
                              {percentage}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Métricas por categoria */}
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium mb-3">Desempenho por categoria</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Atendimento</span>
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '96%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Qualidade</span>
                          <span className="text-sm font-medium">4.6</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Preço/Benefício</span>
                          <span className="text-sm font-medium">4.3</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '86%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Pontualidade</span>
                          <span className="text-sm font-medium">4.7</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filtros de Avaliações */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Filtrar por:</span>
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium hover:bg-blue-700 transition-colors">
                      Todos
                    </button>
                    <button className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                      5 Estrelas
                    </button>
                    <button className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                      4 Estrelas
                    </button>
                    <button className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                      3 Estrelas
                    </button>
                    <button className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                      2 Estrelas
                    </button>
                    <button className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                      1 Estrela
                    </button>
                  </div>
                  
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="newest">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="highest">Melhor avaliados</option>
                    <option value="lowest">Pior avaliados</option>
                  </select>
                </div>
              </div>
              
              {/* Lista de Avaliações */}
              <div className="divide-y divide-gray-100">
                {seller.reviews && seller.reviews.length > 0 ? (
                  seller.reviews.map((review: Review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Avatar do usuário */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden relative">
                            {review.userAvatar ? (
                              <Image 
                                src={review.userAvatar} 
                                alt={review.userName} 
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600">
                                {review.userName.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Conteúdo da avaliação */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{review.userName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i}>
                                      {i < review.rating ? (
                                        <FaStar className="text-yellow-400" />
                                      ) : (
                                        <FaStar className="text-gray-300" />
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.date).toLocaleDateString('pt-BR', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                          
                          <div className="mt-4 flex items-center text-sm gap-4">
                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                              <FaRegThumbsUp className="text-xs" />
                              <span>Útil</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                              <FaShare className="text-xs" />
                              <span>Compartilhar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaStar className="text-gray-400 text-xl" />
                    </div>
                    <p className="text-gray-600 mb-4">Esta empresa ainda não possui avaliações.</p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                      Seja o primeiro a avaliar
                    </button>
                  </div>
                )}
              </div>
              
              {/* Paginação */}
              {seller.reviews && seller.reviews.length > 5 && (
                <div className="p-4 border-t border-gray-200 flex justify-center">
                  <nav className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                      &laquo;
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-600 bg-blue-600 text-white">
                      1
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                      2
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                      &raquo;
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'contato' && (
          <div className="container mx-auto px-4 py-6 pb-24">
            <div className="grid grid-cols-1 gap-6">
              {/* Informações de Contato - Centralizado e expandido */}
              <div className="w-full">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100">Informações de Contato</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {seller.phone && (
                        <div className="flex items-start p-3 bg-gray-50 rounded-lg hover-lift hover:bg-gray-100 transition-all">
                          <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-3 flex-shrink-0">
                            <FaPhone />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Telefone</p>
                            <a href={`tel:${seller.phone}`} className="text-gray-900 font-medium hover:text-blue-600">{seller.phone}</a>
                            <div className="mt-2 flex gap-2">
                              <a 
                                href={`tel:${seller.phone}`} 
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                              >
                                <FaPhone className="mr-1" /> Ligar
                              </a>
                              <a 
                                href={`sms:${seller.phone}`} 
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                <FaEnvelope className="mr-1" /> SMS
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {seller.email && (
                        <div className="flex items-start p-3 bg-gray-50 rounded-lg hover-lift hover:bg-gray-100 transition-all">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0">
                            <FaEnvelope />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">E-mail</p>
                            <a href={`mailto:${seller.email}`} className="text-gray-900 font-medium break-all hover:text-blue-600">{seller.email}</a>
                            <p className="text-xs text-gray-500 mt-1">Resposta em até 24 horas</p>
                          </div>
                        </div>
                      )}
                      
                      {seller.address && (
                        <div className="flex items-start p-3 bg-gray-50 rounded-lg hover-lift hover:bg-gray-100 transition-all">
                          <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full mr-3 flex-shrink-0">
                            <FaMapMarkerAlt />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Endereço</p>
                            <p className="text-gray-900 font-medium">{seller.address}</p>
                            <a 
                              href={`https://maps.google.com/?q=${seller.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                            >
                              Ver no mapa
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {seller.businessHours && (
                        <div className="flex items-start p-3 bg-gray-50 rounded-lg hover-lift hover:bg-gray-100 transition-all">
                          <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full mr-3 flex-shrink-0">
                            <Clock />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Horário de Funcionamento</p>
                            <p className="text-gray-900 whitespace-pre-line">{seller.businessHours}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Redes sociais */}
                      <div className="mt-6">
                        <h3 className="font-medium text-gray-900 mb-4">Redes Sociais</h3>
                        <div className="flex flex-wrap gap-2">
                          {seller.website && (
                            <a 
                              href={seller.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                            >
                              <FaGlobe className="mr-2" />
                              Website
                            </a>
                          )}
                          {seller.social?.facebook && (
                            <a 
                              href={`https://facebook.com/${seller.social.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                            >
                              <FaFacebook className="mr-2" />
                              Facebook
                            </a>
                          )}
                          {seller.social?.instagram && (
                            <a 
                              href={`https://instagram.com/${seller.social.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg transition-colors"
                            >
                              <FaInstagram className="mr-2" />
                              Instagram
                            </a>
                          )}
                          {seller.social?.twitter && (
                            <a 
                              href={`https://twitter.com/${seller.social.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                            >
                              <FaTwitter className="mr-2" />
                              Twitter
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Ações rápidas */}
                      <div className="mt-6">
                        <WhatsAppButton
                          phoneNumber={seller.phone}
                          message={`Olá, vi seu perfil no classificado e gostaria de mais informações.`}
                          buttonText="Conversar pelo WhatsApp"
                          size="lg"
                          variant="secondary"
                          fullWidth
                          className="mb-3"
                        />
                        <button className="flex items-center justify-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                          <FaPhone className="mr-2" />
                          Ligar agora
                        </button>
                      </div>
                    </div>
                    
                    {/* Mapa */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Localização no Mapa</h3>
                      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center p-4">
                          <MapPin className="mx-auto text-blue-600 mb-2" size={24} />
                          <p className="text-gray-600 mb-2">Visualize a localização exata no mapa</p>
                          <a 
                            href={`https://maps.google.com/?q=${seller.address || seller.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            Abrir no Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Botão de WhatsApp flutuante */}
      <div className="fixed bottom-6 right-6 z-30">
        <WhatsAppButton
          phoneNumber={seller.phone}
          message={`Olá, vi seu perfil no classificado e gostaria de mais informações.`}
          iconOnly
          size="lg"
          variant="secondary"
          className="rounded-full shadow-lg"
        />
      </div>
      
      {/* Modal de Informações de Contato */}
      {showContactInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Informações de Contato</h3>
              <button 
                onClick={() => setShowContactInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              {seller.phone && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FaPhone className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <a href={`tel:${seller.phone}`} className="text-blue-600 font-medium">{seller.phone}</a>
                  </div>
                </div>
              )}
              
              {seller.email && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FaEnvelope className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <a href={`mailto:${seller.email}`} className="text-blue-600 font-medium">{seller.email}</a>
                  </div>
                </div>
              )}
              
              {seller.website && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FaGlobe className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a href={seller.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium">{seller.website}</a>
                  </div>
                </div>
              )}
              
              {seller.address && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FaMapMarkerAlt className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="text-gray-900">{seller.address}</p>
                    <a 
                      href={`https://maps.google.com/?q=${seller.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                    >
                      Ver no mapa
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowContactInfo(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 