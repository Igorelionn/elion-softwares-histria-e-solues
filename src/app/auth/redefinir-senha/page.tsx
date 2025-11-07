"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Elion Softwares"
              width={140}
              height={43}
              className="h-6 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Redefinir Senha
          </h1>
          <p className="text-sm text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Senha Redefinida com Sucesso!
            </h2>
            <p className="text-gray-600 mb-4">
              Você será redirecionado em alguns segundos...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-transparent focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-transparent focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-12 cursor-pointer mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </div>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

