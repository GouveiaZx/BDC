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
            <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
          </div>
          <p className="text-gray-600">
            Última atualização: 01 de agosto de 2023
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-6">
          <div className="prose prose-lg max-w-none text-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-6 text-gray-700">
              Ao acessar e utilizar a plataforma BuscaAquiBdC, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2. Cadastro e Conta</h2>
            <p className="mb-6 text-gray-700">
              Para utilizar certos recursos da plataforma, é necessário registrar-se e criar uma conta. Você é responsável por manter a confidencialidade de sua senha e pelo uso de sua conta. Você concorda em notificar imediatamente a BuscaAquiBdC sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
            </p>
            <p className="mb-6 text-gray-700">
              Você é responsável por fornecer informações completas, precisas e atualizadas durante o processo de registro e por manter a precisão dessas informações. A BuscaAquiBdC reserva-se o direito de encerrar contas que contenham informações falsas ou enganosas.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3. Anúncios e Conteúdo do Usuário</h2>
            <p className="mb-6 text-gray-700">
              Ao publicar anúncios ou qualquer conteúdo na plataforma, você concede à BuscaAquiBdC uma licença mundial, não exclusiva, isenta de royalties, para usar, reproduzir, modificar, adaptar, publicar, traduzir, criar trabalhos derivados, distribuir e exibir tal conteúdo.
            </p>
            <p className="mb-6 text-gray-700">
              Você é o único responsável por todo o conteúdo que publica e confirma que tem todos os direitos necessários para publicar esse conteúdo. Você concorda em não publicar conteúdo ilegal, abusivo, difamatório, obsceno ou fraudulento.
            </p>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC se reserva o direito de remover qualquer conteúdo que viole estes termos ou que seja considerado ofensivo, ilegal ou que viole os direitos de terceiros.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4. Conteúdo Proibido</h2>
            <p>
              É expressamente proibido publicar conteúdo que:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
              <li>Seja ilegal, prejudicial, ameaçador, abusivo, difamatório, obsceno ou ofensivo;</li>
              <li>Infrinja direitos de propriedade intelectual de terceiros;</li>
              <li>Contenha software malicioso, vírus ou qualquer código projetado para danificar ou interferir no funcionamento do site;</li>
              <li>Promova atividades ilegais ou condutas abusivas, ameaçadoras ou obscenas;</li>
              <li>Se passe por outra pessoa ou entidade, ou falsifique sua afiliação com uma pessoa ou entidade;</li>
              <li>Envolva a venda de produtos proibidos, incluindo, mas não se limitando a: medicamentos, drogas ilegais, armas, animais selvagens protegidos, etc.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5. Transações entre Usuários</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC funciona como uma plataforma de classificados online que conecta vendedores e compradores. Nós não somos parte de nenhuma transação entre usuários e não temos controle sobre a qualidade, segurança, legalidade ou disponibilidade dos itens anunciados.
            </p>
            <p className="mb-6 text-gray-700">
              Ao utilizar nossa plataforma para realizar transações, você reconhece que o faz por sua conta e risco. Recomendamos que os usuários tomem todas as precauções necessárias ao negociar com outros usuários, incluindo verificar a identidade da outra parte e a autenticidade dos itens antes de concluir qualquer transação.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6. Limitação de Responsabilidade</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC é fornecida "no estado em que se encontra" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas. Não garantimos que o site será ininterrupto, seguro ou livre de erros.
            </p>
            <p className="mb-6 text-gray-700">
              Em nenhuma circunstância a BuscaAquiBdC, seus diretores, funcionários ou agentes serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, punitivos ou consequentes decorrentes do uso ou incapacidade de usar nossa plataforma.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7. Modificações nos Termos</h2>
            <p className="mb-6 text-gray-700">
              A BuscaAquiBdC reserva-se o direito de modificar estes Termos de Uso a qualquer momento. Alterações entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado do site após tais alterações constituirá sua aceitação das novas condições.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8. Lei Aplicável</h2>
            <p>
              Estes Termos de Uso serão regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa relacionada a estes termos será submetida à jurisdição exclusiva dos tribunais da comarca de São Paulo, Brasil.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco através do email: <a href="mailto:juridico@desapegabdc.com.br" className="text-green-600 hover:underline">juridico@desapegabdc.com.br</a>.
            </p>
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