// Funções para salvar e recuperar dados do perfil no localStorage

// Função para criar ID permanente para perfis temporários baseado no email ou outro identificador
export const createPermanentTestId = (email: string) => {
  // Extrair uma parte do email para usar como base do identificador
  const baseId = email.split('@')[0].toLowerCase();
  
  // Criar um UUID v4 compatível baseado no email
  return 'test-' + baseId.substring(0, 8) + '-' + 
    Math.random().toString(36).substring(2, 6) + '-4' +
    Math.random().toString(36).substring(2, 5) + '-' +
    (8 + Math.floor(Math.random() * 4)).toString() +
    Math.random().toString(36).substring(2, 4) + '-' +
    Math.random().toString(36).substring(2, 12);
};

export const saveProfileDataToLocalStorage = (data: any) => {
  if (typeof window !== 'undefined') {
    // ID especial para testes - para criar um perfil estável
    const isDevMode = process.env.NODE_ENV === 'development';
    const userId = data.id || localStorage.getItem('userId');
    
    // Se for ID temporário e estiver em modo de desenvolvimento, salvar como se fosse perfil completo
    if (userId && userId.startsWith('temp-id-') && isDevMode) {
      // Salvar flag de perfil de teste
      localStorage.setItem('isTestProfile', 'true');
    }
    
    // Salvar o objeto completo do perfil
    try {
      const profileData = {
        ...data,
        id: userId,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('userProfile', JSON.stringify(profileData));
    } catch (error) {
      console.error('Erro ao salvar perfil completo:', error);
    }
    
    // Salvar informações básicas do perfil em campos individuais para redundância
    if (data.id) localStorage.setItem('userId', data.id);
    if (data.name) localStorage.setItem('userName', data.name);
    if (data.email) localStorage.setItem('userEmail', data.email);
    if (data.avatar_url) localStorage.setItem('userAvatar', data.avatar_url);
    if (data.avatar) localStorage.setItem('userAvatar', data.avatar);
    if (data.bio) localStorage.setItem('userBio', data.bio);
    if (data.description) localStorage.setItem('userBio', data.description);
    if (data.phone) localStorage.setItem('userPhone', data.phone);
    if (data.whatsapp) localStorage.setItem('userWhatsapp', data.whatsapp);
    if (data.location) localStorage.setItem('userLocation', data.location);
    if (data.city) localStorage.setItem('userCity', data.city);
    if (data.state) localStorage.setItem('userState', data.state);
    if (data.zipCode) localStorage.setItem('userZipCode', data.zipCode);
    if (data.company) localStorage.setItem('userCompany', data.company);
    if (data.address) localStorage.setItem('userAddress', data.address);
    if (data.website) localStorage.setItem('userWebsite', data.website);
    if (data.created_at) localStorage.setItem('userCreatedAt', data.created_at);
    if (data.banner) localStorage.setItem('userBanner', data.banner);
    if (data.banner_url) localStorage.setItem('userBanner', data.banner_url);
    
    // Salvar redes sociais
    if (data.socialMedia) {
      if (data.socialMedia.facebook) localStorage.setItem('userFacebook', data.socialMedia.facebook);
      if (data.socialMedia.instagram) localStorage.setItem('userInstagram', data.socialMedia.instagram);
      if (data.socialMedia.twitter) localStorage.setItem('userTwitter', data.socialMedia.twitter);
      if (data.socialMedia.youtube) localStorage.setItem('userYoutube', data.socialMedia.youtube);
    } else {
      // Retrocompatibilidade com formato antigo
      if (data.facebook_url) localStorage.setItem('userFacebook', data.facebook_url);
      if (data.instagram_url) localStorage.setItem('userInstagram', data.instagram_url);
      if (data.twitter_url) localStorage.setItem('userTwitter', data.twitter_url);
      if (data.website_url) localStorage.setItem('userWebsite', data.website_url);
    }
    
    // Para ambiente de desenvolvimento, salvar configurações adicionais para teste
    if (isDevMode) {
      // Se não tiver valores definidos, usar padrões para testes
      localStorage.setItem('userIsVerified', 'true');
      localStorage.setItem('userSubscriptionPlan', data.subscription_plan || 'premium');
      localStorage.setItem('userRating', data.rating?.toString() || '4.8');
    }
    
    // Salvar flag para indicar que temos um perfil no localStorage
    localStorage.setItem('hasUserProfile', 'true');
    localStorage.setItem('userProfileLastUpdated', Date.now().toString());
    
    console.log('Dados do perfil salvos no localStorage com sucesso');
  }
};

export const getProfileDataFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const isDevMode = process.env.NODE_ENV === 'development';
    const isTestProfile = localStorage.getItem('isTestProfile') === 'true';
    
    // Tentar recuperar o perfil completo primeiro
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        console.log('Perfil completo recuperado do localStorage');
        return parsedProfile;
      }
    } catch (error) {
      console.error('Erro ao recuperar perfil completo do localStorage:', error);
    }
    
    // Se não tiver perfil completo, montar a partir dos campos individuais
    console.log('Construindo perfil a partir de campos individuais do localStorage');
    
    const userId = localStorage.getItem('userId');
    const socialMedia = {
      instagram: localStorage.getItem('userInstagram') || '',
      facebook: localStorage.getItem('userFacebook') || '',
      twitter: localStorage.getItem('userTwitter') || '',
      youtube: localStorage.getItem('userYoutube') || '',
    };
    
    return {
      id: userId || '',
      name: localStorage.getItem('userName') || '',
      email: localStorage.getItem('userEmail') || '',
      avatar_url: localStorage.getItem('userAvatar') || '/images/avatar-placeholder.png',
      avatar: localStorage.getItem('userAvatar') || '/images/avatar-placeholder.png',
      bio: localStorage.getItem('userBio') || '',
      description: localStorage.getItem('userBio') || '',
      phone: localStorage.getItem('userPhone') || '',
      whatsapp: localStorage.getItem('userWhatsapp') || '',
      location: localStorage.getItem('userLocation') || '',
      city: localStorage.getItem('userCity') || '',
      state: localStorage.getItem('userState') || '',
      zipCode: localStorage.getItem('userZipCode') || '',
      company: localStorage.getItem('userCompany') || '',
      address: localStorage.getItem('userAddress') || '',
      website: localStorage.getItem('userWebsite') || '',
      created_at: localStorage.getItem('userCreatedAt') || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      facebook_url: localStorage.getItem('userFacebook') || '',
      instagram_url: localStorage.getItem('userInstagram') || '',
      twitter_url: localStorage.getItem('userTwitter') || '',
      website_url: localStorage.getItem('userWebsite') || '',
      youtube_url: localStorage.getItem('userYoutube') || '',
      socialMedia,
      banner: localStorage.getItem('userBanner') || '',
      banner_url: localStorage.getItem('userBanner') || '',
      gallery: [],
      is_verified: isDevMode && isTestProfile ? true : (localStorage.getItem('userIsVerified') === 'true'),
      subscription_plan: isDevMode && isTestProfile ? 'premium' : localStorage.getItem('userSubscriptionPlan') || 'free',
      rating: parseFloat(localStorage.getItem('userRating') || '0'),
      account_type: 'personal'
    };
  }
  return {};
}; 