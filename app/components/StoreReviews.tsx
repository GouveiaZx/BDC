'use client';

import { useState } from 'react';
import { Store, Rating } from '../models/types';
import { FaStar, FaRegStar, FaUserCircle } from 'react-icons/fa';

interface StoreReviewsProps {
  store: Store;
}

export default function StoreReviews({ store }: StoreReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Aqui você pode adicionar a lógica para enviar a avaliação para o servidor
    
    // Simular um envio bem-sucedido após 1 segundo
    setTimeout(() => {
      setSubmitting(false);
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      // Mostrar mensagem de sucesso ou atualizar lista de avaliações
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Avaliações</h2>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          {showReviewForm ? 'Cancelar' : 'Avaliar'}
        </button>
      </div>

      {/* Resumo das avaliações */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg min-w-[150px]">
          <span className="text-4xl font-bold text-gray-900">{store.rating.toFixed(1)}</span>
          <div className="flex mt-2">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i}
                className={`w-5 h-5 ${i < Math.floor(store.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-gray-600 mt-1">({store.reviewCount || 0} avaliações)</span>
        </div>
        
        <div className="flex-grow">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((num) => {
              const reviewCountSafe = store.reviewCount || 0;
              // Contar quantas avaliações existem para este número de estrelas
              const countForNum = store.ratings?.filter(r => r.rating === num).length || 0;
              const percent = reviewCountSafe > 0 
                ? Math.round((countForNum / reviewCountSafe) * 100) 
                : 0;
                
              return (
                <div key={num} className="flex items-center">
                  <div className="flex items-center w-24">
                    <span className="mr-2 text-gray-600">{num}</span>
                    <FaStar className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-grow h-4 mx-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-full" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600 w-12 text-right">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Formulário de avaliação */}
      {showReviewForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deixe sua avaliação</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Sua classificação
            </label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="text-2xl mr-1 focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {star <= (hoveredRating || rating) ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                Seu nome
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Seu email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="comment" className="block text-gray-700 text-sm font-medium mb-2">
              Seu comentário
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </form>
      )}

      {/* Lista de avaliações */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comentários dos clientes</h3>
        
        {store.ratings && store.ratings.length > 0 ? (
          <div className="space-y-6">
            {store.ratings.map((review: Rating, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <FaUserCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{review.userName}</h4>
                    <div className="flex items-center mt-1">
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-500 text-sm">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Esta loja ainda não possui avaliações.</p>
        )}
      </div>
    </div>
  );
} 