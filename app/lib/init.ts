/**
 * Script de inicialização para garantir que todas as configurações necessárias sejam aplicadas
 * Este arquivo deve ser importado o mais cedo possível no carregamento da aplicação
 */

import { convertTempIdToUUID } from './utils';

// Flag para controlar se a inicialização já foi feita
let initialized = false;

// Referência para o intervalo de verificação de conexão
let connectionCheckInterval: NodeJS.Timeout | null = null;

/**
 * Função principal de inicialização
 */
export async function initialize() {
  if (initialized) return;

  // Evitar inicialização durante build de produção
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.log('Pulando inicialização durante build de produção');
    initialized = true;
    return;
  }

  console.log('Iniciando configuração da aplicação...');

  try {
    // No lado do servidor (desenvolvimento apenas)
    if (typeof window === 'undefined') {
      console.log('Inicialização do servidor em desenvolvimento');
      // Inicialização mínima no servidor
    } 
    // No lado do cliente
    else {
      // Verificar e corrigir IDs de usuário armazenados
      fixUserIds();
      
      // Verificar conexão com Supabase apenas no cliente
      await initializeClientSide();
      
      // Configurar tratamento de erros global
      setupErrorHandling();
      
      // Configurar verificação periódica de conexão
      setupPeriodicConnectionCheck();
    }

    initialized = true;
    console.log('Configuração da aplicação concluída!');
  } catch (error) {
    console.error('Erro durante inicialização:', error);
    // Continuar em modo degradado mesmo com erro
    initialized = true;
  }
}

/**
 * Inicialização específica do lado do cliente
 */
async function initializeClientSide() {
  try {
    // Importações dinâmicas para evitar problemas de build
    const { checkSupabaseConnection, diagnoseAndRecoverConnection } = await import('./supabase');
    
    // Verificar conexão com Supabase
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn('Conexão com Supabase falhou no carregamento inicial, executando diagnóstico...');
      
      const diagnosticResult = await diagnoseAndRecoverConnection();
      
      if (diagnosticResult.success) {
        console.log('Diagnóstico e recuperação de conexão bem-sucedidos!');
      } else {
        console.error('Diagnóstico de conexão falhou:', (diagnosticResult as any)?.diagnostics);
        // Marcar aplicação como offline
        localStorage.setItem('appOfflineMode', 'true');
        
        // Exibir notificação para o usuário se possível
        if ('Notification' in window) {
          try {
            if (Notification.permission === 'granted') {
              new Notification('BuscaAquiBDC', {
                body: 'Aplicativo funcionando no modo offline. Alguns recursos podem estar indisponíveis.',
                icon: '/favicon.ico'
              });
            }
          } catch (notifyError) {
            console.warn('Não foi possível exibir notificação:', notifyError);
          }
        }
      }
    } else {
      // Limpar status offline caso estava marcado anteriormente
      localStorage.removeItem('appOfflineMode');
    }
  } catch (error) {
    console.warn('Erro na inicialização do cliente:', error);
  }
}

/**
 * Configura verificação periódica de conexão
 */
function setupPeriodicConnectionCheck() {
  // Não executar se já tiver um intervalo configurado
  if (connectionCheckInterval) return;
  
  // Criar intervalo para verificar conexão a cada 30 segundos
  connectionCheckInterval = setInterval(async () => {
    const appOfflineMode = localStorage.getItem('appOfflineMode') === 'true';
    
    // Se estiver em modo offline, tentar reconectar
    if (appOfflineMode) {
      try {
        const { diagnoseAndRecoverConnection } = await import('./supabase');
        const diagnosticResult = await diagnoseAndRecoverConnection();
        
        if (diagnosticResult.success) {
          console.log('Recuperação automática de conexão bem-sucedida!');
          localStorage.removeItem('appOfflineMode');
          
          // Notificar usuário sobre recuperação de conexão
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('BuscaAquiBDC', {
              body: 'Conexão restabelecida. O aplicativo está online novamente.',
              icon: '/favicon.ico'
            });
          }
          
          // Recarregar dados críticos
          window.dispatchEvent(new CustomEvent('connection-restored'));
        }
      } catch (e) {
        console.warn('Falha ao verificar conexão periodicamente:', e);
      }
    }
  }, 30000);
}

/**
 * Verifica e corrige IDs de usuário armazenados localmente 
 */
function fixUserIds() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Verificar se o ID já é um UUID válido
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Se não for um UUID válido, tentar converter
    if (!uuidPattern.test(userId) || userId.startsWith('temp-') || userId.includes('196d18')) {
      console.log('Corrigindo formato de ID de usuário:', userId);
      const normalizedId = convertTempIdToUUID(userId);
      localStorage.setItem('userId', normalizedId);
      console.log('ID normalizado:', normalizedId);
    }
  } catch (error) {
    console.warn('Erro ao corrigir IDs de usuário:', error);
  }
}

/**
 * Configura tratamento de erros global
 */
function setupErrorHandling() {
  // Armazenar referência para o handler original
  const originalOnError = window.onerror;
  
  // Substituir pelo nosso handler mais robusto 
  window.onerror = function(message, source, lineno, colno, error) {
    // Capturar erros de conexão
    if (
      message.toString().includes('network') || 
      message.toString().includes('connection') ||
      message.toString().includes('timed out')
    ) {
      console.warn('Erro de conexão detectado:', message);
      // Aqui poderia adicionar lógica específica de tratamento de erros de rede
    }
    
    // Capturar erros relacionados a sintaxe de UUID
    if (
      message.toString().includes('uuid') ||
      message.toString().includes('operator does not exist') ||
      message.toString().includes('invalid input syntax')
    ) {
      console.warn('Erro de formato UUID detectado:', message);
      // Aqui poderia adicionar lógica específica para problemas de UUID
      
      // Verificar e corrigir IDs de usuário
      fixUserIds();
    }
    
    // Chamar o handler original se existir
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    
    // Retornar false para permitir que o erro se propague normalmente
    return false;
  };

  // Capturar erros de promessas não tratadas
  window.addEventListener('unhandledrejection', function(event) {
    console.warn('Erro de promessa não tratado:', event.reason);
    
    // Analisar o erro
    if (event.reason && typeof event.reason === 'object') {
      const error = event.reason;
      
      // Verificar se é erro de Supabase/PostgreSQL
      if (
        error.code === '22P02' || // invalid input syntax for type
        error.code === '42883'  // operator does not exist
      ) {
        console.warn('Erro de sintaxe SQL detectado:', error);
        // Aqui poderia adicionar lógica específica para problemas SQL
        
        // Verificar e corrigir IDs de usuário
        fixUserIds();
      }
    }
  });
}

// Auto-inicializar quando o arquivo é importado
initialize(); 