/**
 * Formata um número para exibição como preço em reais
 * @param value número a ser formatado
 * @returns string formatada (ex: R$ 1.234,56)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data ISO para exibição amigável
 * @param dateString string de data no formato ISO
 * @returns string formatada (ex: 12 de Janeiro de 2023)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata uma data ISO para exibição curta
 * @param dateString string de data no formato ISO
 * @returns string formatada (ex: 12/01/2023)
 */
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

/**
 * Formata um número de telefone para exibição
 * @param phone número de telefone (somente dígitos)
 * @returns string formatada (ex: (11) 98765-4321)
 */
export const formatPhone = (phone: string): string => {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Verifica se é número de celular (com 9 dígitos após o DDD)
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  
  // Formato para telefone fixo
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  
  // Retorna formato original se não se encaixar nos padrões
  return phone;
};

/**
 * Trunca um texto longo e adiciona reticências
 * @param text texto a ser truncado
 * @param maxLength comprimento máximo
 * @returns texto truncado com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}; 