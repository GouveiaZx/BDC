import { NextResponse } from 'next/server';
import { validateAuth } from '../../../lib/jwt';

export async function POST(request: Request) {
  try {
    // Usar o sistema JWT unificado
    const validation = validateAuth(request);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Token inválido'
        },
        { status: 401 }
      );
    }

    const user = validation.user!;

    const responseData = {
      success: true,
      userId: user.userId,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      userType: user.userType,
      isAdmin: user.isAdmin
    };
    
    
    // Retornar informações do usuário
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao validar token' },
      { status: 500 }
    );
  }
} 