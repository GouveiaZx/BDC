# 🎯 BDC Classificados - Sistema Completo

**Sistema de classificados 100% funcional** com Next.js 14, Supabase e Asaas.

[![Status](https://img.shields.io/badge/Status-100%25%20Funcional-success)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-blue)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)

## 🚀 Início Rápido (2 minutos)

```bash
# 1. Configure o ambiente
node scripts/setup-env-correto.js

# 2. Instale dependências
npm install

# 3. Inicie o desenvolvimento
npm run dev

# 4. Acesse: http://localhost:3000
# Login: teste@bdc.com / Teste123!
```

## ✅ Sistema 100% Completo

- ✅ **Banco de dados** - 50 cidades MA, 69 categorias, usuários ativos
- ✅ **Autenticação** - Login/logout, tokens seguros, middleware
- ✅ **11 APIs principais** - Auth, perfil, categorias, anúncios, pagamentos
- ✅ **Storage funcionando** - Upload de imagens configurado
- ✅ **Frontend integrado** - Todas as páginas funcionais
- ✅ **Sistema de destaques** - Stories com moderação
- ✅ **Área administrativa** - Painel completo
- ✅ **Sistema de emails** - Resend integrado
- ✅ **PWA** - Aplicativo web progressivo

## 🎯 Melhorias Opcionais

Para otimizações futuras, consulte `/docs/MELHORIAS_FUTURAS.md`

## 📊 Dados Atuais

- **🏙️ Cidades**: 50 do Maranhão
- **📂 Categorias**: 69 reais e ativas  
- **👥 Usuários**: 3 ativos (incluindo teste)
- **💰 Planos**: 5 configurados (Gratuito a Empresarial)

## 🔧 Scripts Úteis

```bash
# Verificar status do projeto
node scripts/verificar-projeto-final.js

# Testar APIs e autenticação  
node scripts/test-profile-api.js

# Configurar storage
node scripts/setup-storage.js

# Teste completo do sistema
node scripts/test-system-complete.js

# Limpar localStorage (se necessário)
node scripts/limpar-localstorage.js
```

## 📁 Estrutura Organizada

```
app/
├── api/              # 45+ APIs funcionais
│   ├── auth/         # Login, register, logout
│   ├── users/        # Perfil de usuários
│   ├── ads/          # Anúncios e busca
│   ├── admin/        # APIs administrativas
│   └── upload/       # Upload de imagens
├── lib/              # authUtils, supabase, asaas
└── components/       # Componentes React

docs/
├── API.md            # Documentação completa das APIs
├── DESENVOLVIMENTO.md # Checklist e status do projeto
├── MELHORIAS_FUTURAS.md # Otimizações pendentes
├── technical/        # Documentação técnica (testes, design, segurança)
├── admin/           # Documentação administrativa
├── mobile/          # Documentação de apps móveis
├── setup/           # Guias de configuração
└── guides/          # Fluxos e exemplos de uso

scripts/              # Scripts de configuração e teste
CLAUDE.md            # Instruções para Claude Code
```

## 🔗 Links Importantes

- **🎛️ Dashboard Supabase**: https://supabase.com/dashboard/project/xjguzxwwydlpvudwmiyv
- **📊 Documentação**: `/docs/DESENVOLVIMENTO.md`
- **⚙️ Configuração**: `.env.local`

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes, Middleware
- **Banco**: Supabase (PostgreSQL), Storage
- **Pagamentos**: Asaas (PIX, Boleto, Cartão)
- **Auth**: JWT + httpOnly Cookies

---

**🎯 100% FUNCIONAL - PRONTO PARA PRODUÇÃO!**

<!-- Teste de configuração de email para Vercel - 2024 --> 