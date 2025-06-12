import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

async function checkManualAuth(request: NextRequest): Promise<boolean> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    
    if (adminAuthCookie === 'true') {
      console.log('(Moderate API) Autenticação manual válida via cookie admin-auth');
      return true;
    }
    
    if (sbAccessToken) {
      console.log('(Moderate API) Autenticação manual válida via sb-access-token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('(Moderate API) Erro ao verificar autenticação manual:', error);
    return false;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('(Moderate API) 🎯 Iniciando moderação de anúncio');
    
    const body = await request.json();
    const { id: adId, action, reason } = body;
    
    if (!adId || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do anúncio e ação são obrigatórios' 
      }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ação deve ser "approve" ou "reject"' 
      }, { status: 400 });
    }
    
    if (action === 'reject' && !reason) {
      return NextResponse.json({ 
        success: false, 
        message: 'Motivo é obrigatório para rejeição' 
      }, { status: 400 });
    }
    
    // Verificar autenticação manual (para bypass durante desenvolvimento)
    const hasManualAuth = await checkManualAuth(request);
    
    if (!hasManualAuth) {
      console.warn('(Moderate API) Acesso negado - sem autenticação manual');
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o anúncio existe na tabela correta (ads)
    console.log('(Moderate API) 🔍 Verificando se anúncio existe:', adId);
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();
    
    if (fetchError || !existingAd) {
      console.error('(Moderate API) ❌ Anúncio não encontrado:', fetchError?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Anúncio não encontrado' 
      }, { status: 404 });
    }
    
    console.log('(Moderate API) ✅ Anúncio encontrado:', {
      id: existingAd.id,
      title: existingAd.title,
      currentStatus: existingAd.status,
      currentModerationStatus: existingAd.moderation_status
    });
    
    // Atualizar o anúncio na tabela 'ads' (nome correto da tabela)
    const updateData = {
      status: action === 'approve' ? 'active' : 'inactive',
      moderation_status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'reject' ? reason : null,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('(Moderate API) 📝 Atualizando anúncio com dados:', updateData);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', adId)
      .select();
    
    if (updateError) {
      console.error('(Moderate API) ❌ Erro ao atualizar anúncio:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar anúncio: ' + updateError.message 
      }, { status: 500 });
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.error('(Moderate API) ❌ Nenhum registro foi atualizado');
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum registro foi atualizado' 
      }, { status: 500 });
    }
    
    const updatedAd = updateResult[0];
    
    console.log('(Moderate API) ✅ Anúncio atualizado com sucesso:', {
      id: updatedAd.id,
      newStatus: updatedAd.status,
      newModerationStatus: updatedAd.moderation_status,
      action: action
    });
    
    // Log da ação para auditoria
    console.log(`(Moderate API) 📊 MODERAÇÃO CONCLUÍDA:
      - Anúncio: ${updatedAd.id}
      - Título: ${updatedAd.title}
      - Ação: ${action}
      - Status: ${updatedAd.status}
      - Moderação: ${updatedAd.moderation_status}
      - Motivo rejeição: ${updatedAd.rejection_reason || 'N/A'}
    `);
    
    return NextResponse.json({ 
      success: true, 
      message: action === 'approve' ? 'Anúncio aprovado com sucesso' : 'Anúncio rejeitado com sucesso',
      data: {
        id: updatedAd.id,
        status: updatedAd.status,
        moderation_status: updatedAd.moderation_status,
        rejection_reason: updatedAd.rejection_reason
      }
    });
    
  } catch (error) {
    console.error('(Moderate API) ❌ Erro crítico ao moderar anúncio:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Método para buscar anúncio específico (usado pelo modal de detalhes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('id');
    
    if (!adId) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do anúncio é obrigatório' 
      }, { status: 400 });
    }
    
    // Verificar autenticação manual
    const hasManualAuth = await checkManualAuth(request);
    
    if (!hasManualAuth) {
      return NextResponse.json({ 
        success: false, 
        message: 'Acesso negado' 
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Buscar anúncio com dados do usuário
    const { data: ad, error } = await supabase
      .from('ads')
      .select(`
        *,
        profiles:user_id (
          id, name, email, avatar_url, account_type, phone
        )
      `)
      .eq('id', adId)
      .single();
    
    if (error || !ad) {
      console.error('(Moderate API) Erro ao buscar anúncio:', error?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Anúncio não encontrado' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: ad 
    });
    
  } catch (error) {
    console.error('(Moderate API) Erro ao buscar anúncio:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 