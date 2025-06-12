'use client';

import React from 'react';
import Link from 'next/link';
import { FaWifi, FaHome, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <FaWifi className="mx-auto text-6xl text-gray-600 mb-4" />
          <FaExclamationTriangle className="mx-auto text-4xl text-red-500 mb-6" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Você está offline
        </h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Parece que você perdeu a conexão com a internet. 
          Verifique sua conexão e tente novamente.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleReload}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaRedo className="h-4 w-4" />
            Tentar Novamente
          </button>
          
          <Link
            href="/"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaHome className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </div>
        
        <div className="mt-12 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">
            Funcionalidades offline
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Visualizar páginas visitadas recentemente</li>
            <li>• Acessar informações salvas em cache</li>
            <li>• Navegar por conteúdo já carregado</li>
          </ul>
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          <p>BuscaAquiBdC - Classificados de Balsas</p>
          <p>Versão PWA 1.0.0</p>
        </div>
      </div>
    </div>
  );
} 