"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCheck, FaTimes, FaCrown, FaRocket, FaRegBuilding, FaBuilding, FaChevronDown, FaChevronUp, FaCog, FaRegCreditCard, FaBarcode, FaQrcode, FaShieldAlt, FaBriefcase, FaStar } from 'react-icons/fa';
import { useSubscription } from '../lib/subscriptionContext';
import { SubscriptionPlan } from '../models/types';
import { useRouter } from 'next/navigation';
import { PLANS_CONFIG, formatPrice, getPlanById, PLAN_COLORS } from '../lib/plansConfig';

export default function Planos() {
  const router = useRouter();
  const { currentPlan, planDisplayName, isLoading } = useSubscription();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Adicionar pequeno delay para garantir que o localStorage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar múltiplas fontes de autenticação
      const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('sb-access-token');
      
      const isAuthenticated = !!(isLoggedInLS || userId || accessToken);
      setIsLoggedIn(isAuthenticated);
      setAuthChecked(true);
      
      console.log('🔍 Auth check na página de planos:', {
        isLoggedInLS,
        hasUserId: !!userId,
        hasToken: !!accessToken,
        isAuthenticated,
        timestamp: new Date().toISOString()
      });
    };
    
    checkAuth();
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen(index === faqOpen ? null : index);
  };

  // Usar configuração centralizada dos planos
  const plans = PLANS_CONFIG.map(plan => ({
    ...plan,
    icon: getIconForPlan(plan.id),
    cta: getCTAForPlan(plan)
  }));

  // Função para obter ícone baseado no plano
  function getIconForPlan(planId: string) {
    const iconClass = "text-xl mr-2";
    switch (planId) {
      case 'free':
        return <FaShieldAlt className={`text-gray-500 ${iconClass}`} />;
      case 'micro_business':
        return <FaRegBuilding className={`text-blue-500 ${iconClass}`} />;
      case 'small_business':
        return <FaBuilding className={`text-blue-600 ${iconClass}`} />;
      case 'business_simple':
        return <FaBuilding className={`text-green-500 ${iconClass}`} />;
      case 'business_plus':
        return <FaCrown className={`text-yellow-500 ${iconClass}`} />;
      default:
        return <FaShieldAlt className={`text-gray-500 ${iconClass}`} />;
    }
  }

  // Função para obter CTA personalizado
  function getCTAForPlan(plan: any) {
    if (plan.popular) return 'Mais Popular';
    if (plan.recommended) return 'Recomendado';
    if (plan.id === 'free') return 'Começar Grátis';
    return 'Contratar';
  }

  const faqs = [
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se fizer upgrade, o valor proporcional já pago será descontado do novo plano. Se fizer downgrade, o valor excedente ficará como crédito para o próximo período.'
    },
    {
      question: 'Como funciona o destaque de anúncios?',
      answer: 'Anúncios em destaque aparecem no topo dos resultados de busca, têm uma marcação visual diferenciada e são exibidos na página inicial do site na seção "Destaques". Isso aumenta significativamente a visibilidade e as chances de venda.'
    },
    {
      question: 'Qual é a forma de pagamento?',
      answer: 'Aceitamos cartões de crédito e débito de todas as bandeiras principais, além de boleto bancário e PIX para pagamentos no Brasil. Todas as transações são processadas de forma segura através do Stripe, líder mundial em pagamentos online.'
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim, você pode cancelar sua assinatura a qualquer momento. Se cancelar antes do fim do período, você ainda terá acesso aos recursos do plano até o final do ciclo de faturamento atual.'
    },
    {
      question: 'O que acontece com meus anúncios se eu cancelar?',
      answer: 'Se você cancelar sua assinatura paga, seus anúncios ativos permanecerão até o fim do período pago. Após isso, seu plano será convertido para o gratuito e apenas 3 anúncios ficarão ativos (os mais recentes). Os demais serão arquivados, mas poderão ser reativados se você assinar um plano pago novamente.'
    },
    {
      question: 'Existe um contrato de permanência?',
      answer: 'Não, não exigimos contratos de permanência mínima. Você pode utilizar nossos serviços pelo tempo que desejar, com liberdade para cancelar quando quiser.'
    },
  ];

  // Função para selecionar qualquer plano
  const handleSelectPlan = (plan: any) => {
    console.log('🎯 Plano selecionado:', plan);
    
    // Verificação mais robusta de autenticação
    const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('sb-access-token');
    
    const isAuthenticated = isLoggedInLS || userId || accessToken || isLoggedIn;
    
    console.log('🔍 Estado de autenticação:', {
      isLoggedInLS,
      hasUserId: !!userId,
      hasToken: !!accessToken,
      isLoggedInState: isLoggedIn,
      isAuthenticated
    });
    
    if (!isAuthenticated) {
      console.log('❌ Usuário não está logado, redirecionando para login');
      const redirectUrl = `/login?redirect=${encodeURIComponent('/painel-anunciante/planos')}`;
      window.location.assign(redirectUrl);
      return;
    }

    console.log('✅ Usuário autenticado, processando seleção de plano');

    // Se for plano gratuito, ativar diretamente
    if (plan.id === 'free') {
      console.log('🆓 Ativando plano gratuito');
      handleSelectFreePlan();
      return;
    }

    // Para planos pagos, redirecionar para checkout usando window.location.href
    const checkoutUrl = `/checkout?plan=${plan.id}`;
    console.log('💳 Redirecionando para checkout:', checkoutUrl);
    
    // Garantir que o redirecionamento funcione corretamente
    try {
      // Salvar o plano selecionado no localStorage para referência
      localStorage.setItem('selectedPlan', plan.id);
      localStorage.setItem('selectedPlanName', plan.name);
      localStorage.setItem('selectedPlanPrice', plan.price.toString());
      
      // Usar window.location.assign para garantir navegação correta (mesmo método do painel anunciante)
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error('Erro ao redirecionar para checkout:', error);
      // Fallback: tentar com router.push
      router.push(checkoutUrl);
    }
  };

  // Função para ativar o plano gratuito
  const handleSelectFreePlan = () => {

    // Obter o token de acesso do localStorage
    const accessToken = localStorage.getItem('sb-access-token');
    console.log('Token encontrado (handleSelectFreePlan):', accessToken ? `${accessToken.substring(0, 10)}...` : 'não encontrado');
    
    // Se não tiver token, mas tiver isLoggedIn, usamos uma abordagem simplificada
    if (!accessToken) {
      console.log('Token não encontrado, mas usuário marcado como logado. Criando acesso simplificado...');
      
      // Obter ID do usuário do localStorage ou gerar um temporário
      const userId = localStorage.getItem('userId') || 'temp-user-' + Date.now();
      
      // Configurar localStorage com informações básicas
      localStorage.setItem('userSubscription', SubscriptionPlan.FREE);
      localStorage.setItem('userId', userId);
      
      // Configurar cookies de sessão
      document.cookie = `user_subscription=${SubscriptionPlan.FREE}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `user_logged_in=true; path=/; max-age=2592000; SameSite=Lax`;
      
      // Fazer uma chamada de API para registrar o plano no servidor (modo simplificado)
      console.log('Registrando plano gratuito no servidor (modo simplificado)...');
      fetch('/api/subscriptions/activate-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId }),
        credentials: 'include',
      })
      .then(response => {
        console.log('Resposta recebida (modo simplificado), status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Dados da resposta (modo simplificado):', data);
      })
      .catch(error => {
        console.error('Erro na requisição (modo simplificado):', error);
      })
      .finally(() => {
        // Redirecionar para o painel independentemente do resultado da API
        console.log('Redirecionando para o painel (modo simplificado)...');
        setTimeout(() => {
          window.location.assign('/painel-anunciante');
        }, 500);
      });
      
      return;
    }
    
    // Para o plano gratuito, associar o plano ao usuário e redirecionar para o dashboard
    console.log('Enviando requisição para ativar plano gratuito...');
    fetch('/api/subscriptions/activate-free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ token: accessToken }),
      credentials: 'include',
    })
    .then(response => {
      console.log('Resposta recebida, status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Dados da resposta:', data);
      
      if (data.success) {
        console.log('Plano gratuito ativado com sucesso:', data);
        
        // Garantir que os dados do usuário estão no localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userSubscription', SubscriptionPlan.FREE);
        localStorage.setItem('subscriptionEndDate', data.endDate || '');
        
        // Redirecionar para o painel após um breve delay para permitir que os cookies sejam salvos
        console.log('Redirecionando para o painel de anunciante...');
        setTimeout(() => {
          window.location.assign('/painel-anunciante');
        }, 500);
      } else {
        console.error('Erro ao ativar plano gratuito:', data.message);
        alert('Houve um erro ao ativar o plano gratuito. Por favor, tente novamente.');
      }
    })
    .catch(error => {
      console.error('Erro na requisição ao ativar plano gratuito:', error);
      alert('Houve um erro ao ativar o plano gratuito. Por favor, tente novamente.');
    });
  };

  // Mostrar loading enquanto verifica autenticação e carrega assinatura
  if (!authChecked || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16 bg-white">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 bg-white">
      {/* Banner para gerenciar assinatura (apenas para usuários logados com plano pago) */}
      {!isLoading && isLoggedIn && currentPlan !== SubscriptionPlan.FREE && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              Você já possui o plano {planDisplayName}
            </h2>
            <p className="text-gray-600">
              Gerencie sua assinatura, veja detalhes do faturamento ou cancele quando quiser.
            </p>
          </div>
          <Link 
            href="/planos/gerenciar" 
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary text-black rounded-md hover:bg-primary-dark transition-colors"
          >
            <FaCog className="mr-2" />
            Gerenciar assinatura
          </Link>
        </div>
      )}
      
      {/* Cabeçalho da página */}
      <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">Escolha o plano ideal para você</h1>
        <p className="text-gray-700 text-lg mb-8">
          Temos opções para todos os tipos de anunciantes, desde usuários casuais até grandes empresas.
        </p>
        
        {/* ✅ DESTAQUE DO TRIAL GRATUITO */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <FaRocket className="text-green-600 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-green-800">30 Dias Gratuitos</h2>
          </div>
          <p className="text-green-700 text-lg mb-2">
            <strong>Todos os planos pagos incluem 30 dias de teste gratuito!</strong>
          </p>
          <p className="text-green-600 text-sm">
            Comece hoje mesmo com acesso completo aos recursos do plano escolhido. 
            A primeira cobrança só acontece após 30 dias.
          </p>
        </div>
        
        {/* Removendo o toggle de faturamento, mantendo apenas o Mensal */}
        <div className="inline-flex items-center bg-gray-800 p-1 rounded-lg">
          <div className="px-4 py-2 rounded-md bg-primary text-black">
                Mensal
          </div>
            </div>
          </div>
      
      {/* Cards de planos - utilizando o preço mensal diretamente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-12">
        {plans.map((plan, index) => {
          // Usando diretamente o preço mensal
          const price = plan.monthlyPrice;
          
          // Determinar se é o plano atual usando mapeamento correto
          const currentPlanMapped = getCurrentPlanId();
          const isPlanCurrent = currentPlanMapped === plan.id;
          
          console.log(`📊 Verificando plano ${plan.name}:`, {
            planId: plan.id,
            currentPlanMapped,
            isPlanCurrent,
            currentPlan
          });
          
          return (
            <div 
              key={plan.name} 
              className={`bg-white rounded-lg border ${
                plan.popular ? 'border-green-500 shadow-lg' : 'border-gray-200 shadow-md'
              } overflow-hidden relative transition-all duration-300 hover:scale-[1.02]`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-green-500 text-black text-xs font-bold py-1 text-center">
                  MAIS POPULAR
                </div>
              )}
              
              <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                <div className="flex items-center mb-4">
                  {plan.icon}
                  <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
                </div>
                <p className="text-gray-600 mb-6 h-12">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2).replace('.', ',')}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-500 ml-1">
                        /mês
                        </span>
                    )}
                      </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`block w-full py-3 px-4 rounded-lg text-center font-medium transition-all duration-300 ${
                      plan.popular
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : plan.id === 'free'
                        ? 'bg-gray-500 hover:bg-gray-600 text-white'
                        : plan.color === 'blue'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : plan.color === 'green' 
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-primary hover:bg-blue-600 text-white'
                  } ${isPlanCurrent ? 'cursor-default opacity-70' : ''}`}
                  onClick={() => {
                    if (!isPlanCurrent) {
                      handleSelectPlan(plan);
                    }
                  }}
                  disabled={isPlanCurrent}
                >
                  <div className="flex flex-col items-center">
                    <span>{getActionForPlan ? getActionForPlan(plan) : plan.cta}</span>
                    {/* ✅ INDICAÇÃO DE TRIAL PARA PLANOS PAGOS */}
                    {plan.id !== 'free' && !isPlanCurrent && (
                      <span className="text-xs opacity-90 mt-1">
                        🎉 30 dias grátis
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formas de pagamento */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          <FaRegCreditCard className="inline-block text-green-600 mr-2" /> Formas de pagamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-4 border border-gray-200 rounded-lg flex items-center bg-white shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaRegCreditCard className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Cartão de Crédito</h4>
              <p className="text-sm text-gray-500">Parcelamento em até 12x</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg flex items-center bg-white shadow-sm">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <FaBarcode className="text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Boleto Bancário</h4>
              <p className="text-sm text-gray-500">Vencimento em 3 dias úteis</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg flex items-center bg-white shadow-sm">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaQrcode className="text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Pix</h4>
              <p className="text-sm text-gray-500">Pagamento instantâneo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Garantia de satisfação */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm max-w-5xl mx-auto mb-12">
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
            <FaShieldAlt className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Garantia de satisfação</h3>
            <p className="text-gray-600">
              Todos os nossos planos incluem garantia de satisfação de 7 dias. 
              Se você não estiver satisfeito com os resultados, devolvemos o seu dinheiro.
            </p>
          </div>
        </div>
      </div>
            
      {/* Seção de FAQs */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center text-black">Perguntas Frequentes</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
            >
              <button 
                className="w-full px-4 sm:px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-medium text-white">{faq.question}</span>
                {faqOpen === index ? (
                  <FaChevronUp className="text-primary flex-shrink-0 ml-2 transition-transform duration-300" />
                ) : (
                  <FaChevronDown className="text-gray-400 flex-shrink-0 ml-2 transition-transform duration-300" />
                )}
              </button>
              
              {faqOpen === index && (
                <div className="p-4 pt-0 sm:p-6 sm:pt-0 text-gray-300 animate-fadeIn">
                  {faq.answer}
              </div>
              )}
            </div>
          ))}
        </div>
        </div>
        
      {/* CTA final */}
      <div className="text-center mt-12 sm:mt-16 mb-8 py-8 bg-gray-100 rounded-xl shadow-md">
        <h3 className="text-xl sm:text-2xl text-gray-800 font-bold mb-4">
          Ainda tem dúvidas sobre qual plano escolher?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Nossa equipe está pronta para ajudá-lo a encontrar a melhor solução para o seu negócio.
          Entre em contato e descubra como podemos impulsionar seus anúncios.
        </p>
        <Link
          href="/contato"
          className="inline-flex items-center bg-primary hover:bg-gray-800 hover:text-white text-black font-medium px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
        >
          <FaRocket className="mr-2" /> 
          Fale com nossa equipe
        </Link>
      </div>
    </div>
  );

  // Funções auxiliares para gerenciar planos
  function getActionForPlan(plan: any): string {
    // Verificar se é o plano atual do usuário
    const currentPlanId = getCurrentPlanId();
    if (currentPlanId === plan.id) {
      return 'Plano Atual';
    }
    
    // Verificar se é um downgrade
    if (currentPlanId && isDowngrade(currentPlanId, plan.id)) {
      return 'Fazer Downgrade';
    }
    
    // Verificar se é um upgrade
    if (currentPlanId && isUpgrade(currentPlanId, plan.id)) {
      return 'Fazer Upgrade';
    }
    
    return plan.cta;
  }

  function getCurrentPlanId(): string {
    // Mapear plano atual para ID usando a configuração centralizada
    const planMapping = {
      [SubscriptionPlan.FREE]: 'free',
      [SubscriptionPlan.MICRO_BUSINESS]: 'micro_business', 
      [SubscriptionPlan.SMALL_BUSINESS]: 'small_business',
      [SubscriptionPlan.BUSINESS_SIMPLE]: 'business_simple',
      [SubscriptionPlan.BUSINESS_PLUS]: 'business_plus'
    };
    
    const mappedPlan = planMapping[currentPlan];
    console.log('🗺️ Mapeamento de plano:', {
      currentPlan,
      mappedPlan,
      isLoading
    });
    
    return mappedPlan || 'free';
  }

  function isUpgrade(currentId: string, newId: string): boolean {
    const planOrder = ['free', 'micro_business', 'small_business', 'business_simple', 'business_plus'];
    const currentIndex = planOrder.indexOf(currentId);
    const newIndex = planOrder.indexOf(newId);
    return newIndex > currentIndex;
  }

  function isDowngrade(currentId: string, newId: string): boolean {
    const planOrder = ['free', 'micro_business', 'small_business', 'business_simple', 'business_plus'];
    const currentIndex = planOrder.indexOf(currentId);
    const newIndex = planOrder.indexOf(newId);
    return newIndex < currentIndex;
  }

  function isPlanCurrentHelper(plan: any): boolean {
    const currentPlanId = getCurrentPlanId();
    return currentPlanId === plan.id;
  }
} 