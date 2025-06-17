/**
 * Serviço para integração com a API do Asaas
 * Documentação: https://asaasv3.docs.apiary.io/
 */

import { SubscriptionPlan } from "../models/types";
import axios, { AxiosInstance } from 'axios';

// Tipos
export interface AsaasCustomer {
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
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  city?: string;
  state?: string;
}

export interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX";
  nextDueDate: string;
  value: number;
  cycle: "MONTHLY" | "YEARLY" | "WEEKLY" | "BIWEEKLY";
  description?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  fine?: {
    value: number;
    type: "FIXED" | "PERCENTAGE";
  };
  interest?: {
    value: number;
  };
  externalReference?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE' | 'SUSPENDED';
}

export interface AsaasPayment {
  id: string;
  subscription: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "RECEIVED_IN_CASH" | "REFUND_REQUESTED" | "CHARGEBACK_REQUESTED" | "CHARGEBACK_DISPUTE" | "AWAITING_CHARGEBACK_REVERSAL" | "DUNNING_REQUESTED" | "DUNNING_RECEIVED" | "AWAITING_RISK_ANALYSIS";
  dueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  invoiceNumber: string;
  deleted: boolean;
  description: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  fineValue?: number;
  transactionReceiptUrl?: string;
  pixTransaction?: {
    qrCode: {
      encodedImage: string;
      payload: string;
    };
  };
}

// Mapeamento de Planos para IDs no Asaas
export const planToAsaasMap = {
  [SubscriptionPlan.FREE]: null, // Plano gratuito não possui ID no Asaas
  [SubscriptionPlan.MICRO_BUSINESS]: "plan_micro_business",
  [SubscriptionPlan.SMALL_BUSINESS]: "plan_small_business",
  [SubscriptionPlan.BUSINESS_SIMPLE]: "plan_business_simple",
  [SubscriptionPlan.BUSINESS_PLUS]: "plan_business_plus",
};

/**
 * Ambiente mockado para desenvolvimento 
 * Enquanto a conta real não está configurada
 */
const mockSubscriptions: Record<string, any> = {};
const mockCustomers: Record<string, any> = {};
const mockPayments: Record<string, any> = {};

/**
 * Classe para gerenciar a integração com a API do Asaas
 */
class AsaasService {
  private apiKey: string;
  private baseUrl: string;
  private useMock: boolean;
  private client: AxiosInstance;
  private isClient: boolean;

  constructor() {
    // Chave de API da Asaas configurada - USAR DO .ENV
    this.apiKey = process.env.ASAAS_API_KEY || "";
    
    // Detectar se está executando no cliente (browser)
    this.isClient = typeof window !== 'undefined';
    
    // Durante o build, não falhar se a chave não estiver presente
    // A verificação será feita apenas quando realmente precisar usar a API
    if (process.env.NODE_ENV === 'production' && !this.isClient && !this.apiKey) {
      console.warn('⚠️ ASAAS_API_KEY não configurada - será necessária para operações da API');
    } else if (this.apiKey) {
      console.log('✅ ASAAS_API_KEY carregada com sucesso');
    }
    
    // Log detalhado para debug apenas quando necessário
    if (this.apiKey || !this.isClient) {
      console.log('🔑 ASAAS Config Check:', {
        hasEnvKey: !!process.env.ASAAS_API_KEY,
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 10),
        isProduction: process.env.NODE_ENV === 'production',
        isClient: this.isClient
      });
    }
    
    // URL base da API do Asaas (API v3 atualizada)
    this.baseUrl = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
    
    // MODO REAL SEMPRE - Apenas usar backend routes no cliente para evitar CORS
    this.useMock = false;
    
    console.log(`[ASAAS] Modo REAL ativado - ${this.isClient ? 'Cliente (via backend)' : 'Servidor (direto)'}`);
    console.log(`[ASAAS] Base URL: ${this.baseUrl}`);

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'BuscaAquiBDC/1.0'
      },
      timeout: 30000 // 30 segundos timeout
    });
    
    // Log das chamadas da API para debug
    this.client.interceptors.request.use(
      (config) => {
        console.log('🚀 ASAAS Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasData: !!config.data,
          headers: {
            'access_token': config.headers['access_token'] ? 'SET' : 'MISSING',
            'Content-Type': config.headers['Content-Type']
          }
        });
        return config;
      },
      (error) => {
        console.error('❌ ASAAS Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ ASAAS Response:', {
          status: response.status,
          url: response.config.url,
          dataKeys: Object.keys(response.data || {})
        });
        return response;
      },
      (error) => {
        console.error('❌ ASAAS Response Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Configuração para requisições à API - MODO REAL
   */
  private async makeRequest(endpoint: string, method: string, data?: any) {
    // Verificar se a API key está disponível para operações reais
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY é necessária para operações da API. Configure a variável de ambiente no Vercel.');
    }
    
    // Se está no cliente, usar APIs backend para evitar CORS
    if (this.isClient) {
      return this.makeBackendRequest(endpoint, method, data);
    }

    // Se está no servidor, fazer chamada direta para Asaas
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "access_token": this.apiKey,
      "User-Agent": "BuscaAquiBDC-App/1.0"
    };

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API Asaas erro ${response.status}:`, errorData);
        throw new Error(`API Asaas retornou ${response.status}: ${JSON.stringify(errorData)}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro na chamada Asaas:`, error);
      throw error;
    }
  }

  /**
   * Chamadas via backend para evitar CORS no cliente
   */
  private async makeBackendRequest(endpoint: string, method: string, data?: any) {
    let backendUrl = '';
    
    // Mapear endpoints para rotas backend
    if (endpoint.startsWith('/customers')) {
      backendUrl = '/api/asaas/customers';
      if (endpoint.includes('?cpfCnpj=')) {
        const cpfCnpj = endpoint.split('?cpfCnpj=')[1];
        backendUrl += `?cpfCnpj=${cpfCnpj}`;
      }
      if (endpoint.includes('?email=')) {
        const email = endpoint.split('?email=')[1];
        backendUrl += `?email=${email}`;
      }
    } else if (endpoint.startsWith('/subscriptions')) {
      backendUrl = '/api/asaas/subscriptions';
      if (endpoint.includes('?customer=')) {
        const customerId = endpoint.split('?customer=')[1];
        backendUrl += `?customerId=${customerId}`;
      }
      // Para buscar subscription específica
      if (endpoint.includes('/subscriptions/') && !endpoint.includes('/payments')) {
        const subscriptionId = endpoint.split('/subscriptions/')[1];
        backendUrl += `?subscriptionId=${subscriptionId}`;
      }
      // Para buscar pagamentos de uma subscription
      if (endpoint.includes('/payments')) {
        const subscriptionId = endpoint.split('/subscriptions/')[1].split('/payments')[0];
        backendUrl = '/api/asaas/payments';
        backendUrl += `?subscriptionId=${subscriptionId}`;
      }
    } else if (endpoint.startsWith('/payments')) {
      backendUrl = '/api/asaas/payments';
      if (endpoint.includes('?customer=')) {
        const customerId = endpoint.split('?customer=')[1];
        backendUrl += `?customerId=${customerId}`;
      }
      // Para buscar payment específico
      if (endpoint.includes('/payments/') && endpoint.split('/payments/')[1]) {
        const paymentId = endpoint.split('/payments/')[1];
        backendUrl += `?paymentId=${paymentId}`;
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(backendUrl, options);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na API backend');
      }
      
      return result;
    } catch (error) {
      console.error(`Erro na chamada backend:`, error);
      throw error;
    }
  }

  /**
   * Criar um novo cliente no Asaas
   */
  async createCustomer(customerData: AsaasCustomer) {
    return this.makeRequest('/customers', 'POST', customerData);
  }

  /**
   * Buscar um cliente pelo ID
   */
  async getCustomer(customerId: string) {
    return this.makeRequest(`/customers/${customerId}`, "GET");
  }

  /**
   * Buscar um cliente pelo CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string) {
    const response: any = await this.makeRequest(`/customers?cpfCnpj=${cpfCnpj}`, "GET");
    return response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Criar uma nova assinatura
   */
  async createSubscription(subscriptionData: AsaasSubscription) {
    return this.makeRequest('/subscriptions', 'POST', subscriptionData);
  }

  /**
   * Buscar uma assinatura pelo ID
   */
  async getSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, 'GET');
  }

  /**
   * Buscar todas as assinaturas de um cliente
   */
  async getCustomerSubscriptions(customerId: string) {
    const response: any = await this.makeRequest(`/subscriptions?customer=${customerId}`, "GET");
    return response.data || [];
  }

  /**
   * Cancelar uma assinatura
   */
  async cancelSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  /**
   * Buscar os pagamentos de uma assinatura
   */
  async getSubscriptionPayments(subscriptionId: string) {
    const response: any = await this.makeRequest(`/subscriptions/${subscriptionId}/payments`, "GET");
    return response.data || [];
  }

  /**
   * Buscar os pagamentos de um cliente
   */
  async getCustomerPayments(customerId: string) {
    const response: any = await this.makeRequest(`/payments?customer=${customerId}`, "GET");
    return response.data || [];
  }

  /**
   * Verificar se um cliente possui uma assinatura ativa
   */
  async hasActiveSubscription(customerId: string): Promise<boolean> {
    const subscriptions: any[] = await this.getCustomerSubscriptions(customerId);
    return subscriptions.some(sub => sub.status === "ACTIVE");
  }

  /**
   * Verificar o plano atual de um cliente
   */
  async getCustomerPlan(customerId: string): Promise<SubscriptionPlan> {
    // Buscar assinaturas ativas
    const subscriptions: any[] = await this.getCustomerSubscriptions(customerId);
    const activeSubscription = subscriptions.find(sub => sub.status === "ACTIVE");
    
    if (!activeSubscription) {
      return SubscriptionPlan.FREE;
    }
    
    // Verificar o plano baseado na descrição ou referência externa da assinatura
    const description = activeSubscription.description || "";
    const externalReference = activeSubscription.externalReference || "";
    
    // Mapear de volta do Asaas para o SubscriptionPlan
    // Isso depende de como os planos são armazenados no Asaas
    if (description.includes("Business Plus") || externalReference === SubscriptionPlan.BUSINESS_PLUS) {
      return SubscriptionPlan.BUSINESS_PLUS;
    } else if (description.includes("Empresa Simples") || externalReference === SubscriptionPlan.BUSINESS_SIMPLE) {
      return SubscriptionPlan.BUSINESS_SIMPLE;
    } else if (description.includes("Small Business") || externalReference === SubscriptionPlan.SMALL_BUSINESS) {
      return SubscriptionPlan.SMALL_BUSINESS;
    } else if (description.includes("Micro Business") || externalReference === SubscriptionPlan.MICRO_BUSINESS) {
      return SubscriptionPlan.MICRO_BUSINESS;
    }
    
    return SubscriptionPlan.FREE;
  }

  // Criar cobrança avulsa (para destaques)
  async createPayment(paymentData: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    discount?: {
      value: number;
      dueDateLimitDays: number;
    };
    interest?: {
      value: number;
    };
    fine?: {
      value: number;
    };
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone: string;
    };
  }) {
    return this.makeRequest('/payments', 'POST', paymentData);
  }

  // Buscar cobrança
  async getPayment(paymentId: string) {
    return this.makeRequest(`/payments/${paymentId}`, 'GET');
  }

  // Validar webhook
  validateWebhook(payload: string, signature: string): boolean {
    // Implementar validação do webhook baseada no secret
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  // Buscar cliente pelo email
  async getCustomerByEmail(email: string) {
    const response: any = await this.makeRequest(`/customers?email=${email}`, "GET");
    return response.data && response.data.length > 0 ? response.data[0] : null;
  }

  // Atualizar assinatura
  async updateSubscription(subscriptionId: string, updateData: {
    value?: number;
    cycle?: 'MONTHLY' | 'YEARLY';
    description?: string;
  }) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, 'POST', updateData);
  }
}

// Exportar uma instância única do serviço
const asaasService = new AsaasService();
export default asaasService; 