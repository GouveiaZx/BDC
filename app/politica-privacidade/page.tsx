"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaLock, FaShieldAlt } from 'react-icons/fa';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <div className="flex items-center mb-4">
            <FaLock className="text-3xl text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          </div>
          <p className="text-gray-600">
            Última atualização: 01 de agosto de 2023
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-6">
          <div className="prose prose-lg max-w-none text-gray-800">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaShieldAlt className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Na BuscaAquiBdC, levamos a sua privacidade muito a sério. Esta política explica como coletamos, usamos, divulgamos, transferimos e armazenamos suas informações.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Coleta de Informações</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC coleta informações para melhorar nossos serviços e proporcionar a melhor experiência possível. Coletamos os seguintes tipos de informações:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>
                <strong>Informações de cadastro:</strong> Nome, endereço de email, número de telefone, endereço, CPF ou CNPJ (para fins de faturamento).
              </li>
              <li>
                <strong>Informações de anúncios:</strong> Dados sobre os produtos ou serviços que você anuncia, incluindo fotos, descrições, preços e localizações.
              </li>
              <li>
                <strong>Informações de uso:</strong> Como você interage com nossa plataforma, quais recursos utiliza e a frequência de uso.
              </li>
              <li>
                <strong>Informações do dispositivo:</strong> Dados sobre o dispositivo que você utiliza para acessar nossa plataforma, como modelo de hardware, sistema operacional, identificadores únicos e dados de rede.
              </li>
              <li>
                <strong>Informações de localização:</strong> Com sua permissão, podemos coletar e processar informações sobre sua localização para fornecer recursos baseados na localização.
              </li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2. Como Usamos Suas Informações</h2>
            <p>
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>Fornecer, manter e melhorar nossos serviços;</li>
              <li>Processar transações e enviar notificações relacionadas;</li>
              <li>Enviar comunicações de marketing, atualizações e mensagens promocionais;</li>
              <li>Personalizar sua experiência e fornecer conteúdo e anúncios relevantes;</li>
              <li>Proteger contra comportamentos fraudulentos, abusivos ou ilegais;</li>
              <li>Desenvolver novos recursos e serviços;</li>
              <li>Realizar análises de dados para entender como nossos serviços são utilizados.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3. Compartilhamento de Informações</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC não vende ou aluga suas informações pessoais a terceiros. No entanto, podemos compartilhar suas informações nas seguintes circunstâncias:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>
                <strong>Com outros usuários:</strong> Quando você publica um anúncio, certas informações como seu nome, localização geral e meios de contato ficam visíveis para outros usuários.
              </li>
              <li>
                <strong>Com prestadores de serviços:</strong> Podemos compartilhar suas informações com empresas que nos ajudam a operar, fornecer, melhorar, integrar, personalizar e comercializar nossos serviços.
              </li>
              <li>
                <strong>Por motivos legais:</strong> Podemos compartilhar informações para cumprir obrigações legais, proteger e defender nossos direitos e propriedade, ou quando acreditarmos de boa-fé que a divulgação é necessária para proteger sua segurança ou a segurança de outros.
              </li>
              <li>
                <strong>Com seu consentimento:</strong> Podemos compartilhar informações com terceiros quando você nos der consentimento para fazê-lo.
              </li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4. Cookies e Tecnologias Semelhantes</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC utiliza cookies e tecnologias semelhantes para coletar e armazenar informações quando você visita nosso site ou usa nossos serviços. Estas tecnologias nos ajudam a:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>Lembrar suas preferências e configurações;</li>
              <li>Manter sua sessão ativa enquanto utiliza nossos serviços;</li>
              <li>Entender como você interage com nossa plataforma;</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos;</li>
              <li>Personalizar sua experiência e fornecer conteúdo relevante.</li>
            </ul>
            <p>
              Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado. No entanto, algumas funcionalidades de nossos serviços podem não funcionar corretamente se você desabilitar os cookies.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5. Segurança</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC utiliza medidas técnicas e organizacionais adequadas para proteger suas informações pessoais contra perda, uso indevido e acesso não autorizado, divulgação, alteração e destruição. Algumas das medidas que tomamos incluem:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>Criptografia de dados em trânsito e em repouso;</li>
              <li>Acesso restrito a informações pessoais somente a funcionários autorizados;</li>
              <li>Auditoria regular de nossos sistemas e práticas de segurança;</li>
              <li>Implementação de medidas físicas de segurança em nossas instalações.</li>
            </ul>
            <p>
              No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Portanto, não podemos garantir sua segurança absoluta.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6. Seus Direitos e Escolhas</h2>
            <p>
              Você tem certos direitos em relação às suas informações pessoais, incluindo:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>
                <strong>Acesso e atualização:</strong> Você pode acessar e atualizar suas informações através da configuração da sua conta.
              </li>
              <li>
                <strong>Exclusão:</strong> Você pode solicitar a exclusão da sua conta e informações pessoais.
              </li>
              <li>
                <strong>Restrição de processamento:</strong> Em determinadas circunstâncias, você pode solicitar que limitemos o processamento de suas informações pessoais.
              </li>
              <li>
                <strong>Portabilidade de dados:</strong> Você tem o direito de receber seus dados pessoais em um formato estruturado, comumente usado e legível por máquina.
              </li>
              <li>
                <strong>Objeção:</strong> Você pode se opor ao processamento de suas informações pessoais em determinadas circunstâncias.
              </li>
              <li>
                <strong>Retirada de consentimento:</strong> Se o processamento de suas informações for baseado em seu consentimento, você pode retirar esse consentimento a qualquer momento.
              </li>
            </ul>
            <p>
              Para exercer esses direitos, entre em contato conosco através do email <a href="mailto:privacidade@desapegabdc.com.br" className="text-green-600 hover:underline">privacidade@desapegabdc.com.br</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pessoais pelo tempo necessário para fornecer os serviços solicitados, cumprir nossas obrigações legais, resolver disputas e fazer cumprir nossos acordos. Quando não precisamos mais de suas informações pessoais, as excluímos ou anonimizamos.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8. Alterações a Esta Política de Privacidade</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Se fizermos alterações materiais, notificaremos você por meio de um aviso em nosso site ou por outros meios, como email. Encorajamos você a revisar esta política regularmente para estar informado sobre como estamos protegendo suas informações.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9. Contato</h2>
            <p>
              Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou nossas práticas de privacidade, entre em contato conosco:
            </p>
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:privacidade@desapegabdc.com.br" className="text-green-600 hover:underline">privacidade@desapegabdc.com.br</a>
            </p>
            <p>
              <strong>Endereço:</strong> Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100
            </p>
          </div>
          </div>
          
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <Link href="/termos-uso" className="text-green-600 hover:text-green-700 font-medium">
                Termos de Uso
              </Link>
          <Link href="/contato" className="text-green-600 hover:text-green-700 font-medium">
            Fale Conosco
              </Link>
        </div>
      </div>
    </div>
  );
} 