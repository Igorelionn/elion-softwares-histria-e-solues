'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TermosDeServicoPage() {
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
            Termos de Serviço
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
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Aceitação dos Termos</h2>
            <p className="text-white/60 leading-relaxed">
              Ao utilizar os serviços da Elion Softwares, você concorda com estes termos. Se não concordar, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Serviços Oferecidos</h2>
            <p className="text-white/60 leading-relaxed">
              Desenvolvemos soluções de software sob medida, incluindo aplicações web, mobile, consultoria tecnológica e manutenção de sistemas.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Uso Adequado</h2>
            <p className="text-white/60 leading-relaxed">
              Você deve utilizar nossos serviços de forma legal e ética, respeitando as leis aplicáveis e os direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Propriedade Intelectual</h2>
            <p className="text-white/60 leading-relaxed">
              Todo conteúdo e propriedade intelectual dos nossos serviços pertencem à Elion Softwares, salvo acordo específico em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Responsabilidades</h2>
            <p className="text-white/60 leading-relaxed">
              Você é responsável pela segurança de sua conta e pelas atividades realizadas através dela.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Limitação de Responsabilidade</h2>
            <p className="text-white/60 leading-relaxed">
              A Elion Softwares não se responsabiliza por danos indiretos decorrentes do uso ou impossibilidade de uso dos serviços, na extensão máxima permitida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Alterações</h2>
            <p className="text-white/60 leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas previamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Lei Aplicável</h2>
            <p className="text-white/60 leading-relaxed">
              Estes termos são regidos pelas leis brasileiras, com jurisdição no foro da comarca de Maceió, Alagoas.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Contato</h2>
            <p className="text-white/60 leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato através do e-mail{' '}
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
