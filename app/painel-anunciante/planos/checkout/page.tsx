'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import SubscriptionCheckout from './SubscriptionCheckout'

// Mapeamento dos planos - corrigido para usar os valores corretos da API
const planMapping = {
  'basic': { id: 'FREE', name: 'Gratuito', price: 0, features: ['3 anúncios ativos', '30 dias de duração', 'Suporte por email'] },
  'micro_business': { id: 'MICRO_EMPRESA', name: 'Micro-Empresa', price: 24.90, features: ['4 anúncios ativos', '60 dias de duração', 'Verificação', 'Suporte por email'] },
  'small_business': { id: 'PEQUENA_EMPRESA', name: 'Pequena Empresa', price: 49.90, features: ['5 anúncios ativos', '90 dias de duração', '1 destaque por dia', 'Estatísticas detalhadas', 'Suporte por chat'] },
  'business_simple': { id: 'EMPRESA_SIMPLES', name: 'Empresa Simples', price: 99.90, features: ['10 anúncios ativos', 'Duração ilimitada', '2 destaques por dia', 'Estatísticas avançadas', 'Suporte prioritário'] },
  'business_plus': { id: 'EMPRESA_PLUS', name: 'Empresa Plus', price: 149.90, features: ['20 anúncios ativos', 'Duração ilimitada', '3 destaques por dia', 'Estatísticas premium', 'Suporte dedicado'] }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')
  
  // Buscar o plano selecionado
  const selectedPlan = planParam && planMapping[planParam as keyof typeof planMapping]
  
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Plano não encontrado</h1>
          <p className="text-gray-600 mb-6">O plano selecionado não foi encontrado.</p>
          <a 
            href="/painel-anunciante/planos" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar aos Planos
          </a>
        </div>
      </div>
    )
  }

  return (
    <SubscriptionCheckout
      planId={selectedPlan.id as any}
      planName={selectedPlan.name}
      planPrice={selectedPlan.price}
      planFeatures={selectedPlan.features}
    />
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
} 