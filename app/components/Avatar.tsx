import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  fallbackName?: string;
  onClick?: () => void;
  showBorder?: boolean;
  borderColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 40,
  className = '',
  fallbackName,
  onClick,
  showBorder = false,
  borderColor = 'border-gray-200'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Função para gerar iniciais do nome
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para gerar cor de fundo baseada no nome
  const getBackgroundColor = (name?: string) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleImageError = () => {
    setImageError(true);
    setImageSrc('/images/avatar-placeholder.svg');
  };

  // Mostrar fallback com iniciais apenas se não há imagem ou houve erro ao carregar uma imagem personalizada
  // Se a imagem é o placeholder padrão, mostrar a imagem padrão real
  const shouldShowFallback = !imageSrc || (imageError && imageSrc !== '/images/avatar-placeholder.svg' && imageSrc !== '/images/avatar-placeholder.png');

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${
        showBorder ? `border-2 ${borderColor}` : ''
      } ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {shouldShowFallback ? (
        // Fallback com iniciais
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-bold ${
            getBackgroundColor(fallbackName)
          }`}
          style={{ fontSize: size * 0.4 }}
        >
          {getInitials(fallbackName)}
        </div>
      ) : (
        // Imagem do avatar
        <Image
          src={imageSrc!}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={handleImageError}
          priority={size > 50} // Priorizar imagens maiores
        />
      )}
    </div>
  );
};

export default Avatar;