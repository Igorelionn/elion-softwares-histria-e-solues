'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function RedefinirSenhaPage() {
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
        // Check if we have a valid session (user clicked the link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            
            // Check for error or access_token in URL (from email link)
            const error_code = searchParams.get('error_code')
            const error_description = searchParams.get('error_description')
            
            if (error_code) {
                setError(decodeURIComponent(error_description || 'Link inválido ou expirado'))
                setValidatingToken(false)
                return
            }

            if (!session) {
                setError('Link inválido ou expirado. Solicite um novo link de redefinição.')
                setValidatingToken(false)
                return
            }

            setValidatingToken(false)
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-4" />
                    <p className="text-gray-600">Validando link...</p>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Senha Redefinida com Sucesso!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Você será redirecionado para a página inicial em alguns segundos...
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        Ir para Página Inicial
                    </Button>
                </div>
            </div>
        )
    }

    if (error && !validatingToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Link Inválido ou Expirado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error}
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-black text-white hover:bg-gray-800"
                    >
                        Voltar para Página Inicial
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative w-32 h-32 mx-auto mb-4">
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
                    <p className="text-gray-600">
                        Digite sua nova senha abaixo
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div>
                        <Label htmlFor="newPassword" className="text-gray-900 font-medium text-sm">
                            Nova Senha
                        </Label>
                        <div className="relative mt-2">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite sua nova senha"
                                className="h-11 pr-10 focus:outline-none focus:ring-0 focus:border-black"
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
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Mínimo de 6 caracteres
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <Label htmlFor="confirmPassword" className="text-gray-900 font-medium text-sm">
                            Confirmar Nova Senha
                        </Label>
                        <div className="relative mt-2">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite sua nova senha novamente"
                                className="h-11 pr-10 focus:outline-none focus:ring-0 focus:border-black"
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
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 rounded-lg text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full h-11 bg-black text-white hover:bg-gray-800 transition-colors"
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
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Voltar para página inicial
                    </button>
                </div>
            </div>
        </div>
    )
}


