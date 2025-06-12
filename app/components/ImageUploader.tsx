import React, { useState, useRef } from 'react';
import { FaCamera, FaUpload, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageSelect: (imageBase64: string) => void;
  currentImage?: string;
  className?: string;
  placeholderImage?: string;
  title?: string;
  aspectRatio?: number; // Proporção largura/altura (ex: 1 para quadrado, 16/9 para paisagem)
  maxWidth?: number;
  maxHeight?: number;
}

const DEFAULT_MAX_SIZE = 1024 * 1024; // 1MB
const DEFAULT_MAX_WIDTH = 800;
const DEFAULT_MAX_HEIGHT = 800;
const DEFAULT_QUALITY = 0.7;

// Função para limpar URLs de imagens com aspas extras
const cleanImageUrl = (url: string): string => {
  if (!url) return '/images/placeholder.jpg';
  
  // Limpar aspas extras e caracteres de escape
  let cleanUrl = url;
  if (typeof url === 'string') {
    // Remover aspas duplas extras e caracteres de escape
    cleanUrl = url.replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, '');
    
    // Se após a limpeza ainda tiver aspas, fazer nova tentativa
    if (cleanUrl.includes('\"')) {
      cleanUrl = cleanUrl.replace(/\"/g, '');
    }
  }
  
  return cleanUrl;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  currentImage,
  className = '',
  placeholderImage = '/images/placeholder.jpg',
  title = 'Selecionar imagem',
  aspectRatio = 1,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT
}) => {
  const [preview, setPreview] = useState<string>(currentImage || placeholderImage);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para comprimir e redimensionar imagens
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Calcular dimensões mantendo a proporção
          let width = img.width;
          let height = img.height;
          
          // Redimensionar se exceder as dimensões máximas
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
          
          // Criar canvas para desenhar a imagem redimensionada
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível obter contexto do canvas'));
            return;
          }
          
          // Desenhar a imagem no canvas com as novas dimensões
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para base64 com compressão
          const compressedImage = canvas.toDataURL('image/jpeg', DEFAULT_QUALITY);
          resolve(compressedImage);
        };
        
        img.onerror = () => {
          reject(new Error('Erro ao carregar a imagem'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar o tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    // Verificar tamanho do arquivo (antes da compressão)
    if (file.size > DEFAULT_MAX_SIZE * 5) { // 5MB limite antes da compressão
      alert('Imagem muito grande. Por favor, selecione uma imagem menor que 5MB.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Comprimir e redimensionar a imagem
      const compressedImage = await compressImage(file);
      
      // Verificar o tamanho aproximado da string base64
      const base64Size = compressedImage.length * (3/4); // Estimativa aproximada
      
      if (base64Size > DEFAULT_MAX_SIZE) {
        alert(`A imagem ainda é muito grande (${Math.round(base64Size/1024)}KB). Tente uma imagem menor ou com menos detalhes.`);
        setIsLoading(false);
        return;
      }
      
      // Atualizar preview e notificar o componente pai
      setPreview(compressedImage);
      onImageSelect(compressedImage);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(placeholderImage);
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`relative cursor-pointer border-2 border-dashed border-gray-300 rounded-lg overflow-hidden ${className}`}
      onClick={handleClick}
      style={{ aspectRatio: aspectRatio.toString() }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <Image 
            src={cleanImageUrl(preview)} 
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 hover:scale-105"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity">
            <FaUpload className="text-white text-3xl mb-2" />
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
          
          {preview !== placeholderImage && (
            <button 
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-80 hover:opacity-100"
              onClick={handleRemove}
            >
              <FaTrash size={14} />
            </button>
          )}
        </>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader; 