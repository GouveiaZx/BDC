"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  FaCreditCard, FaHistory, FaCheck, FaTimes, FaFileInvoice,
  FaCheckCircle, FaExclamationCircle, FaClipboardList, FaRegClock,
  FaCrown, FaMoneyBillWave, FaRocket, FaArrowRight, FaLock, FaUserPlus
} from 'react-icons/fa';
import { useSubscriptionSync } from '../../lib/useSubscriptionSync';
import { SubscriptionPlan } from '../../models/types';

export default function GerenciarAssinatura() {
  const { 
    plan, 
    planName, 
    isLoading, 
    paymentMethods, 
    paymentHistory, 
    nextBillingDate, 
    startDate, 
    validUntil 
  } = useSubscriptionSync();
  
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  
  // Definições de plano para apresentação na interface
  const getPlanDetails = (planType: SubscriptionPlan) => {
    switch(planType) {
      case SubscriptionPlan.FREE:
        return {
          name: 'Gratuito',
          badge: 'bg-gray-100 text-gray-600',
          icon: <FaUserPlus />,
          color: 'gray',
          price: 'R$ 0,00',
          limits: 'Até 3 anúncios ativos'
        };
      case SubscriptionPlan.MICRO_BUSINESS:
        return {
          name: 'Micro Negócios',
          badge: 'bg-blue-100 text-blue-600',
          icon: <FaRocket />,
          color: 'blue',
          price: 'R$ 49,90/mês',
          limits: 'Até 5 anúncios ativos'
        };
      case SubscriptionPlan.SMALL_BUSINESS:
        return {
          name: 'Pequenos Negócios',
          badge: 'bg-green-100 text-green-600',
          icon: <FaMoneyBillWave />,
          color: 'green',
          price: 'R$ 149,90/mês',
          limits: 'Até 10 anúncios ativos + 1 destaque/dia'
        };
      case SubscriptionPlan.BUSINESS_SIMPLE:
        return {
          name: 'Empresarial',
          badge: 'bg-purple-100 text-purple-600',
          icon: <FaCrown />,
          color: 'purple',
          price: 'R$ 249,90/mês',
          limits: 'Até 20 anúncios ativos + 2 destaques/dia'
        };
      case SubscriptionPlan.BUSINESS_PLUS:
        return {
          name: 'Empresarial Plus',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: <FaCrown />,
          color: 'yellow',
          price: 'R$ 399,90/mês',
          limits: 'Anúncios ilimitados + 5 destaques/dia'
        };
      default:
        return {
          name: 'Desconhecido',
          badge: 'bg-gray-100 text-gray-600',
          icon: <FaUserPlus />,
          color: 'gray',
          price: 'R$ 0,00',
          limits: 'Desconhecido'
        };
    }
  };
  
  // Status de pagamento
  const getPaymentStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center"><FaCheckCircle className="mr-1" /> Aprovado</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center"><FaRegClock className="mr-1" /> Pendente</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center"><FaExclamationCircle className="mr-1" /> Falhou</span>;
      case 'refunded':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center"><FaHistory className="mr-1" /> Reembolsado</span>;
      default:
        return null;
    }
  };
  
  // Simulação de cancelamento
  const handleCancelSubscription = () => {
    // Aqui você implementaria a lógica real de cancelamento
    setTimeout(() => {
      setShowCancelDialog(false);
      alert('Sua assinatura foi cancelada com sucesso. Você continuará com acesso ao plano atual até o final do período vigente.');
      // Em um cenário real, você atualizaria o estado com os dados da API
    }, 1000);
  };
  
  // Obter detalhes do plano atual
  const planDetails = getPlanDetails(plan);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <FaCreditCard className="mr-2" /> Gerenciar Assinatura
      </h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Resumo da assinatura */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Plano Atual</h2>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${planDetails.badge} mr-2`}>
                    {planDetails.icon} <span className="ml-1">{planDetails.name}</span>
                  </span>
                  <span className="text-lg font-bold">{planDetails.price}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Limites:</span> {planDetails.limits}
                </p>
                {startDate && plan !== SubscriptionPlan.FREE && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Data de início:</span> {startDate}
                  </p>
                )}
                {validUntil && plan !== SubscriptionPlan.FREE && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Válido até:</span> {validUntil}
                  </p>
                )}
                {nextBillingDate && plan !== SubscriptionPlan.FREE && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Próximo pagamento:</span> {nextBillingDate}
                  </p>
                )}
              </div>
              
              <div className="mt-4 md:mt-0">
                <Link 
                  href="/planos" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-300 flex items-center justify-center md:justify-start"
                >
                  <FaArrowRight className="mr-1" /> Alterar plano
                </Link>
                
                {plan !== SubscriptionPlan.FREE && (
                  <button 
                    onClick={() => setShowCancelDialog(true)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center justify-center md:justify-start"
                  >
                    <FaTimes className="mr-1" /> Cancelar assinatura
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Métodos de pagamento */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Métodos de Pagamento</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {method.brand === 'Visa' && <div className="w-10 h-6 bg-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>}
                        {method.brand === 'Mastercard' && <div className="w-10 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>}
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{method.brand} •••• {method.last4}</p>
                          {method.isDefault && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Principal</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Expira em {method.expiryMonth}/{method.expiryYear}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!method.isDefault && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Definir como principal
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
                
                <button className="mt-4 border border-dashed border-gray-300 rounded-lg p-4 w-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition duration-300">
                  <FaCreditCard className="mr-2" /> Adicionar novo cartão
                </button>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded-lg">
                <FaCreditCard className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-gray-700 mb-4">Você ainda não tem nenhum método de pagamento cadastrado.</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-300">
                  Adicionar cartão de crédito
                </button>
              </div>
            )}
          </div>
          
          {/* Histórico de pagamentos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaHistory className="mr-2" /> Histórico de Pagamentos
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comprovante
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.invoiceUrl && payment.status === 'approved' ? (
                            <a 
                              href={payment.invoiceUrl} 
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaFileInvoice className="mr-1" /> Ver recibo
                            </a>
                          ) : (
                            <span className="text-gray-400">Indisponível</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded-lg">
                <FaClipboardList className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-gray-700">Você ainda não tem nenhum histórico de pagamento.</p>
              </div>
            )}
          </div>
          
          {/* Modal de Cancelamento */}
          {showCancelDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center text-red-600">
                  <FaExclamationCircle className="mr-2" /> Cancelar assinatura
                </h3>
                <p className="mb-4 text-gray-700">
                  Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos seguintes benefícios:
                </p>
                <ul className="mb-4 space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <FaTimes className="mr-2 text-red-500" /> {planDetails.limits}
                  </li>
                  <li className="flex items-center">
                    <FaTimes className="mr-2 text-red-500" /> Prioridade nos resultados de busca
                  </li>
                  <li className="flex items-center">
                    <FaTimes className="mr-2 text-red-500" /> Estatísticas avançadas de anúncios
                  </li>
                </ul>
                <p className="mb-6 text-sm text-gray-600">
                  Você continuará com acesso ao plano atual até o final do período vigente, em {validUntil}.
                </p>
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setShowCancelDialog(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-300"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                  >
                    Confirmar cancelamento
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 