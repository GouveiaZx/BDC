import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Nova sintaxe de configuração de rota
export const maxDuration = 60; // 60 segundos

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação se necessário
    // Para este exemplo, vamos presumir que já está autenticado
    
    // Receber o formulário com o arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const userId = formData.get('userId') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    if (!type || !['foto', 'video', 'image'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de mídia inválido. Deve ser "foto", "image" ou "video"' },
        { status: 400 }
      );
    }
    
    // Verificar se é um usuário válido
    const ADMIN_ID = '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18';
    const isAdmin = userId === ADMIN_ID;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 }
      );
    }
    
    // Adicionar log para debug
    console.log('Upload para usuário:', { 
      userId, 
      isAdmin,
      tipo: type,
      tamanho: `${(file.size / 1024 / 1024).toFixed(2)}MB` 
    });
    
    // Validar tamanho do arquivo (máximo 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo é muito grande. Tamanho máximo: 20MB' },
        { status: 400 }
      );
    }
    
    // Validar tipo de arquivo
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    
    // Tratar 'image' como 'foto' para compatibilidade
    const isImage = type === 'foto' || type === 'image';
    
    if (isImage && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP' },
        { status: 400 }
      );
    }
    
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de vídeo inválido. Use MP4, MOV, AVI ou WebM' },
        { status: 400 }
      );
    }
    
    // Gerar nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}-${Date.now()}.${fileExt}`;
    
    // Definir pasta de destino (tratar 'image' como 'foto')
    const folderPath = isImage ? 'destaques/images' : 'destaques/videos';
    const filePath = `${folderPath}/${fileName}`;
    
    // Converter o arquivo para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Obter cliente Supabase Admin
    const supabase = getSupabaseAdminClient();
    
    // Verificar e criar bucket se necessário
    try {
      // Verifica se o bucket 'public' existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Erro ao listar buckets:', listError);
        throw new Error('Erro ao verificar buckets de armazenamento');
      }
      
      // Verificar se bucket public existe (criado via migração SQL)
      if (!buckets.some(b => b.name === 'public')) {
        console.log('Bucket public não encontrado - deve ter sido criado via migração SQL');
      }
    } catch (bucketError) {
      console.error('Erro ao configurar bucket:', bucketError);
      return NextResponse.json(
        { error: 'Erro ao configurar armazenamento' },
        { status: 500 }
      );
    }
    
    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('public') // Usar o bucket 'public' em vez de 'media'
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });
    
    if (error) {
      console.error('Erro no upload para o Supabase Storage:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo. Por favor, tente novamente.', details: error.message },
        { status: 500 }
      );
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);
    
    // Retornar sucesso com a URL do arquivo
    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      url: publicUrl,
      path: filePath,
      type: file.type,
      size: file.size
    });
  } catch (error: any) {
    console.error('Erro ao processar upload de mídia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 