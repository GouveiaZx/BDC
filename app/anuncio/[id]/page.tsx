"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaEye, 
  FaCalendarAlt, FaShare, FaRegHeart, FaHeart, 
  FaRegFlag, FaArrowLeft
} from 'react-icons/fa';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Ad, UserRole, SubscriptionPlan } from '../../models/types';
import WhatsAppButton from '../../components/WhatsAppButton';
import { getSupabaseClient } from '../../lib/supabase';
import ReportButton from '../../components/ReportButton';
import { cleanImageUrl } from '../../lib/utils';

export default function AnuncioDetalhes() {
  const params = useParams();
  const id = params.id as string;
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    const fetchAdDetails = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Buscar o anúncio pelo ID do banco de dados com dados do usuário usando RPC
        const { data: adData, error: adError } = await supabase
          .rpc('get_advertisement_with_user', {
            ad_id: id
          })
          .single();
        
        if (adError) {
          console.error('Erro ao buscar detalhes do anúncio:', adError);
          throw new Error('Não foi possível carregar os detalhes do anúncio');
        }
        
        if (!adData) {
          throw new Error('Anúncio não encontrado');
        }
        
        // Dados retornados diretamente da função RPC
        const adInfo = adData as any;
        
        // Limpar as URLs de imagens para evitar problemas com aspas extras
        const cleanImages = Array.isArray(adInfo.images) 
          ? adInfo.images.map((img: string | null) => cleanImageUrl(img))
          : [];
        
        // Dados do usuário vêm diretamente da RPC
        const userAvatarCleaned = cleanImageUrl(adInfo.user_profile_image_url);
        const userName = adInfo.user_name || 'Anunciante';
        
        // Mapear os dados do banco para o formato esperado pela interface
        const mappedAd: Ad = {
          id: adInfo.id,
          title: adInfo.title,
          description: adInfo.description,
          price: parseFloat(adInfo.price) || 0,
          images: cleanImages.filter(img => img), // Filtrar strings vazias resultantes da limpeza
          category: adInfo.category,
          categoryId: adInfo.sub_category,
          condition: adInfo.condition || 'used',
          city: adInfo.city || '',
          state: adInfo.state || '',
          createdAt: adInfo.created_at,
          views: adInfo.view_count || 0,
          userId: adInfo.user_id,
          userName: userName,
          userAvatar: userAvatarCleaned || '/images/avatar-placeholder.png',
          whatsapp: adInfo.whatsapp,
          location: adInfo.location || '',
          user: {
            id: adInfo.user_id,
            name: userName,
            email: adInfo.user_email || '',
            role: UserRole.ADVERTISER,
            subscription: SubscriptionPlan.FREE,
            freeAdUsed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            cardSaved: false,
            isVerified: false // Campo não existe na tabela atual
          }
        };
        
        setAd(mappedAd);
        setLoading(false);
        
        // Registrar visualização do anúncio
        await registerAdView(id);
        
      } catch (err) {
        console.error('Erro ao buscar detalhes do anúncio:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar o anúncio');
        setLoading(false);
      }
    };
    
    fetchAdDetails();
  }, [id]);
  
  // Função para registrar visualização
  const registerAdView = async (adId: string) => {
    try {
      // Verificar se já visualizou recentemente
      const lastViewTimestamp = sessionStorage.getItem(`last_view_${adId}`);
      const now = Date.now();
      
      // Se já visualizou nos últimos 5 minutos, não registrar novamente
      if (lastViewTimestamp && (now - parseInt(lastViewTimestamp)) < 5 * 60 * 1000) {
        console.log('Visualização recente, não registrando novamente');
        return;
      }
      
      // Atualizar timestamp da última visualização
      sessionStorage.setItem(`last_view_${adId}`, now.toString());
      
      console.log('Registrando visualização do anúncio', adId);
      
      // Chamar a nova API para registrar visualização
      const response = await fetch('/api/ads/log-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          adId
        })
      });
      
      if (!response.ok) {
        console.warn('Falha ao registrar visualização:', await response.text());
      
        // Fallback: atualizar diretamente via Supabase (código legado)
        const supabase = getSupabaseClient();
        
        const { data: updateData, error: updateError } = await supabase
          .from('advertisements')
          .update({ 
            views: ad ? (ad.views || 0) + 1 : 1 
          })
          .eq('id', adId)
          .select('views')
          .single();
        
        if (updateError) {
          console.error('Erro ao atualizar visualizações no Supabase:', updateError);
        } else {
          console.log('Visualizações atualizadas no Supabase (fallback):', updateData);
          
          // Atualizar contagem de visualizações no estado local
          if (ad) {
            setAd({
              ...ad,
              views: updateData?.views || (ad.views + 1) // Usar o valor retornado ou incrementar
            });
          }
        }
      } else {
        console.log('Visualização registrada com sucesso');
        const data = await response.json();
        
        // Atualizar contagem de visualizações no estado local se necessário
        if (ad && data.success) {
          setAd({
            ...ad,
            views: (ad.views || 0) + 1
          });
      }
      }
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
      // Não exibimos erro ao usuário para não comprometer a experiência
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error || !ad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error || 'Anúncio não encontrado'}</p>
          <Link href="/" className="text-red-600 font-medium underline mt-2 inline-block">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }
  
  // Garantir que a imagem selecionada é uma URL limpa
  const getCleanSelectedImage = () => {
    if (!ad.images[selectedImage]) return '/images/placeholder.png';
    return cleanImageUrl(ad.images[selectedImage]);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navegação */}
      <div className="mb-6">
        <button 
          onClick={() => {
            // Usando window.location em vez de Link para forçar o recarregamento completo da página
            window.location.href = '/';
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
        >
          <FaArrowLeft className="mr-2" /> Voltar para os anúncios
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da esquerda - Fotos e detalhes */}
        <div className="lg:col-span-2">
          {/* Galeria de fotos */}
          <div className="mb-8">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={getCleanSelectedImage()}
                alt={ad.title}
                className="object-contain w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder.png';
                }}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {ad.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={cleanImageUrl(image)}
                    alt={`Foto ${index + 1}`}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.png';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Detalhes do anúncio */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{ad.title}</h1>
              
              {/* Botão de denúncia */}
              <ReportButton adId={ad.id} className="mt-1" />
            </div>
            
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <span className="flex items-center mr-4">
                <FaCalendarAlt className="mr-1" /> Publicado em {new Date(ad.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <span className="flex items-center mr-4">
                <FaMapMarkerAlt className="mr-1" /> 
                {ad.city && ad.state ? `${ad.city}, ${ad.state}` : 
                 ad.city ? ad.city : 
                 ad.state ? ad.state : 
                 ad.location ? ad.location : 'Localização não informada'}
              </span>
              <span className="flex items-center">
                <FaEye className="mr-1" /> {ad.views || 0} visualizações
              </span>
            </div>
            
            <div className="text-3xl font-bold text-green-600 mb-6">
              {ad.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            
            <p className="text-gray-700">{ad.description}</p>
          </div>
        </div>
        
        {/* Coluna da direita - Informações do vendedor e contato */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {ad.userId ? (
            <Link href={`/loja/${ad.userId}`} className="block">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center mr-3">
                    {ad.userAvatar ? (
                      <img 
                        src={cleanImageUrl(ad.userAvatar)}
                        alt={ad.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const firstLetter = ad.userName && ad.userName.length > 0 ? ad.userName.charAt(0).toUpperCase() : 'A';
                          target.parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${firstLetter}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {ad.userName && ad.userName.length > 0 ? ad.userName.charAt(0).toUpperCase() : 'A'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 flex items-center">
                      {ad.userName}
                      {ad.user?.isVerified && <VerifiedBadge className="ml-1" />}
                    </h3>
                    <p className="text-sm text-gray-500">Anunciante</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center mr-3">
                  {ad.userAvatar ? (
                    <img 
                      src={cleanImageUrl(ad.userAvatar)}
                      alt={ad.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const firstLetter = ad.userName && ad.userName.length > 0 ? ad.userName.charAt(0).toUpperCase() : 'A';
                        target.parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${firstLetter}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-white text-lg font-bold">
                      {ad.userName && ad.userName.length > 0 ? ad.userName.charAt(0).toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 flex items-center">
                    {ad.userName}
                    {ad.user?.isVerified && <VerifiedBadge className="ml-1" />}
                  </h3>
                  <p className="text-sm text-gray-500">Anunciante</p>
                </div>
              </div>
            )}
            
            {/* Contatos */}
            <div className="space-y-4 mb-6">
              {ad.whatsapp && (
                <WhatsAppButton
                  phoneNumber={ad.whatsapp}
                  message={`Olá! Vi seu anúncio "${ad.title}" no site e gostaria de mais informações.`}
                  buttonText="Contato via WhatsApp"
                  variant="secondary"
                  size="lg"
                  fullWidth
                />
              )}
              
              {ad.whatsapp && (
                <div className="flex items-center justify-center border border-gray-300 rounded-lg py-3 px-4">
                  <FaPhoneAlt className="mr-2 text-gray-600" />
                  <span className="text-gray-800 font-medium">{ad.whatsapp}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 