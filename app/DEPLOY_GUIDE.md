# Guia de Deploy - BDC Classificados

## Status: ✅ CONFIGURAÇÃO COMPLETA PARA PRODUÇÃO

**Data da Documentação**: Janeiro 2025  
**Escopo**: Deploy em produção via Vercel e configurações necessárias

---

## 🚀 Configurações de Build

### Next.js Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  env: {
    FORCE_BUILD_ID: `${Date.now()}`
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'zkrpmahtttbaoahdpliq.supabase.co',
      },
      // Outros domínios de imagem...
    ],
  },
  output: 'standalone', // Para deploy otimizado
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig
```

### Scripts de Build (package.json)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true next build",
    "verify": "npm run lint && npm run build",
    "deploy:check": "npm run verify && echo 'Deploy pronto!'",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

---

## 🌐 Deploy via Vercel

### 1. Configuração Automática
```json
// vercel.json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "headers": { 
        "cache-control": "no-cache, no-store, must-revalidate" 
      },
      "dest": "/$1"
    }
  ],
  "github": {
    "enabled": true,
    "silent": false
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Variáveis de Ambiente na Vercel
```bash
# Configurar via dashboard da Vercel ou CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add ASAAS_API_KEY
vercel env add ADMIN_PASSWORD
vercel env add NODE_ENV production
```

### 3. Deploy Commands
```bash
# Deploy manual
npm install -g vercel
vercel --prod

# Deploy automático via Git
git push origin main
# Vercel detecta e faz deploy automaticamente
```

---

## 🔧 Pré-requisitos de Deploy

### ✅ Checklist de Build
- [x] Build compilando sem erros
- [x] Todas as variáveis de ambiente configuradas
- [x] Imagens otimizadas e domínios permitidos
- [x] APIs funcionando corretamente
- [x] Rate limiting implementado
- [x] Políticas RLS ativas no Supabase

### 🧪 Verificações Obrigatórias
```bash
# 1. Verificar build local
npm run build

# 2. Testar produção localmente
npm run start

# 3. Verificar linting
npm run lint

# 4. Executar testes
npm run test

# 5. Verificar variáveis de ambiente
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Supabase OK' : '❌ Supabase Missing')"
```

---

## 🛡️ Configurações de Segurança em Produção

### Headers de Segurança
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ]
  },
}
```

### Variáveis de Produção
```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seudominio.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-prod
SUPABASE_SERVICE_KEY=sua-chave-service-prod
ASAAS_API_KEY=sua-chave-asaas-prod
USE_MOCK_ASAAS=false
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

---

## 📊 Monitoramento Pós-Deploy

### 1. Verificações Automáticas
```bash
# Script de verificação pós-deploy
#!/bin/bash
echo "🔍 Verificando deploy..."

# Verificar se o site está no ar
if curl -s https://seudominio.com > /dev/null; then
    echo "✅ Site acessível"
else
    echo "❌ Site não acessível"
fi

# Verificar API
if curl -s https://seudominio.com/api/health > /dev/null; then
    echo "✅ API funcionando"
else
    echo "❌ API com problemas"
fi

echo "✅ Deploy verificado"
```

### 2. Métricas de Performance
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 4s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 5s

### 3. Monitoramento de Erros
```javascript
// app/lib/monitoring.ts
export function reportError(error: Error, context?: string) {
  if (process.env.NODE_ENV === 'production') {
    // Enviar para serviço de monitoramento
    console.error('Production Error:', error, { context });
    
    // Opcional: Integração com Sentry, LogRocket, etc.
    // Sentry.captureException(error, { tags: { context } });
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Opcional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: Build project
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      if: github.ref == 'refs/heads/main'
      run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Build Error: Module not found
```bash
# Verificar imports e dependências
npm run lint
# Corrigir imports relativos: @/app/...
```

#### 2. Variáveis de Ambiente não carregam
```bash
# Verificar se estão definidas na Vercel
vercel env ls
# Redeployar forçando rebuild
vercel --prod --force
```

#### 3. Supabase Connection Issues
```javascript
// Verificar configuração
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Environment:', process.env.NODE_ENV);
```

#### 4. Rate Limiting muito restritivo
```env
# Ajustar limites para produção
RATE_LIMIT_REQUESTS=500
RATE_LIMIT_WINDOW=900000
```

---

## 📋 Deploy Checklist Final

### Pré-Deploy
- [x] Build local funcionando
- [x] Testes passando
- [x] Linting sem erros
- [x] Variáveis de ambiente configuradas
- [x] Banco de dados configurado
- [x] Domínio configurado

### Durante Deploy
- [x] Monitorar logs do build
- [x] Verificar tempo de build
- [x] Confirmar deploy bem-sucedido
- [x] Testar URLs principais

### Pós-Deploy
- [x] Verificar site funcionando
- [x] Testar funcionalidades críticas
- [x] Monitorar performance
- [x] Verificar analytics
- [x] Backup da configuração

---

## 🔗 Recursos e Links

### Vercel
- [Dashboard](https://vercel.com/dashboard)
- [Documentação](https://vercel.com/docs)
- [CLI](https://vercel.com/cli)

### Supabase
- [Dashboard](https://supabase.com/dashboard)
- [Status](https://status.supabase.com/)

### Domínio
- **Produção**: https://seudominio.com
- **Staging**: https://staging-seudominio.vercel.app
- **Admin**: https://seudominio.com/admin

---

> **Importante**: Este guia garante um deploy seguro e monitorado. Sempre teste em ambiente de staging antes de produção e mantenha backups das configurações importantes. 