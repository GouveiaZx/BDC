# Setup do Banco de Dados - BDC Classificados

Este documento descreve como configurar o banco de dados Supabase para o projeto BDC Classificados.

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote as credenciais do projeto:
   - `Project URL`
   - `anon key` (chave pública)
   - `service_role key` (chave privada)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_KEY=sua_chave_privada

# Asaas (Gateway de Pagamento)
ASAAS_API_KEY=sua_chave_do_asaas
ASAAS_API_URL=https://www.asaas.com/api/v3

# Admin
ADMIN_PASSWORD=sua_senha_admin_segura

# Outros
USE_MOCK_ASAAS=false
```

**⚠️ IMPORTANTE:** Nunca commite as chaves reais no Git!

## 🗄️ Estrutura do Banco de Dados

### Funções RPC Principais

O projeto utiliza as seguintes funções RPC que já estão criadas:

#### ✅ Funções Implementadas

1. **`create_profiles_table_if_not_exists()`**
   - Cria a tabela de perfis de usuários
   - Configurações de RLS incluídas

2. **`create_advertisements_table_if_not_exists()`**
   - Cria a tabela principal de anúncios
   - Inclui campos para moderação e visualizações

3. **`create_highlights_table_if_not_exists()`**
   - Cria a tabela de destaques/stories
   - Sistema de moderação integrado

4. **`create_ad_views_table_if_not_exists()`**
   - Cria a tabela de visualizações de anúncios
   - Rastreamento de IPs e user agents

5. **`create_subscriptions_table_if_not_exists()`**
   - Cria a tabela de assinaturas
   - Integração com gateway de pagamento

### Tabelas Principais

#### Autenticação e Perfis
- `profiles` - Perfis de usuários
- `business_profiles` - Perfis empresariais

#### Conteúdo
- `advertisements` - Anúncios principais
- `destaques` - Stories/destaques
- `categories` - Categorias de anúncios

#### Rastreamento
- `ad_views` - Visualizações de anúncios
- `ad_clicks` - Cliques em anúncios
- `favorites` - Favoritos dos usuários

#### Assinaturas e Pagamentos
- `subscriptions` - Assinaturas ativas
- `coupons` - Sistema de cupons
- `coupon_usages` - Uso de cupons

#### Comunicação
- `messages` - Sistema de mensagens
- `conversations` - Conversas entre usuários
- `notifications` - Notificações do sistema

## 🔧 Configuração de Segurança

### Row Level Security (RLS)

Todas as tabelas principais possuem RLS habilitado:

```sql
-- Exemplo de política para anúncios
CREATE POLICY "Visualizar anúncios aprovados" ON advertisements
    FOR SELECT USING (moderation_status = 'approved' AND status = 'active');

CREATE POLICY "Criar anúncios próprios" ON advertisements  
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

### Políticas de Storage

Para upload de imagens:

```sql
-- Política para bucket de imagens
CREATE POLICY "Usuários podem fazer upload de imagens" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## 🚀 Migrações

### Como Executar Migrações

1. **Via MCP Supabase (Recomendado):**
   ```bash
   # As migrações são aplicadas automaticamente via MCP
   ```

2. **Via SQL Editor no Supabase:**
   - Acesse o SQL Editor no dashboard do Supabase
   - Execute as funções RPC necessárias

### Verificar Status

```sql
-- Verificar se as funções existem
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%_table_if_not_exists%';

-- Verificar tabelas criadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 🧪 Dados de Teste

### Criar Dados Iniciais

```sql
-- Inserir categorias básicas
INSERT INTO categories (name, slug, icon) VALUES
('Eletrônicos', 'eletronicos', '📱'),
('Veículos', 'veiculos', '🚗'),
('Imóveis', 'imoveis', '🏠'),
('Moda', 'moda', '👕');

-- Criar usuário admin de teste
INSERT INTO profiles (id, name, email, is_admin) VALUES
('00000000-0000-0000-0000-000000000000', 'Admin', 'admin@bdc.com', true);
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de conexão:**
   - Verifique se as variáveis de ambiente estão corretas
   - Confirme se o projeto Supabase está ativo

2. **Erro de permissão:**
   - Verifique se está usando a `service_role` key para operações administrativas
   - Confirme se as políticas RLS estão configuradas corretamente

3. **Tabelas não criadas:**
   - Execute as funções RPC manualmente
   - Verifique os logs do Supabase

### Logs e Monitoring

```sql
-- Verificar logs de erro
SELECT * FROM admin_health_log 
WHERE action_type = 'fix' 
ORDER BY created_at DESC;

-- Estatísticas das tabelas
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Ferramentas Úteis
- [Supabase Studio](https://supabase.com/dashboard) - Interface web
- [psql](https://www.postgresql.org/docs/current/app-psql.html) - Cliente de linha de comando

---

## 🚨 Checklist de Segurança

- [ ] Variáveis de ambiente configuradas
- [ ] Chaves sensíveis não commitadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de acesso configuradas
- [ ] Backup automático configurado
- [ ] Monitoring de logs ativo

**Última atualização:** Janeiro 2025 