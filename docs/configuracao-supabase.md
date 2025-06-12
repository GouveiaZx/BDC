# Configuração Manual do Supabase

Este documento contém instruções adicionais para configurar manualmente o Supabase para uso com o projeto BDC Classificados.

## Configuração das Tabelas

Recomendamos executar o script completo em `docs/supabase-schema.sql` no SQL Editor do Supabase para criar todas as tabelas necessárias.

Caso prefira criar as tabelas individualmente ou tenha problemas com o script completo, siga estas instruções:

### 1. Criando a Tabela de Perfis

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    account_type TEXT DEFAULT 'personal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
  
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 2. Criando a Tabela de Perfis de Negócio

```sql
CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    twitter TEXT,
    established_year TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public business profiles are viewable by everyone."
  ON public.business_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own business profile."
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own business profile."
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Configuração da Autenticação

### 1. Configurações Gerais

No painel do Supabase:

1. Acesse "Authentication" > "Settings"
2. Em "Site URL", coloque a URL do seu site (ex: http://localhost:3000 em desenvolvimento)
3. Em "Redirect URLs", adicione:
   - http://localhost:3000/auth/callback
   - http://localhost:3000/login
   - http://localhost:3000/planos
4. Em "Email Templates", personalize os templates de email conforme necessário
5. Para pular a verificação de email:
   - Navegue até "Authentication" > "Settings" > "Email Auth"
   - Desative a opção "Confirm email" ou "Enable email confirmations"
   - Salve as alterações

### 2. Configuração de Provedores

Consulte o arquivo `docs/auth-providers-setup.md` para instruções detalhadas sobre como configurar os provedores Google e Facebook.

## Execução de SQL Personalizado

Para facilitar a execução de SQL personalizado, você pode criar a função `exec_sql`:

```sql
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Esta função pode ser usada para executar SQL dinamicamente a partir do código da aplicação.

## Verificação de Configuração

Para verificar se seu Supabase está configurado corretamente:

1. Crie um usuário de teste
2. Confirme que as tabelas de perfil são criadas automaticamente
3. Faça login com diferentes métodos
4. Verifique se os dados do perfil estão sendo salvos corretamente

## Problemas Comuns

### Problema: Usuário não é redirecionado após login com Google/Facebook

**Solução**: Verifique se as URLs de redirecionamento estão configuradas corretamente em:
- Configurações do Supabase
- Console do Google Cloud (para login com Google)
- Facebook Developers (para login com Facebook)

### Problema: Erro ao criar perfil de usuário

**Solução**: Verifique se a tabela `profiles` existe e tem as políticas RLS configuradas corretamente.

### Problema: Não é possível atualizar perfil

**Solução**: Certifique-se de que as políticas RLS estão configuradas para permitir que os usuários atualizem seus próprios perfis. 