# Estratégia de Testes - BDC Classificados

## Status: ✅ ESTRATÉGIA DEFINIDA E IMPLEMENTADA

**Data da Criação**: Janeiro 2025  
**Escopo**: Estratégia completa de testes unitários, integração e e2e

---

## 🎯 Objetivo dos Testes

### Metas Principais
1. **Cobertura de 80%** dos componentes principais
2. **Testes de regressão** para funcionalidades críticas
3. **Validação de APIs** e integrações
4. **Testes de responsividade** e acessibilidade
5. **Performance** e carregamento

---

## 📊 Pirâmide de Testes

```
                   🔺 E2E Tests (10%)
                ────────────────────
              🔹 Integration Tests (20%)
          ──────────────────────────────────
        🔸 Unit Tests (70%)
    ────────────────────────────────────────────
```

### Distribuição Proposta
- **70% Testes Unitários**: Componentes, hooks, utilitários
- **20% Testes de Integração**: APIs, fluxos entre componentes
- **10% Testes E2E**: Jornadas críticas do usuário

---

## 🛠️ Stack de Ferramentas

### Testes Unitários e Integração
- **Jest**: Framework principal de testes
- **React Testing Library**: Testes de componentes React
- **jsdom**: Ambiente DOM simulado

### Testes E2E
- **Playwright**: Testes de navegador completos
- **Cypress**: Alternativa para testes interativos

### Ferramentas Auxiliares
- **MSW**: Mock de APIs HTTP
- **@testing-library/jest-dom**: Matchers customizados
- **@testing-library/user-event**: Simulação de eventos

---

## 📁 Estrutura de Arquivos

```
app/
├── __tests__/
│   ├── components/
│   │   ├── AdCard.test.tsx
│   │   ├── BusinessProfile.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useProfile.test.ts
│   │   ├── useAuth.test.ts
│   │   └── ...
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── validators.test.ts
│   │   └── ...
│   ├── api/
│   │   ├── ads.test.ts
│   │   ├── admin.test.ts
│   │   └── ...
│   └── setup.ts
├── __mocks__/
│   ├── supabase.ts
│   ├── asaas.ts
│   └── next-router.ts
└── e2e/
    ├── login.spec.ts
    ├── create-ad.spec.ts
    └── admin-panel.spec.ts
```

---

## 🧪 Configuração de Testes

### Jest Configuration (jest.config.js)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/app/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/__tests__/**',
    '!app/api/**', // APIs testadas separadamente
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Setup File (app/__tests__/setup.ts)
```typescript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Mock do Supabase
jest.mock('@/app/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    }
  }
}))

// Mock do Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Configurar MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

---

## 🧩 Testes de Componentes

### 1. Teste do AdCard
```typescript
// app/__tests__/components/AdCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdCard } from '@/app/components/AdCard'

const mockAd = {
  id: '123',
  title: 'iPhone 13 Pro - 256GB',
  price: 3500,
  image_url: '/test-image.jpg',
  location: 'São Paulo, SP',
  created_at: '2024-01-15T10:30:00Z',
  category: 'eletronicos',
  description: 'iPhone em ótimo estado'
}

describe('AdCard', () => {
  test('renderiza informações básicas do anúncio', () => {
    render(<AdCard ad={mockAd} />)
    
    expect(screen.getByText('iPhone 13 Pro - 256GB')).toBeInTheDocument()
    expect(screen.getByText('R$ 3.500')).toBeInTheDocument()
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument()
  })

  test('exibe "Grátis" para preço zero', () => {
    const adGratis = { ...mockAd, price: 0 }
    render(<AdCard ad={adGratis} />)
    
    expect(screen.getByText('Grátis')).toBeInTheDocument()
  })

  test('chama onClick com ID correto', async () => {
    const user = userEvent.setup()
    const mockClick = jest.fn()
    
    render(<AdCard ad={mockAd} onClick={mockClick} />)
    
    await user.click(screen.getByRole('article'))
    expect(mockClick).toHaveBeenCalledWith('123')
  })

  test('exibe botão de favorito quando habilitado', () => {
    render(<AdCard ad={mockAd} showFavoriteButton={true} />)
    
    expect(screen.getByRole('button', { name: /favoritar/i })).toBeInTheDocument()
  })

  test('aplica classe CSS customizada', () => {
    const { container } = render(
      <AdCard ad={mockAd} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
```

### 2. Teste do Hook useProfile
```typescript
// app/__tests__/hooks/useProfile.test.ts
import { renderHook, act } from '@testing-library/react'
import { useProfile } from '@/app/hooks/useProfile'

// Mock do Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}

jest.mock('@/app/lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('carrega perfil do usuário', async () => {
    const mockProfile = {
      id: '123',
      name: 'João Silva',
      email: 'joao@teste.com'
    }

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    const { result } = renderHook(() => useProfile())

    expect(result.current.loading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.profile).toEqual(mockProfile)
  })

  test('atualiza perfil com sucesso', async () => {
    const { result } = renderHook(() => useProfile())

    mockSupabase.from().update().eq.mockResolvedValue({
      data: {},
      error: null
    })

    await act(async () => {
      await result.current.updateProfile({ name: 'Novo Nome' })
    })

    expect(mockSupabase.from().update).toHaveBeenCalledWith({ name: 'Novo Nome' })
  })
})
```

---

## 🔌 Testes de API

### 1. Teste da API de Anúncios
```typescript
// app/__tests__/api/ads.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/ads/route'

describe('/api/ads', () => {
  test('GET retorna lista de anúncios', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: { limit: '10' }
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('POST cria novo anúncio', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token'
      },
      body: {
        title: 'Teste Anúncio',
        description: 'Descrição teste',
        price: 100,
        category: 'eletronicos'
      }
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })

  test('POST retorna erro sem autenticação', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        title: 'Teste'
      }
    })

    const response = await POST(req)

    expect(response.status).toBe(401)
  })
})
```

---

## 🛡️ Testes de Utilitários

### 1. Teste de Validadores
```typescript
// app/__tests__/lib/validators.test.ts
import { validateEmail, validatePhone, validateCPF } from '@/app/lib/validators'

describe('Validators', () => {
  describe('validateEmail', () => {
    test('aceita emails válidos', () => {
      expect(validateEmail('teste@exemplo.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@gmail.com')).toBe(true)
    })

    test('rejeita emails inválidos', () => {
      expect(validateEmail('email-inválido')).toBe(false)
      expect(validateEmail('@exemplo.com')).toBe(false)
      expect(validateEmail('teste@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    test('aceita telefones válidos', () => {
      expect(validatePhone('(11) 99999-9999')).toBe(true)
      expect(validatePhone('11999999999')).toBe(true)
      expect(validatePhone('+5511999999999')).toBe(true)
    })

    test('rejeita telefones inválidos', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('(11) 9999-999')).toBe(false)
      expect(validatePhone('abc123def')).toBe(false)
    })
  })

  describe('validateCPF', () => {
    test('aceita CPFs válidos', () => {
      expect(validateCPF('123.456.789-09')).toBe(true)
      expect(validateCPF('12345678909')).toBe(true)
    })

    test('rejeita CPFs inválidos', () => {
      expect(validateCPF('123.456.789-00')).toBe(false)
      expect(validateCPF('111.111.111-11')).toBe(false)
      expect(validateCPF('123')).toBe(false)
    })
  })
})
```

### 2. Teste de Formatadores
```typescript
// app/__tests__/lib/utils.test.ts
import { formatPrice, timeAgo, truncateText } from '@/app/lib/utils'

describe('Utils', () => {
  describe('formatPrice', () => {
    test('formata preços corretamente', () => {
      expect(formatPrice(0)).toBe('Grátis')
      expect(formatPrice(100)).toBe('R$ 100')
      expect(formatPrice(1000)).toBe('R$ 1.000')
      expect(formatPrice(1000000)).toBe('R$ 1.000.000')
    })
  })

  describe('timeAgo', () => {
    test('formata tempo relativo', () => {
      const agora = new Date()
      const umMinutoAtras = new Date(agora.getTime() - 60 * 1000)
      const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000)
      
      expect(timeAgo(umMinutoAtras.toISOString())).toBe('há 1 minuto')
      expect(timeAgo(umaHoraAtras.toISOString())).toBe('há 1 hora')
    })
  })

  describe('truncateText', () => {
    test('trunca texto longo', () => {
      const textoLongo = 'Este é um texto muito longo que precisa ser truncado'
      expect(truncateText(textoLongo, 20)).toBe('Este é um texto...')
    })

    test('mantém texto curto', () => {
      const textoCurto = 'Texto curto'
      expect(truncateText(textoCurto, 20)).toBe('Texto curto')
    })
  })
})
```

---

## 🎭 Mocks e Fixtures

### 1. Mock do Supabase
```typescript
// app/__mocks__/supabase.ts
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        limit: jest.fn(),
        order: jest.fn(),
      })),
      limit: jest.fn(),
      order: jest.fn(),
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
}
```

### 2. Fixtures de Dados
```typescript
// app/__tests__/fixtures/ads.ts
export const mockAds = [
  {
    id: '1',
    title: 'iPhone 13 Pro',
    price: 3500,
    image_url: '/test-image-1.jpg',
    location: 'São Paulo, SP',
    created_at: '2024-01-15T10:30:00Z',
    category: 'eletronicos',
    description: 'iPhone em ótimo estado',
    user_id: 'user-1',
  },
  {
    id: '2',
    title: 'Honda Civic 2020',
    price: 85000,
    image_url: '/test-image-2.jpg',
    location: 'Rio de Janeiro, RJ',
    created_at: '2024-01-14T15:20:00Z',
    category: 'veiculos',
    description: 'Carro seminovo',
    user_id: 'user-2',
  },
]

export const mockUser = {
  id: 'user-1',
  email: 'teste@exemplo.com',
  name: 'João Silva',
}
```

---

## 🎯 Testes E2E

### 1. Teste de Login
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'teste@exemplo.com')
    await page.fill('[data-testid="password-input"]', 'senha123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/painel')
    await expect(page.locator('[data-testid="user-name"]')).toContainText('João Silva')
  })

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'email@errado.com')
    await page.fill('[data-testid="password-input"]', 'senhaerrada')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})
```

### 2. Teste de Criar Anúncio
```typescript
// e2e/create-ad.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Create Ad Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'teste@exemplo.com')
    await page.fill('[data-testid="password-input"]', 'senha123')
    await page.click('[data-testid="login-button"]')
  })

  test('deve criar anúncio com sucesso', async ({ page }) => {
    await page.goto('/criar-anuncio')
    
    await page.fill('[data-testid="title-input"]', 'Teste E2E Anúncio')
    await page.fill('[data-testid="description-input"]', 'Descrição do teste')
    await page.fill('[data-testid="price-input"]', '1000')
    await page.selectOption('[data-testid="category-select"]', 'eletronicos')
    
    await page.click('[data-testid="submit-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page).toHaveURL(/\/anuncio\/.*/)
  })
})
```

---

## 📊 Scripts de Teste

### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## 📈 Cobertura e Métricas

### Objetivos de Cobertura
- **Componentes**: 90%
- **Hooks**: 85%
- **Utilitários**: 95%
- **APIs**: 80%
- **Global**: 85%

### Relatórios Automáticos
- **Jest Coverage**: HTML report em `coverage/`
- **Playwright Report**: HTML report em `playwright-report/`
- **Sonar**: Integração com SonarCloud (opcional)

---

## 🔧 Comandos Úteis

```bash
# Executar todos os testes
npm run test:all

# Executar testes específicos
npm test AdCard
npm test api/ads

# Watch mode para desenvolvimento
npm run test:watch

# Executar apenas testes E2E
npm run test:e2e

# Gerar relatório de cobertura
npm run test:coverage

# Executar testes E2E em modo visual
npm run test:e2e:ui
```

---

## 📋 Checklist de Implementação

### ✅ Configuração Base
- [x] Jest configurado
- [x] React Testing Library instalado
- [x] Playwright configurado
- [x] Mocks básicos criados

### 🔄 Testes em Desenvolvimento
- [x] AdCard component test
- [x] Utils functions test
- [x] Validators test
- [ ] BusinessProfile test
- [ ] useAuth hook test
- [ ] API routes tests

### ⏳ Testes Pendentes
- [ ] E2E tests completos
- [ ] Integration tests
- [ ] Performance tests
- [ ] Accessibility tests

---

## 🎯 Próximos Passos

1. **Completar testes unitários** dos componentes principais
2. **Implementar testes de integração** para fluxos críticos
3. **Criar testes E2E** para jornadas do usuário
4. **Configurar CI/CD** para execução automática
5. **Monitorar cobertura** e qualidade dos testes

---

> **Importante**: Esta estratégia garante qualidade e confiabilidade do código, facilitando manutenção e evolução do projeto. Os testes devem ser executados antes de cada deploy. 