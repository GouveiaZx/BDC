import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseClient } from '../../lib/supabase';
import { cookies } from 'next/headers';
import { convertTempIdToUUID } from '../../lib/utils';
import fs from 'fs';
import path from 'path';

// Sistema de armazenamento temporário para anúncios
const TEMP_ADS_FILE = path.join(process.cwd(), 'temp-ads.json');

// Funções auxiliares para gerenciar anúncios temporários
const saveAdTemporarily = (adData: any) => {
  try {
    let tempAds = [];
    if (fs.existsSync(TEMP_ADS_FILE)) {
      const fileContent = fs.readFileSync(TEMP_ADS_FILE, 'utf8');
      tempAds = JSON.parse(fileContent);
    }
    tempAds.unshift(adData); // Adicionar no início
    fs.writeFileSync(TEMP_ADS_FILE, JSON.stringify(tempAds, null, 2));
    console.log('✅ Anúncio salvo em arquivo temporário');
    return true;
  } catch (error) {
    console.error('Erro ao salvar anúncio temporariamente:', error);
    return false;
  }
};

const getTemporaryAds = (userId?: string | null, status?: string | null, moderationStatus?: string | null) => {
  try {
    if (!fs.existsSync(TEMP_ADS_FILE)) {
      return [];
    }
    
    const fileContent = fs.readFileSync(TEMP_ADS_FILE, 'utf8');
    let tempAds = JSON.parse(fileContent);
    
    // Aplicar filtros
    if (userId) {
      tempAds = tempAds.filter((ad: any) => ad.user_id === userId);
    }
    
    if (status) {
      tempAds = tempAds.filter((ad: any) => ad.status === status);
    }
    
    if (moderationStatus) {
      tempAds = tempAds.filter((ad: any) => ad.moderation_status === moderationStatus);
    }
    
    return tempAds;
  } catch (error) {
    console.error('Erro ao carregar anúncios temporários:', error);
    return [];
  }
};

export const dynamic = 'force-dynamic';

// GET - Buscar anúncios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('ads')
      .select(`
        *,
        categories!inner(name, slug),
        cities!inner(name, state)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: ads, error } = await query;

    if (error) {
      console.error('Erro ao buscar anúncios:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar anúncios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ads: ads || [],
      total: ads?.length || 0
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo anúncio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      price,
      category,
      subCategory,
      images,
      location,
      city,
      state,
      zipCode,
      phone,
      whatsapp
    } = body;

    if (!userId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário tem plano gratuito e se é seu primeiro anúncio gratuito
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    const isFreePlan = !userProfile?.subscription_plan || userProfile.subscription_plan === 'FREE';
    
    // Verificar se já tem anúncio gratuito ativo
    const { data: existingFreeAds } = await supabase
      .from('ads')
      .select('id')
      .eq('user_id', userId)
      .eq('is_free_ad', true)
      .eq('status', 'active');

    const isFirstFreeAd = isFreePlan && (!existingFreeAds || existingFreeAds.length === 0);

    // Buscar categoria_id baseado na string category
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .or(`slug.eq.${category},name.ilike.%${category}%`)
      .limit(1)
      .single();

    if (categoryError || !categoryData) {
      console.error('Categoria não encontrada:', category, categoryError);
      return NextResponse.json(
        { error: `Categoria '${category}' não encontrada. Verifique se a categoria existe no sistema.` },
        { status: 400 }
      );
    }

    // Buscar city_id baseado na cidade
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id, name')
      .ilike('name', `%${city}%`)
      .limit(1)
      .single();

    if (cityError || !cityData) {
      console.error('Cidade não encontrada:', city, cityError);
      return NextResponse.json(
        { error: `Cidade '${city}' não encontrada. Verifique se a cidade existe no sistema.` },
        { status: 400 }
      );
    }

    const adData = {
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: categoryData.id,
      city_id: cityData.id,
      title,
      description,
      price: parseFloat(price) || 0,
      category,
      sub_category: subCategory || 'Geral',
      images: images || [],
      location: location || `${city}, ${state}`,
      city,
      state,
      zip_code: zipCode || null,
      contact_phone: phone,
      contact_whatsapp: whatsapp,
      whatsapp,
      phone,
      is_free_ad: isFirstFreeAd, // Marcar como anúncio gratuito se for o primeiro do usuário
      status: 'active',
      moderation_status: 'pending',
      view_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
    };

    console.log('Dados processados para inserção:', {
      id: adData.id,
      user_id: adData.user_id,
      category_id: adData.category_id,
      city_id: adData.city_id,
      category: adData.category,
      city: adData.city,
      title: adData.title,
      images_count: adData.images.length
    });

    const { data: newAd, error } = await supabase
      .from('ads')
      .insert(adData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar anúncio:', error);
      return NextResponse.json(
        { error: 'Erro ao criar anúncio: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Anúncio criado com sucesso',
      ad: newAd
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar anúncio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, userId, category, city, ...updateData } = body;

    console.log('=== INÍCIO UPDATE ANÚNCIO ===');
    console.log('Body recebido:', JSON.stringify(body, null, 2));

    if (!adId || !userId) {
      return NextResponse.json(
        { error: 'ID do anúncio e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do anúncio
    const { data: existingAd, error: checkError } = await supabase
      .from('ads')
      .select('user_id, category_id, city_id, category, city')
      .eq('id', adId)
      .single();

    if (checkError) {
      console.error('Erro ao verificar anúncio existente:', checkError);
      return NextResponse.json(
        { error: 'Erro ao verificar anúncio: ' + checkError.message },
        { status: 500 }
      );
    }

    if (!existingAd || existingAd.user_id !== userId) {
      return NextResponse.json(
        { error: 'Anúncio não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    console.log('Anúncio existente encontrado:', existingAd);

    // Preparar dados para atualização
    let finalUpdateData = {
      ...updateData,
      moderation_status: 'pending',
      status: 'pending',
      updated_at: new Date().toISOString()
    };

    // Converter campos camelCase para snake_case
    console.log('Campos antes da conversão:', Object.keys(finalUpdateData));
    
    if (finalUpdateData.subCategory) {
      finalUpdateData.sub_category = finalUpdateData.subCategory;
      delete finalUpdateData.subCategory;
    }
    if (finalUpdateData.zipCode) {
      finalUpdateData.zip_code = finalUpdateData.zipCode;
      delete finalUpdateData.zipCode;
    }
    
    // Outros campos que podem estar em camelCase
    if (finalUpdateData.contactPhone) {
      finalUpdateData.contact_phone = finalUpdateData.contactPhone;
      delete finalUpdateData.contactPhone;
    }
    if (finalUpdateData.contactWhatsapp) {
      finalUpdateData.contact_whatsapp = finalUpdateData.contactWhatsapp;
      delete finalUpdateData.contactWhatsapp;
    }
    if (finalUpdateData.moderationStatus) {
      finalUpdateData.moderation_status = finalUpdateData.moderationStatus;
      delete finalUpdateData.moderationStatus;
    }
    if (finalUpdateData.viewCount) {
      finalUpdateData.view_count = finalUpdateData.viewCount;
      delete finalUpdateData.viewCount;
    }
    if (finalUpdateData.contactCount) {
      finalUpdateData.contact_count = finalUpdateData.contactCount;
      delete finalUpdateData.contactCount;
    }
    if (finalUpdateData.createdAt) {
      finalUpdateData.created_at = finalUpdateData.createdAt;
      delete finalUpdateData.createdAt;
    }
    if (finalUpdateData.updatedAt) {
      finalUpdateData.updated_at = finalUpdateData.updatedAt;
      delete finalUpdateData.updatedAt;
    }
    if (finalUpdateData.publishedAt) {
      finalUpdateData.published_at = finalUpdateData.publishedAt;
      delete finalUpdateData.publishedAt;
    }
    if (finalUpdateData.expiresAt) {
      finalUpdateData.expires_at = finalUpdateData.expiresAt;
      delete finalUpdateData.expiresAt;
    }
    
    console.log('Campos após conversão:', Object.keys(finalUpdateData));

    // Se categoria foi alterada, buscar category_id
    if (category && category !== existingAd.category) {
      console.log('Categoria alterada, buscando category_id para:', category);
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .or(`slug.eq.${category},name.ilike.%${category}%`)
        .limit(1)
        .single();

      if (categoryError || !categoryData) {
        console.error('Categoria não encontrada:', category, categoryError);
        return NextResponse.json(
          { error: `Categoria '${category}' não encontrada` },
          { status: 400 }
        );
      }

      finalUpdateData.category_id = categoryData.id;
      finalUpdateData.category = category;
    }

    // Se cidade foi alterada, buscar city_id
    if (city && city !== existingAd.city) {
      console.log('Cidade alterada, buscando city_id para:', city);
      
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('id, name')
        .ilike('name', `%${city}%`)
        .limit(1)
        .single();

      if (cityError || !cityData) {
        console.error('Cidade não encontrada:', city, cityError);
        return NextResponse.json(
          { error: `Cidade '${city}' não encontrada` },
          { status: 400 }
        );
      }

      finalUpdateData.city_id = cityData.id;
      finalUpdateData.city = city;
    }

    // Remover campos que não devem ser atualizados
    delete finalUpdateData.adId;
    delete finalUpdateData.userId;

    console.log('Dados finais para atualização:', {
      id: adId,
      userId: userId,
      fieldsToUpdate: Object.keys(finalUpdateData),
      updateData: finalUpdateData
    });

    const { data: updatedAd, error } = await supabase
      .from('ads')
      .update(finalUpdateData)
      .eq('id', adId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro do Supabase ao atualizar anúncio:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar anúncio: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Anúncio atualizado com sucesso:', updatedAd?.id);
    console.log('=== FIM UPDATE ANÚNCIO ===');

    return NextResponse.json({
      success: true,
      message: 'Anúncio atualizado com sucesso',
      ad: updatedAd
    });

  } catch (error) {
    console.error('Erro interno na rota PUT:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir anúncio
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('adId');
    const userId = searchParams.get('userId');

    if (!adId || !userId) {
      return NextResponse.json(
        { error: 'ID do anúncio e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verificar se o usuário é dono do anúncio
    const { data: existingAd } = await supabase
      .from('ads')
      .select('user_id')
      .eq('id', adId)
      .single();

    if (!existingAd || existingAd.user_id !== userId) {
      return NextResponse.json(
        { error: 'Anúncio não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir anúncio:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir anúncio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Anúncio excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 