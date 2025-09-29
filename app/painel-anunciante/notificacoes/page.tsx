"use client";

import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaEnvelope, FaTag, FaMoneyBill, FaExclamationTriangle, FaCheck, FaTimes, FaCreditCard } from 'react-icons/fa';
import NotificationsWidget from '../../components/NotificationsWidget';

export default function Notificacoes() {
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    // Recuperar ID do usuário dos storages
    const userIdFromStorage = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
    setUserId(userIdFromStorage);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FaBell className="mr-2" /> Notificações
        </h1>
      </div>

      {userId ? (
        <NotificationsWidget 
          userId={userId} 
          showAll={true}
          className="min-h-[300px]"
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaBell className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Usuário não identificado</h3>
          <p className="text-gray-500">
            Não foi possível identificar o usuário. Por favor, faça login novamente.
          </p>
        </div>
      )}
    </div>
  );
} 