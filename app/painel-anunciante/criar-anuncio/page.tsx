"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaArrowLeft, FaPlus, FaImages, FaUpload, FaMapMarkerAlt, FaMoneyBillWave, FaChevronLeft, FaChevronRight, FaListAlt, FaUser, 
  FaTag, FaCheckCircle, FaPhoneAlt, FaWhatsapp, FaClipboardList, FaInfoCircle, FaHourglassHalf, FaPlusCircle
} from 'react-icons/fa';
import { AdModerationStatus } from '../../models/types';
import { compressImage, uploadImageToSupabase, generateUUID } from '../../lib/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

// Função auxiliar para obter cookies
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function CriarAnuncio() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [publicationType, setPublicationType] = useState<'anuncio' | 'destaque'>('anuncio');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    state: 'MA',
    city: '',
    zipCode: '',
    phone: '',
    whatsapp: '',
    showPhone: true
  });
  
  // Estado para erro de submissão
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Estados para controle de anúncio gratuito
  const [userHasFreeAd, setUserHasFreeAd] = useState(false);
  const [freeAdExpiryDate, setFreeAdExpiryDate] = useState<Date | null>(null);
  const [daysUntilNewFreeAd, setDaysUntilNewFreeAd] = useState(0);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [availableAds, setAvailableAds] = useState(0);
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<string | null>(null);
  
  // Lista de cidades permitidas no Maranhão
  const cidadesPermitidas = [
    "Barra do Corda",
    "Fernando Falcão",
    "Jenipapo dos Vieiras",
    "Presidente Dutra",
    "Grajaú",
    "Formosa da Serra Negra",
    "Itaipava do Grajaú",
    "Esperantinópolis"
  ];

  // Lista de categorias baseada no banco de dados real
  const categoriesUnsorted = [
    { id: 'apartamentos', name: 'Apartamentos', subcategories: [] },
    { id: 'casas', name: 'Casas', subcategories: [] },
    { id: 'terrenos', name: 'Terrenos', subcategories: [] },
    { id: 'comercial', name: 'Comercial', subcategories: [] },
    { id: 'carros', name: 'Carros', subcategories: [] },
    { id: 'motos', name: 'Motos', subcategories: [] },
    { id: 'caminhoes', name: 'Caminhões', subcategories: [] },
    { id: 'barcos-lanchas', name: 'Barcos e Lanchas', subcategories: [] },
    { id: 'pecas-acessorios', name: 'Peças e Acessórios', subcategories: [] },
    { id: 'moveis', name: 'Móveis', subcategories: [] },
    { id: 'decoracao', name: 'Decoração', subcategories: [] },
    { id: 'jardim', name: 'Jardim', subcategories: [] },
    { id: 'eletrodomesticos', name: 'Eletrodomésticos', subcategories: [] },
    { id: 'materiais-construcao', name: 'Materiais de Construção', subcategories: [] },
    { id: 'celulares', name: 'Celulares', subcategories: [] },
    { id: 'tablets', name: 'Tablets', subcategories: [] },
    { id: 'computadores', name: 'Computadores', subcategories: [] },
    { id: 'games', name: 'Games', subcategories: [] },
    { id: 'tv-som', name: 'TV e Som', subcategories: [] },
    { id: 'cameras-filmadoras', name: 'Câmeras e Filmadoras', subcategories: [] },
    { id: 'roupas-femininas', name: 'Roupas Femininas', subcategories: [] },
    { id: 'roupas-masculinas', name: 'Roupas Masculinas', subcategories: [] },
    { id: 'calcados', name: 'Calçados', subcategories: [] },
    { id: 'bolsas-acessorios', name: 'Bolsas e Acessórios', subcategories: [] },
    { id: 'beleza-perfumaria', name: 'Beleza e Perfumaria', subcategories: [] },
    { id: 'joias-relogios', name: 'Joias e Relógios', subcategories: [] },
    { id: 'equipamentos-comerciais', name: 'Equipamentos Comerciais', subcategories: [] },
    { id: 'material-escritorio', name: 'Material de Escritório', subcategories: [] },
    { id: 'instrumentos-musicais', name: 'Instrumentos Musicais', subcategories: [] },
    { id: 'livros', name: 'Livros', subcategories: [] },
    { id: 'musica-filmes', name: 'Música e Filmes', subcategories: [] },
    { id: 'fitness', name: 'Fitness', subcategories: [] },
    { id: 'futebol', name: 'Futebol', subcategories: [] },
    { id: 'ciclismo', name: 'Ciclismo', subcategories: [] },
    { id: 'natacao', name: 'Natação', subcategories: [] },
    { id: 'bicicletas', name: 'Bicicletas', subcategories: [] },
    { id: 'brinquedos', name: 'Brinquedos', subcategories: [] },
    { id: 'roupas-bebe', name: 'Roupas de Bebê', subcategories: [] },
    { id: 'roupas-infantis', name: 'Roupas Infantis', subcategories: [] },
    { id: 'moveis-bebe', name: 'Móveis de Bebê', subcategories: [] },
    { id: 'cachorros', name: 'Cachorros', subcategories: [] },
    { id: 'gatos', name: 'Gatos', subcategories: [] },
    { id: 'aves', name: 'Aves', subcategories: [] },
    { id: 'peixes', name: 'Peixes', subcategories: [] },
    { id: 'outros-animais', name: 'Outros Animais', subcategories: [] },
    { id: 'acessorios-pets', name: 'Acessórios para Pets', subcategories: [] },
    { id: 'gado', name: 'Gado', subcategories: [] },
    { id: 'cavalos', name: 'Cavalos', subcategories: [] },
    { id: 'aves-granja', name: 'Aves de Granja', subcategories: [] },
    { id: 'equipamentos-rurais', name: 'Equipamentos Rurais', subcategories: [] },
    { id: 'tratores', name: 'Tratores', subcategories: [] },
    { id: 'sementes-mudas', name: 'Sementes e Mudas', subcategories: [] },
    { id: 'servicos-beleza', name: 'Beleza e Estética', subcategories: [] },
    { id: 'consultoria', name: 'Consultoria', subcategories: [] },
    { id: 'cursos', name: 'Cursos', subcategories: [] },
    { id: 'eventos', name: 'Eventos', subcategories: [] },
    { id: 'reformas-reparos', name: 'Reformas e Reparos', subcategories: [] },
    { id: 'servicos-automotivos', name: 'Serviços Automotivos', subcategories: [] },
    { id: 'transporte', name: 'Transporte', subcategories: [] },
    { id: 'outros', name: 'Outros', subcategories: [] }
  ];
  
  // Ordenar categorias em ordem alfabética pelo nome
  const categories = [...categoriesUnsorted].sort((a, b) => a.name.localeCompare(b.name));

  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Verificar se o limite de 10 fotos seria excedido
    if (images.length + files.length > 10) {
      alert('Limite máximo de 10 fotos por anúncio. Selecione menos imagens.');
      return;
    }
    
    // Mostrar indicador de carregamento
    const processingImages: string[] = [];
    
    // Para cada arquivo, primeiro criar uma preview temporária
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      processingImages.push(objectUrl);
    });
    
    // Atualizar o estado para mostrar as previews
    setImages(prev => [...prev, ...processingImages]);
    
    // Processar os uploads um por um
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempUrl = processingImages[i];
      
      try {
        console.log('Enviando imagem para o Supabase:', file.name);
        
        // Fazer upload da imagem para o Supabase diretamente
        const supabase = getSupabaseClient();
        const userId = localStorage.getItem('userId') || 'anonymous';
        const uniqueId = generateUUID();
        const filePath = `anuncios/${userId}/${uniqueId}-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error('Erro ao fazer upload:', error);
          continue;
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          console.log('Imagem enviada com sucesso:', urlData.publicUrl);
          
          // Substituir a URL temporária pela permanente
          setImages(prev => prev.map(img => img === tempUrl ? urlData.publicUrl : img));
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        
        // Manter a URL temporária em caso de erro
        console.log('Mantendo URL temporária para preview:', tempUrl);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Tratamento especial para o campo de preço
    if (name === 'price') {
      // Remover formatação para obter apenas os números
      let numericValue = value.replace(/\D/g, '');
      
      // Se for vazio, simplesmente limpar o campo
      if (!numericValue) {
        setFormData({
          ...formData,
          [name]: ''
        });
        return;
      }
      
      // Converter para centavos (para facilitar a formatação)
      const cents = parseInt(numericValue, 10);
      
      // Converter de centavos para reais com 2 casas decimais
      const reais = cents / 100;
      
      // Formatar com separador de milhares e decimal
      const formatted = reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      setFormData({
        ...formData,
        [name]: formatted
      });
      return;
    }
    
    // Tratamento para atualizar a localização quando a cidade mudar
    if (name === 'city') {
      setFormData({
        ...formData,
        city: value,
        location: value ? `${value} - MA` : ''
      });
      return;
    }
    
    // Processamento para outros campos (sem alteração)
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const nextStep = () => {
    // Validação de campos específicos antes de avançar
    if (currentStep === 3) {
      // Verificar se o preço é válido
      if (formData.price) {
        // Remover formatação e verificar se é um número válido
        const cleanPrice = formData.price.toString().replace(/\./g, '').replace(',', '.');
        const numericPrice = parseFloat(cleanPrice);
        
        if (isNaN(numericPrice) || numericPrice <= 0) {
          alert('Por favor, informe um preço válido para o anúncio.');
          return;
        }
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Verifica o status do usuário em relação a anúncios gratuitos e plano
  useEffect(() => {
    // Função para buscar o status do anúncio gratuito
    const fetchFreeAdStatus = async () => {
      try {
        // Obter userId real do usuário logado
        const userId = localStorage.getItem('userId') || getCookie('userId');
        
        if (!userId) {
          console.warn('Usuário não logado - definindo valores padrão');
          setUserHasFreeAd(false);
          setIsSubscriber(false);
          setAvailableAds(0);
          return;
        }
        
        const response = await fetch(`/api/ads/free-ad-check?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Falha ao verificar status do anúncio gratuito');
        }
        
        const data = await response.json();
        
        // Atualizar estados com os dados da API
        setUserHasFreeAd(data.freeAd.used);
        setIsSubscriber(data.user.isSubscriber);
        setUserSubscriptionPlan(data.subscription.type);
        setAvailableAds(data.subscription.availableAdSlots);
        
        // Se tiver anúncio gratuito, atualizar data de expiração e dias restantes
        if (data.freeAd.used && data.freeAd.expiryDate) {
          setFreeAdExpiryDate(new Date(data.freeAd.expiryDate));
          setDaysUntilNewFreeAd(data.freeAd.daysRemaining);
        }
      } catch (error) {
        console.error('Erro ao buscar status do anúncio gratuito:', error);
        // Usar valores padrão em caso de erro (usuário novo = pode criar anúncio)
        setUserHasFreeAd(false);
        setIsSubscriber(false);
        setAvailableAds(0);
      }
    };
    
    // Chamar a função de busca
    fetchFreeAdStatus();
  }, []);

  const handleSubmitAd = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Obter ID de usuário dos cookies ou localStorage
      const userId = localStorage.getItem('userId') || getCookie('userId');
      const userEmail = localStorage.getItem('userEmail') || getCookie('userEmail');
      const userName = localStorage.getItem('userName') || getCookie('userName') || 'Usuário';
      
      if (!userId) {
        console.error("ID do usuário não encontrado");
        setSubmitError("Você precisa estar logado para criar um anúncio");
        setIsSubmitting(false);
        return;
      }
      
      // Verificar imagens
      let imagesToSave = images;
      
      // Enviar pelo menos 1 imagem (imagem padrão se usuário não forneceu)
      if (!imagesToSave || imagesToSave.length === 0) {
        imagesToSave = ['/images/no-image.png'];
      }
      
      console.log('Enviando dados do anúncio com userId:', userId);
      
      // Processar preço para garantir formato correto
      let priceValue = formData.price;
      if (typeof priceValue === 'string') {
        // Remover formatação e garantir formato correto
        priceValue = priceValue.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
      }
      
      // Gerar UUID para o anúncio
      const adId = generateUUID();
      
      // Tentar salvar diretamente no Supabase - Usando método mais simples
      const supabase = getSupabaseClient();
      
      // Verificar se existem URLs blob e converter para URL final ou remover
      const processedImages = imagesToSave.map(imgUrl => {
        // Se for URL blob, substituir por imagem padrão
        if (imgUrl.startsWith('blob:')) {
          console.warn('URL blob detectada, substituindo por imagem padrão:', imgUrl);
          return '/images/no-image.png';
        }
        
        // Se for URL relativa sem /, adicionar
        if (!imgUrl.startsWith('/') && !imgUrl.startsWith('http')) {
          return `/${imgUrl}`;
        }
        
        return imgUrl;
      });
      
      // Verificar novamente se temos pelo menos uma imagem válida
      const validImages = processedImages.filter(url => 
        url !== '/images/no-image.png' && !url.startsWith('blob:')
      );
      
      // Se não tiver nenhuma imagem válida, usar a imagem padrão
      const finalImages = validImages.length > 0 ? 
        validImages : ['/images/no-image.png'];
      
      console.log('Imagens finais para o anúncio:', finalImages);
      
      // Dados do anúncio com imagens processadas
      const adData = {
        id: adId,
        title: formData.title,
        description: formData.description,
        price: priceValue,
        category,
        sub_category: subCategory,
        images: finalImages, // Imagens validadas
        location: `${formData.city}, ${formData.state}`,
        zip_code: formData.zipCode,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        show_phone: formData.showPhone,
        is_free_ad: false,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        user_avatar: null,
        status: 'active',
        moderation_status: 'pending',
        views: 0,
        clicks: 0
      };
      
      console.log('Enviando dados do anúncio:', JSON.stringify(adData, null, 2));
      
      // Usar a nova API para criar anúncio
      const apiData = {
        userId: userId,
        title: formData.title,
        description: formData.description,
        price: priceValue,
        category: category,
        subCategory: subCategory,
        images: finalImages,
        location: `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode, // Este será convertido na API
        phone: formData.phone,
        whatsapp: formData.whatsapp
      };
      
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });
      
      const result = await response.json();
        
      if (!response.ok) {
        console.error('Erro ao criar anúncio via API:', result.error);
        throw new Error(result.error);
      } else {
        console.log('Anúncio salvo via API com sucesso:', result.ad.id);
        
        // Salvar ID do anúncio no localStorage para referência futura
        localStorage.setItem('lastCreatedAdId', result.ad.id);
        localStorage.setItem('lastCreatedAdTimestamp', Date.now().toString());
        
        // Redirecionar para a página de anúncios
        router.push('/painel-anunciante/meus-anuncios?created=success');
      }
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      setSubmitError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
      
      // Criar anúncio local como fallback
      const mockId = `mock-ad-${Date.now()}`;
      localStorage.setItem('lastCreatedAdId', mockId);
      localStorage.setItem('ad_title', formData.title);
      localStorage.setItem('ad_price', formData.price);
      localStorage.setItem('ad_category', category);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para formatar o preço no padrão brasileiro
  const formatCurrency = (value: string | number) => {
    // Se for string, converte para número
    let numValue: number;
    
    if (typeof value === 'string') {
      // Remove caracteres não numéricos, exceto vírgula/ponto
      const cleanValue = value.replace(/[^\d,.]/g, '');
      // Substitui vírgula por ponto para processamento
      const processValue = cleanValue.replace(/\./g, '').replace(',', '.');
      numValue = parseFloat(processValue);
      
      if (isNaN(numValue)) {
        numValue = 0;
      }
    } else {
      numValue = value;
    }
    
    // Formata usando o locale pt-BR
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">O que você deseja criar?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setPublicationType('anuncio')}
                  className={`p-4 rounded-lg border ${publicationType === 'anuncio' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors text-left flex items-start`}
                >
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FaTag className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Anúncio</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Crie um anúncio que ficará disponível permanentemente no site
                    </p>
                  </div>
                </button>
                <button 
                  onClick={() => setPublicationType('destaque')}
                  className={`p-4 rounded-lg border ${publicationType === 'destaque' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors text-left flex items-start`}
                >
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <FaImages className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Destaque</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Crie uma publicação temporária (24h) que aparecerá em destaque
                    </p>
                  </div>
                </button>
              </div>

              {publicationType === 'anuncio' && (
                <>
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Selecione a categoria do anúncio</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <button 
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          // Como não temos subcategorias, definimos uma subcategoria padrão
                          setSubCategory('Geral');
                        }}
                        className={`p-4 rounded-lg border ${category === cat.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors text-left`}
                      >
                        <h3 className="font-medium text-gray-800">{cat.name}</h3>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {publicationType === 'destaque' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">Sobre os destaques</h3>
                      <p className="text-sm text-gray-600">
                        Os destaques são publicações temporárias que aparecem no topo da página inicial por 24 horas. 
                        É uma ótima maneira de promover ofertas especiais, produtos novos ou chamar atenção para seus anúncios.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-end">
              {publicationType === 'anuncio' ? (
              <button
                onClick={nextStep}
                  disabled={!category || !subCategory}
                className={`px-4 py-2 rounded-md font-medium ${
                    (!category || !subCategory) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-600'
                }`}
              >
                  Continuar
              </button>
              ) : (
                <Link 
                  href="/painel-anunciante/publicar-destaques" 
                  className="px-4 py-2 rounded-md font-medium bg-green-500 text-white hover:bg-green-600"
                >
                  Ir para criação de destaque
                </Link>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Adicione fotos ao seu anúncio</h2>
              <p className="text-sm text-gray-600 mb-6">
                As fotos são essenciais para despertar o interesse dos compradores. 
                Adicione imagens nítidas e de qualidade de diferentes ângulos do seu produto.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors mb-6">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FaImages className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-600 mb-2">Clique para fazer upload ou arraste e solte aqui</p>
                  <p className="text-sm text-gray-500 mb-1">JPG ou PNG (Máx. 5MB por imagem)</p>
                  <p className="text-sm font-medium text-amber-600">{images.length}/10 fotos - Máximo de 10 fotos por anúncio</p>
                </label>
              </div>
              
              {images.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Imagens adicionadas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image} 
                          alt={`Imagem ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200" 
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          &times;
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-green-500 text-xs text-black px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={nextStep}
                className="px-4 py-2 rounded-md font-medium bg-green-500 text-black hover:bg-green-600"
              >
                Continuar
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Informações do anúncio</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                    Título do anúncio*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Honda Civic EXL 2020 - Único dono"
                    required
                  />
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
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descreva seu produto com detalhes, incluindo características, estado de conservação, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                    Preço*
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
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="state">
                      Estado*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="text-gray-500" />
                      </div>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value="MA"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md focus:outline-none"
                        disabled
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Apenas Maranhão</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">
                      Cidade*
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Selecione uma cidade</option>
                      {cidadesPermitidas.map((cidade) => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.title || !formData.description || !formData.price || !formData.city || !formData.state}
                className={`px-4 py-2 rounded-md font-medium ${(!formData.title || !formData.description || !formData.price || !formData.city || !formData.state) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-600'}`}
              >
                Continuar
              </button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Informações de Contato</h2>
              <p className="text-sm text-gray-600 mb-6">
                Adicione formas de contato para que os compradores possam se comunicar com você.
                <span className="text-green-600 font-medium"> O WhatsApp é obrigatório</span> e será exibido no botão de contato do seu anúncio.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="whatsapp">
                    WhatsApp* (será exibido no botão do anúncio)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaWhatsapp className="text-green-500" />
                    </div>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="(99) 99999-9999"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Formato: (99) 99999-9999 - Inclua o DDD</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                    Telefone alternativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhoneAlt className="text-gray-500" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showPhone"
                    name="showPhone"
                    checked={formData.showPhone}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showPhone" className="ml-2 block text-sm text-gray-700">
                    Exibir telefone alternativo no anúncio
                  </label>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">
                        Seu WhatsApp será exibido no botão de contato do anúncio. Isso facilita que os interessados entrem em contato diretamente com você pelo aplicativo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.whatsapp}
                className={`px-4 py-2 rounded-md font-medium ${!formData.whatsapp ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-600'}`}
              >
                Continuar
              </button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Revise seu anúncio</h2>
              <p className="text-sm text-gray-600 mb-6">
                Verifique se todas as informações estão corretas antes de publicar.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FaClipboardList className="text-green-600 mr-2" /> Informações Básicas
                  </h3>
                  <p className="text-gray-800 font-medium mb-1">{formData.title}</p>
                  <p className="text-gray-600 mb-2">{category} &gt; {subCategory}</p>
                  <p className="text-gray-900 font-bold text-xl mb-3">
                    {typeof formData.price === 'string' ? formatCurrency(formData.price) : `R$ ${formData.price}`}
                  </p>
                  <p className="text-gray-700">{formData.description}</p>
                </div>
                
                {/* Imagens */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FaImages className="text-green-600 mr-2" /> Imagens ({images.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {images.slice(0, 6).map((image, index) => (
                      <div key={index} className="relative rounded-md overflow-hidden h-24">
                        <img 
                          src={image} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-xs text-center text-black py-0.5">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {images.length > 6 && (
                    <p className="text-sm text-gray-500 mt-2">+ {images.length - 6} imagens adicionais</p>
                  )}
                </div>
                
                {/* Localização */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FaMapMarkerAlt className="text-green-600 mr-2" /> Localização
                  </h3>
                  <p className="text-gray-700">{formData.city} - {formData.state}</p>
                </div>
                
                {/* Contato */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FaPhoneAlt className="text-green-600 mr-2" /> Contato
                  </h3>
                  <p className="flex items-center text-gray-700 mb-2 font-medium">
                    <FaWhatsapp className="mr-2 text-green-600" /> {formData.whatsapp} <span className="ml-2 text-green-600 text-xs">(WhatsApp principal)</span>
                  </p>
                  {formData.showPhone && formData.phone && (
                    <p className="flex items-center text-gray-700">
                      <FaPhoneAlt className="mr-2 text-sm" /> {formData.phone}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Aviso sobre moderação */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Seu anúncio será revisado</h3>
                    <p className="text-sm text-gray-600">
                      Todos os anúncios passam por uma revisão antes de serem publicados. 
                      Esse processo geralmente leva entre 1 e 24 horas. Você receberá uma notificação assim que seu anúncio for aprovado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmitAd}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md font-medium ${
                  isSubmitting 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-green-500 text-black hover:bg-green-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaHourglassHalf className="inline mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Publicar anúncio'
                )}
              </button>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHourglassHalf className="text-blue-600 text-3xl" />
              </div>
            <h2 className="text-2xl font-medium text-gray-800 mb-2">Anúncio enviado para aprovação!</h2>
            <p className="text-gray-600 mb-6">
              Seu anúncio foi enviado e está aguardando aprovação pelos nossos moderadores. 
              Você será notificado assim que ele for aprovado e estiver disponível para todos os usuários.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/painel-anunciante/meus-anuncios" 
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ver meus anúncios
                </Link>
                <Link 
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                Voltar à página inicial
                </Link>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: 'Categoria' },
      { number: 2, label: 'Fotos' },
      { number: 3, label: 'Informações' },
      { number: 4, label: 'Contato' },
      { number: 5, label: 'Revisão' },
      { number: 6, label: 'Concluído' }
    ];

    return (
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step) => (
            <div 
              key={step.number} 
              className={`flex flex-col items-center ${currentStep >= step.number ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentStep > step.number 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step.number 
                    ? 'bg-green-100 text-green-600 border-2 border-green-500' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {currentStep > step.number ? <FaCheckCircle /> : step.number}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-2 bg-gray-200 rounded">
          <div 
            className="absolute h-2 bg-green-500 rounded transition-all duration-300"
            style={{ width: `${(currentStep - 1) * 20}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/painel-anunciante" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para o painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Criar novo anúncio</h1>
        <p className="text-gray-600">Preencha as informações para publicar seu anúncio</p>
      </div>
      
      {/* Alerta de limite de anúncios */}
      {userHasFreeAd && !isSubscriber && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Você já utilizou seu anúncio gratuito</h3>
              <p className="text-sm text-gray-600 mb-2">
                Cada usuário tem direito a 1 anúncio gratuito ativo a cada 90 dias.
                {daysUntilNewFreeAd > 0 ? (
                  <span> Você poderá publicar um novo anúncio gratuito em <strong>{daysUntilNewFreeAd} dias</strong>.</span>
                ) : (
                  <span> Seu período de espera já terminou. Você pode publicar um novo anúncio gratuito agora.</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link 
                  href="/painel-anunciante/planos" 
                  className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                >
                  <FaPlus className="mr-1" /> Assinar um plano
                </Link>
                <Link 
                  href="/painel-anunciante/anuncio-extra" 
                  className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  <FaTag className="mr-1" /> Comprar anúncio extra (R$24,90)
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isSubscriber && availableAds <= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Você atingiu o limite de anúncios do seu plano</h3>
              <p className="text-sm text-gray-600 mb-2">
                Seu plano {userSubscriptionPlan && userSubscriptionPlan.replace('_', ' ')} permite um número limitado de anúncios ativos. 
                Para publicar mais anúncios, você pode fazer upgrade do seu plano ou excluir anúncios existentes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link 
                  href="/painel-anunciante/planos" 
                  className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                >
                  <FaPlus className="mr-1" /> Fazer upgrade
                </Link>
                <Link 
                  href="/painel-anunciante/anuncio-extra" 
                  className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  <FaPlusCircle className="mr-1" /> Comprar anúncio extra
                </Link>
                <Link 
                  href="/painel-anunciante/meus-anuncios" 
                  className="inline-flex items-center px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                >
                  <FaTag className="mr-1" /> Gerenciar anúncios
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Progresso do formulário */}
      {renderProgressBar()}
      
      {/* Formulário em etapas */}
      {renderStep()}
    </div>
  );
} 