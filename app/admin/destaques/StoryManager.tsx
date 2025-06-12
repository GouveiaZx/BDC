'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FaImage, FaVideo, FaLink, FaTrash, FaEdit, 
  FaEye, FaCheckCircle, FaTimesCircle, FaPlus,
  FaArrowUp, FaStar, FaExclamationCircle 
} from 'react-icons/fa';
import { Story, StoryMediaType, StoryPriority } from '../../models/types';

interface StoryManagerProps {
  stories?: Story[];
  onSave: (story: Partial<Story>) => Promise<void>;
  onDelete: (storyId: string) => Promise<void>;
  onSetPriority: (storyId: string, priority: StoryPriority) => Promise<void>;
}

export default function StoryManager({ 
  stories = [], 
  onSave, 
  onDelete,
  onSetPriority
}: StoryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [mediaType, setMediaType] = useState<StoryMediaType>(StoryMediaType.IMAGE);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [filteredStories, setFilteredStories] = useState<Story[]>(stories);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Atualizar stories filtrados quando filtro ou stories mudam
  useEffect(() => {
    const now = new Date();
    
    if (filter === 'active') {
      setFilteredStories(stories.filter(story => story.active && story.expiresAt > now));
    } else if (filter === 'expired') {
      setFilteredStories(stories.filter(story => !story.active || story.expiresAt <= now));
    } else {
      setFilteredStories([...stories].sort((a, b) => b.priority - a.priority));
    }
  }, [filter, stories]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar tipo de arquivo
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      setMediaType(StoryMediaType.IMAGE);
    } else if (fileType.startsWith('video/')) {
      setMediaType(StoryMediaType.VIDEO);
      
      // Verificar duração do vídeo
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        
        // Verificar se o vídeo tem mais de 1 minuto
        if (video.duration > 60) {
          setError('O vídeo deve ter no máximo 1 minuto de duração');
          setMediaFile(null);
          setMediaPreview('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      };
      
      video.src = URL.createObjectURL(file);
    } else {
      setError('Formato de arquivo não suportado. Use imagens ou vídeos.');
      return;
    }
    
    // Verificar tamanho (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('O arquivo é muito grande. Tamanho máximo: 20MB');
      return;
    }
    
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setError('');
  };
  
  const handleMediaTypeChange = (type: StoryMediaType) => {
    setMediaType(type);
    
    // Limpar preview e arquivo atual
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview('');
    }
    
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    
    if (!mediaFile && !editingStoryId) {
      setError('Selecione uma imagem ou vídeo');
      return;
    }
    
    try {
      setError('');
      
      let mediaUrl = '';
      
      // Se tiver um novo arquivo, fazer upload
      if (mediaFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Preparar FormData para upload
        const formData = new FormData();
        formData.append('file', mediaFile);
        formData.append('type', mediaType);
        formData.append('userId', 'admin'); // ID do admin
        
        // Upload real do arquivo
        try {
          // Mostrar progresso simulado enquanto faz o upload real
          const uploadInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(uploadInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);
          
          const uploadResponse = await fetch('/api/upload/media', {
            method: 'POST',
            body: formData
          });
          
          clearInterval(uploadInterval);
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${uploadResponse.status}: Falha ao fazer upload`);
          }
          
          const uploadResult = await uploadResponse.json();
          mediaUrl = uploadResult.url;
          
          setUploadProgress(100);
        } catch (err) {
          console.error('Erro ao fazer upload:', err);
          setError('Falha ao fazer upload do arquivo. Tente novamente.');
          setIsUploading(false);
          return;
        }
      } else if (editingStoryId) {
        // Manter a URL atual se estiver editando
        const currentStory = stories.find(s => s.id === editingStoryId);
        if (currentStory) {
          mediaUrl = currentStory.mediaUrl;
        }
      }
      
      // Dados para salvar
      const storyData: Partial<Story> = {
        title,
        link: link.trim() || undefined,
        mediaType,
        mediaUrl,
        priority: StoryPriority.ADMIN,
        userId: 'admin',
        userName: 'BuscaAquiBdC Admin',
        userAvatar: '/logo.png',
      };
      
      // Se estiver editando, incluir ID
      if (editingStoryId) {
        storyData.id = editingStoryId;
      }
      
      // Salvar através da função recebida por props
      await onSave(storyData);
      
      // Limpar formulário
      resetForm();
      setIsUploading(false);
      
    } catch (err) {
      console.error('Erro ao salvar destaque:', err);
      setError('Ocorreu um erro ao salvar o destaque. Tente novamente.');
      setIsUploading(false);
    }
  };
  
  const handleEdit = (story: Story) => {
    setEditingStoryId(story.id);
    setTitle(story.title);
    setLink(story.link || '');
    setMediaType(story.mediaType);
    setMediaPreview(story.mediaUrl);
  };
  
  const resetForm = () => {
    setTitle('');
    setLink('');
    setMediaType(StoryMediaType.IMAGE);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview('');
    }
    setMediaFile(null);
    setEditingStoryId(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handlePriorityChange = async (storyId: string, priority: StoryPriority) => {
    try {
      await onSetPriority(storyId, priority);
    } catch (err) {
      console.error('Erro ao alterar prioridade:', err);
      setError('Ocorreu um erro ao alterar a prioridade. Tente novamente.');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Destaques</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-md flex items-start">
          <FaExclamationCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Título do Destaque
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite um título para o destaque"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Link (opcional)
          </label>
          <div className="flex">
            <div className="flex-shrink-0 flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
              <FaLink className="text-gray-500" />
            </div>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://exemplo.com.br"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Tipo de Mídia
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleMediaTypeChange(StoryMediaType.IMAGE)}
              className={`flex items-center px-4 py-2 rounded-md ${
                mediaType === StoryMediaType.IMAGE
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <FaImage className="mr-2" /> Imagem
            </button>
            <button
              type="button"
              onClick={() => handleMediaTypeChange(StoryMediaType.VIDEO)}
              className={`flex items-center px-4 py-2 rounded-md ${
                mediaType === StoryMediaType.VIDEO
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <FaVideo className="mr-2" /> Vídeo
            </button>
          </div>
          {mediaType === StoryMediaType.VIDEO && (
            <p className="mt-2 text-sm text-gray-600">Vídeos devem ter no máximo 1 minuto de duração e até 20MB.</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            {mediaType === StoryMediaType.IMAGE ? 'Selecionar Imagem' : 'Selecionar Vídeo'}
          </label>
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={mediaType === StoryMediaType.IMAGE ? 'image/*' : 'video/*'}
              className="hidden"
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {mediaType === StoryMediaType.IMAGE ? 'Escolher Imagem' : 'Escolher Vídeo'}
            </label>
            {mediaFile && (
              <span className="ml-3 text-sm text-gray-600">
                {mediaFile.name}
              </span>
            )}
          </div>
        </div>
        
        {mediaPreview && (
          <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="text-sm text-gray-700 mb-2 font-medium">Preview:</p>
            {mediaType === StoryMediaType.IMAGE ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded-md"
              />
            ) : (
              <video
                ref={videoRef}
                src={mediaPreview}
                controls
                className="max-w-full h-auto max-h-64 rounded-md"
              />
            )}
          </div>
        )}
        
        {isUploading ? (
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">Enviando...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingStoryId ? 'Atualizar Destaque' : 'Adicionar Destaque'}
            </button>
            {editingStoryId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </form>
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Destaques Existentes</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'expired' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expirados
            </button>
          </div>
        </div>
        
        {filteredStories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum destaque encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStories.map(story => {
              const isExpired = new Date() > new Date(story.expiresAt);
              
              return (
                <div
                  key={story.id}
                  className={`border rounded-lg overflow-hidden ${
                    isExpired ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <div className="relative">
                    {story.mediaType === StoryMediaType.IMAGE ? (
                      <img
                        src={story.mediaUrl}
                        alt={story.title}
                        className={`w-full h-48 object-cover ${isExpired ? 'opacity-60' : ''}`}
                      />
                    ) : (
                      <video
                        src={story.mediaUrl}
                        className={`w-full h-48 object-cover ${isExpired ? 'opacity-60' : ''}`}
                        controls
                      />
                    )}
                    
                    {/* Badge de prioridade */}
                    {story.priority === StoryPriority.ADMIN && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        Admin
                      </div>
                    )}
                    
                    {story.priority === StoryPriority.FEATURED && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Destaque
                      </div>
                    )}
                    
                    {/* Badge de status */}
                    <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full ${
                      isExpired 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isExpired ? 'Expirado' : 'Ativo'}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium text-gray-800 mb-1">{story.title}</h4>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center mr-4">
                        <FaEye className="mr-1" /> {story.views}
                      </div>
                      <div>
                        {story.link ? (
                          <a 
                            href={story.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            <FaLink className="mr-1" /> Link
                          </a>
                        ) : (
                          <span>Sem link</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Criado em: {new Date(story.createdAt).toLocaleDateString('pt-BR')}
                      <br />
                      Expira em: {new Date(story.expiresAt).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(story)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        <FaEdit className="mr-1" /> Editar
                      </button>
                      
                      <button
                        onClick={() => onDelete(story.id)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        <FaTrash className="mr-1" /> Excluir
                      </button>
                      
                      {/* Botões de prioridade */}
                      {story.priority !== StoryPriority.ADMIN && (
                        <button
                          onClick={() => handlePriorityChange(story.id, StoryPriority.ADMIN)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                          title="Definir como prioridade de administrador"
                        >
                          <FaArrowUp className="mr-1" /> Admin
                        </button>
                      )}
                      
                      {story.priority !== StoryPriority.FEATURED && story.priority !== StoryPriority.ADMIN && (
                        <button
                          onClick={() => handlePriorityChange(story.id, StoryPriority.FEATURED)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                          title="Destacar"
                        >
                          <FaStar className="mr-1" /> Destacar
                        </button>
                      )}
                      
                      {story.priority !== StoryPriority.NORMAL && (
                        <button
                          onClick={() => handlePriorityChange(story.id, StoryPriority.NORMAL)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          title="Remover destaque"
                        >
                          Normal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 