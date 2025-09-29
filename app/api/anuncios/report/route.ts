import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      adId, 
      reporterId, 
      reporterName, 
      reporterEmail, 
      reason, 
      description 
    } = body;
    
    // Validações básicas
    if (!adId || !reporterId || !reason) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados incompletos: adId, reporterId e reason são obrigatórios'
      }, { status: 400 });
    }
    const supabaseAdmin = getSupabaseAdminClient();
    
    // ✅ CORREÇÃO: Verificar se já existe uma denúncia deste usuário para este anúncio
    const { data: existingReport, error: checkError } = await supabaseAdmin
      .from('ad_reports')
      .select('id')
      .eq('ad_id', adId)
      .eq('reporter_id', reporterId)
      .maybeSingle();
    
    if (checkError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao verificar denúncia'
      }, { status: 500 });
    }

    if (existingReport) {
      return NextResponse.json({ 
        success: false, 
        message: 'Você já denunciou este anúncio anteriormente'
      }, { status: 409 });
    }
    
    // ✅ CORREÇÃO: Inserir denúncia SEM tentar criar usuário
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('ad_reports')
      .insert([
        {
          ad_id: adId,
          reporter_id: reporterId,
          reporter_name: reporterName || 'Usuário',
          reporter_email: reporterEmail || '',
          reason,
          description: description || '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (reportError) {
      if (reportError.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          message: 'Você já reportou este anúncio anteriormente'
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao processar denúncia: ' + reportError.message
      }, { status: 500 });
    }
    return NextResponse.json({ 
      success: true, 
      message: 'Anúncio reportado com sucesso',
      data: reportData[0]
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 