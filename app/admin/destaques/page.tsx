"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaImage, 
  FaCheck, 
  FaTimes, 
  FaPlus, 
  FaEye, 
  FaClock,
  FaTrash,
  FaPen,
  FaUpload,
  FaVideo,
  FaPhotoVideo,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaLink,
  FaUser,
  FaInfoCircle
} from 'react-icons/fa';
import { Highlight, HighlightModerationStatus } from '../../models/types';

// Tipos
type MediaType = 'image' | 'video';

type Story = {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
  author: {
    id: string;
    name: string;
    avatar: string;
    type: 'user' | 'admin' | 'store';
  };
};

export default function AdminDestaques() {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'admin'>('pending');
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Novo story
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'image' as MediaType,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Amanhã
  });

  // Mídia selecionada para preview
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filteredHighlights, setFilteredHighlights] = useState<Highlight[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Highlight,
    direction: 'asc' | 'desc'
  }>({ key: 'createdAt', direction: 'desc' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
  // Adicionar as variáveis de estado para as contagens
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  
  // Buscar dados reais do backend
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Determinar o parâmetro de status com base na tab ativa
        let statusParam = '';
        let adminParam = 'false'; // Por padrão, não mostrar destaques de admin
        
        if (activeTab === 'pending') {
          statusParam = 'pending';
        } else if (activeTab === 'approved') {
          statusParam = 'approved';
        } else if (activeTab === 'admin') {
          // Na tab de admin, buscar somente os destaques de admin
          statusParam = 'all';
          adminParam = 'true'; // Somente destaques de admin
        }
        
        // Buscar destaques da API com parâmetro admin=true para bypass de RLS
        const response = await fetch(`/api/destaques?status=${statusParam}&adminOnly=${adminParam}&admin=true`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error('Resposta não-OK da API:', response.status, response.statusText);
          const errorText = await response.text();
          throw new Error(`Erro ao buscar destaques: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Resposta completa da API:', data);
        
        if (data.success && Array.isArray(data.destaques)) {
          console.log(`Destaques carregados: ${data.destaques.length}`);
          
          // Converter os destaques para o formato de Story usado pela página
          const fetchedStories = data.destaques.map((destaque: any) => ({
            id: destaque.id,
            title: destaque.title,
            description: destaque.description || '',
            mediaUrl: destaque.mediaUrl,
            mediaType: destaque.mediaType,
            createdAt: destaque.createdAt,
            expiresAt: destaque.expiresAt || '',
            status: destaque.status,
            author: {
              id: destaque.userId,
              name: destaque.userName || 'Usuário',
              avatar: destaque.userAvatar || 'https://via.placeholder.com/40',
              type: destaque.isAdmin ? 'admin' : 'user'
            }
          }));
          
            setStories(fetchedStories);
        } else {
          console.log('Nenhum destaque encontrado ou formato inválido:', data);
          setStories([]);
          if (!data.success) {
            setError(data.error || 'Erro ao carregar destaques');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar destaques:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar destaques');
        setStories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStories();
  }, [activeTab]);

  // Conta o número de destaques em cada categoria para exibir nas abas
  useEffect(() => {
    // Buscar todas as histórias para calcular as contagens
    const fetchAllStories = async () => {
      try {
        // Buscar destaques pendentes (não-admin)
        const pendingResponse = await fetch(`/api/destaques?status=pending&adminOnly=false&admin=true`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Buscar destaques aprovados (não-admin)
        const approvedResponse = await fetch(`/api/destaques?status=approved&adminOnly=false&admin=true`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Buscar destaques do admin
        const adminResponse = await fetch(`/api/destaques?adminOnly=true&admin=true`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (pendingResponse.ok && approvedResponse.ok && adminResponse.ok) {
          const pendingData = await pendingResponse.json();
          const approvedData = await approvedResponse.json();
          const adminData = await adminResponse.json();
          
          setPendingCount(pendingData.destaques?.length || 0);
          setApprovedCount(approvedData.destaques?.length || 0);
          setAdminCount(adminData.destaques?.length || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar contagens:', error);
      }
    };
    
    fetchAllStories();
  }, []);

  // Fechar o modal quando clica fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsPreviewOpen(false);
      }
    };

    if (isPreviewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPreviewOpen]);
  
  const handleFilterChange = (tab: 'pending' | 'approved' | 'admin') => {
    setActiveTab(tab);
  };
  
  const handleViewStory = (story: Story) => {
    setSelectedStory(story);
    setIsPreviewOpen(true);
  };
  
  const handleApproveStory = async (id: string) => {
    try {
      console.log('Tentando aprovar destaque ID:', id);
      
      const response = await fetch('/api/admin/highlights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          id,
          status: 'approved',
          is_active: true
        })
      });
      
      console.log('Status da resposta de aprovação:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta de aprovação:', errorText);
        throw new Error(`Erro ao aprovar destaque: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Resultado da aprovação:', result);
      
      if (result.success) {
        // Atualizar lista local
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === id ? { ...story, status: 'approved' } : story
          )
        );
        
        alert('Destaque aprovado com sucesso!');
      } else {
        throw new Error(result.message || 'Falha ao aprovar destaque');
      }
      
    } catch (err) {
      console.error('Erro ao aprovar destaque:', err);
      alert(`Erro ao aprovar destaque: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };
  
  const handleRejectStory = async (id: string) => {
    try {
      // Para rejeição, exigir motivo
      if (activeTab !== 'admin' && !rejectionReason) {
        setShowRejectionForm(true);
        return;
      }
      
      console.log('Tentando rejeitar destaque ID:', id, 'Motivo:', rejectionReason);
      
      const response = await fetch('/api/admin/highlights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          id,
          status: 'rejected',
          is_active: false,
          moderationReason: rejectionReason
        }),
      });
      
      console.log('Status da resposta de rejeição:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta de rejeição:', errorText);
        throw new Error(`Erro ao rejeitar destaque: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Resultado da rejeição:', result);
      
      if (result.success) {
        // Atualizar a lista removendo o item rejeitado ou atualizando seu status
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === id 
              ? { ...story, status: 'rejected' } 
              : story
          )
        );
        
        setRejectionReason('');
        setShowRejectionForm(false);
        alert('Destaque rejeitado com sucesso');
      } else {
        throw new Error(result.message || 'Falha ao rejeitar destaque');
      }
      
    } catch (error) {
      console.error('Erro ao rejeitar destaque:', error);
      alert(`Falha ao rejeitar destaque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  
  // Função para desativar um destaque (em vez de excluir completamente)
  const handleDisableStory = async (id: string) => {
    try {
      const response = await fetch('/api/destaques', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isActive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar destaque');
      }

      // Atualizar a lista removendo o item desativado
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === id 
            ? { ...story, status: 'inactive' } 
            : story
        )
      );

      alert('Destaque desativado com sucesso');
    } catch (error) {
      console.error('Erro ao desativar destaque:', error);
      alert('Falha ao desativar destaque');
    }
  };
  
  const handleDeleteStory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este destaque permanentemente?')) {
        return;
      }
      
    try {
      console.log('Tentando excluir destaque ID:', id);
      
      // Como admin, usar a API admin de highlights
      const response = await fetch(`/api/admin/highlights?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Erro ${response.status}: ${errorText}`);
        } catch (parseError) {
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log('Resultado da exclusão:', result);
      
      if (result.success) {
        // Atualizar a lista removendo o item excluído
        setStories(prevStories => 
          prevStories.filter(story => story.id !== id)
        );
        
        alert('Destaque excluído com sucesso');
      } else {
        throw new Error(result.message || 'Falha ao excluir destaque');
      }
      
    } catch (error) {
      console.error('Erro ao excluir destaque:', error);
      alert(`Falha ao excluir destaque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('Arquivo selecionado:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
      
      const mediaUrl = URL.createObjectURL(file);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      console.log('Preview gerado:', {
        mediaUrl,
        mediaType
      });
      
      setSelectedMedia(mediaUrl);
      setNewStory({...newStory, mediaUrl, mediaType});
    }
  };

  const handleMediaTypeChange = (type: MediaType) => {
    setNewStory({...newStory, mediaType: type});
  };
  
  const handleAddStory = async () => {
    try {
      if (!newStory.title || !newStory.mediaUrl) {
        alert('Preencha o título e selecione uma mídia');
        return;
      }
      
      // Não fechar o modal até que tenhamos sucesso
      // setIsAddModalOpen(false);
      
      // Calcular a data de expiração (1 semana a partir de hoje)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de expiração
      
      // Primeiro, precisamos fazer o upload do arquivo
      // Converter o blob URL para um arquivo
      let mediaUrl = newStory.mediaUrl;
      
      // Verificar se é uma URL de blob local
      if (newStory.mediaUrl.startsWith('blob:')) {
        console.log('Detectada URL de blob, fazendo upload do arquivo...');
        
        try {
          // Obter o arquivo do elemento input
          const fileInput = document.getElementById('mediaUpload') as HTMLInputElement;
          if (!fileInput?.files?.length) {
            throw new Error('Arquivo não encontrado. Por favor, selecione novamente.');
          }
          
          // Preparar FormData para upload
          const formData = new FormData();
          const file = fileInput.files[0];
          formData.append('file', file);
          formData.append('type', newStory.mediaType);
          formData.append('userId', '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18');
          
          // Fazer upload do arquivo
          const uploadResponse = await fetch('/api/upload/media', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${uploadResponse.status}: Falha ao fazer upload`);
          }
          
          const uploadResult = await uploadResponse.json();
          mediaUrl = uploadResult.url;
          
          console.log('Upload concluído com sucesso:', mediaUrl);
        } catch (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError);
          throw new Error(`Falha ao fazer upload da mídia: ${uploadError instanceof Error ? uploadError.message : 'Erro desconhecido'}`);
        }
      }
      
      // Preparar dados para envio
      const storyData = {
        title: newStory.title,
        description: newStory.description,
        mediaUrl: mediaUrl, // Usar a URL do upload ou a original se não for blob
        mediaType: newStory.mediaType,
        userId: '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18', // ID do admin conforme setup_admin.sql
        userName: 'BuscaAquiBdC',
        userAvatar: '/logo.png',
        priority: 10, // Admin tem prioridade máxima
        status: 'approved', // Destaque de admin já deve ser aprovado automaticamente
        expiresAt: expiresAt.toISOString() // Data de expiração
      };
      
      console.log('Enviando dados do destaque:', storyData);
      
      // Enviar para a API
      const response = await fetch('/api/destaques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyData)
      });
      
      if (!response.ok) {
        // Tentar obter detalhes do erro
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || '';
        } catch (e) {
          // Não conseguiu obter JSON do erro
        }
        
        throw new Error(`Erro ao criar destaque: ${response.status} ${errorDetails}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Agora que temos sucesso, fechamos o modal
        setIsAddModalOpen(false);
        
        // Adicionar o novo destaque à lista local
        const newDestaqueConverted: Story = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description || '',
          mediaUrl: result.data.mediaUrl,
          mediaType: result.data.mediaType,
          createdAt: result.data.createdAt,
          expiresAt: result.data.expiresAt || expiresAt.toISOString(),
          status: 'approved', // Destaques do admin já são aprovados automaticamente
          author: {
            id: '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18',
            name: 'BuscaAquiBdC',
            avatar: '/logo.png',
            type: 'admin'
          }
        };
        
        setStories(prevStories => [newDestaqueConverted, ...prevStories]);
        
        // Limpar formulário
        setNewStory({
          title: '',
          description: '',
          mediaUrl: '',
          mediaType: 'image',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        
        setSelectedMedia(null);
        
        // Feedback de sucesso
        alert('Destaque criado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar destaque');
      }
    } catch (err) {
      console.error('Erro ao adicionar destaque:', err);
      alert(`Erro ao criar destaque: ${err instanceof Error ? err.message : 'Tente novamente'}`);
    }
  };
  
  // Filtra as histórias com base na aba ativa
  const filteredStories = stories.filter(story => {
    if (activeTab === 'pending') return story.status === 'pending';
    if (activeTab === 'approved') return story.status === 'approved' && story.author.type !== 'admin';
    if (activeTab === 'admin') return story.author.type === 'admin';
    return true;
  });
  
  const fetchHighlights = useCallback(async () => {
    try {
      console.log('Iniciando busca de destaques');
      
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/admin/highlights?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar destaques: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Total de destaques retornados: ${data.highlights?.length || 0}`);
        setHighlights(data.highlights || []);
        setFilteredHighlights(data.highlights || []);
      } else {
        console.error('Erro na resposta da API:', data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar destaques:', error);
    }
  }, [statusFilter, searchTerm]);
  
  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);
  
  useEffect(() => {
    if (highlights.length > 0) {
      const pendingCount = highlights.filter(highlight => highlight.status === 'pending').length;
      setPendingCount(pendingCount);
    }
  }, [fetchHighlights, highlights.length]);
  
  // Efeito para reagir às mudanças nos filtros
  useEffect(() => {
    if (highlights.length > 0) {
      fetchHighlights();
    }
  }, [statusFilter, searchTerm]);
  
  // Efeito para filtrar destaques localmente
  useEffect(() => {
    let result = [...highlights];
    
    // Filtro de busca
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(highlight => 
        highlight.title.toLowerCase().includes(lowerCaseSearch) || 
        (highlight.description?.toLowerCase().includes(lowerCaseSearch) || false) ||
        (highlight.userName?.toLowerCase().includes(lowerCaseSearch) || false)
      );
    }
    
    // Filtro de status
    if (statusFilter !== 'all') {
      result = result.filter(highlight => highlight.moderationStatus === statusFilter);
    }
    
    // Ordenação
    result.sort((a, b) => {
      const key = sortConfig.key;
      const aValue = a[key] || '';
      const bValue = b[key] || '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue as string) 
          : (bValue as string).localeCompare(aValue as string);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (bValue > aValue ? 1 : -1);
    });
    
    setFilteredHighlights(result);
  }, [highlights, searchTerm, statusFilter, sortConfig]);
  
  // Função para visualizar um destaque
  const handleViewHighlight = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setIsPreviewOpen(true);
  };
  
  // Função para aprovar um destaque
  const handleApproveHighlight = async (id: string) => {
    try {
      const response = await fetch('/api/admin/highlights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          moderationStatus: HighlightModerationStatus.APPROVED
        })
      });
      
      if (response.ok) {
        // Atualizar lista de destaques após aprovação
        fetchHighlights();
        
        // Fechar modal se estiver aberto
        if (selectedHighlight?.id === id) {
          setIsPreviewOpen(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao aprovar destaque:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao aprovar destaque:', error);
    }
  };
  
  // Função para rejeitar um destaque
  const handleRejectHighlight = async (id: string) => {
    if (!rejectionReason) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/highlights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          moderationStatus: HighlightModerationStatus.REJECTED,
          moderationReason: rejectionReason
        })
      });
      
      if (response.ok) {
        // Atualizar lista de destaques após rejeição
        fetchHighlights();
        
        // Limpar formulário e fechar modal
        setRejectionReason('');
        setShowRejectionForm(false);
        
        // Fechar modal de visualização
        if (selectedHighlight?.id === id) {
          setIsPreviewOpen(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao rejeitar destaque:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao rejeitar destaque:', error);
    }
  };
  
  // Função para excluir um destaque
  const handleDeleteHighlight = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este destaque?')) {
      try {
        const response = await fetch(`/api/admin/highlights?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Atualizar lista após exclusão
          fetchHighlights();
          
          // Fechar modal se estiver aberto
          if (selectedHighlight?.id === id) {
            setSelectedHighlight(null);
            setIsPreviewOpen(false);
          }
        } else {
          const errorData = await response.json();
          console.error('Erro ao excluir destaque:', errorData.error);
        }
      } catch (error) {
        console.error('Erro ao excluir destaque:', error);
      }
    }
  };
  
  const handleSort = (key: keyof Highlight) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getSortIcon = (key: keyof Highlight) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
  };
  
  const openRejectionForm = () => {
    setShowRejectionForm(true);
  };
  
  const getStatusBadge = (status: HighlightModerationStatus) => {
    switch (status) {
      case HighlightModerationStatus.PENDING:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendente</span>;
      case HighlightModerationStatus.APPROVED:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Aprovado</span>;
      case HighlightModerationStatus.REJECTED:
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejeitado</span>;
      default:
        return null;
    }
  };
  
  // Função para limpar URLs de imagens com aspas extras
  const cleanImageUrl = (url: string): string => {
    if (!url) return '/images/no-image.png';
    
    // Limpar aspas extras e caracteres de escape
    let cleanUrl = url;
    if (typeof url === 'string') {
      // Remover aspas duplas extras e caracteres de escape
      cleanUrl = url.replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, '');
      cleanUrl = cleanUrl.replace(/^"+|"+$/g, '');
      
      // Se após a limpeza ainda tiver aspas, fazer nova tentativa
      if (cleanUrl.includes('\"')) {
        cleanUrl = cleanUrl.replace(/\"/g, '');
      }
    }
    
    return cleanUrl;
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Destaques</h1>
        <p className="text-gray-600">Aprove, rejeite e adicione destaques/stories para a plataforma</p>
      </div>
      
      {/* Abas de navegação */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => handleFilterChange('pending')}
              className={`whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'pending' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pendentes de Aprovação ({pendingCount})
            </button>
            <button
              onClick={() => handleFilterChange('approved')}
              className={`whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'approved' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aprovados ({approvedCount})
            </button>
            <button
              onClick={() => handleFilterChange('admin')}
              className={`whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'admin' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Destaques do Admin ({adminCount})
            </button>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-4">
          {activeTab === 'admin' && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Destaques da Administração</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <div 
                      key={story.id} 
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div 
                        className="h-40 bg-gray-200 relative cursor-pointer" 
                        onClick={() => handleViewStory(story)}
                      >
                        {story.mediaType === 'image' ? (
                          <img 
                            src={cleanImageUrl(story.mediaUrl)}
                            alt={story.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaVideo className="text-gray-500 text-4xl" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            story.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            story.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            story.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {story.status === 'approved' ? 'Ativo' : 
                             story.status === 'rejected' ? 'Rejeitado' : 
                             story.status === 'inactive' ? 'Desativado' : 
                             'Pendente'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 truncate">{story.title}</h3>
                        <p className="text-sm text-gray-600 truncate">{story.description}</p>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex items-center text-xs text-gray-500">
                            <FaCalendarAlt className="mr-1" />
                            {formatDate(story.createdAt)}
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {story.status === 'approved' && (
                            <button
                              onClick={() => handleDisableStory(story.id)}
                              className="flex items-center justify-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                              title="Desativar destaque"
                            >
                              <FaTimes className="mr-1" /> Desativar
                            </button>
                          )}
                          
                          {story.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveStory(story.id)}
                              className="flex items-center justify-center px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded"
                              title="Ativar destaque"
                            >
                              <FaCheck className="mr-1" /> Ativar
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="flex items-center justify-center px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                            title="Excluir destaque permanentemente"
                          >
                            <FaTrash className="mr-1" /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-500">
                    <FaInfoCircle className="text-4xl mb-2" />
                    <p>Nenhum destaque da administração encontrado</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-6 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                <FaPlus className="mr-2" /> Adicionar Novo Destaque
              </button>
            </div>
          )}
          
          {filteredStories.length === 0 && (
            <div className="text-center py-8">
              <FaImage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum destaque encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'pending' 
                  ? 'Não há destaques pendentes de aprovação.' 
                  : activeTab === 'admin' 
                    ? 'Adicione um novo destaque clicando no botão acima.'
                    : 'Não há destaques aprovados no momento.'}
              </p>
            </div>
          )}
          
          {/* Layout estilo Stories */}
          <div className="flex space-x-6 overflow-x-auto pb-6 pt-2">
            {filteredStories.map((story, index) => (
              <div 
                key={story.id} 
                className="flex flex-col items-center cursor-pointer group min-w-[100px]"
                onClick={() => handleViewStory(story)}
              >
                <div className={`w-[100px] h-[100px] rounded-full p-[3px] mb-2 ${
                  story.author.type === 'admin' 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                    : 'bg-gradient-to-br from-green-400 to-green-600'
                }`}>
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white">
                    {story.mediaType === 'video' ? (
                      <>
                        <video
                          src={story.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-500 w-5 h-5 rounded-full flex items-center justify-center">
                          <FaVideo className="text-white text-[10px]" />
                        </div>
                      </>
                    ) : (
                      <Image
                        src={cleanImageUrl(story.mediaUrl)}
                        alt={story.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden mb-1">
                    <Image
                      src={cleanImageUrl(story.author.avatar)}
                      alt={story.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-center line-clamp-1 w-24">
                    {story.title.length > 12 ? `${story.title.substring(0, 12)}...` : story.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(story.createdAt).toLocaleDateString('pt-BR', {month: 'short', day: 'numeric'})}
                  </p>
                  
                    <div className="mt-1 flex space-x-1">
                    {story.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveStory(story.id);
                        }}
                        className="bg-green-100 text-green-800 hover:bg-green-200 px-2 py-0.5 rounded-full text-xs flex items-center"
                      >
                        <FaCheck className="mr-1 text-[10px]" />
                        Aprovar
                      </button>
                  )}
                  
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      className="bg-red-100 text-red-800 hover:bg-red-200 p-1 rounded-full"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Visualização alternativa em grid (opcional para permitir comparação) */}
          {filteredStories.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Visualização em grid</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative h-48">
                      {story.mediaType === 'video' ? (
                        <video
                          src={story.mediaUrl}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (
                  <Image
                          src={cleanImageUrl(story.mediaUrl)}
                    alt={story.title}
                    fill
                    className="object-cover"
                  />
                      )}
                      {story.mediaType === 'video' && (
                        <FaVideo className="absolute top-2 right-2 text-white bg-black/50 p-1 rounded-full text-xl" />
                      )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-medium text-lg line-clamp-1">{story.title}</h3>
                    </div>
                  </div>
                </div>
                
                    <div className="p-3">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 relative rounded-full overflow-hidden mr-2 border border-gray-200">
                      <Image
                        src={cleanImageUrl(story.author.avatar)}
                        alt={story.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                          <p className="text-xs font-medium">{story.author.name}</p>
                          <p className="text-[10px] text-gray-500">
                        {new Date(story.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                      <div className="flex justify-end">
                    <button
                      onClick={() => handleViewStory(story)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                    >
                      <FaEye className="mr-1" />
                      Visualizar
                        </button>
                      </div>
                      </div>
                  </div>
                ))}
              </div>
          </div>
          )}
        </div>
      </div>
      
      {/* Modal de visualização estilo Stories */}
      {isPreviewOpen && selectedStory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-hidden backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="relative max-w-md w-full h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl"
          >
            {/* Barra de progresso */}
            <div className="absolute top-0 left-0 right-0 p-3 z-10 flex">
              <div className="h-1 bg-white/30 rounded-full w-full">
                <div className="h-full bg-blue-500 rounded-full animate-progress"></div>
              </div>
            </div>
            
            {/* Cabeçalho */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent pt-8">
              <div className="flex items-center">
                <Link
                  href={`/loja/${selectedStory.author.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 relative rounded-full overflow-hidden border-2 border-white/30 hover:border-white transition-colors cursor-pointer"
                  title={`Ver perfil de ${selectedStory.author.name}`}
                >
                    <Image
                      src={cleanImageUrl(selectedStory.author.avatar)}
                      alt={selectedStory.author.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                </Link>
                <div className="ml-3">
                  <Link
                    href={`/loja/${selectedStory.author.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:text-blue-200 transition-colors cursor-pointer"
                    title={`Ver perfil de ${selectedStory.author.name}`}
                  >
                    <p className="text-white font-medium text-sm">{selectedStory.author.name}</p>
                  </Link>
                  <p className="text-white/70 text-xs">
                    {new Date(selectedStory.createdAt).toLocaleDateString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-white bg-black/50 p-2 rounded-full hover:bg-black/70 z-10"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Conteúdo do destaque */}
            <div className="relative h-full w-full">
              {selectedStory.mediaType === 'video' ? (
                <video
                  src={selectedStory.mediaUrl}
                  className="h-full w-full object-cover"
                  controls
                  autoPlay
                />
              ) : (
                <Image
                  src={cleanImageUrl(selectedStory.mediaUrl)}
                  alt={selectedStory.title}
                  fill
                  className="object-cover"
                />
              )}
              
              {/* Texto do destaque */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-bold text-xl mb-2">{selectedStory.title}</h3>
                <p className="text-white/90">{selectedStory.description}</p>
                
                <div className="flex justify-between items-center text-sm text-white/70 mt-4">
                <div className="flex items-center">
                  <FaClock className="mr-1" />
                  Expira: {new Date(selectedStory.expiresAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              {selectedStory.status === 'pending' && (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => {
                      handleApproveStory(selectedStory.id);
                      setIsPreviewOpen(false);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <FaCheck className="mr-2" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => {
                      handleRejectStory(selectedStory.id);
                      setIsPreviewOpen(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <FaTimes className="mr-2" />
                    Rejeitar
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de adição de novo destaque */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Adicionar Destaque</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newStory.title}
                    onChange={(e) => setNewStory({...newStory, title: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Título do destaque"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newStory.description}
                    onChange={(e) => setNewStory({...newStory, description: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição do destaque"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de mídia
                  </label>
                  <div className="flex space-x-4 mb-2">
                    <button
                      type="button"
                      onClick={() => handleMediaTypeChange('image')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded ${
                        newStory.mediaType === 'image' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FaImage />
                      <span>Imagem</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleMediaTypeChange('video')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded ${
                        newStory.mediaType === 'video' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FaVideo />
                      <span>Vídeo</span>
                    </button>
                  </div>
                  </div>
                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo de mídia
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                        type="file"
                        onChange={handleMediaUpload}
                      accept={newStory.mediaType === 'image' ? "image/*" : "video/*"}
                      className="hidden"
                      id="mediaUpload"
                      />
                    
                        {selectedMedia ? (
                      <div className="text-center">
                        {newStory.mediaType === 'image' ? (
                          <div className="relative w-full max-w-md mx-auto">
                              <img
                                src={selectedMedia}
                              alt="Prévia" 
                              className="w-full h-auto max-h-60 object-contain rounded" 
                              />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMedia(null);
                                setNewStory({...newStory, mediaUrl: ''});
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full max-w-md mx-auto">
                            <video 
                              src={selectedMedia}
                              controls
                              className="w-full h-auto max-h-60 object-contain rounded" 
                            />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMedia(null);
                            setNewStory({...newStory, mediaUrl: ''});
                          }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                              <FaTrash size={12} />
                        </button>
                      </div>
                        )}
                      </div>
                    ) : (
                      <label 
                        htmlFor="mediaUpload" 
                        className="cursor-pointer flex flex-col items-center justify-center py-6"
                      >
                        <FaPhotoVideo className="text-4xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Clique para selecionar um {newStory.mediaType === 'image' ? 'imagem' : 'vídeo'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {newStory.mediaType === 'image' ? 'PNG, JPG ou GIF até 10MB' : 'MP4 até 20MB, máx 60 segundos'}
                        </p>
                      </label>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={newStory.expiresAt.split('T')[0]}
                    onChange={(e) => setNewStory({...newStory, expiresAt: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                      </div>
                      
              <div className="mt-6 flex justify-end space-x-3">
              <button
                  type="button"
                onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
                
              <button
                  type="button"
                onClick={handleAddStory}
                disabled={!newStory.title || !selectedMedia}
                  className={`px-4 py-2 rounded ${
                    !newStory.title || !selectedMedia
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                  Publicar Destaque
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 8s linear forwards;
        }
      `}</style>
    </div>
  );
} 