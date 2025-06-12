import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { convertTempIdToUUID } from '../../lib/utils';

/**
 * Rota para limpar e resetar dados de perfil
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    let body: any = {};
    
    try {
      body = await req.json();
    } catch (e) {
      console.error('Erro ao processar corpo da requisição:', e);
    }
    
    // Obter userId do corpo, cookies ou query params
    let userId = 
      body.userId || 
      req.cookies.get('userId')?.value || 
      req.nextUrl.searchParams.get('userId');
      
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 }
      );
    }
    
    // Normalizar userId para formato UUID válido
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      const originalId = userId;
      userId = convertTempIdToUUID(userId);
      console.log(`ID normalizado: ${originalId} -> ${userId}`);
    }
    
    const response: Record<string, any> = {
      userId,
      operations: [],
      success: true
    };
    
    // 1. Excluir registros da tabela profiles
    try {
      const { error: deleteProfileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      response.operations.push({
        operation: 'delete_profile',
        success: !deleteProfileError,
        message: deleteProfileError ? `Erro: ${deleteProfileError.message}` : 'Perfil excluído com sucesso'
      });
      
      if (deleteProfileError) {
        response.success = false;
      }
    } catch (e) {
      response.operations.push({
        operation: 'delete_profile',
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      });
      response.success = false;
    }
    
    // 2. Excluir registros da tabela business_profiles
    try {
      const { error: deleteBusinessError } = await supabaseAdmin
        .from('business_profiles')
        .delete()
        .eq('user_id', userId);
        
      response.operations.push({
        operation: 'delete_business_profile',
        success: !deleteBusinessError,
        message: deleteBusinessError 
          ? `Erro: ${deleteBusinessError.message}` 
          : 'Perfil de negócio excluído com sucesso'
      });
      
      if (deleteBusinessError) {
        response.success = false;
      }
    } catch (e) {
      response.operations.push({
        operation: 'delete_business_profile',
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      });
      response.success = false;
    }
    
    // 3. Limpar armazenamento relacionado
    try {
      const folderPath = `${userId}/`;
      
      // Verificar se o bucket public existe
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      
      if (bucketsError) {
        response.operations.push({
          operation: 'check_storage',
          success: false,
          message: `Erro ao verificar buckets: ${bucketsError.message}`
        });
      } else if (!buckets.some(b => b.name === 'public')) {
        response.operations.push({
          operation: 'check_storage',
          success: false,
          message: 'Bucket public não encontrado'
        });
      } else {
        // Listar arquivos no bucket public
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from('public')
          .list(folderPath);
          
        if (listError) {
          response.operations.push({
            operation: 'list_files',
            success: false,
            message: `Erro ao listar arquivos: ${listError.message}`
          });
        } else if (files && files.length > 0) {
          // Remover arquivos um por um
          const filePaths = files.map(file => `${folderPath}${file.name}`);
          
          const { error: removeError } = await supabaseAdmin.storage
            .from('public')
            .remove(filePaths);
            
          response.operations.push({
            operation: 'delete_files',
            success: !removeError,
            message: removeError 
              ? `Erro ao excluir arquivos: ${removeError.message}` 
              : `${filePaths.length} arquivos excluídos com sucesso`
          });
        } else {
          response.operations.push({
            operation: 'list_files',
            success: true,
            message: 'Nenhum arquivo encontrado para excluir'
          });
        }
      }
    } catch (e) {
      response.operations.push({
        operation: 'delete_files',
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      });
    }
    
    // 4. Criar perfil vazio
    try {
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          name: '',
          email: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      response.operations.push({
        operation: 'create_empty_profile',
        success: !createProfileError,
        message: createProfileError 
          ? `Erro ao criar perfil vazio: ${createProfileError.message}` 
          : 'Perfil vazio criado com sucesso'
      });
    } catch (e) {
      response.operations.push({
        operation: 'create_empty_profile',
        success: false,
        message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
      });
    }
    
    // 5. Limpar cookies relacionados
    if (body.clearCookies) {
      try {
        const cookieStore = cookies();
        const cookiesToClear = [
          'sb-access-token', 
          'hasUserAvatar', 
          'userAvatarTimestamp',
          'userAvatarPreview',
          'hasUserBanner',
          'userBannerTimestamp',
          'userBannerPreview'
        ];
        
        for (const cookieName of cookiesToClear) {
          cookieStore.delete(cookieName);
        }
        
        response.operations.push({
          operation: 'clear_cookies',
          success: true,
          message: 'Cookies limpos com sucesso'
        });
      } catch (e) {
        response.operations.push({
          operation: 'clear_cookies',
          success: false,
          message: `Exceção: ${e instanceof Error ? e.message : String(e)}`
        });
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao resetar perfil:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno ao resetar perfil', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 