'use client';

import { useState, useEffect } from 'react';

export default function TesteAPIs() {
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [destaques, setDestaques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const testarAPIs = async () => {
      setLoading(true);
      
      // Testar API de anúncios
      try {
        const responseAds = await fetch('/api/ads');
        const dataAds = await responseAds.json();
        setAnuncios(dataAds.ads || []);
      } catch (error) {
        setErrors(prev => ({ ...prev, ads: error }));
      }

      // Testar API de destaques
      try {
        const responseDestaques = await fetch('/api/destaques');
        const dataDestaques = await responseDestaques.json();
        setDestaques(dataDestaques.destaques || []);
      } catch (error) {
        setErrors(prev => ({ ...prev, destaques: error }));
      }

      setLoading(false);
    };

    testarAPIs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Teste das APIs - BDC</h1>
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste das APIs - BDC</h1>
        
        {/* Seção de Anúncios */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">API de Anúncios</h2>
          {errors.ads ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Erro: {errors.ads.message}
            </div>
          ) : (
            <div>
              <p className="mb-4">Total de anúncios: {anuncios.length}</p>
              <div className="grid gap-4">
                {anuncios.map((anuncio, index) => (
                  <div key={anuncio.id} className="border border-gray-200 rounded p-4">
                    <h3 className="font-semibold">{anuncio.title}</h3>
                    <p className="text-gray-600">{anuncio.category} - {anuncio.price}</p>
                    <p className="text-sm text-gray-500">
                      Status: {anuncio.moderationStatus} | Views: {anuncio.views} | Clicks: {anuncio.clicks}
                    </p>
                    <p className="text-sm">{anuncio.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seção de Destaques */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">API de Destaques</h2>
          {errors.destaques ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Erro: {errors.destaques.message}
            </div>
          ) : (
            <div>
              <p className="mb-4">Total de destaques: {destaques.length}</p>
              <div className="grid gap-4">
                {destaques.map((destaque, index) => (
                  <div key={destaque.id} className="border border-gray-200 rounded p-4">
                    <h3 className="font-semibold">{destaque.title}</h3>
                    <p className="text-gray-600">Por: {destaque.userName}</p>
                    <p className="text-sm text-gray-500">
                      Status: {destaque.moderationStatus} | Views: {destaque.views} | Prioridade: {destaque.priority}
                    </p>
                    <p className="text-sm">{destaque.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botão para voltar */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Voltar para Home
          </a>
        </div>
      </div>
    </div>
  );
} 