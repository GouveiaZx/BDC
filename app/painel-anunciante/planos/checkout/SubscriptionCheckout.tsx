'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan, BusinessCategory, businessCategoryNames } from '../../../models/types';
import { FaCheckCircle, FaCreditCard, FaSpinner, FaBarcode, FaQrcode, FaTimes, FaArrowLeft, FaInfoCircle, FaRegCreditCard, FaTags } from 'react-icons/fa';
import Link from 'next/link';
import { calculateTrialEndDate, isEligibleForTrial } from '../../../lib/subscriptionHelper';
import BusinessCategoriesSelector from './BusinessCategoriesSelector';

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
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'boleto' | 'pix'>('credit');
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
  
  const isPaidPlan = planId !== SubscriptionPlan.FREE;
  
  useEffect(() => {
    // Verificar elegibilidade para trial
    const checkTrialEligibility = async () => {
      const userId = "current-user-id";
      const eligible = await isEligibleForTrial(userId);
      setTrialEligible(eligible);
      
      if (eligible && planId) {
        const endDate = calculateTrialEndDate(planId as SubscriptionPlan);
        setTrialEndDate(endDate);
      }
    };
    
    checkTrialEligibility();
  }, [planId]);

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
    
    if (paymentMethod === 'credit') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        setError('Por favor, preencha todos os campos do cartão de crédito.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em um sistema real, você faria uma chamada à API aqui
      /*
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          paymentMethod,
          trial: trialEligible,
          paymentDetails: paymentMethod === 'credit' ? {
            cardNumber,
            cardName,
            expiryDate,
            cvv,
            saveCard
          } : undefined
        })
      });
      
      if (!response.ok) throw new Error('Falha ao processar pagamento');
      */
      
      setPaymentProcessed(true);
      
      if (isPaidPlan) {
        setShowCategoriesSelector(true);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/painel-anunciante');
        }, 3000);
      }
      
    } catch (e) {
      setError('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.');
      console.error('Erro:', e);
      setLoading(false);
    }
  };
  
  const handleSaveCategories = async (categories: BusinessCategory[]) => {
    setLoading(true);
    
    try {
      setSelectedCategories(categories);
      
      // Em um sistema real, você salvaria as categorias no servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      /*
      const response = await fetch('/api/business/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id',
          categories
        })
      });
      
      if (!response.ok) throw new Error('Falha ao salvar categorias');
      */
      
      setShowCategoriesSelector(false);
      setSuccess(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/painel-anunciante');
      }, 3000);
      
    } catch (e) {
      console.error('Erro ao salvar categorias:', e);
      setError('Ocorreu um erro ao salvar suas categorias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
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
        
        <button
          onClick={() => setShowCategoriesSelector(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Selecionar ramos de atividade
        </button>
        
        <BusinessCategoriesSelector
          onSave={handleSaveCategories}
          onCancel={() => {
            // Se cancelar, pula a etapa e finaliza normalmente
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
                onClick={() => setPaymentMethod('credit')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <FaCreditCard className={`text-2xl mb-2 ${paymentMethod === 'credit' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'credit' ? 'text-blue-600' : 'text-gray-700'}`}>Cartão de Crédito</span>
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
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${paymentMethod === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <FaQrcode className={`text-2xl mb-2 ${paymentMethod === 'pix' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'pix' ? 'text-blue-600' : 'text-gray-700'}`}>PIX</span>
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