"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaPlay } from 'react-icons/fa';

// Interface para o tipo de destaque
interface Highlight {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  text?: string;
  userName: string;
  userAvatar: string;
  isAdmin: boolean;
  createdAt: Date;
  expiresAt: Date;
}

interface HighlightStoriesProps {
  highlights: Highlight[];
}

const HighlightStories: React.FC<HighlightStoriesProps> = ({ highlights }) => {
  const [activeStory, setActiveStory] = useState<Highlight | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Função para abrir o modal de story
  const openStory = (story: Highlight, index: number) => {
    setActiveStory(story);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden'; // Impede rolagem da página quando modal está aberto
  };

  // Função para fechar o modal de story
  const closeStory = () => {
    setActiveStory(null);
    document.body.style.overflow = ''; // Restaura rolagem da página
  };

  // Função para navegar para o próximo story
  const nextStory = () => {
    if (currentIndex < highlights.length - 1) {
      setActiveStory(highlights[currentIndex + 1]);
      setCurrentIndex(currentIndex + 1);
    } else {
      closeStory();
    }
  };

  // Função para navegar para o story anterior
  const prevStory = () => {
    if (currentIndex > 0) {
      setActiveStory(highlights[currentIndex - 1]);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') nextStory();
      if (e.key === 'ArrowLeft') prevStory();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-primary drop-shadow-sm">Destaques</h2>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {highlights.map((highlight, index) => (
          <div 
            key={highlight.id} 
            className="story-item" 
            onClick={() => openStory(highlight, index)}
          >
            <div className={`story-item__border ${highlight.isAdmin ? 'admin-story' : ''}`}>
              <div className="story-item__avatar-container">
                <Image 
                  src={highlight.userAvatar} 
                  alt={highlight.userName}
                  className="story-item__avatar"
                  width={70}
                  height={70}
                />
                {highlight.videoUrl && (
                  <div className="video-indicator">
                    <FaPlay size={10} />
                  </div>
                )}
              </div>
            </div>
            <div className="story-item__username">
              {highlight.userName.substring(0, 8)}{highlight.userName.length > 8 ? '...' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para exibir o story ativo */}
      {activeStory && (
        <div className="story-modal">
          <div className="story-modal__overlay" onClick={closeStory}></div>
          <div className="story-modal__content">
            {/* Progress Bar */}
            <div className="story-progress">
              {highlights.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`story-progress__bar ${idx === currentIndex ? 'active' : idx < currentIndex ? 'completed' : ''}`}
                ></div>
              ))}
            </div>
            
            <div className="story-modal__header">
              <div className="story-modal__user">
                <Image 
                  src={activeStory.userAvatar} 
                  alt={activeStory.userName}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-primary"
                />
                <div className="user-info">
                  <span className="user-name">{activeStory.userName}</span>
                  <span className="post-time">
                    {new Date(activeStory.createdAt).toLocaleDateString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeStory();
                }} 
                className="story-modal__close absolute top-4 right-4 z-50 bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70"
              >
                <FaTimes className="text-white text-xl" />
              </button>
            </div>
            
            <div className="story-modal__media">
              {activeStory.videoUrl ? (
                <video 
                  src={activeStory.videoUrl} 
                  autoPlay 
                  controls 
                  className="story-modal__video"
                />
              ) : (
                <Image 
                  src={activeStory.imageUrl} 
                  alt=""
                  fill
                  sizes="(max-width: 768px) 90vw, 70vw"
                  style={{ objectFit: 'cover' }}
                  className="story-modal__image"
                />
              )}
              
              {activeStory.text && (
                <div className="story-modal__text">
                  {activeStory.text}
                </div>
              )}
            </div>

            {/* Navegação entre stories */}
            <div className="story-navigation">
              <button 
                className="nav-button prev" 
                onClick={prevStory} 
                disabled={currentIndex === 0}
              ></button>
              <button 
                className="nav-button next" 
                onClick={nextStory} 
                disabled={currentIndex === highlights.length - 1}
              ></button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .highlight-stories-container {
          margin: 32px 0;
          padding: 0 16px;
        }
        
        .stories-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #fff;
          letter-spacing: 0.5px;
        }
        
        .highlight-stories {
          display: flex;
          overflow-x: auto;
          gap: 24px;
          padding: 12px 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          position: relative;
        }
        
        .highlight-stories::-webkit-scrollbar {
          display: none;
        }
        
        .story-item {
          min-width: 80px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s ease;
        }

        .story-item:hover {
          transform: scale(1.05);
        }
        
        .story-item__border {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(45deg, #7ad38e, #8CE7A4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          position: relative;
          box-shadow: 0 4px 10px rgba(122, 211, 142, 0.3);
        }
        
        .admin-story {
          background: linear-gradient(45deg, #00a86b, #4caf50);
          box-shadow: 0 4px 10px rgba(76, 175, 80, 0.5);
          border: 3px solid #00a86b;
        }

        .story-item__avatar-container {
          position: relative;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #000;
        }
        
        .story-item__avatar {
          border-radius: 50%;
          object-fit: cover;
          width: 100%;
          height: 100%;
          transition: transform 0.5s ease;
        }

        .story-item:hover .story-item__avatar {
          transform: scale(1.08);
        }
        
        .video-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #7ad38e;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          border: 2px solid #000;
        }
        
        .story-item__username {
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          color: #fff;
          max-width: 90px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .story-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .story-modal__overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(5px);
        }
        
        .story-modal__content {
          position: relative;
          width: 100%;
          max-width: 450px;
          height: 85vh;
          background-color: #000;
          border-radius: 16px;
          overflow: hidden;
          z-index: 1001;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: scaleIn 0.3s ease;
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .story-progress {
          display: flex;
          gap: 4px;
          padding: 12px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1003;
        }

        .story-progress__bar {
          height: 3px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          flex: 1;
        }

        .story-progress__bar.active {
          background-color: #7ad38e;
          animation: progressAnimation 5s linear;
        }

        .story-progress__bar.completed {
          background-color: #fff;
        }

        @keyframes progressAnimation {
          from { width: 0; }
          to { width: 100%; }
        }
        
        .story-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 12px;
          background-color: rgba(0, 0, 0, 0.6);
          position: absolute;
          top: 24px;
          left: 0;
          right: 0;
          z-index: 1002;
        }
        
        .story-modal__user {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
        }

        .post-time {
          font-size: 12px;
          opacity: 0.7;
        }
        
        .story-modal__media {
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .story-modal__image,
        .story-modal__video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .story-modal__text {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          color: #fff;
          font-size: 16px;
          line-height: 1.5;
        }

        .story-navigation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          display: flex;
          z-index: 1001;
        }

        .nav-button {
          flex: 1;
          background: transparent;
          border: none;
          cursor: pointer;
          pointer-events: auto;
          position: relative;
        }

        .nav-button.prev:after,
        .nav-button.next:after {
          content: '';
          position: absolute;
          top: 50%;
          width: 15px;
          height: 15px;
          border-top: 2px solid rgba(255, 255, 255, 0.4);
          border-left: 2px solid rgba(255, 255, 255, 0.4);
          transition: border-color 0.2s ease;
        }

        .nav-button.prev:after {
          left: 20px;
          transform: translateY(-50%) rotate(-45deg);
        }

        .nav-button.next:after {
          right: 20px;
          transform: translateY(-50%) rotate(135deg);
        }

        .nav-button:hover:after {
          border-color: rgba(255, 255, 255, 0.8);
        }

        .nav-button:disabled {
          opacity: 0;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .story-modal__content {
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HighlightStories; 