"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCamera, FaCheck, FaTimes, FaLightbulb, FaSearch, FaEye, FaComments } from 'react-icons/fa';

export default function DicasAnuncios() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <div className="flex items-center mb-4">
            <FaLightbulb className="text-3xl text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Dicas para Anúncios de Sucesso</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Aprenda como criar anúncios atrativos que geram mais visualizações, contatos e vendas rápidas.
          </p>
        </div>

        {/* Banner de destaque */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg overflow-hidden mb-10">
          <div className="relative z-10 px-8 py-10 text-white">
            <h2 className="text-2xl font-bold mb-4">Anúncios que vendem mais rápido recebem:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-start">
                <div className="p-2 bg-white rounded-full mr-3">
                  <FaEye className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">+200%</h3>
                  <p className="text-white/90">mais visualizações</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-white rounded-full mr-3">
                  <FaComments className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">+150%</h3>
                  <p className="text-white/90">mais contatos</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-white rounded-full mr-3">
                  <FaSearch className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">+80%</h3>
                  <p className="text-white/90">mais resultados em buscas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dicas essenciais para o sucesso do seu anúncio</h2>

          <div className="space-y-10">
            {/* Dica 1 */}
            <div>
                <div className="flex items-center mb-3">
                  <FaCamera className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Invista em fotografias de qualidade</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Anúncios com fotos de boa qualidade recebem até 3 vezes mais contatos. Tire fotos em um ambiente bem iluminado, de preferência com luz natural, e capture o produto de vários ângulos.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Lista de verificação de fotos:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Use um fundo limpo e neutro que não distraia do produto</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Fotografe todos os detalhes importantes, inclusive possíveis defeitos</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Inclua pelo menos 3-5 fotos de diferentes ângulos</span>
                    </li>
                    <li className="flex items-start">
                      <FaTimes className="text-red-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Evite fotos escuras, desfocadas ou com reflexos</span>
                    </li>
                    </ul>
            </div>
          </div>
          
            {/* Dica 2 */}
            <div className="border-t border-gray-200 pt-10">
                <div className="flex items-center mb-3">
                  <FaLightbulb className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Crie um título atrativo e objetivo</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  O título é a primeira coisa que os compradores veem. Um bom título deve incluir as principais características do seu produto ou serviço e palavras-chave que são frequentemente buscadas.
                </p>
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Exemplo ruim:</h4>
                    <p className="text-gray-800">"Vendo celular usado"</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Exemplo bom:</h4>
                    <p className="text-gray-800">"iPhone 13 Pro 128GB Grafite - Excelente estado, com garantia até 2023"</p>
              </div>
            </div>
          </div>
          
            {/* Dica 3 */}
            <div className="border-t border-gray-200 pt-10">
                <div className="flex items-center mb-3">
                  <FaSearch className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Faça uma descrição completa e detalhada</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Uma descrição detalhada reduz dúvidas e aumenta a confiança dos potenciais compradores. Inclua todas as informações relevantes como marca, modelo, tamanho, condições de uso, motivo da venda e detalhes técnicos.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">O que incluir na descrição:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Especificações técnicas detalhadas (tamanho, peso, material, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Estado de conservação e possíveis defeitos</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Idade do produto e tempo de uso</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Opções de entrega e formas de pagamento aceitas</span>
                    </li>
                  </ul>
            </div>
          </div>
          
            {/* Dica 4 */}
            <div className="border-t border-gray-200 pt-10">
                <div className="flex items-center mb-3">
                  <FaSearch className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Defina um preço justo e competitivo</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Um preço competitivo é fundamental para atrair interessados. Pesquise anúncios semelhantes para definir um valor justo e, se possível, indique se há margem para negociação.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Dicas para precificação:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Pesquise o preço de produtos semelhantes na plataforma</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Considere a condição, idade e desgaste do produto</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Deixe claro se o preço é fixo ou negociável</span>
                    </li>
                    <li className="flex items-start">
                      <FaTimes className="text-red-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Evite preços excessivamente acima do mercado</span>
                    </li>
                  </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dicas avançadas */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dicas avançadas para vendedores frequentes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">1</span>
                Responda rapidamente
              </h3>
              <p className="text-gray-700">
                Compradores valorizam respostas rápidas. Anunciantes que respondem em menos de 1 hora têm 40% mais chances de fechar negócio. Configure notificações no seu celular para não perder mensagens.
              </p>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">2</span>
                Mantenha seus anúncios atualizados
              </h3>
              <p className="text-gray-700">
                Anúncios atualizados recentemente aparecem melhor posicionados nos resultados de busca. Atualize seus anúncios a cada 15 dias, mesmo que seja apenas para confirmar que o produto ainda está disponível.
              </p>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">3</span>
                Use recursos de destaque
              </h3>
              <p className="text-gray-700">
                Anúncios destacados recebem até 10 vezes mais visualizações. Considere investir em destaque para produtos de maior valor ou que você precisa vender rapidamente.
              </p>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">4</span>
                Seja transparente sobre defeitos
              </h3>
              <p className="text-gray-700">
                Informe claramente qualquer defeito ou detalhe que possa influenciar a decisão de compra. Isso evita perdas de tempo com negociações que não avançarão depois da inspeção do produto.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo final */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Lembre-se:</h2>
          <p className="mb-4">
            Criar um anúncio eficiente exige atenção aos detalhes e honestidade. Com estas dicas, você aumentará significativamente suas chances de vender mais rápido e pelo melhor preço.
          </p>
          <div className="flex justify-center mt-4">
          <Link 
              href="/painel-anunciante/criar-anuncio"
              className="bg-white text-green-700 hover:bg-gray-100 font-medium py-2 px-6 rounded-md transition-colors"
          >
              Criar seu anúncio agora
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 