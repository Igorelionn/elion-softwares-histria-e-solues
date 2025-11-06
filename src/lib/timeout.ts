/**
 * Sistema de Timeout para Promises
 * 
 * Adiciona timeout a qualquer Promise para evitar espera infinita
 */

import { logger } from './logger'

export class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export interface TimeoutOptions {
  /**
   * Tempo de timeout em milissegundos
   */
  timeoutMs: number
  
  /**
   * Mensagem de erro customizada
   * @default 'Operation timed out'
   */
  errorMessage?: string
  
  /**
   * Nome do módulo para logging
   * @default 'TIMEOUT'
   */
  moduleName?: string
  
  /**
   * Se true, loga quando o timeout ocorre
   * @default true
   */
  enableLogging?: boolean
}

/**
 * Adiciona timeout a uma Promise
 * Se a Promise não resolver dentro do tempo especificado, rejeita com TimeoutError
 * 
 * @example
 * ```typescript
 * const data = await withTimeout(
 *   fetch('/api/data'),
 *   {
 *     timeoutMs: 5000,
 *     errorMessage: 'Falha ao buscar dados'
 *   }
 * )
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const {
    timeoutMs,
    errorMessage = 'Operation timed out',
    moduleName = 'TIMEOUT',
    enableLogging = true,
  } = options
  
  let timeoutId: NodeJS.Timeout | null = null
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (enableLogging) {
        logger.error(
          moduleName,
          `${errorMessage} após ${timeoutMs}ms`
        )
      }
      reject(new TimeoutError(errorMessage, timeoutMs))
    }, timeoutMs)
  })
  
  try {
    const result = await Promise.race([promise, timeoutPromise])
    return result
  } finally {
    // Limpar timeout se a promise resolver antes
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Cria uma versão com timeout de uma função assíncrona
 * 
 * @example
 * ```typescript
 * const fetchDataWithTimeout = makeTimeoutWrapper(
 *   async (url: string) => {
 *     const response = await fetch(url)
 *     return response.json()
 *   },
 *   { timeoutMs: 5000 }
 * )
 * 
 * const data = await fetchDataWithTimeout('/api/data')
 * ```
 */
export function makeTimeoutWrapper<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Omit<TimeoutOptions, 'errorMessage'> & { errorMessage?: string }
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    return withTimeout(fn(...args), {
      ...options,
      errorMessage: options.errorMessage || 'Function call timed out',
    })
  }
}

/**
 * Versão simplificada de withTimeout que aceita apenas o tempo em ms
 * 
 * @example
 * ```typescript
 * const data = await timeout(fetch('/api/data'), 5000)
 * ```
 */
export async function timeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return withTimeout(promise, {
    timeoutMs,
    errorMessage,
    enableLogging: false, // Não logar para manter compatibilidade com uso simples
  })
}

/**
 * Cria um AbortController com timeout automático
 * Útil para fetch e outras APIs que suportam AbortSignal
 * 
 * @example
 * ```typescript
 * const { signal, cleanup } = createTimeoutAbortController(5000)
 * 
 * try {
 *   const response = await fetch('/api/data', { signal })
 *   const data = await response.json()
 *   return data
 * } finally {
 *   cleanup()
 * }
 * ```
 */
export function createTimeoutAbortController(timeoutMs: number): {
  controller: AbortController
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  
  const timeoutId = setTimeout(() => {
    controller.abort(new TimeoutError('Request timed out', timeoutMs))
  }, timeoutMs)
  
  const cleanup = () => {
    clearTimeout(timeoutId)
  }
  
  return {
    controller,
    signal: controller.signal,
    cleanup,
  }
}

/**
 * Wrapper para fetch com timeout integrado
 * 
 * @example
 * ```typescript
 * const data = await fetchWithTimeout('/api/data', {
 *   timeoutMs: 5000,
 *   fetchOptions: {
 *     method: 'POST',
 *     body: JSON.stringify({ key: 'value' })
 *   }
 * })
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: {
    timeoutMs: number
    fetchOptions?: RequestInit
    moduleName?: string
  }
): Promise<Response> {
  const { timeoutMs, fetchOptions, moduleName = 'FETCH' } = options
  
  const { signal, cleanup } = createTimeoutAbortController(timeoutMs)
  
  try {
    logger.debug(moduleName, `Fetch com timeout de ${timeoutMs}ms: ${url}`)
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
    })
    
    return response
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error(moduleName, `Fetch timeout após ${timeoutMs}ms: ${url}`)
      throw new TimeoutError(`Request to ${url} timed out`, timeoutMs)
    }
    throw error
  } finally {
    cleanup()
  }
}

