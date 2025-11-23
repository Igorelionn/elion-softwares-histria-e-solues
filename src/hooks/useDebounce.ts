import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores
 * Útil para inputs de busca e outras situações onde queremos aguardar o usuário parar de digitar
 *
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Valor debounced
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 *
 * useEffect(() => {
 *   // Executar busca apenas quando o usuário parar de digitar por 500ms
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Setar timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpar timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

