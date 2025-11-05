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
                console.log('🔍 Checking session...')
                console.log('URL params:', {
                    type: searchParams.get('type'),
                    error_code: searchParams.get('error_code'),
                    access_token: searchParams.get('access_token') ? 'present' : 'missing'
                })

                // Verificar se há um erro nos parâmetros da URL
                const error_code = searchParams.get('error_code')
                const error_description = searchParams.get('error_description')
                
                if (error_code) {
                    console.error('❌ Error in URL:', error_code)
                    setError(decodeURIComponent(error_description || 'Link inválido ou expirado'))
                    setValidatingToken(false)
                    return
                }

                // Verificar se há um token de recuperação na URL
                const type = searchParams.get('type')
                const access_token = searchParams.get('access_token')
                const hash = window.location.hash
                
                console.log('Hash:', hash)

                // Verificar se há token no hash (formato antigo do Supabase)
                if (hash.includes('access_token')) {
                    console.log('✅ Token found in hash')
                    setValidatingToken(false)
                    return
                }

                // Verificar se há token nos query params
                if (type === 'recovery' && access_token) {
                    console.log('✅ Recovery token found in params')
                    setValidatingToken(false)
                    return
                }

                // Verificar sessão
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                console.log('Session:', session ? 'present' : 'missing')
                
                if (sessionError) {
                    console.error('❌ Session error:', sessionError)
                    setError('Erro ao validar sessão. Tente novamente.')
                    setValidatingToken(false)
                    return
                }

                if (session) {
                    console.log('✅ Valid session found')
                    setValidatingToken(false)
                    return
                }

                // Se chegou aqui, não há token nem sessão válida
                console.warn('⚠️ No valid token or session found')
                setError('Link inválido ou expirado. Solicite um novo link de redefinição.')
                setValidatingToken(false)
            } catch (err) {
                console.error('❌ Error checking session:', err)
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
        
        console.log('🚀 SUBMIT INICIADO')
        console.log('Senha nova:', newPassword ? `${newPassword.length} caracteres` : 'vazia')
        console.log('Confirmar senha:', confirmPassword ? `${confirmPassword.length} caracteres` : 'vazia')
        
        if (newPassword !== confirmPassword) {
            console.error('❌ Senhas não coincidem')
            setError('As senhas não coincidem')
            return
        }

        if (newPassword.length < 6) {
            console.error('❌ Senha muito curta')
            setError('A senha deve ter pelo menos 6 caracteres')
            return
        }

        console.log('✅ Validações passaram, iniciando atualização...')
        setLoading(true)
        setError('')

        try {
            console.log('📡 Verificando sessão antes de atualizar...')
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
                console.error('❌ Erro ao obter sessão:', sessionError)
                throw new Error('Erro ao validar sessão. Tente novamente.')
            }

            if (!session) {
                console.error('❌ Nenhuma sessão encontrada')
                throw new Error('Sessão expirada. Solicite um novo link de redefinição.')
            }

            console.log('✅ Sessão válida encontrada')
            console.log('📡 Chamando supabase.auth.updateUser...')
            
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            })

            console.log('📥 Resposta do updateUser:', { data, error })

            if (error) {
                console.error('❌ Erro do Supabase:', error)
                throw error
            }

            console.log('✅ Senha atualizada com sucesso!')
            setSuccess(true)
            
            // Redirect to login after 3 seconds
            console.log('⏱️ Redirecionando em 3 segundos...')
            setTimeout(() => {
                console.log('🔄 Redirecionando para home...')
                router.push('/')
            }, 3000)
        } catch (err: any) {
            console.error('❌ ERRO NO CATCH:', err)
            console.error('Mensagem:', err.message)
            console.error('Stack:', err.stack)
            setError(err.message || 'Erro ao redefinir senha')
        } finally {
            console.log('🏁 FINALLY: Resetando loading state')
            // Só reseta o loading se não foi sucesso
            if (!success) {
                setLoading(false)
            }
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
