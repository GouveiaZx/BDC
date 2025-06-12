# Variáveis de Ambiente - BDC Classificados

Este arquivo documenta todas as variáveis de ambiente necessárias para o projeto BDC Classificados.

## Arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Configurações do Supabase
# Obtenha estas chaves no dashboard do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Configurações da API do Asaas (Sistema de Pagamentos)
# Obtenha sua chave API no painel do Asaas
ASAAS_API_KEY=sua_chave_asaas_aqui
ASAAS_API_URL=https://www.asaas.com/api/v3

# Configurações de Desenvolvimento
# Para usar dados mock durante desenvolvimento
USE_MOCK_ASAAS=true
MOCK_SUBSCRIPTION=true

# Configurações de Admin
# Senha para acesso administrativo
ADMIN_PASSWORD=sua_senha_admin_segura

# Configurações de Environment
NODE_ENV=development
```

## Variáveis Obrigatórias

### 🔐 NEXT_PUBLIC_SUPABASE_URL
**Descrição**: URL do seu projeto Supabase  
**Exemplo**: `https://abc123.supabase.co`  
**Como obter**: Dashboard do Supabase > Settings > API

### 🔐 NEXT_PUBLIC_SUPABASE_ANON_KEY
**Descrição**: Chave anônima do Supabase  
**Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Como obter**: Dashboard do Supabase > Settings > API

### 🔐 SUPABASE_SERVICE_ROLE_KEY
**Descrição**: Chave de service role para operações privilegiadas  
**Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Como obter**: Dashboard do Supabase > Settings > API

### 🔐 ASAAS_API_KEY
**Descrição**: Chave da API do Asaas para pagamentos  
**Exemplo**: `$aact_prod_...` (produção) ou `$aact_test_...` (teste)  
**Como obter**: Painel do Asaas > API > Chaves de API

### 🔐 ADMIN_PASSWORD
**Descrição**: Senha para acesso administrativo  
**Exemplo**: `MinhaSenh@Segura123`  
**Importante**: Use uma senha forte em produção

## Variáveis Opcionais

### USE_MOCK_ASAAS
**Descrição**: Se deve usar dados mock do Asaas em desenvolvimento  
**Valores**: `true` | `false`  
**Padrão**: `false`

### MOCK_SUBSCRIPTION
**Descrição**: Se deve simular assinaturas em desenvolvimento  
**Valores**: `true` | `false`  
**Padrão**: `false`

### NODE_ENV
**Descrição**: Ambiente de execução  
**Valores**: `development` | `production` | `test`  
**Padrão**: `development`

## Configuração por Ambiente

### Desenvolvimento Local
```env
NODE_ENV=development
USE_MOCK_ASAAS=true
MOCK_SUBSCRIPTION=true
ADMIN_PASSWORD=admin123
```

### Produção
```env
NODE_ENV=production
USE_MOCK_ASAAS=false
MOCK_SUBSCRIPTION=false
ADMIN_PASSWORD=senha_muito_segura_aqui
```

## Segurança

### ⚠️ IMPORTANTE
1. **NUNCA** faça commit do arquivo `.env.local`
2. **NUNCA** exponha chaves de produção no código
3. Use senhas fortes em produção
4. Rotacione chaves regularmente

### 🛡️ Verificações de Segurança
O projeto inclui verificações automáticas:
- Bloqueia valores padrão em produção
- Valida presença de chaves obrigatórias
- Alerta sobre configurações inseguras

### 🔍 Como Verificar
```bash
# Verificar se todas as variáveis estão configuradas
npm run check-env

# Testar conexão com Supabase
npm run test-supabase

# Testar API do Asaas
npm run test-asaas
```

## Deployment

### Vercel
Acesse o dashboard do Vercel e configure as variáveis em:
`Settings > Environment Variables`

### Netlify
Configure no arquivo `netlify.toml` ou no dashboard:
`Site Settings > Environment Variables`

### Heroku
```bash
heroku config:set NEXT_PUBLIC_SUPABASE_URL=sua_url
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
# ... outras variáveis
```

## Troubleshooting

### Erro: "Supabase não configurado"
**Solução**: Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão definidas

### Erro: "Asaas API inválida"
**Solução**: Verifique se `ASAAS_API_KEY` está correta e ativa no painel do Asaas

### Erro: "Admin não autorizado"
**Solução**: Verifique se `ADMIN_PASSWORD` está definida corretamente

---

> **Nota**: Mantenha este documento atualizado sempre que novas variáveis forem adicionadas ao projeto. 