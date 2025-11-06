/**
 * Sistema de Retry com Exponential Backoff
 * 
 * Permite retentar operações assíncronas que falharam, com atraso
 * exponencial entre tentativas para evitar sobrecarga
 */

import { logger } from './logger'

export interface RetryOptions {
  /**
   * Número máximo de tentativas (incluindo a primeira)
   * @default 3
   */
  maxAttempts?: number
  
  /**
   * Delay inicial em milissegundos
   * @default 1000
   */
  initialDelay?: number
  
  /**
   * Delay máximo em milissegundos (limita o crescimento exponencial)
   * @default 10000
   */
  maxDelay?: number
  
  /**
   * Fator de multiplicação para o delay (exponencial)
   * @default 2
   */
  backoffFactor?: number
  
  /**
   * Callback chamado antes de cada retry
   */
  onRetry?: (attempt: number, error: any) => void
  
  /**
   * Nome do módulo para logging
   * @default 'RETRY'
   */
  moduleName?: string
  
  /**
   * Função para determinar se deve retentar baseado no erro
   * Retorne true para retentar, false para falhar imediatamente
   */
  shouldRetry?: (error: any) => boolean
}

const defaultOptions: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  moduleName: 'RETRY',
}

/**
 * Calcula o delay para a próxima tentativa usando exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const delay = initialDelay * Math.pow(backoffFactor, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Aguarda um período de tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Executa uma função com retry automático em caso de falha
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   },
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 2000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Tentativa ${attempt} falhou:`, error)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  const { maxAttempts, initialDelay, maxDelay, backoffFactor, moduleName } = opts
  
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(moduleName, `Tentativa ${attempt}/${maxAttempts}`)
      
      const result = await fn()
      
      if (attempt > 1) {
        logger.success(moduleName, `Sucesso após ${attempt} tentativas`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      
      // Verificar se deve retentar
      if (opts.shouldRetry && !opts.shouldRetry(error)) {
        logger.warn(moduleName, 'Erro não retentável, abortando', error)
        throw error
      }
      
      // Se foi a última tentativa, lançar erro
      if (attempt === maxAttempts) {
        logger.error(
          moduleName,
          `Falhou após ${maxAttempts} tentativas`,
          error
        )
        break
      }
      
      // Calcular delay para próxima tentativa
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor)
      
      logger.warn(
        moduleName,
        `Tentativa ${attempt} falhou, retentando em ${delay}ms`,
        error
      )
      
      // Callback antes do retry
      if (opts.onRetry) {
        opts.onRetry(attempt, error)
      }
      
      // Aguardar antes da próxima tentativa
      await sleep(delay)
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError
}

/**
 * Cria uma versão "retryable" de uma função assíncrona
 * Útil para reutilizar a mesma lógica de retry em múltiplos lugares
 * 
 * @example
 * ```typescript
 * const fetchUserWithRetry = makeRetryable(
 *   async (userId: string) => {
 *     const response = await fetch(`/api/users/${userId}`)
 *     return response.json()
 *   },
 *   { maxAttempts: 3 }
 * )
 * 
 * const user = await fetchUserWithRetry('user-123')
 * ```
 */
export function makeRetryable<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options)
  }
}

/**
 * Funções de utilidade para determinar se erros devem ser retentados
 */
export const retryChecks = {
  /**
   * Retenta apenas erros de rede
   */
  networkOnly: (error: any): boolean => {
    return (
      error?.name === 'NetworkError' ||
      error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('timeout')
    )
  },
  
  /**
   * Retenta erros de timeout
   */
  timeoutOnly: (error: any): boolean => {
    return (
      error?.name === 'TimeoutError' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('timed out')
    )
  },
  
  /**
   * Retenta códigos HTTP 5xx (erros de servidor)
   */
  serverErrorsOnly: (error: any): boolean => {
    const status = error?.status || error?.response?.status
    return status >= 500 && status < 600
  },
  
  /**
   * Retenta erros 5xx e timeouts
   */
  serverErrorsAndTimeouts: (error: any): boolean => {
    return retryChecks.serverErrorsOnly(error) || retryChecks.timeoutOnly(error)
  },
  
  /**
   * Não retenta erros de cliente (4xx)
   */
  notClientErrors: (error: any): boolean => {
    const status = error?.status || error?.response?.status
    return !status || status < 400 || status >= 500
  },
}

