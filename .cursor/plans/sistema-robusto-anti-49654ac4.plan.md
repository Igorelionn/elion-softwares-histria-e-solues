<!-- 49654ac4-11b2-44f9-b70e-37c2db285fb8 e34d2841-c8fa-4391-81ec-1f9011dd9de9 -->
# Plano: Corrigir Loop Infinito no AdminPage (React Error #185)

## 🎯 Objetivo

Eliminar o loop infinito de re-renders no `AdminPage` causado por dependências instáveis no `useEffect`.

## 🔍 Problema Identificado

**Arquivo**: `src/app/admin/page.tsx` (linha 486)

**Código problemático**:

```typescript
useEffect(() => {
  // ... lógica de redirecionamento e carregamento
}, [isAdmin, adminLoading, adminError, dataLoaded, loadData, router])
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   6 DEPENDÊNCIAS INSTÁVEIS causando loops infinitos!
```

**Causas do loop**:

1. `loadData` - função definida no componente (nova referência a cada render)
2. `router` - pode causar loops quando usado como dependência
3. `dataLoaded` - muda dentro do useEffect, causando re-execução
4. Múltiplas dependências inter-relacionadas

## ✅ Solução

### 1. Adicionar `hasRedirectedRef` para prevenir redirecionamentos duplicados

```typescript
const hasRedirectedRef = useRef(false)
```

### 2. Adicionar `hasLoadedDataRef` para controlar carregamento de dados

```typescript
const hasLoadedDataRef = useRef(false)
```

### 3. Refatorar useEffect com dependências mínimas

**ANTES (ERRADO)**:

```typescript
}, [isAdmin, adminLoading, adminError, dataLoaded, loadData, router])
```

**DEPOIS (CORRETO)**:

```typescript
}, [isAdmin, adminLoading, adminError])
// Apenas estados primitivos que indicam QUANDO agir
// Não incluir funções (loadData, router) ou estados controlados internamente (dataLoaded)
```

### 4. Mover `loadData` para fora do useEffect ou usar useCallback com deps vazias

Tornar `loadData` estável para que não cause re-renders.

### 5. Trocar `router.push()` por `router.replace()`

Para não adicionar histórico e prevenir loops de navegação.

### 6. Adicionar logs detalhados para debug

Com emoji e contexto completo.

## 📝 Arquivos a Modificar

### `src/app/admin/page.tsx`

**Mudanças**:

- Adicionar `hasRedirectedRef` e `hasLoadedDataRef`
- Refatorar useEffect (linha 437-486)
- Remover dependências `loadData`, `router`, `dataLoaded`
- Usar flags ref ao invés de estado para controle
- Trocar `router.push()` por `router.replace()`
- Melhorar logs

## 🧪 Validação

Após correção, testar:

1. Acessar `/admin` sem estar logado → deve redirecionar SEM loops
2. Acessar `/admin` sem ser admin → deve redirecionar SEM loops  
3. Acessar `/admin` sendo admin → deve carregar página SEM loops
4. F5 múltiplos na página admin → SEM loops
5. Console NÃO deve mostrar React error #185

## 🎯 Resultado Esperado

- ✅ AdminPage estável sem loops
- ✅ Redirecionamento funciona corretamente
- ✅ Dados carregam apenas uma vez
- ✅ ZERO erro #185
- ✅ Logs claros e informativos

### To-dos

- [ ] Instalar Zustand via npm
- [ ] Criar sistema de logger centralizado (src/lib/logger.ts)
- [ ] Criar utilitários retry.ts e timeout.ts
- [ ] Criar authStore com Zustand + persist + anti-loop (src/stores/authStore.ts)
- [ ] Criar profileStore com Zustand + persist + anti-timeout (src/stores/profileStore.ts)
- [ ] Criar adminStore com Zustand + cache (src/stores/adminStore.ts)
- [ ] Criar AuthProvider com listener único e deduplicação (src/providers/AuthProvider.tsx)
- [ ] Criar ErrorBoundary global (src/components/ErrorBoundary.tsx)
- [ ] Integrar AuthProvider e ErrorBoundary no layout.tsx
- [ ] Refatorar useAuth.ts para consumir authStore (remover listeners locais)
- [ ] Refatorar perfil/page.tsx (remover listener, usar profileStore, corrigir saveSuccessful)
- [ ] Refatorar admin/page.tsx (remover listener e cache global, usar adminStore)
- [ ] Refatorar reunioes-agendadas/page.tsx (remover listener, usar authStore)
- [ ] Refatorar BlockGuard.tsx (remover listener, usar authStore)
- [ ] Criar migration SQL com função safe_update_profile e índices otimizados
- [ ] Integrar RPC safe_update_profile no profileStore
- [ ] Criar hook useNetworkStatus.ts para detectar online/offline
- [ ] Remover ou deprecar auth-session.ts e substituir todas importações
- [ ] Criar documentação ARCHITECTURE.md com fluxos e troubleshooting