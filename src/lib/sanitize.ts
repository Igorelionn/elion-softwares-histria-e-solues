/**
 * UTILITÁRIOS DE SANITIZAÇÃO
 * 
 * Protege contra ataques XSS removendo código malicioso de inputs
 */

/**
 * Remove todas as tags HTML de uma string
 * Protege contra XSS básico
 */
export function sanitizeHTML(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitiza input removendo caracteres especiais perigosos
 * Mantém apenas caracteres alfanuméricos e pontuação básica
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // Remove tags HTML
  let sanitized = sanitizeHTML(input)
  
  // Remove scripts e event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  return sanitized.trim()
}

/**
 * Sanitiza email removendo caracteres inválidos
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  
  // Remove espaços e converte para minúsculo
  let sanitized = email.trim().toLowerCase()
  
  // Remove caracteres não permitidos em emails
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '')
  
  return sanitized
}

/**
 * Sanitiza URL verificando protocolo seguro
 */
export function sanitizeURL(url: string): string | null {
  if (!url) return null
  
  try {
    const parsedUrl = new URL(url)
    
    // Apenas permite http e https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null
    }
    
    return parsedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Sanitiza número de telefone mantendo apenas dígitos
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  
  // Remove tudo que não é número
  return phone.replace(/\D/g, '')
}

/**
 * Valida e sanitiza data
 */
export function sanitizeDate(dateString: string): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    
    // Verifica se é uma data válida
    if (isNaN(date.getTime())) {
      return null
    }
    
    return date.toISOString()
  } catch {
    return null
  }
}

/**
 * Sanitiza texto longo (descrições, comentários)
 * Remove HTML mas mantém quebras de linha
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (!text) return ''
  
  let sanitized = sanitizeHTML(text)
  
  // Limita o tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized.trim()
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key])
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }
  
  return sanitized
}

