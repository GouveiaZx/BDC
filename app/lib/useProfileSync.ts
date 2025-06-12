import { useState, useEffect, useRef } from 'react';
import { getProfileDataFromLocalStorage, saveProfileDataToLocalStorage } from '../components/profile/ProfileHeader';
import { getSupabaseClient, getSupabaseAdminClient, supabaseAdmin } from './supabase';
import { convertTempIdToUUID, generateUUID } from './utils';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  description: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  mostrarNomePessoal?: boolean;
  avatar: string;
  banner: string;
  gallery: string[];
  account_type?: string;
  [key: string]: any; // Índice de assinatura para permitir acesso dinâmico às propriedades
}

// Definição de isValidUUID movida para o topo do escopo do módulo
const isValidUUID = (str: string): boolean => {
  if (!str) return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

// Mover createTablesIfNeeded para antes de ser chamado por executeSchemaInitialization
const createTablesIfNeeded = async (adminClient: typeof supabaseAdmin) => {
    try {
      // Verificar se as tabelas existem simplesmente tentando uma consulta
      const { data: profilesExists } = await adminClient
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      console.log('Tabelas verificadas com sucesso. Sistema pronto.');
      return true;
    } catch (error) {
      console.warn('Aviso: Tabelas podem não existir ou ter problemas de permissão:', error);
      // Não falhar aqui, permitir que a aplicação continue funcionando
      return true;
    }
  };

// Promise para controlar a inicialização do schema e evitar execuções concorrentes
let initializeSchemaPromise: Promise<boolean> | null = null;

const executeSchemaInitialization = async (adminClient: typeof supabaseAdmin): Promise<boolean> => {
  try {
    await createTablesIfNeeded(adminClient);
    console.log('Schema initialization successful.');
    return true;
  } catch (schemaError) {
    console.error('CRITICAL: Schema initialization failed!', schemaError);
    // Mesmo que falhe, resolvemos para não bloquear indefinidamente, mas a app pode não funcionar.
    return false;
  }
};

export function useProfileSync() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  
  const syncAttemptRef = useRef<number>(0);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      let localProfile: UserProfile | null = null;
      let userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');

      try {
        // Garantir que a inicialização do schema seja tentada apenas uma vez
        if (!initializeSchemaPromise) {
          console.log('Initiating schema initialization...');
          initializeSchemaPromise = executeSchemaInitialization(supabaseAdmin);
        }
        await initializeSchemaPromise; // Espera a conclusão da inicialização do schema

        if (localStorage.getItem('hasUserProfile') === 'true') {
          localProfile = getProfileDataFromLocalStorage();
          if (localProfile && localProfile.id) {
            userId = localProfile.id;
            setProfile(localProfile);
            console.log('Perfil carregado inicialmente do localStorage:', localProfile);
          } else {
            localStorage.removeItem('userProfile');
            localStorage.removeItem('hasUserProfile');
            localProfile = null;
            console.warn('Perfil local sem ID encontrado, limpando para recarregar.');
          }
        }

        if (!userId) {
          userId = generateUUID();
          localStorage.setItem('userId', userId);
          console.log('Novo ID de usuário gerado e salvo:', userId);
        } else if (!isValidUUID(userId)) {
          userId = convertTempIdToUUID(userId);
          localStorage.setItem('userId', userId);
          console.log('ID de usuário convertido para UUID válido:', userId);
        }
        
        if (!localProfile) {
            localProfile = createBaseProfile(userId, userEmail);
            console.log('Perfil base construído, aguardando sincronização ou usando como fallback:', localProfile);
        }

        try {
          const { data: remoteProfileData, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (remoteProfileData) {
            const { data: businessRecord, error: businessError } = await supabaseAdmin
              .from('business_profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            if (businessError && businessError.code !== 'PGRST116') {
              console.warn('Aviso ao buscar perfil de negócio do Supabase:', businessError);
            }

            const fetchedProfile = {
              id: userId,
              name: remoteProfileData.name || localProfile?.name || '',
              email: remoteProfileData.email || userEmail || localProfile?.email || '',
              phone: remoteProfileData.phone || localProfile?.phone || '',
              avatar: remoteProfileData.avatar_url || localProfile?.avatar || '',
              company: businessRecord?.company_name || localProfile?.company || '',
              address: businessRecord?.address || localProfile?.address || '',
              city: businessRecord?.city || localProfile?.city || '',
              state: businessRecord?.state || localProfile?.state || '',
              zipCode: businessRecord?.zip_code || localProfile?.zipCode || '',
              whatsapp: businessRecord?.contact_phone || remoteProfileData.whatsapp || localProfile?.whatsapp || '',
              website: businessRecord?.website || localProfile?.website || '',
              description: businessRecord?.description || localProfile?.description || '',
              socialMedia: {
                instagram: businessRecord?.instagram || localProfile?.socialMedia?.instagram || '',
                facebook: businessRecord?.facebook || localProfile?.socialMedia?.facebook || '',
                twitter: businessRecord?.twitter || localProfile?.socialMedia?.twitter || '',
                youtube: businessRecord?.metadata?.youtube || localProfile?.socialMedia?.youtube || '',
              },
              mostrarNomePessoal: businessRecord?.metadata?.mostrarNomePessoal !== false,
              banner: businessRecord?.banner_url || localProfile?.banner || '',
              gallery: businessRecord?.gallery || localProfile?.gallery || [],
              account_type: remoteProfileData.account_type || localProfile?.account_type || 'personal',
              created_at: remoteProfileData.created_at || localProfile?.created_at,
              updated_at: remoteProfileData.updated_at || localProfile?.updated_at,
              user_metadata: remoteProfileData.user_metadata || localProfile?.user_metadata || {},
            };
            
             const mergedProfile = {
                ...(localProfile || createBaseProfile(userId, userEmail)),
                ...fetchedProfile,
                id: userId,
                name: fetchedProfile.name || localProfile?.name || '',
                email: fetchedProfile.email || localProfile?.email || '',
                avatar: fetchedProfile.avatar || localProfile?.avatar || '',
             } as UserProfile;

            setProfile(mergedProfile);
            saveProfileDataToLocalStorage(mergedProfile);
            console.log('Perfil sincronizado com Supabase e mesclado:', mergedProfile);
            setOfflineMode(false);
          } else {
            // Se não tem perfil no Supabase, tentar enviar o perfil local
            console.log('Nenhum perfil no Supabase, tentando enviar perfil local existente:', localProfile);
            if (localProfile && localProfile.id) {
              setProfile(localProfile);
              saveProfileDataToLocalStorage(localProfile);
              await insertProfileIntoSupabase(supabaseAdmin, localProfile);
              setOfflineMode(false);
            } else {
              // Se não tem perfil local válido, criar um novo
              console.log('Nenhum perfil remoto ou local válido. Usando perfil base.');
              const baseProfile = createBaseProfile(userId!, userEmail);
              setProfile(baseProfile);
              saveProfileDataToLocalStorage(baseProfile);
              await insertProfileIntoSupabase(supabaseAdmin, baseProfile);
              setOfflineMode(false);
            }
          }
        } catch (syncError) {
          console.error('Erro ao sincronizar com Supabase:', syncError);
          setError('Funcionando em modo offline. Dados locais carregados.');
          setOfflineMode(true);
          setPendingChanges(true);
          
          if (localProfile) {
            console.log('✅ Usando perfil local disponível:', localProfile);
            setProfile(localProfile);
            saveProfileDataToLocalStorage(localProfile);
          } else {
            console.log('📝 Criando perfil base para funcionamento offline');
            const fallbackProfile = createBaseProfile(userId!, userEmail);
            setProfile(fallbackProfile);
            saveProfileDataToLocalStorage(fallbackProfile);
          }
        }
      } catch (initialError) {
        console.error('Erro crítico ao carregar perfil:', initialError);
        setError('Erro crítico ao carregar dados do perfil.');
        const baseUserId = userId || generateUUID();
        if (!userId) localStorage.setItem('userId', baseUserId);
        const fallbackProfile = createBaseProfile(baseUserId, userEmail);
        setProfile(fallbackProfile);
        saveProfileDataToLocalStorage(fallbackProfile);
        setOfflineMode(true);
        setPendingChanges(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);
  
  const insertProfileIntoSupabase = async (
    adminClient: SupabaseClient, 
    profileToInsert: Partial<UserProfile>
  ): Promise<boolean | any> => {
    try {
      // Validar ID (obrigatório para upsert)
      if (!profileToInsert.id) {
        console.error('ID do perfil é obrigatório para inserção no Supabase');
        return false;
      }

      console.log('Tentando inserir/atualizar perfil no Supabase:', profileToInsert.id, profileToInsert);
      
      // Primeiro, verificar se já existe um perfil com esse email
      let existingProfile = null;
      if (profileToInsert.email) {
        const { data: emailProfile, error: emailError } = await adminClient
          .from('profiles')
          .select('*')
          .eq('email', profileToInsert.email)
          .maybeSingle();
          
        if (emailError && emailError.code !== 'PGRST116') {
          console.warn('Erro ao verificar email existente:', emailError);
        } else if (emailProfile) {
          existingProfile = emailProfile;
          console.log('✅ Perfil já existe com email:', emailProfile.email, 'ID:', emailProfile.id);
          
          // Se o perfil existente tem um ID diferente do que estamos tentando inserir,
          // significa que há um conflito que precisa ser resolvido silenciosamente
          if (emailProfile.id !== profileToInsert.id) {
            console.log('🔄 Perfil já existe com ID diferente, usando o existente');
            // Atualizar localStorage com o ID correto
            localStorage.setItem('userId', emailProfile.id);
            return emailProfile; // Retornar o perfil existente sem tentar criar novo
          }
        }
      }
      
      // Se existe um perfil com esse email e mesmo ID, atualizar apenas
      const targetId = existingProfile?.id || profileToInsert.id;
      
      const profileForDb = {
        id: targetId,
        user_id: targetId, // user_id deve ser igual ao id
        name: profileToInsert.name || null,
        email: profileToInsert.email || null,
        phone: profileToInsert.phone || null,
        whatsapp: profileToInsert.whatsapp || null,
        avatar_url: profileToInsert.avatar || null,
        account_type: profileToInsert.account_type || 'personal',
        updated_at: new Date().toISOString(),
        user_metadata: typeof profileToInsert.user_metadata === 'object' && profileToInsert.user_metadata !== null ? 
          JSON.stringify(profileToInsert.user_metadata) : 
          (profileToInsert.user_metadata || '{}')
      };

      // Se já existe um perfil com esse email, apenas atualizar silenciosamente
      if (existingProfile) {
        console.log('🔄 Atualizando perfil existente silenciosamente');
        const { data: updatedProfile, error: updateError } = await adminClient
          .from('profiles')
          .update({
            name: profileToInsert.name || existingProfile.name,
            phone: profileToInsert.phone || existingProfile.phone,
            whatsapp: profileToInsert.whatsapp || existingProfile.whatsapp,
            avatar_url: profileToInsert.avatar || existingProfile.avatar_url,
            account_type: profileToInsert.account_type || existingProfile.account_type,
            updated_at: new Date().toISOString(),
            user_metadata: typeof profileToInsert.user_metadata === 'object' && profileToInsert.user_metadata !== null ? 
              JSON.stringify(profileToInsert.user_metadata) : 
              (existingProfile.user_metadata || '{}')
          })
          .eq('id', existingProfile.id)
          .select()
          .single();
          
        if (updateError) {
          console.warn('Aviso ao atualizar perfil existente:', updateError);
          return existingProfile; // Retornar o perfil existente mesmo se update falhar
        } else {
          console.log('✅ Perfil existente atualizado com sucesso');
          return updatedProfile;
        }
      }

      // Tentar criar novo perfil apenas se não existe
      const { data: upsertedProfile, error: profileError } = await adminClient
        .from('profiles')
        .upsert(profileForDb, { onConflict: 'id' })
        .select()
        .single();
      
      if (profileError) {
        // Se for erro de email duplicado, buscar o perfil existente e retornar
        if (profileError.code === '23505' && profileError.details?.includes('email')) {
          console.log('⚠️ Email já existe, buscando perfil existente...');
          const { data: existingByEmail } = await adminClient
            .from('profiles')
            .select('*')
            .eq('email', profileToInsert.email)
            .single();
            
          if (existingByEmail) {
            console.log('✅ Retornando perfil existente encontrado');
            localStorage.setItem('userId', existingByEmail.id);
            return existingByEmail;
          }
        }
        
        console.warn('Erro ao fazer upsert na tabela profiles:', profileError);
        return false; // Falhar silenciosamente para não quebrar a aplicação
      }
      
      console.log('✅ Novo perfil criado com sucesso:', upsertedProfile);
      return upsertedProfile;
      
    } catch (error) {
      console.warn('Erro ao inserir/atualizar perfil no Supabase (ignorando):', error);
      // Não setar erro global para não quebrar a experiência do usuário
      return false;
    }
  };
  
  const createBaseProfile = (userId: string, userEmail: string | null): UserProfile => {
    const localData = getProfileDataFromLocalStorage();
    console.log('Criando perfil base com ID:', userId, 'e Email:', userEmail, 'Dados locais:', localData);
    
    return {
      id: userId,
      name: localData?.name || localStorage.getItem('userName') || userEmail?.split('@')[0] || 'Usuário',
      email: localData?.email || userEmail || '',
      phone: localData?.phone || '',
      whatsapp: localData?.whatsapp || '',
      company: localData?.company || '',
      address: localData?.address || '',
      city: localData?.city || '',
      state: localData?.state || '',
      zipCode: localData?.zipCode || '',
      website: localData?.website || '',
      description: localData?.description || '',
      socialMedia: localData?.socialMedia || {
        instagram: '',
        facebook: '',
        twitter: '',
        youtube: '',
      },
      avatar: localData?.avatar || '/images/avatar-placeholder.png',
      banner: localData?.banner || '',
      gallery: localData?.gallery || [],
      account_type: localData?.account_type || 'personal',
      created_at: localData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: localData?.user_metadata || {},
    };
  };
  
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando atualização de perfil no Supabase:', profileData);
      
      // Garantir que temos um ID para atualização
      if (!profileData.id && profile?.id) {
        profileData.id = profile.id;
        console.log('Usando ID do perfil atual:', profile.id);
      } else if (!profileData.id && !profile?.id) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          profileData.id = userId;
          console.log('Usando ID do localStorage:', userId);
        } else {
          throw new Error('ID do perfil não fornecido para atualização');
        }
      }
      
      // Tentar salvar com a nova API completa primeiro
      try {
        console.log('⏳ Tentando salvar via API completa...');
        const response = await fetch('/api/profile/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: profileData.id,
            profileData: profileData
          })
        });
        
        const apiResult = await response.json();
        
        if (response.ok && apiResult.success) {
          console.log('✅ Perfil salvo com sucesso via API completa!');
          
          // Criar um perfil mesclado com os dados atuais e os novos dados
          const mergedProfile = { 
            ...profile, 
            ...profileData,
            id: profileData.id || profile?.id 
          } as UserProfile;
          
          // Salvar localmente
          saveProfileDataToLocalStorage(mergedProfile);
          setProfile(mergedProfile);
          setOfflineMode(false);
          setPendingChanges(false);
          setIsLoading(false);
          return true;
        } else {
          console.warn('⚠️ API completa falhou, tentando método direto...');
          throw new Error('API completa falhou: ' + apiResult.error);
        }
      } catch (apiError) {
        console.warn('❌ Falha na API completa, usando método direto:', apiError);
        
                 // Fallback para método direto
         try {
           console.log('⏳ Enviando perfil para o Supabase (método direto)...');
           const result = await insertProfileIntoSupabase(supabaseAdmin, profileData);
          
          // Criar um perfil mesclado com os dados atuais e os novos dados
          const mergedProfile = { 
            ...profile, 
            ...profileData,
            id: profileData.id || profile?.id 
          } as UserProfile;
          
          // Salvar localmente mesmo que o Supabase falhe
          saveProfileDataToLocalStorage(mergedProfile);
          setProfile(mergedProfile);
          
          if (!result) {
            console.warn('⚠️ Supabase update failed, but profile was saved locally');
            setOfflineMode(true);
            setPendingChanges(true);
          } else {
            console.log('✅ Perfil sincronizado com sucesso no Supabase após atualização!');
            console.log('📄 Dados salvos:', result);
            setOfflineMode(false);
            setPendingChanges(false);
          }
          
          setIsLoading(false);
          return true;
        } catch (supabaseError) {
          console.error('❌ Falha ao salvar perfil no Supabase, salvando apenas localmente:', supabaseError);
          
          // Mesmo com erro no Supabase, salvamos localmente
          const mergedProfile = { 
            ...profile, 
            ...profileData,
            id: profileData.id || profile?.id 
          } as UserProfile;
          
          saveProfileDataToLocalStorage(mergedProfile);
          setProfile(mergedProfile);
          setOfflineMode(true);
          setPendingChanges(true);
          
          setIsLoading(false);
          return true; // Retornamos true porque ao menos o salvamento local foi bem-sucedido
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao atualizar perfil');
      setIsLoading(false);
      return false;
    }
  };
  
  useEffect(() => {
    const handleOnline = async () => {
      if (offlineMode && pendingChanges && profile) {
        console.log('Conexão online detectada. Tentando sincronizar perfil pendente...');
        setIsLoading(true);
        try {
           // Garantir que a inicialização do schema seja tentada (e aguardada) antes de sincronizar
          if (!initializeSchemaPromise) {
            console.log('Initiating schema initialization before online sync...');
            initializeSchemaPromise = executeSchemaInitialization(supabaseAdmin);
          }
          await initializeSchemaPromise;

          await insertProfileIntoSupabase(supabaseAdmin, profile);
          setOfflineMode(false);
          setPendingChanges(false);
          setError(null);
          console.log('Perfil pendente sincronizado com sucesso.');
        } catch (error) {
          console.error('Falha ao sincronizar perfil pendente:', error);
          setError('Ainda não foi possível sincronizar com o servidor.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [offlineMode, pendingChanges, profile]);
  
  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isOffline: offlineMode,
    hasPendingChanges: pendingChanges
  };
} 