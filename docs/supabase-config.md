# Configuração do Supabase

Este documento contém as informações necessárias para configurar a integração com o Supabase no projeto.

## Credenciais

URL do Supabase: `https://zkrpmahtttbaoahdpliq.supabase.co`

API Key (anon/public): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcnBtYWh0dHRiYW9haGRwbGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDI5NDgsImV4cCI6MjA2MjAxODk0OH0.WVfJVkuH1ZBzG1e1_fcmWIzxzkAj4zerhulbatTNmqA`

Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcnBtYWh0dHRiYW9haGRwbGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjQ0Mjk0OCwiZXhwIjoyMDYyMDE4OTQ4fQ.hXfVSjrUiAn-Q5Hp0KbhU74J2xtdFOQHrZ9o2KZi-i8`

## Configuração

Para utilizar o Supabase no projeto, estas credenciais foram configuradas no arquivo `app/lib/supabase.ts`.

## Tabelas

O Supabase foi configurado com as seguintes tabelas:

1. `profiles` - Informações de perfil dos usuários
2. `business_profiles` - Perfis de empresas
3. `ads` - Anúncios
4. `categories` - Categorias de anúncios
5. `subscriptions` - Assinaturas de planos
6. `user_favorites` - Favoritos dos usuários

## Autenticação

A autenticação foi implementada usando:

- Email/senha
- Google OAuth
- Facebook OAuth

## Arquivos Relacionados

- `app/lib/supabase.ts` - Cliente Supabase
- `app/lib/auth.ts` - Funções de autenticação 
- `app/login/page.tsx` - Página de login
- `app/cadastro/page.tsx` - Página de cadastro

## Como Testar

1. Acesse a página de login
2. Realize o cadastro com email e senha
3. Tente fazer login com as credenciais cadastradas
4. Ou use autenticação via Google/Facebook 