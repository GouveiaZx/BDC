"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import SubscriptionWrapper from '../../planos/gerenciar/SubscriptionWrapper';
import { SubscriptionPlan } from '../../models/types';

export default function PainelPagamentos() {
  const router = useRouter();
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    subscription: SubscriptionPlan.FREE,
    subscriptionStartDate: undefined as Date | undefined,
    subscriptionEndDate: undefined as Date | undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            setUserData({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              subscription: data.user.subscription || SubscriptionPlan.FREE,
              subscriptionStartDate: data.user.subscriptionStartDate ? new Date(data.user.subscriptionStartDate) : undefined,
              subscriptionEndDate: data.user.subscriptionEndDate ? new Date(data.user.subscriptionEndDate) : undefined,
            });
          } else {
            // Redirecionar para login se não estiver autenticado
            router.push('/login?callbackUrl=/painel-anunciante/pagamentos');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link href="/painel-anunciante" className="flex items-center text-blue-600 hover:text-blue-800 mr-4">
          <FaArrowLeft className="mr-1" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold">Gerenciar Assinatura</h1>
      </div>

      <SubscriptionWrapper user={userData} />
    </div>
  );
} 