'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black sticky top-0 z-50 border-b border-white/5">
        <div className="w-full px-6 sm:px-8 md:px-16 lg:px-24 py-8 md:py-10 flex items-center justify-between">
          <Link 
            href="/"
            className="text-white/60 hover:text-white text-sm md:text-base font-medium transition-colors"
          >
            ← Voltar
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-white.png" alt="Elion Softwares" className="h-5 md:h-6" />
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-white/40 text-sm">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-10 md:space-y-12"
        >
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Coleta de Dados</h2>
            <p className="text-white/60 leading-relaxed">
              Coletamos informações necessárias para prestar nossos serviços, incluindo dados de contato e informações técnicas para melhorar sua experiência.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Uso das Informações</h2>
            <p className="text-white/60 leading-relaxed">
              Utilizamos seus dados exclusivamente para fornecer, operar e aprimorar nossos serviços, responder solicitações e manter comunicação relevante.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Proteção de Dados</h2>
            <p className="text-white/60 leading-relaxed">
              Implementamos medidas de segurança rigorosas em conformidade com a LGPD para proteger suas informações pessoais contra acesso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Compartilhamento</h2>
            <p className="text-white/60 leading-relaxed">
              Não vendemos suas informações. Compartilhamos dados apenas quando necessário para prestação de serviços ou mediante requisitos legais.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Seus Direitos</h2>
            <p className="text-white/60 leading-relaxed">
              Você possui direito de acessar, corrigir, excluir ou solicitar a portabilidade de seus dados pessoais, conforme estabelecido pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p className="text-white/60 leading-relaxed">
              Utilizamos cookies para melhorar a funcionalidade do site. Você pode configurar seu navegador para recusar cookies, porém isso pode afetar certas funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Contato</h2>
            <p className="text-white/60 leading-relaxed">
              Para questões sobre privacidade ou exercer seus direitos, entre em contato através do e-mail{' '}
              <a href="mailto:oficialelionsoftwares@gmail.com" className="text-white/80 hover:text-white transition-colors underline">
                oficialelionsoftwares@gmail.com
              </a>
            </p>
          </section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-white/10 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center text-white/60 hover:text-white transition-colors text-sm"
          >
            ← Voltar para a página inicial
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
