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
import { checkUserBlockStatus } from '@/middleware/auth-check'

export default function PerfilPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isSavingRef = useRef(false)
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
        console.log('🚀 [PERFIL] useEffect montado')
        let isSubscribed = true
        
        const initProfile = async () => {
            console.log('🎬 [PERFIL] Iniciando initProfile, isSubscribed:', isSubscribed)
            if (isSubscribed) {
                await checkUser()
            }
        }
        
        initProfile()

        // Listener para mudanças de autenticação
        console.log('👂 [PERFIL] Registrando listener onAuthStateChange')
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 [PERFIL] Auth event recebido:', event, 'isSubscribed:', isSubscribed)
            
            if (!isSubscribed) return
            
            // Don't interfere during save operation
            if (isSavingRef.current && event === 'USER_UPDATED') {
                console.log('⏸️ [PERFIL] Ignorando USER_UPDATED durante save')
                return
            }

            if (event === 'SIGNED_OUT' || !session) {
                console.log('👋 [PERFIL] Usuário deslogado, redirecionando...')
                router.push('/')
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                console.log('✅ [PERFIL] SIGNED_IN/TOKEN_REFRESHED, recarregando perfil...')
                setUser(session.user)
                // Recarregar dados do perfil
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profile && isSubscribed) {
                    console.log('📥 [PERFIL] Perfil recarregado do evento:', profile)
                    setFullName(profile.full_name || session.user.user_metadata?.full_name || '')
                    setCompany(profile.company || '')
                    setAvatarUrl(profile.avatar_url || '')
                    
                    // @ts-ignore
                    if (profile.language && ['pt', 'en', 'es', 'fr', 'de', 'it', 'zh', 'ja'].includes(profile.language)) {
                        // @ts-ignore
                        setLocalLanguage(profile.language)
                    }
                }
                
                // Garantir que loading seja desativado
                if (isSubscribed) {
                    console.log('✅ [PERFIL] Desativando loading após evento')
                    setLoading(false)
                }
            } else if (event === 'USER_UPDATED') {
                console.log('🔄 [PERFIL] USER_UPDATED recebido')
                // Update user state but don't reload profile data to avoid conflicts
                if (session && isSubscribed) {
                    setUser(session.user)
                }
            }
        })

        // Listener para quando o usuário volta à aba
        const handleVisibilityChange = async () => {
            if (!document.hidden && isSubscribed) {
                // Usuário voltou à aba, revalidar sessão
                const { data: { session }, error } = await supabase.auth.getSession()
                
                if (error || !session) {
                    router.push('/')
                    return
                }

                // Atualizar usuário se mudou
                setUser(session.user)
                
                // Recarregar avatar caso tenha sido atualizado em outra aba
                const { data: profile } = await supabase
                    .from('users')
                    .select('avatar_url')
                    .eq('id', session.user.id)
                    .single()
                
                if (profile?.avatar_url !== avatarUrl && isSubscribed) {
                    setAvatarUrl(profile?.avatar_url || '')
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            isSubscribed = false
            subscription.unsubscribe()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [router])

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

    const checkUser = async () => {
        console.log('🔍 [PERFIL] Iniciando checkUser...')
        
        // Timeout de segurança para evitar loading infinito
        const timeoutId = setTimeout(() => {
            console.warn('⚠️ [PERFIL] Timeout ao carregar perfil - desativando loading')
            setLoading(false)
        }, 10000) // 10 segundos

        try {
            console.log('📡 [PERFIL] Buscando sessão...')
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
                console.error('❌ [PERFIL] Nenhuma sessão encontrada')
                clearTimeout(timeoutId)
                router.push('/')
                return
            }

            console.log('✅ [PERFIL] Sessão encontrada:', session.user.email)

            // Verificar se o usuário está bloqueado
            console.log('🔒 [PERFIL] Verificando status de bloqueio...')
            const blockStatus = await checkUserBlockStatus(session.user.id)
            console.log('📊 [PERFIL] Status de bloqueio:', blockStatus)
            
            if (blockStatus.isBlocked) {
                console.warn('⚠️ [PERFIL] Usuário bloqueado, redirecionando...')
                clearTimeout(timeoutId)
                await supabase.auth.signOut()
                router.push('/conta-bloqueada')
                return
            }

            console.log('✅ [PERFIL] Usuário não está bloqueado')
            setUser(session.user)
            
            // Check if user has password (email provider) or only OAuth (Google)
            const identities = session.user.identities || []
            const hasEmailIdentity = identities.some(identity => identity.provider === 'email')
            console.log('🔑 [PERFIL] Tem senha por email:', hasEmailIdentity)
            setHasPassword(hasEmailIdentity)
            
            // Load user profile data
            console.log('📡 [PERFIL] Carregando dados do perfil...')
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

            console.log('📥 [PERFIL] Resposta do perfil:', { profile, profileError })

            if (profile) {
                console.log('✅ [PERFIL] Perfil encontrado, atualizando estados...')
                setFullName(profile.full_name || session.user.user_metadata?.full_name || '')
                setCompany(profile.company || '')
                setAvatarUrl(profile.avatar_url || '')
                
                // Check if user is admin
                // @ts-ignore
                setIsAdmin(profile.role === 'admin')
                console.log('👤 [PERFIL] É admin:', profile.role === 'admin')
                
                // Load language preference and set both local and global
                // @ts-ignore - language column exists but not in current types
                if (profile.language && ['pt', 'en', 'es', 'fr', 'de', 'it', 'zh', 'ja'].includes(profile.language)) {
                    // @ts-ignore
                    setLocalLanguage(profile.language)
                    // @ts-ignore
                    setLanguage(profile.language)
                    console.log('🌐 [PERFIL] Idioma carregado:', profile.language)
                }
            } else {
                console.warn('⚠️ [PERFIL] Nenhum perfil encontrado, usando dados do user_metadata')
                setFullName(session.user.user_metadata?.full_name || '')
            }
            
            console.log('✅ [PERFIL] checkUser concluído com sucesso')
            clearTimeout(timeoutId)
        } catch (err) {
            console.error('❌ [PERFIL] Erro ao carregar perfil:', err)
            clearTimeout(timeoutId)
        } finally {
            console.log('🏁 [PERFIL] Desativando loading state')
            setLoading(false)
        }
    }

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
        console.log('🔑 [RESET] Iniciando handleResetPassword')
        console.log('📧 [RESET] Email do usuário:', user?.email)
        
        if (!user?.email) {
            console.error('❌ [RESET] Nenhum email encontrado')
            return
        }

        setSendingReset(true)
        setError('')

        try {
            console.log('📡 [RESET] Chamando resetPasswordForEmail...')
            console.log('🌐 [RESET] redirectTo:', `${window.location.origin}/redefinir-senha`)
            
            // Send password reset email (or set password email for Google users)
            // Note: Supabase has built-in rate limiting to prevent abuse
            const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(
                user.email,
                {
                    redirectTo: `${window.location.origin}/redefinir-senha`,
                }
            )

            console.log('📥 [RESET] Resposta do Supabase:', { data, resetError })

            if (resetError) {
                console.error('❌ [RESET] Erro do Supabase:', resetError)
                throw resetError
            }

            console.log('✅ [RESET] Email enviado com sucesso!')
            
            // Mostrar mensagem de sucesso e fechar dialog após 2 segundos
            const successMessage = hasPassword ? t.profile.resetEmailSent : t.profile.defineEmailSent
            console.log('💬 [RESET] Mensagem de sucesso:', successMessage)
            
            setSuccess(successMessage)
            
            // Aguardar 2 segundos antes de fechar para o usuário ver a mensagem
            setTimeout(() => {
                console.log('🔒 [RESET] Fechando dialog')
                setShowResetDialog(false)
            }, 2000)
            
        } catch (err: any) {
            console.error('❌ [RESET] Erro ao enviar link:', err)
            console.error('📄 [RESET] Mensagem de erro:', err.message)
            console.error('📊 [RESET] Status do erro:', err.status)
            
            // Tratar erro de rate limit de forma mais amigável
            if (err.status === 429 || err.message?.includes('rate limit')) {
                setError('Você solicitou muitos emails em pouco tempo. Por favor, aguarde alguns minutos e tente novamente.')
            } else {
                setError(err.message || 'Erro ao enviar link de redefinição')
            }
        } finally {
            console.log('🏁 [RESET] Finalizando handleResetPassword')
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
        
        if (!user) return
        
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) return

        isSavingRef.current = true
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            // Update users table
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    company: company,
                    language: localLanguage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            // Update global language
            setLanguage(localLanguage as any)

            // Set success message
            setSuccess(t.profile.profileUpdated)
        } catch (err: any) {
            console.error('Error updating profile:', err)
            setError(err.message || 'Erro ao atualizar perfil')
        } finally {
            // Always reset saving state
            isSavingRef.current = false
            setSaving(false)
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

