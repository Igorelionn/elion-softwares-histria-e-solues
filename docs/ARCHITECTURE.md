# Arquitetura do Sistema - Elion Softwares

## 📋 Visão Geral

Este documento descreve a arquitetura robusta implementada para eliminar loops infinitos, timeouts e race conditions no sistema.

## 🏗️ Arquitetura de Gerenciamento de Estado

### 1. Zustand Store (Gerenciamento Global)

O sistema usa **Zustand** com middleware de persistência para gerenciar estado global de forma eficiente e type-safe.

#### Stores Principais:

- **`authStore`** (`src/stores/authStore.ts`): Gerencia autenticação
- **`profileStore`** (`src/stores/profileStore.ts`): Gerencia dados do perfil do usuário
- **`adminStore`** (`src/stores/adminStore.ts`): Gerencia dados do painel administrativo

### 2. Listener Único de Autenticação

**AuthProvider** (`src/providers/AuthProvider.tsx`):
- Registra **um único listener global** de `onAuthStateChange`
- Implementa deduplicação de eventos (ignorar duplicatas < 500ms)
- Filtra eventos desnecessários
- Gerencia visibilidade e foco da aba

**Fluxo de Autenticação:**

```
┌─────────────────────────┐
│   Supabase Auth Event   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    AuthProvider         │
│  (listener único)       │
│                         │
│  ✓ Deduplicação         │
│  ✓ Filtragem            │
│  ✓ Anti-concorrência    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│      authStore          │
│   (estado global)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Componentes React     │
│  (via hooks)            │
└─────────────────────────┘
```

## 🔒 Prevenção de Loops e Timeouts

### Mecanismos Anti-Loop

1. **Flags de Sincronização**:
   ```typescript
   syncInProgress: boolean // Previne múltiplas sincronizações
   ```

2. **Debounce de Eventos**:
   ```typescript
   lastEventTimestamp: number // Deduplica eventos < 500ms
   ```

3. **Fila de Eventos**:
   ```typescript
   eventQueue: string[] // Rastreia últimos 10 eventos
   ```

### Mecanismos Anti-Timeout

1. **Timeout Wrapper** (`src/lib/timeout.ts`):
   ```typescript
   withTimeout(promise, { timeoutMs: 15000 })
   ```

2. **Retry Automático** (`src/lib/retry.ts`):
   ```typescript
   withRetry(fn, { 
     maxAttempts: 3,
     initialDelay: 1000,
     backoffFactor: 2 
   })
   ```

3. **Timeout Adaptativo**:
   - Load operations: 15-20s
   - Save operations: 15s
   - Background updates: 3s (sem bloqueio)

## 💾 Estratégia de Cache

### Cache em Camadas

1. **Memória (Zustand)**:
   - Cache mais rápido
   - Persiste durante sessão
   - Middleware automático

2. **localStorage**:
   - Persiste entre sessões
   - Validade configurável (5-10 min)
   - Fallback quando Zustand limpo

### Fluxo de Carregamento

```
1. Verificar cache Zustand
   ↓ (se válido)
2. Exibir dados imediatamente
   ↓
3. Atualizar em background
   ↓
4. Sync com UI se mudou
```

## 🚨 Tratamento de Erros

### Logger Centralizado

Localização: `src/lib/logger.ts`

**Níveis de Log:**
- `DEBUG`: Detalhes técnicos
- `INFO`: Informações gerais
- `SUCCESS`: Operações bem-sucedidas
- `WARN`: Avisos (não bloqueantes)
- `ERROR`: Erros que requerem atenção

**Formato Padrão:**
```
[MODULO] emoji mensagem - timestamp
```

**Exemplo:**
```typescript
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('PERFIL_PAGE')

log.info('Carregando perfil', { userId })
log.error('Erro ao salvar', error)
log.success('Perfil atualizado')
```

### ErrorBoundary

Localização: `src/components/ErrorBoundary.tsx`

- Captura erros não tratados em componentes React
- Exibe UI de fallback amigável
- Loga detalhes para debugging
- Permite recuperação sem reload

## 🗄️ Otimizações no Banco de Dados

### Função RPC Segura

**`safe_update_profile`** (Migration: `supabase/migrations/20250106_robust_profile_update.sql`):

- **Lock Otimista**: Previne conflitos de concorrência
- **Lock Pessimista**: `FOR UPDATE` durante transação
- **Versionamento**: Coluna `version` para controle
- **Retorno Estruturado**: `{ success, new_version, error_message }`

**Uso:**
```typescript
const { data, error } = await supabase.rpc('safe_update_profile', {
  p_user_id: userId,
  p_full_name: fullName,
  p_company: company,
  p_avatar_url: avatarUrl,
  p_expected_version: currentVersion
})

if (data.success) {
  // Atualizar version local
  profile.version = data.new_version
} else {
  // Tratar conflito
  console.error(data.error_message)
}
```

### Índices Otimizados

```sql
-- Admin queries
CREATE INDEX idx_users_role ON users(role) WHERE role = 'admin';

-- Blocked users
CREATE INDEX idx_users_is_blocked ON users(is_blocked) WHERE is_blocked = TRUE;

-- Recent updates
CREATE INDEX idx_users_updated_at ON users(updated_at DESC);
```

## 📱 Hooks Customizados

### `useAuthState()`

```typescript
import { useAuthState } from '@/stores/authStore'

const { user, isLoading, error } = useAuthState()
```

### `useProfileStore()`

```typescript
import { useProfileStore } from '@/stores/profileStore'

const { 
  profile, 
  isLoading, 
  isSaving, 
  loadProfile, 
  updateProfile 
} = useProfileStore()
```

### `useAdminStore()`

```typescript
import { useAdminStore } from '@/stores/adminStore'

const { 
  stats, 
  users, 
  meetings,
  loadAllData 
} = useAdminStore()
```

### `useNetworkStatus()`

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const { isOnline, isOffline, wasOffline } = useNetworkStatus()

// Mostrar badge se offline
{isOffline && <span>Você está offline</span>}
```

## 🔧 Troubleshooting Comum

### Problema: "Update timeout"

**Causa**: Operação de save demorou mais que o timeout configurado.

**Solução**:
1. Verificar conexão de internet
2. Aumentar timeout em `profileStore.ts` se necessário
3. Verificar se há índices no banco

### Problema: Loading infinito

**Causa**: Flag de loading não resetada ou loop de dependências.

**Solução**:
1. Verificar se `finally` block sempre executa
2. Checar se há listeners duplicados (deve haver apenas 1 no AuthProvider)
3. Verificar dependências de `useEffect`

### Problema: Dados não atualizam após F5

**Causa**: Cache não está sendo invalidado corretamente.

**Solução**:
1. Verificar `CACHE_DURATION` nos stores
2. Forçar refresh com `loadProfile(userId, true)`
3. Limpar localStorage: `localStorage.clear()`

### Problema: "Dados foram modificados por outra operação"

**Causa**: Conflito de concorrência (optimistic lock).

**Solução**:
1. Recarregar dados mais recentes: `loadProfile(userId, true)`
2. Aplicar mudanças novamente
3. Sistema já trata automaticamente com retry

## 📊 Monitoramento

### Logs de Produção

Para habilitar logs em produção:

```typescript
import { configureLogger } from '@/lib/logger'

configureLogger({
  enabled: true,
  minLevel: 'INFO', // ou 'ERROR' para produção
  modules: 'all' // ou Set<string> para filtrar
})
```

### Métricas Importantes

Monitore:
- Tempo de carregamento de perfil
- Taxa de timeout em updates
- Frequência de retry
- Erros capturados no ErrorBoundary

## 🚀 Deploy e Migração

### Aplicar Migrações

```bash
# Via Supabase CLI
supabase db push

# Ou via Supabase Dashboard
# SQL Editor → Executar migration manualmente
```

### Verificar Aplicação

```sql
-- Verificar coluna version
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'version';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- Testar função
SELECT * FROM safe_update_profile(
  'user-id-aqui',
  'Nome Teste',
  'Empresa Teste',
  'https://avatar.url',
  0
);
```

## 🎯 Melhores Práticas

### 1. Sempre use stores para estado compartilhado

❌ **Evite:**
```typescript
const [user, setUser] = useState(null)
supabase.auth.onAuthStateChange((_, session) => {
  setUser(session?.user)
})
```

✅ **Prefira:**
```typescript
import { useAuthState } from '@/stores/authStore'
const { user } = useAuthState()
```

### 2. Use logger ao invés de console.log

❌ **Evite:**
```typescript
console.log('Carregando...')
console.error('Erro:', error)
```

✅ **Prefira:**
```typescript
import { createModuleLogger } from '@/lib/logger'
const log = createModuleLogger('MEU_COMPONENTE')

log.info('Carregando...')
log.error('Erro ao carregar', error)
```

### 3. Sempre use timeout e retry para operações de rede

❌ **Evite:**
```typescript
const { data } = await supabase.from('users').select()
```

✅ **Prefira:**
```typescript
import { withTimeout } from '@/lib/timeout'
import { withRetry } from '@/lib/retry'

const { data } = await withRetry(
  () => withTimeout(
    supabase.from('users').select(),
    { timeoutMs: 10000 }
  ),
  { maxAttempts: 3 }
)
```

### 4. Não registre múltiplos listeners

❌ **Evite:**
```typescript
// Em cada página
useEffect(() => {
  supabase.auth.onAuthStateChange(...)
}, [])
```

✅ **Prefira:**
```typescript
// Listener ÚNICO no AuthProvider (já implementado)
// Componentes apenas consomem o store
const { user } = useAuthState()
```

## 📚 Referências

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Optimistic Locking Pattern](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0  
**Autor**: Sistema Robusto Anti-Loop

