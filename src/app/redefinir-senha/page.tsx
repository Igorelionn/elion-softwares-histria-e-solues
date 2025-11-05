'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

function RedefinirSenhaContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [validatingToken, setValidatingToken] = useState(true)

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Obter hash da URL
                const hash = window.location.hash
                
                // Parse hash parameters (Supabase coloca erros no hash)
                const hashParams = new URLSearchParams(hash.substring(1))
                const hashError = hashParams.get('error')
                const hashErrorCode = hashParams.get('error_code')
                const hashErrorDescription = hashParams.get('error_description')
                const hashAccessToken = hashParams.get('access_token')
                
                // Verificar se há erro no hash
                if (hashError || hashErrorCode) {
                    let errorMessage = 'Link inválido ou expirado'
                    
                    if (hashErrorCode === 'otp_expired' || hashErrorDescription?.includes('expired')) {
                        errorMessage = 'Este link de redefinição expirou. Links de redefinição são válidos por 1 hora. Por favor, solicite um novo link.'
                    } else if (hashErrorDescription) {
                        errorMessage = decodeURIComponent(hashErrorDescription)
                    }
                    
                    setError(errorMessage)
                    setValidatingToken(false)
                    return
                }
                
                // Verificar se há access_token no hash (token válido)
                if (hashAccessToken) {
                    setValidatingToken(false)
                    return
                }
                
                // Verificar query params também (fallback)
                const type = searchParams.get('type')
                const access_token = searchParams.get('access_token')
                const error_code = searchParams.get('error_code')
                const error_description = searchParams.get('error_description')
                
                // Verificar erro nos query params
                if (error_code) {
                    setError(decodeURIComponent(error_description || 'Link inválido ou expirado'))
                    setValidatingToken(false)
                    return
                }

                // Verificar token nos query params
                if (type === 'recovery' && access_token) {
                    setValidatingToken(false)
                    return
                }

                // Verificar sessão existente
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                if (sessionError) {
                    setError('Erro ao validar sessão. Tente novamente.')
                    setValidatingToken(false)
                    return
                }

                if (session) {
                    setValidatingToken(false)
                    return
                }

                // Se chegou aqui, não há token nem sessão válida
                setError('Link inválido ou expirado. Solicite um novo link de redefinição.')
                setValidatingToken(false)
            } catch (err) {
                setError('Erro ao validar link. Tente novamente.')
                setValidatingToken(false)
            }
        }

        // Delay de 500ms para garantir que a URL está completamente carregada
        const timer = setTimeout(() => {
            checkSession()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
                throw new Error('Erro ao validar sessão. Tente novamente.')
            }

            if (!session) {
                throw new Error('Sessão expirada. Solicite um novo link de redefinição.')
            }

            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) {
                // Detectar se o erro é de senha duplicada
                if (error.message?.toLowerCase().includes('same') || 
                    error.message?.toLowerCase().includes('password') ||
                    error.status === 422) {
                    throw new Error('A nova senha não pode ser igual à senha anterior. Por favor, escolha uma senha diferente.')
                }
                throw error
            }

            // Sucesso - desativar loading antes de mostrar tela de sucesso
            setLoading(false)
            setSuccess(true)
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } catch (err: any) {
            // Tratamento específico para mensagens de erro do Supabase
            let errorMessage = err.message || 'Erro ao redefinir senha'
            
            // Se a mensagem contém "same password", tratar especificamente
            if (errorMessage.toLowerCase().includes('same') || errorMessage.toLowerCase().includes('identical')) {
                errorMessage = 'A nova senha não pode ser igual à senha anterior. Por favor, escolha uma senha diferente.'
            }
            
            setError(errorMessage)
            setLoading(false)
        }
    }

    if (validatingToken) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-black mb-6" />
                    <p className="text-gray-600 text-lg">Validando link...</p>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="max-w-xl w-full text-center">
                    <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Senha Alterada com Sucesso!
                    </h1>
                    <p className="text-gray-600 text-lg mb-4">
                        Sua senha foi redefinida com sucesso.
                    </p>
                    <p className="text-gray-500 text-base mb-8">
                        Você será redirecionado para a página inicial em alguns segundos...
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="h-14 px-8 text-base bg-green-600 text-white hover:bg-green-700"
                    >
                        Ir para Página Inicial Agora
                    </Button>
                </div>
            </div>
        )
    }

    if (error && !validatingToken) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="max-w-xl w-full text-center">
                    <XCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Link Inválido ou Expirado
                    </h1>
                    <p className="text-gray-600 text-lg mb-8">
                        {error}
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="h-14 px-8 text-base bg-black text-white hover:bg-gray-800"
                    >
                        Voltar para Página Inicial
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

                <form onSubmit={handleSubmit} className="space-y-4">
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
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Mínimo de 6 caracteres
                        </p>
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
                                placeholder="Digite sua nova senha novamente"
                                className="h-10 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-2 border-gray-200"
                                style={{ boxShadow: 'none' }}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full h-10 text-sm bg-black text-white hover:bg-gray-800 transition-colors font-medium rounded-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Redefinindo...
                            </>
                        ) : (
                            'Redefinir Senha'
                        )}
                    </Button>
                </form>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
                    >
                        Voltar para página inicial
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function RedefinirSenhaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-black mb-6" />
                    <p className="text-gray-600 text-lg">Carregando...</p>
                </div>
            </div>
        }>
            <RedefinirSenhaContent />
        </Suspense>
    )
}
