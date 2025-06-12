"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaArrowLeft, FaBullhorn, FaCreditCard, FaBarcode, FaQrcode,
  FaCheckCircle, FaExclamationTriangle, FaStar, FaCalendarAlt,
  FaClock, FaEye, FaInfoCircle, FaTags, FaPalette, FaGlobe
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { SubscriptionPlan } from '../../models/types';
import { getSubscriptionLimits, calculateFeaturePrice } from '../../config/subscription-limits';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  location: string;
  status: string;
  moderation_status: string;
  images: string[];
  created_at: string;
  views_count?: number;
}

const DestacarAnuncioPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'cartao'>('pix');
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
  const [featuredPrice, setFeaturedPrice] = useState(14.90);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expiryDate: '',
    cvv: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: ''
  });

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          toast.error('Você precisa estar logado para destacar anúncios');
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        if (!data.authenticated) {
          toast.error('Sessão expirada. Faça login novamente.');
          router.push('/auth/login');
          return;
        }

        setUserEmail(data.user.email);
        setUserName(data.user.name || data.user.email.split('@')[0]);
        setUserPlan(data.user.subscription || SubscriptionPlan.FREE);

        // Carregar anúncios do usuário
        await loadUserAds(data.user.id);

      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        toast.error('Erro ao carregar dados do usuário');
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  // Carregar anúncios do usuário
  const loadUserAds = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/ads?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar anúncios');
      }

      const result = await response.json();
      
      // Filtrar apenas anúncios ativos e aprovados que podem ser destacados
      const eligibleAds = (result.ads || []).filter((ad: Advertisement) => 
        ad.status === 'active' && ad.moderation_status === 'approved'
      );
      
      setAds(eligibleAds);
      
      if (eligibleAds.length === 0) {
        toast.error('Você não tem anúncios ativos para destacar');
      }

    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toast.error('Erro ao carregar seus anúncios');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular preço do destaque
  useEffect(() => {
    if (userPlan) {
      const limits = getSubscriptionLimits(userPlan);
      setFeaturedPrice(limits.featuredPrice);
    }
  }, [userPlan]);

  // Processar pagamento do destaque
  const handlePayment = async () => {
    if (!selectedAd) {
      toast.error('Selecione um anúncio para destacar');
      return;
    }

    if (paymentMethod === 'cartao' && (!cardData.number || !cardData.holderName || !cardData.expiryDate || !cardData.cvv)) {
      toast.error('Preencha todos os dados do cartão');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Criar/atualizar customer no Asaas
      const customerResponse = await fetch('/api/payments/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          cpfCnpj: cardData.cpfCnpj || '',
          phone: '',
          postalCode: cardData.postalCode || '',
          address: '',
          addressNumber: cardData.addressNumber || '',
          complement: '',
          province: '',
          externalReference: `user_${Date.now()}`
        }),
      });

      if (!customerResponse.ok) {
        throw new Error('Erro ao processar dados do cliente');
      }

      const customerData = await customerResponse.json();

      // 2. Criar cobrança para o destaque
      const chargeData = {
        customer: customerData.customer.id,
        billingType: paymentMethod === 'cartao' ? 'CREDIT_CARD' : paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
        value: featuredPrice,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Destaque para anúncio: ${selectedAd.title}`,
        externalReference: `featured_${selectedAd.id}_${Date.now()}`,
        ...(paymentMethod === 'cartao' && {
          creditCard: {
            holderName: cardData.holderName,
            number: cardData.number,
            expiryMonth: cardData.expiryDate.split('/')[0],
            expiryYear: cardData.expiryDate.split('/')[1],
            ccv: cardData.cvv
          },
          creditCardHolderInfo: {
            name: cardData.holderName,
            email: userEmail,
            cpfCnpj: cardData.cpfCnpj,
            postalCode: cardData.postalCode,
            addressNumber: cardData.addressNumber,
            phone: ''
          }
        })
      };

      const chargeResponse = await fetch('/api/payments/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(chargeData),
      });

      if (!chargeResponse.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const chargeResult = await chargeResponse.json();

      // 3. Criar destaque pendente no banco
      const highlightResponse = await fetch('/api/destaques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adId: selectedAd.id,
          type: 'paid_individual',
          duration: '3 days',
          price: featuredPrice,
          paymentId: chargeResult.charge.id,
          paymentMethod: paymentMethod,
          status: 'pending_payment'
        }),
      });

      if (!highlightResponse.ok) {
        throw new Error('Erro ao criar destaque');
      }

      // 4. Redirecionar para página de sucesso
      const redirectData = {
        paymentId: chargeResult.charge.id,
        adTitle: selectedAd.title,
        amount: featuredPrice,
        method: paymentMethod,
        ...(paymentMethod === 'pix' && {
          pixCode: chargeResult.charge.pixCode,
          pixQrCode: chargeResult.charge.pixQrCode
        }),
        ...(paymentMethod === 'boleto' && {
          invoiceUrl: chargeResult.charge.invoiceUrl
        })
      };

      // Salvar dados no localStorage para a página de sucesso
      localStorage.setItem('paymentResult', JSON.stringify(redirectData));
      
      toast.success('Pagamento processado! Redirecionando...');
      router.push('/painel-anunciante/destacar-anuncio/sucesso');

    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando seus anúncios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/painel-anunciante" className="text-gray-600 hover:text-gray-800 mr-4">
          <FaArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaBullhorn className="mr-3 text-amber-600" />
            Destacar Anúncio
          </h1>
          <p className="text-gray-600 mt-1">Dê mais visibilidade ao seu anúncio</p>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <FaExclamationTriangle className="mx-auto text-amber-600 text-4xl mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Nenhum anúncio disponível</h3>
          <p className="text-amber-700 mb-4">
            Você precisa ter anúncios ativos e aprovados para poder destacá-los.
          </p>
          <Link 
            href="/painel-anunciante/criar-anuncio"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-md transition-colors"
          >
            Criar Novo Anúncio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seleção de anúncio */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaTags className="mr-2 text-blue-600" />
                Selecione o anúncio para destacar
              </h2>
              
              <div className="space-y-3">
                {ads.map((ad) => (
                  <div 
                    key={ad.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAd?.id === ad.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAd(ad)}
                  >
                    <div className="flex items-start space-x-3">
                      {ad.images && ad.images.length > 0 ? (
                        <Image
                          src={ad.images[0]}
                          alt={ad.title}
                          width={80}
                          height={60}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-20 h-15 bg-gray-200 rounded-md flex items-center justify-center">
                          <FaTags className="text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 line-clamp-2">{ad.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {ad.category} • {ad.location}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <FaEye className="mr-1" />
                          {ad.views_count || 0} visualizações
                        </div>
                      </div>
                      
                      {selectedAd?.id === ad.id && (
                        <FaCheckCircle className="text-blue-600 text-xl" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações sobre destaque */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
                <FaStar className="mr-2" />
                Benefícios do Destaque
              </h3>
              <ul className="space-y-2 text-amber-700">
                <li className="flex items-start">
                  <FaGlobe className="mr-2 mt-0.5 text-amber-600" />
                  <span>Aparece no topo das buscas</span>
                </li>
                <li className="flex items-start">
                  <FaPalette className="mr-2 mt-0.5 text-amber-600" />
                  <span>Visual diferenciado com bordas douradas</span>
                </li>
                <li className="flex items-start">
                  <FaEye className="mr-2 mt-0.5 text-amber-600" />
                  <span>Até 300% mais visualizações</span>
                </li>
                <li className="flex items-start">
                  <FaClock className="mr-2 mt-0.5 text-amber-600" />
                  <span>Duração de 3 dias</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Área de pagamento */}
          <div className="space-y-6">
            {selectedAd && (
              <>
                {/* Resumo */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Destaque</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anúncio:</span>
                      <span className="font-medium text-right max-w-xs truncate">{selectedAd.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">3 dias</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plano atual:</span>
                      <span className="font-medium">
                        {userPlan === SubscriptionPlan.FREE ? 'Gratuito' : 
                         userPlan === SubscriptionPlan.MICRO_BUSINESS ? 'Micro Empresa' :
                         userPlan === SubscriptionPlan.SMALL_BUSINESS ? 'Pequena Empresa' :
                         userPlan === SubscriptionPlan.BUSINESS_SIMPLE ? 'Empresa Simples' :
                         'Empresa Plus'}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {featuredPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Método de pagamento */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Método de Pagamento</h2>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'pix' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaQrcode className="mx-auto mb-2" />
                      <span className="text-sm font-medium">PIX</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('boleto')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'boleto' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaBarcode className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Boleto</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('cartao')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'cartao' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaCreditCard className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Cartão</span>
                    </button>
                  </div>

                  {/* Formulário de cartão */}
                  {paymentMethod === 'cartao' && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número do cartão
                          </label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.number}
                            onChange={(e) => setCardData({...cardData, number: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome no cartão
                          </label>
                          <input
                            type="text"
                            placeholder="Nome completo"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.holderName}
                            onChange={(e) => setCardData({...cardData, holderName: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Validade
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.expiryDate}
                            onChange={(e) => setCardData({...cardData, expiryDate: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/CNPJ
                          </label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.cpfCnpj}
                            onChange={(e) => setCardData({...cardData, cpfCnpj: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CEP
                          </label>
                          <input
                            type="text"
                            placeholder="00000-000"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={cardData.postalCode}
                            onChange={(e) => setCardData({...cardData, postalCode: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botão de pagamento */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      `Destacar por R$ ${featuredPrice.toFixed(2)}`
                    )}
                  </button>

                  {/* Informações adicionais */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p><strong>PIX:</strong> Confirmação instantânea</p>
                        <p><strong>Boleto:</strong> Compensação em até 3 dias úteis</p>
                        <p><strong>Cartão:</strong> Aprovação em até 24 horas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DestacarAnuncioPage; 