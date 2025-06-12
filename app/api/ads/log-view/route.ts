import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.adId) {
      return NextResponse.json(
        { error: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    const adId = body.adId;
    const cookieStore = cookies();
    
    // Obter IP do cliente (via headers do Vercel ou Next.js)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Obter user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Obter referrer
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';
    
    // Obter ID do usuário visualizador (se autenticado)
    const viewerId = cookieStore.get('userId')?.value;
    
    // Cliente Supabase para operações
    const supabase = getSupabaseAdminClient();
    
    // Verificar se o anúncio existe e está ativo antes de incrementar visualizações
    // Tentar primeiro na tabela ads
    let adExists;
    let adCheckError;
    
    const { data: adFromAds, error: adsError } = await supabase
      .from('ads')
      .select('id, user_id, status, moderation_status')
      .eq('id', adId)
      .single();
    
    if (adsError && adsError.code !== 'PGRST116') {
      // Se erro não for "not found", tentar na tabela advertisements como fallback
      const { data: adFromAdvertisements, error: advertisementsError } = await supabase
        .from('advertisements')
        .select('id, user_id, status, moderation_status')
        .eq('id', adId)
        .single();
      
      adExists = adFromAdvertisements;
      adCheckError = advertisementsError;
    } else {
      adExists = adFromAds;
      adCheckError = adsError;
    }
    
    if (adCheckError || !adExists) {
      console.error('Erro ao verificar anúncio ou anúncio não existe:', adCheckError);
      return NextResponse.json({ 
        error: 'Anúncio não encontrado ou inválido',
        details: adCheckError?.message
      }, { status: 404 });
    }
    
    // Verificar se o anúncio está ativo
    if (adExists.status !== 'active' || adExists.moderation_status !== 'approved') {
      return NextResponse.json({ 
        error: 'Anúncio não está ativo ou aprovado',
        currentStatus: adExists.status,
        moderationStatus: adExists.moderation_status
      }, { status: 403 });
    }
    
    // Verificar se a visualização é do próprio anunciante e evitar contar
    if (viewerId && viewerId === adExists.user_id) {
      return NextResponse.json({
        success: true,
        message: 'Visualização do próprio anunciante não contabilizada',
        data: {
          adId,
          ownView: true
        }
      });
    }
    
    // Incrementar contador de visualizações diretamente na tabela
    let incrementError = null;
    let newViewCount = 1;
    
    try {
      // Primeiro, obter o count atual
      const { data: currentAd, error: getCurrentError } = await supabase
        .from('ads')
        .select('view_count')
        .eq('id', adId)
        .single();
      
      if (!getCurrentError && currentAd) {
        // Atualizar com o novo valor
        const newCount = (currentAd.view_count || 0) + 1;
        const { data: updateResult, error: updateErr } = await supabase
          .from('ads')
          .update({ 
            view_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', adId)
          .select('view_count');
        
        if (!updateErr && updateResult?.[0]) {
          newViewCount = updateResult[0].view_count;
        } else {
          incrementError = updateErr;
        }
      } else {
        // Se falhar, tentar na tabela advertisements
        const { data: currentAdvertisement, error: getCurrentAdvError } = await supabase
          .from('advertisements')
          .select('views')
          .eq('id', adId)
          .single();
          
        if (!getCurrentAdvError && currentAdvertisement) {
          const newCount = (currentAdvertisement.views || 0) + 1;
          const { data: altUpdateResult, error: altUpdateErr } = await supabase
            .from('advertisements')
            .update({ 
              views: newCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', adId)
            .select('views');
            
          if (!altUpdateErr && altUpdateResult?.[0]) {
            newViewCount = altUpdateResult[0].views;
          } else {
            incrementError = altUpdateErr;
          }
        } else {
          incrementError = getCurrentAdvError || getCurrentError;
        }
      }
    } catch (error) {
      incrementError = error;
    }
    
    if (incrementError) {
      console.error('Erro ao incrementar visualizações:', incrementError);
      // Não falhar completamente, apenas registrar o log
      console.warn('Continuando sem incrementar contador devido a erro:', incrementError.message);
    }
    
    // Tentar registrar log adicional (mesmo que a contagem já tenha sido incrementada)
    try {
      // Registrar a visualização no log detalhado
      await supabase
        .from('ad_views_log')
        .insert({
          ad_id: adId,
          user_id: adExists.user_id,
          viewer_id: viewerId,
          viewer_ip: ip,
          count: 1,
          created_at: new Date().toISOString(),
          referrer: referrer,
          user_agent: userAgent
        });
    } catch (logError) {
      // Apenas registrar o erro, não falhar a requisição já que a contagem foi incrementada
      console.warn('Erro ao registrar log detalhado:', logError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Visualização registrada com sucesso',
      data: {
        adId,
        views: newViewCount || 1
      }
    });
  } catch (error) {
    console.error('Erro ao processar visualização:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 