# Padrões de Design - BDC Classificados

## Status: ✅ ORGANIZADO E DOCUMENTADO

**Data da Documentação**: Janeiro 2025  
**Escopo**: Sistema de design completo e padrões de estilo

---

## 🎨 Sistema de Cores

### Paleta Principal
```css
:root {
  --primary: #7ad38e;         /* Verde principal da marca */
  --primary-dark: #5baf6f;    /* Verde escuro para hover */
  --primary-light: #8CE7A4;   /* Verde claro para acentos */
  --accent: #8CE7A4;          /* Cor de acento */
  --background: #ffffff;       /* Fundo principal */
  --card-bg: #ffffff;         /* Fundo dos cards */
  --card-text: #000000;       /* Texto nos cards */
  --text-dark: #222222;       /* Texto escuro */
  --text-medium: #444444;     /* Texto médio */
  --text-light: #666666;      /* Texto claro */
}
```

### Cores de Estado
```typescript
error: '#FF5252',     // Vermelho para erros
success: '#4CAF50',   // Verde para sucesso  
warning: '#FFC107',   // Amarelo para avisos
info: '#2196F3',      // Azul para informações
```

### Cores Neutras
```typescript
lightGray: '#f5f5f5',    // Cinza claro para backgrounds
mediumGray: '#9e9e9e',   // Cinza médio para bordas
darkGray: '#616161',     // Cinza escuro para textos
```

---

## 📝 Tipografia

### Fontes Principais
```css
/* Títulos e headings */
font-family: 'Montserrat', sans-serif;
font-weights: 300, 400, 500, 600, 700, 800

/* Corpo do texto */
font-family: 'Roboto', sans-serif;
font-weights: 300, 400, 500, 700
```

### Hierarquia de Títulos
```css
h1 { 
  font-size: 2.5rem; 
  font-weight: 700; 
  letter-spacing: -0.02em; 
}
h2 { 
  font-size: 2rem; 
  font-weight: 600; 
}
h3 { 
  font-size: 1.5rem; 
  font-weight: 600; 
}
```

### Tamanhos de Texto
- **Corpo**: 16px (1rem)
- **Small**: 14px (0.875rem)  
- **Large**: 18px (1.125rem)
- **XL**: 20px (1.25rem)

---

## 📦 Componentes Base

### Botões

#### Botão Primário
```css
.btn-primary {
  background: linear-gradient(to right, var(--primary), var(--primary-light));
  color: #000000;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: #2d2d2d;
  color: #ffffff;
  padding: 10px 24px;
  border-radius: 8px;
}
```

#### Botão Outline
```css
.btn-outline {
  background-color: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
  padding: 8px 22px;
}
```

### Cards

#### Card Padrão
```css
.card {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}
```

#### Card Glass (Efeito Vidro)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

---

## 📐 Espaçamento e Layout

### Sistema de Espaçamento
```typescript
spacing: {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '16px',   // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
}
```

### Container Principal
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
```

### Breakpoints Responsivos
```typescript
breakpoints: {
  xs: '320px',
  sm: '640px',  // Mobile large
  md: '768px',  // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Desktop large
  '2xl': '1536px', // Desktop XL
}
```

---

## 🎯 Efeitos e Animações

### Transições Padrão
```css
transition: all 0.3s ease;
```

### Animação de Fade In
```css
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Efeito Pulse
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

### Efeito Shimmer nos Botões
```css
.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.7s ease;
}

.btn:hover::before {
  left: 100%;
}
```

---

## 🌈 Gradientes e Backgrounds

### Gradient Principal
```css
background: linear-gradient(to right, var(--primary), var(--primary-light));
```

### Background com Radial Gradient
```css
body::before {
  background: radial-gradient(circle at 15% 50%, rgba(122, 211, 142, 0.08) 0%, transparent 25%),
              radial-gradient(circle at 85% 30%, rgba(122, 211, 142, 0.05) 0%, transparent 30%);
}
```

### Banner Gradient
```css
.banner-gradient {
  background: linear-gradient(135deg, 
    rgba(122, 211, 142, 0.1) 0%, 
    rgba(140, 231, 164, 0.05) 100%);
}
```

---

## 🎪 Componentes Específicos

### Stories/Destaques
```css
.highlight-stories {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 16px 0;
  scrollbar-width: none;
}

.story-item {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.story-item:hover {
  transform: scale(1.05);
}
```

### Seção com Título Decorado
```css
.section-title {
  position: relative;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  border-radius: 3px;
}
```

---

## 📱 Padrões Responsivos

### Mobile First
Sempre desenvolver para mobile primeiro, depois expandir para desktop.

### Adaptações Mobile
```css
@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }
  
  .btn {
    font-size: 0.9rem;
  }
  
  h1 {
    font-size: 2rem;
  }
}
```

### Grid Responsivo
```css
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

---

## 🎨 Padrões de Uso

### Hierarquia Visual
1. **Primary**: Ações principais (CTAs, botões de destaque)
2. **Secondary**: Ações secundárias (navegação, links)
3. **Accent**: Destaques pontuais (badges, indicators)

### Uso de Cores
- **Verde Primary**: CTAs, links importantes, elementos interativos
- **Preto**: Títulos principais, texto importante
- **Cinza Médio**: Texto secundário, descrições
- **Cinza Claro**: Backgrounds, separadores

### Espaçamento Consistente
- **Pequeno** (8px): Entre elementos relacionados
- **Médio** (16px): Entre seções de um componente
- **Grande** (24px+): Entre componentes diferentes

---

## 🔍 Checklist de Boas Práticas

### ✅ Acessibilidade
- [ ] Contraste mínimo 4.5:1 para texto normal
- [ ] Contraste mínimo 3:1 para texto grande
- [ ] Foco visível em elementos interativos
- [ ] Alt text em todas as imagens

### ✅ Performance
- [ ] Fontes carregadas com `font-display: swap`
- [ ] CSS crítico inline quando necessário
- [ ] Animações usando `transform` e `opacity`
- [ ] Lazy loading para imagens

### ✅ Manutenibilidade
- [ ] Variáveis CSS para cores e espaçamentos
- [ ] Classes utilitárias do Tailwind quando possível
- [ ] Comentários em CSS complexo
- [ ] Evitar `!important` (apenas 2 usos controlados)

---

## 📊 Análise de Conflitos

### ✅ Status Atual: LIMPO
- **0 conflitos críticos** identificados
- **2 usos controlados** de `!important` (apenas para fix de Tailwind)
- **Estrutura modular** com CSS bem organizado
- **Sem estilos inline** problemáticos

### Melhorias Implementadas
1. ✅ Centralização de variáveis CSS
2. ✅ Sistema de design consistente
3. ✅ Responsividade mobile-first
4. ✅ Animações performáticas
5. ✅ Acessibilidade básica

---

## 🚀 Próximas Melhorias

### Fase 1: Otimizações
- [ ] Implementar design tokens mais robustos
- [ ] Criar biblioteca de componentes Storybook
- [ ] Adicionar dark mode

### Fase 2: Advanced
- [ ] Sistema de theming dinâmico
- [ ] Micro-interações avançadas
- [ ] Otimização para PWA

---

## 📁 Estrutura de Arquivos de Estilo

```
app/styles/
├── globals.css          # Estilos globais e reset
├── theme.ts            # Configurações do tema
└── PADROES_DESIGN.md   # Esta documentação

Componentes com estilos:
├── Tailwind classes    # Utilitários (preferido)
├── CSS modules         # Estilos específicos (quando necessário)
└── CSS-in-JS          # Estilos dinâmicos (raramente)
```

---

> **Importante**: Este sistema de design deve ser seguido em todos os novos componentes e funcionalidades. Qualquer adição deve ser documentada e revisada para manter a consistência. 