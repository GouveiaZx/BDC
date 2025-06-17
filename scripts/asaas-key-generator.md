# 🔑 GUIA: Gerar Nova Chave ASAAS

## Problema Identificado
A chave ASAAS atual está retornando **401 Unauthorized**, indicando que:
- ✅ A chave está expirada
- ✅ A chave foi revogada
- ✅ A chave está incorreta
- ✅ A conta ASAAS está bloqueada

## ⚡ AÇÃO IMEDIATA NECESSÁRIA

### 1. Acessar Painel ASAAS
1. Acesse: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em **Integrações** > **API**

### 2. Verificar Status da Conta
- ✅ Conta está ativa?
- ✅ Não há bloqueios ou pendências?
- ✅ Documentação está aprovada?

### 3. Gerar Nova Chave API
1. No painel, vá em **API**
2. Clique em **Gerar Nova Chave**
3. Selecione **PRODUÇÃO** (não sandbox)
4. Copie a nova chave completa

### 4. Atualizar no Vercel
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto BDC
3. Vá em **Settings** > **Environment Variables**
4. Edite **ASAAS_API_KEY**
5. Cole a NOVA chave
6. Salve e force redeploy

### 5. Teste Imediato
Execute o comando:
```bash
node test-asaas-manual.js
```

## 🔧 VERIFICAÇÕES PÓS-CORREÇÃO

### Teste 1: Chave Manual
```bash
# Este teste deve retornar 200 OK
curl -X GET "https://api.asaas.com/v3/customers" \
  -H "Authorization: Bearer SUA_NOVA_CHAVE" \
  -H "Content-Type: application/json"
```

### Teste 2: Criar Cliente
```bash
# Este teste deve criar um cliente de teste
node test-asaas-manual.js
```

### Teste 3: Verificar Logs de Produção
```bash
# Verificar se os logs mostram a nova chave funcionando
vercel logs --follow
```

## 🚨 IMPORTANTE
- ⚠️ A chave antiga DEVE ser revogada no painel ASAAS
- ⚠️ A nova chave deve ter permissões completas
- ⚠️ Teste SEMPRE em ambiente de produção após deploy
- ⚠️ Monitore os logs nas primeiras horas

## 📱 CONTATO ASAAS
Se o problema persistir:
- **Suporte**: suporte@asaas.com
- **WhatsApp**: (62) 99999-9999
- **Portal**: https://ajuda.asaas.com 