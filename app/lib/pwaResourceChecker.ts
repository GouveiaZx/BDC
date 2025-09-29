/**
 * PWA Resource Checker Utility
 * Verifica se todos os recursos necessários para PWA estão disponíveis
 */

export interface PWAResource {
  path: string;
  type: 'icon' | 'manifest' | 'serviceWorker' | 'image';
  required: boolean;
  exists?: boolean;
  error?: string;
}

export const PWA_RESOURCES: PWAResource[] = [
  // Service Worker
  { path: '/sw.js', type: 'serviceWorker', required: true },
  
  // Manifest
  { path: '/manifest.json', type: 'manifest', required: true },
  
  // Icons
  { path: '/icons/icon-72x72.png', type: 'icon', required: true },
  { path: '/icons/icon-96x96.png', type: 'icon', required: true },
  { path: '/icons/icon-128x128.png', type: 'icon', required: true },
  { path: '/icons/icon-144x144.png', type: 'icon', required: true },
  { path: '/icons/icon-152x152.png', type: 'icon', required: true },
  { path: '/icons/icon-192x192.png', type: 'icon', required: true },
  { path: '/icons/icon-384x384.png', type: 'icon', required: true },
  { path: '/icons/icon-512x512.png', type: 'icon', required: true },
  
  // Shortcuts icons
  { path: '/icons/shortcut-add.png', type: 'icon', required: false },
  { path: '/icons/shortcut-ads.png', type: 'icon', required: false },
  { path: '/icons/shortcut-dashboard.png', type: 'icon', required: false },
];

/**
 * Verifica se um recurso específico está disponível
 */
async function checkResource(resource: PWAResource): Promise<PWAResource> {
  try {
    const response = await fetch(resource.path, { method: 'HEAD' });
    
    return {
      ...resource,
      exists: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    return {
      ...resource,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verifica todos os recursos PWA
 */
export async function checkAllPWAResources(): Promise<PWAResource[]> {
  const checks = PWA_RESOURCES.map(resource => checkResource(resource));
  return Promise.all(checks);
}

/**
 * Verifica apenas recursos obrigatórios
 */
export async function checkRequiredPWAResources(): Promise<PWAResource[]> {
  const requiredResources = PWA_RESOURCES.filter(resource => resource.required);
  const checks = requiredResources.map(resource => checkResource(resource));
  return Promise.all(checks);
}

/**
 * Gera relatório de status dos recursos PWA
 */
export function generatePWAReport(resources: PWAResource[]): {
  total: number;
  available: number;
  missing: number;
  errors: string[];
  isValid: boolean;
} {
  const total = resources.length;
  const available = resources.filter(r => r.exists).length;
  const missing = total - available;
  const errors = resources
    .filter(r => !r.exists)
    .map(r => `${r.path}: ${r.error || 'Not found'}`);
  
  const requiredMissing = resources
    .filter(r => r.required && !r.exists)
    .length;
  
  return {
    total,
    available,
    missing,
    errors,
    isValid: requiredMissing === 0
  };
}

/**
 * Hook para usar a verificação de recursos PWA
 */
export function usePWAResourceChecker() {
  const checkResources = async () => {
    try {
      const results = await checkAllPWAResources();
      const report = generatePWAReport(results);
      
      if (!report.isValid) {
        console.warn('PWA resources missing:', report.errors);
      }
      
      return { results, report };
    } catch (error) {
      console.error('Error checking PWA resources:', error);
      return null;
    }
  };
  
  return { checkResources };
}

/**
 * Utilitário para log de recursos PWA no console
 */
export function logPWAStatus() {
  checkAllPWAResources().then(resources => {
    const report = generatePWAReport(resources);
    
    console.group('🔍 PWA Resource Check');
    console.log(`📊 Total resources: ${report.total}`);
    console.log(`✅ Available: ${report.available}`);
    console.log(`❌ Missing: ${report.missing}`);
    console.log(`🔍 PWA Valid: ${report.isValid ? '✅' : '❌'}`);
    
    if (report.errors.length > 0) {
      console.group('❌ Missing Resources:');
      report.errors.forEach(error => console.warn(error));
      console.groupEnd();
    }
    
    console.groupEnd();
  });
}