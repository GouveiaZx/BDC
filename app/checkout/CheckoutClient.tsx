"use client";

import React, { useState, useEffect, Suspense } from 'react'; // Adicionar Suspense se necessário internamente
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaCreditCard, FaBarcode, FaLock, FaClock, FaCheckCircle, FaArrowLeft, FaShieldAlt, FaArrowUp, FaStar, FaInfoCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useSubscription } from '../lib/subscriptionContext';
import { SubscriptionPlan } from '../models/types';

// Tipos
interface PlanType {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

type PaymentMethod = 'credit_card' | 'boleto' | 'pix';

interface CheckoutClientProps {
  plans: PlanType[];
  initialPlanId?: string;
}

export default function CheckoutClient({ plans, initialPlanId }: CheckoutClientProps) {
  const router = useRouter();
  const { currentPlan, isLoading: loadingSubscription } = useSubscription();

  // Estados do formulário
  const [step, setStep] = useState<1 | 2>(1); // 1: seleção/dados, 2: confirmação/pagamento
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState(false); // Renomeado de 'processing' para 'loading' para consistência
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
    saveCard: false,
    cpfCnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    agreeTerms: false
  });

  // Buscar plano selecionado a partir da prop initialPlanId
  useEffect(() => {
    // Usa a prop initialPlanId recebida do Server Component
    if (initialPlanId) {
      const plan = plans.find(p => p.id === initialPlanId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        // Se o initialPlanId for inválido, seleciona o primeiro plano
        if (plans && plans.length > 0) {
            setSelectedPlan(plans[0]);
        }
      }
    } else {
      // Se não houver initialPlanId, seleciona o primeiro plano
      if (plans && plans.length > 0) {
          setSelectedPlan(plans[0]);
      }
    }
  }, [initialPlanId, plans]);

  // Verificar se o plano selecionado é um upgrade válido
  const isValidUpgrade = () => {
    if (!selectedPlan || loadingSubscription) return true; // Permitir continuar se estiver carregando
    
    // Se o plano selecionado for o mesmo que o atual, não é um upgrade válido
    if (selectedPlan.id === currentPlan) {
      return false;
    }

    // Se o preço do plano atual for maior que o selecionado, alertar sobre downgrade
    const currentPlanInfo = plans.find(p => p.id === currentPlan);
    if (currentPlanInfo && currentPlanInfo.price > (selectedPlan?.price || 0)) {
      return confirm('Você está fazendo downgrade do seu plano. Tem certeza que deseja continuar?');
    }

    return true;
  };

  // Manipuladores de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const formatCardNumber = (value: string) => {
    if (!value) return value;
    const v = value.replace(/\D/g, '');
    const matches = v.match(/\d{1,4}/g);
    const result = matches ? matches.join(' ') : '';
    return result;
  };

  const formatExpiry = (value: string) => {
    if (!value) return value;
    const v = value.replace(/\D/g, '');
    if (v.length <= 2) return v;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setFormData({ ...formData, cardExpiry: formatted });
  };

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Verificar se é um upgrade válido antes de prosseguir
      if (!isValidUpgrade()) {
        alert('Você já possui este plano. Escolha um plano diferente para fazer upgrade.');
        return;
      }
      
      if (paymentMethod === 'credit_card') {
        if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvv) {
          alert('Por favor, preencha todos os campos do cartão de crédito');
          return;
        }
      }
      if (!formData.cpfCnpj || !formData.address || !formData.city || !formData.state || !formData.zipCode) {
        alert('Por favor, preencha todos os campos de endereço');
        return;
      }
      if (!formData.agreeTerms) {
        alert('Você precisa concordar com os termos e condições');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      // Verificar novamente se é um upgrade válido antes de enviar
      if (!isValidUpgrade()) {
        alert('Você já possui este plano. Escolha um plano diferente para fazer upgrade.');
        return;
      }
      
      setLoading(true);
      try {
        // Preparar dados para API
        const subscriptionData = {
          userId: "123", // Deve ser obtido da sessão do usuário
          planId: selectedPlan?.id,
          paymentMethod,
          customerData: {
            name: formData.cardName || "Cliente", // Nome do cliente
            email: "cliente@example.com", // Deve ser obtido da sessão
            phone: "", // Deve ser obtido do perfil
            cpfCnpj: formData.cpfCnpj,
            postalCode: formData.zipCode,
            address: formData.address,
            addressNumber: "123", // Deve ser parte do formulário
            province: formData.city,
            complement: ""
          },
          paymentData: paymentMethod === "credit_card" ? {
            cardName: formData.cardName,
            cardNumber: formData.cardNumber,
            cardExpiry: formData.cardExpiry,
            cardCvv: formData.cardCvv
          } : null
        };

        // Chamar API para criar assinatura
        const response = await fetch('/checkout/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao processar assinatura');
        }

        // Sucesso: redirecionar para página de sucesso
        router.push('/checkout/success');
      } catch (error) {
        alert('Erro ao processar o pagamento. Por favor, tente novamente.');
        console.error('Erro no pagamento:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Componente para o resumo do pedido (pode ser movido para fora se reutilizado)
  const OrderSummary = () => {
    // Encontrar informações do plano atual
    const currentPlanInfo = !loadingSubscription && currentPlan !== SubscriptionPlan.FREE ? 
      plans.find(p => p.id === currentPlan) : null;
    
    // Calcular diferença de preço para upgrade
    const priceDifference = currentPlanInfo && selectedPlan ? 
      selectedPlan.price - currentPlanInfo.price : 0;
    
    return (
      <div className="bg-gray-900 rounded-lg p-8 sticky top-24"> {/* Ajustado top para considerar o header */}
        <h3 className="text-xl font-bold mb-6 text-white">Resumo do pedido</h3>
        
        {/* Mostrar informações do plano atual se existir */}
        {currentPlanInfo && currentPlan !== SubscriptionPlan.FREE && (
          <div className="mb-4 pb-4 border-b border-gray-700">
            <p className="text-gray-300 mb-2">Seu plano atual</p>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Plano</span>
              <span className="text-white">{currentPlanInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor</span>
              <span className="text-white">R$ {currentPlanInfo.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}
        
        {selectedPlan && (
          <div className="mb-6">
            {currentPlanInfo && currentPlan !== SubscriptionPlan.FREE && (
              <div className="flex items-center justify-center mb-3 bg-blue-900 py-2 px-3 rounded-md">
                <FaArrowUp className="text-blue-400 mr-2" />
                <span className="text-blue-100 text-sm font-medium">Upgrade de plano</span>
              </div>
            )}
            
            <div className="flex justify-between mb-3">
              <span className="text-gray-300">Plano</span>
              <span className="text-white font-medium">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between mb-5">
              <span className="text-gray-300">Valor</span>
              <span className="text-white font-bold">R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
            </div>
            
            {currentPlanInfo && priceDifference > 0 && (
              <div className="flex justify-between mb-2 text-sm bg-gray-800 p-2 rounded">
                <span className="text-gray-300">Valor adicional</span>
                <span className="text-green-400">+ R$ {priceDifference.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Total</span>
                <span className="text-white font-bold text-xl">R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">Cobrado mensalmente</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center mt-6 py-3 border border-gray-700 rounded-lg">
          <FaShieldAlt className="text-xl text-primary mr-3" />
          <span className="text-base font-bold text-white">Pagamento 100% seguro</span>
        </div>
      </div>
    );
  };

  if (!selectedPlan) {
    // Pode mostrar um estado de carregamento mais robusto aqui
    return <div className="min-h-screen flex items-center justify-center text-gray-700">Selecionando plano...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Voltar
            </button>
            <div className="flex items-center space-x-2">
              <FaLock className="text-green-600" />
              <span className="text-sm text-gray-600">Pagamento Seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              
              {/* Progress Bar */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex justify-between items-center text-white">
                  <h1 className="text-2xl font-bold">Finalizar Assinatura</h1>
                  <div className="flex space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= 1 ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                    }`}>1</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= 2 ? 'bg-white text-blue-600' : 'bg-blue-500/50 text-white/70'
                    }`}>2</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-blue-100">
                    <span>Dados do Pagamento</span>
                    <span>Confirmação</span>
                  </div>
                  <div className="mt-2 bg-blue-500/30 rounded-full h-2">
                    <div className={`bg-white rounded-full h-2 transition-all duration-500 ${
                      step === 1 ? 'w-1/2' : 'w-full'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {step === 1 && (
                  <div className="space-y-8">
                    
                    {/* Método de Pagamento */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Escolha sua forma de pagamento</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* PIX */}
                        <button
                          type="button"
                          onClick={() => handlePaymentMethodSelect('pix')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                            paymentMethod === 'pix' 
                              ? 'border-green-500 bg-green-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                              paymentMethod === 'pix' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                <path d="M12 6v6l4 2"/>
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">PIX</h3>
                            <p className="text-sm text-gray-600 mt-1">Pagamento instantâneo</p>
                            {paymentMethod === 'pix' && (
                              <div className="absolute -top-2 -right-2">
                                <FaCheckCircle className="text-green-500 text-xl" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Cartão de Crédito */}
                        <button
                          type="button"
                          onClick={() => handlePaymentMethodSelect('credit_card')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                            paymentMethod === 'credit_card' 
                              ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                              paymentMethod === 'credit_card' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <FaCreditCard className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Cartão</h3>
                            <p className="text-sm text-gray-600 mt-1">Crédito ou débito</p>
                            {paymentMethod === 'credit_card' && (
                              <div className="absolute -top-2 -right-2">
                                <FaCheckCircle className="text-blue-500 text-xl" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Boleto */}
                        <button
                          type="button"
                          onClick={() => handlePaymentMethodSelect('boleto')}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                            paymentMethod === 'boleto' 
                              ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-105' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                              paymentMethod === 'boleto' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
                                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">Boleto</h3>
                            <p className="text-sm text-gray-600 mt-1">Vencimento em 3 dias</p>
                            {paymentMethod === 'boleto' && (
                              <div className="absolute -top-2 -right-2">
                                <FaCheckCircle className="text-orange-500 text-xl" />
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Dados do Cartão - Só aparece se cartão selecionado */}
                    {paymentMethod === 'credit_card' && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Dados do Cartão</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número do cartão *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                placeholder="0000 0000 0000 0000"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                maxLength={19}
                              />
                              <FaCreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome no cartão *
                            </label>
                            <input
                              type="text"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              placeholder="Nome como está no cartão"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Validade *
                              </label>
                              <input
                                type="text"
                                name="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/AA"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVV *
                              </label>
                              <input
                                type="text"
                                name="cardCvv"
                                value={formData.cardCvv}
                                onChange={handleInputChange}
                                placeholder="000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dados Pessoais */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Dados de Cobrança</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPF/CNPJ *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="cpfCnpj"
                              value={formData.cpfCnpj}
                              onChange={handleInputChange}
                              placeholder="000.000.000-00"
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CEP *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              placeholder="00000-000"
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Endereço *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Rua, número, complemento"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Sua cidade"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Estado"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Termos */}
                    <div className="border-t pt-6">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">
                          Concordo com os <a href="/termos" className="text-blue-600 hover:underline">Termos de Uso</a> e 
                          <a href="/privacidade" className="text-blue-600 hover:underline"> Política de Privacidade</a>
                        </span>
                      </label>
                    </div>

                    {/* Botão Continuar */}
                    <div className="flex justify-end pt-6">
                      <button
                        onClick={handleSubmit}
                        disabled={!formData.agreeTerms}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Continuar para Confirmação
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="text-center space-y-8">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-8">
                      <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h2>
                      <p className="text-gray-600">
                        Sua assinatura do plano <strong>{selectedPlan?.name}</strong> foi processada com sucesso.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => router.push('/painel-anunciante')}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Ir para o Painel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Resumo do Plano */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
              {selectedPlan && (
                <>
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                      {selectedPlan.popular && (
                        <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold">
                      R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
                      <span className="text-lg font-normal text-gray-300">/mês</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Incluído no plano:</h4>
                    <div className="space-y-3">
                      {selectedPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 border-t">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <FaShieldAlt className="text-green-500" />
                      <span>Pagamento 100% seguro</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 