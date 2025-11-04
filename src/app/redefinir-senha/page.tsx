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
                // Verificar se há um erro nos parâmetros da URL
                const error_code = searchParams.get('error_code')
                const error_description = searchParams.get('error_description')
                
                if (error_code) {
                    setError(decodeURIComponent(error_description || 'Link inválido ou expirado'))
                    setValidatingToken(false)
                    return
                }

                // Verificar se há um token de recuperação na URL (type=recovery)
                const type = searchParams.get('type')
                const access_token = searchParams.get('access_token')
                
                if (type === 'recovery' && access_token) {
                    // Token válido do email, permitir redefinição
                    setValidatingToken(false)
                    return
                }

                // Se não há token de recovery, verificar sessão normal
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                if (sessionError) {
                    console.error('Session error:', sessionError)
                    setError('Erro ao validar sessão. Tente novamente.')
                    setValidatingToken(false)
                    return
                }

                if (!session && !access_token) {
                    setError('Link inválido ou expirado. Solicite um novo link de redefinição.')
                    setValidatingToken(false)
                    return
                }

                setValidatingToken(false)
            } catch (err) {
                console.error('Error checking session:', err)
                setError('Erro ao validar link. Tente novamente.')
                setValidatingToken(false)
            }
        }

        checkSession()
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
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setSuccess(true)
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } catch (err: any) {
            console.error('Error updating password:', err)
            setError(err.message || 'Erro ao redefinir senha')
        } finally {
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
                <div className="max-w-2xl w-full text-center">
                    <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Senha Redefinida com Sucesso!
                    </h1>
                    <p className="text-gray-600 text-lg mb-8">
                        Você será redirecionado para a página inicial em alguns segundos...
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="h-14 px-8 text-base bg-green-600 text-white hover:bg-green-700"
                    >
                        Ir para Página Inicial
                    </Button>
                </div>
            </div>
        )
    }

    if (error && !validatingToken) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="max-w-2xl w-full text-center">
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
            <div className="max-w-2xl w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative w-48 h-48 mx-auto mb-4">
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password */}
                    <div>
                        <Label htmlFor="newPassword" className="text-gray-900 font-medium text-sm mb-2 block">
                            Nova Senha
                        </Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite sua nova senha"
                                className="h-12 text-base pr-12 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-2 border-gray-200"
                                style={{ boxShadow: 'none' }}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Mínimo de 6 caracteres
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <Label htmlFor="confirmPassword" className="text-gray-900 font-medium text-sm mb-2 block">
                            Confirmar Nova Senha
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite sua nova senha novamente"
                                className="h-12 text-base pr-12 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-2 border-gray-200"
                                style={{ boxShadow: 'none' }}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full h-12 text-base bg-black text-white hover:bg-gray-800 transition-colors font-medium"
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
