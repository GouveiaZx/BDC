"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaEnvelope } from 'react-icons/fa';

export default function RegistrationSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-black rounded-lg border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <Image 
                src="/images/logo.png" 
                alt="BuscaAquiBdC" 
                width={180} 
                height={90}
                priority
                className="mb-8"
              />
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <FaCheckCircle className="text-green-500 w-16 h-16" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Cadastro realizado com sucesso!
          </h2>
          
          <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <FaEnvelope className="text-gray-400 w-5 h-5 mr-2" />
              <p className="text-gray-300 font-medium">Verifique seu email</p>
            </div>
            <p className="text-gray-400 text-sm">
              Enviamos um link de confirmação para o seu email. Por favor, verifique sua caixa de entrada e confirme seu cadastro.
            </p>
          </div>
          
          <p className="text-gray-400 mb-6">
            Após confirmar seu email, você poderá entrar na plataforma e aproveitar todos os recursos disponíveis.
          </p>
          
          <div className="mb-6">
            <Link 
              href="/login" 
              className="inline-block w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-green-500 hover:bg-green-600 font-medium"
            >
              Ir para o login
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            Redirecionando para a página de login em {countdown} segundos...
          </p>
        </div>
      </div>
    </div>
  );
} 