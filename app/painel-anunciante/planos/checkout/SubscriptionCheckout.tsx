'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  description: string
}

interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
}

interface CustomerData {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

// Mapeamento dos parâmetros da URL para IDs dos planos
const URL_TO_PLAN_MAPPING: { [key: string]: string } = {
  'basic': 'gratuito',
  'micro_business': 'micro-empresa',
  'small_business': 'pequena-empresa',
  'business_simple': 'empresa-simples',
  'business_plus': 'empresa-plus',
  // Também mantém compatibilidade com IDs diretos
  'gratuito': 'gratuito',
  'micro-empresa': 'micro-empresa',
  'pequena-empresa': 'pequena-empresa',
  'empresa-simples': 'empresa-simples',
  'empresa-plus': 'empresa-plus'
}

const PLANS: { [key: string]: Plan } = {
  'gratuito': {
    id: 'gratuito',
    name: 'Gratuito',
    price: 0,
    description: 'Para iniciantes',
    features: ['3 anúncios ativos', '30 dias de duração', 'Suporte por email']
  },
  'micro-empresa': {
    id: 'micro-empresa',
    name: 'Micro-Empresa',
    price: 24.90,
    description: 'Para microempreendedores',
    features: ['4 anúncios ativos', '60 dias de duração', 'Verificação', 'Suporte por email']
  },
  'pequena-empresa': {
    id: 'pequena-empresa',
    name: 'Pequena Empresa',
    price: 49.90,
    description: 'Para pequenos negócios',
    features: ['5 anúncios ativos', '90 dias de duração', '1 destaque por dia', 'Estatísticas detalhadas', 'Suporte por chat']
  },
  'empresa-simples': {
    id: 'empresa-simples', 
    name: 'Empresa Simples',
    price: 99.90,
    description: 'Para empresas',
    features: ['10 anúncios ativos', 'Duração ilimitada', '2 destaques por dia', 'Estatísticas avançadas', 'Suporte prioritário']
  },
  'empresa-plus': {
    id: 'empresa-plus',
    name: 'Empresa Plus', 
    price: 149.90,
    description: 'Para grandes negócios',
    features: ['20 anúncios ativos', 'Duração ilimitada', '3 destaques por dia', 'Estatísticas premium', 'Suporte dedicado']
  }
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'PIX',
    name: 'PIX',
    icon: '🏦',
    description: 'Pagamento instantâneo via PIX'
  },
  {
    id: 'CREDIT_CARD',
    name: 'Cartão de Crédito',
    icon: '💳',
    description: 'Pagamento com cartão de crédito'
  },
  {
    id: 'BOLETO',
    name: 'Boleto Bancário',
    icon: '📄',
    description: 'Pagamento via boleto bancário'
  }
]

export default function SubscriptionCheckout() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<string>('PIX')
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [pixCopyPaste, setPixCopyPaste] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Buscar dados do perfil
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCustomerData({
            name: profile.name || user.user_metadata?.full_name || '',
            email: user.email || '',
            cpfCnpj: profile.cpf_cnpj || profile.document || '',
            phone: profile.phone || profile.whatsapp || '',
            postalCode: profile.postal_code || '',
            address: profile.address || '',
            addressNumber: profile.address_number || '',
            complement: profile.complement || '',
            province: profile.province || '',
            city: profile.city || '',
            state: profile.state || ''
          })
        }
      }
    }

    getUser()

    // Obter plano selecionado dos parâmetros da URL
    const params = new URLSearchParams(window.location.search)
    const urlPlanId = params.get('plan') || 'pequena-empresa'
    
    // Mapear o parâmetro da URL para o ID correto do plano
    const mappedPlanId = URL_TO_PLAN_MAPPING[urlPlanId] || 'pequena-empresa'
    
    console.log('🔍 Plano da URL:', urlPlanId, '-> Mapeado para:', mappedPlanId)
    setSelectedPlan(mappedPlanId)
  }, [supabase])

  const validateCustomerData = (): boolean => {
    if (!customerData.name.trim()) {
      setError('Nome é obrigatório')
      return false
    }
    if (!customerData.email.trim()) {
      setError('Email é obrigatório')
      return false
    }
    if (!customerData.cpfCnpj.trim()) {
      setError('CPF/CNPJ é obrigatório')
      return false
    }
    
    // Validar formato CPF/CNPJ básico
    const cleanDoc = customerData.cpfCnpj.replace(/\D/g, '')
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
      return false
    }

    return true
  }

  const formatCpfCnpj = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '')
    
    if (cleanValue.length <= 11) {
      // CPF: 000.000.000-00
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    } else {
      // CNPJ: 00.000.000/0000-00
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    }
  }

  const handleProcessPayment = async () => {
    if (!validateCustomerData()) return
    if (!selectedPlan || !PLANS[selectedPlan]) {
      setError('Por favor, selecione um plano válido')
      return
    }

    setIsLoading(true)
    setError('')
    setQrCodeUrl('')
    setPixCopyPaste('')

    try {
      console.log('🔄 Iniciando processo de pagamento...')
      console.log('📊 Dados do cliente:', customerData)
      console.log('💳 Método de pagamento:', selectedPayment)
      console.log('📦 Plano selecionado:', selectedPlan)

      const plan = PLANS[selectedPlan]
      
      // Preparar dados para o ASAAS
      const cleanCpfCnpj = customerData.cpfCnpj.replace(/\D/g, '')
      
      const paymentData = {
        // Dados do cliente (OBRIGATÓRIOS para PIX)
        customer: {
          name: customerData.name.trim(),
          email: customerData.email.trim(),
          cpfCnpj: cleanCpfCnpj,
          phone: customerData.phone?.replace(/\D/g, '') || undefined,
          postalCode: customerData.postalCode?.replace(/\D/g, '') || undefined,
          address: customerData.address || undefined,
          addressNumber: customerData.addressNumber || undefined,
          complement: customerData.complement || undefined,
          province: customerData.province || undefined,
          city: customerData.city || undefined,
          state: customerData.state || undefined
        },
        // Dados da cobrança
        billingType: selectedPayment,
        value: plan.price,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        description: `Assinatura - ${plan.name}`,
        externalReference: `subscription-${selectedPlan}-${user?.id}`,
        // Para cartão de crédito
        ...(selectedPayment === 'CREDIT_CARD' && {
          installmentCount: 1,
          installmentValue: plan.price
        })
      }

      console.log('📤 Enviando dados para ASAAS:', paymentData)

      const response = await fetch('/api/asaas/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const responseText = await response.text()
      console.log('📥 Resposta bruta do servidor:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError)
        setError('Erro interno do servidor. Tente novamente.')
        return
      }

      if (!response.ok) {
        console.error('❌ Erro na requisição:', result)
        setError(result.error || result.details || 'Erro ao processar pagamento')
        return
      }

      console.log('✅ Pagamento criado com sucesso:', result)

      // Processar resposta baseada no tipo de pagamento
      if (selectedPayment === 'PIX') {
        if (result.pixQrCodeUrl) {
          setQrCodeUrl(result.pixQrCodeUrl)
        }
        if (result.pixCopyAndPaste) {
          setPixCopyPaste(result.pixCopyAndPaste)
        }
        if (!result.pixQrCodeUrl && !result.pixCopyAndPaste) {
          console.log('⚠️ PIX criado mas sem QR Code. Dados disponíveis:', result)
          setError('Pagamento PIX criado, mas não foi possível gerar o QR Code. Entre em contato conosco.')
        }
      } else if (selectedPayment === 'BOLETO') {
        if (result.bankSlipUrl) {
          window.open(result.bankSlipUrl, '_blank')
        }
      } else if (selectedPayment === 'CREDIT_CARD') {
        // Para cartão de crédito, redirecionar para página de dados do cartão
        router.push(`/checkout/cartao?payment=${result.id}`)
      }

      // Salvar informações da assinatura no Supabase
      if (user) {
        const subscriptionData = {
          user_id: user.id,
          plan_id: selectedPlan,
          plan_name: plan.name,
          amount: plan.price,
          billing_type: selectedPayment,
          asaas_payment_id: result.id,
          asaas_customer_id: result.customer,
          status: 'pending',
          created_at: new Date().toISOString()
        }

        const { error: dbError } = await supabase
          .from('subscriptions')
          .insert([subscriptionData])

        if (dbError) {
          console.error('❌ Erro ao salvar assinatura no banco:', dbError)
        } else {
          console.log('✅ Assinatura salva no banco com sucesso')
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error)
      setError('Erro interno. Tente novamente em alguns minutos.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixCode = () => {
    if (pixCopyPaste) {
      navigator.clipboard.writeText(pixCopyPaste)
      alert('Código PIX copiado para a área de transferência!')
    }
  }

  if (!selectedPlan || !PLANS[selectedPlan]) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Plano não encontrado</h2>
          <p className="text-gray-600 mb-6">O plano selecionado não é válido.</p>
          <button
            onClick={() => router.push('/planos')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar aos Planos
          </button>
        </div>
      </div>
    )
  }

  const plan = PLANS[selectedPlan]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Assinatura</h1>
          <p className="text-gray-600">Complete seu pagamento e ative seu plano</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Dados */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Dados para Pagamento</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  id="cpfCnpj"
                  value={customerData.cpfCnpj}
                  onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: formatCpfCnpj(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Método de Pagamento</h3>
              <div className="grid grid-cols-1 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                    {selectedPayment === method.id && (
                      <span className="absolute right-4 text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumo do Pedido</h2>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-blue-100 mb-4">{plan.description}</p>
              <div className="text-3xl font-bold">
                R$ {plan.price.toFixed(2).replace('.', ',')}
                <span className="text-lg text-blue-100 font-normal">/mês</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">Recursos inclusos:</h4>
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* PIX Payment Results */}
            {selectedPayment === 'PIX' && (qrCodeUrl || pixCopyPaste) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-3">✅ PIX Gerado com Sucesso!</h4>
                
                {qrCodeUrl && (
                  <div className="text-center mb-4">
                    <img 
                      src={qrCodeUrl.startsWith('data:') ? qrCodeUrl : `data:image/png;base64,${qrCodeUrl}`} 
                      alt="QR Code PIX" 
                      className="mx-auto max-w-48 max-h-48" 
                    />
                    <p className="text-sm text-green-600 mt-2">Escaneie o QR Code com seu banco</p>
                  </div>
                )}
                
                {pixCopyPaste && (
                  <div>
                    <p className="text-sm text-green-600 mb-2">Ou copie o código PIX:</p>
                    <div className="flex">
                      <input
                        type="text"
                        value={pixCopyPaste}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-l-lg text-xs"
                      />
                      <button
                        onClick={copyPixCode}
                        className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </div>
              ) : (
                `Pagar R$ ${plan.price.toFixed(2).replace('.', ',')}`
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Ao continuar, você concorda com nossos termos de serviço
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 