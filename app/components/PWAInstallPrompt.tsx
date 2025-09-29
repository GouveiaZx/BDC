"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaMobile } from 'react-icons/fa';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Verificar se já está em modo standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Event listener para o prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Verificar se o usuário já rejeitou o prompt antes
      const lastPromptTime = localStorage.getItem('pwa-prompt-dismissed');
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24 horas
      
      if (!lastPromptTime || (now - parseInt(lastPromptTime)) > oneDayInMs) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpar event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installado com sucesso');
    } else {
      console.log('Instalação PWA rejeitada');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Não mostrar se já está instalado ou em iOS (que tem um processo diferente)
  if (isStandalone || !showPrompt) {
    return null;
  }

  // Prompt específico para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <FaMobile className="text-primary text-xl mr-3" />
            <h3 className="text-white font-semibold text-sm">Instalar App</h3>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
        
        <p className="text-gray-300 text-xs mb-3 leading-relaxed">
          Adicione o BuscaAquiBdC à sua tela inicial para acesso rápido e uma experiência similar a um app nativo.
        </p>
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. Toque no ícone de compartilhamento 📤</p>
          <p>2. Selecione "Adicionar à Tela de Início"</p>
          <p>3. Toque em "Adicionar"</p>
        </div>
        
        <button 
          onClick={handleDismiss}
          className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
        >
          Entendi
        </button>
      </div>
    );
  }

  // Prompt para outros navegadores
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50 max-w-md mx-auto">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <FaDownload className="text-primary text-xl mr-3" />
          <h3 className="text-white font-semibold text-sm">Instalar App</h3>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
      
      <p className="text-gray-300 text-xs mb-4 leading-relaxed">
        Instale o BuscaAquiBdC para ter acesso rápido, notificações e funcionalidade offline.
      </p>
      
      <div className="flex space-x-2">
        <button 
          onClick={handleInstallClick}
          className="flex-1 bg-primary hover:bg-primary-light text-black text-xs font-medium py-2 px-3 rounded-md transition-colors"
        >
          Instalar
        </button>
        <button 
          onClick={handleDismiss}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
        >
          Agora Não
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 