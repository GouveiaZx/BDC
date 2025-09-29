"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GerenciarPagamentoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/painel-anunciante/pagamentos');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para gerenciamento de pagamentos...</p>
      </div>
    </div>
  );
} 