"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa';

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    
    try {
      // Aqui seria implementada a lógica de envio do formulário para o backend
      console.log('Enviando formulário:', formData);
      
      // Simula atraso da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulando sucesso
      setEnviado(true);
      setFormData({
        nome: '',
        email: '',
        assunto: '',
        mensagem: '',
      });
    } catch (error) {
      setErro('Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
      console.error('Erro ao enviar:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6">
            <FaArrowLeft className="mr-2" /> Voltar para a página inicial
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entre em contato</h1>
          <p className="text-lg text-gray-600">
            Estamos aqui para ajudar. Preencha o formulário abaixo ou utilize um dos nossos canais de atendimento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Informações de contato */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Informações de contato</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FaEnvelope className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">contato@desapegabdc.com.br</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FaPhone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Telefone</p>
                    <p className="text-sm text-gray-600">(11) 4002-8922</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FaWhatsapp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-600">(11) 98765-4321</p>
                    <a 
                      href="https://wa.me/5511987654321" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-1 text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      Conversar agora
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Horário de atendimento</h3>
                <p className="text-sm text-gray-600">
                  Segunda a Sexta: 9h às 18h<br />
                  Sábado: 9h às 12h
                </p>
              </div>
            </div>
          </div>
          
          {/* Formulário de contato */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Envie sua mensagem</h2>
              
              {enviado ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Mensagem enviada com sucesso!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Obrigado por entrar em contato. Responderemos o mais breve possível.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setEnviado(false)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Enviar outra mensagem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {erro && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Erro</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{erro}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome completo</label>
                      <input
                        type="text"
                        name="nome"
                        id="nome"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="assunto" className="block text-sm font-medium text-gray-700">Assunto</label>
                    <select
                      id="assunto"
                      name="assunto"
                      required
                      value={formData.assunto}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="duvida">Dúvida</option>
                      <option value="suporte">Suporte técnico</option>
                      <option value="anuncio">Problemas com anúncio</option>
                      <option value="pagamento">Pagamentos</option>
                      <option value="sugestao">Sugestão</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700">Mensagem</label>
                    <textarea
                      id="mensagem"
                      name="mensagem"
                      rows={5}
                      required
                      value={formData.mensagem}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-medium"
                    >
                      {enviando ? 'Enviando...' : 'Enviar mensagem'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Links rápidos */}
        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/como-funciona" className="flex flex-col items-center bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Como Funciona</h3>
              <p className="text-gray-600 text-center text-sm">Saiba como nossa plataforma funciona</p>
            </Link>
            
            <Link href="/dicas-anuncios" className="flex flex-col items-center bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Dicas para Anúncios</h3>
              <p className="text-gray-600 text-center text-sm">Dicas para criar anúncios mais eficientes</p>
            </Link>
            
            <Link href="/perguntas-frequentes" className="flex flex-col items-center bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Perguntas Frequentes</h3>
              <p className="text-gray-600 text-center text-sm">Respostas para as dúvidas mais comuns</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 