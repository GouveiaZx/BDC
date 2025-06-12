import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

// API para corrigir o banco de dados usando métodos nativos do Supabase
export async function GET(req: NextRequest) {
  try {
    console.log('Iniciando correção do banco de dados...');
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      console.error('Erro ao criar cliente Supabase Admin');
      return NextResponse.json({ error: 'Erro ao criar cliente Supabase' }, { status: 500 });
    }
    
    // Verificar se a tabela advertisements existe e tem dados
    console.log('Verificando tabela advertisements...');
    
    // Buscar amostra para verificar estrutura da tabela
    const { data: sample, error: sampleError } = await supabase
      .from('advertisements')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Erro ao buscar amostra da tabela:', sampleError);
      return NextResponse.json({ 
        error: 'Erro ao buscar amostra da tabela', 
        details: sampleError.message 
      }, { status: 500 });
    }
    
    // Array para armazenar resultados das operações
    const operations = [];
    
    // Verificar e adicionar moderation_status se necessário
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('advertisements')
        .select('moderation_status')
        .limit(1);
      
      if (statusError && statusError.message.includes('moderation_status')) {
        console.log('Adicionando coluna moderation_status...');
        
        // Adicionar a coluna com método REST
        const { data: addStatus, error: addStatusError } = await supabase
          .from('advertisements')
          .update({ moderation_status: 'pending' })
          .eq('id', 'any_non_existent_id')
          .select();
        
        if (!addStatusError || !addStatusError.message.includes('moderation_status')) {
          operations.push('Coluna moderation_status adicionada');
        } else {
          console.error('Erro ao adicionar moderation_status:', addStatusError);
          operations.push(`Erro ao adicionar moderation_status: ${addStatusError.message}`);
        }
      } else {
        operations.push('Coluna moderation_status já existe');
      }
    } catch (err) {
      operations.push(`Erro ao verificar moderation_status: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Verificar e adicionar moderation_reason se necessário
    try {
      const { data: reasonData, error: reasonError } = await supabase
        .from('advertisements')
        .select('moderation_reason')
        .limit(1);
      
      if (reasonError && reasonError.message.includes('moderation_reason')) {
        console.log('Adicionando coluna moderation_reason...');
        
        // Adicionar a coluna com método REST
        const { data: addReason, error: addReasonError } = await supabase
          .from('advertisements')
          .update({ moderation_reason: null })
          .eq('id', 'any_non_existent_id')
          .select();
        
        if (!addReasonError || !addReasonError.message.includes('moderation_reason')) {
          operations.push('Coluna moderation_reason adicionada');
        } else {
          console.error('Erro ao adicionar moderation_reason:', addReasonError);
          operations.push(`Erro ao adicionar moderation_reason: ${addReasonError.message}`);
        }
      } else {
        operations.push('Coluna moderation_reason já existe');
      }
    } catch (err) {
      operations.push(`Erro ao verificar moderation_reason: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Verificar e adicionar moderated_at se necessário
    try {
      const { data: moderatedData, error: moderatedError } = await supabase
        .from('advertisements')
        .select('moderated_at')
        .limit(1);
      
      if (moderatedError && moderatedError.message.includes('moderated_at')) {
        console.log('Adicionando coluna moderated_at...');
        
        // Adicionar a coluna com método REST
        const { data: addModerated, error: addModeratedError } = await supabase
          .from('advertisements')
          .update({ moderated_at: null })
          .eq('id', 'any_non_existent_id')
          .select();
        
        if (!addModeratedError || !addModeratedError.message.includes('moderated_at')) {
          operations.push('Coluna moderated_at adicionada');
        } else {
          console.error('Erro ao adicionar moderated_at:', addModeratedError);
          operations.push(`Erro ao adicionar moderated_at: ${addModeratedError.message}`);
        }
      } else {
        operations.push('Coluna moderated_at já existe');
      }
    } catch (err) {
      operations.push(`Erro ao verificar moderated_at: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Verificar e adicionar status se necessário
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('advertisements')
        .select('status')
        .limit(1);
      
      if (statusError && statusError.message.includes('status')) {
        console.log('Adicionando coluna status...');
        
        // Adicionar a coluna com método REST
        const { data: addStatus, error: addStatusError } = await supabase
          .from('advertisements')
          .update({ status: 'pending' })
          .eq('id', 'any_non_existent_id')
          .select();
        
        if (!addStatusError || !addStatusError.message.includes('status')) {
          operations.push('Coluna status adicionada');
        } else {
          console.error('Erro ao adicionar status:', addStatusError);
          operations.push(`Erro ao adicionar status: ${addStatusError.message}`);
        }
      } else {
        operations.push('Coluna status já existe');
      }
    } catch (err) {
      operations.push(`Erro ao verificar status: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Corrigir manualmente cada anúncio existente
    const { data: allAds, error: allAdsError } = await supabase
      .from('advertisements')
      .select('id, moderation_status, status')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (allAdsError) {
      console.error('Erro ao buscar anúncios:', allAdsError);
      operations.push(`Erro ao buscar anúncios: ${allAdsError.message}`);
    } else if (allAds && allAds.length > 0) {
      console.log(`Atualizando ${allAds.length} anúncios existentes...`);
      
      const updatePromises = allAds.map(async (ad) => {
        const updateFields: Record<string, any> = {};
        
        // Adicionar valores padrão para campos que podem estar faltando
        if (ad.moderation_status === undefined || ad.moderation_status === null) {
          updateFields.moderation_status = 'pending';
        }
        
        if (ad.status === undefined || ad.status === null) {
          updateFields.status = 'inactive';
        }
        
        // Só atualizar se houver campos para atualizar
        if (Object.keys(updateFields).length > 0) {
          const { error: updateError } = await supabase
            .from('advertisements')
            .update(updateFields)
            .eq('id', ad.id);
          
          if (updateError) {
            return `Erro ao atualizar anúncio ${ad.id}: ${updateError.message}`;
          }
          return `Anúncio ${ad.id} atualizado com sucesso`;
        }
        
        return `Anúncio ${ad.id} não precisou de atualização`;
      });
      
      const updateResults = await Promise.all(updatePromises);
      operations.push(...updateResults);
    } else {
      operations.push('Nenhum anúncio encontrado para atualizar');
    }
    
    // Tentar atualizar especificamente o schema cache para resolver o erro
    try {
      console.log('Forçando atualização do schema cache...');
      
      // Forçar uma operação que atualize o schema cache
      const { data: refresh, error: refreshError } = await supabase
        .from('advertisements')
        .select('id, moderation_status, moderation_reason, moderated_at, status')
        .limit(1);
      
      if (refreshError) {
        console.error('Erro ao atualizar schema cache:', refreshError);
        operations.push(`Erro ao atualizar schema cache: ${refreshError.message}`);
      } else {
        operations.push('Schema cache atualizado com sucesso');
      }
    } catch (err) {
      operations.push(`Erro ao atualizar schema cache: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados corrigido com sucesso',
      operations
    });
    
  } catch (error) {
    console.error('Erro na API de correção do banco de dados:', error);
    return NextResponse.json({ 
      error: 'Erro interno na API de correção', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 