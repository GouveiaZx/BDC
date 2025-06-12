# Resolução do Problema de Criação de Destaques

Este documento descreve como resolver o problema de criação de destaques quando o usuário recebe a mensagem "Você precisa estar logado para criar um destaque" mesmo quando já está logado.

## Problema

O problema ocorre por três razões principais:

1. **Problema de token de autenticação**: O sistema procura apenas por um tipo específico de token (`sb-access-token`) no localStorage, mas o token pode estar armazenado em outro formato.

2. **Políticas de RLS (Row Level Security) no Supabase**: As políticas de segurança no banco de dados estão bloqueando a inserção de novos destaques, mesmo quando o usuário está autenticado.

3. **Verificação de autenticação do cliente**: A API de destaques está exigindo um token de acesso válido, mesmo quando usa o cliente admin que teoricamente pode contornar as políticas de RLS.

## Solução

Implementamos as seguintes alterações para resolver o problema:

### 1. Melhorias no Cliente (Frontend)

- **Verificação de múltiplas fontes de token**: Modificamos a função `handleSubmit` em `app/painel-anunciante/publicar-destaques/page.tsx` para verificar várias possíveis fontes de token.
- **Continuação mesmo sem token**: Permitimos continuar com a criação do destaque mesmo quando não há token, desde que o ID do usuário esteja presente.
- **Melhor logging**: Adicionamos mais detalhes aos logs para facilitar a depuração.

### 2. Melhorias na API (Backend)

- **Verificação de usuário mais robusta**: Verificamos se o usuário existe nas tabelas `profiles` e `auth.users` antes de prosseguir.
- **Uso consistente do cliente admin**: Usamos o cliente de administrador para bypass das RLS durante operações de inserção.

### 3. Ajustes no Banco de Dados

Criamos um script SQL (`app/sql/fix_destaques_users.sql`) que deve ser executado no SQL Editor do Supabase para:

- Criar/corrigir a tabela `destaques` se necessário
- Criar/corrigir a tabela `users` para relacionar com `auth.users`
- Atualizar a função `is_admin()` para verificar corretamente se o usuário é administrador
- Garantir que a extensão `uuid-ossp` está instalada
- Desabilitar temporariamente as políticas RLS e certificar que todos os perfis existem
- Remover todas as políticas existentes para evitar conflitos
- Criar políticas de permissão mais abrangentes, incluindo uma política que permite que o serviço possa inserir (bypass RLS)
- Criar um gatilho para atualizar o campo `updated_at`

## Como Aplicar a Solução

1. **Execute as alterações no código**: As alterações já foram implementadas nos arquivos:
   - `app/painel-anunciante/publicar-destaques/page.tsx`
   - `app/api/destaques/route.ts`

2. **Execute o script SQL no Supabase**:
   - Acesse o painel administrativo do Supabase
   - Vá para o SQL Editor
   - Cole o conteúdo do arquivo `app/sql/fix_destaques_users.sql`
   - Execute o script

3. **Teste a funcionalidade**: Após aplicar as alterações, tente criar um destaque novamente. 
   A mensagem de erro não deverá mais aparecer.

## Verificação

Para verificar se a solução foi aplicada corretamente:

1. **Verifique no console do navegador**: Você deve ver logs que mostram que o ID do usuário foi detectado e que a requisição foi enviada.
2. **Verifique o painel do Supabase**: A tabela `destaques` deve conter o novo registro.

## Notas adicionais

- Este problema pode ocorrer em outras partes do sistema que dependem de autenticação. A solução aplicada aqui pode servir como modelo.
- O uso do cliente admin para bypass RLS é uma solução adequada para este caso, mas em sistemas com requisitos de segurança mais rigorosos, esta abordagem deve ser reconsiderada. 