"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaQuestionCircle, FaHeadset, FaBook, FaCamera, 
  FaListAlt, FaSearchPlus, FaShieldAlt, FaMoneyBillWave,
  FaChevronRight, FaEnvelope, FaWhatsapp, FaComments
} from 'react-icons/fa';

// Definição de tipos
interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function AjudaESuporte() {
  // Categorias de ajuda
  const helpCategories: HelpCategory[] = [
    {
      id: 'como-anunciar',
      title: 'Como criar um anúncio de sucesso',
      description: 'Guia completo para criar anúncios eficientes que geram resultados.',
      icon: <FaListAlt className="text-blue-600" size={24} />,
      url: '/ajuda/como-anunciar'
    },
    {
      id: 'dicas-fotos',
      title: 'Dicas para fotos atrativas',
      description: 'Aprenda como tirar fotos que destacam seu produto e atraem mais interessados.',
      icon: <FaCamera className="text-blue-600" size={24} />,
      url: '/ajuda/dicas-fotos'
    },
    {
      id: 'faq',
      title: 'Perguntas frequentes',
      description: 'Respostas para as dúvidas mais comuns dos nossos usuários.',
      icon: <FaQuestionCircle className="text-blue-600" size={24} />,
      url: '/ajuda/faq'
    },
    {
      id: 'buscas',
      title: 'Como melhorar a visibilidade',
      description: 'Entenda como funciona o sistema de buscas e aumente a visibilidade dos seus anúncios.',
      icon: <FaSearchPlus className="text-blue-600" size={24} />,
      url: '/ajuda/visibilidade'
    },
    {
      id: 'seguranca',
      title: 'Segurança nas negociações',
      description: 'Dicas para garantir negociações seguras e evitar fraudes.',
      icon: <FaShieldAlt className="text-blue-600" size={24} />,
      url: '/ajuda/seguranca'
    },
    {
      id: 'planos',
      title: 'Planos e assinaturas',
      description: 'Informações sobre os planos disponíveis e como escolher o ideal para você.',
      icon: <FaMoneyBillWave className="text-blue-600" size={24} />,
      url: '/planos'
    },
  ];

  // Perguntas frequentes
  const frequentQuestions: FAQItem[] = [
    {
      question: 'Como faço para criar um anúncio?',
      answer: 'Para criar um anúncio, você precisa estar logado em sua conta. Depois, acesse "Meu Painel" e clique em "Criar Anúncio". Preencha todos os campos necessários, adicione fotos de qualidade e revise antes de publicar.'
    },
    {
      question: 'Quanto custa anunciar?',
      answer: 'Oferecemos um plano gratuito com limite de 3 anúncios ativos por 30 dias. Para mais anúncios e recursos avançados, temos planos pagos a partir de R$ 49,90/mês.'
    },
    {
      question: 'Quanto tempo leva para meu anúncio ser aprovado?',
      answer: 'A maioria dos anúncios é aprovada automaticamente. Em alguns casos, pode haver uma revisão manual que leva até 24 horas úteis.'
    },
    {
      question: 'Como renovo meu anúncio?',
      answer: 'Acesse "Meu Painel" > "Meus Anúncios" e clique no botão "Renovar" ao lado do anúncio que deseja estender.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <FaHeadset className="mr-2 text-blue-600" /> Central de Ajuda e Suporte
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Encontre respostas para suas dúvidas, tutoriais e guias para aproveitar ao máximo a plataforma BDC Classificados.
        </p>
      </div>

      {/* Banner de destaque */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 mb-10 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-6">
            <h2 className="text-2xl font-bold text-white mb-2">Precisa de ajuda?</h2>
            <p className="text-blue-100 mb-4">
              Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida ou problema.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/ajuda/contato" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center font-medium transition duration-300"
              >
                <FaEnvelope className="mr-2" /> Contato por E-mail
              </Link>
              <a 
                href="https://wa.me/5500000000000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg flex items-center font-medium transition duration-300"
              >
                <FaWhatsapp className="mr-2" /> Suporte via WhatsApp
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <Image 
              src="/images/support-team.svg" 
              alt="Equipe de suporte" 
              width={200} 
              height={200}
              className="drop-shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Categorias de ajuda */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FaBook className="mr-2 text-blue-600" /> Categorias de Ajuda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((category) => (
            <Link 
              key={category.id} 
              href={category.url}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 flex flex-col h-full"
            >
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-3">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{category.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 flex-grow mb-3">{category.description}</p>
              <div className="flex justify-end mt-auto">
                <span className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm">
                  Ver mais <FaChevronRight className="ml-1" size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FaQuestionCircle className="mr-2 text-blue-600" /> Perguntas Frequentes
        </h2>
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {frequentQuestions.map((faq, index) => (
            <div key={index} className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link 
            href="/ajuda/faq" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas as perguntas frequentes <FaChevronRight className="ml-1" size={12} />
          </Link>
        </div>
      </div>

      {/* CTA de contato */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <h2 className="text-xl font-bold mb-3">Não encontrou o que procurava?</h2>
        <p className="text-gray-600 mb-4">
          Entre em contato diretamente com nosso suporte e teremos prazer em ajudar.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="mailto:suporte@bdcclassificados.com.br" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center font-medium transition duration-300"
          >
            <FaEnvelope className="mr-2" /> suporte@bdcclassificados.com.br
          </a>
          <Link 
            href="/ajuda/contato" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg flex items-center justify-center font-medium transition duration-300"
          >
            <FaComments className="mr-2" /> Formulário de Contato
          </Link>
        </div>
      </div>
    </div>
  );
} 