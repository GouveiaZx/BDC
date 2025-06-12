import React from 'react';
import AdCard from './components/AdCard';
import Link from 'next/link';
import Image from 'next/image';
import { FaCar, FaHome, FaLaptop, FaCouch, FaTools, FaBriefcase } from 'react-icons/fa';
import CompanyCard from './components/CompanyCard';
import StoreStories from './components/StoreStories';
import BusinessesSection from './components/BusinessesSection';
import { getSupabaseAdminClient } from './lib/supabase';

// Definir opções de cache para a página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função para buscar destaques aprovados usando consulta direta
async function getApprovedHighlights() {
  try {
    const adminClient = getSupabaseAdminClient();
    
    // Buscar destaques aprovados diretamente da tabela highlights (não destaques)
    const { data: highlights, error } = await adminClient
      .from('highlights')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString()) // Não expirados
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Erro ao buscar highlights ativos:', error);
      return [];
    }
    
    console.log(`[Home] Encontrados ${highlights?.length || 0} highlights aprovados`);
    
    // Se não há highlights, retornar array vazio
    if (!highlights || highlights.length === 0) {
      return [];
    }
    
    // Buscar dados dos usuários para os highlights
    const userIds = highlights.map(h => h.user_id).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(userIds));
    
    let usersMap: Record<string, any> = {};
    
    if (uniqueUserIds.length > 0) {
      // Buscar dados dos usuários
      const { data: users, error: usersError } = await adminClient
        .from('users')
        .select('id, name, email, profile_image_url')
        .in('id', uniqueUserIds);
      
      if (!usersError && users) {
        users.forEach(user => {
          usersMap[user.id] = {
            name: user.name || 'Usuário',
            avatar: user.profile_image_url || '/logo.png'
          };
        });
      }
    }
    
    // Converter para o formato esperado pelo componente StoreStories
    return highlights.map(highlight => {
      const user = usersMap[highlight.user_id] || {};
      const isAdmin = highlight.user_id === '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18';
      
      return {
        id: highlight.id,
        title: highlight.title || 'Destaque',
        description: highlight.description || '',
        image: highlight.image_url || highlight.media_url || '/images/placeholder.jpg',
        createdAt: highlight.created_at,
        isAdmin: isAdmin,
        userId: highlight.user_id,
        userName: user.name || (isAdmin ? 'BuscaAquiBdC' : 'Anunciante'),
        userAvatar: user.avatar || '/logo.png'
      };
    });
  } catch (error) {
    console.error('Erro ao processar highlights:', error);
    return [];
  }
}

// Função assíncrona para buscar anúncios usando consulta direta
async function getRecentApprovedAds() {
  try {
    const adminClient = getSupabaseAdminClient();
    
    // Tentar usar função RPC primeiro, se falhar usar consulta direta
    let ads, error;
    
    // Tentar função RPC primeiro
    try {
      const rpcResult = await adminClient
      .rpc('get_recent_advertisements_with_user', { limit_count: 8 });
      ads = rpcResult.data;
      error = rpcResult.error;
    } catch (rpcError) {
      console.warn('Função RPC não encontrada, usando consulta direta:', rpcError);
      
      // Fallback: consulta direta
      const directResult = await adminClient
        .from('ads')
        .select(`
          *,
          profiles!inner(name, avatar_url),
          users!inner(name, email)
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8);
      
      ads = directResult.data;
      error = directResult.error;
    }
    
    if (error) {
      console.error('Erro ao buscar anúncios aprovados:', error);
      return [];
    }
    
    console.log(`[Home] Encontrados ${ads?.length || 0} anúncios aprovados`);
    
    // Mapear os anúncios para o formato esperado pelo componente AdCard
    return (ads || []).map(ad => {
      // Extrair dados do usuário das diferentes possíveis estruturas
      let userName = 'Anunciante';
      let userAvatar = '/logo.png';
      
      // Se veio da RPC, usar user_name e user_profile_image_url
      if (ad.user_name) {
        userName = ad.user_name;
        userAvatar = ad.user_profile_image_url || '/logo.png';
      }
      // Se veio da consulta direta, usar dados dos joins
      else if (ad.profiles?.name) {
        userName = ad.profiles.name;
        userAvatar = ad.profiles.avatar_url || '/logo.png';
      }
      else if (ad.users?.name) {
        userName = ad.users.name;
        userAvatar = ad.users.avatar_url || '/logo.png';
      }
      
      return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      subCategory: ad.sub_category,
      images: ad.images || [],
      location: ad.location,
      zipCode: ad.zip_code,
      city: ad.city,
      state: ad.state,
      isFeatured: ad.is_featured || false,
      createdAt: ad.created_at,
      views: ad.view_count || 0,
      clicks: ad.contact_count || 0,
      userId: ad.user_id,
        userName,
        userAvatar,
      whatsapp: ad.whatsapp,
      phone: ad.phone
      };
    });
  } catch (error) {
    console.error('Erro ao processar busca de anúncios:', error);
    return [];
  }
}

export default async function Home() {
  // Buscar anúncios aprovados e recentes usando a função otimizada
  const recentAds = await getRecentApprovedAds();
  
  // Buscar destaques aprovados usando a função otimizada
  const highlights = await getApprovedHighlights();
  
  // Se não houver anúncios ou ocorrer um erro, exibir mensagem
  const hasAds = recentAds && recentAds.length > 0;
  
  console.log(`Carregados ${recentAds.length} anúncios do banco de dados`);
  console.log(`Carregados ${highlights.length} destaques do banco de dados`);

  // Adicionar script para garantir recarregamento dos dados
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Quando a página carrega, verificar se veio de outra página interna
            if (document.referrer && document.referrer.includes(window.location.host)) {
              // Se sim, forçar o recarregamento da página uma vez
              const hasReloaded = sessionStorage.getItem('pageReloaded');
              if (!hasReloaded) {
                sessionStorage.setItem('pageReloaded', 'true');
                window.location.reload();
              } else {
                // Limpar a flag após o recarregamento
                sessionStorage.removeItem('pageReloaded');
              }
            }
          `,
        }}
      />
      <div className="container mx-auto px-4 py-10 mt-12">
        {/* Destaques (Stories) */}
        <div className="mt-8 mb-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary uppercase drop-shadow-sm">DESTAQUES</h2>
          </div>
          <StoreStories stories={highlights} showTitle={true} />
        </div>
      
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
                <FaCar className="text-2xl text-white" />
              </div>
              <span className="text-sm text-white font-medium">Carros</span>
            </Link>
            
            <Link href="/categoria/imoveis" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <FaHome className="text-2xl text-white" />
              </div>
              <span className="text-sm text-white font-medium">Imóveis</span>
            </Link>
            
            <Link href="/categoria/eletronicos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <FaLaptop className="text-2xl text-white" />
              </div>
              <span className="text-sm text-white font-medium">Eletrônicos</span>
            </Link>
            
            <Link href="/categoria/moveis" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <FaCouch className="text-2xl text-white" />
              </div>
              <span className="text-sm text-white font-medium">Móveis</span>
            </Link>
            
            <Link href="/categoria/servicos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <FaTools className="text-2xl text-white" />
              </div>
              <span className="text-sm text-white font-medium">Serviços</span>
            </Link>
            
            <Link href="/categoria/empregos" className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors duration-300">
              <div className="bg-primary/20 rounded-full p-4 mb-3">
                <FaBriefcase className="text-2xl text-white" />
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