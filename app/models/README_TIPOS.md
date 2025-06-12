# Documentação dos Modelos de Dados - BDC Classificados

Este documento descreve os principais tipos e interfaces utilizados no sistema BDC Classificados.

## Status da Tipagem ✅ COMPLETA

Todos os componentes e APIs do projeto utilizam TypeScript com tipagem forte. Os principais modelos estão definidos em `app/models/types.ts`.

## Tipos de Usuário

### User
Interface principal para usuários do sistema.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  // Controle para anúncios gratuitos
  freeAdUsed: boolean;
  freeAdDate?: Date;
  freeAdExpiryDate?: Date;
  freeAdId?: string;
}
```

**Exemplo de uso:**
```typescript
// Em um componente
const user: User = {
  id: "123",
  name: "João Silva",
  email: "joao@example.com",
  role: UserRole.ADVERTISER,
  subscription: SubscriptionPlan.FREE,
  freeAdUsed: false
};
```

### UserRole
Enum que define os tipos de usuário:
- `VISITOR` - Visitante não autenticado
- `ADVERTISER` - Anunciante autenticado
- `ADMIN` - Administrador do sistema

### SubscriptionPlan
Enum que define os planos de assinatura:
- `FREE` - Plano gratuito
- `MICRO_BUSINESS` - Micro empresa
- `SMALL_BUSINESS` - Pequena empresa
- `BUSINESS_SIMPLE` - Empresa simples
- `BUSINESS_PLUS` - Empresa plus

## Anúncios

### Ad
Interface principal para anúncios.

```typescript
interface Ad {
  id: string;
  title: string;
  price: number;
  description: string;
  category?: string;
  city?: string;
  state?: string;
  images: string[];
  createdAt: Date | string;
  views: number;
  status?: string;
  featured?: boolean;
  isFreeAd?: boolean;
  moderationStatus?: AdModerationStatus;
  // Informações do vendedor
  userId?: string;
  userName?: string;
  userAvatar?: string;
  whatsapp?: string;
}
```

**Exemplo de uso:**
```typescript
// Criando um anúncio
const novoAnuncio: Ad = {
  id: "ad-123",
  title: "iPhone 13 Pro",
  price: 2500,
  description: "iPhone em ótimo estado",
  images: ["imagem1.jpg"],
  createdAt: new Date(),
  views: 0,
  moderationStatus: AdModerationStatus.PENDING
};
```

### AdModerationStatus
Enum para status de moderação:
- `PENDING` - Aguardando moderação
- `APPROVED` - Aprovado
- `REJECTED` - Rejeitado

## Lojas/Empresas

### Store
Interface para lojas e perfis de empresa.

```typescript
interface Store {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string | null;
  address: string;
  contactInfo: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  rating: number;
  products: Ad[];
  featuredProducts: Ad[];
  verifiedBusiness?: boolean;
  subscriptionPlan?: string;
}
```

**Exemplo de uso:**
```typescript
// Em uma página de loja
const loja: Store = {
  id: "store-123",
  name: "Loja Tech",
  description: "Especializada em eletrônicos",
  logo: "logo.jpg",
  banner: "banner.jpg",
  address: "Rua ABC, 123",
  contactInfo: {
    email: "contato@lojatech.com",
    phone: "11999887766",
    whatsapp: "11999887766"
  },
  socialMedia: {
    instagram: "@lojatech",
    website: "lojatech.com"
  },
  rating: 4.5,
  products: [],
  featuredProducts: [],
  verifiedBusiness: true
};
```

### BusinessProfile
Interface para perfis de negócio detalhados.

```typescript
interface BusinessProfile {
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
  verified: boolean;
  moderationStatus: BusinessModerationStatus;
}
```

## Categorias e Classificação

### Category
Interface para categorias de anúncios.

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}
```

### BusinessCategory
Enum com categorias de negócio:
- `ALIMENTACAO`, `VESTUARIO`, `SAUDE`, `EDUCACAO`
- `BELEZA`, `AUTOMOTIVO`, `IMOVEIS`, `SERVICOS`
- `TECNOLOGIA`, `AGRONEGOCIO`, `CONSTRUCAO`
- E outras categorias...

**Exemplo de uso:**
```typescript
// Definindo categoria da empresa
const categoria: BusinessCategory = BusinessCategory.TECNOLOGIA;
```

## Stories e Destaques

### Highlight
Interface para conteúdo em destaque (stories).

```typescript
interface Highlight {
  id: string;
  title: string;
  description?: string;
  image: string;
  url: string;
  status?: string;
  userId?: string;
  moderationStatus: HighlightModerationStatus;
}
```

### Story
Interface para stories de usuários.

```typescript
interface Story {
  id: string;
  userId: string;
  title: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  priority: StoryPriority;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
  views: number;
}
```

**Exemplo de uso:**
```typescript
// Criando um story
const story: Story = {
  id: "story-123",
  userId: "user-123",
  title: "Promoção especial",
  mediaUrl: "promo.jpg",
  mediaType: StoryMediaType.IMAGE,
  priority: StoryPriority.FEATURED,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  active: true,
  views: 0
};
```

## Avaliações e Feedback

### Rating
Interface para avaliações de lojas.

```typescript
interface Rating {
  id: string;
  storeId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
}
```

### Review
Interface para reviews/avaliações.

```typescript
interface Review {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  date: string;
}
```

## Validação de Tipos

### Type Guards
Funções utilitárias para validação de tipos:

```typescript
// Verificar se é um anúncio válido
function isValidAd(obj: any): obj is Ad {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.title === 'string' &&
         typeof obj.price === 'number' &&
         Array.isArray(obj.images);
}

// Verificar se é um usuário válido
function isValidUser(obj: any): obj is User {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.email === 'string';
}
```

## Transformações de Dados

### Conversão de API para Tipos
```typescript
// Transformar dados do Supabase para tipo Ad
function transformDbAdToAd(dbAd: any): Ad {
  return {
    id: dbAd.id,
    title: dbAd.title,
    price: parseFloat(dbAd.price),
    description: dbAd.description,
    images: dbAd.images || [],
    createdAt: dbAd.created_at,
    views: dbAd.views || 0,
    moderationStatus: dbAd.moderation_status as AdModerationStatus
  };
}
```

## Extensões de Tipos

### Tipos Derivados
```typescript
// Anúncio com informações calculadas
type AdWithExtras = Ad & {
  priceFormatted: string;
  timeAgo: string;
  isNew: boolean;
};

// Loja com estatísticas
type StoreWithStats = Store & {
  totalProducts: number;
  avgRating: number;
  totalViews: number;
};
```

## Status da Implementação

### ✅ Completamente Tipado
- Todas as interfaces principais definidas
- Enums para valores constantes  
- Type guards para validação
- Exemplos de uso documentados

### ✅ Componentes Compatíveis
- Todos os componentes React usam props tipadas
- APIs retornam tipos corretos
- Hooks customizados são tipados

### ✅ Cobertura de Testes
- Mocks utilizam tipos corretos
- Testes verificam tipagem
- Dados de teste são type-safe

## Boas Práticas

1. **Sempre usar interfaces TypeScript**
2. **Definir enums para valores constantes**
3. **Criar type guards para validação**
4. **Documentar exemplos de uso**
5. **Manter tipos atualizados com mudanças no banco**
6. **Usar tipos derivados para computações** 