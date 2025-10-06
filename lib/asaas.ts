import axios, { AxiosInstance } from 'axios';

interface AsaasConfig {
  apiKey: string;
  apiUrl: string;
  environment: 'sandbox' | 'production';
}

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string[];
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

interface PaymentData {
  customer: string; // Customer ID
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  postalService?: boolean;
  cycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
}

interface SubscriptionData {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  creditCard?: any;
  creditCardHolderInfo?: any;
}

interface AsaasResponse<T = any> {
  object: string;
  hasMore: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data?: T[];
  // Para respostas únicas
  id?: string;
  errors?: Array<{
    code: string;
    description: string;
  }>;
}

export class AsaasClient {
  private client: AxiosInstance;
  private config: AsaasConfig;

  constructor(config: AsaasConfig) {
    this.config = config;
    
    // CORREÇÃO BASEADA NA DOCUMENTAÇÃO OFICIAL DO ASAAS:
    // Header deve ser: access_token: sua_api_key (SEM prefixos!)
    const apiKey = config.apiKey;
    
    // Configuração carregada sem exposição de dados sensíveis
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'access_token': apiKey, // Header padrão do ASAAS
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BDC-Classificados/1.0'
      },
      timeout: 30000
    });

    // Interceptor configurado sem logs de produção

    this.client.interceptors.response.use(
      response => response,
      error => Promise.reject(error)
    );
  }

  // CUSTOMERS
  async createCustomer(customerData: Customer): Promise<AsaasResponse> {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao buscar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<AsaasResponse> {
    try {
      const response = await this.client.put(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // PAYMENTS
  async createPayment(paymentData: PaymentData): Promise<AsaasResponse> {
    try {
      const response = await this.client.post('/payments', paymentData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao criar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao buscar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async deletePayment(paymentId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao cancelar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // SUBSCRIPTIONS
  async createSubscription(subscriptionData: SubscriptionData): Promise<AsaasResponse> {
    try {
      const response = await this.client.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao buscar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async updateSubscription(subscriptionId: string, subscriptionData: Partial<SubscriptionData>): Promise<AsaasResponse> {
    try {
      const response = await this.client.put(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // SUBSCRIPTION PAYMENTS - MÉTODO CRÍTICO FALTANTE!
  async getSubscriptionPayments(subscriptionId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}/payments`);

      // A resposta pode vir como array direto ou como objeto com data
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error: any) {
      throw new Error(`Erro ao buscar pagamentos da assinatura: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // PIX
  async getPixQrCode(paymentId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao gerar QR Code PIX: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // UTILITIES
  formatCurrency(value: number): string {
    return (value / 100).toFixed(2);
  }

  parseCurrency(value: string): number {
    return Math.round(parseFloat(value) * 100);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isValidCpfCnpj(document: string): boolean {
    // Remove formatação
    const cleanDoc = document.replace(/[^0-9]/g, '');
    return cleanDoc.length === 11 || cleanDoc.length === 14;
  }
}

// ASAAS API Client - Versão segura para produção
// Validação condicional de variáveis de ambiente

const ASAAS_CONFIG = {
  apiKey: process.env.ASAAS_API_KEY || null,
  apiUrl: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'
};

// Validar apenas quando necessário
function validateAsaasConfig() {
  if (!ASAAS_CONFIG.apiKey) {
    throw new Error('ASAAS_API_KEY é obrigatório para funcionalidades de pagamento. Configure a variável de ambiente.');
  }
}

// Função para criar cliente Asaas sob demanda
function createAsaasClient(): AsaasClient {
  validateAsaasConfig();

  return new AsaasClient({
    apiKey: ASAAS_CONFIG.apiKey!,
    apiUrl: ASAAS_CONFIG.apiUrl,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  });
}

// Cliente lazy (criado apenas quando necessário)
let asaasInstance: AsaasClient | null = null;

// Função helper para obter cliente
function getAsaasClient(): AsaasClient {
  if (!asaasInstance) {
    asaasInstance = createAsaasClient();
  }
  return asaasInstance;
}

const asaas = {
  get client(): AsaasClient {
    return getAsaasClient();
  },

  // Métodos diretos para compatibilidade (corrigidos)
  async createCustomer(customerData: any) {
    const client = getAsaasClient();
    return client.createCustomer(customerData);
  },

  async getCustomer(customerId: string) {
    const client = getAsaasClient();
    return client.getCustomer(customerId);
  },

  async updateCustomer(customerId: string, customerData: any) {
    const client = getAsaasClient();
    return client.updateCustomer(customerId, customerData);
  },

  async createPayment(paymentData: any) {
    const client = getAsaasClient();
    return client.createPayment(paymentData);
  },

  async getPayment(paymentId: string) {
    const client = getAsaasClient();
    return client.getPayment(paymentId);
  },

  async deletePayment(paymentId: string) {
    const client = getAsaasClient();
    return client.deletePayment(paymentId);
  },

  async createSubscription(subscriptionData: any) {
    const client = getAsaasClient();
    return client.createSubscription(subscriptionData);
  },

  async getSubscription(subscriptionId: string) {
    const client = getAsaasClient();
    return client.getSubscription(subscriptionId);
  },

  async updateSubscription(subscriptionId: string, subscriptionData: any) {
    const client = getAsaasClient();
    return client.updateSubscription(subscriptionId, subscriptionData);
  },

  async cancelSubscription(subscriptionId: string) {
    const client = getAsaasClient();
    return client.cancelSubscription(subscriptionId);
  },

  async getSubscriptionPayments(subscriptionId: string) {
    const client = getAsaasClient();
    return client.getSubscriptionPayments(subscriptionId);
  },

  async getPixQrCode(paymentId: string) {
    const client = getAsaasClient();
    return client.getPixQrCode(paymentId);
  },

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  }
};

export { asaas, createAsaasClient, validateAsaasConfig };
export default asaas; 