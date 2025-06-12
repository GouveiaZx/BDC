"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaCheckCircle, FaBullhorn, FaArrowLeft, FaCopy, FaQrcode,
  FaBarcode, FaCreditCard, FaInfoCircle, FaWhatsapp, FaEnvelope,
  FaHome, FaTags, FaClock, FaCalendarAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PaymentResult {
  paymentId: string;
  adTitle: string;
  amount: number;
  method: 'pix' | 'boleto' | 'cartao';
  pixCode?: string;
  pixQrCode?: string;
  invoiceUrl?: string;
}

const SucessoDestaquePage = () => {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recuperar dados do pagamento do localStorage
    const savedData = localStorage.getItem('paymentResult');
    
    if (!savedData) {
      toast.error('Dados do pagamento não encontrados');
      router.push('/painel-anunciante');
      return;
    }

    try {
      const data = JSON.parse(savedData) as PaymentResult;
      setPaymentData(data);
      
      // Limpar dados após uso
      localStorage.removeItem('paymentResult');
    } catch (error) {
      console.error('Erro ao processar dados do pagamento:', error);
      toast.error('Erro ao carregar dados do pagamento');
      router.push('/painel-anunciante');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const copyPixCode = async () => {
    if (paymentData?.pixCode) {
      try {
        await navigator.clipboard.writeText(paymentData.pixCode);
        toast.success('Código PIX copiado!');
      } catch (error) {
        toast.error('Erro ao copiar código PIX');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/painel-anunciante" className="text-gray-600 hover:text-gray-800 mr-4">
          <FaArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaCheckCircle className="mr-3 text-green-600" />
            Destaque Solicitado!
          </h1>
          <p className="text-gray-600 mt-1">Seu anúncio será destacado após a confirmação do pagamento</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Confirmação */}
          <div className="space-y-6">
            {/* Card principal de sucesso */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaBullhorn className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  Destaque Criado com Sucesso!
                </h2>
                <p className="text-green-700">
                  Seu anúncio será destacado assim que o pagamento for confirmado.
                </p>
              </div>
            </div>

            {/* Resumo do destaque */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Destaque</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Anúncio:</span>
                  <span className="font-medium text-right max-w-xs truncate">{paymentData.adTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duração:</span>
                  <span className="font-medium">3 dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-green-600">R$ {paymentData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Pagamento:</span>
                  <span className="font-mono text-sm">{paymentData.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium flex items-center">
                    {paymentData.method === 'pix' && <><FaQrcode className="mr-1" /> PIX</>}
                    {paymentData.method === 'boleto' && <><FaBarcode className="mr-1" /> Boleto</>}
                    {paymentData.method === 'cartao' && <><FaCreditCard className="mr-1" /> Cartão</>}
                  </span>
                </div>
              </div>
            </div>

            {/* Próximos passos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <FaInfoCircle className="mr-2" />
                Próximos Passos
              </h3>
              
              <div className="space-y-3 text-blue-700">
                {paymentData.method === 'pix' && (
                  <>
                    <div className="flex items-start">
                      <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                      <span>1. Realize o pagamento via PIX usando o código ao lado</span>
                    </div>
                    <div className="flex items-start">
                      <FaClock className="mr-2 mt-0.5 text-blue-600" />
                      <span>2. A confirmação é instantânea após o pagamento</span>
                    </div>
                    <div className="flex items-start">
                      <FaBullhorn className="mr-2 mt-0.5 text-blue-600" />
                      <span>3. Seu anúncio será destacado automaticamente</span>
                    </div>
                  </>
                )}
                
                {paymentData.method === 'boleto' && (
                  <>
                    <div className="flex items-start">
                      <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                      <span>1. Imprima o boleto usando o link ao lado</span>
                    </div>
                    <div className="flex items-start">
                      <FaClock className="mr-2 mt-0.5 text-blue-600" />
                      <span>2. Pague em qualquer banco ou lotérica</span>
                    </div>
                    <div className="flex items-start">
                      <FaCalendarAlt className="mr-2 mt-0.5 text-blue-600" />
                      <span>3. Confirmação em até 3 dias úteis</span>
                    </div>
                    <div className="flex items-start">
                      <FaBullhorn className="mr-2 mt-0.5 text-blue-600" />
                      <span>4. Seu anúncio será destacado automaticamente</span>
                    </div>
                  </>
                )}
                
                {paymentData.method === 'cartao' && (
                  <>
                    <div className="flex items-start">
                      <FaCheckCircle className="mr-2 mt-0.5 text-blue-600" />
                      <span>1. Pagamento em processamento</span>
                    </div>
                    <div className="flex items-start">
                      <FaClock className="mr-2 mt-0.5 text-blue-600" />
                      <span>2. Aprovação em até 24 horas</span>
                    </div>
                    <div className="flex items-start">
                      <FaBullhorn className="mr-2 mt-0.5 text-blue-600" />
                      <span>3. Seu anúncio será destacado automaticamente</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Área de pagamento específica */}
          <div className="space-y-6">
            {/* PIX */}
            {paymentData.method === 'pix' && paymentData.pixCode && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaQrcode className="mr-2 text-blue-600" />
                  Pagamento via PIX
                </h3>
                
                {paymentData.pixQrCode && (
                  <div className="text-center mb-4">
                    <img 
                      src={`data:image/png;base64,${paymentData.pixQrCode}`}
                      alt="QR Code PIX"
                      className="mx-auto border border-gray-200 rounded-md"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Escaneie o QR Code com seu banco
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Código PIX (Copia e Cola):
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={paymentData.pixCode}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={copyPixCode}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors"
                    >
                      <FaCopy />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cole este código no seu app de banco para fazer o pagamento
                  </p>
                </div>
              </div>
            )}

            {/* Boleto */}
            {paymentData.method === 'boleto' && paymentData.invoiceUrl && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaBarcode className="mr-2 text-blue-600" />
                  Boleto Bancário
                </h3>
                
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <FaBarcode className="mx-auto text-blue-600 text-3xl mb-2" />
                    <p className="text-blue-800 font-medium">Boleto gerado com sucesso!</p>
                    <p className="text-blue-600 text-sm mt-1">
                      Valor: R$ {paymentData.amount.toFixed(2)}
                    </p>
                  </div>
                  
                  <a
                    href={paymentData.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition-colors"
                  >
                    Visualizar/Imprimir Boleto
                  </a>
                  
                  <p className="text-sm text-gray-600 mt-3">
                    Pague em qualquer banco, lotérica ou internet banking
                  </p>
                </div>
              </div>
            )}

            {/* Cartão */}
            {paymentData.method === 'cartao' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaCreditCard className="mr-2 text-blue-600" />
                  Cartão de Crédito
                </h3>
                
                <div className="text-center">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <FaCreditCard className="mx-auto text-amber-600 text-3xl mb-2" />
                    <p className="text-amber-800 font-medium">Pagamento em processamento</p>
                    <p className="text-amber-600 text-sm mt-1">
                      Aguardando aprovação da operadora
                    </p>
                    <p className="text-amber-600 text-sm">
                      Você receberá uma confirmação em até 24 horas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
              
              <div className="space-y-3">
                <Link
                  href="/painel-anunciante"
                  className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <FaHome className="mr-2" />
                  Voltar ao Dashboard
                </Link>
                
                <Link
                  href="/painel-anunciante/meus-destaques"
                  className="w-full flex items-center justify-center p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                >
                  <FaBullhorn className="mr-2" />
                  Ver Meus Destaques
                </Link>
                
                <Link
                  href="/painel-anunciante/criar-anuncio"
                  className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  <FaTags className="mr-2" />
                  Criar Novo Anúncio
                </Link>
              </div>
            </div>

            {/* Suporte */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Precisa de Ajuda?</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <FaWhatsapp className="mr-2 text-green-600" />
                  <span>WhatsApp: (98) 9 9999-9999</span>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="mr-2 text-blue-600" />
                  <span>Email: suporte@buscaaquibdc.com</span>
                </div>
                <p className="text-gray-600 mt-2">
                  Nossa equipe está disponível de segunda a sexta, das 8h às 18h.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SucessoDestaquePage; 