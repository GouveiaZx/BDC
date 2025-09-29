"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaRegFileAlt } from 'react-icons/fa';

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <div className="flex items-center mb-4">
            <FaRegFileAlt className="text-3xl text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Termos e Condições Gerais de Serviço</h1>
          </div>
          <p className="text-gray-600">
            Última atualização: Janeiro de 2025
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-6">
          <div className="prose prose-lg max-w-none text-gray-800">
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. DEFINIÇÕES</h2>
            <p className="mb-4 text-gray-700">
              Para os fins destes Termos e Condições Gerais de Serviço, aplicam-se as seguintes definições:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li><strong>Plataforma:</strong> O site BuscaAquiBDC e todos os seus serviços relacionados;</li>
              <li><strong>Usuário:</strong> Qualquer pessoa física ou jurídica que acesse ou utilize a Plataforma;</li>
              <li><strong>Anunciante:</strong> Usuário que publica anúncios na Plataforma;</li>
              <li><strong>Interessado:</strong> Usuário que busca produtos ou serviços na Plataforma;</li>
              <li><strong>Conteúdo:</strong> Qualquer informação, texto, imagem, vídeo ou dado inserido na Plataforma.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. ACEITAÇÃO DOS TERMOS</h2>
            <p className="mb-6 text-gray-700">
              Ao acessar e utilizar a Plataforma BuscaAquiBDC, você declara ter lido, compreendido e concordado integralmente com estes Termos e Condições Gerais de Serviço, bem como com nossa Política de Privacidade. Caso não concorde com qualquer disposição aqui estabelecida, você não deve utilizar nossos serviços.
            </p>
            <p className="mb-6 text-gray-700">
              Estes termos constituem um acordo legal vinculativo entre você e a BuscaAquiBDC. Reservamo-nos o direito de modificar estes termos a qualquer momento, sendo que as alterações entrarão em vigor imediatamente após sua publicação na Plataforma.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. DESCRIÇÃO DOS SERVIÇOS</h2>
            <p className="mb-4 text-gray-700">
              A BuscaAquiBDC é uma plataforma digital de classificados que conecta anunciantes e interessados em produtos e serviços diversos. Nossos serviços incluem:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Publicação de anúncios classificados;</li>
              <li>Sistema de busca e filtros avançados;</li>
              <li>Ferramentas de comunicação entre usuários;</li>
              <li>Recursos de destaque para anúncios;</li>
              <li>Planos de assinatura com benefícios adicionais;</li>
              <li>Sistema de avaliações e comentários;</li>
              <li>Suporte ao cliente.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. CADASTRO E CONTA DO USUÁRIO</h2>
            <p className="mb-4 text-gray-700">
              Para utilizar determinados recursos da Plataforma, é necessário criar uma conta fornecendo informações precisas, completas e atualizadas. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Notificar imediatamente sobre uso não autorizado de sua conta;</li>
              <li>Atualizar suas informações sempre que necessário;</li>
              <li>Garantir que possui capacidade legal para celebrar contratos;</li>
              <li>Não criar múltiplas contas sem autorização expressa.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Reservamo-nos o direito de suspender ou encerrar contas que contenham informações falsas, incompletas ou que violem estes termos.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. REGRAS PARA ANÚNCIOS</h2>
            <p className="mb-4 text-gray-700">
              Todos os anúncios publicados na Plataforma devem cumprir as seguintes diretrizes:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 Conteúdo Permitido</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Produtos e serviços legais e lícitos;</li>
              <li>Descrições verdadeiras e precisas;</li>
              <li>Imagens reais e atuais do produto/serviço;</li>
              <li>Preços claros e transparentes;</li>
              <li>Informações de contato válidas.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5.2 Conteúdo Proibido</h3>
            <p className="mb-2 text-gray-700">É expressamente proibido anunciar:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Produtos ilegais, roubados ou falsificados;</li>
              <li>Armas, munições e explosivos;</li>
              <li>Drogas ilícitas e medicamentos controlados;</li>
              <li>Serviços de natureza sexual ou adulta;</li>
              <li>Animais em extinção ou protegidos por lei;</li>
              <li>Produtos que violem direitos autorais;</li>
              <li>Esquemas de pirâmide ou marketing multinível;</li>
              <li>Conteúdo discriminatório, ofensivo ou difamatório.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. RESPONSABILIDADES DOS USUÁRIOS</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Anunciantes</h3>
            <p className="mb-2 text-gray-700">Os anunciantes são responsáveis por:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Garantir a veracidade de todas as informações fornecidas;</li>
              <li>Possuir legal propriedade ou autorização para vender os itens anunciados;</li>
              <li>Cumprir todas as leis aplicáveis à venda de seus produtos/serviços;</li>
              <li>Manter atualizadas as informações dos anúncios;</li>
              <li>Responder de forma educada e profissional aos interessados;</li>
              <li>Honrar os compromissos assumidos nas negociações.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Interessados</h3>
            <p className="mb-2 text-gray-700">Os interessados são responsáveis por:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Verificar a veracidade das informações antes de efetuar compras;</li>
              <li>Tomar todas as precauções necessárias durante as negociações;</li>
              <li>Não utilizar a Plataforma para atividades fraudulentas;</li>
              <li>Respeitar os termos acordados com os anunciantes;</li>
              <li>Denunciar comportamentos suspeitos ou inadequados.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. TRANSAÇÕES ENTRE USUÁRIOS</h2>
            <p className="mb-4 text-gray-700">
              A BuscaAquiBDC atua exclusivamente como intermediadora, conectando anunciantes e interessados. Não somos parte das transações realizadas entre usuários e não temos controle sobre:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>A qualidade, segurança ou legalidade dos produtos anunciados;</li>
              <li>A veracidade das informações fornecidas pelos usuários;</li>
              <li>A capacidade dos usuários de completar transações;</li>
              <li>O cumprimento de garantias ou condições acordadas entre as partes.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Todas as negociações, acordos e transações são de responsabilidade exclusiva dos usuários envolvidos.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. PLANOS DE ASSINATURA E PAGAMENTOS</h2>
            <p className="mb-4 text-gray-700">
              A Plataforma oferece diferentes planos de assinatura com recursos e benefícios variados:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Plano Gratuito:</strong> Acesso básico com limitações;</li>
              <li><strong>Planos Pagos:</strong> Recursos premium com diferentes níveis de benefícios.</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Os valores, condições e recursos de cada plano estão descritos na página específica de planos. As cobranças são processadas de acordo com o ciclo escolhido (mensal ou anual).
            </p>
            <p className="mb-6 text-gray-700">
              O cancelamento da assinatura pode ser feito a qualquer momento, mantendo-se o acesso aos recursos pagos até o final do período já pago.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. PROPRIEDADE INTELECTUAL</h2>
            <p className="mb-4 text-gray-700">
              Todo o conteúdo da Plataforma, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais e software, é propriedade da BuscaAquiBDC ou de seus fornecedores de conteúdo e está protegido por leis de direitos autorais.
            </p>
            <p className="mb-6 text-gray-700">
              Ao publicar conteúdo na Plataforma, você concede à BuscaAquiBDC uma licença não exclusiva, mundial e isenta de royalties para usar, reproduzir, modificar, adaptar e distribuir tal conteúdo para fins de operação e promoção da Plataforma.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. PRIVACIDADE E PROTEÇÃO DE DADOS</h2>
            <p className="mb-4 text-gray-700">
              O tratamento de dados pessoais é regido por nossa Política de Privacidade, que faz parte integrante destes termos. Coletamos, utilizamos e protegemos suas informações de acordo com a Lei Geral de Proteção de Dados (LGPD) e demais legislações aplicáveis.
            </p>
            <p className="mb-6 text-gray-700">
              Você tem direito ao acesso, correção, exclusão e portabilidade de seus dados pessoais, conforme previsto na legislação vigente.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. MODERAÇÃO E REMOÇÃO DE CONTEÚDO</h2>
            <p className="mb-4 text-gray-700">
              Reservamo-nos o direito de moderar, editar, remover ou recusar qualquer conteúdo que:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Viole estes termos ou nossas políticas;</li>
              <li>Seja considerado inadequado, ofensivo ou prejudicial;</li>
              <li>Infrinja direitos de terceiros;</li>
              <li>Seja reportado por outros usuários;</li>
              <li>Viole leis ou regulamentações aplicáveis.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              A moderação pode ser realizada por sistemas automatizados ou revisão humana, sem aviso prévio.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. LIMITAÇÃO DE RESPONSABILIDADE</h2>
            <p className="mb-4 text-gray-700">
              A BuscaAquiBDC não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Danos diretos, indiretos, incidentais ou consequenciais;</li>
              <li>Perda de lucros, dados ou oportunidades de negócio;</li>
              <li>Transações realizadas entre usuários;</li>
              <li>Conteúdo publicado por terceiros;</li>
              <li>Interrupções temporárias do serviço;</li>
              <li>Ações de terceiros ou eventos fora de nosso controle.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Nossa responsabilidade total não excederá o valor pago pelo usuário nos últimos 12 meses.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. SUSPENSÃO E ENCERRAMENTO</h2>
            <p className="mb-4 text-gray-700">
              Podemos suspender ou encerrar sua conta e acesso à Plataforma, temporária ou permanentemente, nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Violação destes termos ou de nossas políticas;</li>
              <li>Atividade fraudulenta ou suspeita;</li>
              <li>Uso inadequado da Plataforma;</li>
              <li>Solicitação de autoridades competentes;</li>
              <li>Não pagamento de taxas devidas;</li>
              <li>Inatividade prolongada da conta.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. DENÚNCIAS E RECLAMAÇÕES</h2>
            <p className="mb-4 text-gray-700">
              Disponibilizamos canais para denúncias de conteúdo inadequado, comportamento abusivo ou violação destes termos. Todas as denúncias são analisadas e, quando procedentes, resultam em medidas apropriadas.
            </p>
            <p className="mb-6 text-gray-700">
              Para denúncias relacionadas a direitos autorais, siga o procedimento específico disponível em nossa central de ajuda.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. LEI APLICÁVEL E FORO</h2>
            <p className="mb-4 text-gray-700">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida preferencialmente por negociação direta ou mediação.
            </p>
            <p className="mb-6 text-gray-700">
              Caso necessário, fica eleito o foro da comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias, renunciando as partes a qualquer outro, por mais privilegiado que seja.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">16. DISPOSIÇÕES GERAIS</h2>
            <p className="mb-4 text-gray-700">
              Estes termos constituem o acordo integral entre as partes. Caso alguma disposição seja considerada inválida, as demais permanecerão em vigor.
            </p>
            <p className="mb-4 text-gray-700">
              A tolerância com eventual descumprimento não constitui renúncia de direitos. Estes termos são válidos por prazo indeterminado.
            </p>
            <p className="mb-6 text-gray-700">
              Atualizações destes termos serão comunicadas através da Plataforma e entrarão em vigor imediatamente após a publicação.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">17. CONTATO</h2>
            <p className="mb-4 text-gray-700">
              Para dúvidas, sugestões ou questões relacionadas a estes termos, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="mb-2"><strong>Email:</strong> suporte@buscaaquibdc.com</p>
              <p className="mb-2"><strong>Suporte:</strong> suporte@buscaaquibdc.com</p>
              <p className="mb-2"><strong>WhatsApp:</strong> (99) 98444-7055</p>
              <p><strong>Endereço:</strong> [Endereço da empresa a ser definido]</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">
                <strong>Importante:</strong> Mantenha-se sempre atualizado com nossos termos e políticas. 
                É sua responsabilidade revisar periodicamente estas condições.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <Link href="/politica-privacidade" className="text-green-600 hover:text-green-700 font-medium">
            Política de Privacidade
          </Link>
          <Link href="/contato" className="text-green-600 hover:text-green-700 font-medium">
            Fale Conosco
          </Link>
        </div>
      </div>
    </div>
  );
} 