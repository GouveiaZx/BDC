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
 * Formata um número de telefone para WhatsApp (wa.me)
 * Adiciona automaticamente o código do país (+55) se necessário
 * @param phone número de telefone com ou sem formatação
 * @returns número formatado para WhatsApp (ex: 5599912345678)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começar com +55, remover o + 
  if (phone.includes('+55')) {
    cleaned = cleaned.replace(/^55/, '');
  }
  
  // Se não começar com 55 (código do Brasil)
  if (!cleaned.startsWith('55')) {
    // Se tem 11 dígitos (celular com DDD) ou 10 dígitos (fixo com DDD)
    if (cleaned.length === 11 || cleaned.length === 10) {
      cleaned = '55' + cleaned;
    }
    // Se tem 9 dígitos (celular sem DDD), assumir DDD padrão da região
    else if (cleaned.length === 9) {
      cleaned = '5598' + cleaned; // DDD 98 (Maranhão)
    }
    // Se tem 8 dígitos (fixo sem DDD), assumir DDD padrão da região  
    else if (cleaned.length === 8) {
      cleaned = '5598' + cleaned; // DDD 98 (Maranhão)
    }
  }
  
  // Validar formato final
  if (cleaned.length >= 12 && cleaned.length <= 13) {
    console.log(`📱 WhatsApp formatado: ${phone} → ${cleaned}`);
    return cleaned;
  }
  
  console.warn(`⚠️ Número de telefone inválido para WhatsApp: ${phone} → ${cleaned}`);
  return cleaned; // Retorna mesmo se inválido para tentar funcionar
};

/**
 * Cria uma URL completa do WhatsApp com número e mensagem
 * @param phone número de telefone
 * @param message mensagem opcional
 * @returns URL completa do WhatsApp
 */
export const createWhatsAppUrl = (phone: string, message?: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  let url = `https://wa.me/${formattedPhone}`;
  
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  console.log(`🔗 URL WhatsApp criada: ${url}`);
  return url;
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