'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan, BusinessCategory, businessCategoryNames } from '../../../models/types';
import { FaCheckCircle, FaCreditCard, FaSpinner, FaBarcode, FaQrcode, FaTimes, FaArrowLeft, FaInfoCircle, FaRegCreditCard, FaTags, FaLock, FaShieldAlt, FaCrown } from 'react-icons/fa';
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
    // Carregar dados do usuário
    const loadUserProfile = async () => {
      try {
        if (userId) {
          // Primeiro tentar obter do localStorage
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            const profileData = JSON.parse(storedProfile);
            console.log('Perfil carregado do localStorage:', profileData);
            setUserProfile(profileData);
          } else {
            // Se não tem no localStorage, buscar do banco
            const response = await fetch(`/api/users/profile?userId=${userId}`);
            if (response.ok) {
              const data = await response.json();
              console.log('Perfil carregado da API:', data);
              setUserProfile(data.profile);
            } else {
              // Fallback com dados básicos do localStorage
              const userEmail = localStorage.getItem('userEmail');
              const userName = localStorage.getItem('userName');
              const userPhone = localStorage.getItem('userPhone');
              
              const fallbackProfile = {
                email: userEmail || '',
                name: userName || '',
                phone: userPhone || ''
              };
              
              console.log('Usando perfil de fallback:', fallbackProfile);
              setUserProfile(fallbackProfile);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Fallback final
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        if (userEmail) {
          setUserProfile({
            email: userEmail,
            name: userName || 'Usuário',
            phone: ''
          });
        }
      }
    };
    
    // Verificar se é um upgrade (não deve mostrar trial)
    const urlParams = new URLSearchParams(window.location.search);
    const isUpgrade = urlParams.get('upgrade') === 'true' || 
                     document.referrer.includes('painel-anunciante') ||
                     window.location.pathname.includes('painel-anunciante');
    
    if (isUpgrade) {
      console.log('🔄 Upgrade detectado - Trial desabilitado');
      setTrialEligible(false);
    } else {
      // Para novos usuários, verificar trial apenas se o plano permite
      const checkTrialEligibility = async () => {
        if (userId && planId !== SubscriptionPlan.FREE) {
          const eligible = await isEligibleForTrial(userId);
          setTrialEligible(eligible);
          
          if (eligible) {
            const endDate = calculateTrialEndDate(planId as SubscriptionPlan);
            setTrialEndDate(endDate);
          }
        }
      };
      
      checkTrialEligibility();
    }
    
    // Carregar perfil do usuário
    loadUserProfile();
    
    setLoading(false);
  }, [planId, userId]);

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
    setLoading(true);
    setError('');

    try {
      // PASSO 1: Validações iniciais
      if (!userId) {
        setError('Erro: Usuário não autenticado. Faça login novamente.');
        setLoading(false);
        return;
      }
      
      // Verificar se o perfil foi carregado
      if (!userProfile) {
        setError('Erro: Dados do usuário não carregados. Recarregue a página e tente novamente.');
        setLoading(false);
        return;
      }
      
      // Verificar se temos pelo menos email
      if (!userProfile.email) {
        setError('Erro: Email do usuário não encontrado. Complete seu perfil primeiro.');
        setLoading(false);
        return;
      }
      
      // PASSO 2: Criar/verificar cliente no ASAAS
      console.log('👤 Criando cliente no ASAAS...');
      console.log('📧 Email do usuário:', userProfile.email);
      
      // Para PIX, usar fluxo simplificado direto
      if (paymentMethod === 'pix') {
        console.log('💳 PIX detectado - usando fluxo simplificado');
        
        // Validação obrigatória: CPF/CNPJ é necessário para PIX
        if (!userProfile.cpf_cnpj) {
          setError('Para pagamentos PIX é obrigatório ter CPF ou CNPJ cadastrado. Complete seu perfil primeiro.');
          setLoading(false);
          return;
        }
        
        // PASSO 1: Criar cliente primeiro (obrigatório no ASAAS)
        console.log('👤 Criando cliente no ASAAS...');
        const customerData = {
          name: cardName || userProfile.name || 'Cliente',
          email: userProfile.email,
          phone: userProfile.phone || "11999999999", // Temporário para PIX
          cpfCnpj: userProfile.cpf_cnpj || undefined // OBRIGATÓRIO PARA PIX!
        };

        const customerResponse = await fetch('/api/payments/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            ...customerData
          })
        });

        if (!customerResponse.ok) {
          const customerError = await customerResponse.json();
          throw new Error(customerError.error || 'Erro ao criar cliente');
        }

        const { customer } = await customerResponse.json();
        console.log('✅ Cliente criado:', customer.asaas_customer_id);
        
        // PASSO 2: Criar cobrança PIX usando ID do cliente
        const pixPaymentData = {
          customer: customer.asaas_customer_id, // ID do cliente criado
          billingType: "PIX",
          value: planPrice || 0,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
          description: `Assinatura - ${planName}`
        };

        console.log('💳 Criando cobrança PIX:', pixPaymentData);

        // Usar API direta de pagamentos
        const response = await fetch('/api/asaas/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pixPaymentData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar cobrança PIX');
        }

        console.log('✅ Cobrança PIX criada:', result);
        
        // PASSO 3: Buscar QR Code PIX se disponível
        if (result.payment?.id) {
          try {
            console.log('🔍 Buscando QR Code PIX...');
            const pixQrResponse = await fetch(`/api/asaas/payments?paymentId=${result.payment.id}`);
            const pixQrResult = await pixQrResponse.json();
            
            if (pixQrResponse.ok && pixQrResult.payment) {
              console.log('✅ QR Code obtido:', pixQrResult.payment);
              setPixQrCode(pixQrResult.payment.pixQrCode);
              setPixPayload(pixQrResult.payment.pixCopyPaste);
              setPaymentProcessed(true);
            } else {
              // Fallback - usar dados da cobrança criada
              setPixQrCode(result.payment.pixQrCode || null);
              setPixPayload(result.payment.pixCopyPaste || null);
              setPaymentProcessed(true);
            }
          } catch (qrError) {
            console.warn('⚠️ Erro ao buscar QR Code, usando dados da cobrança:', qrError);
            setPixQrCode(result.payment.pixQrCode || null);
            setPixPayload(result.payment.pixCopyPaste || null);
            setPaymentProcessed(true);
          }
        } else {
          setError('Erro: QR Code PIX não foi gerado. Tente novamente.');
          setLoading(false);
          return;
        }
        
        // Simular estrutura de subscription para compatibilidade
        setSubscriptionData({
          ...result.payment,
          pix_qr_code: pixQrCode,
          pix_payload: pixPayload
        });
        
        setLoading(false);
        return;
      }
      
      // Para outros métodos, manter fluxo original
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
      if (paymentMethod === 'boleto') {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/painel-anunciante/planos"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Voltar aos Planos</span>
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaLock className="text-green-600" />
              <span>Pagamento 100% Seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              
              {/* Header do Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Finalizar Assinatura</h1>
                    <p className="text-blue-100 mt-1">Complete sua assinatura em instantes</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-3">
                    <FaShieldAlt className="text-2xl text-white" />
                  </div>
                </div>
              </div>

              {/* Conteúdo do Form */}
              <div className="p-8 bg-white">
                {!paymentProcessed && !success && !showCategoriesSelector && (
                  <div className="space-y-8">
                    
                    {/* Trial Notice - Só mostra se trial está ativo */}
                    {trialEligible && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-start">
                          <div className="bg-green-500 rounded-full p-2 mr-4">
                            <FaInfoCircle className="text-white text-lg" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-green-800 mb-2">🎉 30 dias grátis ativados!</h3>
                            <p className="text-green-700">
                              Você não será cobrado durante os 30 dias iniciais. Cancele a qualquer momento antes do final do período de teste.
                            </p>
                            {trialEndDate && (
                              <p className="text-sm text-green-600 mt-2 font-medium">
                                <strong>Período grátis até:</strong> {trialEndDate.toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Métodos de Pagamento */}
                    <div>
                      <h2 className="text-xl font-semibold mb-6 text-gray-900">Escolha sua forma de pagamento</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* PIX */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('pix')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-300 group ${
                            paymentMethod === 'pix' 
                              ? 'border-green-500 bg-green-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                              paymentMethod === 'pix' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600'
                            }`}>
                              <FaQrcode className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">PIX</h3>
                            <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                            <p className="text-xs text-green-600 mt-1 font-medium">Aprovação imediata</p>
                            {paymentMethod === 'pix' && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                <FaCheckCircle className="text-white text-lg" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Boleto */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('boleto')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-300 group ${
                            paymentMethod === 'boleto' 
                              ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-orange-300 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                              paymentMethod === 'boleto' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                            }`}>
                              <FaBarcode className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">Boleto</h3>
                            <p className="text-sm text-gray-600">Vencimento em 3 dias</p>
                            <p className="text-xs text-orange-600 mt-1 font-medium">Aprovação em até 3 dias</p>
                            {paymentMethod === 'boleto' && (
                              <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1">
                                <FaCheckCircle className="text-white text-lg" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Cartão de Crédito */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('credit')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-300 group ${
                            paymentMethod === 'credit' 
                              ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                              paymentMethod === 'credit' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}>
                              <FaCreditCard className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">Cartão</h3>
                            <p className="text-sm text-gray-600">Crédito ou débito</p>
                            <p className="text-xs text-blue-600 mt-1 font-medium">Aprovação instantânea</p>
                            {paymentMethod === 'credit' && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                                <FaCheckCircle className="text-white text-lg" />
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Dados do Cartão - Só aparece se cartão selecionado */}
                    {paymentMethod === 'credit' && (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-6 text-gray-900 flex items-center">
                          <FaCreditCard className="mr-3 text-blue-600" />
                          Dados do Cartão de Crédito
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número do cartão *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19))}
                                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                                maxLength={19}
                                required
                              />
                              <FaRegCreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome no cartão *
                            </label>
                            <input
                              type="text"
                              placeholder="Nome como está no cartão"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Validade *
                              </label>
                              <input
                                type="text"
                                placeholder="MM/AA"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5))}
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVV *
                              </label>
                              <input
                                type="text"
                                placeholder="000"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                maxLength={4}
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveCard}
                                onChange={(e) => setSaveCard(e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Salvar cartão para pagamentos futuros</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informações específicas do método */}
                    {paymentMethod === 'boleto' && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-orange-600 mt-1 mr-4 text-lg flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-orange-800 mb-2">Informações sobre o Boleto</h4>
                            <p className="text-orange-700 text-sm mb-2">
                              Ao selecionar boleto, você receberá um boleto bancário que pode ser pago em qualquer agência bancária, internet banking ou casas lotéricas.
                            </p>
                            <p className="text-orange-600 text-sm font-medium">
                              ⚡ Seu plano será ativado após a confirmação do pagamento, que pode levar até 3 dias úteis.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'pix' && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-start">
                          <FaQrcode className="text-green-600 mt-1 mr-4 text-lg flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-800 mb-2">Vantagens do PIX</h4>
                            <p className="text-green-700 text-sm mb-2">
                              Ao selecionar PIX, você receberá um QR Code na próxima tela para realizar o pagamento instantâneo.
                            </p>
                            <p className="text-green-600 text-sm font-medium">
                              ⚡ Seu plano será ativado assim que o pagamento for confirmado, geralmente em segundos.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Exibir erro se houver */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start">
                          <div className="bg-red-500 rounded-full p-1 mr-3 mt-0.5">
                            <FaTimes className="text-white text-sm" />
                          </div>
                          <div>
                            <h4 className="font-medium text-red-800 mb-1">Erro no processamento</h4>
                            <p className="text-red-700 text-sm">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão de Confirmação */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-200">
                      <Link 
                        href="/painel-anunciante/planos" 
                        className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        <FaArrowLeft className="mr-2" /> 
                        <span>Voltar para planos</span>
                      </Link>
                      
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                          loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                            Processando...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FaLock className="mr-2" />
                            {trialEligible ? 'Ativar período grátis' : `Confirmar assinatura`}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Estados de processamento, sucesso e categorias mantidos iguais... */}
                {/* [Resto do código mantido] */}
              </div>
            </div>
          </div>

          {/* Sidebar - Resumo do Plano */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white">{planName}</h3>
                  <div className="bg-white/20 rounded-full p-2">
                    <FaCrown className="text-yellow-300 text-lg" />
                  </div>
                </div>
                
                {trialEligible ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-400">
                      Grátis
                    </div>
                    <p className="text-sm text-gray-300">
                      por 30 dias, depois R$ {planPrice.toFixed(2).replace('.', ',')}/mês
                    </p>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">
                    R$ {planPrice.toFixed(2).replace('.', ',')}
                    <span className="text-lg font-normal text-gray-300">/mês</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-white">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCheckCircle className="mr-2 text-green-500" />
                  Incluído no plano:
                </h4>
                <div className="space-y-3">
                  {planFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-t">
                <div className="flex items-center justify-center space-x-3 text-sm text-gray-700">
                  <FaShieldAlt className="text-green-500 text-lg" />
                  <span className="font-medium">Pagamento 100% seguro e criptografado</span>
                </div>
                <div className="flex items-center justify-center space-x-2 mt-3 text-xs text-gray-600">
                  <span>🔒 SSL</span>
                  <span>•</span>
                  <span>256-bit</span>
                  <span>•</span>
                  <span>ASAAS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 