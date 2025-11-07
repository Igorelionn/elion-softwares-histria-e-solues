"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Verificar se há um hash de recuperação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    
    if (type !== 'recovery') {
      setError("Link de redefinição inválido ou expirado.")
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setIsLoading(false)
      return
    }

    // Validação básica de força da senha
    const weakPasswords = ['123456', 'password', '12345678', 'qwerty', 'abc123', '111111', '123123']
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      setError("Esta senha é muito fraca e fácil de adivinhar. Por favor, escolha uma senha mais segura.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // Traduzir mensagens de erro do Supabase
        if (error.message.includes('weak') || error.message.includes('easy to guess')) {
          throw new Error("Esta senha é muito fraca e fácil de adivinhar. Por favor, escolha uma senha mais segura.")
        }
        throw error
      }

      setSuccess(true)
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/perfil')
      }, 3000)
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err)
      
      // Traduzir mensagens comuns do Supabase
      let errorMessage = err.message || "Erro ao redefinir senha"
      
      if (errorMessage.includes('weak') || errorMessage.includes('easy to guess')) {
        errorMessage = "Esta senha é muito fraca e fácil de adivinhar. Por favor, escolha uma senha mais segura."
      } else if (errorMessage.includes('Password should be')) {
        errorMessage = "A senha deve ter no mínimo 6 caracteres"
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        errorMessage = "Link de redefinição inválido ou expirado. Solicite um novo link."
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-xl w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Senha Redefinida com Sucesso!
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Sua senha foi redefinida com sucesso.
          </p>
          <p className="text-gray-500 text-base mb-8">
            Você será redirecionado para seu perfil em alguns segundos...
          </p>
          <Button
            onClick={() => router.push('/perfil')}
            className="h-14 px-8 text-base bg-green-600 text-white hover:bg-green-700"
          >
            Ir para Perfil Agora
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-16 p-8">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-36 h-36 mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="Elion Softwares"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Redefinir Senha
          </h1>
          <p className="text-gray-600 text-base">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* New Password */}
          <div>
            <Label htmlFor="newPassword" className="text-gray-900 font-medium text-sm mb-1.5 block">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="h-10 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-2 border-gray-200"
                style={{ boxShadow: 'none' }}
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-900 font-medium text-sm mb-1.5 block">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="h-10 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-2 border-gray-200"
                style={{ boxShadow: 'none' }}
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-black text-white hover:bg-gray-800 mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redefinindo senha...
              </div>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

