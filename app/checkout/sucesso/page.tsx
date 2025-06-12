'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle, CreditCard, Smartphone, FileText, ArrowRight, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_NAMES = {
  'MICRO_EMPRESA': 'Micro Empresa',
  'PEQUENA_EMPRESA': 'Pequena Empresa',
  'EMPRESA_SIMPLES': 'Empresa Simples',
  'EMPRESA_PLUS': 'Empresa Plus'
};

const BILLING_TYPES = {
  'PIX': { name: 'PIX', icon: Smartphone },
  'BOLETO': { name: 'Boleto Bancário', icon: FileText },
  'CREDIT_CARD': { name: 'Cartão de Crédito', icon: CreditCard }
};

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [transactionData, setTransactionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const plan = searchParams.get('plan') || '';
  const method = searchParams.get('method') || '';
  const subscriptionId = searchParams.get('subscriptionId') || '';
  const asaasId = searchParams.get('asaasId') || '';

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        // Verificar se usuário está logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Se há um asaasId, buscar informações da transação
        if (asaasId) {
          // Simular busca da transação (você pode implementar uma API para isso)
          setTransactionData({
            id: asaasId,
            status: 'PENDING',
            amount: getPlantAmount(plan),
            method: method,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadData();
  }, [asaasId, method, plan, router, supabase.auth]);

  const getPlantAmount = (planType: string) => {
    const amounts = {
      'MICRO_EMPRESA': 29.90,
      'PEQUENA_EMPRESA': 49.90,
      'EMPRESA_SIMPLES': 79.90,
      'EMPRESA_PLUS': 129.90
    };
    return amounts[planType as keyof typeof amounts] || 0;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const getNextSteps = () => {
    switch (method) {
      case 'PIX':
        return [
          'Abra o aplicativo do seu banco',
          'Escaneie o QR Code ou cole o código PIX',
          'Confirme o pagamento',
          'Aguarde a confirmação (geralmente instantânea)'
        ];
      case 'BOLETO':
        return [
          'Acesse o link do boleto enviado por email',
          'Pague no banco, lotérica ou app bancário',
          'Aguarde até 3 dias úteis para compensação',
          'Receberá confirmação por email'
        ];
      case 'CREDIT_CARD':
        return [
          'Pagamento processado automaticamente',
          'Verificação com a operadora do cartão',
          'Confirmação em até 24 horas',
          'Plano ativado após aprovação'
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const BillingIcon = BILLING_TYPES[method as keyof typeof BILLING_TYPES]?.icon || CheckCircle;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header de Sucesso */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Assinatura Criada com Sucesso!</h1>
        <p className="text-gray-600">Obrigado por escolher o BuscaAquiBdC</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Resumo da Assinatura */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resumo da Assinatura</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plano:</span>
              <span className="font-medium">{PLAN_NAMES[plan as keyof typeof PLAN_NAMES] || plan}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Valor:</span>
              <span className="font-medium text-green-600">R$ {getPlantAmount(plan).toFixed(2).replace('.', ',')}/mês</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Método:</span>
              <div className="flex items-center space-x-2">
                <BillingIcon className="w-4 h-4" />
                <span className="font-medium">{BILLING_TYPES[method as keyof typeof BILLING_TYPES]?.name || method}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Aguardando Pagamento
              </span>
            </div>
            
            {subscriptionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">ID Assinatura:</span>
                <span className="font-mono text-sm">{subscriptionId.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Próximos Passos</h2>
          
          <div className="space-y-3">
            {getNextSteps().map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações de Pagamento PIX */}
      {method === 'PIX' && transactionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-800 mb-4">Informações do PIX</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">QR Code PIX</h4>
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">QR Code</span>
                </div>
                <p className="text-sm text-gray-600">Escaneie com o app do seu banco</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Código PIX (Copia e Cola)</h4>
              <div className="bg-white border rounded-lg p-4">
                <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all mb-2">
                  PIX_CODE_EXAMPLE_123456789
                </div>
                <button 
                  onClick={() => copyToClipboard('PIX_CODE_EXAMPLE_123456789')}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar código PIX</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> O PIX deve ser pago em até 24 horas. Após esse prazo, será necessário gerar um novo código.
            </p>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
        >
          <span>Ir para o Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => router.push('/anuncio/criar')}
          className="flex-1 border border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50"
        >
          Criar meu primeiro anúncio
        </button>
      </div>

      {/* Informações de Contato */}
      <div className="bg-gray-50 border rounded-lg p-6 mt-8">
        <h3 className="font-semibold mb-4">Precisa de Ajuda?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Suporte</h4>
            <p className="text-sm text-gray-600 mb-1">Email: suporte@buscaaquibdc.com</p>
            <p className="text-sm text-gray-600">WhatsApp: (98) 99999-9999</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Horário de Atendimento</h4>
            <p className="text-sm text-gray-600 mb-1">Segunda a Sexta: 8h às 18h</p>
            <p className="text-sm text-gray-600">Sábado: 8h às 12h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 