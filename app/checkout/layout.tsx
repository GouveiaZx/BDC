"use client";

import { ReactNode, useEffect, useState } from 'react';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { User, UserRole, SubscriptionPlan } from '../models/types';

interface CheckoutLayoutProps {
  children: ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Buscando dados do usuário para o contexto de checkout...');
        
        // Verificar se tem token no localStorage
        const accessToken = localStorage.getItem('sb-access-token');
        
        let headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Adicionar token ao cabeçalho se existir
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Tentar com método POST enviando o token no corpo
        const response = await fetch('/api/auth/check', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ token: accessToken })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            console.log('Usuário autenticado no checkout:', data.user.name);
            console.log('Plano do usuário no checkout:', data.user.subscription || SubscriptionPlan.FREE);
            
            setUserData({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: UserRole.ADVERTISER,
              subscription: data.user.subscription || SubscriptionPlan.FREE,
              subscriptionStartDate: data.user.subscriptionStartDate ? new Date(data.user.subscriptionStartDate) : undefined,
              subscriptionEndDate: data.user.subscriptionEndDate ? new Date(data.user.subscriptionEndDate) : undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
              cardSaved: false,
              freeAdUsed: data.user.freeAdUsed || false
            });
          } else {
            console.log('Usuário não autenticado no checkout');
            setUserData(null);
          }
        } else {
          console.error('Erro na resposta da API de verificação:', response.status);
          setUserData(null);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário para checkout:', error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <SubscriptionProvider user={userData}>
      {children}
    </SubscriptionProvider>
  );
} 