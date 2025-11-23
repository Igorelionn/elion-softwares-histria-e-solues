'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '@/hooks/useAdmin'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Users,
  Calendar,
  Activity,
  TrendingUp,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Shield,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Mail,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

// 🚀 SISTEMA DE CACHE OFFLINE-FIRST
const ADMIN_CACHE_KEY = 'elion_admin_cache'
const ADMIN_CACHE_TIMESTAMP_KEY = 'elion_admin_timestamp'
const CACHE_DURATION = 60000 // 1 minuto para dados de admin (mais curto devido à natureza dos dados)
const FORCE_LOGS = process.env.NODE_ENV !== 'production' // ✅ Logs apenas em desenvolvimento

let cachedAdminData: any = null
let cachedAdminTimestamp = 0

interface CachedAdminData {
  stats: Stats | null
  users: User[]
  meetings: Meeting[]
  timestamp: number
}

// 🔧 FUNÇÕES DE CACHE LOCALSTORAGE
const getLocalCache = (): CachedAdminData | null => {
  try {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY)
    const timestamp = localStorage.getItem(ADMIN_CACHE_TIMESTAMP_KEY)

    if (cached && timestamp) {
      const cacheData = JSON.parse(cached)
      const cacheTime = parseInt(timestamp)
      const now = Date.now()

      // Cache válido por 5 minutos
      if (now - cacheTime < 5 * 60 * 1000) {
        if (FORCE_LOGS) console.log('[ADMIN] ✅ Cache localStorage válido')
        return cacheData
      } else {
        // Cache expirado, limpar
        localStorage.removeItem(ADMIN_CACHE_KEY)
        localStorage.removeItem(ADMIN_CACHE_TIMESTAMP_KEY)
        if (FORCE_LOGS) console.log('[ADMIN] ⏰ Cache localStorage expirado')
      }
    }
  } catch (err) {
    console.warn('[ADMIN] ⚠️ Erro ao ler cache localStorage:', err)
  }
  return null
}

const setLocalCache = (data: CachedAdminData) => {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(ADMIN_CACHE_TIMESTAMP_KEY, Date.now().toString())
    if (FORCE_LOGS) console.log('[ADMIN] 💾 Cache localStorage salvo')
  } catch (err) {
    console.warn('[ADMIN] ⚠️ Erro ao salvar cache localStorage:', err)
  }
}

const clearLocalCache = () => {
  try {
    localStorage.removeItem(ADMIN_CACHE_KEY)
    localStorage.removeItem(ADMIN_CACHE_TIMESTAMP_KEY)
    if (FORCE_LOGS) console.log('[ADMIN] 🗑️ Cache localStorage limpo')
  } catch (err) {
    console.warn('[ADMIN] ⚠️ Erro ao limpar cache localStorage:', err)
  }
}

interface Stats {
  total_users: number
  blocked_users: number
  total_meetings: number
  pending_meetings: number
  confirmed_meetings: number
  completed_meetings: number
  cancelled_meetings: number
  users_last_30_days: number
  meetings_last_30_days: number
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_blocked: boolean
  blocked_reason?: string
  created_at: string
  avatar_url?: string
}

interface Meeting {
  id: string
  user_id: string
  email: string
  phone: string
  project_type: string
  project_description: string
  timeline: string
  budget: string
  status: string
  meeting_date: string
  created_at: string
  admin_notes?: string
  users: {
    full_name: string
    email: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  // ✅ OTIMIZADO: Debounce na busca para evitar queries a cada tecla digitada
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [meetingStatusFilter, setMeetingStatusFilter] = useState<string>('pending')
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isMeetingDetailsOpen, setIsMeetingDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked' | 'deleted'>('all')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isUnblocking, setIsUnblocking] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cacheMessage, setCacheMessage] = useState<string>('')

  // Estados do Calendário
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  // Refs para controlar loading
  const isLoadingRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadStats = useCallback(async () => {
    try {
      if (FORCE_LOGS) console.log('[ADMIN] 📊 Carregando estatísticas...')

      // OTIMIZADO: RPC com timeout de 5s
      // @ts-ignore - RPC function not in generated types
      const rpcPromise = supabase.rpc('get_admin_stats')
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('loadStats timeout após 5s')), 5000)
      )

      // @ts-ignore - RPC function not in generated types
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise])

      if (!error && data) {
        setStats(data)
        if (FORCE_LOGS) console.log('[ADMIN] ✅ Estatísticas carregadas:', data)
        return data
      }
    } catch (error) {
      console.error('[ADMIN] ❌ Erro ao carregar estatísticas:', error)
    }
    return null
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      if (FORCE_LOGS) console.log('[ADMIN] 👥 Carregando usuários...')

      // OTIMIZADO: getUser com timeout de 3s
      const userPromise = supabase.auth.getUser()
      const userTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout após 3s')), 3000)
      )

      const { data: { user } } = await Promise.race([userPromise, userTimeoutPromise])

      if (!user) {
        if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Usuário não autenticado')
        return null
      }

      // OTIMIZADO: Query profile com timeout de 3s
      // @ts-ignore - Coluna 'role' existe mas pode não estar nos tipos gerados
      const profilePromise = supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as Promise<{ data: { role: string } | null; error: any }>

      const profileTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout após 3s')), 3000)
      )

      const { data: profile } = await Promise.race([profilePromise, profileTimeoutPromise])

      if (profile?.role !== 'admin') {
        console.warn('[ADMIN] ⚠️ Usuário não é admin, redirecionando...')
        router.push('/')
        return null
      }

      // OTIMIZADO: RPC get_all_users com timeout de 5s
      // @ts-ignore - RPC function not in generated types
      const usersRpcPromise = supabase.rpc('get_all_users')
      const usersRpcTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('get_all_users timeout após 5s')), 5000)
      )

      // @ts-ignore - RPC function not in generated types
      const { data, error } = await Promise.race([usersRpcPromise, usersRpcTimeoutPromise])

      if (!error && data) {
        const usersData = data as any[]
        setUsers(usersData)
        if (FORCE_LOGS) console.log(`[ADMIN] ✅ ${usersData.length} usuários carregados`)
        return usersData
      } else if (error) {
        if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Erro no RPC, tentando fallback...')

        // OTIMIZADO: Fallback query com timeout de 5s
        const fallbackPromise = supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        const fallbackTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Users fallback timeout após 5s')), 5000)
        )

        const { data: fallbackData, error: fallbackError } = await Promise.race([
          fallbackPromise,
          fallbackTimeoutPromise
        ])

        if (!fallbackError && fallbackData) {
          // @ts-ignore - Type mismatch due to missing columns in generated types
          setUsers(fallbackData)
          if (FORCE_LOGS) console.log(`[ADMIN] ✅ ${fallbackData.length} usuários carregados (fallback)`)
          return fallbackData
        }
      }
    } catch (error) {
      console.error('[ADMIN] ❌ Erro ao carregar usuários:', error)
    }
    return null
  }, [router])

  const loadMeetings = useCallback(async () => {
    try {
      if (FORCE_LOGS) console.log('[ADMIN] 📅 Carregando reuniões...')

      // OTIMIZADO: RPC get_all_meetings com timeout de 5s
      // @ts-ignore - RPC function not in generated types
      const meetingsRpcPromise = supabase.rpc('get_all_meetings')
      const meetingsRpcTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('get_all_meetings timeout após 5s')), 5000)
      )

      // @ts-ignore - RPC function not in generated types
      const { data, error } = await Promise.race([meetingsRpcPromise, meetingsRpcTimeoutPromise])

      if (!error && data) {
        // @ts-ignore - Data type from RPC
        const transformedData = data.map((meeting: any) => ({
          ...meeting,
          users: {
            full_name: meeting.user_full_name,
            email: meeting.user_email
          }
        }))
        setMeetings(transformedData as any)
        if (FORCE_LOGS) console.log(`[ADMIN] ✅ ${transformedData.length} reuniões carregadas`)
        return transformedData
      } else if (error) {
        if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Erro no RPC, tentando fallback...')

        // OTIMIZADO: Fallback query com timeout de 5s
        const meetingsFallbackPromise = (supabase as any)
          .from('meetings')
          .select(`
            *,
            users (full_name, email)
          `)
          .order('created_at', { ascending: false })

        const meetingsFallbackTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Meetings fallback timeout após 5s')), 5000)
        )

        // @ts-ignore - Table not in generated types
        const { data: fallbackData, error: fallbackError } = await Promise.race([
          meetingsFallbackPromise,
          meetingsFallbackTimeoutPromise
        ])

        if (!fallbackError && fallbackData) {
          setMeetings(fallbackData as any)
          if (FORCE_LOGS) console.log(`[ADMIN] ✅ ${fallbackData.length} reuniões carregadas (fallback)`)
          return fallbackData
        }
      }
    } catch (error) {
      console.error('[ADMIN] ❌ Erro ao carregar reuniões:', error)
    }
    return null
  }, [])

  const loadData = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Carregamento já em andamento, ignorando')
      return
    }

    isLoadingRef.current = true
    setLoading(true)

    if (FORCE_LOGS) console.log('[ADMIN] 🚀 Iniciando carregamento de dados...', new Date().toISOString())

    // 🚀 OFFLINE-FIRST: Tentar carregar do cache primeiro
    const localCache = getLocalCache()
    const now = Date.now()

    if (FORCE_LOGS) console.log('[ADMIN] 🔍 Verificando cache:', {
      cacheExists: !!localCache,
      cacheAge: localCache ? `${Math.round((now - localCache.timestamp) / 1000)}s` : 'N/A',
      isValid: localCache ? (now - localCache.timestamp < CACHE_DURATION) : false,
      maxAge: `${CACHE_DURATION / 1000}s`
    })

    if (localCache && (now - localCache.timestamp < CACHE_DURATION)) {
      if (FORCE_LOGS) console.log('[ADMIN] ✅ Cache válido encontrado! Carregando do cache...', {
        hasStats: !!localCache.stats,
        usersCount: localCache.users?.length || 0,
        meetingsCount: localCache.meetings?.length || 0
      })

      setStats(localCache.stats)
      setUsers(localCache.users)
      setMeetings(localCache.meetings)
      setLoading(false)
      isLoadingRef.current = false

      setCacheMessage('Dados carregados do cache (podem estar ligeiramente desatualizados)')

      // Atualizar em background (não crítico)
      setTimeout(() => {
        if (FORCE_LOGS) console.log('[ADMIN] 🔄 Agendando atualização em background...')
        updateDataInBackground()
      }, 500)

      return
    } else if (localCache) {
      if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Cache expirado, será recarregado')
    } else {
      if (FORCE_LOGS) console.log('[ADMIN] ℹ️ Nenhum cache encontrado')
    }

    // ⚠️ SEM CACHE: Tentar carregar do banco com timeout
    if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Nenhum cache válido, carregando do banco...')

    // Timeout de segurança
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('[ADMIN] ⏰ Timeout de segurança atingido (10s)')
        toast.error('Carregamento está demorando. Verifique sua conexão.')
      }
    }, 10000)

    try {
      const startTime = Date.now()

      // Tentar carregar dados com timeout
      const dataPromise = Promise.all([loadStats(), loadUsers(), loadMeetings()])
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )

      const results = await Promise.race([dataPromise, timeoutPromise]) as any[]
      const [statsData, usersData, meetingsData] = results

      const loadTime = Date.now() - startTime
      if (FORCE_LOGS) console.log(`[ADMIN] ✅ Dados carregados em ${loadTime}ms`)

      // Salvar no cache com os dados recém carregados (usar state atual como fallback)
      const cacheData: CachedAdminData = {
        stats: statsData || stats,
        users: usersData || users,
        meetings: meetingsData || meetings,
        timestamp: Date.now()
      }

      cachedAdminData = cacheData
      cachedAdminTimestamp = Date.now()
      setLocalCache(cacheData)

      if (FORCE_LOGS) console.log('[ADMIN] 💾 Dados salvos no cache:', {
        stats: cacheData.stats ? '✓' : '✗',
        users: cacheData.users ? `${cacheData.users.length} usuários` : '✗',
        meetings: cacheData.meetings ? `${cacheData.meetings.length} reuniões` : '✗'
      })

      setCacheMessage('')

    } catch (error: any) {
      console.error('[ADMIN] ❌ Erro ao carregar dados:', error)

      if (error.message === 'Timeout') {
        toast.error('Tempo esgotado ao carregar dados. Tente novamente.')
        setCacheMessage('Erro: Tempo esgotado. Verifique sua conexão.')
      } else {
        toast.error('Erro ao carregar dados do servidor.')
        setCacheMessage('Erro ao carregar dados. Tente novamente.')
      }

      // Tentar usar cache expirado como fallback
      const expiredCache = getLocalCache()
      if (expiredCache) {
        if (FORCE_LOGS) console.log('[ADMIN] 💡 Usando cache expirado como fallback')
        setStats(expiredCache.stats)
        setUsers(expiredCache.users)
        setMeetings(expiredCache.meetings)
        setCacheMessage('⚠️ Mostrando dados em cache (podem estar desatualizados)')
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setLoading(false)
      isLoadingRef.current = false
      if (FORCE_LOGS) console.log('[ADMIN] 🏁 Carregamento finalizado')
    }
  }, [loadStats, loadUsers, loadMeetings]) // Removidas dependências problemáticas stats, users, meetings

  // 🔄 Função para atualizar dados em background (não bloqueia UI)
  const updateDataInBackground = async () => {
    try {
      if (FORCE_LOGS) console.log('[ADMIN] 🔄 Atualização em background iniciada')

      await Promise.all([loadStats(), loadUsers(), loadMeetings()])

      // Atualizar cache
      const cacheData: CachedAdminData = {
        stats,
        users,
        meetings,
        timestamp: Date.now()
      }

      cachedAdminData = cacheData
      cachedAdminTimestamp = Date.now()
      setLocalCache(cacheData)

      if (FORCE_LOGS) console.log('[ADMIN] ✅ Cache atualizado em background')
      setCacheMessage('')

    } catch (err) {
      if (FORCE_LOGS) console.log('[ADMIN] ⚠️ Falha na atualização em background (ignorando):', err)
    }
  }

  useEffect(() => {
    if (FORCE_LOGS) console.log('[ADMIN] 🚀 useEffect executado:', {
      adminLoading,
      isAdmin,
      dataLoaded,
      adminError,
      isLoadingRef: isLoadingRef.current
    })

    let isSubscribed = true

    // Redirecionar se não for admin ou se houve erro
    if (!adminLoading && (!isAdmin || adminError)) {
      const reason = adminError ? `Erro: ${adminError}` : 'Não é admin'
      if (FORCE_LOGS) console.log(`[ADMIN] ⚠️ Redirecionando para home - ${reason}`)

      // Pequeno delay para mostrar a mensagem antes do redirecionamento
      setTimeout(() => {
        if (!isSubscribed) return
        router.push('/')
      }, 100)

      return
    }

    // Carregar dados se for admin E ainda não carregou
    if (!adminLoading && isAdmin && !adminError && !dataLoaded && isSubscribed) {
      if (FORCE_LOGS) console.log('[ADMIN] ✅ É admin e precisa carregar dados, iniciando...')
      setDataLoaded(true)
      loadData()
    } else {
      if (FORCE_LOGS) console.log('[ADMIN] ℹ️ Pulando carregamento:', {
        motivo: adminLoading ? 'ainda carregando admin' :
               dataLoaded ? 'já carregou' :
               adminError ? `erro: ${adminError}` :
               !isAdmin ? 'não é admin' : 'outro'
      })
    }

    // Cleanup
    return () => {
      if (FORCE_LOGS) console.log('[ADMIN] 🔚 Componente desmontado, limpando refs...')
      isSubscribed = false
      isLoadingRef.current = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [isAdmin, adminLoading, adminError, dataLoaded, loadData, router])

  const logActivity = async (action: string, targetType: string, targetId: string, details: any = {}) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // @ts-ignore - Table not in generated types
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action,
      entity_type: targetType,
      entity_id: targetId,
      new_data: details
    })
  }

  const handleBlockUser = async () => {
    // Prevenir múltiplos cliques
    if (isBlocking) {
      console.log('⏳ Bloqueio já em andamento, aguarde...')
      return
    }

    if (!selectedUser) {
      console.error('❌ Nenhum usuário selecionado')
      toast.error('Nenhum usuário selecionado')
      return
    }

    setIsBlocking(true)

    // Timeout de segurança: máximo 30 segundos
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Timeout: operação demorou mais de 30s')
      toast.error('A operação demorou muito. Recarregando página...')
      setIsBlocking(false)
      window.location.reload()
    }, 30000)

    try {
      // 1. Verificar autenticação do admin atual
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('❌ Erro de autenticação:', authError)
        toast.error('Erro de autenticação')
        setIsBlocking(false)
        return
      }

      if (!currentUser) {
        console.error('❌ Usuário não autenticado')
        toast.error('Você precisa estar autenticado')
        setIsBlocking(false)
        return
      }

      // 2. Verificar se o admin tem permissões
      const { data: adminProfile, error: adminCheckError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single() as { data: { role: string } | null; error: any }

      if (adminCheckError || !adminProfile || adminProfile.role !== 'admin') {
        console.error('❌ Sem permissões de admin:', adminCheckError)
        toast.error('Você não tem permissões de administrador')
        setIsBlocking(false)
        return
      }

      // 3. Verificar se o usuário a ser bloqueado não é admin
      if (selectedUser.role === 'admin') {
        console.error('❌ Tentativa de bloquear outro admin')
        toast.error('Não é possível bloquear outros administradores')
        setIsBlocking(false)
        return
      }

      console.log('🔄 Bloqueando usuário:', {
        target_user_id: selectedUser.id,
        target_email: selectedUser.email,
        admin_id: currentUser.id
      })

      // 4. Executar bloqueio usando RPC com retry
      let blockResult = null
      let blockError = null
      let retries = 3

      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`🔄 Tentativa ${attempt} de ${retries}...`)

        // @ts-ignore - RPC function not in generated types
        const result = await (supabase as any).rpc(
          'admin_block_user',
          {
            target_user_id: selectedUser.id,
            admin_user_id: currentUser.id,
            reason: 'Bloqueado pelo administrador'
          }
        )

        blockResult = result.data
        blockError = result.error

        if (!blockError) {
          console.log(`✅ Sucesso na tentativa ${attempt}`)
          break
        }

        if (attempt < retries) {
          console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em 500ms...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (blockError) {
        console.error('❌ Erro ao bloquear após todas as tentativas:', blockError)
        toast.error(`Erro ao bloquear: ${blockError.message}`)
        setIsBlocking(false)
        return
      }

      console.log('✅ Usuário bloqueado com sucesso:', blockResult)

      // 5. Registrar atividade (sem bloquear se falhar)
      try {
        await logActivity('block_user', 'user', selectedUser.id, {
          email: selectedUser.email,
          blocked_by_email: currentUser.email
        })
      } catch (logErr) {
        console.warn('⚠️ Erro ao registrar log (não crítico):', logErr)
      }

      // 6. Feedback
      toast.success(`Usuário ${selectedUser.email} bloqueado com sucesso`)

      // 7. Fechar dialog e limpar estado
      setIsBlockDialogOpen(false)
      setSelectedUser(null)

      // 8. Recarregar dados com retry
      let reloadSuccess = false
      for (let i = 0; i < 3; i++) {
        try {
          await Promise.all([loadUsers(), loadStats()])
          reloadSuccess = true
          break
        } catch (reloadErr) {
          console.warn(`⚠️ Erro ao recarregar dados (tentativa ${i + 1})`)
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      if (reloadSuccess) {
        // Atualizar cache após reload bem-sucedido
        const cacheData: CachedAdminData = {
          stats,
          users,
          meetings,
          timestamp: Date.now()
        }
        cachedAdminData = cacheData
        cachedAdminTimestamp = Date.now()
        setLocalCache(cacheData)
      } else {
        console.warn('⚠️ Não foi possível recarregar dados, recarregando página...')
        window.location.reload()
      }

    } catch (err) {
      console.error('❌ Erro inesperado ao bloquear:', err)
      toast.error('Erro inesperado ao bloquear usuário')
    } finally {
      clearTimeout(timeoutId)
      setIsBlocking(false)
    }
  }

  const handleUnblockUser = async (user: User) => {
    // Prevenir múltiplos cliques
    if (isUnblocking === user.id) {
      console.log('⏳ Desbloqueio já em andamento, aguarde...')
      return
    }

    if (!user) {
      console.error('❌ Nenhum usuário fornecido')
      toast.error('Nenhum usuário fornecido')
      return
    }

    setIsUnblocking(user.id)

    // Timeout de segurança: máximo 30 segundos
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Timeout: operação demorou mais de 30s')
      toast.error('A operação demorou muito. Recarregando página...')
      setIsUnblocking(null)
      window.location.reload()
    }, 30000)

    try {
      // 1. Verificar autenticação do admin
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !currentUser) {
        console.error('❌ Erro de autenticação:', authError)
        toast.error('Você precisa estar autenticado')
        setIsUnblocking(null)
        return
      }

      // 2. Verificar permissões de admin
      const { data: adminProfile, error: adminCheckError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single() as { data: { role: string } | null; error: any }

      if (adminCheckError || !adminProfile || adminProfile.role !== 'admin') {
        console.error('❌ Sem permissões de admin:', adminCheckError)
        toast.error('Você não tem permissões de administrador')
        setIsUnblocking(null)
        return
      }

      console.log('🔄 Desbloqueando usuário:', {
        target_user_id: user.id,
        target_email: user.email,
        admin_id: currentUser.id
      })

      // 3. Executar desbloqueio usando RPC com retry
      let unblockResult = null
      let unblockError = null
      let retries = 3

      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`🔄 Tentativa ${attempt} de ${retries}...`)

        // @ts-ignore - RPC function not in generated types
        const result = await (supabase as any).rpc(
          'admin_unblock_user',
          {
            target_user_id: user.id,
            admin_user_id: currentUser.id
          }
        )

        unblockResult = result.data
        unblockError = result.error

        if (!unblockError) {
          console.log(`✅ Sucesso na tentativa ${attempt}`)
          break
        }

        if (attempt < retries) {
          console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em 500ms...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (unblockError) {
        console.error('❌ Erro ao desbloquear após todas as tentativas:', unblockError)
        toast.error(`Erro ao desbloquear: ${unblockError.message}`)
        setIsUnblocking(null)
        return
      }

      console.log('✅ Usuário desbloqueado com sucesso:', unblockResult)

      // 4. Registrar atividade (sem bloquear se falhar)
      try {
        await logActivity('unblock_user', 'user', user.id, {
          email: user.email,
          unblocked_by_email: currentUser.email
        })
      } catch (logErr) {
        console.warn('⚠️ Erro ao registrar log (não crítico):', logErr)
      }

      // 5. Feedback
      toast.success(`Usuário ${user.email} desbloqueado com sucesso`)

      // 6. Recarregar dados com retry
      let reloadSuccess = false
      for (let i = 0; i < 3; i++) {
        try {
          await Promise.all([loadUsers(), loadStats()])
          reloadSuccess = true
          break
        } catch (reloadErr) {
          console.warn(`⚠️ Erro ao recarregar dados (tentativa ${i + 1})`)
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      if (reloadSuccess) {
        // Atualizar cache após reload bem-sucedido
        const cacheData: CachedAdminData = {
          stats,
          users,
          meetings,
          timestamp: Date.now()
        }
        cachedAdminData = cacheData
        cachedAdminTimestamp = Date.now()
        setLocalCache(cacheData)
      } else {
        console.warn('⚠️ Não foi possível recarregar dados, recarregando página...')
        window.location.reload()
      }

    } catch (err) {
      console.error('❌ Erro inesperado ao desbloquear:', err)
      toast.error('Erro inesperado ao desbloquear usuário')
    } finally {
      clearTimeout(timeoutId)
      setIsUnblocking(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {

      // Registrar atividade ANTES de deletar (para manter histórico)
      await logActivity('delete_user', 'user', selectedUser.id, {
        email: selectedUser.email,
        name: selectedUser.full_name
      })

      // Usar a função SQL que criamos (funciona no cliente)
      // @ts-ignore - RPC function not in generated types
      const { data, error } = await (supabase as any)
        .rpc('delete_user_account', { user_id_to_delete: selectedUser.id })

            if (error) {
        console.error('❌ Erro ao deletar usuário:', error)
        toast.error(`Erro ao excluir usuário: ${error.message}`)
        return
      }

      // Verificar o resultado retornado pela função
      // @ts-ignore - Data type from RPC
      if (data && !data.success) {
        // @ts-ignore - Data type from RPC
        console.error('❌ Função retornou erro:', data.error)
        // @ts-ignore - Data type from RPC
        toast.error(`Erro: ${data.error}`)
        return
      }

      // Sucesso!
            toast.success(`Usuário ${selectedUser.email} excluído com sucesso`)

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)

      // Recarregar dados e atualizar cache
      try {
        await Promise.all([loadUsers(), loadStats()])

        // Atualizar cache
        const cacheData: CachedAdminData = {
          stats,
          users,
          meetings,
          timestamp: Date.now()
        }
        cachedAdminData = cacheData
        cachedAdminTimestamp = Date.now()
        setLocalCache(cacheData)
      } catch (reloadErr) {
        console.warn('⚠️ Erro ao recarregar dados após deletar')
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao excluir usuário:', error)
      toast.error('Erro inesperado ao excluir usuário')
    }
  }

  const updateMeetingStatus = async (meetingId: string, status: string) => {
    try {
      // Usar RPC para atualização segura como admin
      // @ts-ignore - RPC function not in generated types
      const { data, error } = await supabase.rpc('admin_update_meeting_status', {
        meeting_id_param: meetingId,
        new_status: status
      })

      if (error) {
        console.error('Erro RPC ao atualizar status:', error)
        toast.error('Erro ao atualizar status da reunião')
        return
      }

      // @ts-ignore - Data type from RPC
      if (!data?.success) {
        // @ts-ignore - Data type from RPC
        toast.error(data?.error || 'Erro ao atualizar status da reunião')
        return
      }

      await logActivity('update_meeting_status', 'meeting', meetingId, { status })
      toast.success('Status atualizado com sucesso')

      // Recarregar dados e atualizar cache
      try {
        await loadMeetings()

        // Atualizar cache
        const cacheData: CachedAdminData = {
          stats,
          users,
          meetings,
          timestamp: Date.now()
        }
        cachedAdminData = cacheData
        cachedAdminTimestamp = Date.now()
        setLocalCache(cacheData)
      } catch (reloadErr) {
        console.warn('⚠️ Erro ao recarregar dados após atualizar meeting')
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar status:', error)
      toast.error('Erro inesperado ao atualizar status')
    }
  }

  // ✅ OTIMIZADO: Usa debounced search para evitar re-renders frequentes
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [users, debouncedSearchTerm])

  // Funções do Calendário
  const getMeetingsForDay = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd')
    return meetings.filter(
      (m) =>
        m.status === 'confirmed' &&
        format(new Date(m.meeting_date), 'yyyy-MM-dd') === formattedDate
    ).sort((a, b) => {
      const dateA = new Date(a.meeting_date).getTime()
      const dateB = new Date(b.meeting_date).getTime()
      return dateA - dateB
    })
  }

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: ptBR })
    const end = endOfWeek(endOfMonth(currentMonth), { locale: ptBR })
    return eachDayOfInterval({ start, end }).map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentMonth)
    }))
  }

  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedCalendarDate(null)
  }

  const handleDayClick = (date: Date) => {
    if (isSameDay(date, selectedCalendarDate || new Date())) {
      setSelectedCalendarDate(null)
    } else {
      setSelectedCalendarDate(date)
    }
  }

  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      // Filtro por texto de busca
      const matchesSearch = searchTerm === '' ||
        meeting.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.project_type.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro por status
      const matchesStatus = meetingStatusFilter === 'all' || meeting.status === meetingStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [meetings, searchTerm, meetingStatusFilter])

    if (adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner />
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner />
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin || adminError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            {adminError || 'Você não tem permissão para acessar esta página.'}
          </p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Voltar ao Início
          </Link>
        </div>
      </div>
    )
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navbar Integrada */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Elion Softwares"
                width={240}
                height={60}
                className="h-5 w-auto"
                quality={100}
                priority
              />
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-xs font-medium text-gray-600">Painel Administrativo</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Voltar ao Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Mensagem de Cache */}
        {cacheMessage && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {cacheMessage}
          </div>
        )}

        {/* Stats Cards - Design Minimalista */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Usuários */}
            <Card className="border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Usuários</p>
                    <div className="text-2xl font-semibold text-gray-900">{stats.total_users}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">+{stats.users_last_30_days} últimos 30 dias</p>
              </CardContent>
            </Card>

            {/* Bloqueados */}
            <Card className="border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <UserX className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Bloqueados</p>
                    <div className="text-2xl font-semibold text-gray-900">{stats.blocked_users}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{((stats.blocked_users / stats.total_users) * 100).toFixed(1)}% do total</p>
              </CardContent>
            </Card>

            {/* Reuniões */}
            <Card className="border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Reuniões</p>
                    <div className="text-2xl font-semibold text-gray-900">{stats.total_meetings}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">+{stats.meetings_last_30_days} últimos 30 dias</p>
              </CardContent>
            </Card>

            {/* Pendentes */}
            <Card className="border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Pendentes</p>
                    <div className="text-2xl font-semibold text-gray-900">{stats.pending_meetings}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">aguardando aprovação</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs - Design Minimalista */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1">
            <TabsTrigger
              value="users"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="meetings"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reuniões
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendário
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <TabsContent value="users" className="space-y-4" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
            <Card className="border border-gray-200 bg-white rounded-lg">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Usuários</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
                    </CardDescription>
                  </div>
                </div>

                {/* Filtros de Status */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      userFilter === 'all'
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Todos ({users.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      userFilter === 'active'
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Ativos ({users.filter(u => !u.is_blocked && u.role !== 'deleted').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('blocked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      userFilter === 'blocked'
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bloqueados ({users.filter(u => u.is_blocked).length})
                  </button>
                  <button
                    onClick={() => setUserFilter('deleted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      userFilter === 'deleted'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    Excluídos ({users.filter(u => u.role === 'deleted').length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none focus-visible:outline-none transition-colors rounded-lg text-sm !shadow-none"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar Real do Usuário */}
                          <div className="relative flex-shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-gray-800 rounded-full p-1">
                                <Shield className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            {user.is_blocked && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-1">
                                <Lock className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {user.full_name || 'Sem nome'}
                              </p>
                              {user.role === 'admin' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  Admin
                                </span>
                              )}
                              {user.is_blocked && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                  Bloqueado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            {user.blocked_reason && (
                              <p className="text-xs text-red-600 mt-1">
                                {user.blocked_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {user.role !== 'admin' && (
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            {user.is_blocked ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleUnblockUser(user)}
                                disabled={isUnblocking === user.id}
                              >
                                {isUnblocking === user.id ? (
                                  <>
                                    <Spinner className="h-4 w-4 mr-1" />
                                    Desbloqueando...
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-4 w-4 mr-1" />
                                    Desbloquear
                                  </>
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsBlockDialogOpen(true)
                                  }}
                                  disabled={isBlocking || isUnblocking !== null}
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  Bloquear
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  disabled={isBlocking || isUnblocking !== null || isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>

          {/* Meetings Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'meetings' && (
              <TabsContent value="meetings" className="space-y-4" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
            <Card className="border border-gray-200 bg-white rounded-lg">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Reuniões</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      {filteredMeetings.length} {filteredMeetings.length === 1 ? 'reunião' : 'reuniões'}
                    </CardDescription>
                  </div>
                </div>

                {/* Filtros */}
                <div className="space-y-3">
                  {/* Filtro por Status */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMeetingStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        meetingStatusFilter === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Todas ({meetings.length})
                    </button>
                    <button
                      onClick={() => setMeetingStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        meetingStatusFilter === 'pending'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Pendentes ({meetings.filter(m => m.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setMeetingStatusFilter('confirmed')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        meetingStatusFilter === 'confirmed'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Confirmadas ({meetings.filter(m => m.status === 'confirmed').length})
                    </button>
                    <button
                      onClick={() => setMeetingStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        meetingStatusFilter === 'completed'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Concluídas ({meetings.filter(m => m.status === 'completed').length})
                    </button>
                    <button
                      onClick={() => setMeetingStatusFilter('cancelled')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        meetingStatusFilter === 'cancelled'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Canceladas ({meetings.filter(m => m.status === 'cancelled').length})
                    </button>
                  </div>

                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por cliente, email ou tipo de projeto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400 transition-colors rounded-lg text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMeetings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma reunião encontrada</p>
                    </div>
                  ) : (
                    filteredMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                meeting.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                                meeting.status === 'confirmed' ? 'bg-gray-100 text-gray-700' :
                                meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                              }`}
                            >
                              {meeting.status === 'pending' && 'Pendente'}
                              {meeting.status === 'confirmed' && 'Confirmada'}
                              {meeting.status === 'completed' && 'Concluída'}
                              {meeting.status === 'cancelled' && 'Cancelada'}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{meeting.project_type}</span>
                          </div>
                          {meeting.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateMeetingStatus(meeting.id, 'confirmed')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateMeetingStatus(meeting.id, 'cancelled')}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {meeting.status === 'confirmed' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                onClick={() => updateMeetingStatus(meeting.id, 'completed')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Concluir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateMeetingStatus(meeting.id, 'cancelled')}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                          {meeting.status === 'cancelled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateMeetingStatus(meeting.id, 'confirmed')}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          {meeting.status === 'completed' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => updateMeetingStatus(meeting.id, 'confirmed')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Reabrir
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Cliente */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {meeting.users?.full_name || 'Cliente não identificado'}
                          </p>
                          <p className="text-xs text-gray-500">{meeting.email} • {meeting.phone}</p>
                        </div>

                        {/* Descrição */}
                        <div className="text-sm text-gray-600">
                          {meeting.project_description}
                        </div>

                        {/* Detalhes */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>Prazo: {meeting.timeline}</span>
                          <span>•</span>
                          <span>Orçamento: {meeting.budget}</span>
                          <span>•</span>
                          <span>{new Date(meeting.meeting_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>

          {/* Calendar Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <TabsContent value="calendar" className="space-y-6" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {/* Estatísticas do Mês */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border border-gray-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Reuniões este mês</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {meetings.filter(m =>
                                m.status === 'confirmed' &&
                                isSameMonth(new Date(m.meeting_date), currentMonth)
                              ).length}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Pendentes</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {meetings.filter(m =>
                                m.status === 'pending' &&
                                isSameMonth(new Date(m.meeting_date), currentMonth)
                              ).length}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Concluídas</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {meetings.filter(m =>
                                m.status === 'completed' &&
                                isSameMonth(new Date(m.meeting_date), currentMonth)
                              ).length}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border border-gray-200 bg-white rounded-lg">
                    <CardHeader className="border-b border-gray-100 pb-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Calendário de Reuniões</CardTitle>
                          <CardDescription className="text-sm text-gray-500 mt-1">
                            Visualize e gerencie todas as reuniões confirmadas
                          </CardDescription>
                        </div>

                        {/* Busca Rápida */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar reunião..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Cabeçalho do Calendário */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={goToPreviousMonth}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                            aria-label="Mês anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).charAt(0).toUpperCase() + format(currentMonth, 'MMMM yyyy', { locale: ptBR }).slice(1)}
                          </h2>
                          <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                            aria-label="Próximo mês"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={goToToday}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Ir para Hoje
                          </button>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Limpar busca
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Verificar se há reuniões neste mês */}
                      {meetings.filter(m =>
                        m.status === 'confirmed' &&
                        isSameMonth(new Date(m.meeting_date), currentMonth)
                      ).length === 0 ? (
                        <div className="py-16 text-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma reunião confirmada neste mês
                          </h3>
                          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                            Não há reuniões confirmadas agendadas para {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              onClick={() => setActiveTab('meetings')}
                              variant="outline"
                              className="text-sm"
                            >
                              Ver todas as reuniões
                            </Button>
                            <Button
                              onClick={goToToday}
                              className="text-sm bg-gray-900 hover:bg-gray-800"
                            >
                              Ir para o mês atual
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Dias da Semana */}
                          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600 mb-3">
                            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
                              <div key={day} className="py-3">
                                {day}
                              </div>
                            ))}
                          </div>

                      {/* Legenda */}
                      <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500">Tipos de projeto:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                          <span className="text-xs text-gray-600">Website</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                          <span className="text-xs text-gray-600">E-commerce</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                          <span className="text-xs text-gray-600">App Mobile</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                          <span className="text-xs text-gray-600">Sistema Web</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-pink-500"></div>
                          <span className="text-xs text-gray-600">Consultoria</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-gray-500"></div>
                          <span className="text-xs text-gray-600">Outro</span>
                        </div>
                      </div>

                      {/* Grid do Calendário */}
                      <div className="grid grid-cols-7 gap-2">
                        {getDaysInMonth().map((day, index) => {
                          const dayMeetings = getMeetingsForDay(day.date)
                          const isToday = isSameDay(day.date, new Date())
                          const isSelected = selectedCalendarDate && isSameDay(day.date, selectedCalendarDate)

                          const getProjectColor = (projectType: string) => {
                            const type = projectType.toLowerCase()
                            if (type.includes('website') || type.includes('site')) return 'bg-blue-500'
                            if (type.includes('e-commerce') || type.includes('loja')) return 'bg-purple-500'
                            if (type.includes('app') || type.includes('mobile')) return 'bg-green-500'
                            if (type.includes('sistema') || type.includes('web')) return 'bg-orange-500'
                            if (type.includes('consultoria')) return 'bg-pink-500'
                            return 'bg-gray-500'
                          }

                          return (
                            <motion.div
                              key={index}
                              whileHover={dayMeetings.length > 0 ? { scale: 1.02 } : {}}
                              whileTap={dayMeetings.length > 0 ? { scale: 0.98 } : {}}
                              className={cn(
                                'relative min-h-[100px] p-2 rounded-xl flex flex-col transition-all duration-200 border',
                                day.isCurrentMonth
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-50 border-gray-100 opacity-50',
                                isToday && 'ring-2 ring-black border-black',
                                dayMeetings.length > 0 && 'cursor-pointer hover:shadow-md hover:border-gray-300',
                                isSelected && 'bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-lg'
                              )}
                              onClick={() => dayMeetings.length > 0 && handleDayClick(day.date)}
                            >
                              {/* Número do Dia */}
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={cn(
                                    'text-sm font-semibold',
                                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                                    isToday && 'w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs'
                                  )}
                                >
                                  {format(day.date, 'd')}
                                </span>
                                {dayMeetings.length > 0 && (
                                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    {dayMeetings.length}
                                  </span>
                                )}
                              </div>

                              {/* Reuniões */}
                              <div className="flex-1 space-y-1 overflow-hidden">
                                {dayMeetings.slice(0, 3).map((meeting) => (
                                  <div
                                    key={meeting.id}
                                    className={cn(
                                      'text-[10px] font-medium text-white px-2 py-1 rounded-md truncate shadow-sm',
                                      getProjectColor(meeting.project_type)
                                    )}
                                    title={`${meeting.project_type} - ${format(new Date(meeting.meeting_date), 'HH:mm')}`}
                                  >
                                    {format(new Date(meeting.meeting_date), 'HH:mm')} • {meeting.project_type}
                                  </div>
                                ))}
                                {dayMeetings.length > 3 && (
                                  <div className="text-[10px] text-gray-500 font-medium px-2 py-1">
                                    +{dayMeetings.length - 3} mais
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Detalhes do Dia Selecionado - Melhorado */}
                      <AnimatePresence>
                        {selectedCalendarDate && getMeetingsForDay(selectedCalendarDate).length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="mt-8 pt-8 border-t-2 border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {getMeetingsForDay(selectedCalendarDate).length} {getMeetingsForDay(selectedCalendarDate).length === 1 ? 'reunião' : 'reuniões'} agendada{getMeetingsForDay(selectedCalendarDate).length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCalendarDate(null)}
                                className="text-gray-500 hover:text-gray-900"
                              >
                                Fechar
                              </Button>
                            </div>

                            <div className="grid gap-4">
                              {getMeetingsForDay(selectedCalendarDate).map((meeting, idx) => {
                                const getProjectColor = (projectType: string) => {
                                  const type = projectType.toLowerCase()
                                  if (type.includes('website') || type.includes('site')) return 'border-blue-500 bg-blue-50'
                                  if (type.includes('e-commerce') || type.includes('loja')) return 'border-purple-500 bg-purple-50'
                                  if (type.includes('app') || type.includes('mobile')) return 'border-green-500 bg-green-50'
                                  if (type.includes('sistema') || type.includes('web')) return 'border-orange-500 bg-orange-50'
                                  if (type.includes('consultoria')) return 'border-pink-500 bg-pink-50'
                                  return 'border-gray-500 bg-gray-50'
                                }

                                return (
                                  <motion.div
                                    key={meeting.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={cn(
                                      'rounded-xl p-5 border-l-4 bg-white shadow-sm hover:shadow-md transition-all',
                                      getProjectColor(meeting.project_type)
                                    )}
                                  >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <h4 className="text-base font-semibold text-gray-900">
                                            {meeting.project_type}
                                          </h4>
                                          <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                            Confirmada
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-gray-400" />
                                          {format(new Date(meeting.meeting_date), "HH:mm 'h'", { locale: ptBR })}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Cliente */}
                                    <div className="mb-4 pb-4 border-b border-gray-100">
                                      <p className="text-sm font-medium text-gray-900 mb-2">
                                        {meeting.users?.full_name || 'Cliente não identificado'}
                                      </p>
                                      <div className="space-y-1.5">
                                        <p className="text-xs text-gray-600 flex items-center gap-2">
                                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                                          {meeting.email}
                                        </p>
                                        <p className="text-xs text-gray-600 flex items-center gap-2">
                                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                                          {meeting.phone}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Descrição */}
                                    <div className="mb-4">
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {meeting.project_description}
                                      </p>
                                    </div>

                                    {/* Detalhes do Projeto */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Prazo</p>
                                        <p className="text-sm font-medium text-gray-900">{meeting.timeline}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                                        <p className="text-sm font-medium text-gray-900">{meeting.budget}</p>
                                      </div>
                                    </div>

                                    {/* Ações Rápidas */}
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateMeetingStatus(meeting.id, 'completed')}
                                        className="text-xs h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                        Marcar como Concluída
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateMeetingStatus(meeting.id, 'cancelled')}
                                        className="text-xs h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                                      >
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                        Cancelar Reunião
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setActiveTab('meetings')
                                          setMeetingStatusFilter('confirmed')
                                          setSearchTerm(meeting.id)
                                        }}
                                        className="text-xs h-8 text-gray-600 hover:text-gray-900"
                                      >
                                        Ver detalhes completos →
                                      </Button>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                        </>
                      )}
              </CardContent>
            </Card>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Block User Dialog */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja bloquear <strong>{selectedUser?.email}</strong>?
              <br />
              <span className="text-xs text-gray-500 mt-2 block">
                O usuário não poderá mais fazer login no sistema.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsBlockDialogOpen(false)
                setSelectedUser(null)
              }}
              disabled={isBlocking}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isBlocking}
            >
              {isBlocking ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Bloqueando...
                </>
              ) : (
                'Sim, Bloquear'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente {selectedUser?.email}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedUser(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

