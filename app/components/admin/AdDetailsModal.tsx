"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaEye, 
  FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, 
  FaPhone, FaWhatsapp, FaEnvelope, FaUser, FaIdCard, 
  FaGlobe, FaHistory, FaBuilding, FaTag
} from 'react-icons/fa';

interface Seller {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt?: string;
  lastLogin?: string;
  isVerified?: boolean;
  accountType?: string;
  status?: string;
}

interface AdDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  images: string[];
  location?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  whatsapp?: string;
  showPhone?: boolean;
  isFreeAd?: boolean;
  isFeatured?: boolean;
  moderationStatus: string;
  moderationReason?: string;
  createdAt: string;
  updatedAt?: string;
  moderatedAt?: string;
  views: number;
  clicks: number;
  status: string;
  expiresAt?: string;
  sellerType?: string;
  seller: Seller;
}

interface AdDetailsModalProps {
  adId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function AdDetailsModal({ adId, isOpen, onClose, onApprove, onReject }: AdDetailsModalProps) {
  const [adDetails, setAdDetails] = useState<AdDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
  useEffect(() => {
    if (isOpen && adId) {
      fetchAdDetails();
    }
  }, [isOpen, adId]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Buscando detalhes do anúncio ID: ${adId}`);
      const response = await fetch(`/api/admin/ads/${adId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ao buscar detalhes do anúncio (${response.status}):`, errorText);
        throw new Error(`Erro ao buscar detalhes do anúncio: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.ad) {
        console.log(`Detalhes do anúncio ${adId} carregados com sucesso`);
        setAdDetails(data.ad);
      } else {
        console.error('Resposta da API sem dados de anúncio:', data);
        throw new Error(data.error || 'Erro ao carregar detalhes do anúncio');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes do anúncio';
      console.error('Erro ao buscar detalhes do anúncio:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (adDetails) {
      try {
        // Mostrar um efeito visual enquanto processamos a ação
        const button = document.querySelector('[data-action="approve"]') as HTMLButtonElement;
        if (button) {
          button.classList.add('opacity-70');
          button.innerText = 'Processando...';
          button.disabled = true;
        }
        
        // Chamar a função de aprovação
        onApprove(adDetails.id);
      } catch (error) {
        console.error('Erro ao aprovar anúncio:', error);
        
        // Reset do botão em caso de erro
        const button = document.querySelector('[data-action="approve"]') as HTMLButtonElement;
        if (button) {
          button.classList.remove('opacity-70');
          button.innerHTML = '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Publicar Anúncio';
          button.disabled = false;
        }
        
        // Mostrar uma mensagem de erro
        alert('Erro ao publicar anúncio. Por favor, tente novamente.');
      }
    }
  };

  const handleShowRejectForm = () => {
    setShowRejectionForm(true);
  };

  const handleReject = () => {
    if (adDetails && rejectionReason.trim()) {
      try {
        console.log(`Rejeitando anúncio ${adDetails.id} com motivo: ${rejectionReason}`);
        
        // Mostrar um efeito visual enquanto processamos a ação
        const button = document.querySelector('[data-action="confirm-reject"]') as HTMLButtonElement;
        if (button) {
          button.classList.add('opacity-70');
          button.innerText = 'Processando...';
          button.disabled = true;
        }
        
        // Chamar a função de rejeição
        onReject(adDetails.id, rejectionReason);
        
        // Limpar formulário
        setShowRejectionForm(false);
        setRejectionReason('');
      } catch (error) {
        console.error('Erro ao recusar anúncio:', error);
        
        // Reset do botão em caso de erro
        const button = document.querySelector('[data-action="confirm-reject"]') as HTMLButtonElement;
        if (button) {
          button.classList.remove('opacity-70');
          button.innerHTML = 'Confirmar Rejeição';
          button.disabled = false;
        }
        
        // Mostrar uma mensagem de erro
        alert('Erro ao recusar anúncio. Por favor, tente novamente.');
      }
    } else if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
    }
  };

  const handleCancel = () => {
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium text-gray-900">
            Detalhes Completos do Anúncio
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1"
          >
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <FaTimes size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar detalhes</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchAdDetails}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Tentar novamente
              </button>
            </div>
          ) : adDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna de Imagens */}
              <div className="md:col-span-2">
                <div className="relative h-72 bg-gray-200 rounded-lg overflow-hidden mb-4">
                  {adDetails.images.length > 0 ? (
                    <Image
                      src={adDetails.images[selectedImage]}
                      alt={adDetails.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>

                {adDetails.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {adDetails.images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative h-20 cursor-pointer rounded-md overflow-hidden border-2 ${
                          selectedImage === index ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <Image
                          src={cleanImageUrl(image)}
                          alt={`Imagem ${index + 1}`}
                          fill
                          sizes="80px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Informações do Anúncio */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{adDetails.title}</h2>
                  
                  <div className="flex items-center mb-4">
                    <div className="mr-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(adDetails.price)}
                      </span>
                    </div>
                    
                    {adDetails.isFeatured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                        Anúncio Destacado
                      </span>
                    )}
                    
                    {adDetails.isFreeAd && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium ml-2">
                        Anúncio Gratuito
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-6 text-gray-600 text-sm">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1 text-gray-400" />
                      <span>Publicado em {formatDate(adDetails.createdAt)}</span>
                    </div>
                    {adDetails.city && adDetails.state && (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-gray-400" />
                        <span>{adDetails.city}, {adDetails.state}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FaEye className="mr-1 text-gray-400" />
                      <span>{adDetails.views} visualizações</span>
                    </div>
                    <div className="flex items-center">
                      <FaExternalLinkAlt className="mr-1 text-gray-400" />
                      <span>{adDetails.clicks} cliques</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-700 whitespace-pre-line">{adDetails.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <FaTag className="mr-2 text-gray-500" />
                        Detalhes do Anúncio
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ID:</span>
                          <span className="font-medium">{adDetails.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Categoria:</span>
                          <span className="font-medium">{adDetails.category}</span>
                        </div>
                        {adDetails.subCategory && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subcategoria:</span>
                            <span className="font-medium">{adDetails.subCategory}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status do Anúncio:</span>
                          <span className={`font-medium ${
                            adDetails.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {adDetails.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status de Moderação:</span>
                          <span className={`font-medium ${
                            adDetails.moderationStatus === 'approved' ? 'text-green-600' : 
                            adDetails.moderationStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {adDetails.moderationStatus === 'approved' ? 'Publicado' : 
                             adDetails.moderationStatus === 'rejected' ? 'Recusado' : 'Pendente'}
                          </span>
                        </div>
                        {adDetails.moderationReason && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Motivo da Rejeição:</span>
                            <span className="font-medium text-red-600">{adDetails.moderationReason}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo de Vendedor:</span>
                          <span className="font-medium">
                            {adDetails.sellerType === 'business' ? 'Empresa' : 'Pessoa Física'}
                          </span>
                        </div>
                        {adDetails.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expira em:</span>
                            <span className="font-medium">{formatDate(adDetails.expiresAt)}</span>
                          </div>
                        )}
                        {adDetails.moderatedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Moderado em:</span>
                            <span className="font-medium">{formatDate(adDetails.moderatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-gray-500" />
                        Localização e Contato
                      </h4>
                      <div className="space-y-2 text-sm">
                        {adDetails.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Endereço:</span>
                            <span className="font-medium">{adDetails.location}</span>
                          </div>
                        )}
                        {adDetails.zipCode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">CEP:</span>
                            <span className="font-medium">{adDetails.zipCode}</span>
                          </div>
                        )}
                        {adDetails.phone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Telefone:</span>
                            <span className="font-medium">{adDetails.phone}</span>
                          </div>
                        )}
                        {adDetails.whatsapp && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">WhatsApp:</span>
                            <span className="font-medium">{adDetails.whatsapp}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mostrar Telefone:</span>
                          <span className="font-medium">{adDetails.showPhone ? 'Sim' : 'Não'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Coluna de Informações do Vendedor */}
              <div className="md:col-span-1">
                <div className="border border-gray-200 rounded-md p-4 sticky top-20">
                  <h4 className="font-medium mb-4 flex items-center border-b pb-2">
                    <FaUser className="mr-2 text-gray-500" />
                    Informações do Anunciante
                  </h4>
                  
                  <div className="flex items-center mb-4">
                    <a
                      href={`/loja/${adDetails.seller.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 mr-3 hover:ring-4 hover:ring-blue-200 transition-all cursor-pointer"
                      title={`Ver perfil completo de ${adDetails.seller.name}`}
                    >
                      <Image 
                        src={adDetails.seller.avatar || 'https://ui-avatars.io/api/?name=' + encodeURIComponent(adDetails.seller.name) + '&background=0d6efd&color=fff'} 
                        alt={adDetails.seller.name}
                        width={64}
                        height={64}
                        className="object-cover h-full w-full"
                      />
                    </a>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center">
                        <a
                          href={`/loja/${adDetails.seller.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                          title={`Ver perfil completo de ${adDetails.seller.name}`}
                        >
                          {adDetails.seller.name}
                        </a>
                        {adDetails.seller.isVerified && (
                          <FaCheckCircle className="text-blue-500 ml-1 text-sm" title="Usuário Verificado" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {adDetails.sellerType === 'business' ? 'Empresa' : 'Pessoa Física'}
                        <a
                          href={`/loja/${adDetails.seller.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 flex items-center text-xs"
                          title="Ver perfil completo"
                        >
                          <FaExternalLinkAlt className="mr-1" />
                          Ver perfil
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm mb-6">
                    {adDetails.seller.email && (
                      <div className="flex items-start">
                        <FaEnvelope className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div>{adDetails.seller.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.phone && (
                      <div className="flex items-start">
                        <FaPhone className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Telefone</div>
                          <div>{adDetails.seller.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.location && (
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Localização</div>
                          <div>{adDetails.seller.location}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.website && (
                      <div className="flex items-start">
                        <FaGlobe className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Website</div>
                          <div>{adDetails.seller.website}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.accountType && (
                      <div className="flex items-start">
                        <FaIdCard className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Tipo de Conta</div>
                          <div className="capitalize">{adDetails.seller.accountType}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.createdAt && (
                      <div className="flex items-start">
                        <FaCalendarAlt className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Conta Criada em</div>
                          <div>{formatDate(adDetails.seller.createdAt)}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.lastLogin && (
                      <div className="flex items-start">
                        <FaHistory className="text-gray-400 mr-2 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500">Último Acesso</div>
                          <div>{formatDate(adDetails.seller.lastLogin)}</div>
                        </div>
                      </div>
                    )}
                    
                    {adDetails.seller.status && (
                      <div className="flex items-start">
                        <FaCheckCircle className={`${
                          adDetails.seller.status === 'active' ? 'text-green-500' : 'text-red-500'
                        } mr-2 mt-1`} />
                        <div>
                          <div className="text-xs text-gray-500">Status da Conta</div>
                          <div className={`capitalize ${
                            adDetails.seller.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {adDetails.seller.status === 'active' ? 'Ativa' : 'Inativa'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {adDetails.seller.bio && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium mb-1">Sobre o Anunciante</h5>
                      <p className="text-sm text-gray-600">{adDetails.seller.bio}</p>
                    </div>
                  )}
                  
                  {/* Ações de Moderação */}
                  {adDetails.moderationStatus === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium mb-3">Ações</h4>
                      
                      {showRejectionForm ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo da Rejeição
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            rows={4}
                            placeholder="Descreva o motivo da rejeição"
                          />
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={handleReject}
                              disabled={!rejectionReason.trim()}
                              className={`px-3 py-2 rounded-md text-sm font-medium text-white ${
                                rejectionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
                              }`}
                              data-action="confirm-reject"
                            >
                              Confirmar Rejeição
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleApprove}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center justify-center"
                            data-action="approve"
                          >
                            <FaCheckCircle className="mr-1" /> Publicar Anúncio
                          </button>
                          <button
                            onClick={handleShowRejectForm}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium flex items-center justify-center"
                            data-action="reject"
                          >
                            <FaTimesCircle className="mr-1" /> Recusar Anúncio
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">Nenhum dado disponível</div>
          )}
        </div>
      </div>
    </div>
  );
} 