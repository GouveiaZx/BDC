/**
 * Utilitários seguros para localStorage com tratamento de erros
 */

// Tamanho máximo para armazenamento (em bytes)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (deixando margem de segurança)

// Prefixo para chaves do BDC
const BDC_PREFIX = 'bdc_';

/**
 * Verifica se localStorage está disponível
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__storage_test__';
    window.localStorage.setItem(test, 'test');
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calcula o tamanho usado no localStorage
 */
export function getStorageSize(): number {
  if (!isStorageAvailable()) return 0;
  
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return total;
}

/**
 * Limpa dados antigos do BDC no localStorage
 */
export function cleanOldBDCData(): void {
  if (!isStorageAvailable()) return;
  
  try {
    const keysToRemove: string[] = [];
    
    // Procurar chaves do BDC para remover
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(BDC_PREFIX) || key.includes('user') || key.includes('avatar'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remover chaves encontradas
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🧹 Limpeza localStorage: ${keysToRemove.length} itens removidos`);
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
}

/**
 * Armazena dados de forma segura no localStorage
 */
export function safeSetItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  
  const fullKey = BDC_PREFIX + key;
  
  try {
    // Verificar se há espaço suficiente
    const currentSize = getStorageSize();
    const itemSize = fullKey.length + value.length;
    
    if (currentSize + itemSize > MAX_STORAGE_SIZE) {
      console.warn('localStorage quase cheio, limpando dados antigos...');
      cleanOldBDCData();
      
      // Verificar novamente após limpeza
      const newSize = getStorageSize();
      if (newSize + itemSize > MAX_STORAGE_SIZE) {
        console.error('Não há espaço suficiente no localStorage');
        return false;
      }
    }
    
    localStorage.setItem(fullKey, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Quota do localStorage excedida, tentando limpeza...');
      cleanOldBDCData();
      
      try {
        localStorage.setItem(fullKey, value);
        return true;
      } catch (secondError) {
        console.error('Falha ao armazenar após limpeza:', secondError);
        return false;
      }
    }
    
    console.error('Erro ao armazenar no localStorage:', error);
    return false;
  }
}

/**
 * Recupera dados do localStorage
 */
export function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(BDC_PREFIX + key);
  } catch (error) {
    console.error('Erro ao recuperar do localStorage:', error);
    return null;
  }
}

/**
 * Remove item do localStorage
 */
export function safeRemoveItem(key: string): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.removeItem(BDC_PREFIX + key);
  } catch (error) {
    console.error('Erro ao remover do localStorage:', error);
  }
}

/**
 * Armazena URL de avatar de forma otimizada
 */
export function setAvatarUrl(url: string): boolean {
  if (!url || url.length > 2000) {
    console.warn('URL de avatar muito grande ou inválida');
    return false;
  }
  
  return safeSetItem('avatar_url', url);
}

/**
 * Recupera URL de avatar
 */
export function getAvatarUrl(): string | null {
  return safeGetItem('avatar_url');
}

/**
 * Armazena dados do usuário de forma segura
 */
export function setUserData(data: {
  email?: string;
  name?: string;
  isLoggedIn?: boolean;
}): boolean {
  try {
    const success = [];
    
    if (data.email) {
      success.push(safeSetItem('user_email', data.email));
    }
    
    if (data.name) {
      success.push(safeSetItem('user_name', data.name));
    }
    
    if (data.isLoggedIn !== undefined) {
      success.push(safeSetItem('is_logged_in', data.isLoggedIn.toString()));
    }
    
    return success.every(Boolean);
  } catch (error) {
    console.error('Erro ao armazenar dados do usuário:', error);
    return false;
  }
}

/**
 * Recupera dados do usuário
 */
export function getUserData(): {
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
} {
  return {
    email: safeGetItem('user_email'),
    name: safeGetItem('user_name'),
    isLoggedIn: safeGetItem('is_logged_in') === 'true'
  };
}

/**
 * Limpa todos os dados do usuário
 */
export function clearUserData(): void {
  safeRemoveItem('user_email');
  safeRemoveItem('user_name');
  safeRemoveItem('is_logged_in');
  safeRemoveItem('avatar_url');
}

/**
 * Status do localStorage
 */
export function getStorageStatus(): {
  available: boolean;
  sizeUsed: number;
  maxSize: number;
  percentUsed: number;
} {
  const available = isStorageAvailable();
  const sizeUsed = available ? getStorageSize() : 0;
  const percentUsed = available ? (sizeUsed / MAX_STORAGE_SIZE) * 100 : 0;
  
  return {
    available,
    sizeUsed,
    maxSize: MAX_STORAGE_SIZE,
    percentUsed: Math.round(percentUsed * 100) / 100
  };
} 