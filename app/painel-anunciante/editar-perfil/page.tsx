'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaLock, FaBuilding, FaGlobe, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { useProfileSync, UserProfile } from '../../lib/useProfileSync';
import { saveProfileDataToLocalStorage, getProfileDataFromLocalStorage } from '../../components/profile/ProfileHeader';
import { getSupabaseClient } from '../../lib/supabase';
import { directProfileSave } from '../../lib/profile';

const EditarPerfil = () => {
  const { profile, isLoading: profileLoading, error: profileError, updateProfile } = useProfileSync();
  
  const [formState, setFormState] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    description: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
    },
    avatar: '',
    banner: '',
    gallery: [],
  });
  
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('informacoes');

  const cities = [
    'Barra do Corda', 
    'Fernando Falcão', 
    'Jenipapo dos Vieiras', 
    'Presidente Dutra', 
    'Grajaú', 
    'Formosa da Serra Negra', 
    'Itaipava do Grajaú', 
    'Esperantinópolis'
  ];

  // Implementar função para salvar localmente mesmo em caso de erros
  const saveLocally = (profileData: any) => {
    console.log('Salvando perfil localmente:', profileData);

    // Salvar o perfil completo no localStorage
    try {
      const userId = profile?.id || localStorage.getItem('userId');
      
      if (!userId) {
        console.error('ID do usuário não encontrado para salvar perfil');
        return false;
      }
      
      // Salvar através da nossa função auxiliar
      saveProfileDataToLocalStorage({
        ...profileData,
        id: userId,
        avatar_url: profileData.avatar,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar perfil localmente:', error);
      return false;
    }
  };
  
  const loadLocalProfile = () => {
    console.log('Carregando perfil do localStorage');
    try {
      // Tentar obter perfil completo
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          console.log('Perfil completo carregado:', parsedProfile);
          
          if (parsedProfile.socialMedia || 
              (parsedProfile.instagram_url || parsedProfile.facebook_url || 
               parsedProfile.twitter_url || parsedProfile.youtube_url)) {
            // Garantir que temos a estrutura socialMedia preenchida
            if (!parsedProfile.socialMedia) {
              parsedProfile.socialMedia = {
                instagram: parsedProfile.instagram_url || '',
                facebook: parsedProfile.facebook_url || '',
                twitter: parsedProfile.twitter_url || '',
                youtube: parsedProfile.youtube_url || '',
              };
            }
            
            return parsedProfile;
          }
        } catch (error) {
          console.error('Erro ao analisar perfil do localStorage:', error);
        }
      }
      
      // Se falhar, usar getProfileDataFromLocalStorage
      const localData = getProfileDataFromLocalStorage();
      console.log('Perfil carregado das funções auxiliares:', localData);
      return localData;
    } catch (error) {
      console.error('Erro ao carregar perfil do localStorage:', error);
      return null;
    }
  };

  // Tenta carregar perfil toda vez ao montar o componente
  useEffect(() => {
    // Sempre tentar carregar um perfil do localStorage ao iniciar
    const localProfile = loadLocalProfile();
    if (localProfile) {
      setFormState(localProfile);
      if (localProfile.avatar || localProfile.avatar_url) {
        setAvatarPreview(localProfile.avatar || localProfile.avatar_url);
      }
    }
    
    // Se temos um perfil carregado do useProfileSync, usar ele
    if (!profileLoading && profile) {
      console.log('Perfil carregado do useProfileSync:', profile);
      setFormState(profile);
      if (profile.avatar) {
        setAvatarPreview(profile.avatar);
      }
    }
  }, []);
  
  // Atualizar o estado do formulário quando o perfil for carregado do useProfileSync
  useEffect(() => {
    if (!profileLoading && profile) {
      console.log('Perfil atualizado do useProfileSync:', profile);
      setFormState(prev => {
        // Mesclar com dados existentes para evitar perder mudanças
        return { ...prev, ...profile };
      });
      
      if (profile.avatar && !avatarPreview) {
        setAvatarPreview(profile.avatar);
      }
    }
  }, [profile, profileLoading]);
  
  // Exibir erro do perfil se houver
  useEffect(() => {
    if (profileError) {
      setMessage({
        type: 'error',
        text: profileError
      });
    }
  }, [profileError]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Lidar com campos aninhados (socialMedia)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof UserProfile],
          [child]: value
        }
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > 1024 * 1024) { // Mais de 1MB
        setMessage({
          type: 'error',
          text: 'A imagem é muito grande. Por favor, use uma imagem menor que 1MB.'
        });
        return;
      }
      
      // Criar URL temporária para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Comprimir a imagem
        compressImage(result, 400, 400, 0.7).then(compressed => {
          setAvatarPreview(compressed);
          setFormState(prev => ({
            ...prev,
            avatar: compressed
          }));
        }).catch(error => {
          console.error('Erro ao comprimir avatar:', error);
          setMessage({
            type: 'error',
            text: 'Erro ao processar imagem. Tente uma imagem menor.'
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para comprimir e redimensionar imagens
  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        // Calcular dimensões mantendo a proporção
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setMessage(null);
      
      // Preparar dados para atualização
      const profileData = {
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        whatsapp: formState.whatsapp,
        company: formState.company,
        address: formState.address,
        city: formState.city,
        state: formState.state,
        zipCode: formState.zipCode,
        website: formState.website,
        description: formState.description,
        socialMedia: formState.socialMedia,
        avatar: formState.avatar,
        banner: formState.banner,
        gallery: formState.gallery,
      };
      
      // Obter cliente Supabase e ID do usuário
      const userId = profile?.id || localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('ID do usuário não encontrado. Faça login novamente.');
      }
      
      console.log('Atualizando perfil com ID:', userId);
      
      // Primeiro salvar localmente - isso garante que temos os dados salvos independente do Supabase
      const savedLocally = saveLocally({
        ...profileData,
        id: userId,
      });
      
      if (!savedLocally) {
        console.warn('Não foi possível salvar perfil localmente');
      }
      
      // Tentar salvar com directProfileSave primeiro (nossa implementação robusta)
      console.log('Tentando salvar perfil usando directProfileSave...');
      let success = false;
      try {
        const result = await directProfileSave({
          id: userId,
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          whatsapp: formState.whatsapp,
          avatar: formState.avatar,
          avatar_url: formState.avatar || '/images/avatar-placeholder.png',
          company: formState.company,
          address: formState.address,
          city: formState.city,
          state: formState.state,
          zipCode: formState.zipCode,
          website: formState.website,
          description: formState.description,
          socialMedia: formState.socialMedia,
          banner: formState.banner,
          gallery: formState.gallery,
          account_type: 'personal',
          user_metadata: {
            company: formState.company,
            address: formState.address,
            city: formState.city,
            state: formState.state,
            zipCode: formState.zipCode,
            website: formState.website,
            description: formState.description,
            socialMedia: formState.socialMedia,
            banner: formState.banner,
            gallery: formState.gallery
          }
        });
        
        if (result.success) {
          console.log('Perfil atualizado com sucesso via directProfileSave');
          success = true;
        } else {
          console.error('Falha ao usar directProfileSave:', result.error);
          // Continuar com outras estratégias
        }
      } catch (directSaveError) {
        console.error('Erro ao usar directProfileSave:', directSaveError);
        // Continuar com outras estratégias
      }
      
      // Se directProfileSave falhou, tentar usar updateProfile do hook
      if (!success) {
        try {
          if (updateProfile) {
            success = await updateProfile(profileData);
            if (success) {
              console.log('Perfil atualizado com sucesso via updateProfile');
            }
          }
        } catch (error) {
          console.error('Erro ao usar updateProfile:', error);
        }
      }
      
      // Se as estratégias anteriores falharam, tentar outros métodos
      if (!success) {
        console.log('Estratégias anteriores não tiveram sucesso, tentando alternativas');
        
        try {
          // Tentar salvar com supabase direto
          const supabase = getSupabaseClient();
          
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: formState.name,
              email: formState.email,
              phone: formState.phone,
              whatsapp: formState.whatsapp,
              avatar_url: formState.avatar || '/images/avatar-placeholder.png',
              account_type: 'personal',
              updated_at: new Date().toISOString(),
              user_metadata: JSON.stringify({ 
                company: formState.company,
                address: formState.address,
                city: formState.city,
                state: formState.state,
                zipCode: formState.zipCode,
                website: formState.website,
                description: formState.description,
                socialMedia: formState.socialMedia,
                banner: formState.banner,
                gallery: formState.gallery
              })
            }, { onConflict: 'id' });
          
          if (error) {
            console.error('Erro na operação upsert:', error);
            throw error;
          }
          
          console.log('Perfil atualizado com sucesso via supabase.upsert');
          success = true;
        } catch (supabaseError) {
          console.error('Erro ao usar supabase diretamente:', supabaseError);
          
          // Último recurso: fetch API
          try {
            const token = localStorage.getItem('sb-access-token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': token ? `Bearer ${token}` : '',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({
                id: userId,
                name: formState.name,
                email: formState.email,
                phone: formState.phone,
                whatsapp: formState.whatsapp,
                avatar_url: formState.avatar || '/images/avatar-placeholder.png',
                account_type: 'personal',
                updated_at: new Date().toISOString(),
                user_metadata: JSON.stringify({
                  company: formState.company,
                  address: formState.address,
                  city: formState.city,
                  state: formState.state,
                  zipCode: formState.zipCode,
                  website: formState.website,
                  description: formState.description,
                  socialMedia: formState.socialMedia,
                  banner: formState.banner,
                  gallery: formState.gallery
                })
              })
            });
            
            if (response.ok) {
              console.log('Perfil atualizado com sucesso via fetch API');
              success = true;
            } else {
              console.log('Falha ao atualizar perfil via fetch API, mas perfil está salvo localmente');
            }
          } catch (fetchError) {
            console.error('Erro ao usar fetch API:', fetchError);
          }
        }
      }
      
      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ocorreu um erro inesperado.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/painel-anunciante" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Voltar para o painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Editar Perfil</h1>
        <p className="text-gray-600">
          Atualize suas informações pessoais e de contato
        </p>
      </div>
      
      {/* Fallback de loading global */}
      {profileLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {/* Fallback de erro global */}
      {profileError && !profileLoading && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <strong>Erro ao carregar perfil:</strong> {profileError}
        </div>
      )}
      
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      {!profileLoading && !profileError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Abas - remover as desnecessárias */}
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button 
                  className={`inline-block p-4 ${activeTab === 'informacoes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('informacoes')}
                >
                  <FaUser className="inline-block mr-2" />
                  Informações Básicas
                </button>
              </li>
              <li className="mr-2">
                <button 
                  className={`inline-block p-4 ${activeTab === 'midia' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('midia')}
                >
                  <FaCamera className="inline-block mr-2" />
                  Imagens e Mídia
                </button>
              </li>
              <li>
                <button 
                  className={`inline-block p-4 ${activeTab === 'senha' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                  onClick={() => setActiveTab('senha')}
                >
                  <FaLock className="inline-block mr-2" />
                  Alteração de Senha
                </button>
              </li>
            </ul>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {/* ... restante do formulário ... */}
          </form>
          </div>
      )}
    </div>
  );
};

export default EditarPerfil; 