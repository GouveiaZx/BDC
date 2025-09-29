import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { sendAdModerationEmail } from '../../../../lib/email-templates/index';

export const dynamic = 'force-dynamic';

async function checkManualAuth(request: NextRequest): Promise<{ isValid: boolean; errorMessage?: string }> {
  try {
    const adminAuthCookie = request.cookies.get('admin-auth')?.value;
    const sbAccessToken = request.cookies.get('sb-access-token')?.value;
    const authHeader = request.headers.get('authorization');

    if (adminAuthCookie === 'true') {
      
      return { isValid: true };
    }
    
    if (sbAccessToken) {
      
      return { isValid: true };
    }
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      
      return { isValid: true };
    }

    return { 
      isValid: false, 
      errorMessage: 'Sessão de administrador expirada. Faça login novamente.' 
    };
  } catch (error) {
    
    return { 
      isValid: false, 
      errorMessage: 'Erro ao verificar autenticação. Tente novamente.' 
    };
  }
}

export async function PATCH(request: NextRequest) {
  try {
    
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
    const authResult = await checkManualAuth(request);
    
    if (!authResult.isValid) {
      
      return NextResponse.json({ 
        success: false, 
        message: authResult.errorMessage || 'Acesso negado',
        errorType: 'AUTHENTICATION_FAILED'
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o anúncio existe na tabela correta (ads)
    
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();
    
    if (fetchError || !existingAd) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Anúncio não encontrado' 
      }, { status: 404 });
    }

    // Atualizar o anúncio na tabela 'ads' (nome correto da tabela)
    const updateData = {
      status: action === 'approve' ? 'active' : 'rejected',
      moderation_status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'reject' ? reason : null,
      updated_at: new Date().toISOString()
    };
    
    // Se for aprovação, definir data de publicação
    if (action === 'approve') {
      updateData['published_at'] = new Date().toISOString();
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', adId)
      .select();
    
    if (updateError) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar anúncio: ' + updateError.message 
      }, { status: 500 });
    }
    
    if (!updateResult || updateResult.length === 0) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum registro foi atualizado' 
      }, { status: 500 });
    }
    
    const updatedAd = updateResult[0];

    // Buscar dados do usuário para envio de email
    let userEmail = null;
    let userProfile = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', existingAd.user_id)
        .single();
      
      if (!userError && userData) {
        userEmail = userData.email;
        userProfile = userData;
      }
    } catch (userFetchError) {
      
    }
    
    // Criar notificação para o usuário
    try {
      let notificationTitle, notificationMessage;
      
      if (action === 'approve') {
        notificationTitle = 'Anúncio aprovado!';
        notificationMessage = `Seu anúncio "${existingAd.title}" foi aprovado e já está disponível para visualização.`;
      } else {
        notificationTitle = 'Anúncio não aprovado';
        notificationMessage = `Seu anúncio "${existingAd.title}" não foi aprovado. Motivo: ${reason}`;
      }
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: existingAd.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: action === 'approve' ? 'ad_approved' : 'ad_rejected',
          related_entity_type: 'ad',
          related_entity_id: adId,
          created_at: new Date().toISOString()
        });
      
      if (notificationError) {
        
        // Não falhar a operação por causa da notificação
      } else {
        
      }
    } catch (notifError) {
      
      // Continuar mesmo se falhar a notificação
    }

    // Enviar email de moderação para o usuário
    if (userEmail) {
      try {
        
        const emailResult = await sendAdModerationEmail({
          userEmail: userEmail,
          userName: userProfile?.name || 'Usuário',
          adId: existingAd.id,
          adTitle: existingAd.title,
          status: action === 'approve' ? 'approved' : 'rejected',
          rejectionReason: action === 'reject' ? reason : undefined
        });
        
        if (emailResult.success) {
          
        } else {
          
        }
      } catch (emailError) {
        
        // Não falhar a operação por causa do email
      }
    } else {
      
    }
    
    // Log da ação para auditoria
    
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
    const authResult = await checkManualAuth(request);
    
    if (!authResult.isValid) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.errorMessage || 'Acesso negado',
        errorType: 'AUTHENTICATION_FAILED' 
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
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 