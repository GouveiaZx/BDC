# Setup do Banco de Dados - BDC Classificados

Este documento descreve como configurar o banco de dados Supabase para o projeto BDC Classificados.

## Pré-requisitos

1. **Conta no Supabase**: Crie uma conta em [supabase.com](https://supabase.com)
2. **CLI do Supabase** (opcional): `npm install -g supabase`
3. **Node.js**: Versão 18+ recomendada

## Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse o dashboard do Supabase
2. Clique em "New Project"
3. Escolha sua organização
4. Configure:
   - **Name**: `bdc-classificados`
   - **Database Password**: Gere uma senha segura
   - **Region**: `South America (São Paulo)` para melhor performance no Brasil

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Para desenvolvimento com mocks
USE_MOCK_ASAAS=true
MOCK_SUBSCRIPTION=true
```

### 3. Executar Migrações

As migrações já estão aplicadas no projeto principal, mas para um novo ambiente:

```bash
# Via CLI do Supabase (se instalado)
supabase db reset

# Ou execute as migrações manualmente no SQL Editor
```

## Funções RPC Disponíveis

O projeto inclui as seguintes funções RPC que são automaticamente criadas:

### ✅ Funções de Criação de Tabelas
- `create_profiles_table_if_not_exists()` - Cria tabela de perfis
- `create_advertisements_table_if_not_exists()` - Cria tabela de anúncios  
- `create_highlights_table_if_not_exists()` - Cria tabela de destaques
- `create_ad_views_table_if_not_exists()` - Cria tabela de visualizações
- `create_subscriptions_table_if_not_exists()` - Cria tabela de assinaturas

### Como Testar as Funções

Execute no SQL Editor do Supabase:

```sql
-- Verificar se todas as funções existem
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%table_if_not_exists%';

-- Testar execução das funções
SELECT create_profiles_table_if_not_exists();
SELECT create_advertisements_table_if_not_exists();
SELECT create_highlights_table_if_not_exists();
SELECT create_ad_views_table_if_not_exists();
SELECT create_subscriptions_table_if_not_exists();
```

## Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **profiles** - Perfis de usuário
- Informações básicas dos usuários
- Conectada à tabela `auth.users`
- RLS habilitado para privacidade

#### 2. **business_profiles** - Perfis de empresas
- Dados detalhados de empresas
- Logos, banners, descrições
- Redes sociais e contatos

#### 3. **advertisements** - Anúncios
- Anúncios publicados no sistema
- Imagens, preços, descrições
- Sistema de moderação

#### 4. **destaques** - Stories/Destaques
- Stories temporários dos usuários
- Sistema de aprovação/moderação
- Controle de duração

#### 5. **subscriptions** - Assinaturas
- Planos de usuários
- Integração com sistema de pagamento
- Controle de recursos

### Tabelas de Controle

- **ad_views** - Visualizações de anúncios
- **ad_clicks** - Cliques em anúncios
- **favorites** - Favoritos dos usuários
- **reviews** - Avaliações de lojas
- **notifications** - Notificações
- **messages/conversations** - Sistema de mensagens

## Políticas RLS (Row Level Security)

### Segurança Implementada

1. **Profiles**: Usuários podem ver todos os perfis, mas só editam o próprio
2. **Business Profiles**: Acesso público para leitura, edição restrita ao dono
3. **Advertisements**: Anúncios ativos são públicos, edição restrita ao criador
4. **Subscriptions**: Informações visíveis publicamente, edição restrita

### Verificar Políticas

```sql
-- Ver todas as políticas RLS
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Storage/Arquivos

### Buckets Configurados
- **avatars** - Fotos de perfil
- **business-logos** - Logos de empresas  
- **business-banners** - Banners de empresas
- **ad-images** - Imagens de anúncios
- **story-images** - Imagens de stories

### Políticas de Storage
```sql
-- Verificar políticas de storage
SELECT * FROM storage.policies;
```

## Dados Iniciais

### Categorias Padrão
O sistema inclui categorias predefinidas para anúncios:
- Eletrônicos
- Veículos
- Imóveis
- Moda e Beleza
- Casa e Jardim
- Esportes e Lazer

### Planos de Assinatura
Planos predefinidos no sistema:
- **Gratuito** - 1 anúncio por dia
- **Micro Business** - R$ 19,90/mês
- **Small Business** - R$ 49,90/mês
- **Business Plus** - R$ 99,90/mês

## Backup e Manutenção

### Backup Automático
O Supabase faz backup automático, mas recomendamos:

```sql
-- Função de health check do banco
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

### Limpeza Periódica
```sql
-- Limpar anúncios expirados (executar semanalmente)
UPDATE advertisements 
SET status = 'expired' 
WHERE expires_at < NOW() AND status = 'active';

-- Arquivar anúncios antigos (executar mensalmente)
INSERT INTO archived_advertisements 
SELECT * FROM advertisements 
WHERE status = 'expired' AND updated_at < NOW() - INTERVAL '30 days';
```

## Troubleshooting

### Problemas Comuns

#### 1. **Erro de Conexão**
```
Error: Failed to connect to Supabase
```
**Solução**: Verificar URL e chaves no `.env.local`

#### 2. **Erro RLS**
```
Error: new row violates row-level security policy
```
**Solução**: Verificar se o usuário está autenticado e tem permissão

#### 3. **Imagens não carregam**
```
Error: Access denied for storage bucket
```
**Solução**: Verificar políticas de storage e permissões de bucket

### Comandos Úteis

```sql
-- Ver usuários conectados
SELECT * FROM auth.users LIMIT 5;

-- Ver estatísticas de tabelas
SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates 
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;

-- Ver queries mais lentas
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_time DESC 
LIMIT 10;
```

## Ambiente de Desenvolvimento

### Setup Local
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Executar migrações (se necessário)
npm run db:migrate

# 4. Iniciar aplicação
npm run dev
```

### Testes
```bash
# Executar testes unitários
npm test

# Executar testes de integração
npm run test:integration

# Executar testes com banco
npm run test:db
```

## Suporte e Documentação

- **Documentação Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Dashboard do Projeto**: [app.supabase.com](https://app.supabase.com)
- **Status do Supabase**: [status.supabase.com](https://status.supabase.com)

## Checklist de Setup

- [ ] Projeto criado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Funções RPC testadas e funcionando
- [ ] Políticas RLS verificadas
- [ ] Buckets de storage criados
- [ ] Dados iniciais inseridos
- [ ] Aplicação conectando corretamente
- [ ] Backup configurado

---

> **Nota**: Este documento deve ser atualizado sempre que houver mudanças na estrutura do banco de dados ou novos requisitos de setup. 