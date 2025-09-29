# Integração com Asaas

Este documento descreve a integração do BuscaAquiBdC com a plataforma de pagamentos Asaas para o gerenciamento de assinaturas e pagamentos.

## Configuração

A integração com o Asaas está configurada com a chave de API oficial da plataforma. Para manter esta configuração, garanta que as seguintes variáveis de ambiente estejam definidas:

```
# Variáveis de ambiente para integração com o Asaas
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJkMTdjN2IwLWMxNWEtNDUyOC1hMmIyLWUwODRiOGQ1MzUwNzo6JGFhY2hfMjM1NWMzNGEtZTE1MS00OGYyLThjYzEtYzNhOTMzZjY5MTZh
ASAAS_API_URL=https://api.asaas.com/v3
USE_MOCK_ASAAS=false  # Em produção, definir como "false"
```

### Scripts de Configuração

Para facilitar a configuração, foram criados scripts que podem ser executados via npm:

```bash
# Para configurar a integração com o Asaas
npm run configure-asaas

# Para testar a integração com o Asaas
npm run test-asaas
```

## Ambiente de Desenvolvimento

Durante o desenvolvimento, você pode usar o ambiente mockado configurando:

```
USE_MOCK_ASAAS=true
```

Isso permitirá que você desenvolva e teste as funcionalidades de assinatura sem a necessidade de uma integração real com o Asaas.

## Estrutura da Integração

A integração com o Asaas está dividida em 3 principais componentes:

1. **Serviço Asaas (`app/lib/asaas.ts`)**: Responsável pela comunicação direta com a API do Asaas.
2. **Contexto de Assinatura (`app/lib/subscriptionContext.tsx`)**: Gerencia o estado da assinatura do usuário na aplicação.
3. **Middleware de Assinatura (`app/lib/subscriptionMiddleware.ts`)**: Valida permissões baseadas no plano de assinatura.

## Fluxo de Assinatura

O fluxo de assinatura segue os seguintes passos:

1. **Seleção de Plano**: O usuário seleciona um plano de assinatura.
2. **Checkout**: O usuário preenche os dados de pagamento.
3. **Processamento do Pagamento**: Os dados são enviados para a API de assinatura.
4. **Criação da Assinatura no Asaas**: O backend se comunica com o Asaas para criar a assinatura.
5. **Confirmação**: O usuário é redirecionado para a página de sucesso.

## Planos Disponíveis

A plataforma oferece os seguintes planos:

| Plano | ID | Preço | Recursos |
|-------|------|-------|----------|
| Gratuito | `free` | R$ 0 | Até 3 anúncios |
| Micro Negócios | `micro_business` | R$ 29,90 | Até 10 anúncios, 1 destaque |
| Pequena Empresa | `small_business` | R$ 149,90 | Até 30 anúncios, 3 destaques |
| Empresa Simples | `business_simple` | R$ 249,90 | Até 100 anúncios, 5 destaques |
| Empresa Plus | `business_plus` | R$ 349,90 | Anúncios ilimitados, 10 destaques |

## Métodos de Pagamento Suportados

A integração com o Asaas suporta os seguintes métodos de pagamento:

1. **Cartão de Crédito**: Pagamento recorrente automático
2. **Boleto Bancário**: Geração automática mensal
3. **PIX**: Pagamento instantâneo

## Dashboard do Asaas

Para acessar o dashboard do Asaas e gerenciar pagamentos:

1. Acesse [https://www.asaas.com/login](https://www.asaas.com/login)
2. Entre com as credenciais da conta
3. No painel, você poderá visualizar todos os clientes, assinaturas e pagamentos

## Resolução de Problemas

Se encontrar problemas com a integração:

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Execute o script de teste: `npm run test-asaas`
3. Verifique os logs do servidor para mensagens de erro específicas
4. Confira o status da API do Asaas em: `https://status.asaas.com`

---

**Nota**: Mantenha a chave de API segura e nunca a compartilhe em repositórios públicos ou código do lado do cliente.

## Verificação de Permissões

Para verificar se um usuário tem permissão para acessar certos recursos, use o hook `useSubscription`:

```tsx
import { useSubscription } from '../lib/subscriptionContext';

function MinhaComponente() {
  const { hasPermission, maxAds } = useSubscription();
  
  const podeAdicionarDestaque = hasPermission('CREATE_HIGHLIGHT');
  
  // Lógica do componente...
}
```

## Implementação Pendente

Para completar a integração, os seguintes itens ainda precisam ser implementados quando a conta no Asaas estiver ativa:

1. **Webhooks do Asaas**: Para receber notificações sobre pagamentos, cancelamentos e outras atualizações.
2. **Página de Gerenciamento de Assinatura**: Permitir que o usuário visualize e gerencie sua assinatura.
3. **Integração com Sistema de Autenticação**: Para obter os dados reais do usuário.

## Testes

Recomenda-se realizar os seguintes testes:

1. **Criação de Assinatura**: Testar a criação de assinaturas para diferentes planos.
2. **Cancelamento de Assinatura**: Testar o cancelamento de assinaturas.
3. **Verificação de Permissões**: Testar o acesso a recursos baseado no plano.
4. **Renovação de Assinatura**: Testar o fluxo de renovação automática.

## Documentação da API do Asaas

Para mais informações sobre a API do Asaas, consulte a [documentação oficial](https://asaasv3.docs.apiary.io/). 