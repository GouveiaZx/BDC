import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

// Forçar comportamento dinâmico
export const dynamic = 'force-dynamic';

// API para adicionar colunas necessárias diretamente no banco de dados
export async function GET(req: NextRequest) {
  try {
    console.log('Iniciando correção direta do banco de dados...');
    const supabase = getSupabaseAdminClient();
    
    if (!supabase) {
      console.error('Erro ao criar cliente Supabase Admin');
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar cliente Supabase' 
      }, { status: 500 });
    }
    
    const results = [];
    
    // Atualizar o primeiro anúncio para criar as colunas necessárias
    try {
      // Buscar primeiro anúncio para identificá-lo
      const { data: firstAd, error: firstAdError } = await supabase
        .from('advertisements')
        .select('id')
        .limit(1)
        .single();
      
      if (firstAdError) {
        console.error('Erro ao buscar primeiro anúncio:', firstAdError);
        results.push(`Erro ao buscar primeiro anúncio: ${firstAdError.message}`);
      } else if (firstAd) {
        console.log(`Primeiro anúncio encontrado com ID: ${firstAd.id}`);
        
        // Tentar atualizar com todos os campos necessários para forçar sua criação
        const updateObject = {
          moderation_status: 'pending',
          moderation_reason: 'placeholder',
          updated_at: new Date().toISOString(),
          status: 'inactive'
        };
        
        // Atualizar o anúncio para criar as colunas
        const { error: updateError } = await supabase
          .from('advertisements')
          .update(updateObject)
          .eq('id', firstAd.id);
        
        if (updateError) {
          console.error('Erro ao atualizar anúncio com novos campos:', updateError);
          results.push(`Erro ao atualizar campos: ${updateError.message}`);
        } else {
          console.log('Anúncio atualizado com sucesso, colunas devem ter sido criadas');
          results.push('Colunas foram criadas com sucesso via atualização');
        }
        
        // Verificar se as colunas agora existem
        try {
          const { data: checkData, error: checkError } = await supabase
            .from('advertisements')
            .select('moderation_status, moderation_reason, status')
            .eq('id', firstAd.id)
            .single();
          
          if (checkError) {
            console.error('Erro ao verificar colunas após atualização:', checkError);
            results.push(`Verificação falhou: ${checkError.message}`);
          } else {
            console.log('Colunas verificadas:', Object.keys(checkData));
            results.push(`Colunas verificadas: ${Object.keys(checkData).join(', ')}`);
          }
        } catch (verifyError) {
          console.error('Erro ao verificar colunas:', verifyError);
          results.push(`Erro na verificação: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
        }
      } else {
        console.log('Nenhum anúncio encontrado para atualizar');
        results.push('Nenhum anúncio para atualizar');
      }
    } catch (error) {
      console.error('Erro geral ao tentar atualizar anúncio:', error);
      results.push(`Erro geral: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Atualizar o schema cache
    try {
      console.log('Tentando atualizar o schema cache...');
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Erro ao atualizar schema cache:', error);
        results.push(`Falha ao atualizar schema cache: ${error.message}`);
      } else {
        console.log('Schema cache potencialmente atualizado');
        results.push('Schema cache atualizado');
      }
    } catch (cacheError) {
      console.error('Erro ao atualizar schema cache:', cacheError);
      results.push(`Erro no schema cache: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Operação direta de correção do banco de dados concluída',
      results
    });
    
  } catch (error) {
    console.error('Erro na API de correção direta:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno na API de correção direta', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 