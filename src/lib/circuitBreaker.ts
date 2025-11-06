/**
 * Circuit Breaker Pattern
 * Previne cascata de falhas ao detectar serviços que estão falhando
 * 
 * Estados:
 * - CLOSED: Normal, todas as requisições passam
 * - OPEN: Serviço falhando, bloqueia requisições
 * - HALF_OPEN: Teste se serviço voltou, permite algumas requisições
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold: number // Número de falhas antes de abrir
  successThreshold: number // Número de sucessos para fechar novamente
  timeout: number // Tempo em ms antes de tentar HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private lastFailTime = 0
  private config: CircuitBreakerConfig

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      successThreshold: config?.successThreshold || 2,
      timeout: config?.timeout || 60000, // 1 minuto
    }
  }

  /**
   * Executa função protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se está OPEN, verificar se pode tentar HALF_OPEN
    if (this.state === 'OPEN') {
      const now = Date.now()
      if (now - this.lastFailTime > this.config.timeout) {
        console.log('[CircuitBreaker] Tentando HALF_OPEN após timeout')
        this.state = 'HALF_OPEN'
        this.successes = 0
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0

    if (this.state === 'HALF_OPEN') {
      this.successes++
      console.log(`[CircuitBreaker] Sucesso em HALF_OPEN (${this.successes}/${this.config.successThreshold})`)

      if (this.successes >= this.config.successThreshold) {
        console.log('[CircuitBreaker] Fechando circuito - serviço recuperado')
        this.state = 'CLOSED'
        this.successes = 0
      }
    }
  }

  private onFailure() {
    this.failures++
    this.lastFailTime = Date.now()

    console.log(`[CircuitBreaker] Falha detectada (${this.failures}/${this.config.failureThreshold})`)

    if (this.state === 'HALF_OPEN') {
      console.log('[CircuitBreaker] Falhou em HALF_OPEN, voltando para OPEN')
      this.state = 'OPEN'
      this.successes = 0
    } else if (this.failures >= this.config.failureThreshold) {
      console.log('[CircuitBreaker] Abrindo circuito - serviço não disponível')
      this.state = 'OPEN'
    }
  }

  /**
   * Retorna estado atual do circuit breaker
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Reseta o circuit breaker para estado CLOSED
   */
  reset() {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
    this.lastFailTime = 0
    console.log('[CircuitBreaker] Reset manual - voltando para CLOSED')
  }
}

// Instâncias globais para diferentes serviços
export const supabaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minuto
})

export const uploadCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 segundos
})

/**
 * Helper para usar circuit breaker com Supabase queries
 */
export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  breaker: CircuitBreaker = supabaseCircuitBreaker
): Promise<T> {
  return breaker.execute(fn)
}

