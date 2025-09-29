"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SubscriptionPlan, User } from '../models/types';
import { fetchSubscriptionInfo, planDisplayNames } from './subscriptionHelper';

// Interface para o contexto de assinatura
interface SubscriptionContextType {
  currentPlan: SubscriptionPlan;
  planDisplayName: string;
  isLoading: boolean;
  subscriptionData: {
    id?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    nextPaymentDate?: Date;
  } | null;
  hasPermission: (feature: FeatureType) => boolean;
  canCreateAd: boolean;
  canCreateHighlight: boolean;
  maxAds: number;
  maxHighlights: number;
  refreshSubscription: () => Promise<void>;
}

// Tipos de recursos/features baseados no plano
export type FeatureType = 
  | 'CREATE_AD'
  | 'CREATE_HIGHLIGHT'
  | 'FEATURED_AD'
  | 'ADVANCED_ANALYTICS'
  | 'STORE_PROFILE'
  | 'CUSTOMER_SUPPORT'
  | 'UNLIMITED_ADS';

// Definir limites e permissões para cada plano
const planFeatures = {
  [SubscriptionPlan.FREE]: {
    maxAds: 1,
    maxHighlights: 0,
    features: ['CREATE_AD'],
    highlightPrice: 9.90
  },
  [SubscriptionPlan.MICRO_BUSINESS]: {
    maxAds: 2,
    maxHighlights: 1,
    features: ['CREATE_AD', 'CREATE_HIGHLIGHT'],
    highlightPrice: 4.90
  },
  [SubscriptionPlan.SMALL_BUSINESS]: {
    maxAds: 5,
    maxHighlights: 2,
    features: ['CREATE_AD', 'CREATE_HIGHLIGHT'],
    highlightPrice: 4.90
  },
  [SubscriptionPlan.BUSINESS_SIMPLE]: {
    maxAds: 10,
    maxHighlights: 4,
    features: ['CREATE_AD', 'CREATE_HIGHLIGHT', 'FEATURED_AD', 'STORE_PROFILE'],
    highlightPrice: 4.90
  },
  [SubscriptionPlan.BUSINESS_PLUS]: {
    maxAds: 20,
    maxHighlights: 8,
    features: ['CREATE_AD', 'CREATE_HIGHLIGHT', 'FEATURED_AD', 'ADVANCED_ANALYTICS', 'STORE_PROFILE', 'CUSTOMER_SUPPORT'],
    highlightPrice: 4.90
  }
};

// Criar o contexto
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider que será usado no layout principal
export const SubscriptionProvider = ({ children, user }: { children: ReactNode, user?: User | null }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
  const [planDisplayName, setPlanDisplayName] = useState<string>(planDisplayNames[SubscriptionPlan.FREE]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionContextType['subscriptionData']>(null);

  // Carregar informações de assinatura
  const loadSubscriptionInfo = async () => {
    if (!user || !user.id) {
      console.log('Não há usuário logado ou falta id, definindo plano como FREE');
      setCurrentPlan(SubscriptionPlan.FREE);
      setPlanDisplayName(planDisplayNames[SubscriptionPlan.FREE]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Iniciando carregamento de informações de assinatura para:', user.name);
      console.log('ID do usuário:', user.id);
      console.log('Plano atual nos dados do usuário:', user.subscription);
      
      // Buscar dados reais da assinatura do banco de dados primeiro
      try {
        console.log('Buscando assinatura do usuário no banco de dados...');
        const subscriptionData = await fetchSubscriptionInfo();
        
        if (subscriptionData && subscriptionData.plan !== SubscriptionPlan.FREE) {
          console.log('Assinatura encontrada no banco:', subscriptionData);
          setCurrentPlan(subscriptionData.plan);
          setPlanDisplayName(subscriptionData.planName);
          setSubscriptionData({
            startDate: subscriptionData.startDate,
            endDate: subscriptionData.endDate,
            status: subscriptionData.status
          });
          console.log('Dados de assinatura definidos via API:', subscriptionData);
          setIsLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Erro ao buscar da API, tentando dados locais:', apiError);
      }
      
      // Se não encontrou no banco ou deu erro, usar dados locais como fallback
      if (false) { // Esta condição nunca será verdadeira, mantendo só para referência
        console.log('Usando dados locais para assinatura (ambiente de desenvolvimento)');
        
        // Garantir que temos um valor de plano válido
        let planToUse = SubscriptionPlan.FREE;
        
        // Verificação segura se o usuário e seus dados existem
        const safeUser = user as User; // Aqui sabemos que user não é null devido ao check acima
        if (safeUser.subscription) {
          // Verificar se é um valor válido do enum SubscriptionPlan
          if (Object.values(SubscriptionPlan).includes(safeUser.subscription as SubscriptionPlan)) {
            planToUse = safeUser.subscription as SubscriptionPlan;
          }
        }
        
        console.log('Plano definido:', planToUse);
        setCurrentPlan(planToUse);
        setPlanDisplayName(planDisplayNames[planToUse] || 'Desconhecido');
        
        // Garantir que todos os valores são definidos antes de usar
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;
        
        if (safeUser.subscriptionStartDate) {
          // Verificar se já é um objeto Date ou precisa ser convertido
          if (safeUser.subscriptionStartDate instanceof Date) {
            startDate = safeUser.subscriptionStartDate;
          } else {
            startDate = new Date(safeUser.subscriptionStartDate as unknown as string);
          }
        }
        
        if (safeUser.subscriptionEndDate) {
          // Verificar se já é um objeto Date ou precisa ser convertido
          if (safeUser.subscriptionEndDate instanceof Date) {
            endDate = safeUser.subscriptionEndDate;
          } else {
            endDate = new Date(safeUser.subscriptionEndDate as unknown as string);
          }
        }
        
        // Verificação segura para o status
        const status = endDate ? (endDate > new Date() ? 'active' : 'expired') : 'unknown';
        
        setSubscriptionData({
          startDate,
          endDate,
          status
        });
        
        console.log('Dados de assinatura definidos:', {
          startDate,
          endDate,
          status
        });
        
        // Também tentar buscar da API para garantir consistência
        try {
          const apiData = await fetchSubscriptionInfo();
          if (apiData.plan !== planToUse) {
            console.log('Diferença entre plano da API e plano local:', apiData.plan, planToUse);
            // Usar os dados da API se disponíveis
            setCurrentPlan(apiData.plan);
            setPlanDisplayName(apiData.planName);
            setSubscriptionData({
              startDate: apiData.startDate,
              endDate: apiData.endDate,
              status: apiData.status
            });
          }
        } catch (apiError) {
          console.error('Erro ao buscar da API, mantendo dados locais:', apiError);
        }
        
      } else {
        // Em produção, usar plano gratuito por enquanto
        // TODO: Implementar busca real de assinatura ASAAS quando métodos estiverem prontos
        setCurrentPlan(SubscriptionPlan.FREE);
      }
    } catch (error) {
      console.error('Erro ao carregar informações de assinatura:', error);
      // Fallback para o plano atual do usuário em caso de erro
      if (user) {
        setCurrentPlan(user.subscription || SubscriptionPlan.FREE);
      } else {
        setCurrentPlan(SubscriptionPlan.FREE);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Recarregar informações de assinatura (útil após uma atualização ou mudança de plano)
  const refreshSubscription = async () => {
    await loadSubscriptionInfo();
  };

  // Verificar permissões baseado no plano atual
  const hasPermission = (feature: FeatureType): boolean => {
    if (isLoading) return false;
    return planFeatures[currentPlan].features.includes(feature);
  };

  // Carregar inicialmente e quando o usuário mudar
  useEffect(() => {
    loadSubscriptionInfo();
  }, [user?.id]);

  // Valores computados
  const maxAds = planFeatures[currentPlan].maxAds;
  const maxHighlights = planFeatures[currentPlan].maxHighlights;
  const canCreateAd = hasPermission('CREATE_AD');
  const canCreateHighlight = hasPermission('CREATE_HIGHLIGHT');

  // Montar valor do contexto
  const value: SubscriptionContextType = {
    currentPlan,
    planDisplayName,
    isLoading,
    subscriptionData,
    hasPermission,
    canCreateAd,
    canCreateHighlight,
    maxAds,
    maxHighlights,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook personalizado para facilitar o uso do contexto
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn('useSubscription está sendo usado fora de um SubscriptionProvider. Usando plano padrão.');
    // Retornar valores padrão em vez de lançar erro
    return {
      currentPlan: SubscriptionPlan.FREE,
      planDisplayName: planDisplayNames[SubscriptionPlan.FREE],
      isLoading: false,
      subscriptionData: null,
      hasPermission: () => false,
      canCreateAd: false,
      canCreateHighlight: false,
      maxAds: planFeatures[SubscriptionPlan.FREE].maxAds,
      maxHighlights: planFeatures[SubscriptionPlan.FREE].maxHighlights,
      refreshSubscription: async () => { console.log('Refresh não disponível fora do provider'); }
    };
  }
  return context;
};

// Função auxiliar para verificar se um usuário pode realizar uma ação específica
export const canPerformAction = (
  user: User | undefined | null, 
  action: FeatureType
): boolean => {
  if (!user) return false;
  
  const plan = user.subscription || SubscriptionPlan.FREE;
  return planFeatures[plan].features.includes(action);
}; 