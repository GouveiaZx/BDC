# Transição de Mock para Dados Reais - BDC Classificados

## Status: 🔄 EM PROGRESSO

**Data da Análise**: Janeiro 2025  
**Objetivo**: Migrar completamente de dados mock para dados reais do Supabase

---

## 📊 Resumo da Situação

### ✅ Já Migrado para Dados Reais
- `app/utils/mockData.ts` - Usa Supabase
- `app/utils/mockStore.ts` - Usa Supabase  
- Sistema de autenticação - Usa Supabase
- Perfis de usuário - Usa Supabase
- Business profiles - Usa Supabase

### 🔄 Configuração Mock/Real Baseada em Environment
- `app/lib/asaas.ts` - API Asaas (mock em dev, real em prod)
- `app/lib/subscriptionMiddleware.ts` - Assinaturas (mock em dev)
- `scripts/configure-asaas.js` - Configuração da API

### 🚨 Ainda Usando Dados Mock (Necessita Migração)

#### 1. **Painel Anunciante - Renovar Anúncio**
**Arquivo**: `app/painel-anunciante/renovar-anuncio/[id]/page.tsx`
**Linhas**: 37-51  
**Status**: Mock hardcoded
```typescript
const mockAd = {
  id: id,
  title: "iPhone 13 Pro - 256GB - Azul Sierra",
  description: "iPhone 13 Pro em excelente estado...",
  // ... dados mock
};
```
**Ação Necessária**: Migrar para busca real no Supabase

#### 2. **Relatórios de Analytics**
**Arquivo**: `app/painel-anunciante/relatorios/page.tsx`
**Linhas**: 14-25  
**Status**: Dados mock estáticos
```typescript
const mockData = {
  views: [120, 135, 140, 155, 165, 180, 190],
  clicks: [8, 12, 10, 15, 18, 22, 25],
  conversions: [1, 2, 1, 3, 4, 5, 6]
};
```
**Ação Necessária**: Implementar analytics reais com Supabase

#### 3. **Editar Anúncio**
**Arquivo**: `app/painel-anunciante/editar-anuncio/[id]/page.tsx`
**Linhas**: 68-105  
**Status**: Array mock hardcoded
```typescript
const mockAnuncios = [
  { id: '1', title: "iPhone 13 Pro", category: "eletronicos", ... },
  { id: '2', title: "Honda Civic 2020", category: "veiculos", ... },
  // ... mais dados mock
];
```
**Ação Necessária**: Buscar anúncio real do Supabase

#### 4. **Todos Stories da Empresa**
**Arquivo**: `app/empresa/[id]/todos-stories/page.tsx`
**Linhas**: 28-75  
**Status**: Mock seller e stories
```typescript
const mockSeller = {
  id: id,
  name: "Tech Store Premium",
  stories: [ /* dados mock */ ]
};
```
**Ação Necessária**: Buscar dados reais do business_profiles

#### 5. **Meu Perfil - Contagem de Anúncios**
**Arquivo**: `app/painel-anunciante/meu-perfil/page.tsx`
**Linha**: 146
**Status**: Contagem mock
```typescript
const mockCount = Math.floor(Math.random() * (limit + 2));
```
**Ação Necessária**: Contar anúncios reais do usuário

---

## 🔧 Plano de Migração

### Fase 1: Substituições Críticas (Prioridade Alta)

#### 1.1. Migrar Renovar Anúncio
```typescript
// ANTES (Mock)
const mockAd = { /* dados hardcoded */ };

// DEPOIS (Real)
const { data: ad, error } = await supabase
  .from('advertisements')
  .select('*')
  .eq('id', id)
  .eq('user_id', userId)
  .single();
```

#### 1.2. Migrar Editar Anúncio
```typescript
// ANTES (Mock)
const anuncio = mockAnuncios.find(ad => ad.id === anuncioId);

// DEPOIS (Real)
const { data: anuncio } = await supabase
  .from('advertisements')
  .select('*')
  .eq('id', anuncioId)
  .eq('user_id', userId)
  .single();
```

### Fase 2: Analytics e Relatórios (Prioridade Média)

#### 2.1. Implementar Analytics Reais
- Criar tabela `analytics_events` no Supabase
- Implementar tracking de views, clicks, conversions
- Criar queries agregadas para relatórios

#### 2.2. Stories da Empresa
- Conectar com tabela `destaques` existente
- Implementar busca por business_profile_id

### Fase 3: Limpeza e Otimização (Prioridade Baixa)

#### 3.1. Remover Código Mock
- Remover funções mock não utilizadas
- Limpar imports desnecessários
- Atualizar testes unitários

---

## 🛠️ Implementação das Migrações

### Migration 1: Renovar Anúncio

**Arquivo**: `app/painel-anunciante/renovar-anuncio/[id]/page.tsx`
**Mudanças**:
1. Remover dados mock
2. Adicionar função de busca real
3. Implementar loading states
4. Adicionar error handling

### Migration 2: Analytics Table

**SQL para Supabase**:
```sql
-- Criar tabela de eventos de analytics
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID REFERENCES advertisements(id),
  event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'conversion'
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_analytics_ad_id ON analytics_events(advertisement_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- RLS Policy
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their ad analytics" ON analytics_events
FOR SELECT USING (
  advertisement_id IN (
    SELECT id FROM advertisements WHERE user_id = auth.uid()
  )
);
```

### Migration 3: Funções RPC para Analytics

```sql
-- Função para obter estatísticas de anúncios
CREATE OR REPLACE FUNCTION get_ad_analytics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'views', COALESCE(views.data, '[]'::json),
    'clicks', COALESCE(clicks.data, '[]'::json),
    'conversions', COALESCE(conversions.data, '[]'::json)
  ) INTO result
  FROM (
    SELECT json_agg(daily_views ORDER BY date) as data
    FROM (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as daily_views
      FROM analytics_events ae
      JOIN advertisements a ON ae.advertisement_id = a.id
      WHERE a.user_id = p_user_id
        AND ae.event_type = 'view'
        AND ae.created_at >= NOW() - INTERVAL '%s days' % p_days
      GROUP BY DATE(created_at)
      ORDER BY date
    ) views_by_day
  ) views
  CROSS JOIN (
    SELECT json_agg(daily_clicks ORDER BY date) as data
    FROM (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as daily_clicks
      FROM analytics_events ae
      JOIN advertisements a ON ae.advertisement_id = a.id
      WHERE a.user_id = p_user_id
        AND ae.event_type = 'click'
        AND ae.created_at >= NOW() - INTERVAL '%s days' % p_days
      GROUP BY DATE(created_at)
      ORDER BY date
    ) clicks_by_day
  ) clicks
  CROSS JOIN (
    SELECT json_agg(daily_conversions ORDER BY date) as data
    FROM (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as daily_conversions
      FROM analytics_events ae
      JOIN advertisements a ON ae.advertisement_id = a.id
      WHERE a.user_id = p_user_id
        AND ae.event_type = 'conversion'
        AND ae.created_at >= NOW() - INTERVAL '%s days' % p_days
      GROUP BY DATE(created_at)
      ORDER BY date
    ) conversions_by_day
  ) conversions;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Cronograma de Execução

### Semana 1
- ✅ Análise completa dos mocks existentes
- ✅ Criação do plano de migração
- ⏳ Migração: Renovar Anúncio
- ⏳ Migração: Editar Anúncio

### Semana 2
- ⏳ Criação da tabela analytics_events
- ⏳ Implementação do tracking de analytics
- ⏳ Migração: Relatórios de Analytics

### Semana 3
- ⏳ Migração: Stories da Empresa
- ⏳ Migração: Contagem de Anúncios
- ⏳ Testes de integração

### Semana 4
- ⏳ Limpeza de código mock
- ⏳ Atualização de testes
- ⏳ Documentação final

---

## 🔍 Checklist de Verificação

### Antes da Migração
- [ ] Backup do banco de dados atual
- [ ] Testes da funcionalidade mock existente
- [ ] Validação dos dados de exemplo

### Durante a Migração
- [ ] Testes unitários funcionando
- [ ] Validação de dados em desenvolvimento
- [ ] Error handling implementado

### Após a Migração
- [ ] Todos os mocks removidos
- [ ] Performance adequada
- [ ] Documentação atualizada
- [ ] Deploy em produção testado

---

## 🚨 Configurações de Ambiente

### Desenvolvimento
```env
USE_MOCK_ASAAS=true
MOCK_SUBSCRIPTION=true
NODE_ENV=development
```

### Produção
```env
USE_MOCK_ASAAS=false
MOCK_SUBSCRIPTION=false
NODE_ENV=production
```

---

## 🔄 Status das Migrações

| Funcionalidade | Status | Prioridade | ETA |
|----------------|--------|------------|-----|
| Renovar Anúncio | 🔄 Em Progresso | Alta | Semana 1 |
| Editar Anúncio | 🔄 Em Progresso | Alta | Semana 1 |
| Analytics/Relatórios | ⏳ Pendente | Média | Semana 2 |
| Stories Empresa | ⏳ Pendente | Média | Semana 3 |
| Contagem Anúncios | ⏳ Pendente | Baixa | Semana 3 |
| Limpeza Código | ⏳ Pendente | Baixa | Semana 4 |

---

> **Nota**: Este documento será atualizado conforme as migrações forem sendo implementadas. O objetivo é ter 100% de dados reais em produção até o final do mês. 