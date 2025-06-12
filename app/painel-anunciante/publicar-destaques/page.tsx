"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaBullhorn, FaImages, FaPlus, FaVideo, FaUpload, FaClock, FaHourglassHalf, FaInfoCircle, FaCheck } from 'react-icons/fa';

export default function PublicarDestaques() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(24);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para gerenciar formulário
  const [formErrors, setFormErrors] = useState({
    title: '',
    image: ''
  });

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    // Função simplificada sem dependência do SupabaseProvider
    // TODO: Implementar verificação de autenticação
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

    const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setSubmitting(true);
        setErrorMessage('');
        
        // Obter dados de autenticação do localStorage
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        
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
          const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: Erro ao criar destaque`;
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
                      <div className="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                        <FaClock className="text-green-600 mr-2" />
                        <div>
                          <p className="text-green-800 font-medium">24 horas de destaque</p>
                          <p className="text-green-700 text-sm">
                            Incluído no seu plano atual - sem custo adicional
                          </p>
                        </div>
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-green-600 text-3xl" />
              </div>
              <h2 className="text-2xl font-medium text-gray-800 mb-2 text-center">Destaque enviado com sucesso!</h2>
              <p className="text-gray-600 mb-6 text-center">
                Seu destaque foi enviado e está <strong>aguardando aprovação</strong> pelos nossos administradores. 
                Após aprovado, ficará ativo por <strong>24 horas</strong> no topo da página principal.
                Você pode acompanhar o status em "Meus Destaques".
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => window.location.href = '/painel-anunciante'}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Voltar ao painel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 