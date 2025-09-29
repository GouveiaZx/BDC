'use client';

import React, { useState, useEffect } from 'react';
import { FaWifi, FaBan, FaSync } from 'react-icons/fa';
import { getConnectionStatus } from '../lib/supabase';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
  onStatusChange?: (isOnline: boolean) => void;
}

export default function ConnectionStatus({ 
  showDetails = false, 
  className = '', 
  onStatusChange 
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  
  // Verificar status de conexão ao montar o componente
  useEffect(() => {
    checkConnectionStatus();
    
    // Configurar listeners para eventos de conexão
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connection-restored', handleConnectionRestored);
    
    return () => {
      // Limpar listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connection-restored', handleConnectionRestored);
    };
  }, []);
  
  // Manipuladores de eventos
  const handleOnline = () => {
    // Quando o navegador fica online, verificar conexão com Supabase
    checkConnectionStatus();
  };
  
  const handleOffline = () => {
    // Quando o navegador fica offline, marcar como offline
    setIsOnline(false);
    setDiagnostics(null);
    if (onStatusChange) onStatusChange(false);
  };
  
  const handleConnectionRestored = () => {
    // Quando o evento personalizado de conexão restaurada é disparado
    setIsOnline(true);
    setDiagnostics(null);
    if (onStatusChange) onStatusChange(true);
  };
  
  // Verificar status de conexão atual
  const checkConnectionStatus = async () => {
    setIsChecking(true);
    
    try {
      // Primeiro verificar se o navegador está online
      if (!navigator.onLine) {
        setIsOnline(false);
        if (onStatusChange) onStatusChange(false);
        setIsChecking(false);
        return;
      }
      
      // Verificar se o modo offline está ativado no localStorage
      const offlineMode = localStorage.getItem('appOfflineMode') === 'true';
      if (offlineMode) {
        setIsOnline(false);
        if (onStatusChange) onStatusChange(false);
        setIsChecking(false);
        return;
      }
      
      // Verificar status no Supabase
      const connectionStatus = getConnectionStatus();
      const isOffline = connectionStatus.isOffline;
      
      setIsOnline(!isOffline);
      if (onStatusChange) onStatusChange(!isOffline);
    } catch (error) {
      console.error('Erro ao verificar status de conexão:', error);
      setIsOnline(false);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setLastCheckTime(new Date());
      setIsChecking(false);
    }
  };
  
  // Tentar reconectar manualmente
  const handleReconnect = async () => {
    setIsChecking(true);
    
    try {
      // Verificar se o navegador está online
      if (!navigator.onLine) {
        alert('Seu dispositivo está offline. Verifique sua conexão com a internet e tente novamente.');
        setIsChecking(false);
        return;
      }
      
      // Importar dinamicamente a função de diagnóstico
      const { diagnoseAndRecoverConnection } = await import('../lib/supabase');
      const diagnosticResult = await diagnoseAndRecoverConnection();
      
      setDiagnostics((diagnosticResult as any)?.diagnostics || []);
      
      if (diagnosticResult.success) {
        setIsOnline(true);
        if (onStatusChange) onStatusChange(true);
        localStorage.removeItem('appOfflineMode');
        
        // Disparar evento de conexão restaurada
        window.dispatchEvent(new CustomEvent('connection-restored'));
      } else {
        setIsOnline(false);
        if (onStatusChange) onStatusChange(false);
        localStorage.setItem('appOfflineMode', 'true');
      }
    } catch (error) {
      console.error('Erro ao tentar reconectar:', error);
      setIsOnline(false);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setLastCheckTime(new Date());
      setIsChecking(false);
    }
  };
  
  // Calcular tempo desde a última verificação
  const getTimeSinceLastCheck = () => {
    if (!lastCheckTime) return 'Nunca verificado';
    
    const now = new Date();
    const diffMs = now.getTime() - lastCheckTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} segundos atrás`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutos atrás`;
    
    return `${Math.floor(diffSec / 3600)} horas atrás`;
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        {isOnline ? (
          <FaWifi className="text-green-500 mr-2" />
        ) : (
          <FaBan className="text-red-500 mr-2" />
        )}
        
        <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
          {isOnline ? 'Conectado' : 'Desconectado'}
        </span>
        
        <button 
          onClick={handleReconnect}
          disabled={isChecking}
          className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Verificar conexão"
          title="Verificar conexão"
        >
          <FaSync className={`text-gray-600 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs">
          <p className="text-gray-600">Última verificação: {getTimeSinceLastCheck()}</p>
          
          {diagnostics && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <p>Diagnóstico de conexão:</p>
              <ul className="ml-2 mt-1">
                <li className={diagnostics.internetConnected ? 'text-green-700' : 'text-red-700'}>
                  Internet: {diagnostics.internetConnected ? 'Conectado' : 'Desconectado'}
                </li>
                <li className={diagnostics.supabaseReachable ? 'text-green-700' : 'text-red-700'}>
                  Servidor: {diagnostics.supabaseReachable ? 'Acessível' : 'Inacessível'}
                </li>
                <li className={diagnostics.clientFunctional ? 'text-green-700' : 'text-red-700'}>
                  Cliente API: {diagnostics.clientFunctional ? 'Funcional' : 'Com problemas'}
                </li>
                {diagnostics.errorDetails && (
                  <li className="text-red-700 mt-1">
                    Erro: {diagnostics.errorDetails}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 