"use client";

import React, { useState } from 'react';
import { FaRegFlag, FaFlag } from 'react-icons/fa';

interface ReportButtonProps {
  adId: string;
  className?: string;
  small?: boolean;
}

const ReportButton: React.FC<ReportButtonProps> = ({ adId, className = '', small = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldShowSuccess, setShouldShowSuccess] = useState(false);

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Por favor, selecione um motivo para a denúncia.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Obter dados do usuário logado
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

      if (!userId) {
        setError('Você precisa estar logado para denunciar um anúncio. Por favor, faça login e tente novamente.');
        setIsSubmitting(false);
        return;
      }

      // Enviar denúncia para a API
      const response = await fetch('/api/anuncios/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId,
          reporterId: userId,
          reporterName: userName,
          reporterEmail: userEmail,
          reason,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setIsModalOpen(false);
        setSubmitted(true);
        
        // Limpar campos
        setReason('');
        setDescription('');
        
        // Mostrar mensagem de sucesso por 5 segundos
        setTimeout(() => {
          setShouldShowSuccess(false);
        }, 5000);
      } else {
        if (response.status === 409) {
          setError('Você já denunciou este anúncio anteriormente.');
        } else {
          setError(data.message || 'Ocorreu um erro ao enviar a denúncia. Por favor, tente novamente.');
        }
      }
    } catch (err) {
      console.error('Erro ao enviar denúncia:', err);
      setError('Ocorreu um erro de conexão. Por favor, verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center ${small ? 'text-xs' : 'text-sm'} text-gray-600 hover:text-red-600 transition-colors ${className}`}
      >
        <FaRegFlag className={`${small ? 'mr-1' : 'mr-2'}`} />
        {!small && <span>Denunciar</span>}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-8">
                <FaFlag className="mx-auto text-4xl text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Denúncia enviada</h3>
                <p className="text-gray-600">Obrigado por ajudar a manter nossa plataforma segura. Sua denúncia será analisada.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Denunciar anúncio</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo da denúncia *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Selecione um motivo</option>
                      <option value="produto-ilegal">Produto ilegal ou proibido</option>
                      <option value="fraude">Suspeita de fraude ou golpe</option>
                      <option value="conteudo-ofensivo">Conteúdo ofensivo ou inadequado</option>
                      <option value="violencia">Incitação à violência ou discriminação</option>
                      <option value="propriedade-intelectual">Violação de propriedade intelectual</option>
                      <option value="produto-falsificado">Produto falsificado</option>
                      <option value="outro">Outro motivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição detalhada
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Forneça mais detalhes sobre o problema..."
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !reason}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                        isSubmitting || !reason
                          ? 'bg-primary-light cursor-not-allowed opacity-70'
                          : 'bg-primary hover:bg-primary-dark'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Denúncia'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton; 