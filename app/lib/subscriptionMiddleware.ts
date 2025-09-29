import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlan } from '../models/types';
import { FeatureType } from './subscriptionContext';
import { getSubscriptionLimits } from '../config/subscription-limits';

// Mapeamento de recursos/funcionalidades para planos mínimos necessários
const featureToMinimumPlanMap: Record<FeatureType, SubscriptionPlan> = {
  'CREATE_AD': SubscriptionPlan.FREE,
  'CREATE_HIGHLIGHT': SubscriptionPlan.SMALL_BUSINESS,
  'FEATURED_AD': SubscriptionPlan.SMALL_BUSINESS,
  'ADVANCED_ANALYTICS': SubscriptionPlan.BUSINESS_SIMPLE,
  'STORE_PROFILE': SubscriptionPlan.BUSINESS_SIMPLE,
  'CUSTOMER_SUPPORT': SubscriptionPlan.BUSINESS_PLUS,
  'UNLIMITED_ADS': SubscriptionPlan.BUSINESS_PLUS
};

// Verificar se um plano tem acesso a um recurso
export const planHasAccess = (plan: SubscriptionPlan, feature: FeatureType): boolean => {
  const minimumPlan = featureToMinimumPlanMap[feature];
  
  // Mapeamento para valores numéricos para comparação de "nível"
  const planValues = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.MICRO_BUSINESS]: 1,
    [SubscriptionPlan.SMALL_BUSINESS]: 2,
    [SubscriptionPlan.BUSINESS_SIMPLE]: 3,
    [SubscriptionPlan.BUSINESS_PLUS]: 4
  };
  
  return planValues[plan] >= planValues[minimumPlan];
};

/**
 * Middleware para verificar se um usuário tem acesso a um recurso específico
 * Usar em combination com Next.js API routes ou server components
 */
export async function checkSubscriptionAccess(
  req: NextRequest,
  feature: FeatureType
): Promise<NextResponse | null> {
  // Em ambiente de desenvolvimento/mock, permitir acesso sem verificação
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_SUBSCRIPTION === 'true') {
    return null; // Continue com o request
  }
  
  // Obter ID do usuário da sessão (depende da implementação de autenticação)
  const userId = req.headers.get('x-user-id') || '';
  if (!userId) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
  }
  
  try {
    // Por enquanto, assumir plano gratuito para todos os usuários
    // TODO: Implementar busca real de assinatura quando métodos estiverem disponíveis
    const currentPlan = SubscriptionPlan.FREE;
    const hasAccess = planHasAccess(currentPlan, feature);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Plano atual não permite esta ação', 
        currentPlan,
        requiredPlan: featureToMinimumPlanMap[feature] 
      }, { status: 403 });
    }
    
    return null; // Continue com o request
  } catch (error) {
    // Erro ao verificar assinatura
    return NextResponse.json({ error: 'Erro ao verificar assinatura' }, { status: 500 });
  }
}

// FUNÇÃO REMOVIDA: Usar getSubscriptionLimits de ../config/subscription-limits ao invés desta
// Esta função duplicada foi removida para evitar inconsistências
// Import corrigido adicionado no topo do arquivo

/**
 * Middleware para verificar limites de anúncios/destaques
 * Pode ser usado em API routes específicas
 */
export async function checkResourceLimits(
  req: NextRequest,
  resourceType: 'ads' | 'highlights'
): Promise<NextResponse | null> {
  // Em ambiente de desenvolvimento/mock, permitir acesso sem verificação
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_SUBSCRIPTION === 'true') {
    return null; // Continue com o request
  }
  
  const userId = req.headers.get('x-user-id') || '';
  if (!userId) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
  }
  
  try {
    // Por enquanto, assumir plano gratuito para todos os usuários
    // TODO: Implementar busca real de assinatura quando métodos estiverem disponíveis
    const currentPlan = SubscriptionPlan.FREE;
    
    const limits = getSubscriptionLimits(currentPlan);
    
    // Esta parte depende de como os recursos são contados na sua aplicação
    // Aqui estamos simulando uma busca em API ou banco de dados
    let currentCount = 0;
    
    if (resourceType === 'ads') {
      // Buscar contagem atual de anúncios do usuário
      // Exemplo: currentCount = await getAdCountForUser(userId);
      currentCount = 0; // Substituir pela implementação real
      
      if (limits.maxAds !== -1 && currentCount >= limits.maxAds) {
        return NextResponse.json({ 
          error: 'Limite de anúncios atingido', 
          currentPlan,
          limit: limits.maxAds,
          count: currentCount
        }, { status: 403 });
      }
    } else if (resourceType === 'highlights') {
      // Buscar contagem atual de destaques do usuário
      // Exemplo: currentCount = await getHighlightCountForUser(userId);
      currentCount = 0; // Substituir pela implementação real
      
      // Usar maxFeatured ao invés de maxHighlights (que não existe)
      if (currentCount >= limits.maxFeatured) {
        return NextResponse.json({ 
          error: 'Limite de destaques atingido', 
          currentPlan,
          limit: limits.maxFeatured,
          count: currentCount
        }, { status: 403 });
      }
    }
    
    return null; // Continue com o request
  } catch (error) {
    // Erro ao verificar limites de recursos
    return NextResponse.json({ error: 'Erro ao verificar limites de recursos' }, { status: 500 });
  }
}

/**
 * Exemplo de como usar em uma API route:
 * 
 * export async function POST(req: NextRequest) {
 *   // Verificar se o usuário pode criar um anúncio
 *   const accessCheck = await checkSubscriptionAccess(req, 'CREATE_AD');
 *   if (accessCheck) return accessCheck;
 *   
 *   // Verificar se o usuário não atingiu o limite de anúncios
 *   const limitCheck = await checkResourceLimits(req, 'ads');
 *   if (limitCheck) return limitCheck;
 *   
 *   // Prosseguir com a lógica da rota...
 * }
 */ 