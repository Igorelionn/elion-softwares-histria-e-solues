import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { PostgrestResponse } from '@supabase/supabase-js';

interface RobustQueryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  retryDelays?: number[];
}

/**
 * Executa uma query do Supabase com retry automático e backoff exponencial
 * para eliminar timeouts causados por conexões stale ou problemas temporários.
 */
export async function robustQuery<T>(
  queryFn: () => Promise<any>,
  options: RobustQueryOptions = {}
): Promise<any> {
  const {
    maxRetries = 3,
    timeoutMs = 5000,
    retryDelays = [500, 1000, 2000], // Backoff exponencial
  } = options;

  let lastError: any = null;
  let attempt = 0;

  for (attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 [ROBUST_QUERY] Tentativa ${attempt + 1}/${maxRetries}`);
      const startTime = performance.now();

      // Executar query com timeout
      const result = await Promise.race([
        queryFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const duration = performance.now() - startTime;
      console.log(`✅ [ROBUST_QUERY] Sucesso na tentativa ${attempt + 1} (${duration.toFixed(2)}ms)`);

      return result;
    } catch (error: any) {
      lastError = error;
      const isTimeout = error?.message?.includes('Timeout');
      const isStaleConnection = error?.message?.includes('Failed to fetch') || 
                                error?.code === 'ECONNRESET' ||
                                error?.code === 'ETIMEDOUT';

      console.error(
        `⚠️ [ROBUST_QUERY] Tentativa ${attempt + 1} falhou:`,
        isTimeout ? 'TIMEOUT' : isStaleConnection ? 'STALE_CONNECTION' : error?.message || 'Unknown error'
      );

      // Se não for a última tentativa, esperar antes de tentar novamente
      if (attempt < maxRetries - 1) {
        const delay = retryDelays[attempt] || 2000;
        console.log(`⏳ [ROBUST_QUERY] Aguardando ${delay}ms antes de retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Se detectar conexão stale, tentar recriar cliente
        if (isStaleConnection) {
          console.log('🔧 [ROBUST_QUERY] Detectada conexão stale, recriando cliente...');
          // Note: O cliente será recriado automaticamente na próxima tentativa
        }
      }
    }
  }

  // Todas as tentativas falharam
  console.error(
    `❌ [ROBUST_QUERY] Todas as ${maxRetries} tentativas falharam. Último erro:`,
    lastError
  );
  throw lastError;
}

/**
 * Extrai a role do usuário a partir dos claims JWT da sessão (sem query ao banco)
 */
export function getUserRoleFromJWT(session: any): string | null {
  try {
    // Tentar user_metadata primeiro (configurado pelo admin no Supabase)
    if (session?.user?.user_metadata?.role) {
      return session.user.user_metadata.role;
    }

    // Tentar app_metadata (set pelo backend/triggers)
    if (session?.user?.app_metadata?.role) {
      return session.user.app_metadata.role;
    }

    // Tentar raw_user_meta_data
    if (session?.user?.raw_user_meta_data?.role) {
      return session.user.raw_user_meta_data.role;
    }

    return null;
  } catch (error) {
    console.error('Erro ao extrair role do JWT:', error);
    return null;
  }
}

/**
 * Verifica se o usuário é admin checando JWT primeiro, depois banco como fallback
 */
export async function checkIsAdmin(
  userId: string,
  session: any,
  supabase: any
): Promise<boolean> {
  const startTime = performance.now();

  // Tentar JWT primeiro (instantâneo)
  const roleFromJWT = getUserRoleFromJWT(session);
  if (roleFromJWT) {
    const duration = performance.now() - startTime;
    console.log(`⚡ [CHECK_ADMIN] Role encontrada no JWT: "${roleFromJWT}" (${duration.toFixed(2)}ms)`);
    return roleFromJWT === 'admin';
  }

  // Fallback: consultar banco com retry
  console.log('📥 [CHECK_ADMIN] Role não encontrada no JWT, consultando banco...');
  try {
    const result = await robustQuery(
      () =>
        supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle(),
      { maxRetries: 3, timeoutMs: 5000 }
    );

    const duration = performance.now() - startTime;
    console.log(`✅ [CHECK_ADMIN] Role obtida do banco (${duration.toFixed(2)}ms)`);

    if (result.error) {
      console.error('⚠️ [CHECK_ADMIN] Erro ao consultar banco:', result.error);
      return false;
    }

    return result.data?.role === 'admin';
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ [CHECK_ADMIN] Falha após retries (${duration.toFixed(2)}ms):`, error);
    // Em caso de erro, assumir não-admin como padrão seguro
    return false;
  }
}

