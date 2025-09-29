/**
 * Utilitários para lidar com erros comuns no front-end
 */

// Expressões regulares para identificar erros que podem ser ignorados
const IGNORABLE_ERROR_PATTERNS = [
  /^Uncaught \(in promise\) Error: Could not establish connection\. Receiving end does not exist\.$/,
  /^The message port closed before a response was received\.$/,
  /^ResizeObserver loop limit exceeded$/,
  /^ResizeObserver loop completed with undelivered notifications\.$/,
  /^Chrome Web Store: Chrome Web Store installations are disabled\.$/,
  /^Extensions can't request access to chrome:\/\/$/,
  /^Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received$/,
];

/**
 * Inicializa os handlers de erro global
 * Deve ser chamado uma vez na inicialização da aplicação
 */
export function initErrorHandlers() {
  if (typeof window === 'undefined') return; // Não executar no lado do servidor

  // Handler para erros não capturados
  window.addEventListener('error', (event) => {
    if (shouldIgnoreError(event.error?.message || event.message)) {
      event.preventDefault();
      return;
    }

    // Registrar outros erros apenas no console, sem quebrar a aplicação
    console.error('Erro não capturado:', event.error || event.message);
  });

  // Handler para promessas rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || String(event.reason);
    
    if (shouldIgnoreError(errorMessage)) {
      event.preventDefault();
      return;
    }

    // Registrar outros erros apenas no console, sem quebrar a aplicação
    console.error('Promessa rejeitada não tratada:', errorMessage);
  });

  // Substituir console.error para filtrar mensagens específicas
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorString = args.join(' ');
    if (shouldIgnoreError(errorString)) {
      return; // Ignorar mensagens de erro específicas
    }
    originalConsoleError.apply(console, args);
  };
}

/**
 * Determina se um erro específico deve ser ignorado
 */
function shouldIgnoreError(errorMessage: string): boolean {
  if (!errorMessage) return false;
  
  return IGNORABLE_ERROR_PATTERNS.some((pattern) => 
    pattern.test(errorMessage)
  );
} 