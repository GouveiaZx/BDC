import { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../models/types';
import { fetchSubscriptionInfo } from './subscriptionHelper';

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: string;
  status: 'approved' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl?: string;
}

/**
 * Hook para sincronizar informações de assinatura entre páginas
 * Não depende do contexto de assinatura para funcionar
 */
export function useSubscriptionSync() {
  const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
  const [planName, setPlanName] = useState<string>('Gratuito');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [validUntil, setValidUntil] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [nextBillingDate, setNextBillingDate] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Buscar diretamente da API para garantir consistência entre páginas
  useEffect(() => {
    const syncSubscription = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSubscriptionInfo();
        console.log('Dados recebidos em useSubscriptionSync:', data);
        
        setPlan(data.plan);
        setPlanName(data.planName);
        
        if (data.endDate) {
          setValidUntil(data.endDate.toLocaleDateString('pt-BR'));
        }
        
        if (data.startDate) {
          setStartDate(data.startDate.toLocaleDateString('pt-BR'));
        }
        
        if (data.nextBillingDate) {
          setNextBillingDate(data.nextBillingDate.toLocaleDateString('pt-BR'));
        }
        
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus || 'Não disponível');
        setPaymentHistory(data.paymentHistory || []);
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Erro ao sincronizar assinatura:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    syncSubscription();
  }, []);
  
  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSubscriptionInfo();
      
      setPlan(data.plan);
      setPlanName(data.planName);
      
      if (data.endDate) {
        setValidUntil(data.endDate.toLocaleDateString('pt-BR'));
      }
      
      if (data.startDate) {
        setStartDate(data.startDate.toLocaleDateString('pt-BR'));
      }
      
      if (data.nextBillingDate) {
        setNextBillingDate(data.nextBillingDate.toLocaleDateString('pt-BR'));
      }
      
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus || 'Não disponível');
      setPaymentHistory(data.paymentHistory || []);
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    plan, 
    planName, 
    validUntil, 
    startDate,
    nextBillingDate,
    status, 
    paymentStatus,
    paymentHistory,
    paymentMethods,
    isLoading, 
    refresh 
  };
} 