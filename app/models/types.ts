// Tipos de usuário
export enum UserRole {
  VISITOR = 'visitor',
  ADVERTISER = 'advertiser',
  ADMIN = 'admin'
}

export enum SubscriptionPlan {
  FREE = 'free',
  MICRO_BUSINESS = 'micro_business',
  SMALL_BUSINESS = 'small_business',
  BUSINESS_SIMPLE = 'business_simple',
  BUSINESS_PLUS = 'business_plus'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  subscription: SubscriptionPlan;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  cardSaved: boolean;
  isVerified?: boolean;
  user?: {
    isVerified?: boolean;
  };
  // Controle para anúncios gratuitos
  freeAdUsed: boolean;            // Indica se o usuário já utilizou seu anúncio gratuito
  freeAdDate?: Date;              // Data em que o anúncio gratuito foi publicado
  freeAdExpiryDate?: Date;        // Data em que o usuário poderá publicar um novo anúncio gratuito
  freeAdId?: string;              // ID do anúncio gratuito ativo
}

// Tipos de categoria
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// Cidades disponíveis
export interface City {
  id: string;
  name: string;
  state: string;
  active: boolean;
}

// Informações do vendedor/loja
export interface Seller {
  id: number | string;
  name: string;
  avatar?: string;
  logo?: string;
  backgroundImage?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  rating?: number;
  reviewCount?: number;
  followers?: number;
  verifiedBadge?: boolean;
  foundedYear?: number;
  categoryId?: string;
  categoryName?: string;
  location?: string;
  tags?: string[];
  stories?: Story[];
  hasStories?: boolean;
  type?: string;
  joinDate?: string;
  verified?: boolean;
}

// Status de moderação para anúncios
export enum AdModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Status de moderação para empresas/classificados
export enum BusinessModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Anúncios
export interface Ad {
  id: string;
  title: string;
  price: number;
  description: string;
  category?: string;
  city?: string;
  state?: string;
  images: string[];
  photos?: Array<{
    id: string;
    file_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  primary_photo?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  expiresAt?: Date | string;
  views: number;
  status?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  whatsapp?: string;
  featured?: boolean;
  user?: User;
  seller?: Seller;
  isFavorite?: boolean;
  ratings?: number[];
  priceFormatted?: string;
  location?: string;
  categoryId?: string;
  categoryName?: string;
  condition?: 'new' | 'used' | 'refurbished';
  features?: string[];
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sellerVerified?: boolean;
  favorites?: number;
  promoted?: boolean;
  isFreeAd?: boolean;             // Indica se é um anúncio gratuito
  moderationStatus?: AdModerationStatus; // Status da moderação
  moderationReason?: string;      // Razão para rejeição, se aplicável
  moderationDate?: Date | string; // Data da última ação de moderação
  moderatedBy?: string;           // ID do administrador que moderou o anúncio
  shipping?: {
    free: boolean;
    price?: number;
  };
  acceptsExchange?: boolean;
  acceptsOffers?: boolean;
}

// Destaques (Stories)
export interface Highlight {
  id: string;
  title: string;
  description?: string;
  image: string;
  url: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  position?: number;
  isActive?: boolean;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  moderationStatus: HighlightModerationStatus;
  moderationReason?: string;
  moderatedAt?: string;
}

// Tipos de planos
export interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxAds: number;
  maxHighlightsPerDay: number;
  trialDays: number;
}

// Cupom de desconto
export interface Coupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  usage_limit: number;
  usage_count: number;
  usage_limit_per_user?: number;
  applicable_to?: string;
  plan_ids?: string[];
  valid_from?: string;
  valid_until: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  
  // Campos legados para compatibilidade
  discount?: number;
  type?: 'percentage' | 'fixed';
  validUntil?: Date;
  maxUses?: number;
  currentUses?: number;
  planId?: SubscriptionPlan;
  isActive?: boolean;
}

// Denúncia
export interface Report {
  id: string;
  type: 'ad' | 'highlight' | 'user';
  reason: string;
  description: string;
  targetId: string;
  reporterId: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
}

// Estatísticas
export interface Stats {
  totalUsers: number;
  totalAds: number;
  totalViews: number;
  activeSubscriptions: number;
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  adsByCategory: {
    category: string;
    count: number;
  }[];
  registrationsByDay: {
    date: string;
    count: number;
  }[];
}

export interface Store {
  id: string;
  userId?: string;
  name: string;
  userName?: string;
  showUserName?: boolean;
  description: string;
  logo: string;
  banner: string | null;
  bannerImage?: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  location?: string;
  city?: string;
  state?: string;
  established?: string;
  slug?: string;
  featured?: boolean;
  rating: number;
  reviewCount?: number;
  ratings: Rating[];
  featuredProducts: Ad[];
  products: Ad[];
  allProducts?: Ad[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
  verifiedBusiness?: boolean;
  subscriptionPlan?: string;
}

export interface Review {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Rating {
  id: string;
  storeId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: string;
  imageUrl: string;
  images: string[];
  stock: number;
  storeId: string;
  featured: boolean;
  free_shipping: boolean;
  condition: 'new' | 'used' | 'refurbished';
  sold: number;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tipo de mídia para destaques/stories
 */
export enum StoryMediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

/**
 * Prioridade de destaques/stories
 */
export enum StoryPriority {
  NORMAL = 0,
  FEATURED = 5,
  ADMIN = 10
}

/**
 * Interface para destacados/stories
 */
export interface Story {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  title: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  priority: StoryPriority;
  link?: string;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
  views: number;
}

/**
 * Enum para categorias de ramos de atividade para classificados
 */
export enum BusinessCategory {
  ALIMENTACAO = 'alimentacao',
  VESTUARIO = 'vestuario',
  SAUDE = 'saude',
  EDUCACAO = 'educacao',
  BELEZA = 'beleza',
  AUTOMOTIVO = 'automotivo',
  IMOVEIS = 'imoveis',
  SERVICOS = 'servicos',
  TECNOLOGIA = 'tecnologia',
  AGRONEGOCIO = 'agronegocio',
  CONSTRUCAO = 'construcao',
  FINANCAS = 'financas',
  TURISMO = 'turismo',
  EVENTOS = 'eventos',
  TRANSPORTE = 'transporte',
  ESPORTE = 'esporte',
  CULTURA = 'cultura',
  COMUNICACAO = 'comunicacao',
  INDUSTRIA = 'industria',
  COMERCIO = 'comercio',
  OUTROS = 'outros'
}

/**
 * Mapeamento para nomes legíveis de categorias de negócios
 */
export const businessCategoryNames: Record<BusinessCategory, string> = {
  [BusinessCategory.ALIMENTACAO]: 'Alimentação',
  [BusinessCategory.VESTUARIO]: 'Vestuário',
  [BusinessCategory.SAUDE]: 'Saúde',
  [BusinessCategory.EDUCACAO]: 'Educação',
  [BusinessCategory.BELEZA]: 'Beleza',
  [BusinessCategory.AUTOMOTIVO]: 'Automotivo',
  [BusinessCategory.IMOVEIS]: 'Imóveis',
  [BusinessCategory.SERVICOS]: 'Serviços',
  [BusinessCategory.TECNOLOGIA]: 'Tecnologia',
  [BusinessCategory.AGRONEGOCIO]: 'Agronegócio',
  [BusinessCategory.CONSTRUCAO]: 'Construção',
  [BusinessCategory.FINANCAS]: 'Finanças',
  [BusinessCategory.TURISMO]: 'Turismo',
  [BusinessCategory.EVENTOS]: 'Eventos',
  [BusinessCategory.TRANSPORTE]: 'Transporte',
  [BusinessCategory.ESPORTE]: 'Esporte',
  [BusinessCategory.CULTURA]: 'Cultura',
  [BusinessCategory.COMUNICACAO]: 'Comunicação',
  [BusinessCategory.INDUSTRIA]: 'Indústria',
  [BusinessCategory.COMERCIO]: 'Comércio',
  [BusinessCategory.OUTROS]: 'Outros'
}

/**
 * Interface para profile de negócio para classificados
 */
export interface BusinessProfile {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  banner?: string;
  description: string;
  categories: BusinessCategory[];
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    other?: string;
  };
  verified: boolean;
  userId: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  moderationStatus: BusinessModerationStatus;
  moderationReason?: string;
  moderationDate?: Date | string;
  moderatedBy?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    type?: string;
    createdAt: Date | string;
    avatarUrl?: string;
    isBlocked?: boolean;
    isVerified?: boolean;
  };
}

export enum HighlightModerationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
} 

type Advertisement = {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  createdAt: string;
  updatedAt: string;
  images: string[];
  isFeatured: boolean;
  moderationReason?: string;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  seller: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    type: 'personal' | 'business';
  };
};