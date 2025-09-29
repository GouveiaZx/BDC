"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaListAlt, FaChevronRight, FaArrowLeft, FaCheck, 
  FaTimes, FaInfo, FaExclamationTriangle, FaLightbulb,
  FaClipboardCheck, FaSearch, FaTag, FaCamera, FaFileAlt
} from 'react-icons/fa';

export default function ComoAnunciar() {
  // Dados das etapas
  const steps = [
    {
      id: 1,
      title: 'Preparação',
      description: 'Antes de criar seu anúncio, reúna informações e materiais necessários',
      checklist: [
        'Prepare fotos de alta qualidade do item ou serviço',
        'Liste todas as características e especificações técnicas',
        'Defina o preço adequado pesquisando anúncios similares',
        'Tenha em mãos documentos ou comprovantes necessários',
        'Defina condições de venda, entrega ou prestação do serviço'
      ]
    },
    {
      id: 2,
      title: 'Criação do anúncio',
      description: 'Siga o passo a passo para criar um anúncio completo e atrativo',
      substeps: [
        'Acesse seu painel e clique em "Criar Anúncio"',
        'Escolha a categoria e subcategoria adequada para seu item/serviço',
        'Preencha todos os campos do formulário com informações detalhadas',
        'Faça upload de suas fotos (recomendamos pelo menos 3 fotos de ângulos diferentes)',
        'Revise tudo antes de publicar'
      ]
    },
    {
      id: 3,
      title: 'Otimização',
      description: 'Aprimore seu anúncio para aumentar suas chances de sucesso',
      tips: [
        'Use títulos claros e objetivos que incluam palavras-chave relevantes',
        'Escreva descrições detalhadas, ressaltando diferenciais e estado de conservação',
        'Seja honesto sobre defeitos ou limitações do que está anunciando',
        'Mantenha-se disponível para responder dúvidas rapidamente',
        'Considere destacar seu anúncio para aumentar a visibilidade'
      ]
    }
  ];

  // Boas práticas
  const bestPractices = [
    {
      title: 'Seja detalhista e transparente',
      description: 'Forneça o máximo de detalhes possível sobre o que está anunciando. Isso reduz dúvidas e aumenta a confiança dos compradores.',
      icon: <FaClipboardCheck className="text-green-600" size={32} />
    },
    {
      title: 'Use palavras-chave eficientes',
      description: 'Inclua termos que potenciais compradores usariam ao buscar por itens como o seu. Pense como um comprador.',
      icon: <FaSearch className="text-blue-600" size={32} />
    },
    {
      title: 'Precifique adequadamente',
      description: 'Pesquise o mercado antes de definir o preço. Um valor justo atrai mais interessados e agiliza a venda.',
      icon: <FaTag className="text-purple-600" size={32} />
    },
    {
      title: 'Invista em boas fotos',
      description: 'Fotos de qualidade são fundamentais para destacar seu anúncio. Use boa iluminação e mostre diferentes ângulos.',
      icon: <FaCamera className="text-red-600" size={32} />
    },
    {
      title: 'Mantenha o anúncio atualizado',
      description: 'Atualize informações e renove seu anúncio regularmente para manter a relevância e visibilidade.',
      icon: <FaFileAlt className="text-yellow-600" size={32} />
    }
  ];

  // Erros comuns
  const commonMistakes = [
    'Título vago ou genérico demais',
    'Descrição curta ou incompleta',
    'Fotos de baixa qualidade ou insuficientes',
    'Preço muito acima do mercado sem justificativa',
    'Falta de informações de contato ou disponibilidade',
    'Categoria ou subcategoria incorreta',
    'Erros ortográficos ou de formatação',
    'Informações contraditórias entre título e descrição'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação */}
      <div className="mb-8">
        <Link 
          href="/ajuda" 
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          <FaArrowLeft className="mr-1" /> Voltar para Central de Ajuda
        </Link>
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <FaListAlt className="mr-2 text-blue-600" /> Como criar um anúncio de sucesso
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Aprenda as melhores práticas para criar anúncios que atraem mais visualizações, 
          geram mais contatos e aumentam suas chances de vender rapidamente.
        </p>
      </div>

      {/* Banner de destaque */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaInfo className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Anúncios com fotos de qualidade recebem até 5x mais visualizações</strong> e têm 
              70% mais chances de serem concluídos com sucesso. Invista tempo na criação do seu anúncio!
            </p>
          </div>
        </div>
      </div>

      {/* Passos principais */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Passo a passo para criar anúncios eficientes</h2>
        
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                  {step.id}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-4">{step.description}</p>
              
              {step.checklist && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Checklist:</h4>
                  <ul className="space-y-2">
                    {step.checklist.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {step.substeps && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Etapas:</h4>
                  <ol className="space-y-2">
                    {step.substeps.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium mr-2">{index + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              {step.tips && (
                <div>
                  <h4 className="font-medium mb-2">Dicas:</h4>
                  <ul className="space-y-2">
                    {step.tips.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <FaLightbulb className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Boas práticas */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Boas práticas para anúncios eficientes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestPractices.map((practice, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-3">
                  {practice.icon}
                </div>
                <h3 className="font-semibold text-lg">{practice.title}</h3>
              </div>
              <p className="text-gray-600">{practice.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Erros comuns */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Erros comuns a evitar</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start mb-4">
            <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={24} />
            <p className="text-gray-700">
              Evite estes erros frequentes que podem diminuir a eficácia do seu anúncio
              e reduzir suas chances de venda.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {commonMistakes.map((mistake, index) => (
              <div key={index} className="flex items-start">
                <FaTimes className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{mistake}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Pronto para criar seu anúncio?</h2>
        <p className="mb-4">
          Aplique as dicas que você aprendeu e crie um anúncio atrativo que gera resultados.
        </p>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/painel-anunciante/criar-anuncio" 
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition duration-300"
          >
            Criar anúncio agora
          </Link>
          <Link 
            href="/ajuda/dicas-fotos" 
            className="bg-blue-600 text-white border border-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition duration-300"
          >
            Ver dicas para fotos
          </Link>
        </div>
      </div>
    </div>
  );
} 