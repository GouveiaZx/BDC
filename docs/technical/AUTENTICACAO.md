# Fluxo de Autenticação do BDC Classificados

Este documento explica os diferentes fluxos de autenticação disponíveis na plataforma.

## Fluxo padrão com confirmação de email

Por padrão, o Supabase utiliza confirmação de email para validar novos usuários. Neste fluxo:

1. Usuário preenche o formulário de cadastro
2. Sistema registra o usuário no Supabase
3. Supabase envia um email de confirmação
4. Usuário é redirecionado para `/cadastro-sucesso`
5. Usuário precisa confirmar o email
6. Após confirmação, o usuário pode fazer login
7. Sistema redireciona para seleção de planos

## Fluxo sem confirmação de email

Foi implementada uma versão alternativa que pula a necessidade de confirmação de email:

1. Usuário preenche o formulário de cadastro
2. Sistema registra o usuário no Supabase
3. Sistema redireciona diretamente para a página de planos (`/planos`)
4. A sessão já está ativa, sem necessidade de login adicional

### Como ativar o fluxo sem confirmação de email

Para usar este fluxo simplificado, é necessário desativar a confirmação de email no Supabase:

1. Acesse o painel de administração do Supabase
2. Navegue até "Authentication" > "Settings" > "Email Auth"
3. Desative a opção "Confirm email" ou "Enable email confirmations"
4. Salve as alterações

### Considerações de segurança

Desativar a confirmação de email traz algumas implicações:

- **Vantagens**:
  - Experiência de usuário mais fluida, menos etapas para começar a usar o sistema
  - Menos usuários abandonam o processo de cadastro

- **Desvantagens**:
  - Possibilidade de cadastros com emails inválidos ou não pertencentes ao usuário
  - Menor segurança, pois não há verificação da propriedade do email
  - Potencial para aumento de spam ou contas falsas

### Recomendações

Se optar pelo fluxo sem confirmação de email, considere implementar:

1. Validação adicional de usuários por outros meios (ex: SMS, documento, etc.)
2. Sistema de pontuação de confiabilidade para novos usuários
3. Limitações para contas não verificadas
4. Opção para verificar email posteriormente para desbloquear mais recursos

## Fluxo de autenticação com provedores sociais

Para Google e Facebook, o fluxo é:

1. Usuário clica no botão de login social
2. É redirecionado para o provedor (Google/Facebook)
3. Após autenticação no provedor, retorna para o site
4. Sistema redireciona diretamente para `/planos`

Este fluxo já funciona sem necessidade de confirmação de email adicional. 