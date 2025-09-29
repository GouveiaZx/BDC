"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaCamera, FaArrowLeft, FaLightbulb, FaSun, 
  FaRegCheckCircle, FaRegTimesCircle, FaImages,
  FaExclamationTriangle, FaMobile, FaInfo
} from 'react-icons/fa';

export default function DicasFotos() {
  // Dicas de fotografia
  const photographyTips = [
    {
      id: 1,
      title: 'Utilize boa iluminação',
      description: 'A luz natural é sempre a melhor opção. Fotografe perto de janelas ou em ambientes externos em dias nublados para evitar sombras fortes.',
      icon: <FaSun className="text-yellow-500" size={24} />
    },
    {
      id: 2,
      title: 'Capture múltiplos ângulos',
      description: 'Mostre seu produto de diferentes perspectivas. Para imóveis e veículos, inclua fotos do exterior e interior.',
      icon: <FaImages className="text-blue-500" size={24} />
    },
    {
      id: 3,
      title: 'Mantenha o fundo limpo',
      description: 'Um fundo neutro e sem distrações mantém o foco no que está sendo anunciado. Remova objetos desnecessários do enquadramento.',
      icon: <FaRegCheckCircle className="text-green-500" size={24} />
    },
    {
      id: 4,
      title: 'Cuide da nitidez',
      description: 'Evite fotos tremidas ou desfocadas. Use um tripé ou apoie o celular em uma superfície estável se necessário.',
      icon: <FaMobile className="text-purple-500" size={24} />
    },
    {
      id: 5,
      title: 'Mostre detalhes importantes',
      description: 'Faça fotos aproximadas de detalhes relevantes, como etiquetas, detalhes de acabamento ou possíveis defeitos.',
      icon: <FaLightbulb className="text-amber-500" size={24} />
    }
  ];

  // Exemplos de fotos
  const photoExamples = [
    {
      category: 'Imóveis',
      good: {
        src: '/images/real-estate-good.jpg',
        description: 'Foto ampla com luz natural, mostrando todo o ambiente e com boa organização do espaço.'
      },
      bad: {
        src: '/images/real-estate-bad.jpg',
        description: 'Foto escura, com objetos pessoais à vista e enquadramento parcial do ambiente.'
      }
    },
    {
      category: 'Veículos',
      good: {
        src: '/images/vehicle-good.jpg',
        description: 'Foto em luz do dia, mostrando o veículo completo, limpo e em um ângulo que valoriza o design.'
      },
      bad: {
        src: '/images/vehicle-bad.jpg',
        description: 'Foto com reflexos indesejados, ângulo ruim e veículo sujo ou em ambiente desfavorável.'
      }
    },
    {
      category: 'Produtos em geral',
      good: {
        src: '/images/product-good.jpg',
        description: 'Produto bem posicionado, com iluminação adequada e fundo neutro destacando o item.'
      },
      bad: {
        src: '/images/product-bad.jpg',
        description: 'Produto mal enquadrado, com sombras intensas e fundo desorganizado que distrai a atenção.'
      }
    }
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
          <FaCamera className="mr-2 text-blue-600" /> Dicas para fotos atrativas
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Aprenda como tirar fotos que destacam seu produto e aumentam significativamente 
          suas chances de conseguir bons resultados com seus anúncios.
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
              <strong>Uma boa foto vale mais que mil palavras!</strong> Anúncios com fotos de qualidade 
              recebem até 5x mais visualizações e têm 70% mais chances de serem concluídos com sucesso.
            </p>
          </div>
        </div>
      </div>

      {/* Dicas principais */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">5 dicas essenciais para fotos de qualidade</h2>
        
        <div className="space-y-6">
          {photographyTips.map((tip) => (
            <div key={tip.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0 mr-3">
                  {tip.icon}
                </div>
                <h3 className="text-xl font-semibold">{tip.title}</h3>
              </div>
              <p className="text-gray-600 ml-10">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exemplos comparativos */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Comparativo: O que fazer e o que evitar</h2>
        
        <div className="space-y-10">
          {photoExamples.map((example, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-800 text-white p-3">
                <h3 className="text-lg font-medium">{example.category}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Exemplo bom */}
                <div className="p-4 border-r border-gray-200">
                  <div className="flex items-center mb-3">
                    <FaRegCheckCircle className="text-green-500 mr-2" size={18} />
                    <h4 className="font-medium text-green-700">Foto ideal</h4>
                  </div>
                  
                  <div className="relative h-48 md:h-64 w-full mb-3 bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Imagem simulada - {example.category}</p>
                    {/* Em um caso real, você usaria: 
                    <Image 
                      src={example.good.src}
                      alt={`Bom exemplo de foto de ${example.category}`}
                      layout="fill"
                      objectFit="contain"
                    /> */}
                  </div>
                  
                  <p className="text-sm text-gray-600">{example.good.description}</p>
                </div>
                
                {/* Exemplo ruim */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center mb-3">
                    <FaRegTimesCircle className="text-red-500 mr-2" size={18} />
                    <h4 className="font-medium text-red-700">O que evitar</h4>
                  </div>
                  
                  <div className="relative h-48 md:h-64 w-full mb-3 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Imagem simulada - {example.category}</p>
                    {/* Em um caso real, você usaria: 
                    <Image 
                      src={example.bad.src}
                      alt={`Mau exemplo de foto de ${example.category}`}
                      layout="fill"
                      objectFit="contain"
                    /> */}
                  </div>
                  
                  <p className="text-sm text-gray-600">{example.bad.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas por categoria */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Dicas específicas por categoria</h2>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recomendações
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade ideal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Imóveis
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Fotografe todos os cômodos, área externa, fachada. Use luz natural e mostre a amplitude dos espaços.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    10-15 fotos
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Veículos
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Exterior de vários ângulos, interior, painel, motor, detalhes importantes. Fotografe em local bem iluminado.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    8-12 fotos
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Eletrônicos
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Mostre o produto funcionando, todos os acessórios incluídos, condição física do aparelho.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    5-8 fotos
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Móveis
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Capture o móvel completo e detalhes do acabamento. Inclua medidas no anúncio.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    4-6 fotos
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Roupas e acessórios
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Fotografe em cabide ou manequim, mostre etiquetas e detalhes do tecido. Luz natural é essencial.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    3-5 fotos
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alertas e dicas finais */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Erros comuns a evitar</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start mb-6">
            <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-lg mb-2">O que não fazer nas suas fotos</h3>
              <p className="text-gray-700 mb-4">
                Evite estes erros comuns que podem prejudicar a percepção dos interessados sobre seu anúncio:
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Fotos com baixa resolução ou desfocadas</span>
                </li>
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Ambientes mal iluminados ou muito escuros</span>
                </li>
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Objetos pessoais ou poluição visual no fundo</span>
                </li>
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Pessoas refletidas em espelhos ou superfícies</span>
                </li>
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Fotos editadas que não representam a realidade do item</span>
                </li>
                <li className="flex items-start">
                  <FaRegTimesCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Imagens de catálogo ou da internet (em vez de fotos reais do seu item)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Pronto para aplicar essas dicas?</h2>
        <p className="mb-4">
          Use estas orientações para criar anúncios mais atrativos e aumentar suas chances de sucesso.
        </p>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/painel-anunciante/criar-anuncio" 
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition duration-300"
          >
            Criar anúncio agora
          </Link>
          <Link 
            href="/ajuda/como-anunciar" 
            className="bg-blue-600 text-white border border-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition duration-300"
          >
            Ver dicas para anúncios
          </Link>
        </div>
      </div>
    </div>
  );
} 