'use client';

import { useEffect } from 'react';
import { cleanOldBDCData, getStorageStatus } from '../lib/storageUtils';

/**
 * Componente para inicializar o localStorage de forma segura
 * Executa limpeza automática quando necessário
 */
export default function StorageInitializer() {
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Verificar status do localStorage
        const status = getStorageStatus();
        
        if (!status.available) {
          console.warn('localStorage não está disponível');
          return;
        }
        
        console.log(`📊 localStorage: ${status.percentUsed}% usado (${(status.sizeUsed / 1024 / 1024).toFixed(2)}MB)`);
        
        // Se estiver muito cheio (>80%), fazer limpeza automática
        if (status.percentUsed > 80) {
          console.warn('localStorage muito cheio, executando limpeza automática...');
          cleanOldBDCData();
          
          // Verificar novamente após limpeza
          const newStatus = getStorageStatus();
          console.log(`✅ Limpeza concluída: ${newStatus.percentUsed}% usado`);
        }
        
        // Limpar dados específicos problemáticos
        const problematicKeys = ['userAvatarPreview', 'large_data', 'cache_'];
        let cleanedCount = 0;
        
        problematicKeys.forEach(keyPattern => {
          try {
            // Remover chaves que correspondem ao padrão
            Object.keys(localStorage).forEach(key => {
              if (key.includes(keyPattern)) {
                const size = key.length + (localStorage.getItem(key) || '').length;
                if (size > 50000) { // > 50KB
                  localStorage.removeItem(key);
                  cleanedCount++;
                  console.log(`🧹 Removido item grande: ${key}`);
                }
              }
            });
          } catch (error) {
            console.warn(`Erro ao limpar chave ${keyPattern}:`, error);
          }
        });
        
        if (cleanedCount > 0) {
          console.log(`✅ Limpeza adicional: ${cleanedCount} itens removidos`);
        }
        
      } catch (error) {
        console.error('Erro na inicialização do storage:', error);
      }
    };
    
    // Executar inicialização
    initializeStorage();
    
    // Configurar limpeza periódica (a cada 30 minutos)
    const cleanupInterval = setInterval(() => {
      const status = getStorageStatus();
      if (status.percentUsed > 90) {
        console.log('Executando limpeza periódica...');
        cleanOldBDCData();
      }
    }, 30 * 60 * 1000); // 30 minutos
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
  
  // Este componente não renderiza nada
  return null;
} 