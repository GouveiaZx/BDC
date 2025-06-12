'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CreditCard, Smartphone, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanDetails {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

// Importar configuração centralizada de planos
import { PLANS_CONFIG, formatPrice, getPlanById } from '../lib/plansConfig';

// Mapear planos para o formato necessário no checkout
const PLANS: Record<string, PlanDetails> = PLANS_CONFIG.reduce((acc, plan) => {
  // Usar tanto o ID original quanto o uppercase para compatibilidade
  const planDetails = {
    name: plan.name,
    price: plan.monthlyPrice,
    features: plan.features.filter(f => f.included).map(f => f.text).slice(0, 4), // Primeiras 4 features incluídas
    popular: plan.popular || false
  };
  
  acc[plan.id] = planDetails; // ID original
  acc[plan.id.toUpperCase()] = planDetails; // ID em uppercase para compatibilidade
  
  return acc;
}, {} as Record<string, PlanDetails>);

console.log('💳 Planos disponíveis no checkout:', Object.keys(PLANS));

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Dados do cartão de crédito
  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  // Dados do portador do cartão
  const [cardHolderInfo, setCardHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    phone: ''
  });

  useEffect(() => {
    // Verificar se usuário está logado
    const checkUser = async () => {
      try {
        // Primeiro verificar localStorage para resposta rápida
        const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        console.log('🔍 Estado de autenticação no checkout:', {
          isLoggedInLS,
          hasUserId: !!userId,
          hasEmail: !!userEmail
        });
        
        if (isLoggedInLS && userId && userEmail) {
          console.log('✅ Usuário autenticado pelo localStorage');
          // Criar objeto user simulado
          setUser({
            id: userId,
            email: userEmail,
            user_metadata: { full_name: userName || userEmail.split('@')[0] }
          });
        } else {
          console.log('🔄 Verificando autenticação via Supabase...');
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('❌ Usuário não autenticado, redirecionando para login');
            const currentUrl = window.location.pathname + window.location.search;
            router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
            return;
          }
          console.log('✅ Usuário autenticado via Supabase');
          setUser(user);
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        router.push('/login?redirect=/checkout');
        return;
      }
    };

    checkUser();

    // Verificar se veio um plano específico da URL
    const plan = searchParams.get('plan');
    console.log('🎯 Plano da URL:', plan);
    
    if (plan) {
      // Normalizar o ID do plano (converter para uppercase para compatibilidade)
      const normalizedPlan = plan.toUpperCase();
      console.log('📝 Plano normalizado:', normalizedPlan);
      
      if (PLANS[normalizedPlan]) {
        console.log('✅ Plano válido encontrado:', PLANS[normalizedPlan]);
        setSelectedPlan(normalizedPlan);
      } else {
        console.log('❌ Plano não encontrado, planos disponíveis:', Object.keys(PLANS));
        // Tentar com o ID original
        const planConfig = getPlanById(plan);
        if (planConfig) {
          console.log('✅ Plano encontrado na configuração:', planConfig);
          setSelectedPlan(plan.toUpperCase());
        }
      }
    }
  }, [router, searchParams, supabase.auth]);

  const createCustomerIfNeeded = async () => {
    try {
      // Verificar se cliente já existe
      const response = await fetch(`/api/payments/customers?userId=${user.id}`);
      const data = await response.json();
      
      if (data.customer) {
        return data.customer;
      }

      // Criar cliente se não existe
      const createResponse = await fetch('/api/payments/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
          phone: cardHolderInfo.phone,
          cpfCnpj: cardHolderInfo.cpfCnpj,
          postalCode: cardHolderInfo.postalCode,
          addressNumber: cardHolderInfo.addressNumber
        })
      });

      const createData = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createData.error);
      }

      return createData.customer;
    } catch (error) {
      console.error('Erro ao criar/buscar cliente:', error);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano');
      return;
    }

    if (billingType === 'CREDIT_CARD' && (!creditCard.number || !creditCard.holderName || !creditCard.ccv)) {
      toast.error('Preencha todos os dados do cartão');
      return;
    }

    if (billingType === 'CREDIT_CARD' && (!cardHolderInfo.name || !cardHolderInfo.cpfCnpj || !cardHolderInfo.phone)) {
      toast.error('Preencha todos os dados do portador do cartão');
      return;
    }

    setLoading(true);

    try {
      // Criar cliente se necessário
      await createCustomerIfNeeded();

      // Criar assinatura
      const subscriptionData: any = {
        userId: user.id,
        planType: selectedPlan,
        billingType,
        cycle: 'MONTHLY'
      };

      // Adicionar dados do cartão se necessário
      if (billingType === 'CREDIT_CARD') {
        subscriptionData.creditCard = creditCard;
        subscriptionData.creditCardHolderInfo = cardHolderInfo;
      }

      const response = await fetch('/api/payments/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Assinatura criada com sucesso!');
      
      // Redirecionar para página de sucesso com informações do pagamento
      const successParams = new URLSearchParams({
        plan: selectedPlan,
        method: billingType,
        subscriptionId: data.subscription.id
      });

      if (data.asaasSubscription?.id) {
        successParams.append('asaasId', data.asaasSubscription.id);
      }

      router.push(`/checkout/sucesso?${successParams.toString()}`);

    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
  return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Finalizar Assinatura</h1>
          
          {/* Planos Disponíveis */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Escolha seu Plano</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(PLANS).map(([key, plan]) => (
                <div 
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
                    selectedPlan === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="text-2xl font-bold text-blue-600 my-2">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                      <span className="text-sm text-gray-500">/mês</span>
                  </div>
                  
                    <ul className="text-sm space-y-1 mt-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedPlan === key && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                  )}
              </div>
            ))}
          </div>
        </div>

          {/* Método de Pagamento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Método de Pagamento</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="billing"
                  value="PIX"
                  checked={billingType === 'PIX'}
                  onChange={(e) => setBillingType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="w-4 h-4" />
                  <span>PIX (Aprovação instantânea)</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="billing"
                  value="BOLETO"
                  checked={billingType === 'BOLETO'}
                  onChange={(e) => setBillingType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  <span>Boleto Bancário</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="billing"
                  value="CREDIT_CARD"
                  checked={billingType === 'CREDIT_CARD'}
                  onChange={(e) => setBillingType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Crédito</span>
                </label>
              </div>
            </div>

            {/* Dados do Cartão de Crédito */}
            {billingType === 'CREDIT_CARD' && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h4 className="font-medium">Dados do Cartão</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome no Cartão</label>
                    <input
                      type="text"
                      value={creditCard.holderName}
                      onChange={(e) => setCreditCard(prev => ({ ...prev, holderName: e.target.value }))}
                      placeholder="Nome como está no cartão"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      value={creditCard.number}
                      onChange={(e) => setCreditCard(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={16}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Mês</label>
                    <input
                      type="text"
                      value={creditCard.expiryMonth}
                      onChange={(e) => setCreditCard(prev => ({ ...prev, expiryMonth: e.target.value }))}
                      placeholder="MM"
                      maxLength={2}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Ano</label>
                    <input
                      type="text"
                      value={creditCard.expiryYear}
                      onChange={(e) => setCreditCard(prev => ({ ...prev, expiryYear: e.target.value }))}
                      placeholder="AAAA"
                      maxLength={4}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      value={creditCard.ccv}
                      onChange={(e) => setCreditCard(prev => ({ ...prev, ccv: e.target.value }))}
                      placeholder="000"
                      maxLength={4}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>

                <h4 className="font-medium">Dados do Portador</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={cardHolderInfo.name}
                      onChange={(e) => setCardHolderInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
                    <input
                      type="text"
                      value={cardHolderInfo.cpfCnpj}
                      onChange={(e) => setCardHolderInfo(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                      placeholder="000.000.000-00"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input
                      type="text"
                      value={cardHolderInfo.phone}
                      onChange={(e) => setCardHolderInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CEP</label>
                    <input
                      type="text"
                      value={cardHolderInfo.postalCode}
                      onChange={(e) => setCardHolderInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="00000-000"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Número</label>
                    <input
                      type="text"
                      value={cardHolderInfo.addressNumber}
                      onChange={(e) => setCardHolderInfo(prev => ({ ...prev, addressNumber: e.target.value }))}
                      placeholder="123"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={!selectedPlan || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </div>
            ) : (
              `Assinar Plano - R$ ${selectedPlan ? PLANS[selectedPlan]?.price.toFixed(2).replace('.', ',') : '0,00'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
} 