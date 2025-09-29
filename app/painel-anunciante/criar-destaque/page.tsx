"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaImages, FaEye, FaCalendarAlt, FaCreditCard,
  FaPalette, FaTag, FaPercentage, FaSave, FaHourglassHalf,
  FaInfoCircle, FaCheck, FaExternalLinkAlt, FaFire, FaPlay,
  FaClock, FaCut
} from 'react-icons/fa';
import { generateUUID, uploadImageToSupabase } from '../../lib/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { useAuth } from '../../lib/authSync';
import { MAX_HIGHLIGHT_DURATION } from '../../components/OptimizedVideoPlayer';

export default function CriarDestaque() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [videoDurationInfo, setVideoDurationInfo] = useState<{
    originalDuration: number;
    effectiveDuration: number;
    isClipped: boolean;
  } | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    videoUrl: '', // Adicionar suporte a vídeo
    linkUrl: '',
    linkText: 'Ver mais',
    highlightType: 'promotion',
    backgroundColor: '#ff6b35',
    textColor: '#ffffff',
    price: '',
    discountPercentage: '',
    durationHours: 24 // Fixo em 24 horas
  });

  const highlightTypes = [
    { id: 'promotion', name: 'Promoção', icon: FaTag, description: 'Destaque promocional com preços especiais' },
    { id: 'offer', name: 'Oferta', icon: FaPercentage, description: 'Ofertas imperdíveis com desconto' },
    { id: 'announcement', name: 'Anúncio', icon: FaFire, description: 'Comunicado ou novidade importante' }
  ];

  // ✅ CORREÇÃO: Duração fixa de 24 horas (sistema padronizado)
  const FIXED_DURATION = 24;
  const [planValidation, setPlanValidation] = useState<{canCreate: boolean, reason?: string, price?: number} | null>(null);

  const backgroundColors = [
    '#ff6b35', '#e74c3c', '#9b59b6', '#3498db', 
    '#1abc9c', '#f39c12', '#34495e', '#2c3e50'
  ];

  const durationOptions = [
    { hours: 24, label: '24 horas', price: 0 }
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const supabase = getSupabaseClient();
      const uniqueId = generateUUID();
      const filePath = `destaques/${userId}/${uniqueId}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erro ao fazer upload:', error);
        setError('Erro ao fazer upload da imagem');
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
      
      if (urlData && urlData.publicUrl) {
        setFormData(prev => ({ ...prev, imageUrl: urlData.publicUrl, videoUrl: '' }));
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError('Erro ao processar imagem');
    }
  };

  // Função para detectar duração do vídeo
  const detectVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        console.log('🎬 [Duration] Duração detectada:', duration + 's');
        resolve(duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Erro ao detectar duração do vídeo'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('🎬 [Upload] Iniciando upload de vídeo:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validar tipo de arquivo de vídeo
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de vídeo não suportado. Use MP4, WebM, OGG, AVI ou MOV.');
      return;
    }

    // Validar tamanho (máx 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Arquivo de vídeo muito grande. Máximo 50MB.');
      return;
    }

    try {
      // Detectar duração do vídeo antes do upload
      const originalDuration = await detectVideoDuration(file);
      const effectiveDuration = Math.min(originalDuration, MAX_HIGHLIGHT_DURATION);
      const isClipped = originalDuration > MAX_HIGHLIGHT_DURATION;

      // Atualizar informações de duração
      setVideoDurationInfo({
        originalDuration,
        effectiveDuration,
        isClipped
      });

      console.log('📊 [Duration] Informações de duração:', {
        original: originalDuration.toFixed(2) + 's',
        effective: effectiveDuration.toFixed(2) + 's',
        isClipped
      });

      const supabase = getSupabaseClient();
      const uniqueId = generateUUID();
      const fileExtension = file.name.split('.').pop() || 'mp4';
      const filePath = `destaques/${userId}/videos/${uniqueId}-${Date.now()}.${fileExtension}`;

      console.log('📤 [Upload] Fazendo upload para:', filePath);

      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          metadata: {
            contentType: file.type,
            originalName: file.name,
            originalDuration: originalDuration.toString(),
            effectiveDuration: effectiveDuration.toString()
          }
        });

      if (error) {
        console.error('❌ [Upload] Erro ao fazer upload:', error);
        setError(`Erro ao fazer upload do vídeo: ${error.message}`);
        return;
      }

      console.log('✅ [Upload] Upload realizado com sucesso:', data);

      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      if (urlData && urlData.publicUrl) {
        console.log('📹 [Upload] URL pública gerada:', urlData.publicUrl);
        // Garantir que vídeos sejam salvos apenas no campo videoUrl, não imageUrl
        setFormData(prev => ({
          ...prev,
          videoUrl: urlData.publicUrl,
          imageUrl: '' // Limpar imageUrl quando há vídeo
        }));
        setError(null); // Limpar erros anteriores
      } else {
        setError('Erro ao gerar URL pública do vídeo');
      }
    } catch (error) {
      console.error('❌ [Upload] Erro ao processar vídeo:', error);
      setError('Erro ao processar vídeo');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      let numericValue = value.replace(/\D/g, '');
      
      if (!numericValue) {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }
      
      const cents = parseInt(numericValue, 10);
      const reais = cents / 100;
      
      const formatted = reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDurationChange = (hours: number, price: number) => {
    setFormData(prev => ({ ...prev, durationHours: hours }));
  };

  // ✅ PREÇO DINÂMICO: Baseado na validação do plano
  const calculatePrice = () => {
    return planValidation?.price || 0;
  };
  
  // Verificar validação do plano ao carregar
  React.useEffect(() => {
    if (userId) {
      checkPlanValidation();
    }
  }, [userId]);
  
  const checkPlanValidation = async () => {
    if (!userId) return;
    
    try {
      // Fazer uma chamada de teste para verificar se pode criar
      const response = await fetch('/api/destaques/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setPlanValidation(result.validation);
      }
    } catch (error) {
      console.error('Erro ao verificar validação do plano:', error);
      // Fallback: assumir que precisa pagar
      setPlanValidation({ canCreate: true, reason: 'Requer pagamento', price: 9.90 });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!userId) {
        setError('Você precisa estar logado para criar destaques');
        return;
      }

      if (!formData.title || !formData.description) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      // Determinar tipo de mídia e URLs corretas
      const hasVideo = formData.videoUrl && formData.videoUrl.trim() !== '';
      const hasImage = formData.imageUrl && formData.imageUrl.trim() !== '';

      console.log('📊 [Submit] Dados do destaque:', {
        hasVideo,
        hasImage,
        videoUrl: hasVideo ? formData.videoUrl.substring(0, 50) + '...' : null,
        imageUrl: hasImage ? formData.imageUrl.substring(0, 50) + '...' : null
      });

      const highlightData = {
        userId: userId,
        title: formData.title,
        description: formData.description,
        // Se há vídeo, usar como imageUrl para compatibilidade com API atual
        // TODO: Futuramente, separar em campos distintos
        imageUrl: hasVideo ? formData.videoUrl : (formData.imageUrl || '/images/highlight-default.jpg'),
        videoUrl: hasVideo ? formData.videoUrl : '', // Campo separado para vídeos
        mediaType: hasVideo ? 'video' : 'image', // Indicar tipo explicitamente
        linkUrl: formData.linkUrl,
        linkText: formData.linkText,
        highlightType: formData.highlightType,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        price: formData.price ? formData.price.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.') : null,
        discountPercentage: formData.discountPercentage || null,
        // durationHours removido - será sempre 24h pelo sistema
        // Incluir informações de duração para vídeos
        media_duration: hasVideo && videoDurationInfo
          ? videoDurationInfo.effectiveDuration
          : (hasVideo ? MAX_HIGHLIGHT_DURATION : MAX_HIGHLIGHT_DURATION),
        original_duration: hasVideo && videoDurationInfo
          ? videoDurationInfo.originalDuration
          : null,
        is_clipped: hasVideo && videoDurationInfo
          ? videoDurationInfo.isClipped
          : false
      };

      console.log('📤 [Submit] Enviando dados para API:', highlightData);

      const response = await fetch('/api/destaques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(highlightData)
      });

      const result = await response.json();
        
      if (!response.ok) {
        // Tratar mensagens de erro específicas  
        if (result.error === 'PLAN_UPGRADE_REQUIRED') {
          throw new Error(result.message || 'Para criar destaques, você precisa assinar um plano ou pagar R$ 9,90');
        } else if (result.error === 'PLAN_LIMIT_EXCEEDED') {
          throw new Error(result.message || 'Você já utilizou todos os destaques do seu plano');
        }
        throw new Error(result.error || result.message || 'Erro ao criar destaque');
      }

      // Redirecionar para página de pagamento ou sucesso
      const price = calculatePrice();
      const message = price > 0 
        ? `Destaque criado! Valor: R$ ${price.toFixed(2)}\n\nEm breve você será redirecionado para o pagamento.`
        : 'Destaque criado com sucesso usando sua cota do plano!';
      alert(message);
      router.push('/painel-anunciante/meus-destaques?created=success');

    } catch (error) {
      console.error('Erro ao criar destaque:', error);
      setError('Ocorreu um erro ao criar o destaque. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreview = () => (
    <div 
      className="relative rounded-lg overflow-hidden shadow-lg"
      style={{ 
        backgroundColor: formData.backgroundColor,
        color: formData.textColor,
        minHeight: '200px'
      }}
    >
      {/* Preview de vídeo ou imagem */}
      {formData.videoUrl && formData.videoUrl.trim() !== '' ? (
        <div className="absolute inset-0">
          <video 
            src={formData.videoUrl} 
            autoPlay 
            muted 
            loop
            playsInline
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              console.error('Erro ao carregar vídeo:', e);
              // Se o vídeo falhar, remover da preview
              setFormData(prev => ({ ...prev, videoUrl: '' }));
            }}
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: formData.backgroundColor, opacity: 0.5 }}
          ></div>
        </div>
      ) : formData.imageUrl && formData.imageUrl.trim() !== '' ? (
        <div className="absolute inset-0">
          <img 
            src={formData.imageUrl} 
            alt="Preview do destaque" 
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e);
              // Se a imagem falhar, usar placeholder
              (e.target as HTMLImageElement).src = '/images/highlight-placeholder.jpg';
            }}
            onLoad={() => {
              console.log('Imagem carregada com sucesso para preview');
            }}
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: formData.backgroundColor, opacity: 0.7 }}
          ></div>
        </div>
      ) : (
        // Placeholder quando não há mídia
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center opacity-60">
            <FaImages className="mx-auto text-4xl mb-2" />
            <p className="text-sm">Adicione uma imagem ou vídeo para ver o preview</p>
          </div>
        </div>
      )}
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">
              {formData.title || 'Título do seu destaque'}
            </h3>
            <p className="text-sm opacity-90 mb-4">
              {formData.description || 'Descrição do seu destaque aparecerá aqui...'}
            </p>
          </div>
          
          {formData.discountPercentage && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{formData.discountPercentage}%
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          {formData.price && (
            <div className="text-2xl font-bold">
              R$ {formData.price}
            </div>
          )}
          
          <button 
            className="bg-white text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors flex items-center"
          >
            {formData.linkText} <FaExternalLinkAlt className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/painel-anunciante" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para o painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Criar destaque</h1>
        <p className="text-gray-600">Crie um destaque temporário para promover seus produtos na página inicial</p>
      </div>

      {/* Informações sobre destaques */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Como funcionam os destaques</h3>
            <p className="text-sm text-gray-600 mb-2">
              Os destaques aparecem no topo da página inicial por um período determinado (12h a 3 dias). 
              Eles são ideais para promoções, lançamentos ou ofertas especiais.
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              <li>Maior visibilidade para seus produtos</li>
              <li>Aparece para todos os visitantes do site</li>
              <li>Design personalizado com suas cores</li>
              <li>Métricas de visualizações e cliques</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            {/* Tipo de destaque */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Tipo de destaque</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlightTypes.map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, highlightType: type.id }))}
                    className={`p-4 rounded-lg border ${formData.highlightType === type.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors text-left`}
                  >
                    <type.icon className="text-green-600 mb-2" />
                    <h3 className="font-medium text-gray-800">{type.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Informações básicas */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Informações do destaque</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                    Título*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Mega Promoção de Verão!"
                    maxLength={60}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/60 caracteres</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                    Descrição*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descreva sua promoção ou oferta..."
                    maxLength={150}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/150 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="linkUrl">
                    Link de destino
                  </label>
                  <input
                    type="url"
                    id="linkUrl"
                    name="linkUrl"
                    value={formData.linkUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="/categoria/promocoes ou https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="linkText">
                    Texto do botão
                  </label>
                  <input
                    type="text"
                    id="linkText"
                    name="linkText"
                    value={formData.linkText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ver mais"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* Mídia (Imagem ou Vídeo) */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Mídia do destaque (opcional)</h2>

              {/* Tabs para escolher tipo de mídia */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    // Limpar vídeo ao escolher imagem
                    if (formData.videoUrl) {
                      setFormData(prev => ({ ...prev, videoUrl: '' }));
                    }
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !formData.videoUrl ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📷 Imagem
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Limpar imagem ao escolher vídeo
                    if (formData.imageUrl) {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    formData.videoUrl ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎬 Vídeo
                </button>
              </div>

              {/* Upload de Imagem */}
              {!formData.videoUrl && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors mb-4">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <FaImages className="mx-auto text-gray-400 text-3xl mb-2" />
                    <p className="text-gray-600 mb-1">Clique para fazer upload de imagem</p>
                    <p className="text-xs text-gray-500">JPG ou PNG (máx. 2MB)</p>
                  </label>
                </div>
              )}

              {/* Upload de Vídeo */}
              {!formData.imageUrl && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <FaPlay className="mx-auto text-blue-400 text-3xl mb-2" />
                    <p className="text-gray-600 mb-1">Clique para fazer upload de vídeo</p>
                    <p className="text-xs text-gray-500">MP4, WebM, OGG, AVI ou MOV (máx. 50MB)</p>
                  </label>
                </div>
              )}

              {/* Preview da mídia selecionada */}
              {(formData.imageUrl || formData.videoUrl) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {formData.videoUrl ? (
                        <>
                          <FaPlay className="text-blue-500" />
                          <span className="text-sm text-gray-600">Vídeo selecionado</span>
                        </>
                      ) : (
                        <>
                          <FaImages className="text-green-500" />
                          <span className="text-sm text-gray-600">Imagem selecionada</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, imageUrl: '', videoUrl: '' }));
                        setVideoDurationInfo(null); // Limpar informações de duração
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ Remover
                    </button>
                  </div>
                </div>
              )}

              {/* Informações sobre duração do vídeo */}
              {videoDurationInfo && formData.videoUrl && (
                <div className={`mt-4 p-4 rounded-lg ${
                  videoDurationInfo.isClipped
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${
                      videoDurationInfo.isClipped ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      {videoDurationInfo.isClipped ? <FaCut /> : <FaClock />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        videoDurationInfo.isClipped ? 'text-amber-800' : 'text-green-800'
                      }`}>
                        {videoDurationInfo.isClipped
                          ? 'Vídeo será cortado automaticamente'
                          : 'Duração do vídeo aprovada'
                        }
                      </h4>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>
                          <strong>Duração original:</strong> {videoDurationInfo.originalDuration.toFixed(1)}s
                        </p>
                        <p>
                          <strong>Duração no destaque:</strong> {videoDurationInfo.effectiveDuration.toFixed(1)}s
                        </p>
                        {videoDurationInfo.isClipped && (
                          <p className="text-amber-700">
                            ⚠️ Apenas os primeiros {MAX_HIGHLIGHT_DURATION} segundos serão reproduzidos no destaque.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preço e desconto */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Preço e desconto (opcional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                    Preço
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="discountPercentage">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    id="discountPercentage"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="50"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Cores */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Personalização visual</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor de fundo</label>
                  <div className="flex space-x-2">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, backgroundColor: color }))}
                        className={`w-10 h-10 rounded-full border-2 ${formData.backgroundColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="backgroundColor">
                      Cor de fundo (hex)
                    </label>
                    <input
                      type="color"
                      id="backgroundColor"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="textColor">
                      Cor do texto
                    </label>
                    <input
                      type="color"
                      id="textColor"
                      name="textColor"
                      value={formData.textColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Duração */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Duração do destaque</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.hours}
                    onClick={() => handleDurationChange(option.hours, option.price)}
                    className={`p-3 rounded-lg border text-center ${formData.durationHours === option.hours ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors`}
                  >
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-sm text-green-600 font-bold">R$ {option.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                O destaque aparecerá na página inicial pelo tempo selecionado
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total: <span className="font-bold text-lg text-green-600">R$ {calculatePrice().toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.description}
              className={`px-6 py-2 rounded-md font-medium ${
                isSubmitting || !formData.title || !formData.description
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaHourglassHalf className="inline mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FaCreditCard className="inline mr-2" />
                  Criar e pagar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaEye className="mr-2" /> Preview do destaque
            </h2>
            {renderPreview()}
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Como será exibido:</strong> Este destaque aparecerá no topo da página inicial durante o período selecionado.</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
} 