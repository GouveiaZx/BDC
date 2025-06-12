"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaLock, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { useAdmin } from '../AdminContext';

export default function AdminLogin() {
  const { login, isAuthenticated, isLoading } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  useEffect(() => {
    // Verificar parâmetros da URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectReason = urlParams.get('reason');
      
      if (redirectReason === 'session_expired') {
        setError('Sua sessão expirou. Por favor, faça login novamente.');
      } else if (redirectReason === 'auth_required') {
        setError('Autenticação necessária para acessar a área administrativa.');
      }
    }
  }, []);

  useEffect(() => {
    // Se já estiver autenticado, redirecionar
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('Autenticando...');
    
    try {
      // Validação básica
      if (!email || !password) {
        setError('Email e senha são obrigatórios');
        setStatusMessage('');
        return;
      }
      
      // Chamar a função de login do contexto
      const success = await login(email, password);
      
      if (success) {
        setStatusMessage('Login bem-sucedido, redirecionando...');
        // O redirecionamento é feito automaticamente pelo useEffect
      } else {
        setError('Email ou senha incorretos. Este login é exclusivo para administradores.');
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      setStatusMessage('');
    }
  };
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Acesso exclusivo para administradores
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <h2 className="text-xl font-semibold">Login Administrativo</h2>
            <p className="text-sm text-white/80 mt-1">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>
          
          <div className="p-6">
            {statusMessage && (
              <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                {statusMessage}
              </div>
            )}
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-md text-sm flex items-center">
                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="admin@buscaaquibdc.com.br"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              <p className="text-center text-sm text-gray-500">
                <span className="font-medium text-primary hover:text-primary-dark">
                  Este acesso é exclusivo para administradores do sistema.
                </span>
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-xs text-center text-gray-500">
              Painel exclusivo para administração da plataforma BuscaAquiBdC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 