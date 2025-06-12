"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FavoritosRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página principal
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 text-xl">Redirecionando...</p>
      </div>
    </div>
  );
} 