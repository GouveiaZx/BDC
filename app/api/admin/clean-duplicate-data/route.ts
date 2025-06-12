import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // 1. Buscar usuário na auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuário auth:', authError);
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 500 });
    }
    
    // Encontrar usuário pelo email com tipagem adequada
    const authUser = authData?.users?.find((u: any) => u.email === email);
    
    if (!authUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado na autenticação' 
      }, { status: 404 });
    }
    
    const userId = authUser.id;
    
    // 2. Buscar todos os perfis com o mesmo email
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
      
    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
      return NextResponse.json({ 
        success: false, 
        error: profilesError.message 
      }, { status: 500 });
    }
    
    // 3. Se existirem múltiplos perfis, manter apenas o que tem o ID correto
    if (profiles && profiles.length > 1) {
      console.log(`Encontrados ${profiles.length} perfis para o email ${email}`);
      
      // Encontrar o perfil correto (com ID igual ao ID do usuário auth)
      const correctProfile = profiles.find(p => p.id === userId);
      
      // IDs dos perfis a serem excluídos (todos exceto o correto)
      const profileIdsToDelete = profiles
        .filter(p => p.id !== userId)
        .map(p => p.id);
        
      if (profileIdsToDelete.length > 0) {
        console.log(`Excluindo ${profileIdsToDelete.length} perfis duplicados`);
        
        // Excluir perfis duplicados
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .in('id', profileIdsToDelete);
          
        if (deleteError) {
          console.error('Erro ao excluir perfis duplicados:', deleteError);
          // Não falhar completamente se esta etapa falhar
        }
      }
      
      // Se não encontrarmos o perfil correto, mas existirem outros perfis,
      // atualizar o mais recente para ter o ID correto
      if (!correctProfile && profiles.length > 0) {
        // Ordenar por data de criação (mais recente primeiro)
        const sortedProfiles = [...profiles].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        
        const mostRecentProfile = sortedProfiles[0];
        
        console.log(`Atualizando perfil mais recente (${mostRecentProfile.id}) para ID ${userId}`);
        
        // Excluir o perfil mais recente
        await supabase
          .from('profiles')
          .delete()
          .eq('id', mostRecentProfile.id);
          
        // Criar novo perfil com ID correto
        await supabase
          .from('profiles')
          .insert({
            ...mostRecentProfile,
            id: userId,
            updated_at: new Date().toISOString()
          });
      }
    }
    
    // 4. Limpar perfis de negócios duplicados ou incorretos
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId);
      
    if (businessError) {
      console.error('Erro ao buscar perfis de negócio:', businessError);
      // Não falhar completamente se esta etapa falhar
    } else if (businessProfiles && businessProfiles.length > 1) {
      console.log(`Encontrados ${businessProfiles.length} perfis de negócio para o usuário ${userId}`);
      
      // Ordenar por data de atualização (mais recente primeiro)
      const sortedBusinessProfiles = [...businessProfiles].sort((a, b) => 
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      );
      
      // Manter apenas o perfil de negócio mais recente
      const mostRecentBusinessProfile = sortedBusinessProfiles[0];
      
      const businessProfileIdsToDelete = sortedBusinessProfiles
        .slice(1) // Pular o primeiro (mais recente)
        .map(p => p.id);
        
      if (businessProfileIdsToDelete.length > 0) {
        console.log(`Excluindo ${businessProfileIdsToDelete.length} perfis de negócio duplicados`);
        
        // Excluir perfis de negócio duplicados
        const { error: deleteBusinessError } = await supabase
          .from('business_profiles')
          .delete()
          .in('id', businessProfileIdsToDelete);
          
        if (deleteBusinessError) {
          console.error('Erro ao excluir perfis de negócio duplicados:', deleteBusinessError);
          // Não falhar completamente se esta etapa falhar
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados duplicados limpos com sucesso' 
    });
    
  } catch (error: any) {
    console.error('Erro na API de limpeza de dados duplicados:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
} 