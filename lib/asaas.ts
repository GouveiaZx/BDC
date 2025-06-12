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
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'access_token': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'BDC-Classificados/1.0'
      },
      timeout: 30000
    });

    // Interceptor para log de requests em desenvolvimento
    if (config.environment === 'sandbox') {
      this.client.interceptors.request.use(request => {
        console.log('🔄 Asaas Request:', {
          method: request.method?.toUpperCase(),
          url: request.url,
          data: request.data
        });
        return request;
      });

      this.client.interceptors.response.use(
        response => {
          console.log('✅ Asaas Response:', {
            status: response.status,
            data: response.data
          });
          return response;
        },
        error => {
          console.error('❌ Asaas Error:', {
            status: error.response?.status,
            data: error.response?.data
          });
          return Promise.reject(error);
        }
      );
    }
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
      const response = await this.client.post(`/customers/${customerId}`, customerData);
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
      const response = await this.client.post(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao atualizar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<AsaasResponse> {
    try {
      const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
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

// Instância global configurada
const asaas = new AsaasClient({
  apiKey: process.env.ASAAS_API_KEY || 'sandbox_your_api_key_here',
  apiUrl: process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

export { asaas };
export default asaas; 