import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';
import { adminAuth } from '../../../lib/adminAuth';
import { convertTempIdToUUID } from '../../../lib/utils';

interface NotificationData {
  userId: string;
  title?: string;
  message: string;
  type: 'system' | 'message' | 'payment' | 'ad' | 'approval' | 'rejection' | 'subscription' | 'contact' | 'alert';
  adId?: string;
  adTitle?: string;
  data?: any;
}

export async function POST(request: Request) {
  try {
    // Verificar se a solicitação vem de um administrador ou do próprio sistema
    const cookieStore = cookies();
    const isAdmin = cookieStore.get('admin_auth')?.value === 'true';
    
    // Verificar token de autenticação do usuário
    const token = cookieStore.get('sb-access-token')?.value;
    const hasUserAuth = !!token;
    
    if (!isAdmin && !hasUserAuth) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar dados mínimos necessários
    if (!body.userId || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Dados incompletos. userId, message e type são obrigatórios' },
        { status: 400 }
      );
    }

    // Converter ID temporário para UUID válido se necessário
    let validUserId = body.userId;
    if (body.userId.startsWith('temp-')) {
      validUserId = convertTempIdToUUID(body.userId);
      
    }

    const notificationData: NotificationData = {
      userId: validUserId,
      title: body.title,
      message: body.message,
      type: body.type,
      adId: body.adId,
      adTitle: body.adTitle,
      data: body.data
    };

    const supabase = getSupabaseAdminClient();
    
    // Tentar criar a tabela se ela não existir
    try {
      await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ad_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,
            ad_title TEXT,
            data JSONB
          );
        `
      });
    } catch (error) {
      // Continuar mesmo se houver erro, pois a tabela pode já existir
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        ad_id: notificationData.adId,
        ad_title: notificationData.adTitle,
        data: notificationData.data,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação adicionada com sucesso',
      data: data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 