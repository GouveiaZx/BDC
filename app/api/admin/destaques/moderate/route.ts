import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { cookies } from 'next/headers';
import { verifyAdminAuth } from '../../../../lib/serverAdminAuth';

/**
 * API para moderação de destaques (aprovar/rejeitar)
 * Esta API só deve ser acessada por administradores
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do administrador
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Apenas administradores podem moderar destaques.' },
        { status: 401 }
      );
    }

    // Obter corpo da requisição
    const body = await request.json();
    const { id, action, reason } = body;

    // Validações
    if (!id) {
      return NextResponse.json({ error: 'ID do destaque é obrigatório' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida. Use "approve" ou "reject"' }, { status: 400 });
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'Motivo é obrigatório para rejeições' }, { status: 400 });
    }

    // MÉTODO ALTERNATIVO: Usar mock data para desenvolvimento
    console.log('Usando método de mock para moderar destaque:', id, action);
    
    // Simular uma resposta de sucesso
    const mockDestaque = {
      id,
      title: 'Título do Destaque',
      mediaUrl: 'https://example.com/image.jpg',
      mediaType: 'foto',
      userId: 'user123',
      userName: 'Nome do Usuário',
      status: action === 'approve' ? 'approved' : 'rejected',
      reason: action === 'reject' ? reason : undefined,
      updatedAt: new Date().toISOString(),
      expiresAt: action === 'approve' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
    };

    // Registrar para depuração
    console.log('Destaque moderado (mock):', mockDestaque);
    
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Destaque aprovado com sucesso' : 'Destaque rejeitado',
      data: mockDestaque
    });
  } catch (error: any) {
    console.error('Erro ao processar moderação de destaque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 