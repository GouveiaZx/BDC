import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Obter dados da requisição
    const data = await request.json();
    const { adId, reporterId, reporterName, reporterEmail, reason, description } = data;
    
    // Validar dados obrigatórios
    if (!adId || !reporterId || !reason) {
      return NextResponse.json({ 
        success: false, 
        message: 'Parâmetros obrigatórios ausentes' 
      }, { status: 400 });
    }
    
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do anúncio inválido' 
      }, { status: 400 });
    }
    
    // Inicializar cliente Supabase Admin
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Verificar se o anúncio existe
    const { data: adData, error: adError } = await supabaseAdmin
      .from('ads')
      .select('id')
      .eq('id', adId)
      .maybeSingle();
    
    if (adError || !adData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Anúncio não encontrado' 
      }, { status: 404 });
    }
    
    // Verificar se usuário já reportou este anúncio
    const { data: existingReport, error: existingError } = await supabaseAdmin
      .from('ad_reports')
      .select('id')
      .eq('ad_id', adId)
      .eq('reporter_id', reporterId)
      .maybeSingle();
    
    if (!existingError && existingReport) {
      return NextResponse.json({ 
        success: false, 
        message: 'Você já reportou este anúncio anteriormente' 
      }, { status: 409 });
    }
    
    // Inserir a denúncia usando cliente admin
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
      console.error('Erro ao reportar anúncio:', reportError);
      
      if (reportError.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          message: 'Você já reportou este anúncio anteriormente'
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao processar denúncia',
        error: reportError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Anúncio reportado com sucesso',
      data: reportData[0]
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 