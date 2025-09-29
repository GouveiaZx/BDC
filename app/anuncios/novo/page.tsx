"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCamera, FaInfoCircle, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authSync';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

interface FormData {
  title: string;
  category: string;
  description: string;
  price: string;
  city: string;
  state: string;
  images: File[];
  phone: string;
  whatsapp: string;
}

const NewAdPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const [imageURLs, setImageURLs] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    description: '',
    price: '',
    city: '',
    state: '',
    images: [],
    phone: '',
    whatsapp: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Carregar categorias do banco de dados
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🏷️ Carregando categorias do banco de dados...');
        const response = await fetch(`/api/categories?t=${Date.now()}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.categories) {
            setCategories(result.categories);
            console.log('✅ Categorias carregadas:', result.categories.length);
          } else {
            console.error('❌ Erro ao carregar categorias:', result.error);
            // Fallback para categorias básicas
            setCategories([
              { id: 'carros', name: 'Carros', slug: 'carros', icon: '🚗', sort_order: 1 },
              { id: 'imoveis', name: 'Imóveis', slug: 'imoveis', icon: '🏠', sort_order: 2 },
              { id: 'eletronicos', name: 'Eletrônicos', slug: 'eletronicos', icon: '📱', sort_order: 3 },
              { id: 'moveis', name: 'Móveis', slug: 'moveis', icon: '🪑', sort_order: 4 },
              { id: 'servicos', name: 'Serviços', slug: 'servicos', icon: '🔧', sort_order: 5 },
              { id: 'outros', name: 'Outros', slug: 'outros', icon: '📦', sort_order: 6 }
            ]);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        // Fallback para categorias básicas
        setCategories([
          { id: 'carros', name: 'Carros', slug: 'carros', icon: '🚗', sort_order: 1 },
          { id: 'imoveis', name: 'Imóveis', slug: 'imoveis', icon: '🏠', sort_order: 2 },
          { id: 'eletronicos', name: 'Eletrônicos', slug: 'eletronicos', icon: '📱', sort_order: 3 },
          { id: 'moveis', name: 'Móveis', slug: 'moveis', icon: '🪑', sort_order: 4 },
          { id: 'servicos', name: 'Serviços', slug: 'servicos', icon: '🔧', sort_order: 5 },
          { id: 'outros', name: 'Outros', slug: 'outros', icon: '📦', sort_order: 6 }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);
  
  // Verificar autenticação
  useEffect(() => {
    const checkAuth = () => {
      if (!userId) {
        alert('Você precisa estar logado para criar um anúncio');
        router.push('/login');
        return;
      }
      
      // Preencher telefone e WhatsApp do usuário se disponíveis
      const userPhone = localStorage.getItem('userPhone') || '';
      const userWhatsapp = localStorage.getItem('userWhatsapp') || '';
      
      if (userPhone || userWhatsapp) {
        setFormData(prev => ({
          ...prev,
          phone: userPhone,
          whatsapp: userWhatsapp || userPhone
        }));
      }
    };
    
    checkAuth();
  }, [router]);
  
  const states = [
    { id: 'MA', name: 'Maranhão' },
    { id: 'SP', name: 'São Paulo' },
    { id: 'RJ', name: 'Rio de Janeiro' },
    { id: 'MG', name: 'Minas Gerais' },
    { id: 'BA', name: 'Bahia' },
    { id: 'RS', name: 'Rio Grande do Sul' }
  ];
  
  // Lista de cidades do Maranhão
  const citiesMA = [
    'Barra do Corda',
    'Fernando Falcão',
    'Jenipapo dos Vieiras',
    'Presidente Dutra',
    'Grajaú',
    'Formosa da Serra Negra',
    'Itaipava do Grajaú',
    'Esperantinópolis'
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo quando o usuário começa a digitar novamente
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value) {
      // Converte para número e formata com duas casas decimais
      const numberValue = parseFloat(value) / 100;
      value = numberValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    setFormData({
      ...formData,
      price: value
    });
    
    if (errors.price) {
      setErrors({
        ...errors,
        price: ''
      });
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limitar a 10 imagens no total
      if (formData.images.length + selectedFiles.length > 10) {
        setErrors({
          ...errors,
          images: 'Você só pode adicionar até 10 imagens'
        });
        return;
      }
      
      const newImages = [...formData.images, ...selectedFiles];
      setFormData({
        ...formData,
        images: newImages
      });
      
      // Criar URLs para preview das imagens
      const newImageURLs = selectedFiles.map(file => URL.createObjectURL(file));
      setImageURLs([...imageURLs, ...newImageURLs]);
      
      if (errors.images) {
        setErrors({
          ...errors,
          images: ''
        });
      }
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    const newImageURLs = [...imageURLs];
    
    // Liberar URL do objeto
    URL.revokeObjectURL(newImageURLs[index]);
    
    newImages.splice(index, 1);
    newImageURLs.splice(index, 1);
    
    setFormData({
      ...formData,
      images: newImages
    });
    setImageURLs(newImageURLs);
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (!formData.category) {
      newErrors.category = 'Escolha uma categoria';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!formData.price) {
      newErrors.price = 'Preço é obrigatório';
    }
    
    if (!formData.state) {
      newErrors.state = 'Estado é obrigatório';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }
    
    if (formData.images.length === 0) {
      newErrors.images = 'Adicione pelo menos uma imagem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const uploadImagesToSupabase = async () => {
    const uploadedUrls: string[] = [];
    
    for (const file of formData.images) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const { url } = await response.json();
          uploadedUrls.push(url);
        } else {
          console.error('Erro ao fazer upload da imagem');
          // Em caso de erro, usar imagem padrão
          uploadedUrls.push('/images/no-image.png');
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        uploadedUrls.push('/images/no-image.png');
      }
    }
    
    return uploadedUrls;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!isAuthenticated) {
      alert('Você precisa estar logado para criar um anúncio');
      router.push('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Fazer upload das imagens primeiro
      const imageUrls = await uploadImagesToSupabase();
      
      // Preparar dados do anúncio
      const adData = {
        userId,
        title: formData.title,
        description: formData.description,
        price: formData.price.replace(/\./g, '').replace(',', '.'),
        category: formData.category,
        subCategory: '',
        images: imageUrls.length > 0 ? imageUrls : ['/images/no-image.png'],
        location: `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        zipCode: '',
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone
      };
      
      console.log('Enviando anúncio:', adData);
      
      // Enviar para a API
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('Anúncio criado com sucesso! Ele será revisado antes de ser publicado.');
        
        // Redirecionar para meus anúncios ou página inicial
        if (userId && userId.startsWith('temp-id-')) {
          router.push('/');
        } else {
          router.push('/painel-anunciante/meus-anuncios');
        }
      } else {
        throw new Error(result.error || 'Erro ao criar anúncio');
      }
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      alert('Ocorreu um erro ao criar o anúncio. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
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
  
  return (
    <div className="bg-gray-900 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-gray-400 hover:text-primary">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">Criar novo anúncio</h1>
          <p className="mt-2 text-gray-400">
            Anuncie seu produto ou serviço gratuitamente
          </p>
        </div>
        
        {!isAuthenticated ? (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-300">
              Você precisa estar logado para criar um anúncio. 
              <Link href="/login" className="ml-2 underline hover:text-yellow-200">
                Fazer login
              </Link>
            </p>
          </div>
        ) : null}
        
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Título */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 bg-gray-700 border ${
                    errors.title ? 'border-red-500' : 'border-gray-600'
                  } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                  placeholder="Ex: iPhone 12 Pro Max 256GB"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>
              
              {/* Categoria */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300">
                  Categoria *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 bg-gray-700 border ${
                    errors.category ? 'border-red-500' : 'border-gray-600'
                  } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>
              
              {/* Descrição */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                  Descrição *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 bg-gray-700 border ${
                    errors.description ? 'border-red-500' : 'border-gray-600'
                  } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                  placeholder="Descreva o seu produto ou serviço detalhadamente"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Inclua informações relevantes como estado de conservação, cor, modelo, etc.
                </p>
              </div>
              
              {/* Preço */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300">
                  Preço *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">R$</span>
                  </div>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    className={`block w-full pl-10 p-3 bg-gray-700 border ${
                      errors.price ? 'border-red-500' : 'border-gray-600'
                    } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                    placeholder="0,00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                )}
              </div>
              
              {/* Localização */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-300">
                    Estado *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full p-3 bg-gray-700 border ${
                      errors.state ? 'border-red-500' : 'border-gray-600'
                    } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                  >
                    <option value="">Selecione um estado</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300">
                    Cidade *
                  </label>
                  {formData.state === 'MA' ? (
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full p-3 bg-gray-700 border ${
                        errors.city ? 'border-red-500' : 'border-gray-600'
                      } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                    >
                      <option value="">Selecione uma cidade</option>
                      {citiesMA.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full p-3 bg-gray-700 border ${
                        errors.city ? 'border-red-500' : 'border-gray-600'
                      } rounded-md text-white shadow-sm focus:ring-primary focus:border-primary`}
                      placeholder="Sua cidade"
                    />
                  )}
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
              </div>
              
              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    Telefone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:ring-primary focus:border-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="mt-1 block w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:ring-primary focus:border-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              {/* Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Imagens * (máx. 10)
                </label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Preview das imagens */}
                  {imageURLs.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-700">
                        <Image
                          src={cleanImageUrl(url)}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                          width={200}
                          height={200}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white hover:bg-opacity-80"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botão para adicionar imagens */}
                  {formData.images.length < 10 && (
                    <label className="cursor-pointer">
                      <div className="aspect-w-1 aspect-h-1 w-full flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg hover:border-primary">
                        <div className="text-center p-4">
                          <FaCamera className="mx-auto h-8 w-8 text-gray-500" />
                          <p className="mt-2 text-sm text-gray-400">Adicionar foto</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                {errors.images && (
                  <p className="mt-1 text-sm text-red-500">{errors.images}</p>
                )}
                
                <p className="mt-2 flex items-center text-xs text-gray-500">
                  <FaInfoCircle className="mr-1" />
                  A primeira imagem será a capa do seu anúncio
                </p>
              </div>
              
              {/* Termos e alerta */}
              <div className="bg-gray-700 rounded-lg p-4 text-sm text-gray-300">
                <p>
                  Ao publicar seu anúncio, você concorda com nossos{' '}
                  <Link href="/termos-uso" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/politica-privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                </p>
                <p className="mt-2">
                  Seu anúncio será revisado antes de ser publicado. Anúncios gratuitos ficam ativos por 90 dias.
                </p>
              </div>
              
              {/* Botão de envio */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isAuthenticated}
                  className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black ${
                    isSubmitting || !isAuthenticated
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-light'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                >
                  {isSubmitting ? 'Enviando...' : 'Publicar anúncio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAdPage; 