'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan, BusinessCategory, businessCategoryNames } from '../../../models/types';
import { FaCheckCircle, FaCreditCard, FaSpinner, FaBarcode, FaQrcode, FaTimes, FaArrowLeft, FaInfoCircle, FaRegCreditCard, FaTags } from 'react-icons/fa';
import Link from 'next/link';
import { calculateTrialEndDate, isEligibleForTrial } from '../../../lib/subscriptionHelper';
import BusinessCategoriesSelector from './BusinessCategoriesSelector';
import { useSupabase } from '../../../components/SupabaseProvider';

interface SubscriptionCheckoutProps {
  planId: SubscriptionPlan;
  planName: string;
  planPrice: number;
  planFeatures: string[];
}

export default function SubscriptionCheckout({ 
  planId, 
  planName, 
  planPrice, 
  planFeatures 
}: SubscriptionCheckoutProps) {
  const router = useRouter();
  const { isAuthenticated, userId } = useSupabase();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'boleto' | 'pix'>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [trialEligible, setTrialEligible] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [showCategoriesSelector, setShowCategoriesSelector] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<BusinessCategory[]>([]);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const isPaidPlan = planId !== SubscriptionPlan.FREE;
  
  useEffect(() => {
    // Verificar se usuário está autenticado
    if (!isAuthenticated || !userId) {
      console.log('❌ Usuário não autenticado, redirecionando para login');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    
    // Buscar dados do usuário via API
    const fetchUserProfile = async () => {
      try {
        console.log('🔍 Buscando dados do usuário:', userId);
        
        const response = await fetch(`/api/users/profile?userId=${userId}`);
        
        if (!response.ok) {
          console.error('Erro ao buscar perfil do usuário');
          return;
        }
        
        const { profile } = await response.json();
        console.log('✅ Dados do usuário carregados:', profile);
        setUserProfile(profile);
        
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      }
    };
    
    // Verificar elegibilidade para trial
    const checkTrialEligibility = async () => {
      const eligible = await isEligibleForTrial(userId);
      setTrialEligible(eligible);
      
      if (eligible && planId) {
        const endDate = calculateTrialEndDate(planId as SubscriptionPlan);
        setTrialEndDate(endDate);
      }
    };
    
    fetchUserProfile();
    checkTrialEligibility();
  }, [planId, userId, isAuthenticated, router]);

  // Formatação de cartão de crédito
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < numbers.length; i += 4) {
      groups.push(numbers.slice(i, i + 4));
    }
    
    return groups.join(' ').slice(0, 19);
  };
  
  // Formatação de data de expiração
  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };
  
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPixQrCode(null);
    setPixPayload(null);
    setBoletoUrl(null);
    
    if (!isAuthenticated || !userId) {
      setError('Você precisa estar logado para fazer uma assinatura.');
      return;
    }
    
    if (paymentMethod === 'credit') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        setError('Por favor, preencha todos os campos do cartão de crédito.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      console.log('🚀 Iniciando criação de assinatura REAL no ASAAS...');
      
      // PASSO 1: Criar/verificar cliente no ASAAS
      console.log('👤 Criando cliente no ASAAS...');
      
      // Verificar se temos dados do usuário
      if (!userProfile) {
        setError('Erro: Dados do usuário não carregados. Recarregue a página.');
        return;
      }
      
      // Verificar se temos pelo menos email
      if (!userProfile.email) {
        setError('Erro: Email do usuário não encontrado. Complete seu perfil primeiro.');
        return;
      }
      
      const customerResponse = await fetch('/api/payments/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          name: cardName || userProfile.name || 'Cliente BDC',
          email: userProfile.email,
          phone: userProfile.phone || undefined,
          cpfCnpj: userProfile.cpf_cnpj || undefined,
        })
      });

      if (!customerResponse.ok) {
        const customerError = await customerResponse.json();
        throw new Error(customerError.error || 'Erro ao criar cliente');
      }

      const { customer } = await customerResponse.json();
      console.log('✅ Cliente criado/encontrado:', customer.asaas_customer_id);

      // PASSO 2: Criar assinatura REAL no ASAAS
      console.log('💳 Criando assinatura REAL no ASAAS...');
      const billingType = paymentMethod === 'credit' ? 'CREDIT_CARD' : 
                         paymentMethod === 'boleto' ? 'BOLETO' : 'PIX';

      const subscriptionPayload = {
        userId: userId,
        planType: planId,
        billingType,
        cycle: 'MONTHLY',
        creditCard: paymentMethod === 'credit' ? {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: expiryDate.split('/')[0],
          expiryYear: '20' + expiryDate.split('/')[1],
          ccv: cvv
        } : undefined,
        creditCardHolderInfo: paymentMethod === 'credit' ? {
          name: cardName || userProfile.name,
          email: userProfile.email,
          cpfCnpj: userProfile.cpf_cnpj || undefined,
          postalCode: undefined, // Será solicitado no futuro se necessário
          addressNumber: undefined, // Será solicitado no futuro se necessário
          phone: userProfile.phone || undefined
        } : undefined
      };

      console.log('📋 Payload da assinatura:', subscriptionPayload);

      const subscriptionResponse = await fetch('/api/payments/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionPayload)
      });

      if (!subscriptionResponse.ok) {
        const subscriptionError = await subscriptionResponse.json();
        console.error('❌ Erro na resposta da API:', subscriptionError);
        throw new Error(subscriptionError.error || 'Erro ao criar assinatura');
      }

      const result = await subscriptionResponse.json();
      console.log('✅ Assinatura criada com sucesso:', result);
      
      setSubscriptionData(result.subscription);

      // PASSO 3: Processar resposta baseada no método de pagamento
      if (paymentMethod === 'pix') {
        if (result.subscription.pix_qr_code || result.subscription.pix_payload) {
          console.log('🔗 Dados PIX recebidos');
          setPixQrCode(result.subscription.pix_qr_code);
          setPixPayload(result.subscription.pix_payload);
          setPaymentProcessed(true);
        } else {
          setError('Erro: QR Code PIX não foi gerado. Tente novamente.');
          setLoading(false);
          return;
        }
      } else if (paymentMethod === 'boleto') {
        if (result.subscription.boleto_url) {
          console.log('📄 URL do boleto recebida');
          setBoletoUrl(result.subscription.boleto_url);
          setPaymentProcessed(true);
        } else {
          setError('Erro: Boleto não foi gerado. Tente novamente.');
          setLoading(false);
          return;
        }
      } else if (paymentMethod === 'credit') {
        console.log('💳 Pagamento com cartão processado');
        
        // Para cartão de crédito, verificar se foi aprovado
        if (result.subscription.status === 'ACTIVE') {
          setPaymentProcessed(true);
          if (isPaidPlan) {
            setShowCategoriesSelector(true);
          } else {
            setSuccess(true);
            setTimeout(() => {
              router.push('/painel-anunciante');
            }, 3000);
          }
        } else {
          setError('Pagamento não foi aprovado. Verifique os dados do cartão e tente novamente.');
          setLoading(false);
          return;
        }
      } else {
        // Plano gratuito
        setPaymentProcessed(true);
        if (isPaidPlan) {
          setShowCategoriesSelector(true);
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push('/painel-anunciante');
          }, 3000);
        }
      }

    } catch (e) {
      console.error('❌ Erro ao processar pagamento:', e);
      setError(`Erro ao processar pagamento: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      setLoading(false);
    }
  };
  
  const handleSaveCategories = async (categories: BusinessCategory[]) => {
    setLoading(true);
    
    try {
      setSelectedCategories(categories);
      
      // Salvar categorias no servidor
      const response = await fetch('/api/business/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          categories
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao salvar categorias');
      }
      
      setShowCategoriesSelector(false);
      setSuccess(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/painel-anunciante');
      }, 3000);
      
    } catch (e) {
      console.error('Erro ao salvar categorias:', e);
      setError(`Erro ao salvar categorias: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Componente para exibir QR Code PIX
  const PixPaymentStep = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <div className="mb-6">
        <FaQrcode className="text-blue-600 text-6xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento via PIX</h2>
        <p className="text-gray-600 mb-4">
          Escaneie o QR Code abaixo ou copie o código PIX para realizar o pagamento
        </p>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-4">
          {pixQrCode ? (
            <div>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img 
                  src={`data:image/png;base64,${pixQrCode}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <button
                onClick={() => {
                  const textToCopy = pixPayload || pixQrCode || '';
                  navigator.clipboard.writeText(textToCopy);
                  alert('Código PIX copiado!');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Copiar Código PIX
              </button>
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="bg-gray-300 w-48 h-48 mx-auto rounded-lg mb-4"></div>
              <p className="text-gray-500">Gerando QR Code...</p>
            </div>
          )}
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <FaInfoCircle className="text-yellow-600 inline mr-2" />
          <span className="text-yellow-800 text-sm">
            Após o pagamento, sua assinatura será ativada automaticamente em até 5 minutos.
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <button
          onClick={() => {
            setPaymentProcessed(false);
            setPixQrCode(null);
            setPixPayload(null);
            setLoading(false);
          }}
          className="inline-flex items-center justify-center text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Já Paguei - Verificar Status
        </button>
      </div>
    </div>
  );

  // Componente para exibir Boleto
  const BoletoPaymentStep = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <div className="mb-6">
        <FaBarcode className="text-green-600 text-6xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento via Boleto</h2>
        <p className="text-gray-600 mb-4">
          Clique no botão abaixo para abrir seu boleto e realizar o pagamento
        </p>
        
        {boletoUrl ? (
          <div className="mb-4">
            <a
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block"
            >
              Abrir Boleto
            </a>
          </div>
        ) : (
          <div className="animate-pulse mb-4">
            <div className="bg-gray-300 w-32 h-10 mx-auto rounded-lg"></div>
            <p className="text-gray-500 mt-2">Gerando boleto...</p>
          </div>
        )}
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <FaInfoCircle className="text-yellow-600 inline mr-2" />
          <span className="text-yellow-800 text-sm">
            Após o pagamento, sua assinatura será ativada em até 3 dias úteis.
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <button
          onClick={() => {
            setPaymentProcessed(false);
            setBoletoUrl(null);
            setLoading(false);
          }}
          className="inline-flex items-center justify-center text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Já Paguei - Verificar Status
        </button>
      </div>
    </div>
  );

  // Se processando PIX, mostrar QR Code
  if (paymentProcessed && paymentMethod === 'pix') {
    return <PixPaymentStep />;
  }

  // Se processando Boleto, mostrar boleto
  if (paymentProcessed && paymentMethod === 'boleto') {
    return <BoletoPaymentStep />;
  }
  
  if (showCategoriesSelector) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quase lá!</h2>
          <p className="text-gray-600 mb-4">
            Sua assinatura do plano {planName} foi processada com sucesso. Para finalizar, selecione os ramos de atividade da sua empresa para o classificado.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <FaTags className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Incluso em seu plano:</h3>
                <p className="text-sm text-blue-600">
                  Seu negócio será exibido no classificado do BuscaAquiBDC, aumentando sua visibilidade para potenciais clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <BusinessCategoriesSelector
          onSave={handleSaveCategories}
          onCancel={() => {
            // Se cancelar, finaliza sem salvar categorias
            setSuccess(true);
            setTimeout(() => {
              router.push('/painel-anunciante');
            }, 3000);
          }}
          initialCategories={selectedCategories}
          maxSelections={3}
        />
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <FaCheckCircle className="text-green-600 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Assinatura Confirmada!</h2>
          <p className="text-gray-600">
            Sua assinatura do plano {planName} foi realizada com sucesso.
          </p>
          {trialEligible && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 max-w-md">
              <div className="flex">
                <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-800 mb-1">30 dias grátis ativados!</h3>
                  <p className="text-sm text-blue-600">
                    Você tem acesso a todos os recursos do plano por 30 dias sem custo. 
                    Após esse período, será cobrado R$ {planPrice.toFixed(2).replace('.', ',')} mensalmente.
                  </p>
                  {trialEndDate && (
                    <p className="text-sm text-blue-600 mt-2">
                      <strong>Período grátis até:</strong> {trialEndDate.toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {selectedCategories.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 max-w-md w-full">
              <div className="flex">
                <FaTags className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-800 mb-1">Seu negócio no classificado!</h3>
                  <p className="text-sm text-blue-600 mb-2">
                    Seu perfil será exibido nos seguintes ramos de atividade:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((category) => (
                      <span 
                        key={category} 
                        className="inline-block bg-white text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200"
                      >
                        {businessCategoryNames[category]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 mt-2">
            Você agora é um <span className="font-bold text-blue-600">Parceiro Verificado</span> e terá acesso a todos os recursos disponíveis.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Você será redirecionado para o painel do anunciante em instantes...
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Checkout do Plano</h2>
          <Link href="/painel-anunciante/planos" className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </Link>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{planName}</h3>
          
          {trialEligible ? (
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold text-green-600">Grátis</span>
              <span className="text-gray-500 ml-2 text-sm">por 30 dias, depois</span>
              <span className="text-2xl font-bold text-gray-700 ml-2">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
              <span className="text-gray-500 ml-1 text-sm">/mês</span>
            </div>
          ) : (
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold text-gray-800">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
              <span className="text-gray-500 ml-1 text-sm">/mês</span>
            </div>
          )}
          
          {trialEligible && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800 mb-1">30 dias de teste grátis!</h3>
                  <p className="text-sm text-green-600">
                    Você não será cobrado durante os 30 dias iniciais. Cancele a qualquer momento antes do final do período de teste.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <ul className="mt-4 space-y-2">
            {planFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-600">
                <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Método de Pagamento</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${paymentMethod === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <FaQrcode className={`text-2xl mb-2 ${paymentMethod === 'pix' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'pix' ? 'text-blue-600' : 'text-gray-700'}`}>PIX</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('boleto')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${paymentMethod === 'boleto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <FaBarcode className={`text-2xl mb-2 ${paymentMethod === 'boleto' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'boleto' ? 'text-blue-600' : 'text-gray-700'}`}>Boleto</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <FaCreditCard className={`text-2xl mb-2 ${paymentMethod === 'credit' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'credit' ? 'text-blue-600' : 'text-gray-700'}`}>Cartão de Crédito</span>
              </button>
            </div>
            
            {paymentMethod === 'credit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <FaRegCreditCard className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full py-2 px-10 border border-gray-300 rounded-md focus:ring focus:ring-blue-100 focus:outline-none focus:border-blue-500"
                      maxLength={19}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão</label>
                  <input
                    type="text"
                    placeholder="Ex: JOSE DA SILVA"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Expiração</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-100 focus:outline-none focus:border-blue-500"
                      maxLength={5}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="000"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-100 focus:outline-none focus:border-blue-500"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="save-card"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="save-card" className="ml-2 block text-sm text-gray-700">
                    Salvar cartão para pagamentos futuros
                  </label>
                </div>
              </div>
            )}
            
            {paymentMethod === 'boleto' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Ao selecionar boleto, você receberá um boleto bancário que pode ser pago em qualquer agência bancária, internet banking ou casas lotéricas.
                </p>
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Importante:</span> Seu plano será ativado após a confirmação do pagamento, que pode levar até 3 dias úteis.
                  </p>
                </div>
              </div>
            )}
            
            {paymentMethod === 'pix' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Ao selecionar PIX, você receberá um QR Code na próxima tela para realizar o pagamento instantâneo.
                </p>
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Vantagem:</span> Seu plano será ativado assim que o pagamento for confirmado, geralmente em segundos.
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Link href="/painel-anunciante/planos" className="inline-flex items-center text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="mr-2" /> Voltar para planos
            </Link>
            
            <button
              type="submit"
              className={`px-6 py-3 rounded-md bg-green-600 text-white font-medium ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processando...
                </>
              ) : (
                `Confirmar ${trialEligible ? 'período de teste' : 'assinatura'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 