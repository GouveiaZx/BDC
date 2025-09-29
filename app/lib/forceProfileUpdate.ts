// Função para forçar atualização dos dados do perfil
export const forceProfileUpdate = async (userId: string) => {
  try {
    console.log('🔄 Forçando atualização do perfil para:', userId);
    
    // Buscar dados atualizados da API
    const response = await fetch(`/api/profile/complete?userId=${userId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Dados atualizados recebidos:', data.profile);
      
      // Atualizar localStorage com dados mais recentes
      if (typeof window !== 'undefined') {
        const profile = data.profile;
        const businessProfile = profile.businessProfile;
        
        // Atualizar dados básicos
        localStorage.setItem('userName', profile.name || '');
        localStorage.setItem('userEmail', profile.email || '');
        localStorage.setItem('userPhone', profile.phone || '');
        localStorage.setItem('userWhatsapp', profile.whatsapp || '');
        localStorage.setItem('userAvatar', profile.avatar_url || '');
        
        // Atualizar dados de empresa
        if (businessProfile) {
          localStorage.setItem('userCompany', businessProfile.company_name || '');
          localStorage.setItem('userWebsite', businessProfile.website || '');
          localStorage.setItem('userInstagram', businessProfile.instagram || '');
          localStorage.setItem('userFacebook', businessProfile.facebook || '');
          localStorage.setItem('userTwitter', businessProfile.twitter || '');
          localStorage.setItem('userYoutube', businessProfile.metadata?.youtube || '');
        }
        
        // Atualizar dados das redes sociais
        if (profile.socialMedia) {
          localStorage.setItem('userInstagram', profile.socialMedia.instagram || '');
          localStorage.setItem('userFacebook', profile.socialMedia.facebook || '');
          localStorage.setItem('userTwitter', profile.socialMedia.twitter || '');
          localStorage.setItem('userYoutube', profile.socialMedia.youtube || '');
          localStorage.setItem('userWebsite', profile.socialMedia.website || profile.website || '');
        }
        
        console.log('✅ localStorage atualizado com dados mais recentes');
      }
      
      return data.profile;
    } else {
      console.error('❌ Erro ao buscar dados atualizados:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao forçar atualização:', error);
    return null;
  }
};

// Função para verificar se os dados estão atualizados
export const checkProfileData = async (userId: string) => {
  try {
    const response = await fetch(`/api/profile/complete?userId=${userId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const profile = data.profile;
      const businessProfile = profile.businessProfile;
      
      console.log('🔍 Verificação dos dados do perfil:');
      console.log('- Nome:', profile.name);
      console.log('- Email:', profile.email);
      console.log('- Empresa:', businessProfile?.company_name);
      console.log('- Website:', businessProfile?.website || profile.website);
      console.log('- Instagram:', businessProfile?.instagram || profile.socialMedia?.instagram);
      console.log('- Facebook:', businessProfile?.facebook || profile.socialMedia?.facebook);
      console.log('- Twitter:', businessProfile?.twitter || profile.socialMedia?.twitter);
      console.log('- YouTube:', businessProfile?.metadata?.youtube || profile.socialMedia?.youtube);
      
      return {
        hasBusinessProfile: !!businessProfile,
        hasSocialMedia: !!(
          businessProfile?.instagram || 
          businessProfile?.facebook || 
          businessProfile?.twitter || 
          businessProfile?.website ||
          businessProfile?.metadata?.youtube
        ),
        data: profile
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    return null;
  }
}; 