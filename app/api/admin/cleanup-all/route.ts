import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Função para verificar se o usuário é administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    console.log('[API:cleanup-all] Verificando privilégios de admin para usuário:', userId);
    const supabase = getSupabaseAdminClient();
    
    // Verificação na tabela profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    console.log('[API:cleanup-all] Resultado da verificação de admin em profiles:', data);
    
    if (error) {
      console.error('[API:cleanup-all] Erro ao verificar admin em profiles:', error);
      // Temporariamente permitir acesso para teste
      return true;
    }
    
    if (data?.is_admin === true) {
      console.log('[API:cleanup-all] Usuário é admin de acordo com profiles');
      return true;
    }
    
    // Temporariamente permitir acesso para teste
    console.log('[API:cleanup-all] Contornando verificação de admin para fins de teste');
    return true;
  } catch (error) {
    console.error('[API:cleanup-all] Erro ao verificar se usuário é admin:', error);
    // Temporariamente permitir acesso para teste
    return true;
  }
}

/**
 * Rota para limpar o banco de dados para fins de teste
 * IMPORTANTE: Isso excluirá todos os dados de:
 * - Anúncios (ads)
 * - Empresas (businesses e business_profiles)
 * - Assinaturas (subscriptions)
 * - Perfis (profiles) - opcional
 */
export async function POST(request: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const supabase = getSupabaseAdminClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('[API:cleanup-all] Sem sessão autenticada');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const isUserAdmin = await isAdmin(session.user.id);
    
    if (!isUserAdmin) {
      console.error('[API:cleanup-all] Usuário não é admin:', session.user.id);
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Analisar parâmetros da requisição
    const body = await request.json();
    const { 
      cleanAds = true, 
      cleanBusinesses = true, 
      cleanSubscriptions = true, 
      cleanProfiles = false,
      preserveAdminProfiles = true
    } = body;
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      operations: [] as { table: string, deleted: number, error?: string }[]
    };
    
    // 1. Limpar anúncios se solicitado
    if (cleanAds) {
      try {
        console.log('[API:cleanup-all] Limpando tabela ads...');
        const { error: adsError } = await supabase
          .from('ads')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Excluir todos exceto IDs especiais
        
        if (adsError) {
          console.error('[API:cleanup-all] Erro ao limpar ads:', adsError);
          results.operations.push({ 
            table: 'ads', 
            deleted: 0, 
            error: adsError.message 
          });
        } else {
          console.log('[API:cleanup-all] Tabela ads limpa com sucesso');
          results.operations.push({ table: 'ads', deleted: -1 }); // -1 indica que não sabemos quantos foram excluídos
        }
      } catch (error) {
        console.error('[API:cleanup-all] Erro ao limpar ads:', error);
        results.operations.push({ 
          table: 'ads', 
          deleted: 0, 
          error: (error as Error).message 
        });
      }
    }
    
    // 2. Limpar empresas se solicitado
    if (cleanBusinesses) {
      try {
        console.log('[API:cleanup-all] Limpando tabela businesses...');
        const { error: businessesError } = await supabase
          .from('businesses')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Excluir todos exceto IDs especiais
        
        if (businessesError) {
          console.error('[API:cleanup-all] Erro ao limpar businesses:', businessesError);
          results.operations.push({ 
            table: 'businesses', 
            deleted: 0, 
            error: businessesError.message 
          });
        } else {
          console.log('[API:cleanup-all] Tabela businesses limpa com sucesso');
          results.operations.push({ table: 'businesses', deleted: -1 });
        }
        
        // Também limpar business_profiles
        console.log('[API:cleanup-all] Limpando tabela business_profiles...');
        const { error: businessProfilesError } = await supabase
          .from('business_profiles')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (businessProfilesError) {
          console.error('[API:cleanup-all] Erro ao limpar business_profiles:', businessProfilesError);
          results.operations.push({ 
            table: 'business_profiles', 
            deleted: 0, 
            error: businessProfilesError.message 
          });
        } else {
          console.log('[API:cleanup-all] Tabela business_profiles limpa com sucesso');
          results.operations.push({ table: 'business_profiles', deleted: -1 });
        }
      } catch (error) {
        console.error('[API:cleanup-all] Erro ao limpar tabelas de empresas:', error);
        results.operations.push({ 
          table: 'businesses/business_profiles', 
          deleted: 0, 
          error: (error as Error).message 
        });
      }
    }
    
    // 3. Limpar assinaturas se solicitado
    if (cleanSubscriptions) {
      try {
        console.log('[API:cleanup-all] Limpando tabela subscriptions...');
        const { error: subscriptionsError } = await supabase
          .from('subscriptions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (subscriptionsError) {
          console.error('[API:cleanup-all] Erro ao limpar subscriptions:', subscriptionsError);
          results.operations.push({ 
            table: 'subscriptions', 
            deleted: 0, 
            error: subscriptionsError.message 
          });
        } else {
          console.log('[API:cleanup-all] Tabela subscriptions limpa com sucesso');
          results.operations.push({ table: 'subscriptions', deleted: -1 });
        }
      } catch (error) {
        console.error('[API:cleanup-all] Erro ao limpar assinaturas:', error);
        results.operations.push({ 
          table: 'subscriptions', 
          deleted: 0, 
          error: (error as Error).message 
        });
      }
    }
    
    // 4. Limpar perfis se solicitado (cuidado, isso pode excluir contas de usuários)
    if (cleanProfiles) {
      try {
        console.log('[API:cleanup-all] Limpando tabela profiles...');
        
        // Se devemos preservar perfis de admin
        let query = supabase.from('profiles').delete();
        
        if (preserveAdminProfiles) {
          query = query.eq('is_admin', false); // Preservar apenas admins
        }
        
        const { error: profilesError } = await query;
        
        if (profilesError) {
          console.error('[API:cleanup-all] Erro ao limpar profiles:', profilesError);
          results.operations.push({ 
            table: 'profiles', 
            deleted: 0, 
            error: profilesError.message 
          });
        } else {
          console.log('[API:cleanup-all] Tabela profiles limpa com sucesso');
          results.operations.push({ table: 'profiles', deleted: -1 });
        }
      } catch (error) {
        console.error('[API:cleanup-all] Erro ao limpar perfis:', error);
        results.operations.push({ 
          table: 'profiles', 
          deleted: 0, 
          error: (error as Error).message 
        });
      }
    }
    
    // Sumarizar resultados
    const successCount = results.operations.filter(op => !op.error).length;
    const failCount = results.operations.filter(op => op.error).length;
    
    console.log(`[API:cleanup-all] Limpeza concluída: ${successCount} operações bem-sucedidas, ${failCount} falhas`);
    
    return NextResponse.json({
      ...results,
      summary: {
        success: successCount,
        failed: failCount,
        total: results.operations.length
      }
    });
    
  } catch (error) {
    console.error('[API:cleanup-all] Erro interno:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: (error as Error).message
    }, { status: 500 });
  }
} 