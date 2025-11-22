'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Camera, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useTranslation } from '@/contexts/LanguageContext'

// Flag para forçar logs em produção
const FORCE_LOGS = true

// 🛡️ CONTROLE GLOBAL: Evitar múltiplas cargas simultâneas
let lastLoadTimestamp = 0
let isCurrentlyLoading = false
let loadAttempts = 0
const DEBOUNCE_TIME = 50 // ms (reduzido para 50ms - ULTRA RÁPIDO)
const MAX_LOAD_ATTEMPTS = 2

// 🚀 CACHE HÍBRIDO: Global + LocalStorage para máxima resiliência
let cachedProfile: any = null
let cachedProfileTimestamp = 0
const CACHE_DURATION = 30000 // 30 segundos de cache (aumentado)

// Cache localStorage para persistência entre sessões
const PROFILE_CACHE_KEY = 'elion_profile_cache'
const PROFILE_CACHE_TIMESTAMP_KEY = 'elion_profile_timestamp'

interface CachedProfile {
    id: string
    full_name: string
    company: string
    avatar_url: string
    role: string
    updated_at: string
    timestamp: number
}

// 🔄 ATUALIZAÇÃO EM BACKGROUND: DESABILITADA (evitar queries problemáticas na tabela users)
const updateFromDatabaseInBackground = async (session: any) => {
    if (!session?.user?.id) return
    
    // NÃO fazer query no banco para evitar timeout
    // A tabela users tem problemas de RLS que causam recursão infinita
    // Vamos trabalhar apenas com user_metadata
    if (FORCE_LOGS) console.error('[PERFIL] ℹ️ Atualização em background desabilitada (evitando query problemática)')
}

// 🔧 FUNÇÕES DE CACHE LOCALSTORAGE (OTIMIZADAS)
const getLocalCache = (): CachedProfile | null => {
    try {
        // Otimização: Ler uma vez e fazer parsing se necessário
        const cached = localStorage.getItem(PROFILE_CACHE_KEY)
        if (!cached) return null

        const timestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY)
        if (!timestamp) return null

        const cacheTime = parseInt(timestamp, 10)
        const now = Date.now()

        // Cache válido por 10 minutos (aumentado para reduzir queries)
        if (now - cacheTime < 10 * 60 * 1000) {
            return JSON.parse(cached)
        }

        // Cache expirado, limpar de forma assíncrona (não bloqueia)
        setTimeout(() => {
            localStorage.removeItem(PROFILE_CACHE_KEY)
            localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY)
        }, 0)
    } catch (err) {
        // Silencioso em produção
        if (FORCE_LOGS) console.warn('[PERFIL] ⚠️ Erro ao ler cache:', err)
    }
    return null
}

const setLocalCache = (profile: any) => {
    // Otimização: Salvar de forma assíncrona (não bloqueia)
    setTimeout(() => {
        try {
            const now = Date.now()
            const cacheData: CachedProfile = {
                id: profile.id,
                full_name: profile.full_name || '',
                company: profile.company || '',
                avatar_url: profile.avatar_url || '',
                role: profile.role || 'user',
                updated_at: profile.updated_at || new Date().toISOString(),
                timestamp: now
            }

            const cacheStr = JSON.stringify(cacheData)
            const timestampStr = now.toString()

            localStorage.setItem(PROFILE_CACHE_KEY, cacheStr)
            localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, timestampStr)
        } catch (err) {
            // Silencioso em produção
            if (FORCE_LOGS) console.warn('[PERFIL] ⚠️ Erro ao salvar cache:', err)
        }
    }, 0)
}

const clearLocalCache = () => {
    try {
        localStorage.removeItem(PROFILE_CACHE_KEY)
        localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY)
        if (FORCE_LOGS) console.error('[PERFIL] 🗑️ Cache localStorage limpo')
    } catch (err) {
        console.warn('[PERFIL] ⚠️ Erro ao limpar cache localStorage:', err)
    }
}

export default function PerfilPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isSavingRef = useRef(false)
    const isLoadingRef = useRef(false)
    const loadingInProgressRef = useRef(false)
    const { t, language, setLanguage } = useTranslation()

    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [fullName, setFullName] = useState('')
    const [company, setCompany] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [localLanguage, setLocalLanguage] = useState(language)

    const [actualPassword, setActualPassword] = useState('') // Real password after verification
    const [showPassword, setShowPassword] = useState(false)
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [verifyPassword, setVerifyPassword] = useState('')
    const [showVerifyPassword, setShowVerifyPassword] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [showResetDialog, setShowResetDialog] = useState(false)
    const [sendingReset, setSendingReset] = useState(false)
    const [hasPassword, setHasPassword] = useState(true) // If user has password or only Google OAuth

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deleting, setDeleting] = useState(false)

    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (FORCE_LOGS) console.error('[PERFIL] 🚀 COMPONENTE MONTADO - VERSÃO OFFLINE-FIRST v2.0')
        let isSubscribed = true

        // 🛡️ RESET FORÇADO: Ao montar, limpar TODOS os flags (caso tenha ficado travado)
        if (FORCE_LOGS) console.error('[PERFIL] 🔄 Resetando flags globais...')
        isCurrentlyLoading = false
        loadingInProgressRef.current = false

        // 🛡️ TIMEOUT DE SEGURANÇA: Forçar liberação dos flags após 20s e tentar novamente
        const safetyTimeoutId = setTimeout(() => {
            if (isCurrentlyLoading || loadingInProgressRef.current) {
                console.warn('[PERFIL] ⚠️ TIMEOUT DE SEGURANÇA: Forçando liberação dos flags após 20s')
                isCurrentlyLoading = false
                loadingInProgressRef.current = false
                isLoadingRef.current = false

                // Tentar carregar novamente se ainda estiver com loading true
                if (loading && isSubscribed) {
                    loadAttempts++

                    // Se atingiu máximo de tentativas, desistir
                    if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
                        console.error('[PERFIL] ❌ Máximo de tentativas atingido, desativando loading')
                        setLoading(false)
                        setError('Erro ao carregar perfil. Verifique sua conexão com a internet e recarregue a página.')
                        return
                    }

                    console.warn(`[PERFIL] 🔄 Tentando carregar novamente (${loadAttempts}/${MAX_LOAD_ATTEMPTS})...`)
                    supabase.auth.getSession().then(({ data }) => {
                        if (data.session && isSubscribed) {
                            carregarPerfil(data.session)
                        } else {
                            console.warn('[PERFIL] ❌ Sem sessão no fallback, desativando loading')
                            setLoading(false)
                        }
                    }).catch(err => {
                        console.error('[PERFIL] ❌ Erro no fallback:', err)
                        setLoading(false)
                    })
                }
            }
        }, 20000)

        // Função para carregar perfil (reutilizável)
        const carregarPerfil = async (session: any) => {
            const now = Date.now()

            // 🛡️ PROTEÇÃO 1: Debounce - Evitar chamadas muito próximas
            if (now - lastLoadTimestamp < DEBOUNCE_TIME) {
                if (FORCE_LOGS) console.error('[PERFIL] 🚫 Debounce: Chamada ignorada (muito próxima da anterior)')
                    return
                }

            // 🛡️ PROTEÇÃO 2: Já está carregando? Ignorar
            if (isCurrentlyLoading || loadingInProgressRef.current) {
                if (FORCE_LOGS) console.error('[PERFIL] 🚫 Carga já em andamento, ignorando duplicata')
                return
            }

            // 🛡️ Marcar que está carregando
            isCurrentlyLoading = true
            loadingInProgressRef.current = true
            lastLoadTimestamp = now

            if (FORCE_LOGS) console.error('[PERFIL] 📡 Iniciando carregarPerfil...', new Date().toISOString())

            // ✅ VALIDAÇÃO 1: Componente ainda montado?
            if (!isSubscribed) {
                if (FORCE_LOGS) console.error('[PERFIL] ⏹️ Componente desmontado, abortando carregarPerfil')
                isCurrentlyLoading = false
                loadingInProgressRef.current = false
                return
            }

            // ✅ VALIDAÇÃO 2: Sessão válida?
            if (!session) {
                console.warn('[PERFIL] ⚠️ Sessão inválida (null/undefined)')
                setLoading(false)
                isLoadingRef.current = false
                isCurrentlyLoading = false
                loadingInProgressRef.current = false
                return
            }

            // ✅ VALIDAÇÃO 3: User ID existe?
            if (!session.user?.id) {
                console.warn('[PERFIL] ⚠️ Sessão sem user.id:', session)
                setLoading(false)
                isLoadingRef.current = false
                isCurrentlyLoading = false
                loadingInProgressRef.current = false
                return
            }

            try {
                const startTime = Date.now()
                if (FORCE_LOGS) console.error('[PERFIL] ⚡ ULTRA-FAST LOAD START')

                // Setar user imediatamente
                setUser(session.user)

                // 🔥 VERIFICAR CACHE PRIMEIRO (antes de calcular qualquer coisa)
                const localCache = getLocalCache()

                if (localCache && localCache.id === session.user.id) {
                    // 🎯 CACHE HIT - SUPER RÁPIDO!
                    if (FORCE_LOGS) console.error('[PERFIL] 🎯 CACHE HIT!')

                    // Batch update (uma única operação de state)
                    const identities = session.user.identities || []
                    const hasEmailIdentity = identities.some((identity: any) => identity.provider === 'email')
                    const hasGoogleIdentity = identities.some((identity: any) => identity.provider === 'google')

                    // Se tem login Google, sempre usar a imagem do Google
                    const googleAvatarUrl = hasGoogleIdentity ? session.user.user_metadata?.avatar_url : null
                    const finalAvatarUrl = googleAvatarUrl || localCache.avatar_url || ''

                    setFullName(localCache.full_name || '')
                    setCompany(localCache.company || '')
                    setAvatarUrl(finalAvatarUrl)
                    setHasPassword(hasEmailIdentity)
                    setIsAdmin(localCache.role === 'admin')
                    setLocalLanguage(language)
                    setLoading(false)
                    isLoadingRef.current = false
                    isCurrentlyLoading = false
                    loadingInProgressRef.current = false
                    loadAttempts = 0

                    if (FORCE_LOGS) console.error('[PERFIL] ✅ LOADED FROM CACHE:', Date.now() - startTime, 'ms')

                    // Atualizar em background (não bloqueia)
                    updateFromDatabaseInBackground(session).catch(() => {})
                    return
                }

                // 🚀 CACHE MISS - Mostrar dados básicos instantaneamente
                if (FORCE_LOGS) console.error('[PERFIL] ⚡ CACHE MISS - Usando user_metadata')

                const identities = session.user.identities || []
                const hasEmailIdentity = identities.some((identity: any) => identity.provider === 'email')
                const hasGoogleIdentity = identities.some((identity: any) => identity.provider === 'google')

                // Se tem login Google, sempre usar a imagem do Google
                const googleAvatarUrl = hasGoogleIdentity ? session.user.user_metadata?.avatar_url : null

                // Batch update - dados básicos
                setFullName(session.user.user_metadata?.full_name || session.user.email || '')
                setCompany(session.user.user_metadata?.company || '')
                setAvatarUrl(googleAvatarUrl || session.user.user_metadata?.avatar_url || '')
                setHasPassword(hasEmailIdentity)
                setLocalLanguage(language)
                setLoading(false)
                isLoadingRef.current = false

                if (FORCE_LOGS) console.error('[PERFIL] ✅ BASIC DATA LOADED:', Date.now() - startTime, 'ms')

                // 🔄 Query em BACKGROUND (não bloqueia, apenas atualiza dados)
                // 🚀 OTIMIZAÇÃO RADICAL: Não fazer query na tabela users, trabalhar apenas com user_metadata
                // A tabela users tem problemas de RLS que causam timeout. Vamos evitar totalmente.
                
                if (FORCE_LOGS) console.error('[PERFIL] ✅ Usando APENAS user_metadata - evitando query problemática')
                
                // Criar "profile" a partir dos dados que já temos
                const profile = {
                    id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || session.user.email || '',
                    company: session.user.user_metadata?.company || '',
                    avatar_url: googleAvatarUrl || session.user.user_metadata?.avatar_url || '',
                    role: session.user.user_metadata?.role || 'user',
                    updated_at: new Date().toISOString()
                }
                
                const profileError = null
                
                if (FORCE_LOGS) console.error('[PERFIL] ✅ Profile montado do user_metadata (0ms - instant)')

                // NÃO fazer query no banco para evitar timeout
                // let profile, profileError
                // try {
                //     const queryPromise = supabase
                //     .from('users')
                //         .select('id, full_name, company, avatar_url, role, updated_at')
                //     .eq('id', session.user.id)
                //     .maybeSingle()
                //     ... código removido para evitar timeout
                // } catch (err: any) {
                //     profile = null
                //     profileError = { message: err?.message || 'Erro na query' }
                // }

                const loadTime = Date.now() - startTime
                if (FORCE_LOGS) console.error('[PERFIL] 📥 Carregamento total em', loadTime, 'ms')

                // ✅ SUCESSO: Dados retornados
                if (FORCE_LOGS) console.error('[PERFIL] 📄 Dados recebidos:', {
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    full_name: profile.full_name,
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    company: profile.company,
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    avatar_url: profile.avatar_url ? 'SIM' : 'NÃO',
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    language: profile.language,
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    role: profile.role
                })

                // 🚀 SALVAR NO CACHE (global + localStorage)
                cachedProfile = profile
                cachedProfileTimestamp = Date.now()
                setLocalCache(profile) // Também salvar no localStorage
                if (FORCE_LOGS) console.error('[PERFIL] 💾 CACHE CRIADO! Próximas visitas serão instantâneas')

                // Limpar mensagem de erro se estava carregando
                setError('')

                if (isSubscribed) {
                    // Check if user has password and Google login
                    const identities = session.user.identities || []
                    const hasEmailIdentity = identities.some((identity: any) => identity.provider === 'email')
                    const hasGoogleIdentity = identities.some((identity: any) => identity.provider === 'google')

                    // Se tem login Google, sempre usar a imagem do Google
                    const googleAvatarUrl = hasGoogleIdentity ? session.user.user_metadata?.avatar_url : null

                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setFullName(profile.full_name || session.user.user_metadata?.full_name || '')
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setCompany(profile.company || '')
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setAvatarUrl(googleAvatarUrl || profile.avatar_url || '')
                    setHasPassword(hasEmailIdentity)

                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                if (profile.language && ['pt', 'en', 'es', 'fr', 'de', 'it', 'zh', 'ja'].includes(profile.language)) {
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setLocalLanguage(profile.language)
                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setLanguage(profile.language)
                }

                    // @ts-ignore - TypeScript não reconhece colunas customizadas
                    setIsAdmin(profile.role === 'admin')

                    if (FORCE_LOGS) console.error('[PERFIL] ✅ SUCESSO COMPLETO em', Date.now() - startTime, 'ms')
            } else {
                    if (FORCE_LOGS) console.error('[PERFIL] ⏹️ Componente desmontado durante carregamento')
                }
            } catch (err: any) {
                console.error('[PERFIL] ❌ Exceção ao carregar perfil:', err)
                console.error('[PERFIL] 📋 Stack trace:', err instanceof Error ? err.stack : 'N/A')

                // Se for timeout, mostrar mensagem específica
                if (err?.message?.includes('timeout') || err?.message?.includes('Timeout')) {
                    console.error('[PERFIL] 🕒 TIMEOUT na query ao banco')
                    setError('Tempo esgotado ao carregar perfil. Isso pode ser causado por uma conexão lenta ou problemas temporários do servidor. Tente novamente em alguns instantes.')
                } else {
                    setError('Erro inesperado ao carregar perfil. Se o problema persistir, entre em contato com o suporte.')
                }
        } finally {
                // ✅ SEMPRE desativar loading e flags (GARANTIDO)
                if (isSubscribed) {
                    if (FORCE_LOGS) console.error('[PERFIL] 🏁 Loading OFF (finally)')
            setLoading(false)
                    isLoadingRef.current = false
                } else {
                    if (FORCE_LOGS) console.error('[PERFIL] ⏹️ Componente desmontado, não alterando loading')
                }

                // 🛡️ SEMPRE limpar flags globais
                isCurrentlyLoading = false
                loadingInProgressRef.current = false

                // 🔄 Resetar contador de tentativas ao completar
                loadAttempts = 0

                if (FORCE_LOGS) console.error('[PERFIL] 🔓 Flags de controle liberados')
            }
        }

        // 👂 Configurar listener de autenticação (APENAS UMA VEZ)
        if (FORCE_LOGS) console.error('[PERFIL] 👂 Configurando listener...')

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (FORCE_LOGS) console.error('[PERFIL] 🔔 Event:', event, 'subscribed:', isSubscribed, 'saving:', isSavingRef.current)

            // Ignorar eventos se componente foi desmontado
            if (!isSubscribed) {
                if (FORCE_LOGS) console.error('[PERFIL] ⏹️ Componente desmontado, ignorando evento')
                return
            }

            // Ignorar USER_UPDATED durante save para evitar conflitos
            if (isSavingRef.current && event === 'USER_UPDATED') {
                if (FORCE_LOGS) console.error('[PERFIL] ⏸️ Salvando, ignorando USER_UPDATED')
                return
            }

            // Tratar eventos de autenticação
            if (event === 'SIGNED_OUT' || !session) {
                if (FORCE_LOGS) console.error('[PERFIL] 👋 Deslogado, redirecionando')
                // Limpar caches ao fazer logout
                clearLocalCache()
                cachedProfile = null
                cachedProfileTimestamp = 0
                router.push('/')
                return
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (FORCE_LOGS) console.error('[PERFIL] ✅ SIGNED_IN/REFRESHED - carregando via listener')
                await carregarPerfil(session)
            } else if (event === 'USER_UPDATED') {
                if (FORCE_LOGS) console.error('[PERFIL] 🔄 USER_UPDATED')
                // Apenas atualizar user, não recarregar perfil
                if (session && isSubscribed) {
                    setUser(session.user)
                }
            }
        })

        if (FORCE_LOGS) console.error('[PERFIL] ✅ Listener registrado')

        // 🔧 BUSCA IMEDIATA: Forçar getSession() logo após listener ser registrado
        supabase.auth.getSession().then(({ data, error }) => {
            if (!isSubscribed) {
                if (FORCE_LOGS) console.error('[PERFIL] ⏹️ Componente desmontado antes da busca imediata')
                return
            }

            if (error) {
                console.error('[PERFIL] ❌ Erro ao buscar sessão imediata:', error)
                setLoading(false)
                isLoadingRef.current = false
                return
            }

            if (data.session) {
                if (FORCE_LOGS) console.error('[PERFIL] ⚡ Sessão encontrada imediatamente!')
                carregarPerfil(data.session)
            } else {
                if (FORCE_LOGS) console.error('[PERFIL] 💤 Nenhuma sessão ativa ainda, aguardando listener...')
                setLoading(false)
                isLoadingRef.current = false
            }
        }).catch(err => {
            console.error('[PERFIL] ❌ Erro na busca imediata:', err)
            if (isSubscribed) {
                setLoading(false)
                isLoadingRef.current = false
            }
        })

        // Cleanup ao desmontar
        return () => {
            if (FORCE_LOGS) console.error('[PERFIL] 🛑 DESMONTANDO componente')
            isSubscribed = false
            isLoadingRef.current = false
            loadingInProgressRef.current = false

            // 🛡️ Limpar flags globais
            isCurrentlyLoading = false

            // 🛡️ Cancelar timeout de segurança
            clearTimeout(safetyTimeoutId)

            // Cancelar listener de autenticação (PRIORITÁRIO)
            if (FORCE_LOGS) console.error('[PERFIL] 🗑️ Removendo listener...')
            try {
                subscription.unsubscribe()
            } catch (err) {
                console.error('[PERFIL] ⚠️ Erro ao remover listener:', err)
            }

            if (FORCE_LOGS) console.error('[PERFIL] ✅ Cleanup completo')
        }
    }, []) // ⚠️ Executa apenas UMA vez

    // Auto-clear success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000)
            return () => clearTimeout(timer)
        }
    }, [success])

    // Auto-clear error message
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 7000)
            return () => clearTimeout(timer)
        }
    }, [error])

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('❌ Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WEBP)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('❌ A imagem deve ter no máximo 5MB')
            return
        }

        setUploading(true)
        setError('')
        setSuccess('')

        try {
            if (!user) {
                throw new Error('Usuário não autenticado')
            }

            // Create unique file name
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            console.log('📤 Fazendo upload da imagem para Supabase Storage...')

            // Verificar se o bucket existe e é público
            const { data: buckets } = await supabase.storage.listBuckets()
            const bucket = buckets?.find(b => b.name === 'profile-images')

            if (!bucket) {
                throw new Error('❌ Bucket "profile-images" não encontrado. Por favor, crie um bucket público chamado "profile-images" no Supabase Storage.')
            }

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error('❌ Erro no upload:', uploadError)

                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('❌ Bucket "profile-images" não encontrado. Crie um bucket público no Supabase Storage.')
                } else if (uploadError.message.includes('new row violates row-level security')) {
                    throw new Error('❌ Erro de permissão. Configure as políticas de RLS do bucket "profile-images".')
                } else {
                    throw uploadError
                }
            }

            console.log('✅ Upload concluído:', uploadData)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-images')
                .getPublicUrl(filePath)

            console.log('🔗 URL pública gerada:', publicUrl)

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) {
                console.error('❌ Erro ao atualizar perfil:', updateError)
                throw updateError
            }

            setAvatarUrl(publicUrl)
            setSuccess('✅ Foto de perfil atualizada com sucesso!')

            // Limpar input para permitir re-upload do mesmo arquivo
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (err: any) {
            console.error('❌ Error uploading avatar:', err)

            let errorMessage = 'Erro ao fazer upload da imagem'

            if (err.message.includes('Bucket not found') || err.message.includes('profile-images')) {
                errorMessage = '❌ Bucket de imagens não configurado. Veja instruções no console.'
                console.error(`
🔧 CONFIGURAÇÃO NECESSÁRIA:

1. Acesse seu projeto no Supabase Dashboard
2. Vá em Storage > Buckets
3. Clique em "New bucket"
4. Nome: profile-images
5. ✅ Marque "Public bucket"
6. Clique em "Create bucket"

7. Vá em "Policies" do bucket
8. Adicione política de INSERT:
   - Nome: "Permitir usuários autenticados upload"
   - Target roles: authenticated
   - Policy: (auth.uid() = user_id)

9. Adicione política de SELECT:
   - Nome: "Permitir leitura pública"
   - Target roles: public
   - Policy: true
`)
            } else {
                errorMessage = err.message || errorMessage
            }

            setError(errorMessage)
        } finally {
            setUploading(false)
        }
    }

    const handleVerifyPassword = async () => {
        if (!verifyPassword || !user?.email) return

        setVerifying(true)
        setError('')

        try {
            // Verify password by trying to sign in
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: verifyPassword
            })

            if (error) {
                setError('Senha incorreta')
                setVerifying(false)
                return
            }

            // Password verified successfully
            setActualPassword(verifyPassword)
            setShowPassword(true)
            setShowVerifyDialog(false)
            setVerifyPassword('')
        } catch (err: any) {
            setError('Erro ao verificar senha')
        } finally {
            setVerifying(false)
        }
    }

    const handleResetPassword = async () => {
        if (!user?.email) {
            return
        }

        setSendingReset(true)
        setError('')

        try {
            // Send password reset email (or set password email for Google users)
            // Note: Supabase has built-in rate limiting to prevent abuse
            const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(
                user.email,
                {
                    redirectTo: `${window.location.origin}/redefinir-senha`,
                }
            )

            if (resetError) {
                throw resetError
            }

            // Mostrar mensagem de sucesso e fechar dialog após 2 segundos
            const successMessage = hasPassword ? t.profile.resetEmailSent : t.profile.defineEmailSent

            setSuccess(successMessage)

            // Aguardar 2 segundos antes de fechar para o usuário ver a mensagem
            setTimeout(() => {
            setShowResetDialog(false)
            }, 2000)

        } catch (err: any) {
            // Tratar erro de rate limit de forma mais amigável
            if (err.status === 429 || err.message?.includes('rate limit')) {
                setError('Você solicitou muitos emails em pouco tempo. Por favor, aguarde alguns minutos e tente novamente.')
            } else {
            setError(err.message || 'Erro ao enviar link de redefinição')
            }
        } finally {
            setSendingReset(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirmation !== 'EXCLUIR') return

        setDeleting(true)
        setError('')

        try {
            // Delete user's avatar from storage if exists
            if (avatarUrl) {
                const fileName = avatarUrl.split('/').pop()
                if (fileName) {
                    await supabase.storage
                        .from('profile-images')
                        .remove([`${user.id}/${fileName}`])
                }
            }

            // Delete user profile from database (cascade will handle related data)
            const { error: deleteProfileError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id)

            if (deleteProfileError) throw deleteProfileError

            // Delete user from auth
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)

            if (deleteAuthError) {
                // If admin delete fails, try regular delete
                // @ts-ignore - delete_user function exists
                const { error: regularDeleteError } = await supabase.rpc('delete_user')
                if (regularDeleteError) throw regularDeleteError
            }

            // Sign out and redirect
            await supabase.auth.signOut()
            router.push('/')
        } catch (err: any) {
            console.error('Error deleting account:', err)
            setError(err.message || 'Erro ao excluir conta. Por favor, entre em contato com o suporte.')
        } finally {
            setDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log('[PERFIL] 💾 HandleSubmit iniciado')
        console.log('[PERFIL] 📊 Estado - user:', !!user, 'saving:', saving, 'isSavingRef:', isSavingRef.current)

        if (!user) {
            console.warn('[PERFIL] ⚠️ Sem usuário, cancelando save')
            return
        }

        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            console.log('[PERFIL] ⏸️ Já está salvando, ignorando')
            return
        }

        isSavingRef.current = true
        setSaving(true)
        setError('')
        setSuccess('')

        console.log('[PERFIL] 📤 Dados a salvar:', {
            full_name: fullName,
            company: company,
            language: localLanguage,
            userId: user.id
        })

        try {
            console.log('[PERFIL] 📡 Enviando atualização para Supabase...')
            const startTime = Date.now()

            // Update users table com timeout de 5s
            const updatePromise = supabase
                .from('users')
                .update({
                    full_name: fullName,
                    company: company,
                    language: localLanguage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Update timeout')), 5000)
            )

            let data, updateError
            try {
                const result = await Promise.race([updatePromise, timeoutPromise])
                data = result.data
                updateError = result.error
            } catch (err: any) {
                console.error('[PERFIL] ❌ Update timeout ou erro:', err)
                data = null
                updateError = { message: err?.message || 'Timeout ao salvar' }
            }

            const saveTime = Date.now() - startTime
            console.log('[PERFIL] 📥 Resposta do Supabase em', saveTime, 'ms:', { data, error: updateError })

            if (updateError) {
                console.error('[PERFIL] ❌ Erro na atualização:', updateError)
                throw updateError
            }

            console.log('[PERFIL] ✅ Perfil atualizado no banco com sucesso')

            // Update global language
            console.log('[PERFIL] 🌐 Atualizando idioma global para:', localLanguage)
            setLanguage(localLanguage as any)

            // Set success message
            console.log('[PERFIL] ✅ Mostrando mensagem de sucesso')
            setSuccess(t.profile.profileUpdated)
        } catch (err: any) {
            console.error('[PERFIL] ❌ Erro ao salvar perfil:', err)
            console.error('[PERFIL] 📄 Detalhes do erro:', {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint
            })

            // Mensagem específica para timeout
            if (err?.message?.includes('timeout') || err?.message?.includes('Timeout')) {
                setError('Tempo esgotado ao salvar. Tente novamente.')
            } else {
            setError(err.message || 'Erro ao atualizar perfil')
            }
        } finally {
            console.log('[PERFIL] 🏁 Finalizando handleSubmit, resetando estado saving')
            // Always reset saving state
            isSavingRef.current = false
            setSaving(false)
            console.log('[PERFIL] 📊 Estado final - saving:', false, 'isSavingRef:', false)
        }
    }

    const initials = user && fullName
        ? fullName
            .split(' ')
            .map(n => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : user?.email?.[0].toUpperCase() || 'U'

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navbar */}
            <header className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
                    <div className="flex items-center justify-between h-full">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Elion Softwares"
                                width={150}
                                height={46}
                                className="h-5 w-auto cursor-pointer"
                                onClick={() => router.push('/')}
                                priority
                                style={{ height: '1.25rem', width: 'auto' }}
                            />
                        </div>

                        {/* Botão Voltar */}
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-medium text-sm">{t.common.back}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg text-green-800 text-sm">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-800 text-sm">
                        {error}
                    </div>
                )}

                {/* Avatar Section */}
                <div className="mb-8">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div
                                onClick={!loading ? handleAvatarClick : undefined}
                                className={cn(
                                    "relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 transition-colors bg-transparent",
                                    !loading && "cursor-pointer hover:border-gray-300"
                                )}
                            >
                                {loading ? (
                                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                                ) : avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt="Avatar"
                                        fill
                                        className="object-cover bg-transparent"
                                        style={{ backgroundColor: 'transparent' }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-4xl font-bold">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                disabled={uploading}
                                className={cn(
                                    "absolute -bottom-1 -right-1 bg-black text-white rounded-full p-2 shadow-lg hover:bg-gray-800 transition-colors cursor-pointer",
                                    uploading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                aria-label="Selecionar foto de perfil"
                            />
                        </div>
                        <p className="text-sm text-gray-600 mt-4 text-center">
                            {t.profile.clickPhotoToChange}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {t.profile.acceptedFormats}
                        </p>
                    </div>
                </div>

                {/* Admin Panel Card */}
                {isAdmin && !loading && (
                    <div className="mb-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            Painel de Administração
                                        </h3>
                                        <p className="text-blue-100 text-sm mt-1">
                                            Gerencie usuários, reuniões e monitore atividades do sistema
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => router.push('/admin')}
                                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 h-auto transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    Acessar Painel →
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">👥</div>
                                    <div className="text-white/90 text-sm mt-1">Gerenciar</div>
                                    <div className="text-blue-100 text-xs">Usuários</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">📅</div>
                                    <div className="text-white/90 text-sm mt-1">Controlar</div>
                                    <div className="text-blue-100 text-xs">Reuniões</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">📊</div>
                                    <div className="text-white/90 text-sm mt-1">Visualizar</div>
                                    <div className="text-blue-100 text-xs">Estatísticas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                <div className="bg-white rounded-lg">
                    <div className="px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">{t.profile.personalInfo}</h2>
                        <p className="text-sm text-gray-600 mt-1">{t.profile.personalInfoSubtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {loading ? (
                            /* Skeleton Loaders */
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                        <div className="h-11 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                        <div className="h-11 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                        <div className="h-12 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                        <div className="h-11 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Row 1: Name and Email */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Full Name */}
                                    <div>
                                        <Label htmlFor="fullName" className="text-gray-900 font-medium text-sm">
                                            {t.profile.fullName} *
                                        </Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Digite seu nome completo"
                                            className="mt-2 h-11 focus:outline-none focus:ring-0 focus:border-black"
                                            style={{ boxShadow: 'none' }}
                                            required
                                        />
                                    </div>

                                    {/* Email (read-only) */}
                                    <div>
                                        <Label htmlFor="email" className="text-gray-900 font-medium text-sm">
                                            {t.profile.email}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="mt-2 h-11 bg-gray-50 cursor-not-allowed text-gray-500 focus:outline-none focus:ring-0"
                                            style={{ boxShadow: 'none' }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            {t.profile.emailReadonly}
                                        </p>
                                    </div>
                                </div>
                                {/* Row 2: Company and Language */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Company */}
                                    <div>
                                        <Label htmlFor="company" className="text-gray-900 font-medium text-sm">
                                            {t.profile.company}
                                        </Label>
                                        <Input
                                            id="company"
                                            type="text"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="Digite o nome da sua empresa"
                                            className="mt-2 h-12 focus:outline-none focus:ring-0 focus:border-black"
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>

                                    {/* Language Selector */}
                                    <div>
                                        <Label htmlFor="language" className="text-gray-900 font-medium text-sm">
                                            {t.profile.language}
                                        </Label>
                                        <div className="mt-2">
                                            <LanguageSelector
                                                selectedLanguage={localLanguage}
                                                onSelectLanguage={(lang) => setLocalLanguage(lang as any)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Password Section */}
                        {!loading && (
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-base font-semibold text-gray-900 mb-4">{t.profile.security}</h3>
                                <div>
                                    <Label htmlFor="password" className="text-gray-900 font-medium text-sm">
                                        {t.profile.password}
                                    </Label>
                                    {hasPassword ? (
                                    <>
                                        <div className="relative mt-2">
                                            <Input
                                                id="password"
                                                type="text"
                                                value={showPassword ? actualPassword : '••••••••••'}
                                                readOnly
                                                className="h-11 pr-10 focus:outline-none focus:ring-0 focus:border-black cursor-default text-gray-500"
                                                style={{
                                                    boxShadow: 'none',
                                                    letterSpacing: showPassword ? 'normal' : '3px',
                                                    fontSize: showPassword ? '14px' : '18px'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (showPassword) {
                                                        setShowPassword(false)
                                                        setActualPassword('')
                                                    } else {
                                                        setShowVerifyDialog(true)
                                                    }
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowResetDialog(true)}
                                            className="text-sm text-blue-800 hover:text-blue-900 mt-2 cursor-pointer"
                                        >
                                            {t.profile.resetPassword}
                                        </button>
                                    </>
                                ) : (
                                    <div className="mt-2">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <p className="text-sm text-gray-600 mb-3">
                                                {t.profile.googleUserMessage}
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => setShowResetDialog(true)}
                                                variant="outline"
                                                className="h-10 w-full"
                                            >
                                                {t.profile.definePassword}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6">
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="h-11 px-8 bg-black text-white hover:bg-gray-800 transition-colors"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t.common.saving}
                                        </>
                                    ) : loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t.common.loading}
                                        </>
                                    ) : (
                                        t.common.save
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Danger Zone - Delete Account */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-red-900 mb-2">
                                {t.profile.dangerZone}
                            </h3>
                            <p className="text-sm text-red-700 mb-4">
                                {t.profile.dangerZoneMessage}
                            </p>
                            <Button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                variant="outline"
                                className="h-10 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-400"
                            >
                                {t.profile.deleteAccount}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Verify Password Dialog */}
            <Dialog open={showVerifyDialog} onOpenChange={(open) => {
                setShowVerifyDialog(open)
                if (!open) {
                    setVerifyPassword('')
                    setShowVerifyPassword(false)
                    setError('')
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Verificar Senha</DialogTitle>
                        <DialogDescription>
                            Digite sua senha atual para visualizá-la
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="verifyPassword" className="text-gray-900 font-medium text-sm">
                                Senha Atual
                            </Label>
                            <div className="relative mt-2">
                                <Input
                                    id="verifyPassword"
                                    type={showVerifyPassword ? "text" : "password"}
                                    value={verifyPassword}
                                    onChange={(e) => setVerifyPassword(e.target.value)}
                                    placeholder="Digite sua senha"
                                    className="h-11 pr-10 focus:outline-none focus:ring-0 focus:border-black"
                                    style={{ boxShadow: 'none' }}
                                    disabled={verifying}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleVerifyPassword()
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                    disabled={verifying}
                                >
                                    {showVerifyPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowVerifyDialog(false)
                                    setVerifyPassword('')
                                    setShowVerifyPassword(false)
                                    setError('')
                                }}
                                disabled={verifying}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleVerifyPassword}
                                disabled={!verifyPassword || verifying}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Verificar'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={showResetDialog} onOpenChange={(open) => {
                setShowResetDialog(open)
                if (!open) {
                    setSuccess('')
                    setError('')
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{hasPassword ? 'Redefinir Senha' : 'Definir Senha'}</DialogTitle>
                        <DialogDescription>
                            {hasPassword
                                ? 'Você receberá um link de redefinição de senha no seu email. Por segurança, este link expira em 1 hora.'
                                : 'Receba um link por email para definir sua senha. Este link expira em 1 hora.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {/* Success Message dentro do dialog */}
                        {success && (
                            <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-800 text-sm">
                                <p className="font-medium">{success}</p>
                                <p className="text-xs mt-1">{t.profile.checkYourEmail}</p>
                            </div>
                        )}

                        {/* Error Message dentro do dialog */}
                        {error && (
                            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowResetDialog(false)
                                    setSuccess('')
                                    setError('')
                                }}
                                disabled={sendingReset}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={sendingReset || !!success}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                {sendingReset ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : success ? (
                                    'Link Enviado'
                                ) : (
                                    'Enviar Link'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-900">Excluir Conta</DialogTitle>
                        <DialogDescription>
                            Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão excluídos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="deleteConfirmation" className="text-gray-900 font-medium text-sm">
                                Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar
                            </Label>
                            <Input
                                id="deleteConfirmation"
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="EXCLUIR"
                                className="mt-2 h-11 focus:outline-none focus:ring-0 focus:border-red-500"
                                style={{ boxShadow: 'none' }}
                                disabled={deleting}
                            />
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                                <strong>Atenção:</strong> Esta ação irá excluir permanentemente:
                            </p>
                            <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                                <li>Seu perfil e informações pessoais</li>
                                <li>Suas reuniões agendadas</li>
                                <li>Todos os seus dados associados</li>
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteDialog(false)
                                    setDeleteConfirmation('')
                                }}
                                disabled={deleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmation !== 'EXCLUIR' || deleting}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Excluindo...
                                    </>
                                ) : (
                                    'Excluir Conta Permanentemente'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

