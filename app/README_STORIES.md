# Opções para Visualização de Stories/Destaques

Este documento apresenta as diferentes opções implementadas para a visualização e navegação dos stories/destaques no marketplace.

## Opção 1: Carrossel com botão "Ver Todos"

Esta é a implementação padrão atual, onde temos:

- Um carrossel horizontal que exibe os stories/destaques
- Um botão "Ver todos" que direciona para uma página dedicada com todos os stories
- Navegação lateral com setas quando há mais stories do que o espaço disponível
- Visualização em tela cheia ao clicar em um story

**Como usar:**
```jsx
{/* Na página da empresa */}
<div className="mb-12 mt-6">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold text-gray-800">Stories</h2>
    <Link href={`/empresa/${seller.id}/todos-stories`} className="text-blue-600 text-xs hover:underline">Ver todos</Link>
  </div>
  <div className="relative py-3">
    <StoreStories stories={seller.stories} showTitle={false} />
  </div>
</div>
```

## Opção 2: Apenas Carrossel (sem botão "Ver Todos")

Esta opção remove o botão "Ver todos" e mantém apenas o carrossel para navegar pelos stories, com controles de navegação aprimorados:

- Carrossel horizontal com navegação por setas
- Scroll snap para melhor experiência em dispositivos móveis
- Visualização em tela cheia ao clicar em um story
- Não inclui uma página separada para ver todos os stories

**Como usar:**
```jsx
<StoreStoriesConfig 
  stories={seller.stories} 
  showTitle={true}
  showViewAll={false}
/>
```

## Opção 3: Componente Configurável (versão mais flexível)

O componente `StoreStoriesConfig` permite customizar completamente a exibição dos stories:

```jsx
<StoreStoriesConfig 
  stories={seller.stories} 
  showTitle={true}           // Mostra ou não o título "Stories"
  showViewAll={true}         // Mostra ou não o botão "Ver todos"
  sellerId={seller.id}       // Necessário se showViewAll=true
  hideNavigation={false}     // Esconde ou mostra as setas de navegação
  className="custom-class"   // Classes CSS adicionais
/>
```

## Páginas Implementadas

1. **Carrossel na página principal da empresa** (`app/empresa/[id]/page.tsx`)
   - Exibe os stories em formato de carrossel
   - Inclui botão "Ver todos" que leva para a página dedicada

2. **Página "Ver Todos"** (`app/empresa/[id]/todos-stories/page.tsx`)
   - Exibe todos os stories em formato de grade
   - Permite visualização em tela cheia ao clicar em um story
   - Inclui informações adicionais como data de publicação e visualizações

## Como escolher a melhor opção

1. Se preferir manter a experiência atual com o botão "Ver todos", mantenha a Opção 1.
2. Se preferir simplificar e remover a página "Ver todos", use a Opção 2 (apenas carrossel).
3. Para maior flexibilidade, use o componente configurável (Opção 3) com as opções desejadas.

A decisão entre ter ou não uma página "Ver todos" depende principalmente:
- Da quantidade média de stories que as empresas terão
- Do espaço disponível na interface
- Da preferência por uma experiência mais simples ou mais completa 