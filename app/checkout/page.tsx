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

// Função para validar UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Função para gerar UUID válido
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função para garantir userId válido
function ensureValidUserId(userId: string | null): string {
  if (!userId) {
    console.log('⚠️ UserId vazio, gerando novo UUID');
    const newUserId = generateUUID();
    localStorage.setItem('userId', newUserId);
    return newUserId;
  }
  
  if (isValidUUID(userId)) {
    console.log('✅ UserId é um UUID válido:', userId);
    return userId;
  }
  
  console.log('⚠️ UserId não é um UUID válido:', userId, 'gerando novo');
  const newUserId = generateUUID();
  localStorage.setItem('userId', newUserId);
  return newUserId;
}

// Mapear planos para o formato necessário no checkout - SEM DUPLICATAS
const PLANS: Record<string, PlanDetails> = PLANS_CONFIG.reduce((acc, plan) => {
  const planDetails = {
    name: plan.name,
    price: plan.monthlyPrice,
    features: plan.features.filter(f => f.included).map(f => f.text).slice(0, 4), // Primeiras 4 features incluídas
    popular: plan.popular || false
  };
  
  // Usar apenas o ID original - sem duplicatas
  acc[plan.id] = planDetails;
  
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
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: '',
    phone: ''
  });

  useEffect(() => {
    // Verificar se usuário está logado
    const checkUser = async () => {
      try {
        // Primeiro verificar localStorage para resposta rápida
        const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';
        const rawUserId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        console.log('🔍 Estado de autenticação no checkout:', {
          isLoggedInLS,
          hasUserId: !!rawUserId,
          hasEmail: !!userEmail
        });
        
        if (isLoggedInLS && rawUserId && userEmail) {
          console.log('✅ Usuário autenticado pelo localStorage');
          
          // Garantir que userId seja um UUID válido
          const validUserId = ensureValidUserId(rawUserId);
          
          // Criar objeto user simulado
          setUser({
            id: validUserId,
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
      // Normalizar o ID do plano para lowercase
      const normalizedPlan = plan.toLowerCase();
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
          setSelectedPlan(planConfig.id);
        }
      }
    }
  }, [router, searchParams, supabase.auth]);

  const createCustomerIfNeeded = async () => {
    try {
      console.log('🔍 Verificando se cliente existe para userId:', user.id);
      
      // Verificar se cliente já existe
      const response = await fetch(`/api/payments/customers?userId=${user.id}`);
      const data = await response.json();
      
      console.log('📋 Resposta da busca de cliente:', data);
      
      if (data.customer) {
        console.log('✅ Cliente já existe:', data.customer.asaas_customer_id);
        return data.customer;
      }

      console.log('🆕 Cliente não existe, criando...');
      
      // Preparar dados do cliente
      const customerData = {
        userId: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
        email: user.email,
        phone: cardHolderInfo.phone || '',
        cpfCnpj: cardHolderInfo.cpfCnpj || '',
        postalCode: cardHolderInfo.postalCode || '',
        address: cardHolderInfo.address || '',
        addressNumber: cardHolderInfo.addressNumber || '',
        complement: cardHolderInfo.complement || '',
        province: cardHolderInfo.province || '',
        city: cardHolderInfo.city || '',
        state: cardHolderInfo.state || ''
      };

      console.log('📝 Dados do cliente para criação:', customerData);

      // Criar cliente se não existe
      const createResponse = await fetch('/api/payments/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      const createData = await createResponse.json();
      
      console.log('📋 Resposta da criação de cliente:', createData);
      
      if (!createResponse.ok) {
        console.error('❌ Erro ao criar cliente:', createData);
        throw new Error(createData.error || 'Erro ao criar cliente');
      }

      // Se o userId foi processado/alterado, atualizar no localStorage
      if (createData.processedUserId && createData.processedUserId !== user.id) {
        console.log('🔧 Atualizando userId no localStorage:', createData.processedUserId);
        localStorage.setItem('userId', createData.processedUserId);
        setUser(prev => ({ ...prev, id: createData.processedUserId }));
      }

      console.log('✅ Cliente criado com sucesso:', createData.customer.asaas_customer_id);
      return createData.customer;
    } catch (error) {
      console.error('❌ Erro ao criar/buscar cliente:', error);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano');
      return;
    }

    // Validação obrigatória para todos os métodos de pagamento
    if (!cardHolderInfo.name || !cardHolderInfo.cpfCnpj || !cardHolderInfo.phone) {
      toast.error('Preencha todos os dados obrigatórios: Nome, CPF/CNPJ e Telefone');
      return;
    }

    // Validação específica do cartão de crédito
    if (billingType === 'CREDIT_CARD' && (!creditCard.number || !creditCard.holderName || !creditCard.ccv)) {
      toast.error('Preencha todos os dados do cartão');
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

      // Passar dados PIX se disponíveis
      if (data.pixData) {
        successParams.append('pixPaymentId', data.pixData.paymentId);
        if (data.pixData.qrCode?.payload) {
          successParams.append('pixCode', data.pixData.qrCode.payload);
        }
        if (data.pixData.qrCode?.encodedImage) {
          successParams.append('pixQrImage', data.pixData.qrCode.encodedImage);
        }
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
            <h2 className="text-lg font-semibold mb-4">
              {selectedPlan ? 'Plano Selecionado' : 'Escolha seu Plano'}
            </h2>
            
            {selectedPlan ? (
              // Mostrar apenas o plano selecionado
              <div className="max-w-md mx-auto">
                <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-6 relative">
                  {PLANS[selectedPlan]?.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-xl text-blue-800">{PLANS[selectedPlan]?.name}</h3>
                    <div className="text-3xl font-bold text-blue-600 my-4">
                      R$ {PLANS[selectedPlan]?.price.toFixed(2).replace('.', ',')}
                      <span className="text-sm text-gray-500">/mês</span>
                    </div>
                    
                    <ul className="text-sm space-y-2 mt-4">
                      {PLANS[selectedPlan]?.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <button
                    onClick={() => setSelectedPlan('')}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Escolher outro plano
                  </button>
                </div>
              </div>
            ) : (
              // Mostrar todos os planos para seleção
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
            )}
          </div>

          {/* Dados Obrigatórios */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Dados para Faturamento</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📋 Informação importante:</strong> CPF ou CNPJ é obrigatório para processar pagamentos.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Nome Completo/Razão Social <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cardHolderInfo.name}
                  onChange={(e) => setCardHolderInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo ou razão social"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">CPF/CNPJ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cardHolderInfo.cpfCnpj}
                  onChange={(e) => setCardHolderInfo(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Telefone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cardHolderInfo.phone}
                  onChange={(e) => setCardHolderInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full p-2 border rounded-md"
                />
              </div>
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