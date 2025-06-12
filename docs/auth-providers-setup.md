# Configuração de Provedores de Autenticação no Supabase

Este guia explica como configurar corretamente os provedores de autenticação OAuth (Google e Facebook) no projeto Supabase para que o login social funcione corretamente.

## Erro Comum

Se você estiver vendo o erro:
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Significa que o provedor OAuth (Google ou Facebook) não está habilitado no projeto Supabase.

## Passo a Passo para Configuração

### 1. Acesse o Dashboard do Supabase

- Vá para [https://app.supabase.io](https://app.supabase.io)
- Faça login na sua conta
- Selecione o projeto "zkrpmahtttbaoahdpliq"

### 2. Configure a Autenticação

- No menu lateral, clique em "Authentication"
- Selecione "Providers"

### 3. Configurando o Google

1. **Habilite o Google**: Ative o toggle do provedor Google
2. **Obtenha Credenciais no Google Cloud**:
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - Crie um novo projeto ou use um existente
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth client ID"
   - Selecione "Web application" como tipo
   - Adicione a URL de redirecionamento: `https://zkrpmahtttbaoahdpliq.supabase.co/auth/v1/callback`
   - Anote o Client ID e Client Secret
3. **Configure no Supabase**:
   - Cole o Client ID e Client Secret nos campos correspondentes
   - Salve as alterações

### 4. Configurando o Facebook

1. **Habilite o Facebook**: Ative o toggle do provedor Facebook
2. **Obtenha Credenciais no Facebook Developers**:
   - Acesse [Facebook Developers](https://developers.facebook.com)
   - Crie um novo aplicativo ou use um existente
   - Vá para "Settings" > "Basic"
   - Anote o App ID e App Secret
   - Em "Products", adicione "Facebook Login"
   - Configure a URL de redirecionamento: `https://zkrpmahtttbaoahdpliq.supabase.co/auth/v1/callback`
3. **Configure no Supabase**:
   - Cole o App ID e App Secret nos campos correspondentes no Supabase
   - Salve as alterações

## URLs de Callback

É importante configurar corretamente as URLs de callback tanto no Supabase quanto nos provedores:

- **URL de Callback**: `https://zkrpmahtttbaoahdpliq.supabase.co/auth/v1/callback`

## Testando a Autenticação

Após a configuração, teste os logins sociais:

1. Acesse sua aplicação
2. Tente fazer login utilizando Google/Facebook
3. Você deve ser redirecionado para a página de autenticação do provedor
4. Após autorização, o Supabase irá processar o callback e redirecionar de volta para a aplicação

## Solução de Problemas

Se continuar enfrentando problemas:

1. **Verifique os consoles de desenvolvedor**:
   - Google Cloud Console: certifique-se de que a API OAuth está habilitada
   - Facebook Developers: verifique status do aplicativo e permissões

2. **Verifique os logs**:
   - No dashboard do Supabase, vá para "Authentication" > "Logs" para visualizar tentativas de login

3. **Questões comuns**:
   - Domínios de aplicativo incorretos
   - URLs de redirecionamento mal configuradas
   - Permissões inadequadas nos consoles dos provedores
   - Provedor em modo de desenvolvimento (especialmente no Facebook)
   - Aplicativo não verificado (especialmente no Google) 