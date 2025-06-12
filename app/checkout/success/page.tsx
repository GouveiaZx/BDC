"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCheckCircle, FaArrowRight, FaDownload, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

export default function CheckoutSuccess() {
  const [orderNumber, setOrderNumber] = useState('');
  
  useEffect(() => {
    // Gerar um número de pedido aleatório
    const randomOrderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    setOrderNumber(randomOrderNumber);
  }, []);
  
  return (
    <div className="bg-white">
      <main className="container mx-auto px-4 py-8 sm:py-16 max-w-3xl">
        <div className="bg-white rounded-lg p-4 sm:p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4">
              <FaCheckCircle className="text-green-500 text-3xl sm:text-4xl" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pagamento confirmado!</h1>
            <p className="text-gray-600">
              Obrigado por assinar o BDC Classificados. Seu plano está ativo.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 mb-4">
              <div>
                <p className="text-sm text-gray-500">Número do pedido</p>
                <p className="font-medium text-gray-900">#{orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h2 className="font-semibold text-gray-900 mb-2">Resumo</h2>
              <div className="flex justify-between mb-2">
                <p className="text-gray-700">Plano</p>
                <p className="font-medium text-gray-900">Microempresa</p>
              </div>
              <div className="flex justify-between mb-2">
                <p className="text-gray-700">Período</p>
                <p className="font-medium text-gray-900">Mensal</p>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <p className="text-gray-700 font-medium">Total</p>
                <p className="font-bold text-gray-900">R$ 29,90</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Próximos passos</h2>
              <ul className="space-y-3">
                <li className="flex">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    1
                  </div>
                  <p className="text-gray-700">Acesse seu painel para começar a criar seus anúncios</p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    2
                  </div>
                  <p className="text-gray-700">Personalize seu perfil de vendedor para aumentar sua credibilidade</p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    3
                  </div>
                  <p className="text-gray-700">Aproveite seus benefícios e aumente suas vendas</p>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/painel-anunciante"
                className="flex-1 bg-primary hover:bg-primary-dark text-black font-bold py-3 px-6 rounded-lg flex items-center justify-center"
              >
                Acessar meu painel <FaArrowRight className="ml-2" />
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg flex items-center justify-center"
              >
                <FaDownload className="mr-2" /> Imprimir recibo
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Enviamos os detalhes da sua compra para o seu e-mail.</p>
          <p className="text-gray-600">
            Precisa de ajuda? Entre em contato com nosso suporte:
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-green-600 flex items-center"
            >
              <FaWhatsapp className="mr-1" /> WhatsApp
            </a>
            <a
              href="mailto:suporte@bdcclassificados.com.br"
              className="text-gray-600 hover:text-primary flex items-center"
            >
              <FaEnvelope className="mr-1" /> E-mail
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 