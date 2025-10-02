import React from 'react';
import AdCard from './components/AdCard';
import Link from 'next/link';
import Image from 'next/image';
import StoreStories from './components/StoreStories';
import BusinessesSection from './components/BusinessesSection';

// Definir opções de cache para a página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função para buscar destaques aprovados via API interna
async function getApprovedHighlights() {
  try {
    // Usar URL absoluta para server-side rendering
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('🔍 [getApprovedHighlights] Fazendo requisição para:', `${baseUrl}/api/destaques`);

    const response = await fetch(`${baseUrl}/api/destaques`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('❌ [getApprovedHighlights] Erro na API de highlights:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('📊 [getApprovedHighlights] Dados recebidos da API:', {
      success: data.success,
      total: data.total,
      highlightsLength: data.highlights ? data.highlights.length : 0,
      highlights: data.highlights
    });
    
    // Verificar se data existe e tem a estrutura esperada
    if (!data || typeof data !== 'object') {
      console.error('❌ [getApprovedHighlights] Resposta da API inválida:', data);
      return [];
    }
    
    const highlights = data.highlights || [];
    
    if (!Array.isArray(highlights)) {
      console.error('❌ [getApprovedHighlights] Highlights não é um array:', highlights);
      return [];
    }
    
    if (highlights.length === 0) {
      console.log('⚠️ [getApprovedHighlights] Nenhum destaque encontrado');
      return [];
    }
    
    console.log('✅ [getApprovedHighlights] Estrutura de dados válida, processando highlights...');
    
    const processedHighlights = highlights.map((highlight: any) => {
      // Verificar se highlight existe e tem propriedades básicas
      if (!highlight || typeof highlight !== 'object') {
        console.warn('⚠️ [getApprovedHighlights] Highlight inválido:', highlight);
        return null;
      }
      
      return {
        id: highlight.id || Math.random().toString(36),
        title: highlight.title || 'Destaque',
        description: highlight.description || '',
        image: highlight.image_url || highlight.media_url || '/images/placeholder.jpg',
        image_url: highlight.image_url,
        media_url: highlight.media_url,
        createdAt: highlight.created_at || new Date().toISOString(),
        isAdmin: highlight.isAdmin || highlight.is_admin_post || highlight.user_id === '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18',
        userId: highlight.user_id,
        userName: highlight.userName || highlight.user_name || 'Anunciante',
        userAvatar: highlight.userAvatar || highlight.user_avatar || '/logo.png',
        user_name: highlight.user_name,
        user_avatar: highlight.user_avatar
      };
    }).filter(Boolean); // Remove itens null/undefined
    
    console.log('🔄 [getApprovedHighlights] Highlights processados:', {
      total: processedHighlights.length,
      highlights: processedHighlights
    });
    
    return processedHighlights;
  } catch (error) {
    console.error('❌ [getApprovedHighlights] Erro ao buscar highlights:', error);
    // Retornar array vazio em caso de erro para não quebrar a página
    return [];
  }
}

// Função para buscar anúncios aprovados via API interna
async function getRecentApprovedAds() {
  try {
    // Usar URL absoluta para evitar problemas de parsing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/ads?limit=8&status=active`;

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Erro na API de ads:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Verificar se data existe e tem a estrutura esperada
    if (!data || typeof data !== 'object') {
      console.error('Resposta da API de ads inválida:', data);
      return [];
    }
    
    const ads = data.ads || data.data || [];
    
    if (!Array.isArray(ads)) {
      console.error('Ads não é um array:', ads);
      return [];
    }
    
    console.log(`[Home] Encontrados ${ads.length} anúncios aprovados`);
    
    return ads.map((ad: any) => {
      // Verificar se ad existe e tem propriedades básicas
      if (!ad || typeof ad !== 'object') {
        console.warn('Anúncio inválido:', ad);
        return null;
      }
      
      return {
        id: ad.id || Math.random().toString(36),
        title: ad.title || 'Anúncio',
        description: ad.description || '',
        price: ad.price || 0,
        category: ad.category || 'Outros',
        subCategory: ad.sub_category || '',
        images: Array.isArray(ad.images) ? ad.images : [],
        location: ad.location || '',
        zipCode: ad.zip_code || '',
        city: ad.city || '',
        state: ad.state || '',
        isFeatured: ad.is_featured || false,
        createdAt: ad.created_at || new Date().toISOString(),
        views: ad.view_count || 0,
        clicks: ad.contact_count || 0,
        userId: ad.user_id,
        userName: ad.userName || 'Anunciante',
        userAvatar: ad.userAvatar || '/logo.png',
        whatsapp: ad.whatsapp || '',
        phone: ad.phone || ''
      };
    }).filter(Boolean); // Remove itens null/undefined
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    // Retornar array vazio em caso de erro para não quebrar a página
    return [];
  }
}

export default async function Home() {
  console.log('🏠 [Home] Iniciando carregamento da página principal...');
  
  // Buscar anúncios e highlights via APIs internas com tratamento de erro
  let recentAds: any[] = [];
  let highlights: any[] = [];
  
  try {
    const [adsResult, highlightsResult] = await Promise.allSettled([
      getRecentApprovedAds(),
      getApprovedHighlights()
    ]);
    
    // Verificar resultado dos anúncios
    if (adsResult.status === 'fulfilled' && Array.isArray(adsResult.value)) {
      recentAds = adsResult.value;
      console.log('✅ [Home] Anúncios carregados:', recentAds.length);
    } else {
      console.error('❌ [Home] Erro ao carregar anúncios:', adsResult.status === 'rejected' ? adsResult.reason : 'Resultado inválido');
    }
    
    // Verificar resultado dos highlights
    if (highlightsResult.status === 'fulfilled' && Array.isArray(highlightsResult.value)) {
      highlights = highlightsResult.value;
      console.log('✅ [Home] Highlights carregados:', highlights.length, highlights);
    } else {
      console.error('❌ [Home] Erro ao carregar highlights:', highlightsResult.status === 'rejected' ? highlightsResult.reason : 'Resultado inválido');
    }
    
    // Log para debug
    console.log('📊 [Home] Dados carregados:', { 
      adsCount: recentAds.length, 
      highlightsCount: highlights.length
    });

    if (!recentAds || recentAds.length === 0) {
      console.log('⚠️ [Home] Nenhum anúncio encontrado');
    }

    if (!highlights || highlights.length === 0) {
      console.log('⚠️ [Home] Nenhum destaque encontrado - StoreStories não será exibido');
    } else {
      console.log('✅ [Home] Highlights encontrados - StoreStories será renderizado');
    }
  } catch (error) {
    console.error('❌ [Home] Erro geral ao carregar dados da página:', error);
    // Continuar com arrays vazios para não quebrar a página
  }
  
  const hasAds = recentAds && recentAds.length > 0;
  


  return (
    <>
      <div className="container mx-auto px-4 py-10 mt-12">
        {/* Destaques (Stories) - só exibe se houver highlights */}
        {highlights && highlights.length > 0 && (
          <div className="mt-8 mb-10">
            <StoreStories stories={highlights} showTitle={true} />
          </div>
        )}
      
        {/* Classificados - Perfis em Destaque */}
        <div className="mb-12 bg-primary rounded-xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white uppercase drop-shadow-sm">CLASSIFICADOS</h2>
            <Link href="/classificados" className="text-white hover:text-gray-200 font-medium">
              Ver todos
            </Link>
          </div>
          
          <BusinessesSection limit={3} />
        </div>
        
        {/* Anúncios Recentes */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-primary">Anúncios Recentes</h2>
            <Link href="/anuncios" className="text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          
          {hasAds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentAds.slice(0, 4).map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
          ) : (
            <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-600">
              Nenhum anúncio disponível no momento. Seja o primeiro a publicar!
            </div>
          )}
        </div>
        
        {/* Categorias Populares */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-primary mb-6">Categorias Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <Link href="/categoria/carros" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">🚗</span>
              </div>
              <span className="text-sm text-white font-medium">Carros</span>
            </Link>
            
            <Link href="/categoria/imoveis" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">🏠</span>
              </div>
              <span className="text-sm text-white font-medium">Imóveis</span>
            </Link>
            
            <Link href="/categoria/eletronicos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">💻</span>
              </div>
              <span className="text-sm text-white font-medium">Eletrônicos</span>
            </Link>
            
            <Link href="/categoria/moveis" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">🛋️</span>
              </div>
              <span className="text-sm text-white font-medium">Móveis</span>
            </Link>
            
            <Link href="/categoria/servicos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">🔧</span>
              </div>
              <span className="text-sm text-white font-medium">Serviços</span>
            </Link>
            
            <Link href="/categoria/empregos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <span className="text-2xl text-white">💼</span>
              </div>
              <span className="text-sm text-white font-medium">Empregos</span>
            </Link>
          </div>
        </div>
        
        {/* Destaque seus anúncios */}
        <div className="bg-green-400 rounded-xl p-6 mb-12 shadow-lg">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Destaque seus anúncios
            </h3>
            <p className="text-gray-800 mb-4">
              Assine um de nossos planos e tenha mais Anuncios e Destaques para maior visibilidade.
            </p>
            <Link href="/planos" className="inline-block bg-black text-white font-medium py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors duration-300">
              Conheça nossos planos
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}