import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email } = body;
    
    if (!userId || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID do usuário e email são obrigatórios' 
      }, { status: 400 });
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Buscar informações do usuário no supabase auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: userError?.message || 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    const user = userData.user;
    
    // Buscar perfil existente com base no ID ou email
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${userId},email.eq.${email}`)
      .maybeSingle();
      
    // Preparar dados do perfil
    const profileData = {
      id: userId,
      email: email,
      name: user.user_metadata?.name || email.split('@')[0],
      account_type: existingProfile?.account_type || 'personal',
      phone: existingProfile?.phone || '',
      updated_at: new Date().toISOString()
    };
    
    // Se não existir, criar um novo perfil
    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        return NextResponse.json({ 
          success: false, 
          error: insertError.message 
        }, { status: 500 });
      }
    } else {
      // Se existir, atualizar o perfil existente
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', existingProfile.id);
        
      if (updateError) {
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 });
      }
    }
    
    // Verificar se há perfil de negócio associado e sincronizar se necessário
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (businessProfile) {
      // Atualizar referência ao usuário se necessário
      const { error: updateBusinessError } = await supabase
        .from('business_profiles')
        .update({ 
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessProfile.id);
        
      if (updateBusinessError) {
        // Não falhar completamente se apenas essa etapa falhar
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Perfil sincronizado com sucesso' 
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    }, { status: 500 });
  }
} 