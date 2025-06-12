'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaArrowLeft, FaBuilding, FaMapMarkerAlt, FaPhone, 
  FaWhatsapp, FaEnvelope, FaGlobe, FaClock, FaCamera, 
  FaMapMarked, FaStore, FaInstagram, FaFacebook
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function MinhaEmpresa() {
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('MA');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [hasMap, setHasMap] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const categories = [
    'Loja', 'Restaurante', 'Serviços', 'Escritório', 'Consultório', 
    'Salão de Beleza', 'Academia', 'Oficina', 'Outro'
  ];
  
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
  
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página de perfil unificada
    router.push('/painel-anunciante/meu-perfil');
  }, [router]);
  
  useEffect(() => {
    // Carregar dados da empresa
    const loadCompanyData = async () => {
      try {
        // Em um app real, você buscaria da API
        // const response = await fetch('/api/company/profile');
        // const data = await response.json();
        
        // Simular dados recuperados de localStorage/API
        const storedCompanyName = localStorage.getItem('companyName') || '';
        const storedDescription = localStorage.getItem('companyDescription') || '';
        const storedCategory = localStorage.getItem('companyCategory') || '';
        const storedLogo = localStorage.getItem('companyLogo') || '';
        const storedCoverPhoto = localStorage.getItem('companyCoverPhoto') || '';
        const storedAddress = localStorage.getItem('companyAddress') || '';
        const storedNeighborhood = localStorage.getItem('companyNeighborhood') || '';
        const storedCity = localStorage.getItem('companyCity') || 'Barra do Corda';
        const storedState = localStorage.getItem('companyState') || 'MA';
        const storedPhone = localStorage.getItem('companyPhone') || '';
        const storedWhatsapp = localStorage.getItem('companyWhatsapp') || '';
        const storedEmail = localStorage.getItem('companyEmail') || '';
        const storedWebsite = localStorage.getItem('companyWebsite') || '';
        const storedInstagram = localStorage.getItem('companyInstagram') || '';
        const storedFacebook = localStorage.getItem('companyFacebook') || '';
        const storedOpeningHours = localStorage.getItem('companyOpeningHours') || '';
        const storedMapUrl = localStorage.getItem('companyMapUrl') || '';
        
        setCompanyName(storedCompanyName);
        setDescription(storedDescription);
        setCategory(storedCategory);
        setAddress(storedAddress);
        setNeighborhood(storedNeighborhood);
        setCity(storedCity);
        setState(storedState);
        setPhone(storedPhone);
        setWhatsapp(storedWhatsapp);
        setEmail(storedEmail);
        setWebsite(storedWebsite);
        setInstagram(storedInstagram);
        setFacebook(storedFacebook);
        setOpeningHours(storedOpeningHours);
        setMapUrl(storedMapUrl);
        setHasMap(!!storedMapUrl);
        
        if (storedLogo) {
          setLogoPreview(storedLogo);
        }
        
        if (storedCoverPhoto) {
          setCoverPhotoPreview(storedCoverPhoto);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        setMessage({
          type: 'error',
          text: 'Não foi possível carregar os dados da sua empresa. Tente novamente mais tarde.'
        });
      }
    };
    
    loadCompanyData();
  }, []);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Comprimir a imagem
        compressImage(result, 200, 200, 0.7).then(compressed => {
          setLogoPreview(compressed);
        }).catch(error => {
          console.error('Erro ao comprimir logo:', error);
          setMessage({
            type: 'error',
            text: 'Erro ao processar imagem. Tente uma imagem menor.'
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > 2 * 1024 * 1024) { // Mais de 2MB
        setMessage({
          type: 'error',
          text: 'A imagem é muito grande. Por favor, use uma imagem menor que 2MB.'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Comprimir a imagem
        compressImage(result, 800, 300, 0.7).then(compressed => {
          setCoverPhotoPreview(compressed);
        }).catch(error => {
          console.error('Erro ao comprimir capa:', error);
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
  
  // Verificar espaço disponível no localStorage
  const checkStorageQuota = (key: string, value: string): boolean => {
    try {
      // Testar se podemos salvar sem exceder a quota
      localStorage.setItem('__test_quota', '0');
      localStorage.removeItem('__test_quota');
      
      // Calcular o tamanho aproximado em bytes dos dados
      const valueSize = new Blob([value]).size;
      const totalSize = calculateLocalStorageSize();
      
      // A maioria dos navegadores tem limite de ~5MB
      const MAX_SIZE = 4 * 1024 * 1024; // 4MB para ter margem de segurança
      
      if ((totalSize + valueSize) > MAX_SIZE) {
        console.warn(`Armazenamento quase cheio: ${(totalSize/1024/1024).toFixed(2)}MB + ${(valueSize/1024/1024).toFixed(2)}MB de ${(MAX_SIZE/1024/1024).toFixed(2)}MB`);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Erro ao verificar quota:', e);
      return false;
    }
  };
  
  // Função auxiliar para calcular tamanho atual do localStorage
  const calculateLocalStorageSize = (): number => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
    return total * 2; // Aproximado - caracteres em JavaScript são UTF-16 (2 bytes)
  };
  
  const saveToLocalStorage = (key: string, value: string): boolean => {
    try {
      // Verificar se há espaço
      if (!checkStorageQuota(key, value)) {
        throw new Error('Espaço de armazenamento insuficiente');
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`Erro ao salvar ${key}:`, e);
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Simular uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar dados no localStorage com verificação de espaço
      let allSaved = true;
      
      // Salvar dados de texto primeiro (menores)
      allSaved = saveToLocalStorage('companyName', companyName) && allSaved;
      allSaved = saveToLocalStorage('companyDescription', description) && allSaved;
      allSaved = saveToLocalStorage('companyCategory', category) && allSaved;
      allSaved = saveToLocalStorage('companyAddress', address) && allSaved;
      allSaved = saveToLocalStorage('companyNeighborhood', neighborhood) && allSaved;
      allSaved = saveToLocalStorage('companyCity', city) && allSaved;
      allSaved = saveToLocalStorage('companyState', state) && allSaved;
      allSaved = saveToLocalStorage('companyPhone', phone) && allSaved;
      allSaved = saveToLocalStorage('companyWhatsapp', whatsapp) && allSaved;
      allSaved = saveToLocalStorage('companyEmail', email) && allSaved;
      allSaved = saveToLocalStorage('companyWebsite', website) && allSaved;
      allSaved = saveToLocalStorage('companyInstagram', instagram) && allSaved;
      allSaved = saveToLocalStorage('companyFacebook', facebook) && allSaved;
      allSaved = saveToLocalStorage('companyOpeningHours', openingHours) && allSaved;
      
      if (hasMap && mapUrl) {
        allSaved = saveToLocalStorage('companyMapUrl', mapUrl) && allSaved;
      } else {
        localStorage.removeItem('companyMapUrl');
      }
      
      // Salvar imagens por último (maiores)
      if (logoPreview) {
        allSaved = saveToLocalStorage('companyLogo', logoPreview) && allSaved;
      }
      
      if (coverPhotoPreview) {
        allSaved = saveToLocalStorage('companyCoverPhoto', coverPhotoPreview) && allSaved;
      }
      
      if (!allSaved) {
        throw new Error('Não foi possível salvar todos os dados. Espaço de armazenamento insuficiente.');
      }
      
      setMessage({
        type: 'success',
        text: 'Perfil da empresa atualizado com sucesso!'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar perfil da empresa:', error);
      setMessage({
        type: 'error',
        text: 'Não foi possível atualizar o perfil da sua empresa. As imagens podem ser muito grandes para o armazenamento local.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      <p>Redirecionando para a página de perfil...</p>
    </div>
  );
} 