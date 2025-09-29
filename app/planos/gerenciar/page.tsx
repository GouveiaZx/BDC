"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan } from '../../models/types';
import SubscriptionWrapper from './SubscriptionWrapper';
import { redirect } from 'next/navigation';

export default function ManageSubscriptionPage() {
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Buscando dados do usuário para gerenciar assinatura...');
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            console.log('Usuário autenticado para gerenciamento:', data.user.name);
            console.log('Plano do usuário:', data.user.subscription || SubscriptionPlan.FREE);
            console.log('Data início:', data.user.subscriptionStartDate);
            console.log('Data fim:', data.user.subscriptionEndDate);
            
            setUserData({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              subscription: data.user.subscription || SubscriptionPlan.FREE,
              subscriptionStartDate: data.user.subscriptionStartDate ? new Date(data.user.subscriptionStartDate) : undefined,
              subscriptionEndDate: data.user.subscriptionEndDate ? new Date(data.user.subscriptionEndDate) : undefined,
            });
          } else {
            console.log('Usuário não autenticado para gerenciamento de assinatura');
            // Redirecionar para login se não estiver autenticado
            router.push('/login?callbackUrl=/planos/gerenciar');
          }
        } else {
          console.error('Erro na resposta da API de gerenciamento:', response.status);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário para gerenciamento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Gerenciar Assinatura</h1>
      <SubscriptionWrapper user={userData} />
    </div>
  );
} 