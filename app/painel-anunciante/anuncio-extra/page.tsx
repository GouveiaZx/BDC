"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaArrowLeft, FaShoppingCart, FaCreditCard, FaCheck, 
  FaRegCreditCard, FaBarcode, FaRegCalendarAlt,
  FaExclamationCircle, FaInfoCircle, FaLock
} from 'react-icons/fa';

export default function AnuncioExtra() {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'boleto'>('credit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Formatação do número do cartão
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim()
      .slice(0, 19);
    setCardNumber(formatted);
  };
  
  // Formatação da data de validade
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    
    if (value.length > 2) {
      formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    setExpiryDate(formatted);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      setError('Você precisa aceitar os termos e condições para continuar.');
      return;
    }
    
    if (paymentMethod === 'credit') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        setError('Por favor, preencha todos os campos do cartão.');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em um ambiente real, aqui você faria uma chamada para a API
      // const response = await fetch('/api/payments/process-extra-ad', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     paymentMethod,
      //     cardDetails: paymentMethod === 'credit' ? { cardNumber, cardName, expiryDate, cvv, installments } : undefined
      //   })
      // });
      
      // if (!response.ok) throw new Error('Falha ao processar pagamento');
      
      // Simulando sucesso
      setFormSubmitted(true);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setError('Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  if (formSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagamento realizado com sucesso!</h1>
            <p className="text-gray-600">
              Seu anúncio extra já está disponível para uso. Ele será válido por 90 dias.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <FaInfoCircle className="text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-800 mb-1">Detalhes da sua compra</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li><strong>Produto:</strong> Anúncio Extra</li>
                  <li><strong>Valor:</strong> R$ 24,90</li>
                  <li><strong>Validade:</strong> 90 dias</li>
                  <li><strong>Forma de pagamento:</strong> {paymentMethod === 'credit' ? 'Cartão de Crédito' : paymentMethod === 'pix' ? 'PIX' : 'Boleto Bancário'}</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/painel-anunciante/criar-anuncio" 
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 text-center"
            >
              Criar Anúncio Agora
            </Link>
            <Link 
              href="/painel-anunciante" 
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 text-center"
            >
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/painel-anunciante" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para o painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Comprar Anúncio Extra</h1>
        <p className="text-gray-600">
          Amplie seu alcance com um anúncio adicional válido por 90 dias.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Resumo da compra */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
              Resumo da compra
            </h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Anúncio Extra</span>
                                  <span className="text-gray-800 font-medium">R$ 24,90</span>
            </div>
            
            <div className="border-t border-gray-200 my-3 pt-3">
              <div className="flex justify-between items-center font-medium">
                <span className="text-gray-800">Total</span>
                <span className="text-lg text-green-600">R$ 24,90</span>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 rounded-md p-4">
              <div className="flex">
                <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-800 text-sm mb-1">O que está incluído</h3>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                    <li>1 anúncio adicional</li>
                    <li>Validade de 90 dias</li>
                    <li>Todas as mesmas funcionalidades de um anúncio regular</li>
                    <li>Visibilidade total na plataforma</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Formulário de pagamento */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
              Informações de pagamento
            </h2>
            
            {/* Métodos de pagamento */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Escolha como pagar</h3>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-4 flex flex-col items-center justify-center rounded-md border transition-colors ${
                    paymentMethod === 'credit' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <FaRegCreditCard className={`text-xl mb-2 ${paymentMethod === 'credit' ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'credit' ? 'text-green-600' : 'text-gray-700'}`}>
                    Cartão de Crédito
                  </span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 flex flex-col items-center justify-center rounded-md border transition-colors ${
                    paymentMethod === 'pix'
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className={`text-xl mb-2 font-bold ${paymentMethod === 'pix' ? 'text-green-600' : 'text-gray-500'}`}>
                    PIX
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === 'pix' ? 'text-green-600' : 'text-gray-700'}`}>
                    Pagamento Instantâneo
                  </span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-4 flex flex-col items-center justify-center rounded-md border transition-colors ${
                    paymentMethod === 'boleto'
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <FaBarcode className={`text-xl mb-2 ${paymentMethod === 'boleto' ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === 'boleto' ? 'text-green-600' : 'text-gray-700'}`}>
                    Boleto Bancário
                  </span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Informações de cartão de crédito */}
              {paymentMethod === 'credit' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Número do cartão
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome no cartão
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Como está escrito no cartão"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Validade
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">
                      Parcelamento
                    </label>
                    <select
                      id="installments"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="1">À vista - R$ 24,90</option>
                                              <option value="2">2x sem juros - R$ 12,45</option>
                        <option value="3">3x sem juros - R$ 8,30</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* PIX */}
              {paymentMethod === 'pix' && (
                <div className="bg-gray-50 p-6 rounded-md mb-6 text-center">
                  <div className="border-4 border-gray-200 inline-block p-4 rounded-md bg-white mb-4">
                    <div className="w-40 h-40 bg-gray-200"></div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Escaneie o código PIX acima ou copie o código abaixo:
                  </p>
                  <div className="flex">
                    <input
                      type="text"
                      value="00020101021226890014BR.GOV.BCB.PIX2584example.com/pix/v2/11111111-1111-1111-1111-11111111111152040000530398654042.005802BR5913BuscaAquiBDC6009Sao Paulo62150511ANUNCIOEXTRA63044BF5"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-600"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md border border-gray-300 border-l-0 hover:bg-gray-300"
                      onClick={() => navigator.clipboard.writeText("00020101021226890014BR.GOV.BCB.PIX2584example.com/pix/v2/11111111-1111-1111-1111-11111111111152040000530398654042.005802BR5913BuscaAquiBDC6009Sao Paulo62150511ANUNCIOEXTRA63044BF5")}
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    O anúncio extra será ativado após a confirmação do pagamento.
                  </p>
                </div>
              )}
              
              {/* Boleto */}
              {paymentMethod === 'boleto' && (
                <div className="bg-gray-50 p-6 rounded-md mb-6">
                  <div className="flex items-start mb-4">
                    <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700">
                        Ao finalizar sua compra, você receberá um boleto bancário para pagamento.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        O anúncio extra será ativado em até 3 dias úteis após a compensação do pagamento.
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    className="w-full mt-2 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 flex items-center justify-center"
                  >
                    <FaBarcode className="mr-2" /> Gerar Boleto
                  </button>
                </div>
              )}
              
              {/* Termos e condições */}
              <div className="mb-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    Eu concordo com os <Link href="/termos" className="text-blue-600 hover:underline">termos e condições</Link> e com a <Link href="/privacidade" className="text-blue-600 hover:underline">política de privacidade</Link>.
                  </label>
                </div>
              </div>
              
              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <FaExclamationCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}
              
              {/* Botão de finalizar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2" /> 
                    Finalizar Compra - R$ 24,90
                  </>
                )}
              </button>
              
              <div className="mt-4 flex justify-center items-center text-sm text-gray-500">
                <FaLock className="mr-2" />
                <span>Pagamento 100% seguro</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 