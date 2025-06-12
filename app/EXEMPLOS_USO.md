# Exemplos de Uso - BDC Classificados

## Status: ✅ COMPLETO E ATUALIZADO

**Data da Documentação**: Janeiro 2025  
**Escopo**: Exemplos práticos de componentes, APIs e funcionalidades

---

## 🧩 Componentes Principais

### 1. AdCard - Card de Anúncio

#### Uso Básico
```tsx
import { AdCard } from '@/app/components/AdCard';

function ListaAnuncios() {
  const anuncio = {
    id: '123',
    title: 'iPhone 13 Pro',
    price: 3500,
    image_url: '/images/iphone.jpg',
    location: 'São Paulo, SP',
    created_at: '2024-01-15T10:30:00Z'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AdCard ad={anuncio} />
    </div>
  );
}
```

#### Uso Avançado com Eventos
```tsx
import { AdCard } from '@/app/components/AdCard';

function ListaAnunciosAvancada() {
  const handleAdClick = (adId: string) => {
    console.log('Anúncio clicado:', adId);
    // Registrar analytics
    trackEvent('ad_click', { ad_id: adId });
  };

  const handleFavorite = (adId: string) => {
    // Adicionar aos favoritos
    addToFavorites(adId);
  };

  return (
    <AdCard 
      ad={anuncio}
      onClick={handleAdClick}
      onFavorite={handleFavorite}
      showFavoriteButton={true}
      className="hover:shadow-xl transition-shadow"
    />
  );
}
```

### 2. BusinessProfile - Perfil de Empresa

#### Implementação Completa
```tsx
import { BusinessProfile } from '@/app/components/BusinessProfile';

function PaginaEmpresa({ empresaId }: { empresaId: string }) {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarEmpresa() {
      try {
        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', empresaId)
          .single();
        
        setEmpresa(data);
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarEmpresa();
  }, [empresaId]);

  if (loading) return <div>Carregando...</div>;
  if (!empresa) return <div>Empresa não encontrada</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <BusinessProfile 
        business={empresa}
        showContactButton={true}
        showStories={true}
      />
    </div>
  );
}
```

---

## 🔌 APIs - Exemplos de Uso

### 1. API de Anúncios

#### Criar Anúncio
```typescript
// POST /api/ads
async function criarAnuncio(dadosAnuncio: CreateAdRequest) {
  try {
    const response = await fetch('/api/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: dadosAnuncio.title,
        description: dadosAnuncio.description,
        price: dadosAnuncio.price,
        category: dadosAnuncio.category,
        images: dadosAnuncio.images
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao criar anúncio');
    }

    const resultado = await response.json();
    console.log('Anúncio criado:', resultado.data);
    return resultado.data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

#### Buscar Anúncios com Filtros
```typescript
// GET /api/ads
async function buscarAnuncios(filtros: {
  categoria?: string;
  preco_min?: number;
  preco_max?: number;
  cidade?: string;
  limite?: number;
  pagina?: number;
}) {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/ads?${params.toString()}`);
  const resultado = await response.json();
  
  return {
    anuncios: resultado.data,
    total: resultado.pagination?.total || 0,
    hasMore: resultado.pagination?.hasMore || false
  };
}

// Exemplo de uso
const { anuncios, total, hasMore } = await buscarAnuncios({
  categoria: 'eletronicos',
  preco_max: 5000,
  cidade: 'São Paulo',
  limite: 20,
  pagina: 1
});
```

### 2. API de Destaques/Stories

#### Criar Story
```typescript
// POST /api/destaques
async function criarStory(dadosStory: {
  business_profile_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  content?: string;
  duration?: number;
}) {
  const response = await fetch('/api/destaques', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dadosStory)
  });

  if (!response.ok) {
    throw new Error('Erro ao criar story');
  }

  return response.json();
}

// Exemplo de uso
await criarStory({
  business_profile_id: 'empresa-123',
  media_url: '/uploads/story-image.jpg',
  media_type: 'image',
  content: 'Nova promoção disponível!',
  duration: 15
});
```

#### Listar Stories Ativos
```typescript
// GET /api/destaques
async function listarStoriesAtivos() {
  const response = await fetch('/api/destaques?status=active&limit=10');
  const resultado = await response.json();
  
  return resultado.data.filter((story: any) => 
    new Date(story.expires_at) > new Date()
  );
}
```

### 3. API Admin

#### Moderar Denúncias
```typescript
// PUT /api/admin/reports
async function moderarDenuncia(
  reportId: string, 
  decisao: 'approved' | 'rejected',
  observacoes?: string
) {
  const response = await fetch('/api/admin/reports', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      id: reportId,
      status: decisao,
      admin_notes: observacoes
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao moderar denúncia');
  }

  return response.json();
}
```

#### Obter Dashboard Admin
```typescript
// GET /api/admin/pending-counts
async function obterContadores() {
  const response = await fetch('/api/admin/pending-counts', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const dados = await response.json();
  
  return {
    anunciosPendentes: dados.ads,
    denunciasPendentes: dados.reports,
    assinaturasPendentes: dados.subscriptions
  };
}
```

---

## 📊 Hooks Personalizados

### 1. useProfile - Gerenciar Perfil do Usuário

```typescript
import { useProfile } from '@/app/hooks/useProfile';

function MeuPerfil() {
  const { 
    profile, 
    loading, 
    error, 
    updateProfile 
  } = useProfile();

  const handleSalvar = async (dadosAtualizados: any) => {
    try {
      await updateProfile(dadosAtualizados);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar perfil');
    }
  };

  if (loading) return <div>Carregando perfil...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <form onSubmit={handleSalvar}>
      <input 
        type="text" 
        value={profile?.name || ''} 
        onChange={(e) => setProfile({...profile, name: e.target.value})}
      />
      <button type="submit">Salvar</button>
    </form>
  );
}
```

### 2. useAuth - Autenticação

```typescript
import { useAuth } from '@/app/hooks/useAuth';

function ComponenteProtegido() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        <p>Você precisa estar logado</p>
        <button onClick={() => login('email@exemplo.com', 'senha')}>
          Fazer Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Bem-vindo, {user?.email}!</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

---

## 🛡️ Utilitários e Helpers

### 1. formatPrice - Formatação de Preços

```typescript
import { formatPrice } from '@/app/lib/utils';

function ExemplosPreco() {
  return (
    <div>
      <p>Grátis: {formatPrice(0)}</p>          {/* "Grátis" */}
      <p>Mil: {formatPrice(1000)}</p>          {/* "R$ 1.000" */}
      <p>Milhão: {formatPrice(1000000)}</p>    {/* "R$ 1.000.000" */}
    </div>
  );
}
```

### 2. timeAgo - Tempo Relativo

```typescript
import { timeAgo } from '@/app/lib/utils';

function ListaAnuncios({ anuncios }: { anuncios: any[] }) {
  return (
    <div>
      {anuncios.map(anuncio => (
        <div key={anuncio.id}>
          <h3>{anuncio.title}</h3>
          <p>Publicado {timeAgo(anuncio.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. validateEmail - Validação

```typescript
import { validateEmail, validatePhone } from '@/app/lib/validators';

function FormularioContato() {
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros: string[] = [];

    if (!validateEmail(email)) {
      novosErros.push('Email inválido');
    }

    if (!validatePhone(telefone)) {
      novosErros.push('Telefone inválido');
    }

    setErros(novosErros);

    if (novosErros.length === 0) {
      // Enviar formulário
      console.log('Formulário válido!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="tel" 
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        placeholder="Telefone"
      />
      
      {erros.length > 0 && (
        <div className="error">
          {erros.map((erro, index) => (
            <p key={index}>{erro}</p>
          ))}
        </div>
      )}
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

---

## 🎨 Exemplos de Estilização

### 1. Usando Sistema de Design

```tsx
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';

function ExemploEstilizado() {
  return (
    <Card className="p-6 mb-4">
      <h2 className="text-2xl font-bold text-dark mb-4">
        Título Principal
      </h2>
      
      <p className="text-medium mb-6">
        Descrição do conteúdo aqui.
      </p>
      
      <div className="flex gap-4">
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => console.log('Ação primária')}
        >
          Ação Principal
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => console.log('Ação secundária')}
        >
          Ação Secundária
        </Button>
      </div>
    </Card>
  );
}
```

### 2. Classes Customizadas

```tsx
// Usando classes do Tailwind com padrões do projeto
function CardPersonalizado() {
  return (
    <div className="
      bg-card-bg 
      rounded-12 
      shadow-lg 
      p-6 
      hover:shadow-xl 
      transition-shadow 
      duration-300
      border 
      border-gray-100
    ">
      <div className="text-primary font-semibold mb-2">
        Destaque Verde
      </div>
      <div className="text-dark">
        Conteúdo principal
      </div>
    </div>
  );
}
```

---

## 🔄 Integrações

### 1. Upload de Imagens

```typescript
import { uploadToSupabase } from '@/app/lib/upload';

async function handleFileUpload(file: File) {
  try {
    // Validar arquivo
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Arquivo muito grande');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas imagens são permitidas');
    }

    // Upload para Supabase Storage
    const { url, error } = await uploadToSupabase(file, 'anuncios');
    
    if (error) {
      throw new Error('Erro no upload: ' + error.message);
    }

    console.log('Imagem enviada:', url);
    return url;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}

// Uso em componente
function FormularioAnuncio() {
  const [imagens, setImagens] = useState<string[]>([]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      try {
        const url = await handleFileUpload(file);
        setImagens(prev => [...prev, url]);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*"
        onChange={handleImageChange}
      />
      
      <div className="flex gap-2 mt-4">
        {imagens.map((url, index) => (
          <img 
            key={index}
            src={url} 
            alt={`Upload ${index + 1}`}
            className="w-20 h-20 object-cover rounded"
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Pagamentos com Asaas

```typescript
import { createAsaasCustomer, createAsaasPayment } from '@/app/lib/asaas';

async function processarPagamento(dadosPagamento: {
  valor: number;
  cliente: {
    nome: string;
    email: string;
    cpf: string;
  };
  plano: string;
}) {
  try {
    // 1. Criar cliente no Asaas
    const cliente = await createAsaasCustomer({
      name: dadosPagamento.cliente.nome,
      email: dadosPagamento.cliente.email,
      cpfCnpj: dadosPagamento.cliente.cpf
    });

    // 2. Criar cobrança
    const pagamento = await createAsaasPayment({
      customer: cliente.id,
      billingType: 'PIX',
      value: dadosPagamento.valor,
      dueDate: new Date().toISOString().split('T')[0], // Hoje
      description: `Plano ${dadosPagamento.plano}`
    });

    // 3. Retornar dados para o frontend
    return {
      paymentId: pagamento.id,
      pixCode: pagamento.pixTransaction?.qrCode?.payload,
      qrCodeImage: pagamento.pixTransaction?.qrCode?.encodedImage
    };
  } catch (error) {
    console.error('Erro no pagamento:', error);
    throw new Error('Falha ao processar pagamento');
  }
}
```

---

## 🧪 Exemplos de Testes

### 1. Teste de Componente

```typescript
// __tests__/AdCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AdCard } from '@/app/components/AdCard';

const mockAd = {
  id: '123',
  title: 'iPhone 13 Pro',
  price: 3500,
  image_url: '/test-image.jpg',
  location: 'São Paulo, SP',
  created_at: '2024-01-15T10:30:00Z'
};

describe('AdCard', () => {
  test('deve renderizar informações do anúncio', () => {
    render(<AdCard ad={mockAd} />);
    
    expect(screen.getByText('iPhone 13 Pro')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.500')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
  });

  test('deve chamar onClick quando clicado', () => {
    const mockClick = jest.fn();
    render(<AdCard ad={mockAd} onClick={mockClick} />);
    
    fireEvent.click(screen.getByRole('article'));
    expect(mockClick).toHaveBeenCalledWith('123');
  });
});
```

### 2. Teste de API

```typescript
// __tests__/api/ads.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/ads/route';

describe('/api/ads', () => {
  test('GET deve retornar lista de anúncios', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '10' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

## 📱 Exemplos Mobile-First

### 1. Layout Responsivo

```tsx
function LayoutResponsivo() {
  return (
    <div className="
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-3 
      xl:grid-cols-4 
      gap-4 
      p-4
    ">
      {/* Cards adaptam automaticamente */}
    </div>
  );
}
```

### 2. Menu Mobile

```tsx
import { useState } from 'react';

function MenuMobile() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
      >
        ☰
      </button>
      
      {isOpen && (
        <div className="
          absolute 
          top-full 
          left-0 
          w-full 
          bg-white 
          shadow-lg 
          z-50
        ">
          <nav className="p-4">
            <a href="/" className="block py-2">Início</a>
            <a href="/anuncios" className="block py-2">Anúncios</a>
            <a href="/empresas" className="block py-2">Empresas</a>
          </nav>
        </div>
      )}
    </div>
  );
}
```

---

## 📈 Performance e Otimização

### 1. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const ComponentePesado = lazy(() => import('./ComponentePesado'));

function PaginaComLazyLoading() {
  return (
    <div>
      <h1>Conteúdo Principal</h1>
      
      <Suspense fallback={<div>Carregando componente...</div>}>
        <ComponentePesado />
      </Suspense>
    </div>
  );
}
```

### 2. Debounce em Busca

```tsx
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

function BuscaComDebounce() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);

  const debouncedSearch = useMemo(
    () => debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2) {
        const response = await fetch(`/api/search?q=${searchTerm}`);
        const data = await response.json();
        setResultados(data.results);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(termo);
  }, [termo, debouncedSearch]);

  return (
    <div>
      <input 
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar..."
      />
      
      {resultados.length > 0 && (
        <ul className="mt-2">
          {resultados.map((item: any) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

> **Importante**: Estes exemplos cobrem os principais padrões de uso do projeto. Para implementações específicas, consulte sempre a documentação técnica atualizada e os tipos TypeScript disponíveis. 