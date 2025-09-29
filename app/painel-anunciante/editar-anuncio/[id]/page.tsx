"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  FaArrowLeft, FaImages, FaMapMarkerAlt, FaCheckCircle, FaPhoneAlt, FaWhatsapp, 
  FaInfoCircle, FaHourglassHalf, FaEdit, FaSave
} from 'react-icons/fa';
import { generateUUID, uploadImageToSupabase } from '../../../lib/utils';
import { getSupabaseClient } from '../../../lib/supabase';

export default function EditarAnuncio() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<any>(null);
  
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
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

  // Carregar dados do anúncio
  useEffect(() => {
    const fetchAdData = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          setError('Você precisa estar logado para editar anúncios');
          return;
        }

        // Buscar anúncio via API
        const response = await fetch(`/api/ads?userId=${userId}&status=all`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar anúncio');
        }

        // Encontrar o anúncio específico
        const ad = data.ads.find((ad: any) => ad.id === adId);
        
        if (!ad) {
          setError('Anúncio não encontrado ou você não tem permissão para editá-lo');
          return;
        }

        // Preencher dados do formulário
        setAdData(ad);
        setCategory(ad.category || '');
        setSubCategory(ad.sub_category || 'Geral');
        setImages(Array.isArray(ad.images) ? ad.images : []);
        
        setFormData({
          title: ad.title || '',
          description: ad.description || '',
          price: typeof ad.price === 'number' ? ad.price.toString() : ad.price || '',
          location: ad.location || '',
          state: 'MA',
          city: ad.city || '',
          zipCode: ad.zip_code || '',
          phone: ad.phone || ad.contact_phone || '',
          whatsapp: ad.whatsapp || ad.contact_whatsapp || '',
          showPhone: true
        });

      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
        setError('Erro ao carregar dados do anúncio');
      } finally {
        setLoading(false);
      }
    };

    if (adId) {
      fetchAdData();
    }
  }, [adId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > 10) {
      alert('Limite máximo de 10 fotos por anúncio. Selecione menos imagens.');
      return;
    }
    
    const processingImages: string[] = [];
    
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      processingImages.push(objectUrl);
    });
    
    setImages(prev => [...prev, ...processingImages]);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempUrl = processingImages[i];
      
      try {
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
        
        const { data: urlData } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          setImages(prev => prev.map(img => img === tempUrl ? urlData.publicUrl : img));
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
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
    
    if (name === 'price') {
      let numericValue = value.replace(/\D/g, '');
      
      if (!numericValue) {
        setFormData({
          ...formData,
          [name]: ''
        });
        return;
      }
      
      const cents = parseInt(numericValue, 10);
      const reais = cents / 100;
      
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
    
    if (name === 'city') {
      setFormData({
        ...formData,
        city: value,
        location: value ? `${value} - MA` : ''
      });
      return;
    }
    
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError('Você precisa estar logado para editar anúncios');
        return;
      }

      if (!formData.title || !formData.description || !category || !formData.city) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      let priceValue = formData.price;
      if (typeof priceValue === 'string') {
        priceValue = priceValue.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
      }

      const finalImages = images.length > 0 ? images : ['/images/no-image.png'];

      const updateData = {
        adId: adId,
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
        zip_code: formData.zipCode, // Usando snake_case correto
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        // Volta para moderação quando editado
        moderation_status: 'pending',
        status: 'pending'
      };

      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
        
      if (!response.ok) {
        throw new Error(result.error);
      }

      alert('Anúncio atualizado com sucesso! Ele passará por nova moderação.');
      router.push('/painel-anunciante/meus-anuncios?updated=success');

    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      setError('Ocorreu um erro ao atualizar o anúncio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
          <div className="mt-4">
            <Link href="/painel-anunciante/meus-anuncios" className="text-red-600 hover:text-red-800 underline">
              Voltar para meus anúncios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/painel-anunciante/meus-anuncios" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para meus anúncios
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Editar anúncio</h1>
        <p className="text-gray-600">Faça as alterações necessárias no seu anúncio</p>
      </div>

      {/* Aviso sobre moderação */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <FaInfoCircle className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Sobre a edição de anúncios</h3>
            <p className="text-sm text-gray-600">
              Quando você edita um anúncio, ele voltará para status "Pendente de Moderação" e precisará ser aprovado novamente pela equipe antes de ficar visível para outros usuários.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Categoria */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setSubCategory('Geral');
                  }}
                  className={`p-4 rounded-lg border ${category === cat.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} transition-colors text-left`}
                >
                  <h3 className="font-medium text-gray-800">{cat.name}</h3>
                </button>
              ))}
            </div>
          </div>

          {/* Imagens */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Imagens</h2>
            
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
                <p className="text-sm font-medium text-amber-600">{images.length}/10 fotos</p>
              </label>
            </div>
            
            {images.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Imagens do anúncio</h3>
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

          {/* Informações do anúncio */}
          <div className="mb-6">
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

          {/* Contato */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Informações de Contato</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="whatsapp">
                  WhatsApp*
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
                    required
                  />
                </div>
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
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-between">
          <Link
            href="/painel-anunciante/meus-anuncios"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.description || !category || !formData.city}
            className={`px-4 py-2 rounded-md font-medium ${
              isSubmitting || !formData.title || !formData.description || !category || !formData.city
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isSubmitting ? (
              <>
                <FaHourglassHalf className="inline mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <FaSave className="inline mr-2" />
                Salvar alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 