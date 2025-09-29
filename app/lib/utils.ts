/**
 * Utilitários para o app
 */

import { getSupabaseClient, getSupabaseAdminClient } from './supabase';
import { v5 as uuidv5 } from 'uuid';

// Namespace personalizado para gerar UUIDs determinísticos
const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

/**
 * Gera um UUID v4 compatível com o Supabase
 * @returns UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Converte um ID temporário ou string qualquer em um UUID válido v5
 * Esta função garante que a mesma entrada sempre gere o mesmo UUID
 */
export function convertTempIdToUUID(tempId: string): string {
  try {
    // Se já for um UUID válido, retorna como está
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(tempId)) {
      return tempId;
  }
  
    // Limpar qualquer prefixo como 'temp-id-'
    const cleanId = tempId.replace(/^temp-id-/, '');
    
    // Gerar UUID v5 determinístico baseado no ID limpo
    return uuidv5(cleanId, UUID_NAMESPACE);
  } catch (error) {
    console.error('Erro ao converter ID temporário:', error);
    
    // Fallback para garantir que sempre retorne um UUID válido
    // Usando um hash simples para gerar um valor determinístico
    let hash = 0;
    const str = tempId || 'fallback';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para um inteiro de 32 bits
  }
  
    // Formatar em um formato parecido com UUID
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    return `00000000-0000-5000-a000-${hashStr}000000`.substring(0, 36);
  }
}

/**
 * Formata um preço para exibição
 * @param price - Preço a ser formatado
 * @returns String formatada
 */
export function formatPrice(price: number | string): string {
  // Garantir que temos um número para processar
  let numericPrice: number;
  
  if (typeof price === 'string') {
    // Remover qualquer caractere não numérico exceto vírgula e ponto
    const cleanPrice = price.replace(/[^\d,.]/g, '');
    // Substituir vírgula por ponto para conversão
    const normalizedPrice = cleanPrice.replace(',', '.');
    numericPrice = parseFloat(normalizedPrice);
    
    // Se não for possível converter, retorna valor formatado zero
    if (isNaN(numericPrice)) {
      return 'R$ 0,00';
    }
  } else {
    numericPrice = price;
  }
  
  // Formatar usando o locale pt-BR para garantir formato correto
  return numericPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Limita um texto a um determinado número de caracteres
 * @param text - Texto a ser limitado
 * @param maxLength - Comprimento máximo
 * @returns Texto limitado com "..." se necessário
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formata uma data para exibição
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formatar data relativa
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export function formatRelativeDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - inputDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays === 1) {
    return 'Ontem';
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} atrás`;
  } else {
    return inputDate.toLocaleDateString('pt-BR');
  }
}

/**
 * Formatar número de visualizações
 * @param views - Número de visualizações
 * @returns String formatada
 */
export function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

/**
 * Limpa uma URL de imagem, removendo aspas extras e caracteres problemáticos.
 * @param url - A URL da imagem a ser limpa.
 * @returns A URL limpa ou uma string vazia se a entrada for nula/inválida.
 */
export function cleanImageUrl(url: string | null | undefined): string {
  if (!url) {
    return ''; // Retornar string vazia para URLs nulas ou indefinidas
  }

  let cleanedUrl = String(url); // Garantir que é uma string

  try {
    // 1. Remover espaços em branco no início e no fim
    cleanedUrl = cleanedUrl.trim();

    // 2. Remover aspas duplas no início e no fim, repetidamente
    //    Isso lida com casos como ""url"", ""url"", "url"
    while (cleanedUrl.startsWith('"') && cleanedUrl.endsWith('"')) {
      cleanedUrl = cleanedUrl.substring(1, cleanedUrl.length - 1);
      // Após remover um par de aspas, é bom dar trim de novo caso haja espaços entre aspas, ex: " "url" "
      cleanedUrl = cleanedUrl.trim(); 
    }

    // 3. Remover qualquer aspas dupla restante (problemas como "https://url...") 
    cleanedUrl = cleanedUrl.replace(/\"/g, '');
    
    // 4. Remover sequências de caracteres de escape (\")
    cleanedUrl = cleanedUrl.replace(/\\"/g, '');
    
    // 5. Remover aspas simples desnecessárias
    cleanedUrl = cleanedUrl.replace(/^'|'$/g, '');

    // 6. Verificar se é uma URL válida para o next/image
    // Se não começar com https:// ou http:// ou / (imagem local), podemos ter um problema
    if (!cleanedUrl.startsWith('https://') && 
        !cleanedUrl.startsWith('http://') && 
        !cleanedUrl.startsWith('/')) {
      console.warn('URL potencialmente inválida após limpeza:', cleanedUrl);
      // Para o next/image, precisamos ter uma URL absoluta ou caminho relativo começando com /
      return '';
    }
  } catch (error) {
    console.error('Erro ao processar URL de imagem:', error);
    return '';
  }

  return cleanedUrl;
}

/**
 * Faz upload de uma imagem para o storage do Supabase
 * @param file Arquivo a ser enviado
 * @param bucket Nome do bucket no storage
 * @param path Caminho onde a imagem será armazenada
 * @param userId ID do usuário para permissões
 * @returns URL pública da imagem ou null em caso de erro
 */
export const uploadImageToSupabase = async (
  file: File | string,
  bucket: string = 'images',
  path: string = '',
  userId: string = 'anonymous'
): Promise<string | null> => {
  try {
    // Usar o cliente admin para contornar as restrições de RLS
    const { supabaseAdmin } = await import('./supabase');
    
    // Se a entrada já for uma URL do Supabase, retornar diretamente
    if (typeof file === 'string' && (file.startsWith('https://') || file.startsWith('http://'))) {
      return file;
    }
    
    // Se for uma string base64, converter para blob
    let fileToUpload: File;
    
    if (typeof file === 'string') {
      try {
        console.log('Processando string para upload:', file.substring(0, 50) + '...');
        
        // Verificar se é um URL de objeto (blob:)
        if (file.startsWith('blob:')) {
          console.log('Detectado URL de objeto blob, fazendo fetch...');
          const response = await fetch(file);
          const blob = await response.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          fileToUpload = new File([blob], `${userId}-${Date.now()}.${ext}`, { type: blob.type });
          console.log('Blob convertido para File:', fileToUpload.name, fileToUpload.type, fileToUpload.size);
        } 
        // Verificar se é base64
        else if (file.startsWith('data:')) {
          console.log('Detectado string base64, convertendo...');
          const response = await fetch(file);
          const blob = await response.blob();
          const ext = file.includes('image/png') ? 'png' : 'jpg';
          fileToUpload = new File([blob], `${userId}-${Date.now()}.${ext}`, { type: blob.type });
          console.log('Base64 convertido para File:', fileToUpload.name, fileToUpload.type, fileToUpload.size);
        } 
        // Formato de string desconhecido
        else {
          console.error('Formato de string desconhecido:', file.substring(0, 20) + '...');
          return null;
        }
      } catch (conversionError) {
        console.error('Erro ao converter string para arquivo:', conversionError);
        return null;
      }
    } else if (file instanceof File) {
      console.log('Recebido objeto File diretamente:', file.name, file.type, file.size);
      fileToUpload = file;
    } else {
      console.error('Formato de arquivo inválido:', typeof file);
      return null;
    }
    
    // Usar um bucketName fixo
    const bucketName = 'public';
    
    // Fazer upload diretamente sem verificar existência do bucket
    try {
      console.log(`Tentando upload direto para bucket: ${bucketName}...`);
      
      // Fazer upload do arquivo usando o cliente ADMIN
      const filePath = path 
        ? `${path}/${fileToUpload.name}` 
        : fileToUpload.name;
        
      console.log(`Tentando upload para bucket: ${bucketName}, path: ${filePath}`);
      
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, fileToUpload, {
          upsert: true,
          cacheControl: '3600'
        });
        
      if (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        return null;
      }
      
      // Gerar URL pública
      const { data: publicURL } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(data.path);
        
      console.log('Upload de imagem concluído com sucesso!', publicURL.publicUrl);
      return publicURL.publicUrl;
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      return null;
    }
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return null;
  }
};

/**
 * Comprime uma imagem para reduzir seu tamanho
 * @param dataUrl URL de dados da imagem (base64)
 * @param maxWidth Largura máxima desejada
 * @param maxHeight Altura máxima desejada
 * @param quality Qualidade da imagem (0-1)
 * @returns URL de dados da imagem comprimida
 */
export const compressImage = (
  dataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        // Calcular as dimensões para manter a proporção
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        // Criar um canvas para desenhar a imagem redimensionada
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto do canvas'));
          return;
        }
        
        // Desenhar a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para data URL com a qualidade especificada
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem para compressão'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Incrementar visualizações de anúncios usando a função otimizada do SQL
export async function incrementAdViews(adId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    
    // Chamar a função SQL otimizada que criamos no banco de dados
    const { data, error } = await supabase.rpc('increment_ad_views', {
      ad_id: adId
    });
    
    if (error) {
      console.error('Erro ao incrementar visualizações:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Erro ao processar incremento de views:', error);
    return 0;
  }
}

// Buscar anúncios com a função otimizada
export async function searchAds({
  searchTerm = '',
  category = null,
  location = null,
  status = 'active',
  limit = 20,
  offset = 0
}: {
  searchTerm?: string,
  category?: string | null,
  location?: string | null,
  status?: string,
  limit?: number,
  offset?: number
}) {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada
    const { data, error } = await supabase.rpc('search_advertisements', {
      search_term: searchTerm,
      category_filter: category,
      location_filter: location,
      status_filter: status,
      limit_val: limit,
      offset_val: offset
    });
    
    if (error) {
      console.error('Erro na busca de anúncios:', error);
      return { ads: [], error };
    }
    
    return { ads: data || [], error: null };
  } catch (error) {
    console.error('Erro ao processar busca:', error);
    return { ads: [], error };
  }
}

// Obter destaques ativos usando a função otimizada
export async function getActiveHighlights() {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada para obter destaques ativos
    const { data, error } = await supabase.rpc('get_active_destaques');
    
    if (error) {
      console.error('Erro ao buscar destaques ativos:', error);
      return { highlights: [], error };
    }
    
    // Converter para o formato esperado pelo componente
    const formattedHighlights = data.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description || '',
      imageUrl: d.media_url,
      mediaUrl: d.media_url,
      mediaType: d.media_type,
      userId: d.user_id,
      userName: d.user_name || 'Usuário',
      userAvatar: d.user_avatar || '/images/avatar-placeholder.png',
      isAdmin: false, // Será definido abaixo
      createdAt: d.created_at,
      expiresAt: d.expires_at
    }));
    
    return { highlights: formattedHighlights, error: null };
  } catch (error) {
    console.error('Erro ao processar busca de destaques:', error);
    return { highlights: [], error };
  }
}

// Verificar disponibilidade de destaques para um usuário
export async function checkHighlightAvailability(userId: string) {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada para verificar disponibilidade
    const { data, error } = await supabase.rpc('check_highlight_availability', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Erro ao verificar disponibilidade de destaques:', error);
      return { 
        canCreateHighlight: false, 
        dailyHighlightsAvailable: 0,
        highlightsUsedToday: 0,
        isPremiumUser: false,
        subscriptionPlan: null,
        error 
      };
    }
    
    return { 
      canCreateHighlight: data.can_create_highlight,
      dailyHighlightsAvailable: data.daily_highlights_available,
      highlightsUsedToday: data.highlights_used_today,
      isPremiumUser: data.is_premium_user,
      subscriptionPlan: data.subscription_plan,
      error: null 
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de destaques:', error);
    return { 
      canCreateHighlight: false, 
      dailyHighlightsAvailable: 0,
      highlightsUsedToday: 0,
      isPremiumUser: false,
      subscriptionPlan: null,
      error 
    };
  }
}

// Verificar disponibilidade de anúncios gratuitos
export async function checkFreeAdAvailability(userId: string) {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada para verificar disponibilidade
    const { data, error } = await supabase.rpc('check_free_ad_availability', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Erro ao verificar disponibilidade de anúncios gratuitos:', error);
      return { 
        canCreateFreeAd: false, 
        activeFreeAds: 0,
        nextAvailableDate: null,
        error 
      };
    }
    
    return { 
      canCreateFreeAd: data.can_create_free_ad,
      activeFreeAds: data.active_free_ads,
      nextAvailableDate: data.next_available_date,
      error: null 
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de anúncios gratuitos:', error);
    return { 
      canCreateFreeAd: false, 
      activeFreeAds: 0,
      nextAvailableDate: null,
      error 
    };
  }
}

// Obter estatísticas do usuário
export async function getUserStats(userId: string) {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada para obter estatísticas
    const { data, error } = await supabase.rpc('get_user_ads_stats', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      return { 
        totalAds: 0,
        activeAds: 0,
        expiredAds: 0,
        totalViews: 0,
        avgViewsPerAd: 0,
        error 
      };
    }
    
    return { 
      totalAds: data.total_ads,
      activeAds: data.active_ads,
      expiredAds: data.expired_ads,
      totalViews: data.total_views,
      avgViewsPerAd: data.avg_views_per_ad,
      error: null 
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do usuário:', error);
    return { 
      totalAds: 0,
      activeAds: 0,
      expiredAds: 0,
      totalViews: 0,
      avgViewsPerAd: 0,
      error 
    };
  }
}

// Obter visualizações diárias de anúncios
export async function getDailyAdViews(days: number = 30, userId?: string): Promise<{ dailyViews: any[], error: any }> {
  try {
    const supabase = getSupabaseClient();
    
    // Obter token de autenticação
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;
    
    // Tentar primeiro com API REST para evitar problemas de permissão
    if (accessToken) {
      try {
        console.log('Tentando buscar visualizações diárias via API REST');
        
        // Configurar cabeçalhos com token de autenticação
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        };
        
        // Incluir user ID no cabeçalho para debug
        if (userId) {
          headers['x-user-id'] = userId;
        }
        
        // Criar objeto para o corpo da requisição com os parâmetros
        const requestBody = {
          days_back: days,
          user_id_param: userId || null
        };
        
        console.log('Enviando requisição RPC para get_daily_ad_views com parâmetros:', requestBody);
        
        // Usar o endpoint RPC para chamar a função SQL
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_daily_ad_views`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dados obtidos com sucesso via API REST:', data.length, 'registros');
          return { dailyViews: data || [], error: null };
        }
        
        // Se falhar, registrar o erro para depuração
        const errorText = await response.text();
        console.warn('Falha ao buscar visualizações diárias via API REST:', response.status, errorText);
      } catch (restError) {
        console.error('Erro ao buscar visualizações diárias via API REST:', restError);
      }
    }
    
    // Se o método REST falhar, tentar via SDK do Supabase
    console.log('Tentando buscar visualizações diárias via SDK Supabase');
    
    // Usar a função SQL otimizada para obter visualizações diárias
    const { data, error } = await supabase.rpc('get_daily_ad_views', {
      days_back: days,
      user_id_param: userId || null
    });
    
    if (error) {
      console.error('Erro ao obter visualizações diárias via SDK:', error);
      
      // Se a função RPC falhar, tentar queries SQL diretas como último recurso
      try {
        console.log('Tentando obter visualizações com consulta SQL direta...');
        
        // Determinar a data de início (N dias atrás)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Consultar visualizações de anúncios agregadas por dia
        const queryParams: any = {
          select: 'date_trunc(\'day\', created_at) as view_date, count(*)',
          created_at: `gte.${startDateStr}`,
        };
        
        // Adicionar filtro de usuário se fornecido
        if (userId) {
          queryParams.user_id = `eq.${userId}`;
        }
        
        // Executar a consulta
        const { data: queryData, error: queryError } = await supabase
          .from('ad_views_log')
          .select(queryParams.select)
          .gte('created_at', startDateStr)
          .order('view_date', { ascending: true });
          
        if (queryError) {
          console.error('Erro ao consultar visualizações diretamente:', queryError);
          
          // Retornar dados vazios em vez de dados fictícios
          console.log('Retornando dados vazios para visualizações diárias');
          return { dailyViews: [], error: queryError };
          
          return { dailyViews: [], error: queryError };
        }
        
        return { dailyViews: queryData || [], error: null };
      } catch (directQueryError) {
        console.error('Erro ao consultar visualizações diretamente:', directQueryError);
        
        // Retornar dados vazios em vez de dados fictícios
        console.log('Retornando dados vazios para visualizações diárias');
        return { dailyViews: [], error: directQueryError };
        
        return { dailyViews: [], error: directQueryError };
      }
    }
    
    return { dailyViews: data || [], error: null };
  } catch (error) {
    console.error('Erro ao obter visualizações diárias:', error);
    
    // Retornar dados vazios em vez de dados fictícios
    console.log('Retornando dados vazios para visualizações diárias após erro geral');
    return { dailyViews: [], error };
    
    return { dailyViews: [], error };
  }
}

// Renovar anúncio
export async function renewAdvertisement(adId: string, daysToExtend: number = 30) {
  try {
    const supabase = getSupabaseClient();
    
    // Usar a função SQL otimizada para renovar anúncio
    const { data, error } = await supabase.rpc('renew_advertisement', {
      ad_id_param: adId,
      days_to_extend: daysToExtend
    });
    
    if (error) {
      console.error('Erro ao renovar anúncio:', error);
      return { success: false, error };
    }
    
    return { success: !!data, error: null };
  } catch (error) {
    console.error('Erro ao renovar anúncio:', error);
    return { success: false, error };
  }
} 