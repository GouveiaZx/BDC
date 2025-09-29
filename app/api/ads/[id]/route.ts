import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { cookies } from 'next/headers';

interface RouteParams {
  params: {
    id: string;
  };
}

// Endpoint para buscar um anúncio específico pelo ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID do anúncio é obrigatório' }, { status: 400 });
    }
    
    // Se for um ID mockado, retornar com erro
    if (id.startsWith('mock-ad-')) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }
    
    // Tentar buscar o anúncio no Supabase
    const supabase = getSupabaseAdminClient();
    
    // Verificar em ambas as tabelas
    let adData = null;
    let error = null;
    
    // Primeiro tenta com 'advertisements'
    try {
      const result = await supabase
        .from('advertisements')
        .select('*')
        .eq('id', id)
        .single();
      
      adData = result.data;
      error = result.error;
      
      if (error && error.message && error.message.includes('does not exist')) {
        throw new Error('Tabela advertisements não existe');
      }
    } catch (err) {
      // Se falhar, tenta com 'ads' incluindo as imagens
      try {
        const result = await supabase
          .from('ads')
          .select(`
            *,
            ad_photos(
              id,
              file_url,
              is_primary,
              sort_order
            )
          `)
          .eq('id', id)
          .single();
        
        adData = result.data;
        error = result.error;
      } catch (finalErr) {
      }
    }
    
    if (error || !adData) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }
    
    // ✅ FORMATAR IMAGENS DO ANÚNCIO
    const adPhotos = adData.ad_photos || [];
    const sortedPhotos = adPhotos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    const primaryPhoto = adPhotos.find((photo: any) => photo.is_primary) || sortedPhotos[0];
    
    // Mapear para o formato esperado pelo frontend
    const mappedAd = {
      id: adData.id,
      title: adData.title,
      category: adData.category || 'Sem categoria',
      subCategory: adData.sub_category,
      price: adData.price,
      views: adData.views || 0,
      clicks: adData.clicks || 0,
      status: adData.status || 'active',
      moderationStatus: adData.moderation_status || 'pending',
      images: sortedPhotos.map((photo: any) => photo.file_url),
      photos: sortedPhotos,
      primary_photo: primaryPhoto?.file_url || null,
      created: adData.created_at,
      createdAt: adData.created_at,
      updatedAt: adData.updated_at,
      expires: adData.expires_at,
      description: adData.description || '',
      location: adData.location || ''
    };
    
    return NextResponse.json({ ad: mappedAd });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adId = params.id;
    
    if (!adId) {
      return NextResponse.json(
        { error: 'ID do anúncio não fornecido' },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    // Validação básica
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }
    
    // Mapear dados do formato da aplicação para o formato do banco
    const mappedData: any = {};
    
    // Mapear apenas os campos que foram enviados
    if (data.title !== undefined) mappedData.title = data.title;
    if (data.description !== undefined) mappedData.description = data.description;
    if (data.price !== undefined) mappedData.price = data.price;
    if (data.category !== undefined) mappedData.category = data.category;
    if (data.subCategory !== undefined) mappedData.sub_category = data.subCategory;
    if (data.images !== undefined) mappedData.images = data.images;
    if (data.location !== undefined) mappedData.location = data.location;
    if (data.zipCode !== undefined) mappedData.zip_code = data.zipCode;
    if (data.phone !== undefined) mappedData.phone = data.phone;
    if (data.whatsapp !== undefined) mappedData.whatsapp = data.whatsapp;
    if (data.showPhone !== undefined) mappedData.show_phone = data.showPhone;
    if (data.isFreeAd !== undefined) mappedData.is_free_ad = data.isFreeAd;
    if (data.moderationStatus !== undefined) mappedData.moderation_status = data.moderationStatus;
    if (data.views !== undefined) mappedData.views = data.views;
    if (data.clicks !== undefined) mappedData.clicks = data.clicks;
    if (data.status !== undefined) mappedData.status = data.status;
    if (data.moderationReason !== undefined) mappedData.moderation_reason = data.moderationReason;
    
    // Sempre atualizar o campo updated_at
    mappedData.updated_at = new Date().toISOString();
    
    // Atualizar anúncio no Supabase
    const { data: updatedAd, error } = await supabaseAdmin
      .from('advertisements')
      .update(mappedData)
      .eq('id', adId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar anúncio' },
        { status: 500 }
      );
    }
    
    // Mapear para o formato esperado pela aplicação
    const mappedUpdatedAd = {
      id: updatedAd.id,
      title: updatedAd.title,
      description: updatedAd.description,
      price: updatedAd.price,
      category: updatedAd.category,
      subCategory: updatedAd.sub_category,
      images: updatedAd.images || [],
      location: updatedAd.location,
      zipCode: updatedAd.zip_code,
      phone: updatedAd.phone,
      whatsapp: updatedAd.whatsapp,
      showPhone: updatedAd.show_phone,
      isFreeAd: updatedAd.is_free_ad,
      moderationStatus: updatedAd.moderation_status,
      moderationReason: updatedAd.moderation_reason,
      createdAt: updatedAd.created_at,
      updatedAt: updatedAd.updated_at,
      userId: updatedAd.user_id,
      userName: updatedAd.user_name,
      userAvatar: updatedAd.user_avatar,
      views: updatedAd.views,
      clicks: updatedAd.clicks,
      status: updatedAd.status,
      expires: updatedAd.expires_at
    };
    
    return NextResponse.json({
      success: true,
      message: 'Anúncio atualizado com sucesso',
      ad: mappedUpdatedAd
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}

// Endpoint para excluir um anúncio
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do anúncio é obrigatório' }, { status: 400 });
    }
    
    // Recuperar token do cabeçalho Authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Também tentar recuperar o token do cookie
    const cookieStore = cookies();
    const tokenFromCookie = cookieStore.get('sb-access-token')?.value;
    
    // Usar o token do cabeçalho ou do cookie
    const authToken = token || tokenFromCookie;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Primeiro, buscar o anúncio para verificar se existe e pegar as imagens
    const { data: adData, error: fetchError } = await supabase
      .from('ads')
      .select(`
        *,
        ad_photos(
          id,
          file_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (fetchError || !adData) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }
    // Usar transação para garantir consistência
    try {
      // 1. Excluir fotos relacionadas na tabela ad_photos
      const { error: photosError } = await supabase
        .from('ad_photos')
        .delete()
        .eq('ad_id', id);
      
      if (photosError) {
        throw new Error('Falha ao excluir fotos do anúncio');
      }
      
      // 2. Excluir denúncias relacionadas na tabela ad_reports
      const { error: reportsError } = await supabase
        .from('ad_reports')
        .delete()
        .eq('ad_id', id);
      
      if (reportsError) {
        throw new Error('Falha ao excluir denúncias do anúncio');
      }
      
      // 3. Excluir relatórios na tabela reports
      const { error: generalReportsError } = await supabase
        .from('reports')
        .delete()
        .eq('ad_id', id);
      
      if (generalReportsError) {
        throw new Error('Falha ao excluir relatórios do anúncio');
      }
      
      // 4. Excluir imagens do Supabase Storage
      if (adData.ad_photos && adData.ad_photos.length > 0) {
        for (const photo of adData.ad_photos) {
          if (photo.file_url) {
            // Extrair o caminho do arquivo da URL
            const urlParts = photo.file_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `anuncios/${adData.user_id}/${fileName}`;
            
            const { error: storageError } = await supabase.storage
              .from('public')
              .remove([filePath]);
            
            if (storageError) {
              // Não falhar a exclusão do anúncio por causa de erro no storage
            }
          }
        }
      }
      
      // Também excluir imagens do campo images (jsonb)
      if (adData.images && Array.isArray(adData.images)) {
        for (const imageUrl of adData.images) {
          if (imageUrl) {
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `anuncios/${adData.user_id}/${fileName}`;
            
            const { error: storageError } = await supabase.storage
              .from('public')
              .remove([filePath]);
            
            if (storageError) {
            }
          }
        }
      }
      
      // 5. Finalmente, excluir o anúncio principal
      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw new Error('Falha ao excluir anúncio principal');
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Anúncio e todas as dependências excluídos com sucesso' 
      });
      
    } catch (deleteErr) {
      return NextResponse.json({ 
        error: deleteErr instanceof Error ? deleteErr.message : 'Erro ao excluir anúncio' 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}