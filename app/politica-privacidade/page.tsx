"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <div className="flex items-center mb-4">
            <FaShieldAlt className="text-3xl text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          </div>
          <p className="text-gray-600">
            Última atualização: Janeiro de 2025
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
                    Na BuscaAquiBDC, levamos a sua privacidade muito a sério. Esta política explica como coletamos, usamos, divulgamos, transferimos e armazenamos suas informações pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. INFORMAÇÕES GERAIS</h2>
            <p className="mb-4 text-gray-700">
              Esta Política de Privacidade descreve como a BuscaAquiBDC ("nós", "nosso" ou "empresa") coleta, usa, armazena e protege as informações pessoais dos usuários ("você" ou "usuário") de nossa plataforma de classificados online.
            </p>
            <p className="mb-6 text-gray-700">
              Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política. Se não concordar com qualquer aspecto desta política, não utilize nossos serviços.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. DADOS PESSOAIS COLETADOS</h2>
            <p className="mb-4 text-gray-700">
              Coletamos diferentes tipos de informações para melhorar nossos serviços e proporcionar a melhor experiência possível:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Informações Fornecidas Diretamente</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Dados de cadastro:</strong> Nome completo, endereço de email, número de telefone, CPF ou CNPJ;</li>
              <li><strong>Dados de perfil:</strong> Foto de perfil, biografia, informações de contato;</li>
              <li><strong>Dados de anúncios:</strong> Descrições, preços, fotos, localização dos produtos/serviços;</li>
              <li><strong>Dados de pagamento:</strong> Informações de cartão de crédito, dados bancários (processados por terceiros seguros);</li>
              <li><strong>Comunicações:</strong> Mensagens enviadas através da plataforma, e-mails de contato.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li><strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas, tempo de permanência;</li>
              <li><strong>Dados do dispositivo:</strong> Modelo, sistema operacional, identificadores únicos;</li>
              <li><strong>Dados de localização:</strong> Localização aproximada baseada no IP (com sua permissão, localização precisa);</li>
              <li><strong>Cookies e tecnologias similares:</strong> Preferências, sessões, análises de uso.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. FINALIDADES DO TRATAMENTO</h2>
            <p className="mb-4 text-gray-700">
              Utilizamos suas informações pessoais para as seguintes finalidades:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Prestação de Serviços</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Criar e gerenciar sua conta na plataforma;</li>
              <li>Publicar e gerenciar seus anúncios;</li>
              <li>Facilitar comunicação entre usuários;</li>
              <li>Processar pagamentos e assinaturas;</li>
              <li>Fornecer suporte ao cliente.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Melhorias e Personalização</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Personalizar sua experiência na plataforma;</li>
              <li>Recomendar produtos e serviços relevantes;</li>
              <li>Analisar padrões de uso para melhorar funcionalidades;</li>
              <li>Desenvolver novos recursos e serviços.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Comunicação e Marketing</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Enviar notificações sobre atividades da conta;</li>
              <li>Comunicar atualizações de serviços e políticas;</li>
              <li>Enviar ofertas e promoções (com seu consentimento);</li>
              <li>Responder a dúvidas e solicitações.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.4 Segurança e Conformidade</h3>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Detectar e prevenir fraudes e atividades suspeitas;</li>
              <li>Garantir a segurança da plataforma;</li>
              <li>Cumprir obrigações legais e regulamentares;</li>
              <li>Resolver disputas e fazer cumprir nossos termos.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. BASE LEGAL PARA O TRATAMENTO</h2>
            <p className="mb-4 text-gray-700">
              O tratamento de seus dados pessoais é baseado nas seguintes bases legais previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li><strong>Execução de contrato:</strong> Para fornecer os serviços solicitados;</li>
              <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e garantir segurança;</li>
              <li><strong>Consentimento:</strong> Para comunicações de marketing e funcionalidades opcionais;</li>
              <li><strong>Cumprimento de obrigação legal:</strong> Para atender exigências legais e regulamentares.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. COMPARTILHAMENTO DE INFORMAÇÕES</h2>
            <p className="mb-4 text-gray-700">
              Não vendemos ou alugamos suas informações pessoais. Podemos compartilhar suas informações nas seguintes situações:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 Com Outros Usuários</h3>
            <p className="mb-4 text-gray-700">
              Quando você publica um anúncio, certas informações ficam visíveis para outros usuários, incluindo nome, localização geral e informações de contato fornecidas voluntariamente.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5.2 Com Prestadores de Serviços</h3>
            <p className="mb-4 text-gray-700">
              Compartilhamos informações com empresas terceirizadas que nos ajudam a operar a plataforma, incluindo:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Processadores de pagamento;</li>
              <li>Serviços de hospedagem e armazenamento;</li>
              <li>Provedores de análise e métricas;</li>
              <li>Serviços de email e comunicação;</li>
              <li>Suporte técnico e atendimento ao cliente.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5.3 Por Exigência Legal</h3>
            <p className="mb-6 text-gray-700">
              Podemos divulgar informações quando exigido por lei, ordem judicial, processo legal ou para proteger nossos direitos, propriedade ou segurança de usuários.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. COOKIES E TECNOLOGIAS SIMILARES</h2>
            <p className="mb-4 text-gray-700">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Tipos de Cookies</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento básico da plataforma;</li>
              <li><strong>Cookies de performance:</strong> Coletam informações sobre como você usa nosso site;</li>
              <li><strong>Cookies de funcionalidade:</strong> Lembram suas preferências e configurações;</li>
              <li><strong>Cookies de publicidade:</strong> Personalizam anúncios e medem eficácia (com consentimento).</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Gerenciamento de Cookies</h3>
            <p className="mb-6 text-gray-700">
              Você pode controlar cookies através das configurações do seu navegador. Note que desabilitar cookies pode afetar a funcionalidade da plataforma.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. SEGURANÇA DOS DADOS</h2>
            <p className="mb-4 text-gray-700">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Criptografia:</strong> Dados em trânsito e em repouso são criptografados;</li>
              <li><strong>Controle de acesso:</strong> Acesso limitado a funcionários autorizados;</li>
              <li><strong>Monitoramento:</strong> Sistemas de detecção de intrusão e monitoramento contínuo;</li>
              <li><strong>Auditorias:</strong> Revisões regulares de segurança e conformidade;</li>
              <li><strong>Treinamento:</strong> Capacitação da equipe em práticas de segurança.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Apesar de nossos esforços, nenhum sistema é 100% seguro. Recomendamos que você também tome precauções para proteger suas informações.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. RETENÇÃO DE DADOS</h2>
            <p className="mb-4 text-gray-700">
              Mantemos suas informações pessoais apenas pelo tempo necessário para:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Fornecer os serviços solicitados;</li>
              <li>Cumprir obrigações legais e regulamentares;</li>
              <li>Resolver disputas e fazer cumprir acordos;</li>
              <li>Fins legítimos de negócio.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Quando não precisamos mais de suas informações, as excluímos de forma segura ou as anonimizamos.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. SEUS DIREITOS</h2>
            <p className="mb-4 text-gray-700">
              De acordo com a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Confirmação da existência:</strong> Saber se tratamos seus dados;</li>
              <li><strong>Acesso:</strong> Obter cópia dos dados que tratamos sobre você;</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou inexatos;</li>
              <li><strong>Anonimização ou exclusão:</strong> Solicitar anonimização ou exclusão de dados desnecessários;</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado;</li>
              <li><strong>Eliminação:</strong> Solicitar eliminação de dados tratados com base no consentimento;</li>
              <li><strong>Informação sobre compartilhamento:</strong> Saber com quem compartilhamos seus dados;</li>
              <li><strong>Revogação do consentimento:</strong> Retirar consentimento a qualquer momento.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">9.1 Como Exercer Seus Direitos</h3>
            <p className="mb-6 text-gray-700">
              Para exercer qualquer um destes direitos, entre em contato conosco através do email <a href="mailto:suporte@buscaaquibdc.com" className="text-green-600 hover:underline">suporte@buscaaquibdc.com</a> ou através dos canais de atendimento disponíveis na plataforma.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. TRANSFERÊNCIA INTERNACIONAL</h2>
            <p className="mb-6 text-gray-700">
              Seus dados podem ser transferidos e processados em países fora do Brasil, sempre com garantias adequadas de proteção conforme exigido pela LGPD. Todos os nossos parceiros internacionais aderem a padrões rigorosos de proteção de dados.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. MENORES DE IDADE</h2>
            <p className="mb-6 text-gray-700">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos conscientemente informações pessoais de menores. Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos medidas para excluir essas informações.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. ALTERAÇÕES NESTA POLÍTICA</h2>
            <p className="mb-6 text-gray-700">
              Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas através da plataforma ou por email. A data da última atualização está indicada no início desta política.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO)</h2>
            <p className="mb-6 text-gray-700">
              Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas sobre esta política e sobre o tratamento de seus dados pessoais. Entre em contato através do email <a href="mailto:suporte@buscaaquibdc.com" className="text-green-600 hover:underline">suporte@buscaaquibdc.com</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. CONTATO</h2>
            <p className="mb-4 text-gray-700">
              Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="mb-2"><strong>Email de Privacidade:</strong> <a href="mailto:suporte@buscaaquibdc.com" className="text-green-600 hover:underline">suporte@buscaaquibdc.com</a></p>
              <p className="mb-2"><strong>DPO:</strong> <a href="mailto:suporte@buscaaquibdc.com" className="text-green-600 hover:underline">suporte@buscaaquibdc.com</a></p>
              <p className="mb-2"><strong>Suporte Geral:</strong> <a href="mailto:suporte@buscaaquibdc.com" className="text-green-600 hover:underline">suporte@buscaaquibdc.com</a></p>
              <p className="mb-2"><strong>WhatsApp:</strong> (99) 98444-7055</p>
              <p><strong>Endereço:</strong> [Endereço da empresa a ser definido]</p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. AUTORIDADE NACIONAL DE PROTEÇÃO DE DADOS (ANPD)</h2>
            <p className="mb-6 text-gray-700">
              Caso não fique satisfeito com nossas respostas, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD), órgão responsável por zelar pela proteção dos dados pessoais no Brasil, através do site <a href="https://www.gov.br/anpd" target="_blank" className="text-green-600 hover:underline">www.gov.br/anpd</a>.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-700">
                <strong>Compromisso:</strong> Estamos comprometidos com a transparência e proteção de seus dados pessoais. 
                Esta política será atualizada conforme necessário para refletir mudanças em nossas práticas ou na legislação aplicável.
              </p>
            </div>
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