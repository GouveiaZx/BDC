"use client";

import React, { useState, useEffect, Suspense } from 'react'; // Adicionar Suspense se necessário internamente
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaCreditCard, FaBarcode, FaLock, FaClock, FaCheckCircle, FaArrowLeft, FaShieldAlt, FaArrowUp } from 'react-icons/fa';
import { useSubscription } from '../lib/subscriptionContext';
import { SubscriptionPlan } from '../models/types';

// Tipos
interface PlanType {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
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
    <main className="container mx-auto py-16 px-4 max-w-6xl">
      {/* Indicador de passos - Nova versão simplificada */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-center">
          <div className={`flex flex-col items-center ${step === 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step === 1 ? 'border-primary bg-primary/10' : step > 1 ? 'border-green-500 bg-green-500/10' : 'border-gray-300'}`}>
              {step > 1 ? <FaCheckCircle className="text-green-500" /> : <span className="font-medium">1</span>}
            </div>
            <span className="mt-2 font-medium text-sm">Dados e Pagamento</span>
          </div>
          
          <div className={`w-24 h-0.5 mx-2 ${step === 1 ? 'bg-gray-300' : 'bg-green-500'}`}></div>
          
          <div className={`flex flex-col items-center ${step === 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step === 2 ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
              <span className="font-medium">2</span>
            </div>
            <span className="mt-2 font-medium text-sm">Confirmação</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Coluna principal (Formulário) */}
        <div className="lg:col-span-2">
          {/* Botão Voltar (apenas no passo 2) */}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium"
            >
              <FaArrowLeft className="mr-2" />
              Voltar para dados e pagamento
            </button>
          )}

          {step === 1 && (
            <>
              {/* Seleção de Plano */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-5 text-gray-900">Selecione seu plano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan)}
                      className={`p-6 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      <p className="text-2xl font-bold text-primary mb-4">R$ {plan.price.toFixed(2).replace('.', ',')} <span className='text-sm text-gray-500 font-normal'>/mês</span></p>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                           <li key={index} className="flex items-start text-xs text-gray-600">
                            <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0 text-sm" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-5 text-gray-900">Método de pagamento</h2>
                <div className="flex space-x-4 border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodSelect('credit_card')}
                    className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                      paymentMethod === 'credit_card' ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaCreditCard className="mr-2" /> Cartão de Crédito
                  </button>
                  {/* Outros métodos podem ser adicionados aqui */}
                </div>
              </div>

              {/* Dados do Cartão */}
              {paymentMethod === 'credit_card' && (
                <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-lg font-medium mb-5 text-gray-800">Dados do Cartão de Crédito</h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6 relative">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Número do Cartão</label>
                      <input
                        type="text"
                        name="cardNumber"
                        id="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19} // 16 digits + 3 spaces
                        placeholder="0000 0000 0000 0000"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm pr-10"
                        required
                      />
                      <FaCreditCard className="absolute right-3 top-8 text-gray-400"/>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">Nome no Cartão</label>
                      <input
                        type="text"
                        name="cardName"
                        id="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="Nome como impresso no cartão"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700">Validade (MM/AA)</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        id="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5} // MM/YY
                        placeholder="MM/AA"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3 relative">
                      <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700">CVV</label>
                      <input
                        type="text"
                        name="cardCvv"
                        id="cardCvv"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        maxLength={4}
                        placeholder="Código de segurança"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm pr-10"
                        required
                      />
                      <FaLock className="absolute right-3 top-8 text-gray-400"/>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="installments" className="block text-sm font-medium text-gray-700">Parcelas</label>
                      <select
                        id="installments"
                        name="installments"
                        value={formData.installments}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                      >
                        <option value="1">1x de R$ {selectedPlan.price.toFixed(2).replace('.', ',')} (à vista)</option>
                        {/* Adicionar mais opções de parcelamento se necessário */}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex items-center">
                        <input
                          id="saveCard"
                          name="saveCard"
                          type="checkbox"
                          checked={formData.saveCard}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-900">Salvar cartão para futuras compras</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados Pessoais e Endereço */}
              <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
                 <h3 className="text-lg font-medium mb-5 text-gray-800">Seus Dados</h3>
                 <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                   <div className="sm:col-span-6">
                      <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700">CPF/CNPJ</label>
                      <input type="text" name="cpfCnpj" id="cpfCnpj" value={formData.cpfCnpj} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" required />
                   </div>
                   <div className="sm:col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
                      <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" required />
                   </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                      <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" required />
                   </div>
                   <div className="sm:col-span-2">
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                      <input type="text" name="state" id="state" value={formData.state} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" required />
                   </div>
                   <div className="sm:col-span-2">
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">CEP</label>
                      <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" required />
                   </div>
                 </div>
              </div>

              {/* Termos e Botão */}
              <div className="flex items-center mb-6">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                  Eu li e concordo com os <Link href="/termos" className="font-medium text-primary hover:underline">Termos e Condições</Link> e a <Link href="/privacidade" className="font-medium text-primary hover:underline">Política de Privacidade</Link>.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.agreeTerms}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Continuar para Confirmação'}
              </button>
            </>
          )}

          {step === 2 && (
             <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
               <h2 className="text-2xl font-semibold mb-6 text-gray-900">Confirme sua Assinatura</h2>
               <p className="text-gray-700 mb-6">
                 Revise os detalhes do seu pedido e confirme a assinatura do plano <span className="font-medium">{selectedPlan.name}</span>.
               </p>

                {/* Detalhes do pagamento (exemplo) */}
               <div className="mb-6 border-t border-b border-gray-200 py-4">
                 <h3 className="font-medium text-gray-800 mb-2">Pagamento com</h3>
                 {paymentMethod === 'credit_card' && (
                   <div className="flex items-center text-gray-600">
                     <FaCreditCard className="mr-2"/>
                     <span>Cartão de Crédito terminando em {formData.cardNumber.slice(-4)}</span>
                   </div>
                 )}
                  {/* Adicionar outros métodos aqui */}
               </div>

               <p className="text-sm text-gray-600 mb-6">
                 Clicando em "Assinar Agora", você concorda em iniciar sua assinatura imediatamente.
                 A cobrança de R$ {selectedPlan.price.toFixed(2).replace('.', ',')} será realizada no método de pagamento selecionado.
                 A assinatura será renovada automaticamente a cada mês, a menos que seja cancelada.
               </p>

               <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Assinar Agora'
                )}
              </button>
             </div>
          )}
        </div>

        {/* Coluna lateral (Resumo do Pedido) */}
        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </form>
    </main>
  );
} 