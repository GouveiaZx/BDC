# 🚀 GUIA COMPLETO DE DEPLOY - BDC CLASSIFICADOS

## ✅ PROBLEMAS CORRIGIDOS

### 1. ✅ JWT_SECRET Configurado
- **Antes:** Chave fraca de desenvolvimento
- **Agora:** Chave criptograficamente segura gerada
- **Valor:** `R34LrFpXg8KCjNhOnrebNaDYCRh6smym3wp0R1QsY4I=`

### 2. ✅ CORS Atualizado para Produção
- **Antes:** Apenas localhost
- **Agora:** `https://www.buscaaquibdc.com` e `https://buscaaquibdc.com`
- **Arquivo:** [middleware.ts](middleware.ts)

### 3. ✅ Rate Limiting Ativado
- **Global:** 100 req/15 min
- **Admin:** 50 req/10 min
- **Auth:** 10 req/5 min
- **Implementação:** [middleware.ts](middleware.ts) linhas 4, 46-54, 82-88

### 4. ✅ Configurações Adaptadas para Contabo
- **vercel.json:** Movido para backup (não necessário)
- **ecosystem.config.js:** Criado para PM2
- **nginx.conf:** Configuração completa Nginx
- **deploy.sh:** Script automatizado de deploy
- **setup-server.sh:** Script de configuração inicial do servidor

### 5. ✅ Código Limpo
Arquivos removidos:
- ❌ `app/utils/mockData.ts`
- ❌ `app/utils/mockStore.ts`
- ❌ `app/components/Todo.tsx`
- ❌ `app/components/Task.tsx`
- ❌ `pages/_app.tsx`
- ❌ `app/teste-apis/page.tsx`

### 6. ✅ Variáveis de Ambiente Completas
Arquivo [.env](.env) configurado com:
- ✅ Supabase (URL, Anon Key, Service Role Key)
- ✅ JWT_SECRET forte
- ✅ URLs de produção
- ✅ Asaas (API Key, Environment, Webhook Secret)
- ✅ Resend Email
- ✅ CORS Origins

---

## 📦 ARQUIVOS CRIADOS PARA DEPLOY

### 1. ecosystem.config.js
Configuração PM2 para gerenciar o processo Node.js em modo cluster.

**Recursos:**
- Modo cluster (usa todos os CPUs)
- Auto-restart em caso de falha
- Logs estruturados
- Limite de memória (1GB)

### 2. nginx.conf
Configuração Nginx completa com:
- Redirecionamento HTTP → HTTPS
- Redirecionamento sem www → com www
- SSL/TLS otimizado
- Gzip compression
- Cache de assets estáticos
- Headers de segurança
- Proxy reverso para Next.js (porta 3000)

### 3. deploy.sh
Script automático de deploy que:
1. Para a aplicação
2. Atualiza código do Git
3. Instala dependências
4. Faz build do Next.js
5. Reinicia com PM2
6. Verifica status

### 4. setup-server.sh
Script de configuração inicial do servidor:
1. Atualiza sistema
2. Instala Node.js 20.x
3. Instala PM2 e Nginx
4. Configura firewall (UFW)
5. Cria usuário da aplicação
6. Configura swap
7. Otimizações de sistema
8. Instala fail2ban

---

## 🔧 PASSO A PASSO DO DEPLOY

### FASE 1: Preparação Local

```bash
# 1. Commit das alterações
git add .
git commit -m "feat: configurações de produção para Contabo"
git push origin main

# 2. Verificar se todos os arquivos foram enviados
git status
```

### FASE 2: Configuração Inicial do Servidor

```bash
# 1. Conectar ao servidor Contabo via SSH
ssh root@<IP-DO-SERVIDOR>

# 2. Fazer upload do script de setup
# (Do seu computador local)
scp setup-server.sh root@<IP-DO-SERVIDOR>:/root/

# 3. No servidor, executar o setup
chmod +x setup-server.sh
./setup-server.sh

# 4. Aguardar conclusão (5-10 minutos)
```

### FASE 3: Clonar e Configurar Aplicação

```bash
# 1. Trocar para usuário da aplicação (se criado no setup)
su - bdcapp
# OU continuar como root se preferir

# 2. Navegar para diretório
cd /var/www/bdc-classificados

# 3. Clonar repositório
git clone <URL-DO-SEU-REPOSITORIO> .

# 4. Configurar .env
cp .env.example .env
nano .env

# 5. Verificar se todas as variáveis estão corretas
# - JWT_SECRET
# - SUPABASE_SERVICE_ROLE_KEY
# - ASAAS_API_KEY
# - URLs de produção

# 6. Proteger .env
chmod 600 .env
```

### FASE 4: Configurar Nginx

```bash
# 1. Copiar configuração Nginx
sudo cp nginx.conf /etc/nginx/sites-available/bdc-classificados

# 2. Criar link simbólico
sudo ln -s /etc/nginx/sites-available/bdc-classificados /etc/nginx/sites-enabled/

# 3. Remover configuração default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# 4. Testar configuração
sudo nginx -t

# 5. Se OK, recarregar Nginx
sudo systemctl reload nginx
```

### FASE 5: Obter Certificado SSL

```bash
# 1. Certbot interativo
sudo certbot --nginx -d buscaaquibdc.com -d www.buscaaquibdc.com

# 2. Seguir as instruções
# - Fornecer email para renovações
# - Aceitar termos de serviço
# - Escolher redirecionar HTTP para HTTPS

# 3. Testar renovação automática
sudo certbot renew --dry-run
```

### FASE 6: Deploy da Aplicação

```bash
# 1. Dar permissão de execução ao script
chmod +x deploy.sh

# 2. Executar deploy
./deploy.sh

# 3. Aguardar conclusão (3-5 minutos)

# 4. Verificar se está rodando
pm2 status

# 5. Ver logs em tempo real
pm2 logs bdc-classificados
```

### FASE 7: Verificações Finais

```bash
# 1. Testar localmente no servidor
curl http://localhost:3000

# 2. Testar externamente
curl https://www.buscaaquibdc.com

# 3. Verificar certificado SSL
curl -vI https://www.buscaaquibdc.com 2>&1 | grep -i ssl

# 4. Verificar logs
pm2 logs bdc-classificados --lines 50

# 5. Verificar uso de recursos
pm2 monit
```

---

## 🔍 TESTES PÓS-DEPLOY

### 1. Teste de Autenticação
```bash
# Login
curl -X POST https://www.buscaaquibdc.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha"}'
```

### 2. Teste de Upload
- Fazer login no painel
- Criar novo anúncio
- Fazer upload de imagem
- Verificar se aparece corretamente

### 3. Teste de Pagamento
- Criar assinatura de teste
- Verificar se integração Asaas funciona
- Checar webhooks (logs do PM2)

### 4. Teste de Performance
```bash
# Instalar Apache Bench
sudo apt install apache2-utils

# Teste de carga básico
ab -n 100 -c 10 https://www.buscaaquibdc.com/
```

### 5. Teste de Rate Limiting
```bash
# Fazer 15 requisições rápidas para auth
for i in {1..15}; do
  curl -X POST https://www.buscaaquibdc.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done

# Deve bloquear após 10 tentativas
```

---

## 🛠️ COMANDOS ÚTEIS PM2

```bash
# Ver status de todas as aplicações
pm2 status

# Ver logs em tempo real
pm2 logs bdc-classificados

# Ver apenas erros
pm2 logs bdc-classificados --err

# Monitoramento em tempo real (CPU, memória)
pm2 monit

# Reiniciar aplicação
pm2 restart bdc-classificados

# Recarregar com zero-downtime
pm2 reload bdc-classificados

# Parar aplicação
pm2 stop bdc-classificados

# Deletar da lista PM2
pm2 delete bdc-classificados

# Ver informações detalhadas
pm2 show bdc-classificados

# Limpar logs
pm2 flush bdc-classificados
```

---

## 🔄 DEPLOYS FUTUROS

Para atualizações após o deploy inicial:

```bash
# Método 1: Script automático (recomendado)
cd /var/www/bdc-classificados
./deploy.sh

# Método 2: Manual
git pull origin main
npm ci --omit=dev
npm run build
pm2 restart bdc-classificados
```

---

## 🐛 TROUBLESHOOTING

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs bdc-classificados --lines 100

# Verificar se .env existe
ls -la /var/www/bdc-classificados/.env

# Testar build manualmente
cd /var/www/bdc-classificados
npm run build
```

### Erro 502 Bad Gateway

```bash
# Verificar se PM2 está rodando
pm2 status

# Verificar se porta 3000 está ouvindo
netstat -tulpn | grep 3000

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/bdc-error.log
```

### Certificado SSL não funciona

```bash
# Renovar certificado
sudo certbot renew

# Verificar configuração SSL Nginx
sudo nginx -t

# Ver logs do Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Upload de imagens não funciona

```bash
# Verificar SUPABASE_SERVICE_ROLE_KEY
grep SUPABASE_SERVICE_ROLE_KEY /var/www/bdc-classificados/.env

# Testar conexão com Supabase
curl https://xjguzxwwydlpvudwmiyv.supabase.co

# Ver logs de erro
pm2 logs bdc-classificados --err --lines 50
```

### Rate Limiting muito restritivo

```bash
# Editar .env para aumentar limites
nano /var/www/bdc-classificados/.env

# Adicionar/modificar:
# RATE_LIMIT_REQUESTS=200
# RATE_LIMIT_WINDOW=900000

# Reiniciar
pm2 restart bdc-classificados
```

---

## 📊 MONITORAMENTO

### Logs do Sistema

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/bdc-access.log
sudo tail -f /var/log/nginx/bdc-error.log

# Logs do PM2
pm2 logs bdc-classificados

# Logs do sistema
sudo tail -f /var/log/syslog

# Uso de disco
df -h

# Uso de memória
free -h

# Processos que mais consomem CPU
top
```

### Métricas PM2

```bash
# Dashboard em tempo real
pm2 monit

# Estatísticas
pm2 describe bdc-classificados

# Uso de memória
pm2 list
```

---

## 🔐 SEGURANÇA

### Checklist de Segurança

- ✅ Firewall configurado (UFW)
- ✅ fail2ban instalado
- ✅ SSL/TLS ativo
- ✅ Rate limiting ativo
- ✅ Headers de segurança configurados
- ✅ .env com permissões 600
- ✅ Senha SSH forte (ou chave SSH)
- ⚠️ Configurar backup automático do banco
- ⚠️ Monitoramento de uptime (opcional)

### Hardening Adicional (Opcional)

```bash
# 1. Desabilitar login root via SSH
sudo nano /etc/ssh/sshd_config
# Alterar: PermitRootLogin no
sudo systemctl restart sshd

# 2. Configurar backup automático
# Criar script de backup em /root/backup.sh

# 3. Instalar monitoramento
# Ex: Netdata, Grafana, etc.
```

---

## 📞 WEBHOOKS

### Configurar Webhook Asaas

1. Acessar painel Asaas: https://www.asaas.com
2. Ir em Configurações → Webhooks
3. Adicionar URL: `https://www.buscaaquibdc.com/api/webhooks/asaas`
4. Selecionar eventos:
   - PAYMENT_CREATED
   - PAYMENT_UPDATED
   - PAYMENT_CONFIRMED
   - PAYMENT_RECEIVED
   - SUBSCRIPTION_CREATED
   - SUBSCRIPTION_UPDATED
5. Secret configurado no .env: `Bdctoken`

### Testar Webhook

```bash
# Ver logs quando webhook chegar
pm2 logs bdc-classificados | grep webhook

# Simular webhook (teste local)
curl -X POST https://www.buscaaquibdc.com/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test123"}}'
```

---

## ✅ CHECKLIST FINAL

### Pré-Deploy
- [x] JWT_SECRET configurado
- [x] SUPABASE_SERVICE_ROLE_KEY configurado
- [x] ASAAS_API_KEY configurado
- [x] Domínio apontando para servidor
- [x] CORS atualizado para produção
- [x] Rate limiting ativado
- [x] Código mock removido

### Durante Deploy
- [ ] Servidor configurado (setup-server.sh)
- [ ] Nginx configurado
- [ ] SSL obtido (certbot)
- [ ] Aplicação deployada (deploy.sh)
- [ ] PM2 rodando
- [ ] Logs sem erros

### Pós-Deploy
- [ ] Site acessível via HTTPS
- [ ] Login funciona
- [ ] Upload de imagens funciona
- [ ] Pagamentos funcionam
- [ ] Webhooks configurados
- [ ] Rate limiting testado
- [ ] Performance aceitável
- [ ] Backup configurado

---

## 🎯 PRÓXIMOS PASSOS

1. **Imediato (hoje)**
   - [ ] Executar setup-server.sh
   - [ ] Clonar repositório
   - [ ] Configurar Nginx
   - [ ] Obter SSL
   - [ ] Deploy inicial

2. **Primeiros dias**
   - [ ] Monitorar logs
   - [ ] Ajustar rate limiting se necessário
   - [ ] Configurar webhooks Asaas
   - [ ] Testes completos de funcionalidade

3. **Primeira semana**
   - [ ] Configurar backup automático
   - [ ] Monitoramento de uptime
   - [ ] Otimizações de performance
   - [ ] Documentação de incidentes

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **API:** [docs/API.md](docs/API.md)
- **Desenvolvimento:** [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md)
- **Análise Completa:** [ANALISE_SISTEMA_COMPLETA.md](ANALISE_SISTEMA_COMPLETA.md)
- **Admin Panel:** [docs/admin/PAINEL.md](docs/admin/PAINEL.md)

---

**Deploy preparado em:** 06 de Outubro de 2025
**Domínio:** https://www.buscaaquibdc.com
**Servidor:** Contabo VPS
**Stack:** Next.js 14 + PM2 + Nginx

🚀 **Sistema 100% pronto para produção!**
