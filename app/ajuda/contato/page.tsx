"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FaHeadset, FaArrowLeft, FaEnvelope, FaWhatsapp, 
  FaComment, FaUser, FaTag, FaPaperPlane, FaPhone, 
  FaMapMarkerAlt, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';

// Tipos
interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  acceptTerms: boolean;
}

export default function Contato() {
  // Estado do formulário
  const [formState, setFormState] = useState<ContactFormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    acceptTerms: false
  });

  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Opções para o campo assunto
  const subjectOptions = [
    { value: '', label: 'Selecione o assunto' },
    { value: 'anuncio', label: 'Dúvidas sobre anúncios' },
    { value: 'conta', label: 'Problemas com minha conta' },
    { value: 'pagamento', label: 'Pagamentos e assinaturas' },
    { value: 'sugestao', label: 'Sugestões ou feedback' },
    { value: 'bug', label: 'Reportar um problema técnico' },
    { value: 'outros', label: 'Outros assuntos' },
  ];

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormState({
        ...formState,
        [name]: target.checked
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    if (!formState.name || !formState.email || !formState.subject || !formState.message) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    if (!formState.acceptTerms) {
      setSubmitError('Você precisa aceitar os termos para enviar o formulário.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setSubmitError('Por favor, insira um endereço de e-mail válido.');
      return false;
    }

    return true;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação de envio - em um ambiente real, você faria uma chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulação de sucesso
      setSubmitSuccess(true);
      
      // Limpar formulário
      setFormState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        acceptTerms: false
      });
    } catch (error) {
      // Simulação de erro
      setSubmitError('Ocorreu um erro ao enviar seu contato. Por favor, tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <FaHeadset className="mr-2 text-blue-600" /> Entre em Contato
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Estamos aqui para ajudar. Preencha o formulário abaixo e nossa equipe 
          entrará em contato o mais breve possível.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Informações de contato */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <FaComment className="mr-2 text-blue-600" /> Fale Conosco
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 mb-3">
                  Prefere entrar em contato direto? Utilize um de nossos canais:
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <FaEnvelope />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">E-mail de Suporte</p>
                      <a href="mailto:suporte@buscaaquibdc.com" className="text-blue-600 hover:text-blue-800">
                        suporte@buscaaquibdc.com
                      </a>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <FaWhatsapp />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <a href="https://wa.me/5599984447055" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        (99) 98444-7055
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Seg-Sex, 8h às 18h
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <FaPhone />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Telefone</p>
                      <a href="tel:+5599984447055" className="text-blue-600 hover:text-blue-800">
                        (99) 98444-7055
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Seg-Sex, 8h às 18h
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <FaMapMarkerAlt />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Endereço</p>
                      <p className="text-gray-700">
                        Rua Exemplo, 123 - Centro<br />
                        Blumenau/SC - CEP 89000-000
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 mb-3">
                  Tempo médio de resposta:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <FaWhatsapp className="text-green-500 mr-2" />
                    <span>WhatsApp: em até 2 horas</span>
                  </li>
                  <li className="flex items-center">
                    <FaEnvelope className="text-blue-500 mr-2" />
                    <span>E-mail: em até 24 horas</span>
                  </li>
                  <li className="flex items-center">
                    <FaComment className="text-yellow-500 mr-2" />
                    <span>Formulário: em até 24 horas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de contato */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                  <FaCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Mensagem enviada com sucesso!</h2>
                <p className="text-gray-600 mb-6">
                  Agradecemos seu contato. Nossa equipe responderá o mais breve possível.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <FaPaperPlane className="mr-2 text-blue-600" /> Formulário de Contato
                </h2>
                
                {submitError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{submitError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Assunto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaTag className="text-gray-400" />
                      </div>
                      <select
                        id="subject"
                        name="subject"
                        value={formState.subject}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        {subjectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva em detalhes como podemos ajudar..."
                    required
                  ></textarea>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formState.acceptTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                      Concordo com a <Link href="/politica-privacidade" className="text-blue-600 hover:text-blue-800">Política de Privacidade</Link> e autorizo o uso dos meus dados para contato.
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar mensagem'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 