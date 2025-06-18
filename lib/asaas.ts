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
    
    // Logar informações para debug
    console.log('🔑 [ASAAS DEBUG] API Key (primeiros 15 chars):', apiKey.substring(0, 15) + '...');
    console.log('🌐 [ASAAS DEBUG] API URL:', config.apiUrl);
    console.log('🌍 [ASAAS DEBUG] Environment:', config.environment);
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'access_token': apiKey, // CONFORME DOCUMENTAÇÃO OFICIAL
        'Content-Type': 'application/json',
        'User-Agent': 'BDC-Classificados/1.0'
      },
      timeout: 30000
    });

    // Interceptor para log de requests
    this.client.interceptors.request.use(request => {
      console.log('🔄 [ASAAS] Request:', {
        method: request.method?.toUpperCase(),
        url: request.url,
        baseURL: request.baseURL,
        fullURL: `${request.baseURL}${request.url}`,
        headers: {
          'access_token': request.headers['access_token'] ? `${String(request.headers['access_token']).substring(0, 15)}...` : 'NOT_SET',
          'Content-Type': request.headers['Content-Type']
        },
        data: request.data
      });
      return request;
    });

    this.client.interceptors.response.use(
      response => {
        console.log('✅ [ASAAS] Success Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('❌ [ASAAS] Error Response:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A'
          }
        });
        return Promise.reject(error);
      }
    );
  }

  // CUSTOMERS
  async createCustomer(customerData: Customer): Promise<AsaasResponse> {
    try {
      console.log('🔄 Criando cliente ASAAS:', customerData);
      const response = await this.client.post('/customers', customerData);
      console.log('✅ Cliente criado com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      // Logar resposta completa do erro
      console.error('❌ [DEBUG] Erro ao criar cliente - response:', error.response?.data);
      console.error('❌ [DEBUG] Erro ao criar cliente - headers:', error.response?.headers);
      console.error('❌ [DEBUG] Erro ao criar cliente - config:', error.config);
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
      const response = await this.client.post(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // PAYMENTS
  async createPayment(paymentData: PaymentData): Promise<AsaasResponse> {
    try {
      console.log('🔄 Criando pagamento ASAAS:', paymentData);
      const response = await this.client.post('/payments', paymentData);
      console.log('✅ Pagamento criado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<AsaasResponse> {
    try {
      console.log('🔍 Buscando pagamento:', paymentId);
      const response = await this.client.get(`/payments/${paymentId}`);
      console.log('✅ Pagamento encontrado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar pagamento:', error.response?.data || error.message);
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
      console.log('🔄 Criando assinatura ASAAS:', subscriptionData);
      const response = await this.client.post('/subscriptions', subscriptionData);
      console.log('✅ Assinatura criada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<AsaasResponse> {
    try {
      console.log('🔍 Buscando assinatura:', subscriptionId);
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      console.log('✅ Assinatura encontrada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async updateSubscription(subscriptionId: string, subscriptionData: Partial<SubscriptionData>): Promise<AsaasResponse> {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<AsaasResponse> {
    try {
      console.log('🔄 Cancelando assinatura ASAAS:', subscriptionId);
      const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
      console.log('✅ Assinatura cancelada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao cancelar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // SUBSCRIPTION PAYMENTS - MÉTODO CRÍTICO FALTANTE!
  async getSubscriptionPayments(subscriptionId: string): Promise<any[]> {
    try {
      console.log('🔍 Buscando pagamentos da assinatura:', subscriptionId);
      const response = await this.client.get(`/subscriptions/${subscriptionId}/payments`);
      console.log('✅ Pagamentos da assinatura encontrados:', response.data);
      
      // A resposta pode vir como array direto ou como objeto com data
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.log('📋 Formato de resposta não esperado:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar pagamentos da assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar pagamentos da assinatura: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // PIX
  async getPixQrCode(paymentId: string): Promise<AsaasResponse> {
    try {
      console.log('🔍 Buscando QR Code PIX para pagamento:', paymentId);
      const response = await this.client.get(`/payments/${paymentId}/pixQrCode`);
      console.log('✅ QR Code PIX gerado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao gerar QR Code PIX:', error.response?.data || error.message);
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

// ASAAS API Client - Versão corrigida para BDC
// Configuração com hardcode temporário para teste

const ASAAS_CONFIG = {
  // Usando a chave EXATA como fornecida pelo ASAAS
  apiKey: process.env.ASAAS_API_KEY || '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNiZmZlNzcyLTZiZWEtNDhlNC05NjMxLTY0M2JkY2I5YjM3NTo6JGFhY2hfNTJiYjkzYjgtZDBhMi00ZjM0LWFmYjMtMmYzOWQ1NDY4MzE3',
  apiUrl: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'
};

console.log('🔧 [ASAAS] Configuração carregada:', {
  hasApiKey: !!ASAAS_CONFIG.apiKey,
  keyLength: ASAAS_CONFIG.apiKey.length,
  keyPrefix: ASAAS_CONFIG.apiKey.substring(0, 12),
  apiUrl: ASAAS_CONFIG.apiUrl,
  source: process.env.ASAAS_API_KEY ? 'ENV_VAR' : 'HARDCODE'
});

const asaas = new AsaasClient({
  apiKey: ASAAS_CONFIG.apiKey,
  apiUrl: ASAAS_CONFIG.apiUrl,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

export { asaas };
export default asaas; 