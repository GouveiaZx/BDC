"use client";

import { ReactNode, useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { SubscriptionProvider } from '../lib/subscriptionContext';
import { User, UserRole, SubscriptionPlan } from '../models/types';

interface PainelAnuncianteLayoutProps {
  children: ReactNode;
}

export default function PainelAnuncianteLayout({ children }: PainelAnuncianteLayoutProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Verificar se tem token no localStorage
        const accessToken = localStorage.getItem('sb-access-token');
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        console.log('Verificando dados para painel anunciante - Token:', accessToken ? 'Presente' : 'Ausente');
        console.log('Verificando dados para painel anunciante - UserId:', userId || 'Ausente');
        
        // Se tivermos um ID temporário, podemos criar o usuário sem chamar a API
        if (userId && userId.startsWith('temp-id-')) {
          console.log('Usando ID temporário para criar usuário local:', userId);
          
          // Criar objeto User com os dados locais
          const user: User = {
            id: userId,
            name: userName || userEmail?.split('@')?.[0] || 'Usuário',
            email: userEmail || '',
            role: UserRole.ADVERTISER,
            subscription: SubscriptionPlan.FREE,
            subscriptionStartDate: new Date(),
            subscriptionEndDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            cardSaved: false,
            freeAdUsed: false
          };
          
          setUserData(user);
          setIsLoading(false);
          return;
        }
        
        // Para usuários normais, continuar com a verificação pela API
        let headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Adicionar token ao cabeçalho se existir
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Tentar com método POST enviando o token e userId no corpo
        const response = await fetch('/api/auth/check', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ 
            token: accessToken,
            userId: userId,
            email: userEmail,
            name: userName
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            console.log('Autenticação bem-sucedida para painel anunciante:', data.user.id);
            
            // Criar objeto User com os dados da API
            const user: User = {
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
            };
            
            setUserData(user);
          } else {
            // Log informativo em vez de erro
            console.log('Usuário não autenticado:', data.error);
          }
        } else if (response.status === 401) {
          // Status 401 é esperado quando o usuário não está logado
          console.log('Usuário não autenticado (status 401)');
        } else {
          // Outros erros realmente precisam ser logados
          console.error('Erro na resposta da API:', response.status, response.statusText);
          
          // Tentar ler o corpo do erro
          try {
            const errorBody = await response.json();
            console.error('Detalhes do erro:', errorBody);
          } catch (e) {
            console.error('Não foi possível obter detalhes do erro');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <ProtectedRoute requireAuth={true} redirectTo="/login">
      <SubscriptionProvider user={userData}>
        {isLoading ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          children
        )}
      </SubscriptionProvider>
    </ProtectedRoute>
  );
} 