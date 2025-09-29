import { Ad } from '../models/types';

/**
 * Helper para lidar com a expiração de anúncios na plataforma.
 * Todos os anúncios têm uma duração de 90 dias por padrão.
 */

// Constante para o número de dias de validade padrão de um anúncio
export const DEFAULT_AD_EXPIRATION_DAYS = 90;

/**
 * Calcula a data de expiração de um anúncio a partir da data de criação
 * @param createdAt Data de criação do anúncio
 * @param expirationDays Número de dias até a expiração (padrão: 90)
 * @returns Data de expiração
 */
export function calculateExpirationDate(createdAt: Date | string, expirationDays: number = DEFAULT_AD_EXPIRATION_DAYS): Date {
  const creationDate = new Date(createdAt);
  const expirationDate = new Date(creationDate);
  expirationDate.setDate(creationDate.getDate() + expirationDays);
  return expirationDate;
}

/**
 * Verifica se um anúncio está expirado
 * @param ad Objeto do anúncio ou data de expiração para verificar
 * @returns Booleano indicando se o anúncio está expirado
 */
export function isAdExpired(ad: { createdAt: Date | string, expiresAt?: Date | string } | string): boolean {
  // Caso seja apenas uma string de data
  if (typeof ad === 'string') {
    const expirationDate = new Date(ad);
    return expirationDate < new Date();
  }
  
  // Se o anúncio já tem uma data de expiração definida, usar essa
  if (ad.expiresAt) {
    const expirationDate = new Date(ad.expiresAt);
    return expirationDate < new Date();
  }

  // Caso contrário, calcular a partir da data de criação
  const expirationDate = calculateExpirationDate(ad.createdAt);
  return expirationDate < new Date();
}

/**
 * Calcula quantos dias restam até a expiração do anúncio
 * @param ad Objeto do anúncio para verificar
 * @returns Número de dias restantes (negativo se já expirado)
 */
export function getDaysUntilExpiration(ad: { createdAt: Date | string, expiresAt?: Date | string }): number {
  const today = new Date();
  
  // Se o anúncio já tem uma data de expiração definida, usar essa
  let expirationDate: Date;
  if (ad.expiresAt) {
    expirationDate = new Date(ad.expiresAt);
  } else {
    // Caso contrário, calcular a partir da data de criação
    expirationDate = calculateExpirationDate(ad.createdAt);
  }
  
  // Calcular a diferença em dias
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Renova um anúncio a partir da data atual
 * @param ad Objeto do anúncio para renovar
 * @param expirationDays Número de dias para a nova expiração (padrão: 90)
 * @returns Objeto ad atualizado com a nova data de expiração
 */
export function renewAd(ad: Ad, expirationDays: number = DEFAULT_AD_EXPIRATION_DAYS): Ad {
  const today = new Date();
  const newExpirationDate = new Date(today);
  newExpirationDate.setDate(today.getDate() + expirationDays);
  
  return {
    ...ad,
    expiresAt: newExpirationDate,
    updatedAt: today
  };
}

/**
 * Formata a quantidade de dias restantes em uma string amigável
 * @param daysRemaining Número de dias restantes
 * @returns String formatada indicando o tempo restante
 */
export function formatRemainingTime(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return 'Expirado';
  }
  
  if (daysRemaining === 0) {
    return 'Expira hoje';
  }
  
  if (daysRemaining === 1) {
    return 'Expira amanhã';
  }
  
  if (daysRemaining <= 7) {
    return `Expira em ${daysRemaining} dias`;
  }
  
  if (daysRemaining <= 30) {
    const weeks = Math.floor(daysRemaining / 7);
    return `Expira em ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  
  const months = Math.floor(daysRemaining / 30);
  return `Expira em ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/**
 * Retorna a classe CSS para exibir o status de expiração
 * @param daysRemaining Número de dias restantes
 * @returns String com as classes CSS apropriadas
 */
export function getExpirationStatusClass(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return 'bg-red-100 text-red-800'; // Expirado
  }
  
  if (daysRemaining <= 7) {
    return 'bg-yellow-100 text-yellow-800'; // Expira em breve
  }
  
  return 'bg-green-100 text-green-800'; // Tempo suficiente
} 