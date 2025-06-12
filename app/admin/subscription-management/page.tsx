"use client";

import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../models/types';
import { SubscriptionLimits, getSubscriptionLimits } from '../../config/subscription-limits';
import { FaCog, FaSave, FaUndo, FaInfoCircle } from 'react-icons/fa';
import AdminLayout from '../../components/layouts/AdminLayout';

interface PlanLimitConfig {
  maxAds: number;
  adDurationDays: number;
  waitingPeriodDays: number;
  extraAdPrice: number;
  featuredPrice: number;
  maxFeatured: number;
  featuredDurationDays: number;
  maxSimultaneousFeatured: number;
  maxFeaturedPerDay: number;
}

export default function SubscriptionManagementPage() {
  const [limits, setLimits] = useState<Record<SubscriptionPlan, PlanLimitConfig>>({
    [SubscriptionPlan.FREE]: getSubscriptionLimits(SubscriptionPlan.FREE) as PlanLimitConfig,
    [SubscriptionPlan.MICRO_BUSINESS]: getSubscriptionLimits(SubscriptionPlan.MICRO_BUSINESS) as PlanLimitConfig,
    [SubscriptionPlan.SMALL_BUSINESS]: getSubscriptionLimits(SubscriptionPlan.SMALL_BUSINESS) as PlanLimitConfig,
    [SubscriptionPlan.BUSINESS_SIMPLE]: getSubscriptionLimits(SubscriptionPlan.BUSINESS_SIMPLE) as PlanLimitConfig,
    [SubscriptionPlan.BUSINESS_PLUS]: getSubscriptionLimits(SubscriptionPlan.BUSINESS_PLUS) as PlanLimitConfig,
  });
  
  const [originalLimits, setOriginalLimits] = useState<Record<SubscriptionPlan, PlanLimitConfig>>(
    JSON.parse(JSON.stringify(limits))
  );
  
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Nomes legíveis para os planos
  const planNames = {
    [SubscriptionPlan.FREE]: 'Gratuito',
    [SubscriptionPlan.MICRO_BUSINESS]: 'Micro-Empresa',
    [SubscriptionPlan.SMALL_BUSINESS]: 'Pequena Empresa',
    [SubscriptionPlan.BUSINESS_SIMPLE]: 'Empresa Simples',
    [SubscriptionPlan.BUSINESS_PLUS]: 'Empresa Plus',
  };
  
  // Nomes legíveis para os campos
  const fieldLabels = {
    maxAds: 'Máximo de anúncios simultâneos',
    adDurationDays: 'Duração dos anúncios (dias)',
    waitingPeriodDays: 'Período de espera entre anúncios (dias)',
    extraAdPrice: 'Preço do anúncio extra (R$)',
    featuredPrice: 'Preço do destaque extra (R$)',
    maxFeatured: 'Máximo de destaques incluídos no plano',
    featuredDurationDays: 'Duração do destaque (dias)',
    maxSimultaneousFeatured: 'Máximo de destaques simultâneos',
    maxFeaturedPerDay: 'Máximo de destaques por dia',
  };
  
  // Função para atualizar um valor
  const handleChange = (plan: SubscriptionPlan, field: keyof PlanLimitConfig, value: number) => {
    setLimits(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: value
      }
    }));
  };
  
  // Função para salvar as configurações
  const saveConfigurations = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Aqui enviaríamos os dados para a API
      // Por enquanto, simulamos uma chamada bem-sucedida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar os valores originais
      setOriginalLimits(JSON.parse(JSON.stringify(limits)));
      
      setSuccessMessage('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setErrorMessage('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setSaving(false);
      
      // Limpar mensagem de sucesso após alguns segundos
      if (successMessage) {
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    }
  };
  
  // Função para reverter mudanças
  const revertChanges = () => {
    setLimits(JSON.parse(JSON.stringify(originalLimits)));
    setSuccessMessage('');
    setErrorMessage('');
  };
  
  // Verificar se houve mudanças
  const hasChanges = JSON.stringify(limits) !== JSON.stringify(originalLimits);
  
  return (
    <AdminLayout>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaCog className="mr-2" /> Configurações de Planos de Assinatura
          </h1>
          <div className="space-x-2">
            <button
              onClick={revertChanges}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 rounded-md flex items-center ${
                !hasChanges ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <FaUndo className="mr-1" /> Descartar
            </button>
            <button
              onClick={saveConfigurations}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 rounded-md flex items-center ${
                !hasChanges ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaSave className="mr-1" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-start">
          <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
          <p>
            Estas configurações definem os limites e preços para cada plano de assinatura.
            Ao salvar, os novos valores serão aplicados para todas as operações futuras.
            <strong> Obs: Usuários existentes continuarão com suas configurações anteriores até a renovação.</strong>
          </p>
        </div>
        
        <div className="space-y-8">
          {Object.entries(limits).map(([planKey, planConfig]) => {
            const plan = planKey as SubscriptionPlan;
            return (
              <div key={plan} className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
                  Plano {planNames[plan]}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(planConfig).map(([fieldKey, value]) => {
                    const field = fieldKey as keyof PlanLimitConfig;
                    return (
                      <div key={`${plan}-${field}`} className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {fieldLabels[field]}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={field.includes('Price') ? '0.01' : '1'}
                          value={value}
                          onChange={(e) => handleChange(plan, field, parseFloat(e.target.value))}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
} 