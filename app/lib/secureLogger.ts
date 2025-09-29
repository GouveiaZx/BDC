/**
 * Sistema de logs seguros para produção
 * Remove automaticamente dados sensíveis dos logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

// Lista de campos sensíveis que devem ser removidos dos logs
const SENSITIVE_FIELDS = [
  'password', 'token', 'key', 'secret', 'auth', 'authorization',
  'jwt', 'session', 'cookie', 'email', 'phone', 'cpf', 'cnpj',
  'card', 'payment', 'billing', 'credential', 'private'
];

/**
 * Remove dados sensíveis de objetos para logs seguros
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();

    // Verificar se a chave contém dados sensíveis
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      keyLower.includes(field)
    );

    if (isSensitive) {
      // Mostrar apenas informação sobre o tipo e tamanho
      if (typeof value === 'string') {
        sanitized[key] = `[REDACTED:${value.length} chars]`;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logger seguro que remove dados sensíveis automaticamente
 */
export class SecureLogger {
  private isDevelopment: boolean;
  private serviceName: string;

  constructor(serviceName = 'BDC-API') {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.serviceName = serviceName;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}]`;

    if (data) {
      const sanitizedData = sanitizeLogData(data);
      return `${prefix} ${message} ${JSON.stringify(sanitizedData)}`;
    }

    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: LogData) {
    const formattedMessage = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      // Em desenvolvimento, mostrar no console
      console[level === 'debug' ? 'log' : level](formattedMessage);
    } else {
      // Em produção, enviar para serviço de logs
      // Por enquanto, apenas logs de error no console em produção
      if (level === 'error') {
        console.error(formattedMessage);
      }
      // TODO: Integrar com serviço de logs (Datadog, LogRocket, etc.)
    }
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }

  // Helper para APIs
  apiRequest(method: string, path: string, userId?: string, data?: LogData) {
    this.info(`API ${method} ${path}`, {
      userId: userId || 'anonymous',
      ...data
    });
  }

  apiError(method: string, path: string, error: any, userId?: string) {
    this.error(`API ${method} ${path} failed`, {
      userId: userId || 'anonymous',
      error: error.message || error,
      stack: error.stack
    });
  }

  authAttempt(email: string, success: boolean, reason?: string) {
    this.info('Authentication attempt', {
      email: email ? `${email.charAt(0)}***@${email.split('@')[1]}` : 'unknown',
      success,
      reason
    });
  }

  adminAction(adminEmail: string, action: string, targetId?: string) {
    this.warn('Admin action performed', {
      admin: adminEmail ? `${adminEmail.charAt(0)}***@${adminEmail.split('@')[1]}` : 'unknown',
      action,
      targetId
    });
  }
}

// Instância global do logger
export const logger = new SecureLogger();

// Funções de conveniência para compatibilidade
export const secureLog = {
  info: (message: string, data?: LogData) => logger.info(message, data),
  warn: (message: string, data?: LogData) => logger.warn(message, data),
  error: (message: string, data?: LogData) => logger.error(message, data),
  debug: (message: string, data?: LogData) => logger.debug(message, data)
};

// Export default para facilitar imports
export default logger;