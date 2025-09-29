"use client";

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaWhatsapp, FaLock, FaEye, FaHandshake, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';

export default function DicasSeguranca() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <div className="flex items-center mb-4">
            <FaShieldAlt className="text-3xl text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Dicas de Segurança - Desapega BDC</h1>
          </div>
          <p className="text-gray-600">
            Sua segurança é nossa prioridade. Siga estas dicas para negociar com tranquilidade.
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Importante:</strong> O BuscaAquiBDC é uma plataforma de anúncios classificados. Não participamos das negociações entre usuários e não nos responsabilizamos por transações realizadas fora da plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Dicas Gerais de Segurança */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaShieldAlt className="text-green-600 mr-3" />
              Dicas Gerais de Segurança
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Verifique sempre o produto</h3>
                    <p className="text-gray-600 text-sm">Examine o item pessoalmente antes de finalizar a compra. Teste funcionalidades quando possível.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Encontros em locais seguros</h3>
                    <p className="text-gray-600 text-sm">Prefira locais públicos, movimentados e bem iluminados para encontros.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Desconfie de preços muito baixos</h3>
                    <p className="text-gray-600 text-sm">Preços muito abaixo do mercado podem indicar golpes ou produtos com defeito.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Não faça pagamentos antecipados</h3>
                    <p className="text-gray-600 text-sm">Evite transferências ou depósitos antes de ver o produto pessoalmente.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Mantenha conversas registradas</h3>
                    <p className="text-gray-600 text-sm">Guarde prints das conversas e acordos feitos com o vendedor.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Confie no seu instinto</h3>
                    <p className="text-gray-600 text-sm">Se algo parecer suspeito, não hesite em cancelar a negociação.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segurança no WhatsApp */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaWhatsapp className="text-green-600 mr-3" />
              Segurança nas Conversas pelo WhatsApp
            </h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ O que FAZER:</h3>
                <ul className="list-disc pl-5 space-y-1 text-green-700">
                  <li>Confirme sempre os detalhes do produto antes do encontro</li>
                  <li>Combine locais públicos para a negociação</li>
                  <li>Solicite fotos adicionais se necessário</li>
                  <li>Confirme o número do vendedor através da plataforma</li>
                  <li>Mantenha a conversa cordial e profissional</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">❌ O que NÃO FAZER:</h3>
                <ul className="list-disc pl-5 space-y-1 text-red-700">
                  <li>Não envie dinheiro antes de ver o produto</li>
                  <li>Não compartilhe dados pessoais desnecessários</li>
                  <li>Não aceite pressão para decidir rapidamente</li>
                  <li>Não vá sozinho(a) para locais isolados</li>
                  <li>Não ignore sinais de alerta ou comportamento suspeito</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tipos de Golpes Comuns */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaExclamationTriangle className="text-red-600 mr-3" />
              Golpes Comuns - Como Identificar e Evitar
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-800">Golpe do Pagamento Antecipado</h3>
                  <p className="text-gray-600 text-sm">Vendedor solicita depósito ou transferência antes da entrega.</p>
                  <p className="text-red-600 text-xs font-medium">Como evitar: Nunca pague antes de ver o produto.</p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-800">Golpe do Frete</h3>
                  <p className="text-gray-600 text-sm">Cobrança de frete para produtos que não serão entregues.</p>
                  <p className="text-red-600 text-xs font-medium">Como evitar: Prefira encontros presenciais.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-800">Golpe do Preço Irresistível</h3>
                  <p className="text-gray-600 text-sm">Preços muito abaixo do mercado para atrair vítimas.</p>
                  <p className="text-red-600 text-xs font-medium">Como evitar: Pesquise preços antes de comprar.</p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-800">Golpe do Falso Comprador</h3>
                  <p className="text-gray-600 text-sm">Falsos compradores que fazem propostas para obter dados.</p>
                  <p className="text-red-600 text-xs font-medium">Como evitar: Só negocie através da plataforma inicialmente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas para Vendedores */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaHandshake className="text-blue-600 mr-3" />
              Dicas Específicas para Vendedores
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaMoneyBillWave className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Receba o pagamento na entrega</h3>
                    <p className="text-gray-600 text-sm">Prefira dinheiro ou PIX na hora da entrega do produto.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaEye className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Verifique a identidade do comprador</h3>
                    <p className="text-gray-600 text-sm">Confirme dados básicos antes de marcar o encontro.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Escolha locais seguros</h3>
                    <p className="text-gray-600 text-sm">Marque encontros em locais públicos e movimentados.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaLock className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Proteja seus dados</h3>
                    <p className="text-gray-600 text-sm">Não compartilhe informações pessoais desnecessárias.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas para Compradores */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FaEye className="text-purple-600 mr-3" />
              Dicas Específicas para Compradores
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Teste antes de comprar</h3>
                    <p className="text-gray-600 text-sm">Sempre teste eletrônicos e verifique o funcionamento.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Pesquise o preço de mercado</h3>
                    <p className="text-gray-600 text-sm">Compare preços em outras plataformas antes de decidir.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Verifique a procedência</h3>
                    <p className="text-gray-600 text-sm">Para itens caros, solicite nota fiscal ou comprovante.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Leve acompanhante</h3>
                    <p className="text-gray-600 text-sm">Para compras de valor alto, vá acompanhado(a).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Como Denunciar */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
              <FaExclamationTriangle className="text-red-600 mr-3" />
              Como Denunciar Comportamentos Suspeitos
            </h2>
            
            <div className="space-y-4">
              <p className="text-red-700">
                Se você identificar comportamento suspeito, golpe ou anúncio fraudulento:
              </p>
              
              <div className="bg-white p-4 rounded-lg">
                <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                  <li>Acesse o anúncio em questão</li>
                  <li>Clique no botão "Denunciar anúncio" no final da página</li>
                  <li>Selecione o motivo da denúncia</li>
                  <li>Forneça detalhes adicionais sobre o problema</li>
                  <li>Envie a denúncia para nossa equipe</li>
                </ol>
              </div>
              
              <div className="bg-yellow-100 p-3 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Nossa equipe analisa todas as denúncias em até 24 horas e toma as medidas cabíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Contato de Emergência */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Precisa de Ajuda?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Suporte BuscaAquiBDC</h3>
                <p className="text-blue-700 text-sm mb-2">Email: suporte@buscaaquibdc.com</p>
                <p className="text-blue-700 text-sm">WhatsApp: (99) 98444-7055</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Em caso de crime</h3>
                <p className="text-blue-700 text-sm mb-2">Polícia: 190</p>
                <p className="text-blue-700 text-sm">Delegacia Online: delegaciaeletronica.policiacivil.sp.gov.br</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            Última atualização: Janeiro de 2025 | BuscaAquiBDC - Sua segurança é nossa prioridade
          </p>
        </div>
      </div>
    </div>
  );
} 