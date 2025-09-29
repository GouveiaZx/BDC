# Documentação do Painel Administrativo - BDC Classificados

## Status: ✅ PAINEL COMPLETO E FUNCIONAL

**Data da Documentação**: Janeiro 2025  
**Escopo**: Painel administrativo completo com todas as funcionalidades

---

## 🏛️ Visão Geral

O painel administrativo do BDC Classificados é uma interface completa para gerenciamento da plataforma, oferecendo controle total sobre usuários, anúncios, assinaturas, moderação e analytics.

### 🔑 Acesso ao Painel
- **URL**: `/admin`
- **Login**: `/admin/login`
- **Autenticação**: Sistema próprio com senha segura
- **Permissões**: Apenas administradores autorizados

---

## 📊 Dashboard Principal

### Localização: `/admin/dashboard`

#### Estatísticas Principais
- **Assinaturas Ativas**: Contador em tempo real
- **Receita Mensal**: Cálculo automático baseado em assinaturas
- **Anúncios Pendentes**: Fila de moderação
- **Stories Pendentes**: Destaques aguardando aprovação

#### Gráficos e Métricas
```typescript
// Estatísticas disponíveis
interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    growth: number;
  };
  businesses: {
    total: number;
    verified: number;
  };
  ads: {
    total: number;
    active: number;
    pendingApproval: number;
  };
  subscriptions: {
    total: number;
    active: number;
    revenue: {
      monthly: number;
      yearly: number;
    };
  };
  activity: RecentActivity[];
}
```

#### Funcionalidades
- ✅ Gráficos interativos de assinaturas
- ✅ Resumo de aprovações pendentes
- ✅ Atividade recente dos usuários
- ✅ Métricas de performance
- ✅ Alertas de sistema

---

## 👥 Gerenciamento de Usuários

### Localização: `/admin/usuarios`

#### Funcionalidades Principais
- **Listar Usuários**: Visualização completa com filtros
- **Perfis Detalhados**: Informações completas do usuário
- **Status de Assinatura**: Planos ativos e histórico
- **Ações de Moderação**: Suspender, ativar, editar

#### Filtros Disponíveis
- Status da conta (ativo, suspenso, bloqueado)
- Tipo de assinatura (básico, premium, pro)
- Data de cadastro
- Atividade recente

```typescript
// Estrutura de usuário no admin
interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  status: 'active' | 'suspended' | 'blocked';
  subscription: SubscriptionInfo;
  ads_count: number;
  reports_count: number;
}
```

---

## 📋 Moderação de Anúncios

### Localização: `/admin/anuncios`

#### Sistema de Moderação
- **Fila de Aprovação**: Anúncios pendentes organizados por data
- **Revisão Detalhada**: Visualização completa do anúncio
- **Ações Rápidas**: Aprovar, recusar, editar
- **Histórico**: Log de todas as ações de moderação

#### Status de Anúncios
```typescript
type AdModerationStatus = 
  | 'pending'     // Aguardando moderação
  | 'approved'    // Aprovado e publicado
  | 'rejected'    // Recusado com motivo
  | 'flagged'     // Sinalizado para revisão
  | 'expired'     // Vencido
```

#### Funcionalidades
- ✅ Aprovação em lote
- ✅ Edição inline de anúncios
- ✅ Sistema de categorização automática
- ✅ Detecção de conteúdo inadequado
- ✅ Histórico completo de moderação

### Motivos de Recusa
- Conteúdo inadequado
- Informações falsas
- Categoria incorreta
- Imagens de baixa qualidade
- Preço fora do padrão
- Duplicação de anúncio

---

## 💳 Gerenciamento de Assinaturas

### Localização: `/admin/assinaturas`

#### Dashboard de Assinaturas
```typescript
interface SubscriptionStats {
  active: number;
  planTypes: {
    basic: number;
    premium: number;
    pro: number;
  };
  revenue: {
    monthly: number;
    yearly: number;
  };
  churn_rate: number;
  growth_rate: number;
}
```

#### Funcionalidades
- **Visão Geral**: Estatísticas completas de receita
- **Gestão Individual**: Alterar planos, suspender, reativar
- **Relatórios**: Análise de performance por período
- **Projeções**: Estimativas de receita futura

#### Tipos de Plano
| Plano | Preço | Anúncios | Stories | Duração |
|-------|-------|----------|---------|---------|
| Básico | R$ 29,90 | 15 | 3/mês | 60 dias |
| Premium | R$ 59,90 | 30 | 10/mês | 90 dias |
| Pro | R$ 99,90 | Ilimitado | Ilimitado | 120 dias |

---

## 🚩 Sistema de Denúncias

### Localização: `/admin/denuncias`

#### Tipos de Denúncia
- Conteúdo inappropriado
- Spam ou fraude
- Preço incorreto
- Anúncio duplicado
- Informações falsas
- Violação de direitos autorais

#### Processo de Moderação
```typescript
interface Report {
  id: string;
  type: ReportType;
  description: string;
  reporter_id: string;
  reported_ad_id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}
```

#### Ações Disponíveis
- ✅ Investigar denúncia
- ✅ Contatar anunciante
- ✅ Remover anúncio
- ✅ Suspender conta
- ✅ Arquivar denúncia
- ✅ Responder ao denunciante

---

## 🎯 Gerenciamento de Destaques/Stories

### Localização: `/admin/destaques`

#### Funcionalidades
- **Moderação de Stories**: Aprovação de conteúdo visual
- **Gestão de Tempo**: Controle de duração de exibição
- **Posicionamento**: Ordenação e destaque de stories
- **Analytics**: Métricas de visualização e engajamento

#### Critérios de Aprovação
- Qualidade da imagem/vídeo
- Relevância do conteúdo
- Adequação às diretrizes
- Informações comerciais claras

---

## 💰 Relatórios Financeiros

### Localização: `/admin/faturamento`

#### Métricas Financeiras
- **Receita Mensal**: Análise detalhada por período
- **Projeções**: Estimativas baseadas em tendências
- **Churn Rate**: Taxa de cancelamento de assinaturas
- **LTV**: Lifetime Value dos clientes
- **CAC**: Custo de Aquisição de Cliente

#### Relatórios Disponíveis
```typescript
interface FinancialReport {
  period: string;
  total_revenue: number;
  new_subscriptions: number;
  cancellations: number;
  upgrades: number;
  downgrades: number;
  refunds: number;
  net_revenue: number;
}
```

---

## 🎫 Sistema de Cupons

### Localização: `/admin/cupons`

#### Tipos de Cupom
- **Desconto Percentual**: 10%, 20%, 50%
- **Valor Fixo**: R$ 10, R$ 20, R$ 50
- **Plano Gratuito**: Período de teste
- **Upgrade Gratuito**: Promoção de plano

#### Funcionalidades
- ✅ Criação de cupons personalizados
- ✅ Definição de validade e uso
- ✅ Rastreamento de utilização
- ✅ Análise de performance
- ✅ Cupons em lote para campanhas

---

## 🛠️ Ações Administrativas

### Localização: `/admin/acoes`

#### Ferramentas de Manutenção
- **Limpeza de Dados**: Remoção de registros antigos
- **Backup Manual**: Exportação de dados críticos
- **Reinicialização**: Reset de contadores e caches
- **Migração**: Transferência de dados entre ambientes

#### Ações Críticas
```typescript
interface AdminAction {
  type: 'data_cleanup' | 'backup' | 'reset' | 'migration';
  description: string;
  requires_confirmation: boolean;
  irreversible: boolean;
  estimated_time: string;
}
```

#### Segurança
- ✅ Confirmação dupla para ações críticas
- ✅ Log completo de todas as ações
- ✅ Backup automático antes de alterações
- ✅ Rollback para ações reversíveis

---

## 📈 Analytics e Relatórios

### Métricas Principais
- **Usuários Ativos**: Daily/Weekly/Monthly Active Users
- **Retenção**: Taxa de retorno de usuários
- **Conversão**: Funil de assinatura
- **Engajamento**: Tempo na plataforma e interações

### Dashboards Disponíveis
1. **Visão Geral**: KPIs principais
2. **Usuários**: Análise de comportamento
3. **Conteúdo**: Performance de anúncios
4. **Financeiro**: Receita e projeções
5. **Operacional**: Métricas de moderação

---

## 🔐 Segurança e Auditoria

### Sistema de Logs
```typescript
interface AdminLog {
  admin_id: string;
  action: string;
  target_type: 'user' | 'ad' | 'subscription' | 'system';
  target_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}
```

### Controles de Segurança
- ✅ Autenticação de dois fatores (opcional)
- ✅ Sessões com expiração automática
- ✅ Log completo de todas as ações
- ✅ Detecção de atividade suspeita
- ✅ Backup automático de dados críticos

---

## 🎨 Interface e Usabilidade

### Design Responsivo
- **Desktop**: Layout completo com sidebar
- **Tablet**: Menu colapsível, cards adaptáveis
- **Mobile**: Interface otimizada para toque

### Componentes Principais
```typescript
// Componentes reutilizáveis do admin
- AdminLayout: Layout principal
- StatCard: Cards de estatísticas
- DataTable: Tabelas com paginação
- ActionButton: Botões de ação
- ConfirmModal: Modais de confirmação
- LoadingSpinner: Indicadores de carregamento
```

### Navegação
- **Sidebar Fixa**: Acesso rápido a todas as seções
- **Breadcrumbs**: Navegação hierárquica
- **Atalhos**: Teclas rápidas para ações comuns
- **Busca Global**: Pesquisa unificada

---

## 🚀 Configuração e Deployment

### Variáveis de Ambiente
```env
# Admin específicas
ADMIN_PASSWORD=sua-senha-super-segura
ADMIN_EMAIL=admin@seudominio.com
ADMIN_SESSION_DURATION=3600000

# Rate limiting para admin
ADMIN_RATE_LIMIT=50
```

### Rotas Protegidas
- Middleware de autenticação em todas as rotas `/admin/*`
- Verificação de sessão em cada requisição
- Rate limiting específico para ações administrativas

---

## 📋 Manual de Uso

### Para Novos Administradores

#### 1. Primeiro Acesso
1. Acessar `/admin/login`
2. Inserir credenciais de administrador
3. Familiarizar-se com o dashboard
4. Configurar preferências pessoais

#### 2. Tarefas Diárias
- Verificar anúncios pendentes de aprovação
- Revisar denúncias recebidas
- Monitorar métricas principais
- Responder a questões de suporte

#### 3. Tarefas Semanais
- Análise de relatórios financeiros
- Revisão de performance de campanhas
- Backup manual de dados críticos
- Planejamento de ações promocionais

#### 4. Tarefas Mensais
- Relatório completo de performance
- Análise de tendências de usuários
- Otimização de processos
- Planejamento estratégico

---

## 🔧 Solução de Problemas

### Problemas Comuns

#### 1. Login não funciona
- Verificar senha no arquivo `.env`
- Limpar cache do navegador
- Verificar configuração de sessão

#### 2. Estatísticas não carregam
- Verificar conexão com Supabase
- Verificar permissões RLS
- Reiniciar serviços se necessário

#### 3. Ações falham
- Verificar logs de erro
- Confirmar permissões de banco
- Verificar rate limiting

---

## 📞 Suporte e Manutenção

### Contatos
- **Desenvolvedor**: [Seus contatos]
- **Suporte Técnico**: [Email de suporte]
- **Documentação**: Este arquivo + APIs

### Atualizações
- **Versionamento**: Seguir versionamento semântico
- **Changelog**: Documentar todas as alterações
- **Migração**: Scripts automáticos quando necessário

---

> **Importante**: O painel administrativo é a ferramenta central para gerenciamento da plataforma. Mantenha sempre as credenciais seguras e faça backups regulares das configurações importantes. 