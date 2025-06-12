"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaEye, FaPlay } from 'react-icons/fa';
import StoreStories from '../../../components/StoreStories';

interface Story {
  id: string;
  title: string;
  description?: string;
  image: string;
  createdAt: string;
}

export default function TodosStoriesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    // Em um ambiente real, buscaríamos os dados da API
    // Simulando uma resposta para demonstração
    const mockSeller = {
      id: parseInt(id),
      name: "Tech Solutions Ltda.",
      avatar: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150&q=80",
      stories: [
        {
          id: "1",
          title: 'Nova linha de produtos Apple',
          image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Confira os lançamentos da Apple que acabaram de chegar em nossa loja!',
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          title: 'Promoção de Notebooks',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Até 30% de desconto em notebooks selecionados. Promoção por tempo limitado!',
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          title: 'Workshop gratuito',
          image: 'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Workshop sobre produtividade com tecnologia. Inscreva-se já!',
          createdAt: new Date().toISOString()
        },
        {
          id: "4",
          title: 'Dicas de tecnologia',
          image: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Confira nossas dicas para aumentar a vida útil da bateria do seu dispositivo.',
          createdAt: new Date().toISOString()
        },
        // Adicionando mais stories para demonstrar a grade
        {
          id: "5",
          title: 'Novidades em Smart Home',
          image: 'https://images.unsplash.com/photo-1558002038-1055e2b692c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Automatize sua casa com dispositivos inteligentes e torne sua vida mais prática.',
          createdAt: new Date().toISOString()
        },
        {
          id: "6",
          title: 'Curso de desenvolvimento',
          image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
          description: 'Aprenda as mais recentes tecnologias de desenvolvimento web conosco.',
          createdAt: new Date().toISOString()
        },
      ]
    };
    
    setSeller(mockSeller);
    setStories(mockSeller.stories);
    setLoading(false);
  }, [id]);

  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  const openStory = (story: Story) => {
    setViewingStory(story);
  };

  const closeStory = () => {
    setViewingStory(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-20 w-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 p-8 rounded-lg text-center shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Empresa não encontrada</h1>
          <p className="text-gray-600 mb-6">A empresa que você está procurando não existe ou foi removida.</p>
          <Link href="/" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className="mr-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>
        <div className="flex items-center">
          <div className="relative w-12 h-12 mr-3">
            <Image 
              src={seller.avatar} 
              alt={seller.name}
              fill
              className="rounded-full object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{seller.name}</h1>
            <p className="text-sm text-gray-500">Todos os destaques</p>
          </div>
        </div>
      </div>

      {/* Grade de Stories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="cursor-pointer group" 
            onClick={() => openStory(story)}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary mb-2">
              <Image 
                src={story.image} 
                alt={story.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary rounded-full p-2">
                  <FaPlay className="text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <h3 className="text-white text-sm font-medium line-clamp-1">
                  {story.title}
                </h3>
              </div>
            </div>
            <div className="px-1">
              <p className="text-xs text-gray-500">
                {new Date(story.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })}
              </p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <FaEye className="mr-1" />
                <span>{Math.floor(Math.random() * 100) + 10}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visualizador de Stories */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={closeStory}
              className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="max-w-2xl w-full max-h-[90vh] bg-black">
            <div className="relative aspect-video w-full">
              <Image
                src={viewingStory.image}
                alt={viewingStory.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            </div>
            
            <div className="p-4 bg-black">
              <h2 className="text-white text-xl font-bold mb-2">{viewingStory.title}</h2>
              {viewingStory.description && (
                <p className="text-gray-300 text-sm">{viewingStory.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-3">
                {new Date(viewingStory.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 