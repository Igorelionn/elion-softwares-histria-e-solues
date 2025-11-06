'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/contexts/LanguageContext'

interface BlockDetails {
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
  blocked_by_email: string | null
  blocked_by_name: string | null
}

export default function ContaBloqueadaPage() {
  const router = useRouter()
  const { language, t } = useTranslation()
  const [blockDetails, setBlockDetails] = useState<BlockDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        // Salvar email do usuário antes de qualquer ação
        if (session?.user?.email) {
          setUserEmail(session.user.email)
        }

        // Sempre mostrar a página, mesmo sem sessão
        if (!session?.user) {
          console.log('✅ Sem sessão - usuário foi deslogado automaticamente')
          setLoading(false)
          return
        }

        // Buscar detalhes do bloqueio
        // @ts-ignore - RPC function not in generated types
        const { data, error } = await (supabase as any)
          .rpc('get_user_block_details', { user_id_param: session.user.id })

        if (error) {
          console.error('⚠️ Erro ao buscar detalhes do bloqueio:', error)
          setBlockDetails({
            is_blocked: true,
            blocked_reason: null,
            blocked_at: null,
            blocked_by_email: null,
            blocked_by_name: null
          })
        } else if (data && data.length > 0) {
          const blockInfo = data[0] as BlockDetails

          if (!blockInfo.is_blocked) {
            console.log('✅ Usuário não está bloqueado, redirecionando...')
            setTimeout(() => router.push('/'), 1000)
            return
          }

          setBlockDetails(blockInfo)
        } else {
          setBlockDetails({
            is_blocked: true,
            blocked_reason: null,
            blocked_at: null,
            blocked_by_email: null,
            blocked_by_name: null
          })
        }
      } catch (err) {
        console.error('❌ Erro inesperado:', err)
        setBlockDetails({
          is_blocked: true,
          blocked_reason: null,
          blocked_at: null,
          blocked_by_email: null,
          blocked_by_name: null
        })
      } finally {
        setLoading(false)
      }
    }

    checkBlockStatus()
  }, [router])

  const handleBackHome = async () => {
    try {
      await supabase.auth.signOut()
      console.log('✅ Logout realizado com sucesso')
    } catch (err) {
      console.error('⚠️ Erro ao fazer logout:', err)
    } finally {
      // Usar replace para evitar página branca no histórico
      window.location.replace('/')
    }
  }

  const handleContactSupport = () => {
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=oficialelionsoftwares@gmail.com&su=Contestação de Bloqueio de Conta', '_blank')
  }

  if (loading) {
    setTimeout(() => setLoading(false), 2000)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-gray-200 border-t-gray-600 rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar Minimalista */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Image
              src="/logo.png"
              alt="Elion Softwares"
              width={180}
              height={45}
              className="h-4 w-auto"
              quality={100}
              priority
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackHome}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.blocked.backToHome}
            </Button>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12">
        <div className="max-w-lg w-full space-y-8">

          {/* Ícone Vermelho (sem círculo) */}
          <div className="flex justify-center">
            <ShieldX className="h-20 w-20 text-red-600" strokeWidth={1.5} />
          </div>

          {/* Título */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
              {t.blocked.title}
            </h1>

            {userEmail && (
              <p className="text-base text-gray-600">
                {t.blocked.yourAccount}{' '}
                <span className="font-semibold text-gray-900">{userEmail}</span>{' '}
                {t.blocked.wasBlocked}
              </p>
            )}
          </div>

          {/* Motivo */}
          {(blockDetails?.blocked_reason || blockDetails) && (
            <div className="bg-gray-50 border-l-4 border-gray-300 p-5 rounded-r-lg">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {t.blocked.reason}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {blockDetails?.blocked_reason || t.blocked.defaultReason}
              </p>
            </div>
          )}

          {/* Detalhes */}
          {(blockDetails?.blocked_at || blockDetails?.blocked_by_name) && (
            <div className="space-y-3 text-sm">
              {blockDetails?.blocked_at && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">{t.blocked.blockedAt}</span>
                  <span className="text-gray-900 font-semibold">
                    {new Date(blockDetails.blocked_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {blockDetails?.blocked_by_name && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">{t.blocked.blockedBy}</span>
                  <span className="text-gray-900 font-semibold">{blockDetails.blocked_by_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Ajuda */}
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {t.blocked.needHelp}
            </p>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {t.blocked.helpMessage}
            </p>
            <button
              onClick={handleContactSupport}
              className="text-sm text-gray-900 font-semibold hover:text-gray-700 hover:underline transition-colors cursor-pointer"
            >
              oficialelionsoftwares@gmail.com
            </button>
          </div>

          {/* Botões */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleBackHome}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:bg-gray-100 text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.blocked.backToHome}
            </Button>
            <Button
              onClick={handleContactSupport}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm"
            >
              {t.blocked.contactSupport}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
