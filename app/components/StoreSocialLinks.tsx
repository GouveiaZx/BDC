'use client';

import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaGlobe, FaWhatsapp } from 'react-icons/fa';
import { Store } from '../models/types';
import { formatPhone } from '../utils/formatters';

interface StoreSocialLinksProps {
  store: Store;
}

export default function StoreSocialLinks({ store }: StoreSocialLinksProps) {
  // Verifica e formata os URLs de redes sociais
  const formatSocialUrl = (url: string | undefined, type: string) => {
    if (!url || url.trim() === '') return undefined;
    
    // Se já tiver http ou https, retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Formata URL baseado no tipo de rede social
    switch(type) {
      case 'facebook':
        return `https://facebook.com/${url}`;
      case 'instagram':
        return `https://instagram.com/${url.replace('@', '')}`;
      case 'twitter':
        return `https://twitter.com/${url.replace('@', '')}`;
      case 'youtube':
        return url.includes('/') 
          ? `https://youtube.com/${url}`
          : `https://youtube.com/channel/${url}`;
      case 'website':
        return url.includes('.') ? `https://${url}` : `https://${url}.com.br`;
      default:
        return url.includes('.') ? `https://${url}` : url;
    }
  };

  // Exibir informação para debug
  console.log('StoreSocialLinks - socialMedia:', store.socialMedia);
  console.log('StoreSocialLinks - contactInfo:', store.contactInfo);

  const socialLinks = [
    {
      name: 'Facebook',
      url: formatSocialUrl(store.socialMedia?.facebook, 'facebook'),
      icon: <FaFacebook className="h-5 w-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Instagram',
      url: formatSocialUrl(store.socialMedia?.instagram, 'instagram'),
      icon: <FaInstagram className="h-5 w-5" />,
      color: 'bg-pink-600 hover:bg-pink-700',
    },
    {
      name: 'Twitter',
      url: formatSocialUrl(store.socialMedia?.twitter, 'twitter'),
      icon: <FaTwitter className="h-5 w-5" />,
      color: 'bg-blue-400 hover:bg-blue-500',
    },
    {
      name: 'YouTube',
      url: formatSocialUrl(store.socialMedia?.youtube, 'youtube'),
      icon: <FaYoutube className="h-5 w-5" />,
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      name: 'Website',
      url: formatSocialUrl(store.socialMedia?.website, 'website'),
      icon: <FaGlobe className="h-5 w-5" />,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ].filter((link) => !!link.url);

  // Função para formatar número WhatsApp para URL
  const formatWhatsAppUrl = (phone: string) => {
    if (!phone || phone.trim() === '') return undefined;
    const cleanedNumber = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanedNumber}`;
  };

  // Verificar se existe pelo menos uma rede social antes de exibir o componente
  const hasAnySocialMedia = socialLinks.length > 0 || (store.contactInfo?.whatsapp && store.contactInfo.whatsapp.trim() !== '');

  if (!hasAnySocialMedia) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Redes Sociais</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center px-4 py-2 ${link.color} text-white rounded-md text-sm transition-colors`}
          >
            {link.icon}
            <span className="ml-2 text-white font-medium">{link.name}</span>
          </a>
        ))}
        
        {store.contactInfo?.whatsapp && store.contactInfo.whatsapp.trim() !== '' && (
          <a
            href={formatWhatsAppUrl(store.contactInfo.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors"
          >
            <FaWhatsapp className="h-5 w-5" />
            <span className="ml-2 text-white font-medium">WhatsApp</span>
          </a>
        )}
      </div>
      
      <div className="text-gray-600 text-sm">
        {store.contactPhone && (
          <div className="mb-1">
            <span className="font-medium">Telefone:</span> {formatPhone(store.contactPhone)}
          </div>
        )}
        
        {store.contactEmail && (
          <div>
            <span className="font-medium">Email:</span>{' '}
            <a href={`mailto:${store.contactEmail}`} className="text-blue-600 hover:underline">
              {store.contactEmail}
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 