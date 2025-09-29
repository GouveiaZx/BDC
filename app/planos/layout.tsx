"use client";

import React, { useEffect, useState } from 'react';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { User, UserRole, SubscriptionPlan } from '../models/types';

interface PlanosLayoutProps {
  children: React.ReactNode;
}

export default function PlanosLayout({ children }: PlanosLayoutProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Buscando dados do usuário para o contexto de assinatura...');
        
        // Verificar se tem token no localStorage
        const accessToken = localStorage.getItem('sb-access-token');
        console.log('Token encontrado no localStorage:', accessToken ? `${accessToken.substring(0, 10)}...` : 'não encontrado');
        
        // Verificar cookies diretamente
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('sb-access-token='));
        console.log('Token encontrado nos cookies:', tokenCookie ? 'sim' : 'não');
        
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
            console.log('Usuário autenticado:', data.user);
            console.log('Plano de assinatura:', data.user.subscription || SubscriptionPlan.FREE);
            
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
            console.log('Usuário não autenticado');
            setUserData(null);
          }
        } else {
          console.log('Erro na resposta da API:', response.status);
          // Tentar ler o corpo da resposta para ver detalhes
          try {
            const errorData = await response.json();
            console.log('Detalhes do erro:', errorData);
          } catch (e) {
            console.log('Não foi possível ler detalhes do erro');
          }
          setUserData(null);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Renderizar um indicador de carregamento enquanto os dados são buscados
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SubscriptionProvider user={userData}>
      {children}
    </SubscriptionProvider>
  );
} 