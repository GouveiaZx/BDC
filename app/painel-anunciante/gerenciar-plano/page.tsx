"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaArrowLeft, FaCrown, FaCheckCircle, FaTimes, FaInfoCircle,
  FaCalendarAlt, FaCreditCard, FaExclamationTriangle, FaArrowUp,
  FaArrowDown, FaPause, FaPlay, FaTrash, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { SubscriptionPlan } from '../../models/types';
import { getSubscriptionLimits } from '../../config/subscription-limits';

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'paused' | 'canceled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  nextBillingDate: string;
  lastPaymentDate: string;
  customerId: string;
}

const GerenciarPlanoPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Definições dos planos disponíveis
  const plansInfo = {
    [SubscriptionPlan.FREE]: {
      name: 'Gratuito',
      price: 0,
      monthlyPrice: 'R$ 0,00',
      color: 'gray',
      features: ['3 anúncios', '30 dias de duração', 'Sem destaques', 'Destaques avulsos R$ 14,90']
    },
    [SubscriptionPlan.MICRO_BUSINESS]: {
      name: 'Micro Empresa',
      price: 29.90,
      monthlyPrice: 'R$ 29,90',
      color: 'blue',
      features: ['4 anúncios', '60 dias de duração', 'Sem destaques incluídos', 'Destaques avulsos R$ 9,90']
    },
    [SubscriptionPlan.SMALL_BUSINESS]: {
      name: 'Pequena Empresa',
      price: 49.90,
      monthlyPrice: 'R$ 49,90',
      color: 'green',
      features: ['5 anúncios', '90 dias de duração', '1 destaque por dia', 'Destaques extras R$ 9,90']
    },
    [SubscriptionPlan.BUSINESS_SIMPLE]: {
      name: 'Empresa Simples',
      price: 79.90,
      monthlyPrice: 'R$ 79,90',
      color: 'purple',
      features: ['10 anúncios', 'Duração ilimitada', '2 destaques por dia', 'Perfil de loja personalizado']
    },
    [SubscriptionPlan.BUSINESS_PLUS]: {
      name: 'Empresa Plus',
      price: 129.90,
      monthlyPrice: 'R$ 129,90',
      color: 'yellow',
      features: ['20 anúncios', 'Duração ilimitada', '3 destaques por dia', 'Suporte prioritário']
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          toast.error('Você precisa estar logado');
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

        // Carregar dados da assinatura atual
        await loadSubscriptionData(data.user.id);

      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        toast.error('Erro ao carregar dados do usuário');
        router.push('/auth/login');
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  const loadSubscriptionData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Buscar dados da assinatura atual
      const response = await fetch(`/api/payments/subscriptions?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.subscriptions && result.subscriptions.length > 0) {
          const activeSubscription = result.subscriptions.find(
            (sub: any) => sub.status === 'ACTIVE' || sub.status === 'active'
          );
          
          if (activeSubscription) {
            setCurrentSubscription({
              id: activeSubscription.id,
              plan: activeSubscription.plan || SubscriptionPlan.FREE,
              status: activeSubscription.status?.toLowerCase(),
              startDate: activeSubscription.dateCreated || activeSubscription.created_at,
              endDate: activeSubscription.nextDueDate || activeSubscription.next_billing_date,
              autoRenew: true,
              paymentMethod: activeSubscription.billingType || 'PIX',
              nextBillingDate: activeSubscription.nextDueDate || activeSubscription.next_billing_date,
              lastPaymentDate: activeSubscription.dateCreated || activeSubscription.created_at,
              customerId: activeSubscription.customer
            });
          }
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (targetPlan: SubscriptionPlan) => {
    // Redirecionar para checkout com o plano selecionado
    const planParam = encodeURIComponent(targetPlan);
    router.push(`/checkout?plan=${planParam}&action=upgrade`);
  };

  const handleDowngrade = async (targetPlan: SubscriptionPlan) => {
    if (!currentSubscription) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/payments/subscriptions/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          newPlan: targetPlan
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar downgrade');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Downgrade agendado! Será aplicado no próximo ciclo de cobrança.');
        // Recarregar dados
        window.location.reload();
      } else {
        throw new Error(result.error || 'Erro ao processar downgrade');
      }

    } catch (error) {
      console.error('Erro no downgrade:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar downgrade');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você perderá todos os benefícios do plano no final do período atual.'
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/payments/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: currentSubscription.id
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Assinatura cancelada! Você terá acesso até o final do período pago.');
        // Recarregar dados
        window.location.reload();
      } else {
        throw new Error(result.error || 'Erro ao cancelar assinatura');
      }

    } catch (error) {
      console.error('Erro no cancelamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/payments/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: currentSubscription.id
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao reativar assinatura');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Assinatura reativada com sucesso!');
        // Recarregar dados
        window.location.reload();
      } else {
        throw new Error(result.error || 'Erro ao reativar assinatura');
      }

    } catch (error) {
      console.error('Erro na reativação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao reativar assinatura');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados da assinatura...</span>
        </div>
      </div>
    );
  }

  const currentPlan = currentSubscription?.plan || SubscriptionPlan.FREE;
  const currentPlanInfo = plansInfo[currentPlan];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/painel-anunciante" className="text-gray-600 hover:text-gray-800 mr-4">
          <FaArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaCrown className="mr-3 text-yellow-600" />
            Gerenciar Plano
          </h1>
          <p className="text-gray-600 mt-1">Gerencie sua assinatura e escolha o melhor plano</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plano Atual */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaShieldAlt className="mr-2 text-blue-600" />
                Plano Atual
              </h2>

              <div className={`border-2 border-${currentPlanInfo.color}-200 bg-${currentPlanInfo.color}-50 rounded-lg p-4 mb-4`}>
                <div className="text-center">
                  <FaCrown className={`mx-auto text-${currentPlanInfo.color}-600 text-3xl mb-2`} />
                  <h3 className={`text-xl font-bold text-${currentPlanInfo.color}-800`}>
                    {currentPlanInfo.name}
                  </h3>
                  <p className={`text-2xl font-bold text-${currentPlanInfo.color}-600 mt-2`}>
                    {currentPlanInfo.monthlyPrice}
                  </p>
                  <p className="text-sm text-gray-600">por mês</p>
                </div>
              </div>

              {currentSubscription && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      currentSubscription.status === 'active' ? 'text-green-600' :
                      currentSubscription.status === 'paused' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {currentSubscription.status === 'active' ? 'Ativo' :
                       currentSubscription.status === 'paused' ? 'Pausado' :
                       currentSubscription.status === 'canceled' ? 'Cancelado' : 'Expirado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Iniciado em:</span>
                    <span className="font-medium">
                      {new Date(currentSubscription.startDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Próximo vencimento:</span>
                    <span className="font-medium">
                      {new Date(currentSubscription.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pagamento:</span>
                    <span className="font-medium">{currentSubscription.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Renovação automática:</span>
                    <span className={`font-medium ${currentSubscription.autoRenew ? 'text-green-600' : 'text-red-600'}`}>
                      {currentSubscription.autoRenew ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              )}

              {/* Benefícios do plano atual */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Benefícios incluídos:</h4>
                <ul className="space-y-2">
                  {currentPlanInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <FaCheckCircle className="mr-2 mt-0.5 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ações da assinatura */}
              {currentSubscription && (
                <div className="mt-6 space-y-3">
                  {currentSubscription.status === 'active' && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <FaTrash className="mr-2" />
                      {isProcessing ? 'Processando...' : 'Cancelar Assinatura'}
                    </button>
                  )}

                  {currentSubscription.status === 'canceled' && (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <FaPlay className="mr-2" />
                      {isProcessing ? 'Processando...' : 'Reativar Assinatura'}
                    </button>
                  )}

                  <Link
                    href="/painel-anunciante/historico-pagamentos"
                    className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <FaCreditCard className="mr-2" />
                    Ver Histórico de Pagamentos
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Planos Disponíveis */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Planos Disponíveis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(plansInfo).map(([planKey, planInfo]) => {
                const plan = planKey as SubscriptionPlan;
                const isCurrentPlan = plan === currentPlan;
                const isUpgrade = planInfo.price > currentPlanInfo.price;
                const isDowngrade = planInfo.price < currentPlanInfo.price && planInfo.price > 0;

                return (
                  <div
                    key={plan}
                    className={`border rounded-lg p-6 transition-all ${
                      isCurrentPlan 
                        ? `border-${planInfo.color}-500 bg-${planInfo.color}-50` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <FaCrown className={`mx-auto text-${planInfo.color}-600 text-2xl mb-2`} />
                      <h3 className="text-lg font-bold text-gray-800">{planInfo.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{planInfo.monthlyPrice}</p>
                      <p className="text-sm text-gray-600">por mês</p>
                      
                      {isCurrentPlan && (
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Plano Atual
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {planInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <FaCheckCircle className="mr-2 mt-0.5 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!isCurrentPlan && (
                      <div className="space-y-2">
                        {isUpgrade && (
                          <button
                            onClick={() => handleUpgrade(plan)}
                            className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                          >
                            <FaArrowUp className="mr-2" />
                            Fazer Upgrade
                          </button>
                        )}

                        {isDowngrade && currentPlan !== SubscriptionPlan.FREE && (
                          <button
                            onClick={() => handleDowngrade(plan)}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:opacity-50"
                          >
                            <FaArrowDown className="mr-2" />
                            {isProcessing ? 'Processando...' : 'Fazer Downgrade'}
                          </button>
                        )}

                        {plan === SubscriptionPlan.FREE && currentPlan !== SubscriptionPlan.FREE && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              Para usar o plano gratuito, cancele sua assinatura atual
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Informações importantes */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <FaInfoCircle className="mr-2" />
                Informações Importantes
              </h3>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                  <span><strong>Upgrade:</strong> Efeito imediato com cobrança proporcional</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                  <span><strong>Downgrade:</strong> Aplicado no próximo ciclo de cobrança</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                  <span><strong>Cancelamento:</strong> Acesso mantido até o final do período pago</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                  <span><strong>Reativação:</strong> Possível a qualquer momento sem multa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciarPlanoPage; 