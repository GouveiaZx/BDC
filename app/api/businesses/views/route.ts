import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { v4 as uuidv4, validate as isUUID } from 'uuid';

// Tornar a API dinâmica para evitar cache
export const dynamic = 'force-dynamic';

// Converter ID para UUID válido se necessário - melhor implementação
function ensureValidUUID(id: string): string | null {
  if (!id) return null;
  if (isUUID(id)) {
    return id;
  }
  
  // Se não for UUID válido, não converter - apenas retornar null para indicar erro
  console.warn('ID fornecido não é um UUID válido:', id);
  return null;
}

// Obter estatísticas de visualizações de uma empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    const validBusinessId = ensureValidUUID(businessId);
    if (!validBusinessId) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa inválido'
      }, { status: 400 });
    }
    
    console.log(`Buscando visualizações para ID: ${validBusinessId}`);
    
    const supabase = getSupabaseAdminClient();
    
    // Buscar total de visualizações únicas da empresa
    const { data: viewsData, error: viewsError } = await supabase
      .from('business_views')
      .select('id')
      .eq('business_id', validBusinessId);
    
    if (viewsError) {
      console.warn('Aviso: Erro ao buscar visualizações da tabela business_views:', viewsError);
      
      // Fallback: buscar do business_profiles se existir
      try {
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('total_views')
          .eq('user_id', validBusinessId) // Usar user_id ao invés de id
          .single();
        
        if (businessError) {
          console.warn('Aviso: Erro ao buscar empresa no fallback:', businessError);
        }
        
        return NextResponse.json({
          success: true,
          views: businessData?.total_views || 0
        });
      } catch (fallbackError) {
        console.warn('Erro no fallback:', fallbackError);
        return NextResponse.json({
          success: true,
          views: 0 // Retornar 0 se não encontrou nada
        });
      }
    }
    
    const viewsCount = viewsData?.length || 0;
    
    return NextResponse.json({
      success: true,
      views: viewsCount
    });
    
  } catch (error) {
    console.error('Erro na API de visualizações (GET):', error);
    return NextResponse.json({
      success: true,
      views: 0, // Retornar 0 ao invés de erro para não quebrar a UI
      error: 'Erro ao buscar visualizações'
    });
  }
}

// Registrar uma nova visualização
export async function POST(request: Request) {
  try {
    const { businessId, viewerId } = await request.json();
    
    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    const validBusinessId = ensureValidUUID(businessId);
    if (!validBusinessId) {
      console.warn('ID da empresa inválido fornecido:', businessId);
      return NextResponse.json({
        success: true, // Retornar sucesso para não quebrar a UI
        message: 'Visualização ignorada devido a ID inválido'
      });
    }
    
    console.log(`Registrando visualização para ID: ${validBusinessId}`);
    
    const supabase = getSupabaseAdminClient();
    
    // Verificar se a tabela business_views existe
    const { error: tableCheckError } = await supabase
      .from('business_views')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.warn('Tabela business_views não existe ou não é acessível:', tableCheckError);
      return NextResponse.json({
        success: true,
        message: 'Visualização não registrada - tabela indisponível'
      });
    }
    
    // Obter IP do request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    const userAgent = request.headers.get('user-agent') || '';
    
    // Verificar se já existe uma visualização recente deste viewer/IP
    const recentTimeThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás
    
    const { data: recentView } = await supabase
      .from('business_views')
      .select('id')
      .eq('business_id', validBusinessId)
      .eq('ip_address', ip)
      .gte('created_at', recentTimeThreshold.toISOString())
      .limit(1)
      .single();
    
    if (recentView) {
      console.log('Visualização recente encontrada, ignorando duplicata');
      return NextResponse.json({
        success: true,
        message: 'Visualização já registrada recentemente'
      });
    }
    
    // Inserir nova visualização
    const { error: insertError } = await supabase
      .from('business_views')
      .insert({
        business_id: validBusinessId,
        viewer_id: viewerId || null,
        ip_address: ip,
        user_agent: userAgent
      });
    
    if (insertError) {
      console.warn('Aviso: Erro ao inserir visualização:', insertError);
      return NextResponse.json({
        success: true, // Retornar sucesso para não quebrar a UI
        message: 'Visualização não pôde ser registrada'
      });
    }
    
    console.log('✅ Visualização registrada com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Visualização registrada com sucesso'
    });
    
  } catch (error) {
    console.warn('Erro na API de visualizações (POST):', error);
    return NextResponse.json({
      success: true, // Retornar sucesso para não quebrar a UI
      message: 'Erro ao registrar visualização (ignorado)'
    });
  }
} 