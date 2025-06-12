"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan } from '../../models/types';
import { useSubscription } from '../../lib/subscriptionContext';
import { FaCalendarAlt, FaCreditCard, FaReceipt, FaExclamationTriangle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

interface ManageSubscriptionClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    subscription: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  };
}

// Mapeamento de planos para informações legíveis
const planInfo = {
  [SubscriptionPlan.FREE]: {
    name: 'Gratuito',
    color: 'bg-gray-200',
    price: 0
  },
  [SubscriptionPlan.MICRO_BUSINESS]: {
    name: 'Micro-Empresa',
    color: 'bg-blue-100',
    price: 49.90
  },
  [SubscriptionPlan.SMALL_BUSINESS]: {
    name: 'Pequena Empresa',
    color: 'bg-green-100',
    price: 149.90
  },
  [SubscriptionPlan.BUSINESS_SIMPLE]: {
    name: 'Empresa Simples',
    color: 'bg-purple-100',
    price: 249.90
  },
  [SubscriptionPlan.BUSINESS_PLUS]: {
    name: 'Empresa Plus',
    color: 'bg-yellow-100',
    price: 349.90
  }
};

export default function ManageSubscriptionClient({ user }: ManageSubscriptionClientProps) {
  const router = useRouter();
  const { currentPlan, planDisplayName, subscriptionData, isLoading, refreshSubscription } = useSubscription();
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState('');
  
  // Para fins de desenvolvimento, quando a API Mock é usada
  const mockSubscriptionId = subscriptionData?.id || `mock_sub_${Date.now()}`;
  
  // Formatação de datas
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Não disponível';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Obter data de validade da assinatura atual
  const getValidUntil = () => {
    if (subscriptionData?.nextPaymentDate) {
      return formatDate(subscriptionData.nextPaymentDate);
    } else if (subscriptionData?.endDate) {
      return formatDate(subscriptionData.endDate);
    }
    return 'Não disponível';
  };
  
  // Calcular dias restantes na assinatura atual
  const daysRemaining = () => {
    const nextPaymentDate = subscriptionData?.nextPaymentDate;
    const endDate = subscriptionData?.endDate;
    
    if (!nextPaymentDate && !endDate) return null;
    
    const targetDate = nextPaymentDate || endDate;
    if (!targetDate) return null;
    
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Função para cancelar assinatura
  const handleCancelSubscription = async () => {
    if (!subscriptionData?.id && currentPlan === SubscriptionPlan.FREE) {
      setCancelError('Você não possui assinatura ativa para cancelar.');
      return;
    }
    
    setProcessingCancel(true);
    setCancelError('');
    
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData?.id || mockSubscriptionId,
          userId: user.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar assinatura');
      }
      
      setCancelSuccess(true);
      refreshSubscription(); // Atualizar dados de assinatura
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      setCancelError(error instanceof Error ? error.message : 'Erro desconhecido ao cancelar assinatura');
    } finally {
      setProcessingCancel(false);
    }
  };
  
  // Se ainda está carregando, mostrar indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Mostrar informações do plano atual
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`p-6 border-b ${planInfo[currentPlan]?.color || 'bg-gray-100'}`}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Plano {planDisplayName}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentPlan === SubscriptionPlan.FREE 
                ? 'Plano gratuito' 
                : `R$ ${planInfo[currentPlan]?.price.toFixed(2).replace('.', ',')} por mês`}
            </p>
          </div>
          
          {currentPlan !== SubscriptionPlan.FREE && (
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <FaCheckCircle className="mr-1.5" />
                Assinatura Ativa
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {/* Dados da assinatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {subscriptionData?.startDate && (
            <div className="flex items-start">
              <div className="mr-4 text-primary">
                <FaCalendarAlt size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Data de Início</h3>
                <p className="text-gray-600">{formatDate(subscriptionData.startDate)}</p>
              </div>
            </div>
          )}
          
          {currentPlan !== SubscriptionPlan.FREE && (
            <div className="flex items-start">
              <div className="mr-4 text-primary">
                <FaCalendarAlt size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Válido até</h3>
                <p className="text-gray-600">{getValidUntil()}</p>
                {daysRemaining() !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {daysRemaining()} dias restantes neste ciclo
                  </p>
                )}
              </div>
            </div>
          )}
          
          {currentPlan !== SubscriptionPlan.FREE && (
            <div className="flex items-start">
              <div className="mr-4 text-primary">
                <FaCreditCard size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Método de Pagamento</h3>
                <p className="text-gray-600">Cartão de Crédito •••• 9999</p>
                <button className="text-primary text-sm mt-1 hover:underline">
                  Alterar método de pagamento
                </button>
              </div>
            </div>
          )}
          
          {currentPlan !== SubscriptionPlan.FREE && (
            <div className="flex items-start">
              <div className="mr-4 text-primary">
                <FaReceipt size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Histórico de Pagamentos</h3>
                <button className="text-primary text-sm mt-1 hover:underline">
                  Ver faturas anteriores
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Resumo de recursos */}
        <div className="bg-gray-50 rounded-lg p-5 mb-8">
          <h3 className="font-semibold text-gray-800 mb-3">Seu plano inclui:</h3>
          <ul className="space-y-2">
            {currentPlan === SubscriptionPlan.FREE && (
              <>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Até 3 anúncios ativos</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Duração de 30 dias por anúncio</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Destaques avulsos por R$ 14,90</span>
                </li>
              </>
            )}
            
            {currentPlan === SubscriptionPlan.MICRO_BUSINESS && (
              <>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Até 4 anúncios ativos</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Duração de 60 dias por anúncio</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Destaques avulsos por R$ 9,90</span>
                </li>
              </>
            )}
            
            {currentPlan === SubscriptionPlan.SMALL_BUSINESS && (
              <>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Até 5 anúncios simultâneos</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>1 destaque por dia</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Duração de 90 dias por anúncio</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Destaques extras por R$ 9,90</span>
                </li>
              </>
            )}
            
            {currentPlan === SubscriptionPlan.BUSINESS_SIMPLE && (
              <>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Até 10 anúncios simultâneos</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>2 destaques por dia</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Duração ilimitada dos anúncios</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Perfil de loja personalizado</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Destaques extras por R$ 9,90</span>
                </li>
              </>
            )}
            
            {currentPlan === SubscriptionPlan.BUSINESS_PLUS && (
              <>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Até 20 anúncios simultâneos</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>3 destaques por dia</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Duração ilimitada dos anúncios</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Perfil de loja personalizado</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <FaCheckCircle className="text-green-500 mr-2.5" />
                  <span>Destaques extras por R$ 9,90</span>
                </li>
              </>
            )}
          </ul>
        </div>
        
        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/planos" 
            className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FaArrowLeft className="mr-2" />
            Ver outros planos
          </Link>
          
          {currentPlan !== SubscriptionPlan.FREE && !cancelSuccess && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FaExclamationTriangle className="mr-2" />
              Cancelar assinatura
            </button>
          )}
          
          {cancelSuccess && (
            <div className="bg-green-100 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
              <FaCheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Assinatura cancelada com sucesso</p>
                <p className="text-sm mt-1">Sua assinatura permanecerá ativa até {getValidUntil()}. Após esta data, seu plano será alterado para o Gratuito.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação de Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancelar Assinatura</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar sua assinatura do plano {planInfo[currentPlan]?.name || 'atual'}?
            </p>
            <p className="text-gray-600 mb-6">
              Sua assinatura permanecerá ativa até {getValidUntil()}, quando seu plano será alterado para o Gratuito.
            </p>
            
            {cancelError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
                {cancelError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processingCancel}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {processingCancel ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                    Processando...
                  </span>
                ) : (
                  'Confirmar Cancelamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 