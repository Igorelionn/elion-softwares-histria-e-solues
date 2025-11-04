import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Elion Softwares',
  description: 'Política de Privacidade da Elion Softwares',
}

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Política de Privacidade</h1>
          <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              A Elion Softwares está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você usa nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Podemos coletar os seguintes tipos de informações:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Informações de Identificação Pessoal:</strong> Nome, endereço de e-mail, número de telefone, empresa</li>
              <li><strong>Informações de Uso:</strong> Como você interage com nossos serviços, páginas visitadas, tempo gasto</li>
              <li><strong>Informações Técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional, dados de cookies</li>
              <li><strong>Informações de Comunicação:</strong> Mensagens que você nos envia através de formulários de contato</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Usamos as informações coletadas para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fornecer, operar e manter nossos serviços</li>
              <li>Melhorar, personalizar e expandir nossos serviços</li>
              <li>Entender e analisar como você usa nossos serviços</li>
              <li>Desenvolver novos produtos, serviços e recursos</li>
              <li>Comunicar-nos com você para atualizações, suporte e fins promocionais</li>
              <li>Processar suas transações e gerenciar pedidos</li>
              <li>Detectar e prevenir fraudes e atividades maliciosas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações nas seguintes situações:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Prestadores de Serviços:</strong> Com terceiros que prestam serviços em nosso nome (hospedagem, análise, pagamento)</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
              <li><strong>Consentimento:</strong> Com seu consentimento explícito para outros fins</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies e Tecnologias Semelhantes</h2>
            <p className="text-gray-700 leading-relaxed">
              Usamos cookies e tecnologias semelhantes para rastrear a atividade em nossos serviços e armazenar certas informações. Você pode instruir seu navegador a recusar todos os cookies ou a indicar quando um cookie está sendo enviado. No entanto, se você não aceitar cookies, pode não conseguir usar algumas partes de nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Segurança dos Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              A segurança de suas informações pessoais é importante para nós. Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Retemos suas informações pessoais apenas pelo tempo necessário para os fins estabelecidos nesta Política de Privacidade, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Seus Direitos de Privacidade</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Acessar e obter uma cópia de suas informações pessoais</li>
              <li>Retificar informações imprecisas ou incompletas</li>
              <li>Solicitar a exclusão de suas informações pessoais</li>
              <li>Opor-se ao processamento de suas informações pessoais</li>
              <li>Solicitar a portabilidade de seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacidade de Crianças</h2>
            <p className="text-gray-700 leading-relaxed">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças. Se tomarmos conhecimento de que coletamos informações de uma criança, tomaremos medidas para excluir essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Transferências Internacionais</h2>
            <p className="text-gray-700 leading-relaxed">
              Suas informações podem ser transferidas e mantidas em computadores localizados fora do seu estado, província, país ou outra jurisdição governamental onde as leis de proteção de dados podem ser diferentes. Tomaremos todas as medidas necessárias para garantir que seus dados sejam tratados com segurança.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Alterações a Esta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando a data de "Última atualização". Recomendamos que você revise esta Política de Privacidade periodicamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Se você tiver alguma dúvida sobre esta Política de Privacidade ou desejar exercer seus direitos de privacidade, entre em contato conosco através do nosso site ou por e-mail.
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

