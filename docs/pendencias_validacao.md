# Pendencias de Validacao BDC

## Autenticacao e Admin
- [ ] Remover credenciais administrativas hardcoded e sincronizar com fluxo seguro do backend (`app/admin/AdminContext.tsx:25-27`).
- [ ] Unificar lista de emails administradores em um unico modulo de configuracao para evitar divergencias (`app/admin/AdminContext.tsx:17`, `app/api/destaques/route.ts:128`, `app/api/admin/auth/route.ts:8`).

## Assinaturas e Pagamentos
- [ ] Ajustar autenticacao da rota de criacao de assinaturas para validar JWT de forma correta (substituir `JSON.parse(atob(token))` por `validateAuth` ou equivalente em `app/api/subscriptions/create/route.ts:15-33`).
- [ ] Implementar integracao real com ASAAS/planos removendo os fallbacks que forcam plano FREE (`app/lib/subscriptionContext.tsx:196`, `app/lib/subscriptionMiddleware.ts:54`, `app/lib/subscriptionMiddleware.ts:97`).
- [ ] Corrigir metodos HTTP incorretos usados para atualizar clientes/assinaturas no ASAAS (usar PUT em vez de POST em `lib/asaas.ts:149` e metodos equivalentes).

## Rotas de Teste e Codigo Morto
- [ ] Remover ou proteger a rota publica de diagnostico `app/test-highlights-page/page.tsx:75` antes do deploy.
- [ ] Consolidar a pagina de destaques admin e descartar arquivos nao usados (`app/admin/destaques/page-original.tsx`, `app/admin/destaques/StoryManager.tsx:18`).
- [ ] Eliminar modulos de validacao de ambiente duplicados/nao referenciados (`app/lib/validateEnv.ts`, `app/lib/validateEnvironment.ts`).
- [ ] Limpar utilitarios Supabase nao utilizados, como `createOfflineClient` (`app/lib/supabase.ts:214`).

## Logging e Observabilidade
- [ ] Padronizar logs para usar `secureLogger` ou remover consoles ruidosos com emojis (ex.: `app/page.tsx:17`, `app/components/SupabaseProvider.tsx:67`).
- [ ] Revisar scripts/manuais para garantir que logs de diagnostico nao sejam executados em producao (`scripts/test-apis.js:10`).

## Documentacao e Qualidade
- [ ] Sanitizar linguagem inadequada e atualizar informacoes desatualizadas em `docs/MELHORIAS_FUTURAS.md:13` e correlatos.
- [ ] Corrigir `app/components/tests/README_TESTES.md:16` informando a inexistencia de testes atuais ou adicionar os testes prometidos.
- [ ] Revisar `PROJETO_ORGANIZADO.md` e demais arquivos que declaram prontidao para producao para refletir pendencias reais.

## Internacionalizacao e Conteudo
- [ ] Revisar textos com caracteres corrompidos em diversos arquivos (`app/page.tsx:17`, `app/planos/page.tsx`, `PROJETO_ORGANIZADO.md`) e assegurar codificacao UTF-8 consistente.
- [ ] Substituir textos com emojis nao padronizados por strings ASCII ou componentes de icone (`app/page.tsx:89`, `app/components/StoreStories.tsx`).

## Configuracoes e URLs
- [ ] Centralizar definicao de URLs base usadas nas chamadas internas (`app/page.tsx:20`, `app/api/payments/process-extra-ad/route.ts:40`, `scripts/test-apis.js:8`) para evitar fallback incorreto para localhost em producao.
