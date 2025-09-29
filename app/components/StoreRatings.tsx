'use client';

import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { Rating, Store } from '../models/types';
import { formatDate } from '../utils/formatters';

interface StoreRatingsProps {
  store: Store;
}

export default function StoreRatings({ store }: StoreRatingsProps) {
  const [activeTab, setActiveTab] = useState<'ratings' | 'add-rating'>('ratings');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Função para calcular quantidade de estrelas
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (halfStar) {
      stars.push(<StarHalf key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }
    
    // Adicionar estrelas vazias
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-5 w-5 text-yellow-400" />
      );
    }
    
    return stars;
  };
  
  // Mock da função para enviar avaliação
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!userName || !userEmail || !comment || !newRating) {
      setFormError('Por favor preencha todos os campos e selecione uma avaliação');
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    try {
      // Simulação de envio - aqui seria a chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpar o formulário
      setUserName('');
      setUserEmail('');
      setComment('');
      setNewRating(0);
      setFormSuccess('Avaliação enviada com sucesso! Após aprovação, ela será exibida.');
      
      // Voltar para a tab de avaliações
      setTimeout(() => {
        setActiveTab('ratings');
        setFormSuccess('');
      }, 3000);
    } catch (error) {
      setFormError('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="mt-10 pb-10">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Avaliações e Comentários</h2>
        <div className="flex items-center">
          <div className="flex mr-2">
            {renderStars(store.rating)}
          </div>
          <span className="text-lg font-medium text-gray-900">{store.rating.toFixed(1)}</span>
          <span className="text-gray-500 ml-1">({store.ratings.length})</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            className={`py-2 px-4 ${activeTab === 'ratings' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('ratings')}
          >
            Ver Avaliações
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'add-rating' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('add-rating')}
          >
            Adicionar Avaliação
          </button>
        </div>
      </div>
      
      {activeTab === 'ratings' ? (
        <>
          {store.ratings.length > 0 ? (
            <div className="space-y-6">
              {store.ratings.map((rating: Rating) => (
                <div key={rating.id} className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{rating.userName}</h3>
                    <span className="text-sm text-gray-500">{formatDate(rating.date)}</span>
                  </div>
                  <div className="flex mb-3">
                    {renderStars(rating.rating)}
                  </div>
                  <p className="text-gray-700">{rating.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhuma avaliação disponível para esta loja.</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setActiveTab('add-rating')}
              >
                Seja o primeiro a avaliar
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Deixe sua avaliação</h3>
          
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
              {formSuccess}
            </div>
          )}
          
          {formError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmitRating}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Sua avaliação</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        (hoverRating || newRating) >= star 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                Comentário
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {submitting ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 