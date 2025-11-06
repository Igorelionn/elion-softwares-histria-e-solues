"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "login" | "signup"
  preventRedirect?: boolean
  redirectTo?: string
  onBeforeGoogleLogin?: () => void
}

export function AuthDialog({
  isOpen,
  onClose,
  defaultTab = "login",
  preventRedirect = false,
  redirectTo,
  onBeforeGoogleLogin
}: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Signup form state
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")

  // Update tab when defaultTab changes
  useState(() => {
    setActiveTab(defaultTab)
  })

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Auto-clear error messages after 7 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("")
      }, 7000)

      return () => clearTimeout(timer)
    }
  }, [error])

  // Auto-clear success messages after 7 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("")
      }, 7000)

      return () => clearTimeout(timer)
    }
  }, [success])

  const handleClose = () => {
    setError("")
    setSuccess("")
    onClose()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // PASSO 1: Verificar ANTES se o usuário pode fazer login
      // @ts-ignore - check_login_allowed RPC function exists in database
      const { data: checkData, error: checkError } = (await supabase
        // @ts-ignore
        .rpc('check_login_allowed', { user_email: loginEmail })) as {
          data: {
            allowed: boolean
            reason?: 'blocked' | 'deleted'
            message?: string
            blocked_reason?: string
            blocked_at?: string
          } | null
          error: any
        }

      if (checkError) {
        console.error('Erro ao verificar permissão de login:', checkError)
      }

      // Se não permitido, bloquear login
      if (checkData && !checkData.allowed) {
        if (checkData.reason === 'deleted') {
          throw new Error('Esta conta foi permanentemente excluída pelo administrador. Entre em contato com o suporte.')
        } else if (checkData.reason === 'blocked') {
          throw new Error(`Sua conta foi bloqueada. ${checkData.blocked_reason || 'Entre em contato com o suporte.'}`)
        }
      }

      // PASSO 2: Tentar autenticar
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) throw error

      // PASSO 3: Verificação adicional pós-login (segurança em camadas)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('is_blocked, blocked_reason')
        .eq('id', data.user?.id)
        .single() as { data: { is_blocked?: boolean; blocked_reason?: string } | null; error: any }

      // Se o usuário não existe no banco (foi deletado)
      if (profileError && profileError.code === 'PGRST116') {
        await supabase.auth.signOut()
        throw new Error('Sua conta foi removida do sistema.')
      }

      // Se o usuário está bloqueado (verificação secundária)
      if (!profileError && profile?.is_blocked) {
        await supabase.auth.signOut()
        throw new Error(`Sua conta foi bloqueada. ${profile.blocked_reason || 'Entre em contato com o suporte.'}`)
      }

      setSuccess("Login realizado com sucesso!")

      if (!preventRedirect) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        setTimeout(() => {
          handleClose()
        }, 500)
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError("Email ou senha incorretos.")
      } else if (err.message?.includes('Email not confirmed')) {
        setError("Por favor, confirme seu email antes de fazer login.")
      } else if (err.message?.includes('bloqueada') || err.message?.includes('bloqueado')) {
        setError(err.message)
      } else if (err.message?.includes('excluída') || err.message?.includes('removida')) {
        setError(err.message)
      } else {
        setError(err.message || "Erro ao fazer login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (signupPassword !== signupConfirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (signupPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (authError) throw authError

      // Nota: O perfil do usuário é criado automaticamente via Database Trigger
      // quando o usuário é inserido em auth.users

      // Verificar se confirmação de email é necessária
      const needsEmailConfirmation = authData.user && !authData.user.email_confirmed_at

      if (needsEmailConfirmation) {
        setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.")
      } else {
        setSuccess("Conta criada com sucesso!")
      }

      // Limpar campos
      setSignupName("")
      setSignupEmail("")
      setSignupPassword("")
      setSignupConfirmPassword("")

      if (!preventRedirect) {
        setTimeout(() => {
          setActiveTab("login")
          setSuccess("")
        }, 2000)
      } else {
        // Com preventRedirect, fecha mais rápido pois o pai vai lidar
        setTimeout(() => {
          handleClose()
        }, 500)
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      if (err.message?.includes('User already registered')) {
        setError("Este email já está cadastrado. Tente fazer login.")
      } else if (err.message?.includes('Password should be')) {
        setError("A senha deve ter no mínimo 6 caracteres.")
      } else {
        setError(err.message || "Erro ao criar conta")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    // Chamar callback antes do login com Google (para salvar dados do formulário)
    if (onBeforeGoogleLogin) {
      onBeforeGoogleLogin()
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo || `${window.location.origin}/`
        }
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google")
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-white/25 backdrop-blur-[2px] z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10 cursor-pointer"
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <Image
                      src="/logo.png"
                      alt="Elion Softwares"
                      width={140}
                      height={43}
                      className="h-6 w-auto"
                      priority
                    />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Entre ou crie sua conta para continuar
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
                  {/* Mensagens de erro/sucesso */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm"
                      >
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Tab */}
                  <TabsContent value="login" className="mt-6 space-y-4">
                    <motion.form
                      onSubmit={handleLogin}
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-gray-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-gray-700">
                          Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            <AnimatePresence mode="wait">
                              {showPassword ? (
                                <motion.svg
                                  key="eye-open"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-6 h-6"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M21.2572 10.9622C21.7314 11.5813 21.7314 12.4187 21.2572 13.0378C19.764 14.9868 16.1818 19 12 19C7.81823 19 4.23598 14.9868 2.74284 13.0378C2.26857 12.4187 2.26856 11.5813 2.74283 10.9622C4.23598 9.01321 7.81823 5 12 5C16.1818 5 19.764 9.01321 21.2572 10.9622Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </motion.svg>
                              ) : (
                                <motion.svg
                                  key="eye-closed"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-6 h-6"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                >
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10a13.358 13.358 0 0 0 3 2.685M21 10a13.358 13.358 0 0 1-3 2.685m-8 1.624L9.5 16.5m.5-2.19a10.59 10.59 0 0 0 4 0m-4 0a11.275 11.275 0 0 1-4-1.625m8 1.624.5 2.191m-.5-2.19a11.275 11.275 0 0 0 4-1.625m0 0 1.5 1.815M6 12.685 4.5 14.5"/>
                                </motion.svg>
                              )}
                            </AnimatePresence>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="peer border-gray-300 focus:outline-none focus:ring-0 cursor-pointer appearance-none border-2 hover:border-gray-400 checked:bg-slate-700 checked:border-slate-700 transition-colors w-[18px] h-[18px] rounded"
                            />
                            <svg
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none hidden peer-checked:block"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4 9L7.5 12.5L14 6"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600 leading-[18px]">Permanecer conectado</span>
                        </label>
                        <button
                          type="button"
                          className="text-sm text-blue-800 hover:text-blue-900 transition-colors cursor-pointer"
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-black text-white hover:bg-gray-800 h-12 cursor-pointer mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                    </motion.form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-gray-500">Ou continue com</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-12 rounded-full cursor-pointer"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Entrar com Google
                    </Button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                      Ainda não tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("signup")}
                        className="text-slate-700 font-semibold hover:text-slate-800 cursor-pointer transition-colors"
                      >
                        Cadastre-se
                      </button>
                    </p>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup" className="mt-6 space-y-4">
                    <motion.form
                      onSubmit={handleSignup}
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-gray-700">
                          Nome completo
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-gray-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-gray-700">
                          Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            <AnimatePresence mode="wait">
                              {showPassword ? (
                                <motion.svg
                                  key="eye-open"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-6 h-6"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M21.2572 10.9622C21.7314 11.5813 21.7314 12.4187 21.2572 13.0378C19.764 14.9868 16.1818 19 12 19C7.81823 19 4.23598 14.9868 2.74284 13.0378C2.26857 12.4187 2.26856 11.5813 2.74283 10.9622C4.23598 9.01321 7.81823 5 12 5C16.1818 5 19.764 9.01321 21.2572 10.9622Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </motion.svg>
                              ) : (
                                <motion.svg
                                  key="eye-closed"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-6 h-6"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                >
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10a13.358 13.358 0 0 0 3 2.685M21 10a13.358 13.358 0 0 1-3 2.685m-8 1.624L9.5 16.5m.5-2.19a10.59 10.59 0 0 0 4 0m-4 0a11.275 11.275 0 0 1-4-1.625m8 1.624.5 2.191m-.5-2.19a11.275 11.275 0 0 0 4-1.625m0 0 1.5 1.815M6 12.685 4.5 14.5"/>
                                </motion.svg>
                              )}
                            </AnimatePresence>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-gray-700">
                          Confirmar senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="signup-confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 cursor-text focus:border-black focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 h-11 shadow-none"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-black text-white hover:bg-gray-800 h-12 cursor-pointer mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>
                    </motion.form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-gray-500">Ou continue com</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-12 rounded-full cursor-pointer"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Cadastrar com Google
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-6">
                      Ao criar uma conta, você concorda com nossos{" "}
                      <a href="/termos-de-servico" target="_blank" className="text-gray-700 hover:text-black underline cursor-pointer">
                        Termos de Serviço
                      </a>{" "}
                      e{" "}
                      <a href="/politica-de-privacidade" target="_blank" className="text-gray-700 hover:text-black underline cursor-pointer">
                        Política de Privacidade
                      </a>
                      .
                    </p>

                    <p className="text-center text-sm text-gray-600 mt-4">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="text-slate-700 font-semibold hover:text-slate-800 cursor-pointer transition-colors"
                      >
                        Entrar
                      </button>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

