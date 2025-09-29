"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaUpload, FaBuilding, FaClock, FaGlobe, FaInstagram, 
  FaFacebook, FaEdit, FaTrash, FaImage, FaCheck, FaCamera,
  FaInfo, FaPlay, FaPlusCircle, FaCrown, FaEye
} from 'react-icons/fa';
import { useProfileSync } from '../../lib/useProfileSync';
import { useSubscriptionSync } from '../../lib/useSubscriptionSync';
import { SubscriptionPlan } from '../../models/types';
import { getSupabaseClient } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../lib/utils';
import BusinessSectorSelector from '../../components/BusinessSectorSelector';
import Avatar from '../../components/Avatar';

export default function MeuPerfil() {
  const [activeTab, setActiveTab] = useState('informacoes');
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('/images/avatar-placeholder.png');
  const [bannerPreview, setBannerPreview] = useState('/images/banner-placeholder.jpg');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [stories, setStories] = useState<{id: number; thumbnail: string; url: string; active: boolean}[]>([]);
  const { profile, isLoading: profileLoading, error: profileError, updateProfile } = useProfileSync();
  const { plan, planName, validUntil, isLoading: loadingSubscription } = useSubscriptionSync();
  const [adsCount, setAdsCount] = useState(0);
  const [adsLimit, setAdsLimit] = useState(3);
  const [hasReachedAdLimit, setHasReachedAdLimit] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  // Estados para alterar senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaError, setSenhaError] = useState<string | null>(null);
  const [senhaSuccess, setSenhaSuccess] = useState<string | null>(null);
  const [isSenhaLoading, setIsSenhaLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  const [profileData, setProfileData] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    empresa: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    site: '',
    descricao: '',
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
    mostrarNomePessoal: true,
    horarios: {
      segunda: { aberto: true, inicio: '08:00', fim: '18:00' },
      terca: { aberto: true, inicio: '08:00', fim: '18:00' },
      quarta: { aberto: true, inicio: '08:00', fim: '18:00' },
      quinta: { aberto: true, inicio: '08:00', fim: '18:00' },
      sexta: { aberto: true, inicio: '08:00', fim: '18:00' },
      sabado: { aberto: true, inicio: '08:00', fim: '12:00' },
      domingo: { aberto: false, inicio: '00:00', fim: '00:00' },
    }
  });

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [businessSector, setBusinessSector] = useState<string>(profile?.business_sector || '');
  const [businessSectorId, setBusinessSectorId] = useState<string>(profile?.business_sector_id || '');
  const [businessSectorName, setBusinessSectorName] = useState<string>(profile?.business_sector || '');

  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser();
      if (data && data.user && data.user.id) {
        setAuthUserId(data.user.id);
      } else {
        setAuthUserId(null);
      }
    };
    fetchUserId();
  }, []);

  const getSafeUserId = () => {
    // Prioriza o userId autenticado
    if (authUserId) {
      return authUserId;
    }
    if (profile?.id) {
      return profile.id;
    }
    // Nunca usar localStorage se usuário está autenticado
    return null;
  };

  // Atualizar os dados do perfil quando o hook carregar
  useEffect(() => {
    if (profile && !profileLoading) {
      console.log('Carregando dados do perfil para edição:', profile);
      setProfileData({
        nome: profile.name || '',
        email: profile.email || '',
        telefone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        empresa: profile.company || '',
        endereco: profile.address || '',
        cidade: profile.city || '',
        estado: profile.state || '',
        cep: profile.zipCode || '',
        site: profile.website || '',
        descricao: profile.description || '',
        instagram: profile.socialMedia?.instagram || '',
        facebook: profile.socialMedia?.facebook || '',
        twitter: profile.socialMedia?.twitter || '',
        youtube: profile.socialMedia?.youtube || '',
        mostrarNomePessoal: profile.mostrarNomePessoal !== false,
        horarios: profileData.horarios // manter os horários existentes por enquanto
      });
      
      if (profile.avatar) {
        setAvatarPreview(profile.avatar);
      }
      
      if (profile.banner) {
        setBannerPreview(profile.banner);
      }
      
      if (profile.gallery && profile.gallery.length > 0) {
        setGalleryImages(profile.gallery);
      }

      setBusinessSector(profile.business_sector || '');
      setBusinessSectorId(profile.business_sector_id || '');
      setBusinessSectorName(profile.business_sector || '');
    }
  }, [profile, profileLoading]);

  // Carregar stories do localStorage ao iniciar
  useEffect(() => {
    const savedStories = localStorage.getItem('userStories');
    
    if (savedStories) {
      setStories(JSON.parse(savedStories));
    } else {
      // Inicializar com alguns stories de exemplo
      const defaultStories = [
        { id: 1, thumbnail: '/images/story-default-thumb.jpg', url: '#', active: true },
        { id: 2, thumbnail: '/images/story-default-thumb.jpg', url: '#', active: true },
        { id: 3, thumbnail: '/images/story-default-thumb.jpg', url: '#', active: false },
      ];
      setStories(defaultStories);
      localStorage.setItem('userStories', JSON.stringify(defaultStories));
    }
  }, []);

  // Verificar limite de anúncios
  useEffect(() => {
    // Simula uma chamada à API para buscar número de anúncios ativos
    // Em uma implementação real, isso viria de uma chamada de API
    const fetchAdsCount = async () => {
      try {
        // Simulação: definir limite baseado no plano
        if (plan) {
          let limit = 3; // FREE
          if (plan === SubscriptionPlan.MICRO_BUSINESS) limit = 4;
          if (plan === SubscriptionPlan.SMALL_BUSINESS) limit = 5;
          if (plan === SubscriptionPlan.BUSINESS_SIMPLE) limit = 10;
          if (plan === SubscriptionPlan.BUSINESS_PLUS) limit = 20;
          
          setAdsLimit(limit);
          
          // Simular contagem de anúncios (em uma app real, isso viria do backend)
          const mockCount = Math.floor(Math.random() * (limit + 2)); // Pode ultrapassar o limite para teste
          setAdsCount(mockCount);
          
          // Verificar se atingiu o limite
          setHasReachedAdLimit(mockCount >= limit);
        }
      } catch (error) {
        console.error('Erro ao buscar número de anúncios:', error);
      }
    };
    
    fetchAdsCount();
  }, [plan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Campo alterado: ${name} = ${value}`);
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, day: string) => {
    const { checked } = e.target;
    setProfileData({
      ...profileData,
      horarios: {
        ...profileData.horarios,
        [day]: {
          ...profileData.horarios[day as keyof typeof profileData.horarios],
          aberto: checked
        }
      }
    });
  };

  const handleHorarioChange = (dia: string, campo: string, valor: any) => {
    setProfileData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia as keyof typeof prev.horarios],
          [campo]: valor
        }
      }
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setBannerPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setGalleryImages([...galleryImages, ...newImages]);
    }
  };

  const handleGalleryRemove = (index: number) => {
    const newImages = [...galleryImages];
    newImages.splice(index, 1);
    setGalleryImages(newImages);
  };

  const handleStoryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Para uma implementação real, seria necessário fazer upload do vídeo para um servidor
      // Aqui, simulamos apenas criando URL locais
      const videoUrl = URL.createObjectURL(file);
      const thumbnailUrl = '/images/story-default-thumb.jpg'; // thumbnail padrão
      
      const newStory = {
        id: Date.now(),
        thumbnail: thumbnailUrl,
        url: videoUrl,
        active: true
      };
      
      setStories([...stories, newStory]);
    }
  };

  const handleStoryRemove = (id: number) => {
    setStories(stories.filter(story => story.id !== id));
  };

  const handleStoryToggle = (id: number) => {
    setStories(stories.map(story => 
      story.id === id ? { ...story, active: !story.active } : story
    ));
  };

  const handleBusinessSectorChange = (sectorId: string, sectorName: string) => {
    setBusinessSectorId(sectorId);
    setBusinessSectorName(sectorName);
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      console.log('Dados do perfil sendo salvos:', profileData);
      // Obter userId seguro
      const userId = getSafeUserId();
      if (!userId) {
        setToast({ show: true, message: 'Erro: usuário não autenticado.', type: 'error' });
        setIsLoading(false);
        return;
      }
      // Fazer upload das imagens no Supabase
      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;
      // Upload do avatar
      if (avatarPreview && avatarPreview !== '/images/avatar-placeholder.png' && avatarPreview !== profile?.avatar) {
        try {
          const uploadedAvatar = await uploadImageToSupabase(
            avatarPreview,
            'public',
            `profiles/${userId}`,
            userId
          );
          if (uploadedAvatar) {
            avatarUrl = uploadedAvatar;
            localStorage.setItem('userAvatarPreview', uploadedAvatar);
            console.log('Avatar salvo no localStorage:', uploadedAvatar, 'para userId:', userId);
          }
        } catch (error) {
          console.error('Erro ao fazer upload do avatar:', error, 'userId:', userId);
        }
      }
      // Upload do banner
      if (bannerPreview && bannerPreview !== '/images/banner-placeholder.jpg' && bannerPreview !== profile?.banner) {
        try {
          const uploadedBanner = await uploadImageToSupabase(
            bannerPreview,
            'public',
            `profiles/${userId}`,
            userId
          );
          if (uploadedBanner) {
            bannerUrl = uploadedBanner;
            localStorage.setItem('userBannerPreview', uploadedBanner);
            console.log('Banner salvo no localStorage:', uploadedBanner, 'para userId:', userId);
          }
        } catch (error) {
          console.error('Erro ao fazer upload do banner:', error, 'userId:', userId);
        }
      }
      // Atualizar o perfil com as URLs das imagens e dados do formulário
      const updatedProfileData = {
        name: profileData.nome,
        email: profileData.email,
        phone: profileData.telefone,
        whatsapp: profileData.whatsapp,
        company: profileData.empresa,
        address: profileData.endereco,
        city: profileData.cidade,
        state: profileData.estado,
        zipCode: profileData.cep,
        website: profileData.site,
        description: profileData.descricao,
        socialMedia: {
          instagram: profileData.instagram,
          facebook: profileData.facebook,
          twitter: profileData.twitter,
          youtube: profileData.youtube
        },
        mostrarNomePessoal: profileData.mostrarNomePessoal,
        avatar: avatarUrl,
        banner: bannerUrl,
        business_sector: businessSectorName,
        business_sector_id: businessSectorId,
        id: userId // garantir que o id correto seja enviado
      };
      console.log('Enviando dados atualizados para o servidor:', updatedProfileData);
      await updateProfile(updatedProfileData);
      // Salvar ramo de atividade via API dedicada
      if (businessSectorId || businessSectorName) {
        await fetch('/api/profile/business-sector', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            businessSectorId,
            businessSector: businessSectorName
          })
        });
      }
      setToast({ show: true, message: 'Perfil atualizado com sucesso!', type: 'success' });
      setEditMode(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setToast({ show: true, message: 'Erro ao atualizar perfil. Tente novamente.', type: 'error' });
      setIsLoading(false);
    }
  };

  // Função para alterar a senha
  const handleChangePassword = async () => {
    try {
      // Reiniciar estados
      setSenhaError(null);
      setSenhaSuccess(null);
      setIsSenhaLoading(true);
      
      // Validações
      if (!senhaAtual) {
        setSenhaError('A senha atual é obrigatória');
        setIsSenhaLoading(false);
        return;
      }
      
      if (!novaSenha) {
        setSenhaError('A nova senha é obrigatória');
        setIsSenhaLoading(false);
        return;
      }
      
      if (novaSenha !== confirmarSenha) {
        setSenhaError('A confirmação de senha não corresponde à nova senha');
        setIsSenhaLoading(false);
        return;
      }
      
      // Validar força da senha
      const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(novaSenha);
      if (!senhaForte) {
        setSenhaError('A senha deve ter pelo menos 8 caracteres e incluir letras maiúsculas, minúsculas e números');
        setIsSenhaLoading(false);
        return;
      }
      
      // Obter cliente Supabase
      const supabase = getSupabaseClient();
      
      // Verificar a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: senhaAtual
      });
      
      if (signInError) {
        console.error('Erro ao verificar senha atual:', signInError);
        setSenhaError('Senha atual incorreta. Por favor, verifique e tente novamente.');
        setIsSenhaLoading(false);
        return;
      }
      
      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) {
        console.error('Erro ao atualizar senha:', error);
        setSenhaError(`Erro ao atualizar senha: ${error.message}`);
        setIsSenhaLoading(false);
        return;
      }
      
      // Sucesso
      setSenhaSuccess('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setSenhaError('Ocorreu um erro ao tentar alterar sua senha. Tente novamente mais tarde.');
    } finally {
      setIsSenhaLoading(false);
    }
  };

  const tabs = [
    { id: 'informacoes', label: 'Informações Básicas' },
    { id: 'senha', label: 'Alteração de Senha' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Fallback de loading global */}
      {(profileLoading || loadingSubscription) && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando informações do perfil...</p>
          </div>
        </div>
      )}
      {/* Fallback de erro global */}
      {profileError && !profileLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Erro ao carregar perfil:</strong> {profileError}
        </div>
      )}
      {/* Fallback de erro de assinatura */}
      {!loadingSubscription && !plan && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
          <strong>Aviso:</strong> Não foi possível carregar informações de assinatura. Algumas funcionalidades podem estar indisponíveis.
        </div>
      )}
      {/* Renderização normal apenas se não estiver carregando nem em erro */}
      {!(profileLoading || loadingSubscription) && profile && (
      <div className="mb-8">
        <p className="text-gray-600">
          Configure seu perfil pessoal e da sua empresa para ter mais destaque nos anúncios.
        </p>
      </div>
      )}

      {/* Cabeçalho */}
      <div className="relative bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/painel-anunciante" className="mr-4 text-gray-500 hover:text-gray-700">
                <FaArrowLeft />
              </Link>
              <div className="flex items-center">
                <FaUser className="text-green-600 mr-2" />
                <h1 className="text-xl font-medium text-gray-800">Meu Perfil</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
            {!editMode ? (
              <>
                <Link 
                  href={`/loja/${profile?.id || ''}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600"
                >
                  <FaEye className="inline mr-1" /> Visualizar Perfil
                </Link>
                <button 
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-green-500 text-black rounded-md font-medium hover:bg-green-600"
                >
                  <FaEdit className="inline mr-1" /> Editar Perfil
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={saveChanges} 
                  className="bg-primary text-white px-4 py-2 rounded-md flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" /> Salvar Alterações
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setEditMode(false)} 
                  className="border border-gray-300 px-4 py-2 rounded-md text-gray-700"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Plano */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaCrown className="text-amber-500 mr-2" /> Seu Plano de Assinatura
                </h2>
                <button 
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FaCrown className="text-amber-500 mr-3 text-xl" />
                    <h2 className="text-lg font-semibold text-gray-800">Informações de Assinatura</h2>
                  </div>
                  
                  {loadingSubscription ? (
                    <div className="animate-pulse py-4">
                      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Plano atual:</p>
                        <p className="text-xl font-medium text-gray-800">{planName}</p>
                        
                        {validUntil && (
                          <div className="mt-2 flex items-center">
                            <span className="text-sm text-gray-600">Válido até: </span>
                            <span className="ml-1 text-sm font-medium text-gray-800">{validUntil}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Anúncios utilizados</span>
                          <span className="text-sm font-medium text-gray-700">{adsCount}/{adsLimit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${adsCount >= adsLimit ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${Math.min((adsCount / adsLimit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {hasReachedAdLimit && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                          <div className="flex items-start">
                            <FaInfo className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-gray-800 mb-1">Você atingiu o limite de anúncios do seu plano</h3>
                              <p className="text-sm text-gray-600 mb-2">
                                Seu plano atual permite até {adsLimit} anúncios ativos simultaneamente.
                                Para publicar mais anúncios, você pode fazer upgrade do seu plano ou adquirir anúncios extras.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-3">
                        <Link 
                          href="/painel-anunciante/assinatura"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                          Gerenciar assinatura
                        </Link>
                        
                        <Link 
                          href="/painel-anunciante/planos"
                          className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium transition-colors"
                        >
                          Ver outros planos
                        </Link>
                        
                        {hasReachedAdLimit && (
                          <Link 
                            href="/painel-anunciante/anuncio-extra"
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium transition-colors"
                          >
                            <FaPlusCircle className="inline mr-1" /> Anúncio extra
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Preview do perfil */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="relative h-48 w-full bg-gray-200">
            <Image 
              src={bannerPreview} 
              alt="Banner" 
              layout="fill" 
              objectFit="cover" 
            />
            {editMode && (
              <div className="absolute bottom-4 right-4">
                <label htmlFor="banner-upload" className="bg-white rounded-full p-3 cursor-pointer shadow-md hover:bg-gray-100">
                  <FaCamera className="text-gray-700" />
                  <input 
                    type="file" 
                    id="banner-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="p-6 relative">
            <div className="absolute -top-16 left-6 w-24 h-24 bg-white rounded-full border-4 border-white shadow-md overflow-hidden">
              <Avatar
                src={avatarPreview}
                alt="Avatar"
                size={96}
                fallbackName={profileData.nome || profileData.empresa}
                className="w-full h-full"
              />
              {editMode && (
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer">
                  <FaCamera className="text-white" />
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            <div className="ml-28">
              <h2 className="text-2xl font-bold text-gray-800">{profileData.empresa || profileData.nome}</h2>
              <p className="text-gray-600">{profileData.nome}</p>
              <div className="flex mt-3 text-sm text-gray-500">
                <p className="flex items-center mr-4"><FaMapMarkerAlt className="mr-1" /> {profileData.endereco}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação por abas */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-500'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo da aba selecionada */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'informacoes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="nome"
                      value={profileData.nome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.nome}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="empresa"
                      value={profileData.empresa}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.empresa}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="telefone"
                      value={profileData.telefone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.telefone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="whatsapp"
                      value={profileData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.whatsapp}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="cep"
                      value={profileData.cep}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.cep}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="endereco"
                      value={profileData.endereco}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.endereco}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="site"
                      value={profileData.site}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.site}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="instagram"
                      value={profileData.instagram}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.instagram}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="facebook"
                      value={profileData.facebook}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.facebook}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="twitter"
                      value={profileData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.twitter}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="youtube"
                      value={profileData.youtube}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-800">{profileData.youtube}</p>
                  )}
                </div>
                {editMode && (
                  <div className="md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <input
                        type="checkbox"
                        name="mostrarNomePessoal"
                        checked={profileData.mostrarNomePessoal}
                        onChange={(e) => setProfileData({...profileData, mostrarNomePessoal: e.target.checked})}
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Exibir meu nome pessoal no perfil público (abaixo do nome da empresa)
                    </label>
                  </div>
                )}
                {editMode && plan && plan.toString() !== SubscriptionPlan.FREE && (
                  <div className="md:col-span-2">
                    <BusinessSectorSelector
                      currentSector={businessSectorName}
                      currentSectorId={businessSectorId}
                      onSectorChange={handleBusinessSectorChange}
                      isPaidUser={plan !== SubscriptionPlan.FREE}
                    />
                  </div>
                )}
                {!editMode && businessSectorName && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ramo de Atividade</label>
                    <p className="text-gray-800">{businessSectorName}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição da Empresa
                </label>
                {editMode ? (
                  <textarea
                    name="descricao"
                    value={profileData.descricao}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.descricao}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'senha' && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Alterar Senha</h3>
              
              <div className="space-y-4 max-w-md">
                {senhaError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {senhaError}
                  </div>
                )}
                
                {senhaSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {senhaSuccess}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <button 
                  onClick={handleChangePassword}
                  disabled={isSenhaLoading}
                  className={`px-4 py-2 bg-green-500 text-black rounded-md font-medium hover:bg-green-600 ${isSenhaLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSenhaLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
              
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                <p className="flex items-start">
                  <FaInfo className="text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  Sua senha deve ter pelo menos 8 caracteres e incluir letras maiúsculas, minúsculas e números para maior segurança.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de limite de anúncios */}
      {hasReachedAdLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <FaInfo className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Você atingiu o limite de anúncios do seu plano</h3>
              <p className="text-sm text-gray-600 mb-2">
                Seu plano atual permite até {adsLimit} anúncios ativos simultaneamente.
                Para publicar mais anúncios, você pode fazer upgrade do seu plano ou adquirir anúncios extras.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link 
                  href="/painel-anunciante/planos" 
                  className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                >
                  <FaCrown className="mr-1" /> Fazer upgrade
                </Link>
                <Link 
                  href="/painel-anunciante/anuncio-extra" 
                  className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  <FaPlusCircle className="mr-1" /> Comprar anúncio extra
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}