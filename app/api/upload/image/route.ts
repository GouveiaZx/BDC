import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper para extrair token do usuário
function extractUserFromRequest(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth_token');
    const authHeader = request.headers.get('authorization');
    
    let token = '';
    if (authCookie) {
      token = authCookie.value;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) return null;
    
    // Usar Buffer para decodificar corretamente (compatível com authUtils.ts)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar se token não expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Erro ao extrair token:', error);
    return null;
  }
}

// Helper para validar tipo de arquivo
function isValidImageType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  return allowedTypes.includes(mimeType.toLowerCase());
}

// Helper para gerar nome único do arquivo
function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}/${timestamp}_${random}.${extension}`;
}

// POST - Upload de imagem
export async function POST(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    // Verificar content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    // Extrair dados do form
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'ads-images';
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validações
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF' 
        },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Arquivo muito grande. Tamanho máximo: 5MB' 
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(file.name, userToken.userId);
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload Supabase:', uploadError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao fazer upload da imagem' 
        },
        { status: 500 }
      );
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Registrar upload no banco (opcional - para tracking)
    const uploadRecord = {
      user_id: userToken.userId,
      file_name: file.name,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      bucket: bucket,
      upload_type: 'image',
      metadata: {
        folder: folder,
        original_name: file.name,
        uploaded_at: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Imagem enviada com sucesso',
      data: {
        id: uploadData.id,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        bucket: bucket,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar imagem
export async function DELETE(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'ads-images';

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o arquivo pertence ao usuário
    if (!filePath.includes(userToken.userId)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a deletar este arquivo' },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Deletar arquivo do Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (deleteError) {
      console.error('Erro ao deletar arquivo:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar arquivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
      deleted_path: filePath
    });

  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar imagens do usuário
export async function GET(request: NextRequest) {
  try {
    const userToken = extractUserFromRequest(request);
    
    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'ads-images';
    const folder = searchParams.get('folder') || 'general';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Listar arquivos do usuário
    const userFolder = `${folder}/${userToken.userId}`;
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(userFolder, {
        limit: 100,
        offset: 0
      });

    if (listError) {
      console.error('Erro ao listar arquivos:', listError);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar arquivos' },
        { status: 500 }
      );
    }

    // Processar lista de arquivos
    const processedFiles = files?.map(file => {
      const filePath = `${userFolder}/${file.name}`;
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        path: filePath,
        url: publicUrlData.publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      files: processedFiles,
      total: processedFiles.length,
      bucket: bucket,
      folder: userFolder
    });

  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 