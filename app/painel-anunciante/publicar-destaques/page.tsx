"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaBullhorn, FaImages, FaPlus, FaVideo, FaUpload, FaClock, FaHourglassHalf, FaInfoCircle, FaCheck, FaCreditCard, FaQrcode, FaBarcode, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/authSync';

export default function PublicarDestaques() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(24);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userPlan, setUserPlan] = useState<string>('FREE');
  
  // Estados para pagamento individual
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'cartao'>('pix');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expiryDate: '',
    cvv: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: ''
  });

  // Estados para gerenciar formulário
  const [formErrors, setFormErrors] = useState({
    title: '',
    image: ''
  });

  // Verificar autenticação e buscar plano do usuário
  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        const storedUserName = localStorage.getItem('userName') || '';
        const storedUserEmail = localStorage.getItem('userEmail') || '';
        
        setUserName(storedUserName);
        setUserEmail(storedUserEmail);
        
        if (!userId) return;

        // Buscar plano do usuário
        const response = await fetch('/api/subscriptions/current', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.subscription?.plans?.name) {
            setUserPlan(data.subscription.plans.name);
          }
        }
      } catch (error) {
        console.log('Erro ao buscar plano do usuário:', error);
        // Manter FREE como padrão
      }
    };

    checkUserPlan();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({...formErrors, image: 'A imagem deve ter no máximo 5MB'});
        return;
      }
      
      // Converter arquivo para URL temporária para preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      
      // Converter arquivo para base64 para salvar no banco
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewImage(base64); // Usar base64 como URL final
      };
      reader.readAsDataURL(file);
      
      // Limpar erro de imagem quando o usuário faz upload
      setFormErrors({...formErrors, image: ''});
    }
  };

  const validateForm = () => {
    const errors = {
      title: '',
      image: ''
    };
    let isValid = true;

    if (!title.trim()) {
      errors.title = 'O título é obrigatório';
      isValid = false;
    }

    if (!previewImage) {
      errors.image = 'É necessário fazer upload de uma imagem';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);
      console.log('[Payment] Iniciando pagamento...');
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      console.log('[Payment] UserId encontrado:', userId);

      // Validação obrigatória do CPF/CNPJ
      if (!cardData.cpfCnpj || cardData.cpfCnpj.trim() === '') {
        throw new Error('CPF/CNPJ é obrigatório para processar o pagamento');
      }

      // Validações específicas para cartão de crédito
      if (paymentMethod === 'cartao') {
        if (!cardData.holderName || cardData.holderName.trim() === '') {
          throw new Error('Nome do portador do cartão é obrigatório');
        }
        if (!cardData.number || cardData.number.trim() === '') {
          throw new Error('Número do cartão é obrigatório');
        }
        if (!cardData.expiryDate || cardData.expiryDate.trim() === '') {
          throw new Error('Data de validade é obrigatória');
        }
        if (!cardData.cvv || cardData.cvv.trim() === '') {
          throw new Error('CVV é obrigatório');
        }
        if (!cardData.postalCode || cardData.postalCode.trim() === '') {
          throw new Error('CEP é obrigatório');
        }
        if (!cardData.addressNumber || cardData.addressNumber.trim() === '') {
          throw new Error('Número do endereço é obrigatório');
        }
      }

      console.log('[Payment] Validações passaram, prosseguindo...');

      // 1. Criar/buscar cliente no Asaas
      const customerData = {
        userId,
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        cpfCnpj: cardData.cpfCnpj.replace(/\D/g, ''), // Remove formatação
        phone: '',
        postalCode: cardData.postalCode ? cardData.postalCode.replace(/\D/g, '') : '',
        address: '',
        addressNumber: cardData.addressNumber || '',
        complement: '',
        province: '',
        city: '',
        state: ''
      };

      console.log('[Payment] Criando cliente...', customerData);
      const customerResponse = await fetch('/api/payments/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customerData)
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('[Payment] Erro na criação do cliente:', errorText);
        throw new Error('Erro ao processar dados do cliente');
      }

      const customerResult = await customerResponse.json();
      console.log('[Payment] Cliente criado com sucesso:', customerResult);

      // Verificar se temos o asaas_customer_id
      if (!customerResult.customer?.asaas_customer_id) {
        console.error('[Payment] asaas_customer_id não encontrado:', customerResult);
        throw new Error('ID do cliente Asaas não encontrado');
      }

      // 2. Criar cobrança para o destaque
      const chargeData = {
        customer: customerResult.customer.asaas_customer_id,
        billingType: paymentMethod === 'cartao' ? 'CREDIT_CARD' : paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
        value: 9.90,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Destaque individual: ${title}`,
        externalReference: `highlight_individual_${Date.now()}`,
        ...(paymentMethod === 'cartao' && {
          creditCard: {
            holderName: cardData.holderName,
            number: cardData.number,
            expiryMonth: cardData.expiryDate.split('/')[0],
            expiryYear: cardData.expiryDate.split('/')[1],
            ccv: cardData.cvv
          },
          creditCardHolderInfo: {
            name: cardData.holderName,
            email: userEmail,
            cpfCnpj: cardData.cpfCnpj,
            postalCode: cardData.postalCode,
            addressNumber: cardData.addressNumber,
            phone: ''
          }
        })
      };

      console.log('[Payment] Criando cobrança...', { ...chargeData, creditCard: chargeData.creditCard ? '***' : undefined });
      const chargeResponse = await fetch('/api/payments/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(chargeData),
      });

      if (!chargeResponse.ok) {
        const errorText = await chargeResponse.text();
        console.error('[Payment] Erro na criação da cobrança:', errorText);
        throw new Error(`Erro ao processar pagamento: ${errorText}`);
      }

      const chargeResult = await chargeResponse.json();
      console.log('[Payment] Cobrança criada com sucesso:', chargeResult);

      // Verificar se temos o charge ID
      if (!chargeResult.charge?.id) {
        console.error('[Payment] ID da cobrança não encontrado:', chargeResult);
        throw new Error('ID da cobrança não encontrado');
      }

      // 3. Criar destaque pendente no banco com pagamento
      const destaqueData = {
        userId,
        title,
        description: description || '',
        imageUrl: previewImage || 'https://via.placeholder.com/400x200?text=Destaque',
        highlightType: selectedType || 'foto',
        backgroundColor: '#FF6B35',
        textColor: '#FFFFFF',
        type: 'paid_individual',
        paymentId: chargeResult.charge.id,
        paymentMethod: paymentMethod,
        status: 'pending_payment'
      };

      console.log('[Payment] Criando destaque...', destaqueData);
      const highlightResponse = await fetch('/api/destaques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(destaqueData),
      });

      if (!highlightResponse.ok) {
        const errorText = await highlightResponse.text();
        console.error('[Payment] Erro na criação do destaque:', errorText);
        throw new Error(`Erro ao criar destaque: ${errorText}`);
      }

      const highlightResult = await highlightResponse.json();
      console.log('[Payment] Destaque criado com sucesso:', highlightResult);

      // 4. Salvar dados de pagamento para página de sucesso
      const paymentSuccessData = {
        paymentId: chargeResult.charge.id,
        title: title,
        amount: 9.90,
        method: paymentMethod,
        ...(paymentMethod === 'pix' && {
          pixCode: chargeResult.charge.pixCode,
          pixQrCode: chargeResult.charge.pixQrCode
        }),
        ...(paymentMethod === 'boleto' && {
          invoiceUrl: chargeResult.charge.invoiceUrl
        })
      };

      setPaymentData(paymentSuccessData);
      
      toast.success('Pagamento processado! Destaque criado com sucesso.');
      setShowPaymentModal(false);
      setIsSubmitted(true);

    } catch (error) {
      console.error('[Payment] Erro no pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessingPayment(false);
    }
  };

    const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setSubmitting(true);
        setErrorMessage('');
        
        // Verificação de autenticação
        if (!userId) {
          setErrorMessage('Você precisa estar logado para criar um destaque. Por favor, faça login novamente.');
          setSubmitting(false);
          return;
        }

        // Preparar dados do destaque
        const destaqueData = {
          userId,
          title,
          description: description || '',
          imageUrl: previewImage || 'https://via.placeholder.com/400x200?text=Destaque',
          highlightType: selectedType || 'foto',
          backgroundColor: '#FF6B35',
          textColor: '#FFFFFF'
        };
        
        console.log('Enviando dados do destaque:', destaqueData);
        
        // Enviar para a API de destaques
        const response = await fetch('/api/destaques', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(destaqueData)
        });
        
        console.log('Resposta recebida:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Detalhes do erro:', errorData);
          
          // Tratar mensagens de erro específicas - mostrar modal de pagamento
          if (response.status === 402 && (errorData.error === 'PLAN_UPGRADE_REQUIRED' || errorData.error === 'PLAN_LIMIT_EXCEEDED')) {
            setShowPaymentModal(true);
            setSubmitting(false);
            return;
          }
          
          const errorMessage = errorData.message || errorData.error || `Erro ${response.status}: Erro ao criar destaque`;
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Destaque criado com sucesso:', result);
        
        // Mostrar mensagem de sucesso
        setIsSubmitted(true);
        
      } catch (error) {
        console.error('Erro ao criar destaque:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido ao criar destaque');
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 mb-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/painel-anunciante" className="mr-4 text-gray-500 hover:text-gray-700">
                <FaArrowLeft />
              </Link>
              <div className="flex items-center">
                <FaBullhorn className="text-green-600 mr-2" />
                <h1 className="text-xl font-medium text-gray-800">Publicar Destaques</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Crie destaques para seus produtos</h2>
            <p className="text-gray-600 text-sm mb-4">
              Os destaques são exibidos no topo da página principal por tempo limitado, 
              aumentando a visibilidade dos seus produtos para os usuários.
            </p>

            {!selectedType ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setSelectedType('foto')}
                  className="p-6 border border-gray-200 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-3">
                    <FaImages className="text-2xl" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Destaque com Foto</h3>
                  <p className="text-sm text-gray-500">
                    Crie um destaque com uma imagem do seu produto 
                    para chamar a atenção dos usuários.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedType('video')}
                  className="p-6 border border-gray-200 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full text-amber-600 mb-3">
                    <FaVideo className="text-2xl" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Destaque com Vídeo</h3>
                  <p className="text-sm text-gray-500">
                    Crie um destaque com um vídeo curto do seu produto 
                    para maior engajamento.
                  </p>
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setPreviewImage(null);
                      setTitle('');
                      setDescription('');
                      setFormErrors({title: '', image: ''});
                      setErrorMessage('');
                    }}
                    className="text-sm text-green-600 hover:text-green-800 flex items-center"
                  >
                    <FaArrowLeft className="mr-1" /> Voltar para opções
                  </button>
                </div>

                <h3 className="font-medium text-gray-800 mb-4">
                  {selectedType === 'foto' ? 'Criar destaque com foto' : 'Criar destaque com vídeo'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título do destaque
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full p-2 border rounded focus:ring focus:ring-green-200 focus:border-green-500 ${
                          formErrors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Digite um título atrativo para seu destaque"
                      />
                      {formErrors.title && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição (opcional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-green-200 focus:border-green-500"
                        placeholder="Adicione uma descrição ao seu destaque"
                        rows={3}
                      />
                    </div>

                    {/* Nota informativa sobre vinculação opcional */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex">
                        <FaInfoCircle className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                          Não é necessário vincular seu destaque a um anúncio específico. 
                          Você pode criar destaques independentes para promoções ou ofertas especiais.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Faça upload de {selectedType === 'foto' ? 'uma imagem' : 'um vídeo curto'}
                      </label>
                      <div className={`border-2 border-dashed ${formErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg p-6 text-center hover:border-green-500 transition-colors`}>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept={selectedType === 'foto' ? "image/*" : "video/*"}
                          onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <FaUpload className="mx-auto text-gray-400 text-2xl mb-2" />
                          <p className="text-sm text-gray-500">
                            Clique para fazer upload ou arraste e solte aqui
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {selectedType === 'foto' 
                              ? 'JPG, PNG ou GIF (Max. 5MB)' 
                              : 'MP4 ou MOV (Max. 15MB, 30s)'}
                          </p>
                        </label>
                      </div>
                      {formErrors.image && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duração do destaque
                      </label>
                      {userPlan === 'FREE' ? (
                        <div className="flex items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <FaClock className="text-amber-600 mr-2" />
                          <div>
                            <p className="text-amber-800 font-medium">24 horas de destaque</p>
                            <p className="text-amber-700 text-sm">
                              Plano gratuito - R$ 9,90 por destaque
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                          <FaClock className="text-green-600 mr-2" />
                          <div>
                            <p className="text-green-800 font-medium">24 horas de destaque</p>
                            <p className="text-green-700 text-sm">
                              {userPlan} - Destaques inclusos no plano
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <FaHourglassHalf className="mr-1" />
                        <span>Destaque será exibido no topo da página por 24 horas após aprovação</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pré-visualização</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-[9/16] flex items-center justify-center">
                      {previewImage ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                          {title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                              <h3 className="text-white font-bold text-lg">{title}</h3>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <FaImages className="mx-auto text-gray-300 text-4xl mb-2" />
                          <p className="text-gray-400 text-sm">
                            Faça upload de {selectedType === 'foto' ? 'uma imagem' : 'um vídeo'} 
                            para ver a pré-visualização
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 mt-4">
                      <p className="text-sm text-green-700">
                        <strong>Nota:</strong> Após o envio, seu destaque será analisado por nossa equipe de administração antes de ser publicado.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-3 hover:bg-gray-300"
                    onClick={() => {
                      setSelectedType(null);
                      setPreviewImage(null);
                      setTitle('');
                      setDescription('');
                      setFormErrors({title: '', image: ''});
                      setErrorMessage('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : 'Publicar destaque'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Pagamento Individual */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Pagamento Individual</h2>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Resumo */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Resumo do Destaque</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Título:</span>
                      <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">24 horas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">Pagamento individual</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ 9,90</span>
                    </div>
                  </div>
                </div>

                {/* Método de pagamento */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-4">Método de Pagamento</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'pix' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaQrcode className="mx-auto mb-2" />
                      <span className="text-sm font-medium">PIX</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('boleto')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'boleto' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaBarcode className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Boleto</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('cartao')}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentMethod === 'cartao' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FaCreditCard className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Cartão</span>
                    </button>
                  </div>

                  {/* Dados obrigatórios para todos os pagamentos */}
                  {paymentMethod && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800">
                        {paymentMethod === 'cartao' ? 'Dados do Cartão' : 'Dados do Pagador'}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Campos obrigatórios para todos os métodos */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/CNPJ *
                          </label>
                          <input
                            type="text"
                            value={cardData.cpfCnpj}
                            onChange={(e) => setCardData({...cardData, cpfCnpj: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                            placeholder="000.000.000-00 ou 00.000.000/0001-00"
                            required
                          />
                        </div>

                        {/* Campos específicos do cartão */}
                        {paymentMethod === 'cartao' && (
                          <>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome no Cartão *
                              </label>
                              <input
                                type="text"
                                value={cardData.holderName}
                                onChange={(e) => setCardData({...cardData, holderName: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Nome conforme impresso no cartão"
                                required
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número do Cartão *
                              </label>
                              <input
                                type="text"
                                value={cardData.number}
                                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="1234 5678 9012 3456"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Validade *
                              </label>
                              <input
                                type="text"
                                value={cardData.expiryDate}
                                onChange={(e) => setCardData({...cardData, expiryDate: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="MM/AA"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CVV *
                              </label>
                              <input
                                type="text"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="123"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CEP *
                              </label>
                              <input
                                type="text"
                                value={cardData.postalCode}
                                onChange={(e) => setCardData({...cardData, postalCode: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="00000-000"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número *
                              </label>
                              <input
                                type="text"
                                value={cardData.addressNumber}
                                onChange={(e) => setCardData({...cardData, addressNumber: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                                placeholder="123"
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Nota explicativa */}
                      <div className="text-xs text-gray-600 mt-2">
                        <span className="text-red-500">*</span> Campos obrigatórios. 
                        O CPF/CNPJ é necessário para gerar a cobrança conforme regulamentação.
                      </div>
                    </div>
                  )}

                  {/* Informações de pagamento */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        {paymentMethod === 'pix' && (
                          <div>
                            <p><strong>PIX:</strong> Confirmação instantânea</p>
                            <p>Após o pagamento, seu destaque será ativado automaticamente</p>
                          </div>
                        )}
                        {paymentMethod === 'boleto' && (
                          <div>
                            <p><strong>Boleto:</strong> Compensação em até 3 dias úteis</p>
                            <p>Destaque será ativado após confirmação do pagamento</p>
                          </div>
                        )}
                        {paymentMethod === 'cartao' && (
                          <div>
                            <p><strong>Cartão:</strong> Aprovação em até 24 horas</p>
                            <p>Destaque será ativado após confirmação do pagamento</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      `Pagar R$ 9,90`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Seus destaques ativos</h2>
            
            <div className="text-center py-12">
              <FaImages className="mx-auto text-gray-300 text-4xl mb-3" />
              <p className="text-gray-500 mb-2">Você ainda não possui destaques ativos.</p>
              <p className="text-sm text-gray-400">
                Crie seu primeiro destaque para aumentar a visibilidade dos seus anúncios.
              </p>
            </div>
          </div>
        </div>

        {isSubmitted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-green-600 text-3xl" />
              </div>
                
                <h2 className="text-2xl font-medium text-gray-800 mb-2">
                  {paymentData ? 'Pagamento realizado!' : 'Destaque enviado com sucesso!'}
                </h2>
                
                <p className="text-gray-600 mb-6">
                  {paymentData ? (
                    `Seu pagamento de R$ 9,90 foi processado e o destaque será ativado após confirmação.`
                  ) : (
                    `Seu destaque foi enviado e está aguardando aprovação pelos nossos administradores. 
                    Após aprovado, ficará ativo por 24 horas no topo da página principal.`
                  )}
                </p>
                
                {/* QR Code e Código PIX - Interface Melhorada */}
                {paymentData && paymentData.pixCode && (
                  <div className="mb-6 space-y-4">
                    
                    {/* QR Code */}
                    {paymentData.pixQrCode && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-800 mb-3">📱 Escaneie o QR Code</h4>
                        <div className="flex justify-center mb-3">
                          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                            <img 
                              src={`data:image/png;base64,${paymentData.pixQrCode}`}
                              alt="QR Code PIX"
                              className="w-56 h-56"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Abra o app do seu banco e escaneie o código acima
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">
                        📋 Ou copie o código PIX
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg border text-sm font-mono break-all mb-3">
                        {paymentData.pixCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.pixCode);
                          alert('Código PIX copiado! Cole no seu app do banco.');
                        }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        📋 Copiar código PIX
                      </button>
                    </div>

                    {/* Instruções detalhadas */}
                    <div className="bg-green-50 p-4 rounded-lg text-left border border-green-200">
                      <h5 className="font-medium text-green-900 mb-3 flex items-center">
                        💡 Como pagar com PIX:
                      </h5>
                      <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                        <li><strong>Abra o app do seu banco</strong></li>
                        <li><strong>Vá em PIX → Pagar</strong></li>
                        <li><strong>Escaneie o QR Code</strong> OU <strong>cole o código</strong></li>
                        <li><strong>Confirme o valor de R$ 9,90</strong></li>
                        <li><strong>Finalize o pagamento</strong></li>
                        <li>🎉 <strong>Seu destaque será ativado automaticamente!</strong></li>
                      </ol>
                    </div>

                    {/* Status do destaque */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">⏰ Status do seu destaque:</h5>
                      <p className="text-sm text-blue-800">
                        • <strong>Aguardando pagamento</strong> - Seu destaque está criado<br/>
                        • <strong>Após pagamento</strong> - Será ativado automaticamente<br/>
                        • <strong>Duração</strong> - 24 horas no topo da página principal
                      </p>
                    </div>
                  </div>
                )}
                
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => window.location.href = '/painel-anunciante'}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    🏠 Voltar ao painel
                  </button>
                  {paymentData && (
                    <button
                      onClick={() => window.location.href = '/painel-anunciante/meus-destaques'}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      👁️ Ver meus destaques
                </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 