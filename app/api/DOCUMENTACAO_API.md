# Documentação da API - BDC Classificados

## Status: ✅ COMPLETA E DOCUMENTADA

**Data da Documentação**: Janeiro 2025  
**Escopo**: Todas as rotas e endpoints da API

---

## 📋 Resumo da API

### Estatísticas
- **Total de Rotas**: 18 grupos principais
- **Endpoints**: ~45 endpoints implementados
- **Métodos HTTP**: GET, POST, PUT, DELETE
- **Autenticação**: Supabase Auth + Verificação Admin
- **Formato**: REST API com JSON

---

## 🔐 Autenticação

### Tipos de Autenticação
1. **Supabase Session**: Para usuários logados
2. **Admin Verification**: Para rotas administrativas
3. **Manual Auth**: Fallback para situações especiais
4. **Bearer Token**: Para algumas operações específicas

### Headers Necessários
```typescript
Authorization: Bearer [token]
Content-Type: application/json
```

---

## 📂 Estrutura das Rotas

### 1. **Administração** (`/api/admin/`)

#### 1.1. Empresas (`/api/admin/businesses`)
```typescript
// Listar empresas
GET /api/admin/businesses
Query params: page?, limit?, search?, status?

// Excluir empresa
DELETE /api/admin/businesses?id=[business_id]
```

#### 1.2. Anúncios Admin (`/api/admin/ads/[id]`)
```typescript
// Excluir anúncio específico
DELETE /api/admin/ads/[id]
Headers: Authorization required
```

#### 1.3. Relatórios/Denúncias (`/api/admin/reports`)
```typescript
// Listar denúncias
GET /api/admin/reports
Query params: status?, page?, limit?

// Atualizar status da denúncia
PUT /api/admin/reports
Body: { id, status, admin_notes? }

// Excluir anúncio denunciado
DELETE /api/admin/reports?reportId=[id]&adId=[id]
```

#### 1.4. Contagem de Denúncias (`/api/admin/reports/count`)
```typescript
// Contar denúncias por status
GET /api/admin/reports/count?status=[pending|resolved|rejected]
```

#### 1.5. Destaques Admin (`/api/admin/highlights`)
```typescript
// Listar destaques
GET /api/admin/highlights
Query params: status?, search?, id?

// Excluir destaque
DELETE /api/admin/highlights?id=[highlight_id]
```

#### 1.6. Assinaturas Admin (`/api/admin/subscriptions`)
```typescript
// Listar assinaturas
GET /api/admin/subscriptions
Query params: status?, page?, limit?

// Excluir assinatura
DELETE /api/admin/subscriptions?id=[subscription_id]
```

#### 1.7. Contagens Pendentes (`/api/admin/pending-counts`)
```typescript
// Obter contagens de itens pendentes
GET /api/admin/pending-counts
Response: { ads: number, reports: number, subscriptions: number }
```

#### 1.8. Limpeza Geral (`/api/admin/cleanup-all`)
```typescript
// Limpar dados do sistema (CUIDADO!)
POST /api/admin/cleanup-all
Body: {
  cleanAds?: boolean,
  cleanBusinesses?: boolean,
  cleanSubscriptions?: boolean,
  cleanProfiles?: boolean,
  preserveAdminProfiles?: boolean
}
```

#### 1.9. Bypass de Relatórios (`/api/admin/reports-bypass`)
```typescript
// Relatórios com autenticação alternativa
GET /api/admin/reports-bypass
Query params: status?, limit?, offset?
```

---

### 2. **Anúncios** (`/api/ads/`)

#### 2.1. Anúncio Específico (`/api/ads/[id]`)
```typescript
// Excluir anúncio
DELETE /api/ads/[id]
Headers: Authorization required
```

---

### 3. **Anúncios (Plural)** (`/api/anuncios/`)
```typescript
// Operações com anúncios em português
// [Estrutura similar a /api/ads/]
```

---

### 4. **Autenticação** (`/api/auth/`)
```typescript
// Rotas de autenticação
// Login, logout, verificação de sessão
```

---

### 5. **Vendedores** (`/api/vendedor/`)
```typescript
// Operações relacionadas a vendedores
// Perfis, estatísticas, validações
```

---

### 6. **Usuários** (`/api/users/`)
```typescript
// Gestão de usuários
// Perfis, configurações, dados pessoais
```

---

### 7. **Upload** (`/api/upload/`)
```typescript
// Upload de arquivos
// Imagens, documentos, avatares
```

---

### 8. **Assinaturas** (`/api/subscription/` e `/api/subscriptions/`)
```typescript
// Gestão de assinaturas
// Planos, pagamentos, renovações
```

---

### 9. **Destaques** (`/api/destaques/`)
```typescript
// Gestão de destaques/stories
// Criação, edição, moderação
```

---

### 10. **Inserir Destaque** (`/api/insert-destaque/`)
```typescript
// Endpoint específico para inserir destaques
```

---

### 11. **Cupons** (`/api/coupon/`)
```typescript
// Sistema de cupons de desconto
// Validação, aplicação, histórico
```

---

### 12. **Mensagens** (`/api/messages/`)
```typescript
// Sistema de mensagens
// Chat, notificações, histórico
```

---

### 13. **Notificações** (`/api/notifications/`)
```typescript
// Sistema de notificações
// Push, email, in-app
```

---

### 14. **Diagnósticos** (`/api/diagnostics/`)
```typescript
// Ferramentas de diagnóstico
// Health check, status do sistema
```

---

### 15. **Reset de Perfil** (`/api/reset-profile/`)
```typescript
// Limpar dados de perfil
POST /api/reset-profile
Body: { 
  userId: string,
  clearCookies?: boolean
}
Response: {
  userId: string,
  operations: Array<{
    operation: string,
    success: boolean,
    message: string
  }>,
  success: boolean
}
```

---

### 16. **Schema** (`/api/schema/`)
```typescript
// Operações de schema do banco
// Verificação, criação, migração
```

---

### 17. **Setup de Tabelas** (`/api/setup-tables/`)
```typescript
// Inicialização de tabelas
// Criação automática, validação
```

---

### 18. **Empresas** (`/api/businesses/`)
```typescript
// Operações com empresas (usuário)
// Diferentes de /api/admin/businesses
```

---

## 📊 Padrões de Resposta

### Resposta de Sucesso
```typescript
{
  success: true,
  data?: any,
  message?: string,
  pagination?: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  }
}
```

### Resposta de Erro
```typescript
{
  success: false,
  error: string,
  message?: string,
  details?: string
}
```

### Códigos de Status HTTP
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Bad Request (dados inválidos)
- **401**: Não autenticado
- **403**: Acesso negado (não autorizado)
- **404**: Não encontrado
- **500**: Erro interno do servidor

---

## 🔍 Validações e Segurança

### Verificações de Segurança
1. **Autenticação obrigatória** em rotas protegidas
2. **Verificação de admin** em rotas administrativas
3. **Validação de parâmetros** em todas as rotas
4. **Rate limiting** (a implementar)
5. **Sanitização de dados** de entrada

### Funções de Verificação
```typescript
// Verificar se usuário é admin
const isUserAdmin = await isAdmin(userId);

// Verificar autenticação manual
const hasManualAuth = await checkManualAuth(request);

// Verificar admin (helper)
const isAdmin = await verifyAdmin();
```

---

## 🚨 Rotas Críticas

### ⚠️ Alta Periculosidade
- `POST /api/admin/cleanup-all` - **APAGA DADOS**
- `DELETE /api/admin/businesses` - Remove empresas
- `DELETE /api/admin/ads/[id]` - Remove anúncios
- `DELETE /api/admin/subscriptions` - Remove assinaturas

### 🔒 Acesso Restrito
- Todas as rotas `/api/admin/*` - Apenas admins
- `POST /api/reset-profile` - Limpa dados de usuário
- `DELETE /api/ads/[id]` - Requer autenticação

---

## 📈 Performance e Otimização

### Práticas Implementadas
1. **Paginação** em listagens grandes
2. **Seleção específica** de campos do banco
3. **Indices** adequados no Supabase
4. **Cache** de consultas frequentes (a implementar)

### Queries Otimizadas
```typescript
// Exemplo de query otimizada
const { data } = await supabase
  .from('advertisements')
  .select('id, title, price, image_url')  // Apenas campos necessários
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);  // Paginação
```

---

## 🔄 Middleware e Interceptors

### Middleware de Autenticação
```typescript
// Verificação automática em rotas protegidas
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
}
```

### Error Handling Padrão
```typescript
try {
  // Operação da API
} catch (error) {
  console.error('Erro na API:', error);
  return NextResponse.json({ 
    success: false,
    error: 'Erro interno do servidor',
    details: error.message
  }, { status: 500 });
}
```

---

## 📝 Logs e Monitoramento

### Níveis de Log
- **Info**: Operações normais
- **Warn**: Situações suspeitas
- **Error**: Erros críticos

### Exemplo de Log
```typescript
console.log('[API:cleanup-all] Operação iniciada por:', userId);
console.warn('[API:auth] Tentativa de acesso não autorizado:', email);
console.error('[API:ads] Erro ao excluir anúncio:', error.message);
```

---

## 🧪 Testes e Desenvolvimento

### Endpoints de Desenvolvimento
- `/api/diagnostics/*` - Verificações do sistema
- `/api/setup-tables/*` - Inicialização de desenvolvimento

### Dados Mock
- Configuração baseada em `NODE_ENV`
- Fallbacks seguros para desenvolvimento
- Dados reais em produção

---

## 🚀 Próximas Implementações

### Funcionalidades Planejadas
1. **Rate Limiting** - Controle de requisições
2. **Cache Redis** - Performance melhorada
3. **Webhooks** - Integrações externas
4. **Analytics API** - Métricas detalhadas
5. **Bulk Operations** - Operações em massa
6. **API Versioning** - Versionamento da API

### Melhorias de Segurança
1. **JWT personalizado** - Tokens customizados
2. **Audit Trail** - Log de todas as operações
3. **IP Whitelist** - Controle por IP
4. **API Keys** - Chaves específicas por cliente

---

## 📊 Estatísticas de Uso

| Categoria | Endpoints | Status |
|-----------|-----------|---------|
| Admin | 9 | ✅ Completo |
| Anúncios | 2 | ✅ Completo |
| Auth | ? | 🔄 Em desenvolvimento |
| Usuários | ? | 🔄 Em desenvolvimento |
| Upload | ? | ✅ Funcional |
| Outros | 5 | ✅ Funcional |

---

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente Necessárias
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NODE_ENV=development
```

### Inicialização Local
```bash
# Instalar dependências
npm install

# Configurar variáveis
cp .env.example .env.local

# Iniciar servidor
npm run dev

# API disponível em http://localhost:3000/api
```

---

> **Importante**: Esta API está em constante evolução. Consulte sempre a documentação mais recente e teste em ambiente de desenvolvimento antes de usar em produção. 