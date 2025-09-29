"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedAds, getRecentAds } from '../../utils/mockData';
import { createClient } from '@supabase/supabase-js';
import AdCard from '../../components/AdCard';
import { FaMapMarkerAlt, FaCalendarAlt, FaEye, FaShareAlt, FaHeart, FaRegHeart, FaWhatsapp, FaPhone } from 'react-icons/fa';
import WhatsAppButton from '../../components/WhatsAppButton';
import Avatar from '../../components/Avatar';

export default function AnuncioDetalhe() {
  const params = useParams();
  const id = params.id as string;
  
  const [anuncio, setAnuncio] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [anunciosSimilares, setAnunciosSimilares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAnuncio = async () => {
    setLoading(true);
      
      try {
        // Inicializar cliente do Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Buscar anúncio por ID
        const { data: anuncioData, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('id', id)
          .single();
    
        if (error || !anuncioData) {
          console.error('Erro ao buscar anúncio:', error);
          setLoading(false);
          return;
        }
        
        setAnuncio(anuncioData);
        if (anuncioData.images && anuncioData.images.length > 0) {
          setSelectedImage(anuncioData.images[0]);
        }
        
        // Incrementar contador de visualizações
        await supabase
          .from('advertisements')
          .update({ views: (anuncioData.views || 0) + 1 })
          .eq('id', id);
      
      // Buscar anúncios similares (mesma categoria)
        const { data: similaresData } = await supabase
          .from('advertisements')
          .select('*')
          .eq('category', anuncioData.category)
          .neq('id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
      
        if (similaresData) {
          setAnunciosSimilares(similaresData);
    }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
      setLoading(false);
      }
    };
    
    if (id) {
      fetchAnuncio();
    }
  }, [id]);
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const shareAnuncio = () => {
    if (navigator.share) {
      navigator.share({
        title: anuncio.title,
        text: `Confira este anúncio: ${anuncio.title}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      // Fallback para navegadores que não suportam a API Web Share
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };
  
  // Função para limpar URLs de imagens com aspas extras
  const cleanImageUrl = (url: string): string => {
    if (!url) return '/images/no-image.png';
    
    // Limpar aspas extras e caracteres de escape
    let cleanUrl = url;
    if (typeof url === 'string') {
      // Remover aspas duplas extras e caracteres de escape
      cleanUrl = url.replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, '');
      
      // Se após a limpeza ainda tiver aspas, fazer nova tentativa
      if (cleanUrl.includes('\"')) {
        cleanUrl = cleanUrl.replace(/\"/g, '');
      }
    }
    
    return cleanUrl;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-20 w-20 bg-gray-700 rounded-full mb-4"></div>
          <div className="h-6 w-40 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!anuncio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Anúncio não encontrado</h1>
          <p className="text-gray-400 mb-6">O anúncio que você está procurando não está disponível ou foi removido.</p>
          <Link href="/" className="btn btn-primary">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Caminho de navegação (breadcrumb) */}
      <div className="mb-6 text-sm">
        <Link href="/" className="text-gray-400 hover:text-primary">Início</Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link href={`/categoria/${anuncio.category.toLowerCase()}`} className="text-gray-400 hover:text-primary">
          {anuncio.category}
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-300">{anuncio.title}</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Imagens e detalhes */}
        <div className="lg:col-span-2">
          {/* Galeria de imagens */}
          <div className="mb-8">
            <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={cleanImageUrl(selectedImage)}
                alt={anuncio.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                style={{ objectFit: 'contain' }}
                className="bg-gray-900"
              />
            </div>
            
            <div className="mt-4 grid grid-cols-5 gap-2">
              {anuncio.images.map((image: string, index: number) => (
                <div 
                  key={index}
                  className={`relative h-20 cursor-pointer rounded-md overflow-hidden border-2 ${
                    selectedImage === image ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={cleanImageUrl(image)}
                    alt={`Imagem ${index + 1}`}
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Detalhes do anúncio */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{anuncio.title}</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {formatPrice(anuncio.price)}
            </h2>
            
            <div className="flex flex-wrap gap-4 mb-6 text-gray-300">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1 text-gray-400" />
                <span>{anuncio.city}, {anuncio.state}</span>
              </div>
              <div className="flex items-center">
                <FaCalendarAlt className="mr-1 text-gray-400" />
                <span>Publicado em {formatDate(anuncio.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <FaEye className="mr-1 text-gray-400" />
                <span>{anuncio.views} visualizações</span>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-6 mt-6">
              <h3 className="text-xl font-semibold mb-4">Descrição</h3>
              <p className="text-gray-300 whitespace-pre-line">
                {anuncio.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Coluna Direita - Informações do vendedor e ações */}
        <div className="lg:col-span-1">
          {/* Card do vendedor */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Avatar
                src={anuncio.userAvatar}
                alt={anuncio.userName}
                size={60}
                fallbackName={anuncio.userName}
                className="mr-4"
              />
              <div>
                <h3 className="text-xl font-semibold">{anuncio.userName}</h3>
                <p className="text-gray-400">Membro desde {formatDate(new Date(2022, 5, 15))}</p>
              </div>
            </div>
            
            {/* Ações */}
            <div className="space-y-3">
              <WhatsAppButton
                phoneNumber={anuncio.whatsapp}
                message={`Olá! Vi seu anúncio "${anuncio.title}" no site e gostaria de mais informações.`}
                buttonText="Contato via WhatsApp"
                variant="secondary"
                size="lg"
                fullWidth
                className="gap-2"
              />
              
              <a 
                href={`tel:${anuncio.whatsapp.replace(/\D/g, '')}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white font-medium py-3 px-4 rounded-lg"
              >
                <FaPhone size={16} />
                <span>Ligar</span>
              </a>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={toggleFavorite}
                  className="flex items-center justify-center gap-2 flex-1 bg-gray-700 hover:bg-gray-600 transition-colors duration-300 text-white font-medium py-3 px-4 rounded-lg"
                >
                  {isFavorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                  <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
                </button>
                
                <button 
                  onClick={shareAnuncio}
                  className="flex items-center justify-center gap-2 flex-1 bg-gray-700 hover:bg-gray-600 transition-colors duration-300 text-white font-medium py-3 px-4 rounded-lg"
                >
                  <FaShareAlt />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Informações de segurança */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Dicas de segurança</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Nunca faça pagamentos antes de verificar o produto</li>
              <li>• Encontre o vendedor em locais públicos e seguros</li>
              <li>• Verifique o produto antes de concluir a compra</li>
              <li>• Desconfie de preços muito abaixo do mercado</li>
            </ul>
            <Link href="/dicas-seguranca" className="text-primary text-sm block mt-3 hover:underline">
              Ver mais dicas de segurança
            </Link>
          </div>
        </div>
      </div>
      
      {/* Anúncios similares */}
      {anunciosSimilares.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">Anúncios similares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {anunciosSimilares.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}