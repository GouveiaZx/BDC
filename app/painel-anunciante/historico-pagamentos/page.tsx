'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CreditCard, Smartphone, FileText, Download, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  billing_type: string;
  due_date: string;
  paid_date?: string;
  description: string;
  invoice_url?: string;
  bank_slip_url?: string;
  created_at: string;
}

const STATUS_COLORS = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'RECEIVED': 'bg-green-100 text-green-800',
  'CONFIRMED': 'bg-green-100 text-green-800',
  'OVERDUE': 'bg-red-100 text-red-800',
  'REFUNDED': 'bg-gray-100 text-gray-800',
  'CANCELLED': 'bg-red-100 text-red-800'
};

const STATUS_NAMES = {
  'PENDING': 'Pendente',
  'RECEIVED': 'Recebido',
  'CONFIRMED': 'Confirmado',
  'OVERDUE': 'Vencido',
  'REFUNDED': 'Reembolsado',
  'CANCELLED': 'Cancelado'
};

const TYPE_NAMES = {
  'SUBSCRIPTION': 'Assinatura',
  'HIGHLIGHT': 'Destaque',
  'UPGRADE': 'Upgrade',
  'DOWNGRADE': 'Downgrade'
};

const BILLING_ICONS = {
  'PIX': Smartphone,
  'BOLETO': FileText,
  'CREDIT_CARD': CreditCard
};

export default function HistoricoPagamentosPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');

  useEffect(() => {
    const checkUserAndLoadTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        await loadTransactions(user.id);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        toast.error('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadTransactions();
  }, []);

  const loadTransactions = async (userId: string) => {
    try {
      const response = await fetch(`/api/payments/transactions?userId=${userId}&limit=50`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      toast.error(error.message || 'Erro ao carregar histórico');
    }
  };

  const refreshTransactions = async () => {
    if (!user || refreshing) return;
    
    setRefreshing(true);
    try {
      await loadTransactions(user.id);
      toast.success('Histórico atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar histórico');
    } finally {
      setRefreshing(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string) => {
    try {
      const response = await fetch('/api/payments/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          userId: user.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Atualizar a transação na lista
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, ...data.transaction } : t
      ));

      toast.success('Status atualizado');
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'pending') return transaction.status === 'PENDING';
    if (filter === 'confirmed') return ['RECEIVED', 'CONFIRMED'].includes(transaction.status);
    if (filter === 'type') return transaction.type === filter;
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'amount') {
      return b.amount - a.amount;
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Histórico de Pagamentos</h1>
          <p className="text-gray-600">Acompanhe todas as suas transações e pagamentos</p>
        </div>
        
        <button
          onClick={refreshTransactions}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="confirmed">Confirmados</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="created_at">Data</option>
              <option value="amount">Valor</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      {sortedTransactions.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
          <p className="text-gray-600 mb-4">Você ainda não possui transações registradas.</p>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Assinar um Plano
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTransactions.map((transaction) => {
            const BillingIcon = BILLING_ICONS[transaction.billing_type as keyof typeof BILLING_ICONS] || CreditCard;
            
            return (
              <div key={transaction.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BillingIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{transaction.description}</h3>
                      <p className="text-sm text-gray-600">
                        {TYPE_NAMES[transaction.type as keyof typeof TYPE_NAMES] || transaction.type}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[transaction.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {STATUS_NAMES[transaction.status as keyof typeof STATUS_NAMES] || transaction.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Valor:</span>
                    <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <p className="font-medium">{formatDate(transaction.due_date)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Criado em:</span>
                    <p className="font-medium">{formatDate(transaction.created_at)}</p>
                  </div>
                  
                  {transaction.paid_date && (
                    <div>
                      <span className="text-sm text-gray-600">Pago em:</span>
                      <p className="font-medium text-green-600">{formatDate(transaction.paid_date)}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {transaction.status === 'PENDING' && (
                    <button
                      onClick={() => updateTransactionStatus(transaction.id)}
                      className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Verificar Status</span>
                    </button>
                  )}
                  
                  {transaction.invoice_url && (
                    <a
                      href={transaction.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Fatura</span>
                    </a>
                  )}
                  
                  {transaction.bank_slip_url && (
                    <a
                      href={transaction.bank_slip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm hover:bg-orange-200"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar Boleto</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 