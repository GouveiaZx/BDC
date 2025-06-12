"use client";

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../lib/subscriptionContext';
import { SubscriptionPlan } from '../models/types';
import { getSubscriptionLimits, canPublishFreeAd, calculateExtraAdPrice } from '../config/subscription-limits';
import { FaInfoCircle, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';

interface SubscriptionLimitCheckProps {
  activeAdsCount: number;
  lastAdDate: Date | null;
  onCanPublish: (canPublish: boolean, requiresPayment: boolean, price: number) => void;
}

export default function SubscriptionLimitCheck({ 
  activeAdsCount, 
  lastAdDate, 
  onCanPublish 
}: SubscriptionLimitCheckProps) {
  const { currentPlan, planDisplayName, isLoading } = useSubscription();
  const [status, setStatus] = useState<'loading' | 'can_publish' | 'requires_payment' | 'waiting_period' | 'limit_reached'>('loading');
  const [waitingDays, setWaitingDays] = useState(0);
  const [extraAdPrice, setExtraAdPrice] = useState(0);
  
  useEffect(() => {
    if (isLoading || !currentPlan) {
      setStatus('loading');
      return;
    }
    
    // Verificar se o usuário pode publicar um anúncio gratuitamente
    const canPublish = canPublishFreeAd(lastAdDate, activeAdsCount, currentPlan as SubscriptionPlan);
    
    // Obter as configurações do plano
    const planLimits = getSubscriptionLimits(currentPlan as SubscriptionPlan);
    
    if (canPublish) {
      setStatus('can_publish');
      onCanPublish(true, false, 0);
      return;
    }
    
    // Se não pode publicar gratuitamente, verificar o motivo
    
    // Verificar se o usuário atingiu o limite de anúncios do plano
    if (activeAdsCount >= planLimits.maxAds) {
      // Verificar se é possível publicar anúncios extras pagos
      const price = calculateExtraAdPrice(activeAdsCount, currentPlan as SubscriptionPlan);
      setExtraAdPrice(price);
      
      if (price > 0) {
        setStatus('requires_payment');
        onCanPublish(true, true, price);
      } else {
        setStatus('limit_reached');
        onCanPublish(false, false, 0);
      }
      return;
    }
    
    // Se estiver no plano gratuito e não puder publicar, verificar período de espera
    if (currentPlan === SubscriptionPlan.FREE && lastAdDate) {
      const waitingPeriodMs = planLimits.waitingPeriodDays * 24 * 60 * 60 * 1000;
      const timeSinceLastAd = Date.now() - lastAdDate.getTime();
      const remainingMs = waitingPeriodMs - timeSinceLastAd;
      
      if (remainingMs > 0) {
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        setWaitingDays(remainingDays);
        setStatus('waiting_period');
        
        // Verificar se poderia publicar pagando
        const price = planLimits.extraAdPrice;
        setExtraAdPrice(price);
        onCanPublish(true, true, price);
      } else {
        setStatus('can_publish');
        onCanPublish(true, false, 0);
      }
    }
  }, [currentPlan, isLoading, activeAdsCount, lastAdDate, onCanPublish]);
  
  // Renderizar mensagem de status apropriada
  const renderStatusMessage = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center text-gray-500">
            <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full"></div>
            Verificando limites do plano...
          </div>
        );
        
      case 'can_publish':
        return (
          <div className="flex items-center text-green-600">
            <FaCheckCircle className="mr-2" />
            Você pode publicar este anúncio gratuitamente.
          </div>
        );
        
      case 'requires_payment':
        return (
          <div className="border p-3 rounded-md bg-yellow-50">
            <div className="flex items-center text-yellow-700 mb-2">
              <FaExclamationTriangle className="mr-2" />
              <span className="font-medium">Você atingiu o limite de anúncios gratuitos do seu plano.</span>
            </div>
            <p className="text-gray-700 mb-2">
              Você pode publicar este anúncio pagando uma taxa adicional de <strong>R$ {extraAdPrice.toFixed(2)}</strong>.
            </p>
            <div className="flex items-center text-blue-600">
              <FaCreditCard className="mr-2" />
              Será cobrado somente por este anúncio adicional.
            </div>
          </div>
        );
        
      case 'waiting_period':
        return (
          <div className="border p-3 rounded-md bg-yellow-50">
            <div className="flex items-center text-yellow-700 mb-2">
              <FaExclamationTriangle className="mr-2" />
              <span className="font-medium">Período de espera ativo para o plano gratuito.</span>
            </div>
            <p className="text-gray-700 mb-2">
              Você precisa aguardar mais <strong>{waitingDays} {waitingDays === 1 ? 'dia' : 'dias'}</strong> para publicar 
              seu próximo anúncio gratuitamente.
            </p>
            <div className="flex items-center text-blue-600">
              <FaCreditCard className="mr-2" />
              Você pode publicar agora pagando uma taxa de <strong>R$ {extraAdPrice.toFixed(2)}</strong>.
            </div>
          </div>
        );
        
      case 'limit_reached':
        return (
          <div className="flex items-center text-red-600">
            <FaTimesCircle className="mr-2" />
            Você atingiu o limite máximo de anúncios para o seu plano atual.
            <span className="ml-1 underline cursor-pointer">Faça upgrade</span>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="my-4">
      <div className="flex items-center mb-2 text-gray-700">
        <FaInfoCircle className="mr-2" />
        <h3 className="font-medium">Plano atual: {planDisplayName || 'Carregando...'}</h3>
      </div>
      
      {renderStatusMessage()}
    </div>
  );
} 