import { getSupabaseClient, getSupabaseAdminClient, supabase, supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { convertTempIdToUUID } from './utils';

interface UserProfile {
  id: string; // UUID do usuário
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  avatar_url?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  description?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  banner?: string;
  gallery?: string[];
  account_type: 'personal' | 'business';
  created_at?: string;
  updated_at?: string;
  user_metadata?: any;
  businessProfile?: BusinessProfile;
  bio?: string;
}

interface BusinessProfile {
  id: string;
  company_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
}

/**
 * Salva ou atualiza o perfil de um usuário no Supabase
 * Esta função deve ser chamada após o registro bem-sucedido
 */
export const saveUserProfile = async (userProfile: UserProfile): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Iniciando saveUserProfile com ID:', userProfile.id);
    
    // Obter ID do localStorage se não fornecido no objeto
    let profileId = userProfile.id;
    if (!profileId && typeof window !== 'undefined') {
      profileId = localStorage.getItem('userId') || '';
      console.log('Usando ID do localStorage:', profileId);
    }
    
    // Verificar status de autenticação
    const isUnverified = typeof window !== 'undefined' && localStorage.getItem('userAuthStatus') === 'unverified';
    console.log('Status de autenticação - não verificado:', isUnverified);
    
    // Converter ID temporário para UUID válido se necessário
    let validUserId = profileId;
    if (profileId && (profileId.startsWith('temp-') || !profileId.includes('-'))) {
      validUserId = convertTempIdToUUID(profileId);
      console.log('ID temporário convertido para UUID válido (saveUserProfile):', validUserId);
      // Atualizar o ID no objeto de perfil
      userProfile.id = validUserId;
      
      // Atualizar também no localStorage para sincronização
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', validUserId);
      }
    }
    
    // Salvar o perfil completo no localStorage antes de tentar salvar no Supabase
    // Isso garante que os dados estejam disponíveis localmente mesmo se a operação no banco falhar
    if (typeof window !== 'undefined') {
      const completeProfile = {
        ...userProfile,
        id: validUserId,
        avatar_url: userProfile.avatar || '/images/avatar-placeholder.png',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Salvar dados individuais para acesso mais fácil
      localStorage.setItem('userName', userProfile.name || '');
      localStorage.setItem('userEmail', userProfile.email || '');
      localStorage.setItem('userPhone', userProfile.phone || '');
      localStorage.setItem('userWhatsapp', userProfile.whatsapp || '');
      localStorage.setItem('userAvatar', userProfile.avatar || '/images/avatar-placeholder.png');
      localStorage.setItem('userCompany', userProfile.company || '');
      localStorage.setItem('userAddress', userProfile.address || '');
      localStorage.setItem('userCity', userProfile.city || '');
      localStorage.setItem('userState', userProfile.state || '');
      localStorage.setItem('userZipCode', userProfile.zipCode || '');
      localStorage.setItem('userWebsite', userProfile.website || '');
      localStorage.setItem('userBio', userProfile.description || '');
      
      // Salvar redes sociais
      if (userProfile.socialMedia) {
        localStorage.setItem('userInstagram', userProfile.socialMedia.instagram || '');
        localStorage.setItem('userFacebook', userProfile.socialMedia.facebook || '');
        localStorage.setItem('userTwitter', userProfile.socialMedia.twitter || '');
        localStorage.setItem('userYoutube', userProfile.socialMedia.youtube || '');
      }
      
      // Salvar perfil completo para referência
      localStorage.setItem('userProfile', JSON.stringify(completeProfile));
      console.log('Perfil completo salvo no localStorage');
    }
    
    try {
      console.log('Tentando salvar perfil para usuário (ID):', validUserId);
      
      // Como estratégia principal, usar upsert para criar ou atualizar
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: validUserId,
          name: userProfile.name,
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          whatsapp: userProfile.whatsapp || '',
          avatar_url: userProfile.avatar || '/images/avatar-placeholder.png',
          account_type: userProfile.account_type || 'personal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Incluir campos adicionais para facilitar a criação de perfil
          admin_notes: isUnverified ? 'Perfil criado com email não verificado' : undefined,
          user_metadata: typeof userProfile.user_metadata === 'object' ? 
            JSON.stringify(userProfile.user_metadata) : 
            (userProfile.user_metadata || '')
        }, { 
          onConflict: 'id' 
        });
        
      if (upsertError) {
        console.error('Erro no upsert:', upsertError);
        
        // Tentar abordagem alternativa com PUT direto
        try {
          console.log('Tentando com PUT direto...');
          
          // Obter token de autenticação
          const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${validUserId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': token ? `Bearer ${token}` : '',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              name: userProfile.name,
              email: userProfile.email || '',
              phone: userProfile.phone || '',
              whatsapp: userProfile.whatsapp || '',
              avatar_url: userProfile.avatar || '/images/avatar-placeholder.png',
              account_type: userProfile.account_type || 'personal',
              updated_at: new Date().toISOString(),
              admin_notes: isUnverified ? 'Perfil atualizado com email não verificado' : undefined,
              user_metadata: typeof userProfile.user_metadata === 'object' ? 
                JSON.stringify(userProfile.user_metadata) : 
                (userProfile.user_metadata || '')
            })
          });
          
          if (!response.ok) {
            console.error('Erro no PUT direto:', response.status, response.statusText);
            
            // Como último recurso, tentar POST
            const postResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': token ? `Bearer ${token}` : '',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({
                id: validUserId,
                name: userProfile.name,
                email: userProfile.email || '',
                phone: userProfile.phone || '',
                whatsapp: userProfile.whatsapp || '',
                avatar_url: userProfile.avatar || '/images/avatar-placeholder.png',
                account_type: userProfile.account_type || 'personal',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                admin_notes: isUnverified ? 'Perfil criado com POST direto - email não verificado' : undefined,
                user_metadata: typeof userProfile.user_metadata === 'object' ? 
                  JSON.stringify(userProfile.user_metadata) : 
                  (userProfile.user_metadata || '')
              })
            });
            
            if (!postResponse.ok) {
              console.log('Perfil já está salvo localmente. Continuando com operação local.');
              return { success: true };
            }
            
            console.log('Perfil criado com POST com sucesso!');
          } else {
            console.log('Perfil atualizado com PUT com sucesso!');
          }
          
          return { success: true };
        } catch (restError) {
          console.error('Todos os métodos falharam:', restError);
          console.log('Perfil já está salvo localmente. Continuando com operação local.');
          return { success: true };
        }
      }
      
      console.log('Perfil criado/atualizado com upsert com sucesso!');
      return { success: true };
    } catch (dbError: any) {
      console.error('Erro na operação principal do banco:', dbError);
      console.log('Perfil já está salvo localmente. Continuando com operação local.');
      return { success: true };
    }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    return { success: false, error: 'Erro ao salvar perfil.' };
  }
};

/**
 * Salva ou atualiza o perfil de negócio de um usuário no Supabase
 */
export const saveBusinessProfile = async (profile: {
  user_id: string;
  company_name: string;
  cnpj?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
}): Promise<{ success: boolean; error: string }> => {
  try {
    const supabaseClient = getSupabaseClient();
    const admin = getSupabaseAdminClient(); // Usar cliente admin para ter permissões completas
    
    // Verificar se já existe um perfil para esse usuário
    const { data: existingProfile, error: fetchError } = await admin
      .from('business_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao verificar perfil de negócio:', fetchError);
      return { success: false, error: 'Erro ao verificar perfil de negócio.' };
    }
    
    if (existingProfile) {
      // Atualizar perfil existente
      const { error: updateError } = await admin
        .from('business_profiles')
        .update({
          company_name: profile.company_name,
          cnpj: profile.cnpj,
          description: profile.description,
          contact_phone: profile.contact_phone,
          contact_email: profile.contact_email,
          is_verified: true, // Marcar como verificado para aparecer nos classificados
          updated_at: new Date()
        })
        .eq('user_id', profile.user_id);
        
      if (updateError) {
        console.error('Erro ao atualizar perfil de negócio:', updateError);
        return { success: false, error: 'Erro ao atualizar perfil de negócio.' };
      }
      
      // Atualizar também na tabela businesses se existir
      try {
        const { data: existingBusiness } = await admin
          .from('businesses')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();
          
        if (existingBusiness) {
          await admin
            .from('businesses')
            .update({
              business_name: profile.company_name,
              description: profile.description,
              phone: profile.contact_phone,
              email: profile.contact_email,
              is_verified: true, // Marcar como verificado para aparecer nos classificados
              updated_at: new Date()
            })
            .eq('user_id', profile.user_id);
        }
      } catch (businessError) {
        console.log('Aviso: Não foi possível atualizar tabela businesses', businessError);
      }
      
      return { success: true, error: '' };
    } else {
      // Criar novo perfil com um ID gerado
      const newProfileId = uuidv4(); // Gerar um UUID para o campo id
      
      const { error: insertError } = await admin
        .from('business_profiles')
        .insert({
          id: newProfileId,
          user_id: profile.user_id,
          company_name: profile.company_name,
          cnpj: profile.cnpj,
          description: profile.description,
          contact_phone: profile.contact_phone,
          contact_email: profile.contact_email,
          is_verified: true, // Marcar como verificado para aparecer nos classificados
          created_at: new Date(),
          updated_at: new Date(),
          banner_url: '/images/banner-placeholder.jpg', // Definir um banner padrão para novos usuários
          logo_url: '/images/avatar-placeholder.png' // Definir um logo padrão para novos usuários
        });
        
      if (insertError) {
        console.error('Erro ao criar perfil de negócio:', insertError);
        return { success: false, error: 'Erro ao criar perfil de negócio.' };
      }
      
      // Adicionar também na tabela businesses para garantir compatibilidade
      try {
        await admin
          .from('businesses')
          .insert({
            id: uuidv4(),
            user_id: profile.user_id,
            business_name: profile.company_name,
            description: profile.description || 'Empresa cadastrada na plataforma BDC',
            phone: profile.contact_phone,
            email: profile.contact_email,
            is_verified: true, // Marcar como verificado para aparecer nos classificados
            created_at: new Date(),
            updated_at: new Date(),
            banner_url: '/images/banner-placeholder.jpg', // Definir um banner padrão para novos usuários
            logo_url: '/images/avatar-placeholder.png' // Definir um logo padrão para novos usuários
          });
      } catch (businessError) {
        console.log('Aviso: Não foi possível inserir na tabela businesses', businessError);
      }
      
      return { success: true, error: '' };
    }
  } catch (error) {
    console.error('Erro ao salvar perfil de negócio:', error);
    return { success: false, error: 'Erro ao salvar perfil de negócio.' };
  }
};

/**
 * Obtém o perfil completo do usuário (incluindo perfil de negócio se existir)
 */
export const getUserCompleteProfile = async (userId: string): Promise<{
  userProfile?: UserProfile;
  businessProfile?: BusinessProfile;
  error?: string;
}> => {
  try {
    // Verificar se o cliente supabase está disponível
    if (!supabase) {
      console.error('Cliente Supabase não inicializado');
      return { error: 'Cliente Supabase não inicializado.' };
    }
    
    // Converter ID temporário para UUID válido se necessário
    let validUserId = userId;
    if (userId && userId.startsWith('temp-')) {
      validUserId = convertTempIdToUUID(userId);
      console.log('ID temporário convertido para UUID válido (getUserCompleteProfile):', validUserId);
    }
    
    // Obter perfil básico do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', validUserId)
      .single();

    if (userError) {
      console.error('Erro ao obter perfil do usuário:', userError);
      
      // Tentar buscar com cliente administrativo se falhar com o cliente regular
      const { data: adminUserProfile, error: adminUserError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', validUserId)
        .single();
        
      if (adminUserError) {
        console.error('Erro ao obter perfil do usuário (admin):', adminUserError);
        return { error: 'Erro ao obter perfil do usuário.' };
      }
      
      // Se o tipo de conta for business, obter perfil de negócio
      if (adminUserProfile.account_type === 'business') {
        const { data: businessProfile, error: businessError } = await supabaseAdmin
          .from('business_profiles')
          .select('*')
          .eq('user_id', validUserId)
          .single();

        if (businessError && businessError.code !== 'PGRST116') {
          console.error('Erro ao obter perfil de negócio (admin):', businessError);
          return { userProfile: adminUserProfile, error: 'Erro ao obter perfil de negócio.' };
        }

        return { userProfile: adminUserProfile, businessProfile };
      }

      return { userProfile: adminUserProfile };
    }

    // Se o tipo de conta for business, obter perfil de negócio
    if (userProfile.account_type === 'business') {
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', validUserId)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        console.error('Erro ao obter perfil de negócio:', businessError);
        
        // Tentar buscar com cliente administrativo se falhar com o cliente regular
        const { data: adminBusinessProfile, error: adminBusinessError } = await supabaseAdmin
          .from('business_profiles')
          .select('*')
          .eq('user_id', validUserId)
          .single();
          
        if (adminBusinessError && adminBusinessError.code !== 'PGRST116') {
          console.error('Erro ao obter perfil de negócio (admin):', adminBusinessError);
          return { userProfile, error: 'Erro ao obter perfil de negócio.' };
        }

        return { userProfile, businessProfile: adminBusinessProfile };
      }

      return { userProfile, businessProfile };
    }

    return { userProfile };
  } catch (error) {
    console.error('Erro ao obter perfil completo:', error);
    return { error: 'Erro ao obter perfil completo.' };
  }
};

/**
 * Salva o perfil diretamente via fetch para a API REST do Supabase
 * Esta função é uma alternativa para casos onde a API do Supabase retorna erros como PGRST204
 */
export const directProfileSave = async (userProfile: UserProfile): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Iniciando directProfileSave com ID:', userProfile.id);
    
    // Obter ID do localStorage se não fornecido no objeto
    let profileId = userProfile.id;
    if (!profileId && typeof window !== 'undefined') {
      profileId = localStorage.getItem('userId') || '';
      console.log('Usando ID do localStorage:', profileId);
    }
    
    // Converter ID temporário para UUID válido se necessário
    let validUserId = profileId;
    if (profileId && (profileId.startsWith('temp-') || !profileId.includes('-'))) {
      validUserId = convertTempIdToUUID(profileId);
      console.log('ID temporário convertido para UUID válido (directProfileSave):', validUserId);
    }
    
    if (!validUserId) {
      console.error('ID válido não encontrado para salvar perfil');
      return { success: false, error: 'ID válido não encontrado' };
    }
    
    // Salvar dados no localStorage para garantir
    if (typeof window !== 'undefined') {
      localStorage.setItem('userProfile', JSON.stringify({
        ...userProfile,
        id: validUserId
      }));
      localStorage.setItem('hasUserProfile', 'true');
    }
    
    // Obter tokens
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjguzxwwydlpvudwmiyv.supabase.co';
    
    // Dados do perfil
    const profileData = {
      id: validUserId,
      name: userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      whatsapp: userProfile.whatsapp || '',
      avatar_url: userProfile.avatar || userProfile.avatar_url || '/images/avatar-placeholder.png',
      account_type: userProfile.account_type || 'personal',
      updated_at: new Date().toISOString(),
      user_metadata: typeof userProfile.user_metadata === 'object' ? 
        JSON.stringify(userProfile.user_metadata) : 
        (userProfile.user_metadata || '')
    };
    
    try {
      // Abordagem mais simples - DELETE e depois INSERT  
      console.log('Enviando solicitação DELETE');
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${validUserId}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      console.log('Resposta DELETE:', deleteResponse.status);
      
      // Agora inserir o perfil
      console.log('Enviando solicitação POST (INSERT)');
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(profileData)
      });
      
      if (insertResponse.ok) {
        console.log('Perfil salvo com sucesso via INSERT puro!');
        return { success: true };
      }
      
      console.log('Resposta INSERT após DELETE:', insertResponse.status, insertResponse.statusText);
      const insertResponseData = await insertResponse.text();
      console.log('Dados da resposta INSERT:', insertResponseData);
      
      // Se falhar, tentar uma abordagem alternativa com PUT simples
      console.log('Tentando PUT simples');
      const putResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${validUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          whatsapp: userProfile.whatsapp || '',
          avatar_url: userProfile.avatar || userProfile.avatar_url || '/images/avatar-placeholder.png',
          account_type: userProfile.account_type || 'personal',
          updated_at: new Date().toISOString(),
          user_metadata: typeof userProfile.user_metadata === 'object' ? 
            JSON.stringify(userProfile.user_metadata) : 
            (userProfile.user_metadata || '')
        })
      });
      
      if (putResponse.ok) {
        console.log('Perfil salvo com sucesso via PUT simples!');
        return { success: true };
      }
      
      console.log('Resposta PUT simples:', putResponse.status, putResponse.statusText);
      const putResponseData = await putResponse.text();
      console.log('Dados da resposta PUT:', putResponseData);
      
      // Se todas as tentativas falharem, ainda temos os dados no localStorage
      console.log('Todas as tentativas de salvar no banco falharam. Dados salvos apenas localmente.');
      return { success: true, error: 'Falha ao salvar no banco, mas dados salvos localmente' };
      
    } catch (fetchError) {
      console.error('Erro ao salvar perfil via fetch:', fetchError);
      return { success: true, error: 'Erro na requisição, mas dados salvos localmente' };
    }
  } catch (error) {
    console.error('Erro geral em directProfileSave:', error);
    return { success: false, error: 'Erro geral ao salvar perfil.' };
  }
};

// Buscar perfil do usuário atual
export async function getUserProfile(profileId?: string): Promise<UserProfile | null> {
  try {
    // Se o ID não foi fornecido, tentar obter do localStorage apenas como último recurso
    if (!profileId) {
      // Em vez de usar localStorage diretamente, verificar primeiro a sessão
      // e usar localStorage apenas como fallback
      profileId = typeof window !== 'undefined' ? 
                  (localStorage.getItem('userId') || '') : '';
      
      if (!profileId) {
        return null;
      }
    }

    const supabase = getSupabaseClient();
    
    // Buscar perfil diretamente da tabela de perfis
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
      
    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    
    if (!data) {
      console.warn('Perfil não encontrado para o ID:', profileId);
      return null;
    }
    
    // Importante: NÃO use dados do localStorage aqui, apenas dados do banco
    const profile: UserProfile = {
      id: data.id,
      name: data.name || 'Usuário',
      email: data.email || '',
      avatar: data.avatar_url || '/images/avatar-placeholder.png',
      bio: data.bio || '',
      phone: data.phone || '',
      account_type: data.account_type || 'personal',
      created_at: data.created_at || new Date().toISOString(),
    };
    
    // Buscar business profile apenas se existir
    const { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', profileId)
      .single();
      
    if (!businessError && businessData) {
      profile.businessProfile = {
        id: businessData.id,
        company_name: businessData.company_name,
        description: businessData.description || '',
        logo_url: businessData.logo_url || '',
        banner_url: businessData.banner_url || '',
      };
    }
    
    return profile;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
}

// Função para salvar perfil e garantir que seja salvo apenas no banco, não no localStorage
export async function updateUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    // Se não temos um ID de perfil, não podemos salvar
    if (!profile.id) {
      console.error('ID de perfil necessário para salvar');
      return false;
    }
    
    const supabase = getSupabaseClient();
    
    // Atualizar o perfil no banco de dados
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar,
        bio: profile.bio,
        phone: profile.phone,
        account_type: profile.account_type || 'personal',
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Erro ao salvar perfil:', error);
      return false;
    }
    
    // Se houver perfil empresarial, salvar também
    if (profile.businessProfile) {
      const { error: businessError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: profile.id,
          company_name: profile.businessProfile.company_name,
          description: profile.businessProfile.description,
          logo_url: profile.businessProfile.logo_url,
          banner_url: profile.businessProfile.banner_url,
          updated_at: new Date().toISOString()
        });
        
      if (businessError) {
        console.error('Erro ao salvar perfil empresarial:', businessError);
        // Não falhar completamente se apenas o perfil empresarial falhar
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar perfil do usuário:', error);
    return false;
  }
} 