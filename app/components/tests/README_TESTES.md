# Documentação de Testes - BDC Classificados

## Estrutura de Testes

### Configuração
Os testes unitários utilizam:
- **Jest** - Framework de testes
- **React Testing Library** - Utilitários para testar componentes React
- **@testing-library/jest-dom** - Matchers customizados

### Localização dos Testes
- `app/components/tests/` - Testes unitários dos componentes

### Testes Implementados

#### AdCard.test.tsx
**Componente:** `AdCard`
**Cobertura:**
- ✅ Renderização de informações do anúncio
- ✅ Badge de destaque para anúncios featured
- ✅ Funcionalidade de favoritar
- ✅ Indicador de múltiplas imagens
- ✅ Badge de verificação do usuário
- ✅ Imagem placeholder quando não há imagens
- ✅ Cálculo de rating
- ✅ Navegação para perfil do vendedor

### Configuração de Mocks

#### Hooks Mockados
```typescript
// useWhatsAppWarning hook
jest.mock('../hooks/useWhatsAppWarning', () => ({
  // ... implementação mock
}));
```

#### Componentes Next.js Mockados
```typescript
// next/image e next/link
jest.mock('next/image', () => ({ ... }));
jest.mock('next/link', () => ({ ... }));
```

### Próximos Passos para Testes

#### Componentes Prioritários para Testes
1. **AuthForm** - Formulário de autenticação
2. **Header** - Cabeçalho principal
3. **ImageUploader** - Upload de imagens
4. **StoreBanner** - Banner da loja
5. **ReportButton** - Botão de denúncia

#### Tipos de Testes Necessários
- **Unitários** - Componentes individuais
- **Integração** - Fluxos completos
- **E2E** - Jornadas do usuário

### Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm test -- --watch

# Executar com cobertura
npm test -- --coverage

# Executar testes específicos
npm test AdCard.test.tsx
```

### Padrões de Teste

#### Estrutura de Teste
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

#### Dados de Mock
- Usar tipos TypeScript corretos
- Criar mocks representativos dos dados reais
- Manter consistência nos IDs e valores

#### Assertions
- Usar matchers semânticos (`toBeInTheDocument`, `toHaveAttribute`)
- Testar comportamento do usuário, não implementação
- Verificar acessibilidade básica

### Cobertura de Testes

#### Meta de Cobertura
- **Componentes Principais:** 80%+
- **Utils/Helpers:** 90%+  
- **Hooks:** 85%+

#### Status Atual
- **AdCard:** ✅ Implementado
- **AuthForm:** ⏳ Pendente
- **Header:** ⏳ Pendente
- **ImageUploader:** ⏳ Pendente
- **StoreBanner:** ⏳ Pendente

### Boas Práticas

1. **Teste o comportamento, não a implementação**
2. **Use queries acessíveis (getByRole, getByLabelText)**
3. **Mock apenas dependências externas**
4. **Mantenha testes independentes**
5. **Use nomes descritivos para os testes**
6. **Teste casos felizes e casos de erro**

### Integração com CI/CD

```yaml
# Exemplo para GitHub Actions
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test -- --coverage
``` 