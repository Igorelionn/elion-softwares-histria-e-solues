/**
 * ============================================================================
 * EXEMPLO: Página de Perfil com RPC (Opção 1)
 * ============================================================================
 * Este arquivo mostra como integrar as funções RPC na página de perfil
 * para sincronizar dados com o banco de forma eficiente.
 * 
 * ESTRATÉGIA:
 * 1. Mostrar dados do user_metadata imediatamente (instantâneo)
 * 2. Buscar dados do banco em background via RPC (sem bloquear UI)
 * 3. Atualizar interface se dados do banco forem diferentes
 * 
 * VANTAGENS:
 * - Interface sempre responsiva
 * - Dados sempre disponíveis (fallback para user_metadata)
 * - Sincronização automática sem timeouts
 * ============================================================================
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  getProfileWithTimeout, 
  updateProfileWithTimeout,
  checkRPCAvailability 
} from '@/lib/profile-rpc'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Flag para logs
const DEBUG = true

export default function PerfilPageWithRPC() {
  const router = useRouter()
  const isLoadingRef = useRef(false)

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rpcAvailable, setRpcAvailable] = useState<boolean | null>(null)

  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [dataSource, setDataSource] = useState<'metadata' | 'database' | 'cache'>('metadata')

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  useEffect(() => {
    let isSubscribed = true

    const initialize = async () => {
      // Evitar carregamentos duplicados
      if (isLoadingRef.current) {
        if (DEBUG) console.log('[PERFIL-RPC] Carregamento já em andamento, ignorando')
        return
      }

      isLoadingRef.current = true

      try {
        // 1. Verificar se RPCs estão disponíveis
        const available = await checkRPCAvailability()
        if (isSubscribed) {
          setRpcAvailable(available)
          if (DEBUG) console.log('[PERFIL-RPC] RPCs disponíveis:', available)
        }

        // 2. Obter sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          if (DEBUG) console.error('[PERFIL-RPC] Erro ao obter sessão:', sessionError)
          router.push('/login')
          return
        }

        if (!isSubscribed) return

        // 3. Carregar perfil
        await loadProfile(session, available)

      } catch (err) {
        console.error('[PERFIL-RPC] Erro na inicialização:', err)
        if (isSubscribed) {
          setError('Erro ao carregar perfil')
          setLoading(false)
        }
      } finally {
        isLoadingRef.current = false
      }
    }

    initialize()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (DEBUG) console.log('[PERFIL-RPC] Auth event:', event)
        
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'SIGNED_IN' && session) {
          const available = rpcAvailable ?? await checkRPCAvailability()
          await loadProfile(session, available)
        }
      }
    )

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================================
  // CARREGAR PERFIL - ESTRATÉGIA HÍBRIDA
  // ============================================================================

  const loadProfile = async (session: any, rpcAvailable: boolean) => {
    const startTime = Date.now()
    
    try {
      setUser(session.user)

      // FASE 1: Carregar dados básicos imediatamente (0ms)
      // ----------------------------------------------------------------
      if (DEBUG) console.log('[PERFIL-RPC] FASE 1: Carregando user_metadata...')
      
      const metadata = session.user.user_metadata || {}
      const identities = session.user.identities || []
      const hasGoogleIdentity = identities.some((id: any) => id.provider === 'google')
      const googleAvatarUrl = hasGoogleIdentity ? metadata.avatar_url : null

      // Mostrar dados básicos imediatamente
      setFullName(metadata.full_name || session.user.email || '')
      setCompany(metadata.company || '')
      setAvatarUrl(googleAvatarUrl || metadata.avatar_url || '')
      setIsAdmin(metadata.role === 'admin')
      setDataSource('metadata')
      setLoading(false) // UI desbloqueada!
      
      const phase1Time = Date.now() - startTime
      if (DEBUG) console.log(`[PERFIL-RPC] ✅ FASE 1 completa em ${phase1Time}ms`)

      // FASE 2: Buscar dados do banco em background (se RPC disponível)
      // ----------------------------------------------------------------
      if (!rpcAvailable) {
        if (DEBUG) console.log('[PERFIL-RPC] RPCs não disponíveis, usando apenas metadata')
        return
      }

      if (DEBUG) console.log('[PERFIL-RPC] FASE 2: Buscando do banco via RPC...')
      
      try {
        const profile = await getProfileWithTimeout(3000) // 3 segundos
        
        if (profile) {
          const phase2Time = Date.now() - startTime
          if (DEBUG) console.log(`[PERFIL-RPC] ✅ FASE 2 completa em ${phase2Time}ms`)
          
          // Atualizar apenas se dados forem diferentes
          const nameChanged = profile.full_name !== fullName
          const companyChanged = profile.company !== company
          const avatarChanged = profile.avatar_url !== avatarUrl
          const roleChanged = (profile.role === 'admin') !== isAdmin

          if (nameChanged || companyChanged || avatarChanged || roleChanged) {
            if (DEBUG) console.log('[PERFIL-RPC] Atualizando interface com dados do banco')
            
            setFullName(profile.full_name || '')
            setCompany(profile.company || '')
            setAvatarUrl(googleAvatarUrl || profile.avatar_url || '')
            setIsAdmin(profile.role === 'admin')
            setDataSource('database')
          } else {
            if (DEBUG) console.log('[PERFIL-RPC] Dados já estão sincronizados')
          }
        } else {
          if (DEBUG) console.log('[PERFIL-RPC] Nenhum perfil retornado do banco')
        }
      } catch (err: any) {
        // Erro é silencioso - já temos dados do metadata
        if (DEBUG) console.warn('[PERFIL-RPC] Erro ao buscar do banco (usando metadata):', err)
      }

    } catch (err) {
      console.error('[PERFIL-RPC] Erro ao carregar perfil:', err)
      setError('Erro ao carregar perfil')
    }
  }

  // ============================================================================
  // SALVAR PERFIL - COM RPC
  // ============================================================================

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (DEBUG) console.log('[PERFIL-RPC] Salvando perfil via RPC...')

      // Tentar salvar via RPC se disponível
      if (rpcAvailable) {
        const updated = await updateProfileWithTimeout({
          full_name: fullName,
          company: company,
          avatar_url: avatarUrl
        }, 5000) // 5 segundos

        if (updated) {
          if (DEBUG) console.log('[PERFIL-RPC] ✅ Perfil salvo via RPC')
          setDataSource('database')
          setSuccess('Perfil atualizado com sucesso!')
        } else {
          throw new Error('Falha ao atualizar perfil via RPC')
        }
      } else {
        // Fallback: Atualizar user_metadata
        if (DEBUG) console.log('[PERFIL-RPC] RPCs indisponíveis, atualizando user_metadata...')
        
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            company: company,
            avatar_url: avatarUrl
          }
        })

        if (updateError) throw updateError
        
        setDataSource('metadata')
        setSuccess('Perfil atualizado (somente cache)')
      }

    } catch (err: any) {
      console.error('[PERFIL-RPC] Erro ao salvar:', err)
      setError(err.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

        {/* Status de Sincronização */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Status da Sincronização</p>
              <p className="text-xs text-gray-500 mt-1">
                {dataSource === 'database' && '✅ Sincronizado com banco de dados'}
                {dataSource === 'metadata' && '⚡ Dados do cache (rápido)'}
                {dataSource === 'cache' && '💾 Dados em cache local'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {rpcAvailable === true && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  RPC Ativo
                </span>
              )}
              {rpcAvailable === false && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  Apenas Cache
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
          </div>

          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>

          {isAdmin && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-700">👑 Você é Administrador</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
            >
              Voltar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

