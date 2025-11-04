import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço | Elion Softwares',
  description: 'Termos de Serviço da Elion Softwares',
}

export default function TermosDeServicoPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Termos de Serviço</h1>
          <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao acessar e usar os serviços da Elion Softwares, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição dos Serviços</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              A Elion Softwares oferece serviços de desenvolvimento de software, consultoria tecnológica e soluções personalizadas para empresas e indivíduos. Nossos serviços incluem, mas não se limitam a:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Desenvolvimento de aplicações web e mobile</li>
              <li>Consultoria em tecnologia e transformação digital</li>
              <li>Manutenção e suporte de sistemas</li>
              <li>Soluções personalizadas de software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso dos Serviços</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Você concorda em usar nossos serviços apenas para fins legais e de acordo com estes Termos. Você não deve:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Usar os serviços de qualquer forma que viole leis ou regulamentos aplicáveis</li>
              <li>Tentar obter acesso não autorizado a qualquer parte dos serviços</li>
              <li>Interferir ou interromper os serviços ou servidores conectados aos serviços</li>
              <li>Reproduzir, duplicar, copiar ou revender qualquer parte dos serviços sem permissão</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Propriedade Intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              Todo o conteúdo, recursos e propriedade intelectual relacionados aos nossos serviços são de propriedade da Elion Softwares ou de seus licenciadores. Você não pode copiar, modificar, distribuir ou criar trabalhos derivados sem nossa permissão expressa por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contas de Usuário</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao criar uma conta conosco, você é responsável por manter a segurança de sua conta e senha. Você é totalmente responsável por todas as atividades que ocorrem em sua conta. Você deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Pagamentos e Reembolsos</h2>
            <p className="text-gray-700 leading-relaxed">
              Os termos de pagamento e reembolso serão especificados em contratos individuais ou propostas de serviço. Os preços estão sujeitos a alterações, mas as alterações não afetarão pedidos já confirmados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed">
              Na extensão máxima permitida por lei, a Elion Softwares não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Modificações dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos você sobre alterações significativas por e-mail ou através de um aviso em nosso site. O uso continuado dos serviços após tais alterações constitui sua aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Rescisão</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos encerrar ou suspender seu acesso aos nossos serviços imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos de Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Lei Aplicável</h2>
            <p className="text-gray-700 leading-relaxed">
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições sobre conflitos de leis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Se você tiver alguma dúvida sobre estes Termos de Serviço, entre em contato conosco através do nosso site ou por e-mail.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Voltar para a página inicial
          </a>
        </div>
      </div>
    </div>
  )
}

