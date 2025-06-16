"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaBullhorn, 
  FaCheckCircle, FaInfoCircle, FaLightbulb, FaEye, FaWhatsapp,
  FaArrowUp, FaArrowDown, FaCrown, FaStopwatch, FaCreditCard,
  FaStar, FaShieldAlt, FaTrophy, FaTools, FaBriefcase
} from 'react-icons/fa';

// Array com os detalhes dos planos - movido para fora dos componentes para ser acessível globalmente
const plans = [
  {
    id: 'basic',
    name: 'Gratuito',
    tagline: 'Para iniciantes',
    price: 0,
    icon: <FaShieldAlt className="text-gray-500" />,
    features: {
      anunciosAtivos: '3',
      duracaoAnuncios: '30 dias',
      anunciosDestaque: '0',
      destaquesBusca: 'Não',
      estatisticas: 'Básicas',
      atendimento: 'E-mail',
      verificacao: 'Não',
      logo: 'Não',
      prioridade: 'Baixa',
      api: 'Não',
      destaqueAvulso: 'R$ 14,90',
      limitacaoEspecial: '1 anúncio gratuito a cada 90 dias'
    }
  },
  {
    id: 'micro_business',
    name: 'Micro-Empresa',
    tagline: 'Para microempreendedores',
    price: 24.90,
    icon: <FaBriefcase className="text-blue-500" />,
    features: {
      anunciosAtivos: '4',
      duracaoAnuncios: '60 dias',
      anunciosDestaque: '0',
      destaquesBusca: 'Não',
      estatisticas: 'Básicas',
      atendimento: 'E-mail',
      verificacao: 'Sim',
      logo: 'Não',
      prioridade: 'Baixa',
      api: 'Não',
      destaqueAvulso: 'R$ 9,90',
      limitacaoEspecial: 'Sem período de espera'
    }
  },
  {
    id: 'small_business',
    name: 'Pequena Empresa',
    tagline: 'Para pequenos negócios',
    price: 49.90,
    icon: <FaBriefcase className="text-green-500" />,
    popular: true,
    features: {
      anunciosAtivos: '5',
      duracaoAnuncios: '90 dias',
      anunciosDestaque: '1 por dia',
      destaquesBusca: 'Sim',
      estatisticas: 'Detalhadas',
      atendimento: 'Chat',
      verificacao: 'Sim',
      logo: 'Sim',
      prioridade: 'Média',
      api: 'Não',
      destaqueAvulso: 'R$ 9,90',
      limitacaoEspecial: '30 destaques incluídos/mês'
    }
  },
  {
    id: 'business_simple',
    name: 'Empresa Simples',
    tagline: 'Para empresas',
    price: 99.90,
    icon: <FaStar className="text-purple-500" />,
    features: {
      anunciosAtivos: '10',
      duracaoAnuncios: 'Ilimitada',
      anunciosDestaque: '2 por dia',
      destaquesBusca: 'Sim',
      estatisticas: 'Avançadas',
      atendimento: 'Prioritário',
      verificacao: 'Sim',
      logo: 'Sim',
      prioridade: 'Alta',
      api: 'Básica',
      destaqueAvulso: 'R$ 9,90',
      limitacaoEspecial: '60 destaques incluídos/mês'
    }
  },
  {
    id: 'business_plus',
    name: 'Empresa Plus',
    tagline: 'Para grandes negócios',
    price: 149.90,
    icon: <FaCrown className="text-yellow-500" />,
    recommended: true,
    features: {
      anunciosAtivos: '20',
      duracaoAnuncios: 'Ilimitada',
      anunciosDestaque: '3 por dia',
      destaquesBusca: 'Sim',
      estatisticas: 'Premium',
      atendimento: 'Dedicado',
      verificacao: 'Verificação Premium',
      logo: 'Sim + Destaque',
      prioridade: 'Máxima',
      api: 'Completa',
      destaqueAvulso: 'R$ 9,90',
      limitacaoEspecial: '90 destaques incluídos/mês'
    }
  }
];

// Definir um tipo para as chaves dos features
type FeatureKey = keyof typeof plans[0]['features'];

// Mapeamento de chaves para labels amigáveis
const featureLabels: Record<FeatureKey, string> = {
  anunciosAtivos: "Anúncios ativos",
  duracaoAnuncios: "Duração dos anúncios",
  anunciosDestaque: "Anúncios em destaque",
  destaquesBusca: "Destaque nos resultados",
  estatisticas: "Estatísticas",
  atendimento: "Atendimento",
  verificacao: "Verificação",
  logo: "Logo da empresa",
  prioridade: "Prioridade de indexação",
  api: "API para integrações",
  destaqueAvulso: "Destaque avulso",
  limitacaoEspecial: "Limitação especial"
};

// Formata o valor do recurso com os ícones apropriados
function getFeatureValue(value: boolean | number | string) {
  if (value === true) {
    return <FaCheck className="text-green-500" />;
  } else if (value === false) {
    return <FaTimes className="text-red-500" />;
  } else if (value === 'Não') {
    return <span className="text-red-500 text-sm">Não</span>;
  } else if (value === 'Sim') {
    return <span className="text-green-500 text-sm">Sim</span>;
  } else if (value === 'Básico') {
    return <span className="text-yellow-500 text-sm">Básico</span>;
  } else if (value === 'Avançado') {
    return <span className="text-green-500 text-sm">Avançado</span>;
  } else if (value === 'Premium') {
    return <span className="text-blue-500 text-sm">Premium</span>;
  } else if (value === 'Limitado') {
    return <span className="text-orange-500 text-sm">Limitado</span>;
  } else {
    return <span className="text-sm">{value}</span>;
  }
}

export default function Planos() {
  const [viewType, setViewType] = useState('cards');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentPlanRenewalDate, setCurrentPlanRenewalDate] = useState('');
  
  // Log do estado atual
  console.log('🔍 [RENDER] Estado atual do componente:', {
    viewType,
    currentPlanId,
    currentPlanRenewalDate
  });
  
  useEffect(() => {
    // Recupera o plano atual do usuário da API e do localStorage
    const fetchCurrentPlan = async () => {
      try {
        console.log('🔍 [DEBUG] Iniciando fetchCurrentPlan...');
        
        // Verificar se o usuário está logado
        const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
        const isLoggedInSS = sessionStorage.getItem('isLoggedIn') === 'true';
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const userId = userProfile.id;
        
        console.log('🔍 [DEBUG] Estado de autenticação:', {
          isLoggedInLS,
          isLoggedInSS,
          hasUserId: !!userId,
          userId: userId
        });
        
        if (!isLoggedInLS && !isLoggedInSS) {
          console.log('❌ [DEBUG] Usuário não logado, redirecionando...');
          // Se não estiver logado, redirecionar para login
          window.location.href = '/login';
          return;
        }
        
        // Tentar buscar o plano da API
        console.log('🔍 [DEBUG] Fazendo requisição para /api/subscriptions/current...');
        const response = await fetch(`/api/subscriptions/current?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('🔍 [DEBUG] Status da resposta:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [DEBUG] Dados recebidos da API:', data);
          
          // Plano vem da API com o formato correto (ex: "FREE", "BUSINESS_SIMPLE", etc.)
          const apiPlanId = mapSubscriptionPlanToLocalId(data.subscription?.plan || data.plan || 'free');
          console.log('🔍 [DEBUG] Plano mapeado:', apiPlanId);
          
          setCurrentPlanId(apiPlanId);
          
          // Define uma data de renovação fictícia (30 dias a partir de hoje)
          if (data.subscription?.renewalDate || data.renewalDate) {
            setCurrentPlanRenewalDate(new Date(data.subscription?.renewalDate || data.renewalDate).toLocaleDateString('pt-BR'));
          } else {
            const renewalDate = new Date();
            renewalDate.setDate(renewalDate.getDate() + 30);
            setCurrentPlanRenewalDate(renewalDate.toLocaleDateString('pt-BR'));
          }
        } else {
          console.log('❌ [DEBUG] Erro na resposta da API:', response.status);
          const errorData = await response.text();
          console.log('❌ [DEBUG] Dados do erro:', errorData);
          
          // Fallback: usar o plano gratuito se a API falhar
          setCurrentPlanId('basic');
          const renewalDate = new Date();
          renewalDate.setDate(renewalDate.getDate() + 30);
          setCurrentPlanRenewalDate(renewalDate.toLocaleDateString('pt-BR'));
        }
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao buscar plano atual:', error);
        // Fallback para o plano gratuito em caso de erro
        setCurrentPlanId('basic');
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + 30);
        setCurrentPlanRenewalDate(renewalDate.toLocaleDateString('pt-BR'));
      }
    };
    
    fetchCurrentPlan();
  }, []);
  
  // Função auxiliar para mapear o plano da API para o ID local
  const mapSubscriptionPlanToLocalId = (subscriptionPlan: string): string => {
    const planMap: Record<string, string> = {
      'FREE': 'basic',
      'MICRO_BUSINESS': 'micro_business',
      'SMALL_BUSINESS': 'small_business',
      'BUSINESS_SIMPLE': 'business_simple',
      'BUSINESS_PLUS': 'business_plus',
    };
    
    return planMap[subscriptionPlan] || 'basic'; // Retorna 'basic' (gratuito) como fallback
  };
  
  // Verifica o tipo de mudança de plano (upgrade, downgrade ou plano atual)
  const getPlanChangeType = (planId: string) => {
    console.log('🔍 [getPlanChangeType] Verificando:', { planId, currentPlanId });
    
    if (planId === currentPlanId) {
      console.log('🔍 [getPlanChangeType] Resultado: current');
      return 'current';
    }
    
    const currentPlanIndex = plans.findIndex(p => p.id === currentPlanId);
    const newPlanIndex = plans.findIndex(p => p.id === planId);
    
    console.log('🔍 [getPlanChangeType] Índices:', { currentPlanIndex, newPlanIndex });
    
    if (currentPlanIndex === -1 || newPlanIndex === -1) {
      console.log('🔍 [getPlanChangeType] Plano não encontrado, assumindo upgrade');
      return 'upgrade'; // Assumir upgrade se não encontrar o plano
    }
    
    const result = newPlanIndex > currentPlanIndex ? 'upgrade' : 'downgrade';
    console.log('🔍 [getPlanChangeType] Resultado:', result);
    return result;
  };
  
  const handleChangePlan = async (planId: string) => {
    // Teste simples para verificar se a função está sendo chamada
    alert(`Função chamada com planId: ${planId}`);
    
    console.log('🚀 [DEBUG] handleChangePlan chamada com planId:', planId);
    console.log('🚀 [DEBUG] currentPlanId atual:', currentPlanId);
    
    const changeType = getPlanChangeType(planId);
    console.log('🚀 [DEBUG] Tipo de mudança:', changeType);
    
    const plan = plans.find(p => p.id === planId);
    console.log('🚀 [DEBUG] Plano encontrado:', plan);
    
    if (!plan) {
      console.log('❌ [DEBUG] Plano não encontrado!');
      alert('Plano não encontrado. Por favor, tente novamente.');
      return;
    }
    
    // Se for o plano gratuito, ativar diretamente
    if (planId === 'basic') {
      console.log('🔄 [DEBUG] Ativando plano gratuito...');
      try {
        const response = await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          setCurrentPlanId(planId);
          alert(`Plano ${plan.name} ativado com sucesso!`);
          // Atualizar a data de renovação
          const renewalDate = new Date();
          renewalDate.setDate(renewalDate.getDate() + 30);
          setCurrentPlanRenewalDate(renewalDate.toLocaleDateString('pt-BR'));
        } else {
          const error = await response.json();
          alert(`Erro ao ativar plano: ${error.message || 'Tente novamente mais tarde'}`);
        }
        return;
      } catch (error) {
        console.error('Erro ao ativar plano gratuito:', error);
        alert('Não foi possível ativar o plano gratuito. Tente novamente mais tarde.');
        return;
      }
    }
    
    // Para os outros planos, redirecionar para a página correta de checkout
    console.log('🔄 [DEBUG] Processando plano pago...');
    
    if (changeType === 'upgrade') {
      console.log('⬆️ [DEBUG] Upgrade detectado, mostrando confirmação...');
      if (confirm(`Deseja fazer upgrade para o plano ${plan.name}? Você terá acesso imediato a mais recursos.`)) {
        console.log('✅ [DEBUG] Usuário confirmou upgrade, redirecionando...');
        const redirectUrl = `/painel-anunciante/planos/checkout?plan=${planId}`;
        console.log('🔗 [DEBUG] URL de redirecionamento:', redirectUrl);
        // Redirecionar para a página correta de checkout
        window.location.href = redirectUrl;
      } else {
        console.log('❌ [DEBUG] Usuário cancelou upgrade');
      }
    } else if (changeType === 'downgrade') {
      console.log('⬇️ [DEBUG] Downgrade detectado, mostrando confirmação...');
      if (confirm(`Tem certeza que deseja fazer downgrade para o plano ${plan.name}? Alguns recursos serão perdidos.`)) {
        console.log('✅ [DEBUG] Usuário confirmou downgrade, redirecionando...');
        const redirectUrl = `/painel-anunciante/planos/checkout?plan=${planId}`;
        console.log('🔗 [DEBUG] URL de redirecionamento:', redirectUrl);
        // Redirecionar para a página correta de checkout
        window.location.href = redirectUrl;
      } else {
        console.log('❌ [DEBUG] Usuário cancelou downgrade');
      }
    } else {
      console.log('⚠️ [DEBUG] Plano atual selecionado');
      alert(`Você já está no plano ${plan.name}.`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <Link href="/painel-anunciante" className="flex items-center text-blue-600 hover:text-blue-800 mr-4">
          <FaArrowLeft className="mr-1" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold flex-grow">Planos de Anúncio</h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewType('cards')}
            className={`px-3 py-1.5 rounded ${viewType === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Cartões
          </button>
          <button
            onClick={() => setViewType('table')}
            className={`px-3 py-1.5 rounded ${viewType === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Tabela
          </button>
        </div>
      </div>
      
      {currentPlanId && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Seu plano atual: <span className="font-bold">{plans.find(p => p.id === currentPlanId)?.name}</span></h2>
              <p className="text-blue-700 mt-1">Renovação automática em {currentPlanRenewalDate}</p>
            </div>
            <div className="mt-3 md:mt-0">
              <Link href="/painel-anunciante/pagamentos" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                <FaCreditCard className="mr-2" /> Gerenciar pagamento
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabela de comparação */}
      {viewType === 'table' && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm mt-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recursos</th>
                {plans.map(plan => (
                  <th 
                    key={plan.id} 
                    className={`px-4 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      plan.id === currentPlanId 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-500'
                    }`}
                  >
                    <div className="flex flex-col space-y-1">
                      <span className="flex items-center">
                        {plan.icon}
                        <span className="ml-2">{plan.name}</span>
                        {plan.id === currentPlanId && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">Atual</span>
                        )}
                      </span>
                      <span className="text-base font-bold text-gray-800">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                        {plan.price > 0 && <span className="text-xs font-normal text-gray-500">/mês</span>}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Linhas dinamicamente geradas baseadas nas características dos planos */}
              {Object.keys(featureLabels).map((featureKey) => (
                <FeatureRow key={featureKey} labelKey={featureKey as FeatureKey} />
              ))}
              
              {/* Linha com botões de seleção de plano */}
              <tr>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">Selecionar Plano</td>
                {plans.map(plan => (
                  <td key={plan.id} className="px-4 py-4">
                    {plan.id === currentPlanId ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm cursor-default w-full"
                      >
                        Plano Atual
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(plan.id)}
                        className={`px-4 py-2 rounded-md shadow-sm w-full ${
                          getPlanChangeType(plan.id) === 'upgrade'
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {getPlanChangeType(plan.id) === 'upgrade' ? 'Fazer Upgrade' : 'Mudar Plano'}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Cards de planos */}
      {viewType === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
          {plans.map(plan => (
            <div 
              key={plan.id}
              className={`border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md ${
                plan.id === currentPlanId 
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : plan.popular ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              <div className={`p-2 text-center text-sm font-medium ${
                plan.id === currentPlanId 
                  ? 'bg-blue-500 text-white'
                  : plan.popular ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {plan.id === currentPlanId 
                  ? 'Seu plano atual'
                  : plan.popular ? 'Mais popular' : plan.recommended ? 'Recomendado' : plan.tagline
                }
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.id === currentPlanId ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{plan.name}</h3>
                
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-sm">/mês</span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {Object.entries(plan.features).slice(0, 6).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className="mr-2 flex-shrink-0">
                        {typeof value === 'string' && (value === 'Sim' || value === 'Não') ? (
                          value === 'Sim' ? (
                            <FaCheck className="text-green-500" />
                          ) : (
                            <FaTimes className="text-red-500" />
                          )
                        ) : (
                          <FaCheck className="text-green-500" />
                        )}
                      </span>
                      <span className="text-sm text-gray-600">
                        {featureLabels[key as FeatureKey]}: <span className="font-medium">{value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                
                {plan.id === currentPlanId ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md font-medium cursor-default"
                  >
                    Plano Atual
                  </button>
                ) : (
                  <button
                    onClick={() => handleChangePlan(plan.id)}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      getPlanChangeType(plan.id) === 'upgrade'
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {getPlanChangeType(plan.id) === 'upgrade' ? 'Fazer Upgrade' : 'Mudar Plano'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <FaInfoCircle className="text-blue-500 mr-2" /> Como escolher o plano ideal?
            </h3>
            <p className="text-gray-600">
              O melhor plano depende do seu volume de anúncios. Se você tem poucos itens para anunciar, 
              o plano Básico pode ser suficiente. Para empresas e profissionais que dependem de visibilidade 
              constante, recomendamos os planos Profissional ou Business.
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <FaInfoCircle className="text-blue-500 mr-2" /> Posso mudar de plano a qualquer momento?
            </h3>
            <p className="text-gray-600">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
              Ao fazer upgrade, você terá acesso imediato aos novos recursos. 
              No caso de downgrade, as alterações entrarão em vigor no próximo ciclo de faturamento.
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <FaInfoCircle className="text-blue-500 mr-2" /> O que acontece se eu exceder o limite de anúncios?
            </h3>
            <p className="text-gray-600">
              Se você exceder o limite de anúncios do seu plano, será notificado e poderá optar por 
              fazer upgrade para um plano superior ou remover alguns anúncios. Os anúncios mais antigos 
              serão automaticamente definidos como inativos se o limite for ultrapassado.
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <FaInfoCircle className="text-blue-500 mr-2" /> Como funciona o destaque nos resultados?
            </h3>
            <p className="text-gray-600">
              Anúncios em destaque aparecem no topo dos resultados de busca e em seções especiais do site, 
              garantindo maior visibilidade. O período de destaque varia conforme seu plano e começa assim 
              que você marca um anúncio como destacado no seu painel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para linhas da tabela comparativa
function FeatureRow({ labelKey }: { labelKey: FeatureKey }) {
  return (
    <tr className="border-b border-gray-200 last:border-b-0">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {featureLabels[labelKey]}
      </td>
      {plans.map((plan) => (
        <td key={plan.id} className="px-6 py-4 text-sm text-center">
          {getFeatureValue(plan.features[labelKey])}
        </td>
      ))}
    </tr>
  );
} 