import { NextRequest, NextResponse } from 'next/server';
import asaasService from '../../../lib/asaas';

/**
 * API Route para interagir com Asaas via backend
 * Evita problemas de CORS fazendo chamadas server-side
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfCnpj = searchParams.get('cpfCnpj');
    const email = searchParams.get('email');

    if (cpfCnpj) {
      const customer = await asaasService.getCustomerByCpfCnpj(cpfCnpj);
      return NextResponse.json({ success: true, customer });
    }

    if (email) {
      const customer = await asaasService.getCustomerByEmail(email);
      return NextResponse.json({ success: true, customer });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Parâmetro cpfCnpj ou email é obrigatório' 
    }, { status: 400 });

  } catch (error) {
    console.error('Erro na API Asaas customers:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json();
    const customer = await asaasService.createCustomer(customerData);
    
    return NextResponse.json({ success: true, customer });

  } catch (error) {
    console.error('Erro ao criar cliente Asaas:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar cliente' 
    }, { status: 500 });
  }
} 