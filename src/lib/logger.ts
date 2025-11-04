/**
 * SISTEMA DE LOGGING SEGURO
 * 
 * Remove automaticamente logs em produção para evitar vazamento de dados sensíveis
 * Em desenvolvimento, mantém logs para debugging
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Logger seguro que só exibe logs em desenvolvimento
 */
export const logger = {
  /**
   * Log informativo (apenas em desenvolvimento)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log de erro (sempre exibe, mas sanitizado em produção)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    } else {
      // Em produção, log apenas mensagens genéricas sem dados sensíveis
      console.error('Erro na aplicação. Verifique os logs do servidor.')
    }
  },

  /**
   * Log de aviso (apenas em desenvolvimento)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log de informação (apenas em desenvolvimento)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log de sucesso com emoji (apenas em desenvolvimento)
   */
  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', message, ...args)
    }
  },

  /**
   * Log de aviso com emoji (apenas em desenvolvimento)
   */
  warning: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn('⚠️', message, ...args)
    }
  }
}

/**
 * Sanitiza dados sensíveis antes de log (se necessário)
 */
export function sanitizeForLog<T>(data: T, sensitiveKeys: string[] = ['password', 'token', 'secret', 'key']): T {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data } as any

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key], sensitiveKeys)
    }
  }

  return sanitized
}

