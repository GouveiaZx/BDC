# 📋 Fluxo Completo do Sistema de Anúncios - BDC

## Visão Geral

O sistema de anúncios do BDC funciona com um fluxo completo desde a criação até a publicação, incluindo moderação e notificações.

## 1. Criação de Anúncios 📝

### Páginas de Criação:
- **Página Pública**: `/anuncios/novo` - Para usuários não logados ou criação rápida
- **Painel do Anunciante**: `/painel-anunciante/criar-anuncio` - Interface completa

### Fluxo de Criação:
1. **Autenticação**: Verifica se o usuário está logado
2. **Preenchimento do Formulário**:
   - Título (obrigatório)
   - Categoria (obrigatório)
   - Descrição (obrigatório)
   - Preço (obrigatório)
   - Localização (Estado e Cidade)
   - Imagens (mínimo 1, máximo 10)
   - Dados de contato (telefone/WhatsApp)

3. **Upload de Imagens**: 
   - As imagens são enviadas para o Supabase Storage
   - URL pública é gerada para cada imagem

4. **Envio do Anúncio**:
   - POST para `/api/ads`
   - Status inicial: `pending`
   - Moderation status: `pending`

## 2. Sistema de Moderação 🔍

### Status dos Anúncios:
- **pending**: Aguardando revisão
- **approved**: Aprovado e publicado
- **rejected**: Rejeitado com motivo

### Painel Administrativo:
- **URL**: `/admin/anuncios`
- **Filtros**: Todos, Pendentes, Aprovados, Rejeitados
- **Indicadores**: Badge com número de anúncios pendentes

### Ações de Moderação:
1. **Aprovar Anúncio**:
   - Define `moderation_status` como `approved`
   - Define `status` como `active`
   - Define `published_at` com data/hora atual
   - Cria notificação para o usuário

2. **Rejeitar Anúncio**:
   - Define `moderation_status` como `rejected`
   - Define `status` como `rejected`
   - Salva motivo da rejeição
   - Cria notificação para o usuário com o motivo

## 3. Estrutura do Banco de Dados 🗄️

### Tabela: `ads`
```sql
- id (UUID)
- user_id (UUID) - Referência ao usuário
- category_id (UUID) - Referência à categoria
- city_id (UUID) - Referência à cidade
- title (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- images (Array) - URLs das imagens
- status (VARCHAR) - 'pending', 'active', 'rejected', 'expired'
- moderation_status (VARCHAR) - 'pending', 'approved', 'rejected'
- rejection_reason (TEXT) - Motivo da rejeição
- moderated_at (TIMESTAMP) - Data da moderação
- moderated_by (UUID) - Admin que moderou
- published_at (TIMESTAMP) - Data de publicação
- expires_at (TIMESTAMP) - Data de expiração
```

### Tabela: `notifications`
```sql
- id (UUID)
- user_id (UUID) - Destinatário
- title (VARCHAR)
- message (TEXT)
- type (VARCHAR) - 'ad_approved', 'ad_rejected', etc
- related_entity_type (VARCHAR) - 'ad'
- related_entity_id (UUID) - ID do anúncio
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

## 4. APIs Principais 🔌

### `/api/ads` (POST)
- Cria novo anúncio
- Valida dados obrigatórios
- Verifica limites do plano do usuário
- Retorna ID do anúncio criado

### `/api/admin/ads/moderate` (PATCH)
- Aprova ou rejeita anúncios
- Requer autenticação de admin
- Cria notificações automáticas

### `/api/admin/ads` (GET)
- Lista anúncios para o admin
- Filtros por status
- Busca dados completos dos usuários

## 5. Visualização pelo Anunciante 👀

### Página: `/painel-anunciante/meus-anuncios`

**Informações Exibidas**:
- Status do anúncio (ativo, pendente, rejeitado)
- Status de moderação
- Estatísticas (visualizações, cliques)
- Ações (editar, excluir, renovar)

**Badges de Status**:
- 🟡 Pendente de Aprovação
- 🟢 Aprovado/Ativo
- 🔴 Rejeitado

## 6. Notificações 📬

### Tipos de Notificações:
1. **Anúncio Aprovado**:
   - Título: "Anúncio aprovado!"
   - Mensagem: Confirmação de publicação

2. **Anúncio Rejeitado**:
   - Título: "Anúncio não aprovado"
   - Mensagem: Inclui motivo da rejeição

### Visualização:
- `/painel-anunciante/notificacoes`
- Contador de não lidas no menu

## 7. Fluxo de Renovação 🔄

### Anúncios Gratuitos:
- Duração: 90 dias
- Renovação: Após expiração

### Anúncios de Assinantes:
- Duração: Conforme plano
- Renovação: Automática ou manual

## 8. Segurança e Validações 🔐

### Validações de Criação:
- ✓ Autenticação obrigatória
- ✓ Campos obrigatórios validados
- ✓ Limite de imagens (máx 10)
- ✓ Formato de preço validado

### Validações de Moderação:
- ✓ Apenas admins podem moderar
- ✓ Motivo obrigatório para rejeição
- ✓ Log de todas as ações

## 9. Melhorias Implementadas ✨

1. **Integração Completa**: Página pública de criação agora integrada com API
2. **Notificações Automáticas**: Sistema notifica usuários sobre aprovação/rejeição
3. **Indicadores Visuais**: Badges no admin mostram itens pendentes
4. **Consistência de Status**: Sincronização entre `status` e `moderation_status`
5. **Upload de Imagens**: Sistema robusto com fallback para imagem padrão

## 10. Pontos de Atenção ⚠️

1. **Performance**: APIs com paginação para grandes volumes
2. **Cache**: Contadores atualizados a cada 30 segundos
3. **Fallbacks**: Sistema funciona mesmo com falhas parciais
4. **Logs**: Todas as ações são registradas para auditoria