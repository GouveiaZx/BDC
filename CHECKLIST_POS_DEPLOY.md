# ✅ CHECKLIST PÓS-DEPLOY - BDC CLASSIFICADOS

**Data**: 02 de Janeiro de 2025
**Domínio**: www.buscaaquibdc.com
**Status Git**: ✅ Atualizado (commit 44fd9aa)
**Deploy**: 🔄 Aguardando build na Vercel

---

## 📋 ETAPA 1: VERIFICAR BUILD NA VERCEL (AGORA)

### Acessar Dashboard Vercel
1. 🔗 **URL**: https://vercel.com/dashboard
2. Localizar projeto **BDC** ou **bdc-classificados**
3. Ver status do deployment mais recente

### Verificações no Dashboard:
- [ ] Status: **Ready** (verde)
- [ ] Build Time: < 5 minutos
- [ ] Domains: www.buscaaquibdc.com configurado
- [ ] Environment Variables: 12 variáveis configuradas

### Se Build Falhar:
```bash
# Ver logs de erro
# No dashboard Vercel > Deployments > [último deploy] > View Function Logs

# Principais causas possíveis:
1. Variáveis de ambiente faltando
2. Erro de TypeScript não detectado no build local
3. Timeout no build (improvável, build local levou < 2min)
```

---

## 📋 ETAPA 2: CONFIGURAR VARIÁVEIS DE AMBIENTE (SE NECESSÁRIO)

### No Dashboard Vercel > Settings > Environment Variables

Adicionar/Verificar todas as 12 variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xjguzxwwydlpvudwmiyv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI2MDAsImV4cCI6MjA2MzgwODYwMH0.GidrSppfX5XHyu5SeYcML3gmNNFXbouYWxFBG-UZlco
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3V6eHd3eWRscHZ1ZHdtaXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIzMjYwMCwiZXhwIjoyMDYzODA4NjAwfQ.wm7fMtIFoq2VklMYXGhSfok8fFwX2tw6ZuEiHxaNqHE

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.buscaaquibdc.com
NEXT_PUBLIC_SITE_URL=https://www.buscaaquibdc.com
JWT_SECRET=bdc_jwt_super_secret_production_2024_maranhao

RESEND_API_KEY=re_6ZQPbka7_AyzN2wnkpQjc5Y26CFdY3qFF
RESEND_FROM_EMAIL=noreply@buscaaquibdc.com

ASAAS_API_KEY=prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNiZmZlNzcyLTZiZWEtNDhlNC05NjMxLTY0M2JkY2I5YjM3NTo6JGFhY2hfNTJiYjkzYjgtZDBhMi00ZjM0LWFmYjMtMmYzOWQ1NDY4MzE3
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_SECRET=bdc_webhook_secret_prod_2024_asaas_maranhao
```

**Importante**: Todas devem estar em **Production** e **Preview**

---

## 📋 ETAPA 3: CONFIGURAR DOMÍNIO (SE NÃO ESTIVER)

### No Dashboard Vercel > Settings > Domains

1. **Adicionar domínio principal**:
   - Domínio: `www.buscaaquibdc.com`
   - Redirect: Não

2. **Adicionar domínio sem www** (opcional):
   - Domínio: `buscaaquibdc.com`
   - Redirect to: `www.buscaaquibdc.com`

### Configurar DNS (No provedor do domínio)

```dns
# Se usar A Record (IP da Vercel):
A       @       76.76.21.21         TTL: 3600
CNAME   www     cname.vercel-dns.com   TTL: 3600

# OU se usar CNAME (mais recomendado):
CNAME   www     cname.vercel-dns.com   TTL: 3600
```

**Nota**: Propagação DNS pode levar até 24 horas, mas geralmente 10-30 minutos.

---

## 📋 ETAPA 4: TESTES BÁSICOS (5 MINUTOS)

### 4.1 Acessar o Site

🔗 **Acessar**: https://www.buscaaquibdc.com

**Verificações visuais**:
- [ ] Home carrega sem erros
- [ ] Logo aparece
- [ ] Categorias aparecem (75 categorias)
- [ ] Cidades aparecem (55 cidades)
- [ ] Footer carrega
- [ ] Nenhum erro no console do browser (F12)

### 4.2 Testar APIs Públicas

**Abrir console do browser (F12) e testar**:

```javascript
// Teste 1: Categorias
fetch('https://www.buscaaquibdc.com/api/categories/list')
  .then(r => r.json())
  .then(d => console.log('Categorias:', d.categories?.length))

// Teste 2: Cidades
fetch('https://www.buscaaquibdc.com/api/cities/list')
  .then(r => r.json())
  .then(d => console.log('Cidades:', d.cities?.length))

// Teste 3: Planos
fetch('https://www.buscaaquibdc.com/api/plans/list')
  .then(r => r.json())
  .then(d => console.log('Planos:', d.plans?.length))

// Teste 4: Anúncios
fetch('https://www.buscaaquibdc.com/api/ads')
  .then(r => r.json())
  .then(d => console.log('Anúncios:', d.ads?.length))
```

**Resultados esperados**:
- Categorias: 75
- Cidades: 55
- Planos: 5
- Anúncios: 0 ou mais (dependendo do banco)

### 4.3 Testar Páginas Principais

**Navegar e verificar**:
- [ ] **/login** - Página de login carrega
- [ ] **/cadastro** - Formulário de registro aparece
- [ ] **/planos** - Lista de planos aparece
- [ ] **/anuncios** - Lista de anúncios (pode estar vazia)
- [ ] **/categorias** - Grid de categorias
- [ ] **/ajuda** - Central de ajuda
- [ ] **/como-funciona** - Página informativa

---

## 📋 ETAPA 5: TESTE DE REGISTRO COMPLETO (10 MINUTOS)

### 5.1 Criar Conta de Teste

1. Acessar: https://www.buscaaquibdc.com/cadastro
2. Preencher formulário:
   - Nome: Teste BDC
   - Email: teste@buscaaquibdc.com
   - Senha: Teste123!
   - Telefone: (99) 99999-9999
   - Cidade: Balsas
3. Clicar em "Criar Conta"

**Verificações**:
- [ ] Registro bem-sucedido
- [ ] Redirecionado para dashboard ou home
- [ ] Email de boas-vindas recebido (verificar inbox)

### 5.2 Fazer Login

1. Acessar: https://www.buscaaquibdc.com/login
2. Login com credenciais criadas
3. Verificar acesso ao painel

**Verificações**:
- [ ] Login bem-sucedido
- [ ] Dashboard do anunciante carrega
- [ ] Estatísticas aparecem (zeradas)
- [ ] Menu lateral funciona

### 5.3 Criar Anúncio de Teste

1. Acessar: Painel > Criar Anúncio
2. Preencher:
   - Título: "Teste de Anúncio BDC"
   - Descrição: "Anúncio criado para validação"
   - Categoria: Selecionar qualquer
   - Cidade: Balsas
   - Preço: R$ 100,00
3. Upload de 1 imagem (qualquer)
4. Publicar

**Verificações**:
- [ ] Upload de imagem funciona
- [ ] Anúncio criado com status "pendente"
- [ ] Aparece em "Meus Anúncios"

---

## 📋 ETAPA 6: CONFIGURAR WEBHOOK ASAAS (5 MINUTOS)

### 6.1 Acessar Painel Asaas

🔗 **URL**: https://www.asaas.com/config/webhooks

### 6.2 Adicionar Webhook

**Configurações**:
- **URL**: `https://www.buscaaquibdc.com/api/webhooks/asaas`
- **Versão**: v3
- **Token de Acesso**: `bdc_webhook_secret_prod_2024_asaas_maranhao`

**Eventos para marcar**:
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_DELETED
- ✅ PAYMENT_RESTORED

### 6.3 Testar Webhook

**No painel Asaas**:
1. Criar cobrança teste de R$ 1,00
2. Marcar como "Pago manualmente"
3. Verificar se webhook foi enviado

**Ou via cURL**:
```bash
curl -X POST https://www.buscaaquibdc.com/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: bdc_webhook_secret_prod_2024_asaas_maranhao" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test123",
      "value": 1.00,
      "status": "RECEIVED"
    }
  }'
```

**Verificação**:
- [ ] Retorna 200 OK
- [ ] Logs na Vercel mostram processamento

---

## 📋 ETAPA 7: TESTE ADMIN (5 MINUTOS)

### 7.1 Tornar Usuário Admin

**Executar no Supabase SQL Editor**:
```sql
-- Atualizar usuário teste para admin
UPDATE users
SET is_admin = true,
    role = 'admin'
WHERE email = 'teste@buscaaquibdc.com';
```

### 7.2 Acessar Área Admin

1. Logout do usuário normal
2. Login novamente
3. Acessar: https://www.buscaaquibdc.com/admin

**Verificações**:
- [ ] Dashboard admin carrega
- [ ] Estatísticas aparecem
- [ ] Menu admin funciona
- [ ] Lista de anúncios pendentes mostra o teste

### 7.3 Aprovar Anúncio de Teste

1. Admin > Anúncios
2. Localizar anúncio de teste
3. Clicar em "Aprovar"

**Verificações**:
- [ ] Anúncio aprovado com sucesso
- [ ] Status muda para "Aprovado"
- [ ] Aparece na home do site

---

## 📋 ETAPA 8: VALIDAÇÃO SUPABASE (5 MINUTOS)

### 8.1 Verificar CORS do Storage

**No Supabase Dashboard**:
1. Storage > Configuration > CORS
2. Adicionar origem permitida:
   - `https://www.buscaaquibdc.com`
   - `https://buscaaquibdc.com`

### 8.2 Testar Upload

**No site**:
1. Editar anúncio teste
2. Adicionar mais uma imagem
3. Salvar

**Verificação**:
- [ ] Upload funciona sem erro CORS
- [ ] Imagem aparece no anúncio

### 8.3 Verificar Buckets

**No Supabase Dashboard > Storage**:

Confirmar que buckets estão públicos:
- [ ] `avatars` - Público
- [ ] `businesses` - Público
- [ ] `ads` - Público
- [ ] `highlights` - Público
- [ ] `banners` - Público
- [ ] `categories` - Público
- [ ] `logos` - Público

---

## 📋 ETAPA 9: TESTE DE PAGAMENTO (10 MINUTOS)

### 9.1 Selecionar Plano

1. Login como usuário normal
2. Painel > Planos
3. Selecionar plano "Micro-Empresa" (R$ 19,90)

### 9.2 Gerar PIX de Teste

1. Método: PIX
2. Confirmar dados
3. Gerar QR Code

**Verificações**:
- [ ] QR Code gerado
- [ ] Copy-paste do código PIX funciona
- [ ] Cobrança criada no Asaas

### 9.3 Simular Pagamento

**No painel Asaas**:
1. Localizar cobrança
2. Marcar como "Confirmado"
3. Aguardar webhook

**Verificações**:
- [ ] Webhook recebido (ver logs Vercel)
- [ ] Status da assinatura atualizado no banco
- [ ] Email de confirmação enviado
- [ ] Limites do plano ativados

---

## 📋 ETAPA 10: MONITORAMENTO (PRIMEIRAS 24H)

### 10.1 Logs da Vercel

**Verificar regularmente**:
```
Vercel Dashboard > Deployments > [último] > Runtime Logs
```

**Procurar por**:
- ❌ Erros 500
- ⚠️ Erros de conexão Supabase
- ⚠️ Timeouts
- ⚠️ Memory issues

### 10.2 Performance

**Verificar métricas**:
- Tempo de resposta médio: < 1s
- First Load: < 3s
- Largest Contentful Paint: < 2.5s

**Ferramentas**:
- Vercel Analytics (dashboard)
- Google PageSpeed Insights
- Chrome DevTools (Network tab)

### 10.3 Supabase

**Dashboard Supabase > Database**:
- Verificar queries lentas
- Monitorar uso de conexões
- Verificar tamanho do banco

---

## 📋 ETAPA 11: TESTES MOBILE (10 MINUTOS)

### 11.1 PWA Install

**No smartphone**:
1. Acessar www.buscaaquibdc.com no Chrome
2. Verificar se aparece banner "Adicionar à tela inicial"
3. Instalar PWA

**Verificações**:
- [ ] Banner de install aparece
- [ ] Instala como app
- [ ] Ícone criado na home
- [ ] Abre em fullscreen

### 11.2 Testar Funcionalidades

**No app instalado**:
- [ ] Login funciona
- [ ] Criar anúncio funciona
- [ ] Upload de foto da câmera
- [ ] Busca funciona
- [ ] WhatsApp button abre app

---

## 📋 CHECKLIST FINAL DE PRODUÇÃO

### Infraestrutura ✅
- [ ] Deploy bem-sucedido na Vercel
- [ ] Domínio www.buscaaquibdc.com acessível
- [ ] SSL/HTTPS ativo e funcionando
- [ ] DNS propagado corretamente

### APIs e Integrations ✅
- [ ] Supabase conectado e respondendo
- [ ] APIs públicas funcionando (200 OK)
- [ ] APIs protegidas retornando 401 sem auth
- [ ] Webhook Asaas configurado e testado
- [ ] Resend enviando emails

### Funcionalidades Core ✅
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Criação de anúncio funciona
- [ ] Upload de imagens funciona
- [ ] Aprovação admin funciona
- [ ] Processo de pagamento funciona

### Performance ✅
- [ ] Home carrega em < 3s
- [ ] APIs respondem em < 1s
- [ ] Imagens otimizadas carregando
- [ ] Sem erros no console

### SEO e PWA ✅
- [ ] Meta tags carregando
- [ ] PWA instalável
- [ ] Manifest válido
- [ ] Service Worker ativo

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "Application Error" na Vercel
**Causa**: Variáveis de ambiente faltando
**Solução**:
1. Vercel Dashboard > Settings > Environment Variables
2. Adicionar todas as 12 variáveis
3. Redeploy: Deployments > ... > Redeploy

### Problema 2: Imagens não carregam
**Causa**: CORS do Supabase Storage
**Solução**:
1. Supabase > Storage > Configuration > CORS
2. Adicionar: https://www.buscaaquibdc.com

### Problema 3: APIs retornam 500
**Causa**: Erro de conexão Supabase ou JWT
**Solução**:
1. Verificar NEXT_PUBLIC_SUPABASE_URL
2. Verificar SUPABASE_SERVICE_ROLE_KEY
3. Ver logs: Vercel > Runtime Logs

### Problema 4: Webhook não chega
**Causa**: URL incorreta ou token inválido
**Solução**:
1. Confirmar URL: https://www.buscaaquibdc.com/api/webhooks/asaas
2. Confirmar token: bdc_webhook_secret_prod_2024_asaas_maranhao
3. Testar manualmente com cURL

### Problema 5: Emails não enviam
**Causa**: RESEND_API_KEY inválida
**Solução**:
1. Verificar key no Resend Dashboard
2. Confirmar domínio verificado
3. Verificar RESEND_FROM_EMAIL

---

## 📞 SUPORTE E RECURSOS

### Documentação
- 📄 [VALIDATION_FINAL_REPORT.md](./VALIDATION_FINAL_REPORT.md) - Relatório de validação
- 📄 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Guia completo de deploy
- 📄 [VALIDACAO_REVISAO_FINAL.md](./VALIDACAO_REVISAO_FINAL.md) - Revisão final

### Dashboards
- 🔗 Vercel: https://vercel.com/dashboard
- 🔗 Supabase: https://app.supabase.com
- 🔗 Asaas: https://www.asaas.com
- 🔗 Resend: https://resend.com

### Logs e Monitoramento
```bash
# Ver logs da Vercel via CLI
vercel logs --follow

# Filtrar erros
vercel logs --filter error

# Logs de build
vercel logs --build
```

---

## ✅ CERTIFICAÇÃO DE DEPLOY

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              CHECKLIST PÓS-DEPLOY COMPLETO                   ║
║                                                              ║
║            www.buscaaquibdc.com - EM PRODUÇÃO                ║
║                                                              ║
║  Após completar todos os itens deste checklist, o sistema    ║
║  estará 100% validado em ambiente de produção.               ║
║                                                              ║
║  Tempo estimado: 60-90 minutos                               ║
║                                                              ║
║  Data: 02 de Janeiro de 2025                                 ║
║  Preparado por: Claude Code AI Assistant                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Última Atualização**: 02/01/2025 às 20:45 UTC
**Status**: 🔄 Aguardando deploy na Vercel
