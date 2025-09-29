"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaArrowLeft, FaCheck, FaRedo, FaCalendarAlt, 
  FaInfoCircle, FaExclamationCircle
} from 'react-icons/fa';
import { renewAd, calculateExpirationDate } from '../../../lib/adExpirationHelper';

export default function RenovarAnuncio() {
  const params = useParams();
  const router = useRouter();
  const anuncioId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [renovating, setRenovating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [anuncio, setAnuncio] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Carregar dados do anúncio
  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        
        // Em um ambiente real, aqui faria uma chamada à API
        // const response = await fetch(`/api/ads/${anuncioId}`);
        // const data = await response.json();
        
        // Simulação para testes - buscar de mockAds com um timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dados mockados para testes
        const mockAd = {
          id: anuncioId,
          title: 'Honda Civic EXL 2020',
          description: 'Honda Civic EXL 2020, completo, com apenas 30.000 km rodados, único dono.',
          category: 'Veículos',
          subcategory: 'Carros',
          price: 'R$ 125.900',
          image: '/images/car-thumb.jpg',
          views: 501,
          created: '2023-11-10',
          expires: '2023-11-30', // Data propositalmente expirada para testes
          status: 'expired'
        };
        
        setAnuncio(mockAd);
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
        setError('Não foi possível carregar os dados do anúncio. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAd();
  }, [anuncioId]);
  
  // Função para renovar o anúncio
  const handleRenovarAnuncio = async () => {
    try {
      setRenovating(true);
      
      // Em um ambiente real, aqui faria uma chamada à API
      // const response = await fetch(`/api/ads/${anuncioId}/renew`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });
      
      // Simular um atraso de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar o anúncio local para mostrar sucesso
      const today = new Date();
      const newExpiryDate = new Date();
      newExpiryDate.setDate(today.getDate() + 90);
      
      setAnuncio({
        ...anuncio,
        expires: newExpiryDate.toISOString().split('T')[0],
        status: 'active'
      });
      
      setSuccess(true);
    } catch (error) {
      console.error('Erro ao renovar anúncio:', error);
      setError('Ocorreu um erro ao renovar o anúncio. Tente novamente mais tarde.');
    } finally {
      setRenovating(false);
    }
  };
  
  // Função para voltar para a lista de anúncios
  const handleVoltar = () => {
    router.push('/painel-anunciante/meus-anuncios');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Carregando informações do anúncio...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationCircle className="text-red-500 text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro</h1>
            <p className="text-gray-600">{error}</p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleVoltar}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              <FaArrowLeft className="inline mr-2" /> Voltar para meus anúncios
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!anuncio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaExclamationCircle className="text-yellow-500 text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Anúncio não encontrado</h1>
            <p className="text-gray-600">O anúncio solicitado não foi encontrado ou não está mais disponível.</p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleVoltar}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              <FaArrowLeft className="inline mr-2" /> Voltar para meus anúncios
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Se a operação foi bem-sucedida, mostrar tela de sucesso
  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Anúncio renovado com sucesso!</h1>
            <p className="text-gray-600">
              Seu anúncio agora está ativo novamente por mais 90 dias.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <FaInfoCircle className="text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-800 mb-1">Detalhes da renovação</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li><strong>Anúncio:</strong> {anuncio.title}</li>
                  <li><strong>Nova data de expiração:</strong> {anuncio.expires}</li>
                  <li><strong>Status:</strong> Ativo</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/painel-anunciante/meus-anuncios" 
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-center"
            >
              Ver meus anúncios
            </Link>
            <Link 
              href={`/anuncios/${anuncio.id}`} 
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 text-center"
            >
              Ver anúncio
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Tela padrão para renovação
  const expiryDate = anuncio.expires ? new Date(anuncio.expires) : null;
  const today = new Date();
  const isExpired = expiryDate ? expiryDate < today : false;
  
  // Calcular nova data de expiração (90 dias a partir de hoje)
  const newExpiryDate = new Date();
  newExpiryDate.setDate(today.getDate() + 90);
  const formattedNewExpiryDate = newExpiryDate.toLocaleDateString('pt-BR');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/painel-anunciante/meus-anuncios" className="text-blue-600 hover:text-blue-800 flex items-center">
          <FaArrowLeft className="mr-2" /> Voltar para meus anúncios
        </Link>
      </div>
      
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Renovar Anúncio</h1>
        
        <div className="flex items-start mb-6">
          <div className="h-24 w-24 flex-shrink-0 rounded overflow-hidden border border-gray-200 mr-4">
            <img 
              src={anuncio.image} 
              alt={anuncio.title} 
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{anuncio.title}</h2>
            <p className="text-sm text-gray-600 mb-1">{anuncio.category} • {anuncio.subcategory}</p>
            <p className="text-green-600 font-medium">{anuncio.price}</p>
            
            <div className="mt-2">
              {isExpired ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                  <FaExclamationCircle className="mr-1" /> Expirado em {expiryDate?.toLocaleDateString('pt-BR')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <FaCalendarAlt className="mr-1" /> Expira em {expiryDate?.toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Renovação de anúncio</h3>
              <p className="text-sm text-gray-600">
                Ao renovar este anúncio, ele ficará ativo por mais 90 dias a partir de hoje, até <strong>{formattedNewExpiryDate}</strong>.
                {!isExpired && ' A data atual de expiração será substituída pela nova data.'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleRenovarAnuncio}
            disabled={renovating}
            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {renovating ? (
              <>
                <div className="mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Renovando...
              </>
            ) : (
              <>
                <FaRedo className="mr-2" /> Renovar por 90 dias
              </>
            )}
          </button>
          
          <button
            onClick={handleVoltar}
            disabled={renovating}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
} 