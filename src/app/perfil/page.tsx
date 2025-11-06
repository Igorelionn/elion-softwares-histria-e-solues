'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Camera, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useTranslation } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { useAuthState } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('PERFIL_PAGE')

export default function PerfilPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t, language, setLanguage } = useTranslation()
  
  // Consumir estados dos stores Zustand
  const { user, isLoading: authLoading } = useAuthState()
  const { 
    profile, 
    isLoading: profileLoading, 
    isSaving, 
    loadProfile, 
    updateProfile,
    error: profileError 
  } = useProfileStore()
  
  // Estados locais (apenas UI)
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [localLanguage, setLocalLanguage] = useState(language)
  
  // Estados de senha
  const [actualPassword, setActualPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyPassword, setVerifyPassword] = useState('')
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  
  // Estados de exclusão de conta
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // Estados de feedback
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Sincronizar erro do profileStore
  useEffect(() => {
    if (profileError) {
      setError(profileError)
      toast.error(profileError)
    }
  }, [profileError])
  
  // Verificar autenticação e carregar perfil
  useEffect(() => {
    log.info('Componente montado')
    
    if (!user) {
      log.warn('Sem usuário, redirecionando para home')
      router.push('/')
      return
    }
    
    // Carregar perfil do usuário
    log.info('Carregando perfil', { userId: user.id })
    loadProfile(user.id)
  }, [user, loadProfile, router])
  
  // Atualizar formulário quando perfil carregar
  useEffect(() => {
    if (profile) {
      log.debug('Perfil carregado, atualizando formulário')
      setFullName(profile.full_name || '')
      setCompany(profile.company || '')
      setAvatarUrl(profile.avatar_url || '')
      setIsAdmin(profile.role === 'admin')
      
      // Para usuários Google, priorizar avatar do Google
      if (user?.user_metadata?.avatar_url && user?.app_metadata?.provider === 'google') {
        setAvatarUrl(user.user_metadata.avatar_url)
      }
    }
  }, [profile, user])
  
  // Verificar se usuário tem senha ou apenas OAuth
  useEffect(() => {
    const checkPasswordExists = async () => {
      if (!user) return
      
      try {
        // Verificar se há provedores de identidade
        const identities = user?.identities || []
        const hasGoogleProvider = identities.some(id => id.provider === 'google')
        const hasEmailProvider = identities.some(id => id.provider === 'email')
        
        // Se tem Google mas não tem email provider, não tem senha
        setHasPassword(hasEmailProvider)
        
        log.debug('Status de senha', { 
          hasPassword: hasEmailProvider, 
          hasGoogle: hasGoogleProvider 
        })
      } catch (err) {
        log.error('Erro ao verificar senha', err)
      }
    }
    
    checkPasswordExists()
  }, [user])
  
  /**
   * Upload de avatar
   */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return
    
    const file = e.target.files[0]
    
    // Validações
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError('Imagem muito grande. Tamanho máximo: 5MB')
      toast.error('Imagem muito grande. Tamanho máximo: 5MB')
      return
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato inválido. Use: JPEG, PNG, WebP ou GIF')
      toast.error('Formato inválido. Use: JPEG, PNG, WebP ou GIF')
      return
    }
    
    setUploading(true)
    setError('')
    
    try {
      log.info('Fazendo upload de avatar', { fileSize: file.size, fileType: file.type })
      
      // Deletar avatar antigo se existir
      if (avatarUrl) {
        const oldFileName = avatarUrl.split('/').pop()
        if (oldFileName) {
          log.debug('Removendo avatar antigo', { fileName: oldFileName })
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${oldFileName}`])
        }
      }
      
      // Upload novo avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })
      
      if (uploadError) throw uploadError
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
      
      const newAvatarUrl = urlData.publicUrl
      setAvatarUrl(newAvatarUrl)
      
      log.success('Avatar enviado', { url: newAvatarUrl })
      toast.success('Foto de perfil atualizada!')
    } catch (err: any) {
      log.error('Erro ao fazer upload de avatar', err)
      setError('Erro ao enviar foto. Tente novamente.')
      toast.error('Erro ao enviar foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }
  
  /**
   * Salvar alterações do perfil
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !profile) {
      log.warn('Sem usuário ou perfil, cancelando save')
      toast.error('Erro: dados não carregados')
      return
    }
    
    // Não permitir salvar durante carregamento
    if (profileLoading) {
      log.warn('Perfil ainda carregando, aguarde')
      toast.warning('Aguarde o carregamento completo dos dados')
      return
    }
    
    setError('')
    setSuccess('')
    
    log.info('Salvando perfil')
    
    try {
      await updateProfile({
        full_name: fullName,
        company,
        avatar_url: avatarUrl,
      })
      
      log.success('Perfil salvo com sucesso')
      setSuccess('Perfil atualizado com sucesso!')
      toast.success('Perfil atualizado com sucesso!')
      
      // Limpar mensagem de sucesso após 3s
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      log.error('Erro ao salvar perfil', err)
      setError(err?.message || 'Erro ao salvar perfil')
      toast.error('Erro ao salvar perfil')
    }
  }
  
  /**
   * Verificar senha antes de mostrar
   */
  const handleVerifyPassword = async () => {
    if (!user || !verifyPassword) return
    
    setVerifying(true)
    setError('')
    
    try {
      log.info('Verificando senha')
      
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: verifyPassword
      })
      
      if (error) {
        log.warn('Senha incorreta')
        setError('Senha incorreta')
        toast.error('Senha incorreta')
        setVerifyPassword('')
        return
      }
      
      log.success('Senha verificada')
      setActualPassword(verifyPassword)
      setShowVerifyDialog(false)
      setVerifyPassword('')
      toast.success('Senha verificada!')
    } catch (err: any) {
      log.error('Erro ao verificar senha', err)
      setError('Erro ao verificar senha')
      toast.error('Erro ao verificar senha')
    } finally {
      setVerifying(false)
    }
  }
  
  /**
   * Enviar link de redefinição de senha
   */
  const handleSendResetLink = async () => {
    if (!user?.email) return
    
    setSendingReset(true)
    setError('')
    setSuccess('')
    
    try {
      log.info('Enviando link de redefinição de senha')
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/perfil`
      })
      
      if (error) throw error
      
      const successMessage = hasPassword 
        ? t.profile.resetEmailSent 
        : t.profile.defineEmailSent
      
      setSuccess(successMessage)
      toast.success(successMessage)
      
      log.success('Link enviado')
      
      setTimeout(() => {
        setShowResetDialog(false)
      }, 2000)
    } catch (err: any) {
      log.error('Erro ao enviar link', err)
      
      if (err.status === 429 || err.message?.includes('rate limit')) {
        setError('Você solicitou muitos emails em pouco tempo. Aguarde alguns minutos.')
        toast.error('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setError(err.message || 'Erro ao enviar link')
        toast.error('Erro ao enviar link')
      }
    } finally {
      setSendingReset(false)
    }
  }
  
  /**
   * Deletar conta
   */
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'EXCLUIR') return
    
    setDeleting(true)
    setError('')
    
    try {
      log.info('Deletando conta')
      
      // Deletar avatar se existir
      if (avatarUrl) {
        const fileName = avatarUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${fileName}`])
        }
      }
      
      // Deletar perfil do banco
      const { error: deleteProfileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)
      
      if (deleteProfileError) throw deleteProfileError
      
      // Deletar autenticação
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (deleteAuthError) {
        // @ts-ignore - delete_user function exists
        const { error: regularDeleteError } = await supabase.rpc('delete_user')
        if (regularDeleteError) throw regularDeleteError
      }
      
      log.success('Conta deletada')
      
      // Deslogar e redirecionar
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      log.error('Erro ao deletar conta', err)
      setError(err.message || 'Erro ao excluir conta. Entre em contato com o suporte.')
      toast.error('Erro ao excluir conta')
    } finally {
      setDeleting(false)
    }
  }
  
  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    )
  }
  
  // Not authenticated
  if (!user) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.common.back}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t.profile.title}</h1>
          <p className="text-gray-600 mt-2">{t.profile.subtitle}</p>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                    {fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Selecionar foto de perfil"
              />
            </div>
            
            <p className="text-sm text-gray-600">{t.profile.uploadPhoto}</p>
          </div>
          
          {/* Email (readonly) */}
          <div>
            <Label htmlFor="email">{t.profile.email}</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">{t.profile.fullName}</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          
          {/* Company */}
          <div>
            <Label htmlFor="company">{t.profile.company}</Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          
          {/* Language */}
          <div>
            <Label>{t.profile.language}</Label>
            <LanguageSelector />
          </div>
          
          {/* Password Section */}
          <div className="pt-6 border-t">
            <Label>{t.profile.password}</Label>
            
            {!hasPassword ? (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  {t.profile.noPasswordSet}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(true)}
                  className="w-full"
                >
                  {t.profile.definePassword}
                </Button>
              </div>
            ) : actualPassword ? (
              <div className="mt-2 relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={actualPassword}
                  disabled
                  className="bg-gray-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVerifyDialog(true)}
                  className="w-full"
                >
                  {t.profile.showPassword}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(true)}
                  className="w-full"
                >
                  {t.profile.resetPassword}
                </Button>
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <Button
            type="submit"
            disabled={isSaving || profileLoading}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.common.saving}
              </>
            ) : (
              t.common.save
            )}
          </Button>
          
          {/* Admin Panel Button */}
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin')}
              className="w-full"
            >
              {t.profile.adminPanel}
            </Button>
          )}
          
          {/* Delete Account */}
          <div className="pt-6 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              {t.profile.deleteAccount}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Verify Password Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.profile.verifyPassword}</DialogTitle>
            <DialogDescription>
              {t.profile.enterPasswordToView}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showVerifyPassword ? 'text' : 'password'}
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder={t.profile.password}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
              />
              <button
                type="button"
                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                title={showVerifyPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showVerifyPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyDialog(false)
                  setVerifyPassword('')
                }}
                className="flex-1"
              >
                {t.common.cancel}
              </Button>
              
              <Button
                onClick={handleVerifyPassword}
                disabled={!verifyPassword || verifying}
                className="flex-1"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.profile.verify
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasPassword ? t.profile.resetPassword : t.profile.definePassword}
            </DialogTitle>
            <DialogDescription>
              {hasPassword ? t.profile.resetPasswordDescription : t.profile.definePasswordDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t.profile.emailWillBeSent}: <strong>{user.email}</strong>
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="flex-1"
              >
                {t.common.cancel}
              </Button>
              
              <Button
                onClick={handleSendResetLink}
                disabled={sendingReset}
                className="flex-1"
              >
                {sendingReset ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.profile.sendLink
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t.profile.deleteAccount}</DialogTitle>
            <DialogDescription>
              {t.profile.deleteWarning}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{t.profile.typeToConfirm}</Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="EXCLUIR"
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirmation('')
                }}
                className="flex-1"
              >
                {t.common.cancel}
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'EXCLUIR' || deleting}
                className="flex-1"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.profile.confirmDelete
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
