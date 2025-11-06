/**
 * Sistema de Logger Centralizado
 * 
 * Fornece logging padronizado e estruturado para toda a aplicação
 * com suporte a diferentes níveis e formatação consistente
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG'

interface LogConfig {
  enabled: boolean
  modules: Set<string> | 'all'
  minLevel: LogLevel
  enableTimestamps: boolean
}

const levelPriority: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
}

const levelEmojis: Record<LogLevel, string> = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARN: '⚠️',
  ERROR: '❌',
}

// Configuração global do logger
let config: LogConfig = {
  enabled: true,
  modules: 'all', // Ou Set<string> para filtrar módulos específicos
  minLevel: 'DEBUG',
  enableTimestamps: true,
}

/**
 * Configura o comportamento global do logger
 */
export function configureLogger(newConfig: Partial<LogConfig>) {
  config = { ...config, ...newConfig }
}

/**
 * Verifica se um log deve ser exibido baseado na configuração
 */
function shouldLog(module: string, level: LogLevel): boolean {
  if (!config.enabled) return false
  
  // Verificar se o módulo está habilitado
  if (config.modules !== 'all' && !config.modules.has(module)) {
    return false
  }
  
  // Verificar nível mínimo
  if (levelPriority[level] < levelPriority[config.minLevel]) {
    return false
  }
  
  return true
}

/**
 * Formata a mensagem de log
 */
function formatMessage(
  module: string,
  level: LogLevel,
  message: string,
  data?: any
): string {
  const emoji = levelEmojis[level]
  const timestamp = config.enableTimestamps 
    ? ` - ${new Date().toISOString()}` 
    : ''
  
  let formatted = `[${module}] ${emoji} ${message}${timestamp}`
  
  return formatted
}

/**
 * Função base de logging
 */
function log(
  module: string,
  level: LogLevel,
  message: string,
  data?: any
) {
  if (!shouldLog(module, level)) return
  
  const formatted = formatMessage(module, level, message, data)
  
  // Escolher função de console apropriada
  switch (level) {
    case 'ERROR':
      console.error(formatted, data !== undefined ? data : '')
      break
    case 'WARN':
      console.warn(formatted, data !== undefined ? data : '')
      break
    case 'SUCCESS':
    case 'INFO':
    case 'DEBUG':
    default:
      console.log(formatted, data !== undefined ? data : '')
      break
  }
}

/**
 * API pública do logger
 */
export const logger = {
  /**
   * Log de informação geral
   */
  info: (module: string, message: string, data?: any) => {
    log(module, 'INFO', message, data)
  },
  
  /**
   * Log de aviso (não é erro, mas requer atenção)
   */
  warn: (module: string, message: string, data?: any) => {
    log(module, 'WARN', message, data)
  },
  
  /**
   * Log de erro
   */
  error: (module: string, message: string, error?: any) => {
    log(module, 'ERROR', message, error)
    
    // Aqui você pode integrar com serviços externos de erro
    // como Sentry, LogRocket, etc.
    // sendToErrorTracking(module, message, error)
  },
  
  /**
   * Log de sucesso (operação concluída com êxito)
   */
  success: (module: string, message: string, data?: any) => {
    log(module, 'SUCCESS', message, data)
  },
  
  /**
   * Log de debug (detalhes técnicos para desenvolvimento)
   */
  debug: (module: string, message: string, data?: any) => {
    log(module, 'DEBUG', message, data)
  },
  
  /**
   * Agrupa logs relacionados (útil para rastrear fluxos)
   */
  group: (module: string, title: string, callback: () => void) => {
    if (!shouldLog(module, 'DEBUG')) return
    
    console.group(`[${module}] ${title}`)
    try {
      callback()
    } finally {
      console.groupEnd()
    }
  },
  
  /**
   * Mede tempo de execução de uma operação
   */
  time: (module: string, label: string) => {
    if (!shouldLog(module, 'DEBUG')) return
    console.time(`[${module}] ${label}`)
  },
  
  timeEnd: (module: string, label: string) => {
    if (!shouldLog(module, 'DEBUG')) return
    console.timeEnd(`[${module}] ${label}`)
  },
}

/**
 * Helper para criar um logger específico de módulo
 * Evita repetir o nome do módulo em cada chamada
 */
export function createModuleLogger(moduleName: string) {
  return {
    info: (message: string, data?: any) => logger.info(moduleName, message, data),
    warn: (message: string, data?: any) => logger.warn(moduleName, message, data),
    error: (message: string, error?: any) => logger.error(moduleName, message, error),
    success: (message: string, data?: any) => logger.success(moduleName, message, data),
    debug: (message: string, data?: any) => logger.debug(moduleName, message, data),
    group: (title: string, callback: () => void) => logger.group(moduleName, title, callback),
    time: (label: string) => logger.time(moduleName, label),
    timeEnd: (label: string) => logger.timeEnd(moduleName, label),
  }
}

// Exemplo de uso:
// const log = createModuleLogger('AUTH')
// log.info('Usuário autenticado')
// log.error('Falha ao fazer login', error)

