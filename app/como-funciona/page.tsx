"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSearch, FaEdit, FaHandshake, FaShieldAlt, FaQuestionCircle, FaCheck } from 'react-icons/fa';

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Como Funciona</h1>
          <p className="text-gray-600 text-lg">
            Entenda como nossa plataforma funciona e comece a comprar e vender com facilidade e segurança.
          </p>
        </div>

        {/* Banner de texto em vez de imagem */}
        <div className="bg-green-700 rounded-lg overflow-hidden mb-12 p-8">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-4 max-w-lg">
            Conectamos compradores e vendedores de maneira simples e segura
          </h2>
          <p className="text-white/90 text-lg max-w-lg">
            Milhares de produtos e serviços em um só lugar, com facilidade de busca e negociação direta.
          </p>
        </div>

        {/* Seção de passos */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Como utilizar nossa plataforma</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <FaSearch className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Para compradores</h3>
                <ol className="space-y-6 mt-6">
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Encontre o que precisa</h4>
                      <p className="text-gray-600">
                        Utilize a barra de pesquisa ou navegue pelas categorias para encontrar produtos e serviços de seu interesse.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Entre em contato</h4>
                      <p className="text-gray-600">
                        Ao encontrar um anúncio interessante, entre em contato com o vendedor para tirar dúvidas ou negociar através da plataforma.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Negocie com segurança</h4>
                      <p className="text-gray-600">
                        Combine o pagamento e a entrega diretamente com o vendedor. Se possível, verifique o produto pessoalmente antes de finalizar a compra.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <FaEdit className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Para vendedores</h3>
                <ol className="space-y-6 mt-6">
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Crie sua conta</h4>
                      <p className="text-gray-600">
                        Registre-se na plataforma gratuitamente. Complete seu perfil com informações para aumentar sua credibilidade.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Anuncie seu produto ou serviço</h4>
                      <p className="text-gray-600">
                        Crie anúncios detalhados com fotos de qualidade, descrição clara e preço. Quanto mais completo o anúncio, mais chances de venda.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Gerencie contatos e vendas</h4>
                      <p className="text-gray-600">
                        Responda rapidamente às mensagens e organize suas vendas. Mantenha seus anúncios atualizados para melhor visibilidade.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de diferenciais */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Por que escolher nossa plataforma</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FaHandshake className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facilidade de negociação</h3>
              <p className="text-gray-600">
                Interface intuitiva que permite contato direto entre compradores e vendedores, agilizando as negociações.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FaShieldAlt className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança e confiabilidade</h3>
              <p className="text-gray-600">
                Verificamos os usuários e oferecemos ferramentas para reportar problemas, garantindo um ambiente mais seguro.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FaSearch className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Grande variedade</h3>
              <p className="text-gray-600">
                Milhares de anúncios em diversas categorias, desde veículos e imóveis até serviços profissionais e produtos usados.
              </p>
            </div>
          </div>
        </div>
        
        {/* Seção de perguntas frequentes */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-12">
          <div className="flex items-center mb-6">
            <FaQuestionCircle className="text-green-600 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Perguntas frequentes</h2>
          </div>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quanto custa anunciar na plataforma?</h3>
              <p className="text-gray-600">
                Anunciar na nossa plataforma é gratuito para anúncios básicos. Para maior visibilidade, oferecemos planos pagos com recursos premium como destaque nos resultados de busca e mais fotos por anúncio.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Como garantir uma negociação segura?</h3>
              <p className="text-gray-600">
                Recomendamos que os compradores verifiquem o produto pessoalmente antes da compra, priorizem locais seguros para encontro e evitem pagamentos antecipados sem garantias. Os vendedores devem verificar o pagamento antes de entregar o produto.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Por quanto tempo meu anúncio fica disponível?</h3>
              <p className="text-gray-600">
                Os anúncios ficam disponíveis por 60 dias, podendo ser renovados gratuitamente após esse período. Anunciantes com planos pagos têm a opção de anúncios com duração estendida.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Como receber e responder mensagens dos interessados?</h3>
              <p className="text-gray-600">
                Todas as mensagens são recebidas no seu painel de anunciante e também enviadas para seu e-mail cadastrado. Você pode responder diretamente pela plataforma ou pelo e-mail, conforme sua preferência.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Posso promover meus anúncios para obter mais visualizações?</h3>
              <p className="text-gray-600">
                Sim, oferecemos opções de destaque para seus anúncios. Você pode destacar anúncios individuais ou assinar um dos nossos planos que incluem anúncios em destaque e outras vantagens.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA - Começar a usar */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
          <div className="px-8 py-10 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full text-center md:text-left">
                <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
                <p className="text-white/90 mb-6">
                  Crie sua conta gratuitamente e comece a comprar e vender em nossa plataforma hoje mesmo.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link 
                    href="/registro" 
                    className="inline-block bg-white text-green-700 hover:bg-gray-100 font-medium py-2 px-6 rounded-md transition-colors"
                  >
                    Criar conta grátis
                  </Link>
                  <Link 
                    href="/planos" 
                    className="inline-block bg-transparent hover:bg-white/20 border border-white text-white font-medium py-2 px-6 rounded-md transition-colors"
                  >
                    Conhecer planos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 