/**
 * Configuração centralizada de administradores
 *
 * IMPORTANTE: Em produção, mova as credenciais para variáveis de ambiente
 * e use um sistema de autenticação robusto (ex: banco de dados)
 */

// Lista de emails autorizados como administradores
export const ADMIN_EMAILS = [
  'admin@buscaaquibdc.com.br',
  'gouveiarx@gmail.com',
  'gouveiarx@hotmail.com',
  'rodrigogouveiarx@gmail.com'
] as const;

/**
 * Verifica se um email é de administrador
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase() as any);
}

/**
 * SEGURANÇA: Em produção, as credenciais devem estar no banco de dados
 * com senhas hasheadas usando bcrypt
 *
 * Este arquivo deve ser apenas para validação de emails autorizados
 */
