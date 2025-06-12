// 🎯 CONFIGURAÇÃO CENTRALIZADA DOS PLANOS
// Este arquivo contém a configuração única dos planos que deve ser usada em todo o projeto

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  icon?: string;
  color: string;
  popular?: boolean;
  recommended?: boolean;
  cta: string;
  features: PlanFeature[];
  
  // Recursos técnicos
  max_ads: number;
  max_highlights_per_day: number;
  ad_duration_days: number;
  max_photos_per_ad: number;
  has_premium_features: boolean;
  max_business_categories: number;
  
  // Configurações de preços especiais
  extra_ad_price: number;
  highlight_price: number;
}

// ✅ CONFIGURAÇÃO ÚNICA DOS PLANOS
export const PLANS_CONFIG: PlanConfig[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para usuários iniciantes',
    slug: 'gratuito',
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: 'gray',
    popular: false,
    cta: 'Começar Grátis',
    max_ads: 1,
    max_highlights_per_day: 0,
    ad_duration_days: 30,
    max_photos_per_ad: 5,
    has_premium_features: false,
    max_business_categories: 1,
    extra_ad_price: 24.90,
    highlight_price: 9.90,
    features: [
      { text: '1 anúncio a cada 60 dias', included: true },
      { text: 'Duração de 30 dias', included: true },
      { text: 'Até 5 fotos por anúncio', included: true },
      { text: 'Anúncio extra por R$ 24,90', included: true },
      { text: 'Destaque por R$ 9,90 cada', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'Compartilhamento em redes sociais', included: true },
      { text: 'Estatísticas básicas', included: false },
      { text: 'Verificação do perfil', included: false },
      { text: 'Atendimento prioritário', included: false }
    ]
  },
  {
    id: 'micro_business',
    name: 'Microempresa', 
    description: 'Para micro empreendedores',
    slug: 'microempresa',
    monthlyPrice: 24.90,
    yearlyPrice: 249.00, // 10 meses pelo preço de 12
    color: 'primary',
    popular: false,
    cta: 'Contratar',
    max_ads: 2,
    max_highlights_per_day: 1,
    ad_duration_days: 60,
    max_photos_per_ad: 8,
    has_premium_features: false,
    max_business_categories: 2,
    extra_ad_price: 14.90,
    highlight_price: 4.90,
    features: [
      { text: '2 anúncios simultâneos', included: true },
      { text: 'Duração de 60 dias', included: true },
      { text: 'Até 8 fotos por anúncio', included: true },
      { text: '1 destaque por dia', included: true },
      { text: 'Anúncio extra por R$ 14,90', included: true },
      { text: 'Destaque extra por R$ 4,90', included: true },
      { text: 'Estatísticas básicas', included: true },
      { text: 'Atendimento padrão', included: true },
      { text: 'Verificação do perfil', included: false },
      { text: 'Logo na página de anúncios', included: false }
    ]
  },
  {
    id: 'small_business',
    name: 'Pequena Empresa',
    description: 'Para pequenos negócios',
    slug: 'pequena-empresa',
    monthlyPrice: 49.90,
    yearlyPrice: 499.00, // 10 meses pelo preço de 12
    color: 'blue',
    popular: true,
    cta: 'Mais Popular',
    max_ads: 5,
    max_highlights_per_day: 2,
    ad_duration_days: 90,
    max_photos_per_ad: 10,
    has_premium_features: true,
    max_business_categories: 3,
    extra_ad_price: 14.90,
    highlight_price: 4.90,
    features: [
      { text: '5 anúncios simultâneos', included: true },
      { text: 'Duração de 90 dias', included: true },
      { text: 'Até 10 fotos por anúncio', included: true },
      { text: '2 destaques por dia', included: true },
      { text: 'Anúncio extra por R$ 14,90', included: true },
      { text: 'Destaque extra por R$ 4,90', included: true },
      { text: 'Estatísticas detalhadas', included: true },
      { text: 'Atendimento prioritário', included: true },
      { text: 'Verificação do perfil', included: true },
      { text: 'Logo na página de anúncios', included: false }
    ]
  },
  {
    id: 'business_simple',
    name: 'Empresa',
    description: 'Para empresas estabelecidas', 
    slug: 'empresa',
    monthlyPrice: 99.90,
    yearlyPrice: 999.00, // 10 meses pelo preço de 12
    color: 'green',
    popular: false,
    cta: 'Contratar',
    max_ads: 10,
    max_highlights_per_day: 4,
    ad_duration_days: 120,
    max_photos_per_ad: 15,
    has_premium_features: true,
    max_business_categories: 5,
    extra_ad_price: 14.90,
    highlight_price: 4.90,
    features: [
      { text: '10 anúncios simultâneos', included: true },
      { text: 'Duração de 120 dias', included: true },
      { text: 'Até 15 fotos por anúncio', included: true },
      { text: '4 destaques por dia', included: true },
      { text: 'Anúncio extra por R$ 14,90', included: true },
      { text: 'Destaque extra por R$ 4,90', included: true },
      { text: 'Estatísticas avançadas', included: true },
      { text: 'Atendimento prioritário', included: true },
      { text: 'Verificação do perfil', included: true },
      { text: 'Logo na página de anúncios', included: true },
      { text: 'Relatórios mensais', included: true }
    ]
  },
  {
    id: 'business_plus',
    name: 'Empresa Plus',
    description: 'Para grandes anunciantes',
    slug: 'empresa-plus',
    monthlyPrice: 149.90,
    yearlyPrice: 1499.00, // 10 meses pelo preço de 12
    color: 'yellow',
    popular: false,
    recommended: true,
    cta: 'Recomendado',
    max_ads: 20,
    max_highlights_per_day: 8,
    ad_duration_days: -1, // Ilimitado
    max_photos_per_ad: 20,
    has_premium_features: true,
    max_business_categories: 10,
    extra_ad_price: 14.90,
    highlight_price: 4.90,
    features: [
      { text: '20 anúncios simultâneos', included: true },
      { text: 'Duração ilimitada', included: true },
      { text: 'Até 20 fotos por anúncio', included: true },
      { text: '8 destaques por dia', included: true },
      { text: 'Anúncio extra por R$ 14,90', included: true },
      { text: 'Destaque extra por R$ 4,90', included: true },
      { text: 'Estatísticas profissionais em tempo real', included: true },
      { text: 'Atendimento VIP', included: true },
      { text: 'Verificação premium do perfil', included: true },
      { text: 'Logo com destaque', included: true },
      { text: 'Acesso antecipado a recursos', included: true },
      { text: 'Perfil personalizado', included: true },
      { text: 'API para integrações', included: true }
    ]
  }
];

// 🔄 MAPEAMENTO PARA COMPATIBILIDADE
export const PLAN_ID_MAP = {
  // IDs antigos → IDs novos
  'MICRO_EMPRESA': 'micro_business',
  'PEQUENA_EMPRESA': 'small_business', 
  'EMPRESA_SIMPLES': 'business_simple',
  'EMPRESA_PLUS': 'business_plus',
  'FREE': 'free',
  'GRATUITO': 'free',
  
  // Database IDs → Frontend IDs
  'c62ad75c-26fc-4597-abd7-743478402a34': 'free',
  'e10442e4-6404-4baa-97b1-71c6d48c326e': 'micro_business',
  '883ccc6b-9e32-402b-b3c3-ee70c9e20ef9': 'small_business',
  'e793129c-712c-4fb6-bd38-47e2652010aa': 'business_simple',
  '54a87b2b-f9b3-446a-979f-9ed8fef5ded5': 'business_plus'
};

// 📊 FUNÇÕES UTILITÁRIAS
export function getPlanById(id: string): PlanConfig | null {
  const mappedId = PLAN_ID_MAP[id as keyof typeof PLAN_ID_MAP] || id;
  return PLANS_CONFIG.find(plan => plan.id === mappedId) || null;
}

export function getPlanBySlug(slug: string): PlanConfig | null {
  return PLANS_CONFIG.find(plan => plan.slug === slug) || null;
}

export function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

export function getMonthlyInstallments(yearlyPrice: number): string {
  const monthly = yearlyPrice / 12;
  return `12x de ${formatPrice(monthly)}`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const yearlyByMonthly = monthlyPrice * 12;
  return yearlyByMonthly - yearlyPrice;
}

export function getPlanFeatures(planId: string): PlanFeature[] {
  const plan = getPlanById(planId);
  return plan?.features || [];
}

export function isPlanPopular(planId: string): boolean {
  const plan = getPlanById(planId);
  return plan?.popular || false;
}

export function isPlanRecommended(planId: string): boolean {
  const plan = getPlanById(planId);
  return plan?.recommended || false;
}

// 🎨 CORES DOS PLANOS
export const PLAN_COLORS = {
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    button: 'bg-gray-500 hover:bg-gray-600',
    icon: 'text-gray-500'
  },
  primary: {
    bg: 'bg-blue-50',
    border: 'border-blue-200', 
    text: 'text-blue-700',
    button: 'bg-blue-500 hover:bg-blue-600',
    icon: 'text-blue-500'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800', 
    button: 'bg-green-600 hover:bg-green-700',
    icon: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    icon: 'text-yellow-600'
  }
};

export default PLANS_CONFIG; 