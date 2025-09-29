"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaSearch, FaFilter, FaEye, FaEdit, FaTrash, 
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, 
  FaPlus, FaChartBar, FaExternalLinkAlt, FaListAlt, 
  FaBullhorn, FaImages, FaCalendarAlt
} from 'react-icons/fa';

// Interface para os destaques
interface Destaque {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: string;
  status: string;
  userId: string;
  userName: string;
  createdAt: string;
  duration: number;
  views: number;
  expiresAt?: string;
  reason?: string;
  moderationStatus?: string;
}

// Componente para o badge de status
const StatusBadge = ({ status, moderationStatus }: { status: string, moderationStatus?: string }) => {
  // Lógica para determinar o status a exibir baseado no fluxo - alinhado com API
  const getDisplayStatus = () => {
    // Status aprovado: mapeado pela API como 'approved' quando active + moderation approved
    if (status === 'approved') {
      return { key: 'approved', label: 'Ativo', color: 'green' };
    }
    
    // Status rejeitado: mapeado pela API como 'rejected'
    if (status === 'rejected') {
      return { key: 'rejected', label: 'Rejeitado', color: 'red' };
    }
    
    // Status de pagamento
    if (status === 'pending_payment') {
      return { key: 'pending_payment', label: 'Aguardando Pagamento', color: 'blue' };
    }
    
    // Status em revisão ou pendente genérico
    if (status === 'pending' || status === 'pending_review') {
      return { key: 'pending', label: 'Em Revisão', color: 'yellow' };
    }
    
    // Status inativo
    if (status === 'inactive') {
      return { key: 'inactive', label: 'Inativo', color: 'gray' };
    }
    
    // Status expirado
    if (status === 'expired') {
      return { key: 'expired', label: 'Expirado', color: 'gray' };
    }
    
    // Status padrão para casos não mapeados
    return { key: 'pending', label: 'Pendente', color: 'yellow' };
  };
  
  const displayStatus = getDisplayStatus();
  
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800', 
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  };
  
  const icons = {
    approved: FaCheckCircle,
    active: FaCheckCircle,
    pending_payment: FaHourglassHalf,
    pending_review: FaHourglassHalf,
    rejected: FaTimesCircle,
    inactive: FaTimesCircle,
    expired: FaTimesCircle,
    pending: FaHourglassHalf
  };
  
  const IconComponent = icons[displayStatus.key as keyof typeof icons] || FaHourglassHalf;
  
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[displayStatus.color as keyof typeof colorClasses]}`}>
      <IconComponent className="mr-1" /> {displayStatus.label}
    </div>
  );
};

export default function MeusDestaques() {
  const [searchTerm, setSearchTerm] = useState('');
  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Adicionar estado para modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [destaqueToDelete, setDestaqueToDelete] = useState<string | null>(null);

  // Buscar destaques da API
  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        setLoading(true);
        
        // Obter token de autenticação do Supabase e ID do usuário
        const sbAccessToken = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        
        console.log('Token de acesso disponível:', !!sbAccessToken);
        console.log('ID de usuário disponível:', userId);
        
        // Verificar se temos um ID de usuário antes de prosseguir
        if (!userId) {
          console.error('ID de usuário não encontrado - usuário precisa fazer login');
          setError('Você precisa estar logado para ver seus destaques. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }
        
        // Buscar destaques do usuário atual
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Adicionar token de autorização se disponível
        if (sbAccessToken) {
          headers['Authorization'] = `Bearer ${sbAccessToken}`;
        }
        
        const response = await fetch(`/api/destaques?userId=${userId}&status=all&includeExpired=true`, {
          headers,
          credentials: 'include' // Incluir cookies na requisição
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar destaques: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.destaques)) {
          console.log('Destaques carregados da API:', data.destaques.length);
          
          // Mapear os dados para o formato esperado pelo frontend
          const mappedDestaques = data.destaques.map((destaque: any) => ({
            id: destaque.id,
            title: destaque.title,
            mediaUrl: destaque.mediaUrl || destaque.image_url,
            mediaType: destaque.mediaType || destaque.media_type || 'image',
            status: destaque.status,
            userId: destaque.userId || destaque.user_id,
            userName: destaque.userName || destaque.user_name || '',
            createdAt: destaque.createdAt || destaque.created_at,
            duration: destaque.duration || destaque.media_duration || 24,
            views: destaque.views || destaque.view_count || 0,
            expiresAt: destaque.expiresAt || destaque.expires_at,
            // Usar moderation_status correto da API
            moderationStatus: destaque.moderationStatus || destaque.moderation_status || 'pending'
          }));
          
          // Ordenar por data de criação (mais recentes primeiro)
          const sortedDestaques = mappedDestaques.sort((a: Destaque, b: Destaque) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          setDestaques(sortedDestaques);
        } else {
          console.log('Nenhum destaque encontrado');
          setDestaques([]);
        }
      } catch (err) {
        console.error('Erro ao buscar destaques:', err);
        setError('Não foi possível carregar seus destaques. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDestaques();
  }, []);

  // Função para abrir modal de confirmação de exclusão
  const confirmDelete = (destaqueId: string) => {
    setDestaqueToDelete(destaqueId);
    setShowDeleteModal(true);
  };
  
  // Função para cancelar exclusão
  const cancelDelete = () => {
    setDestaqueToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Função para excluir destaque
  const deleteDestaque = async () => {
    if (!destaqueToDelete) return;
    
    try {
      // Obter token de autenticação do Supabase e ID do usuário
      const sbAccessToken = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Adicionar token de autorização se disponível
      if (sbAccessToken) {
        headers['Authorization'] = `Bearer ${sbAccessToken}`;
      }
      
      // Obter userId do localStorage
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      console.log('[Meus Destaques] Tentando excluir:', { destaqueToDelete, userId });
      
      const response = await fetch(`/api/destaques?id=${destaqueToDelete}&userId=${userId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      console.log('[Meus Destaques] Resposta da exclusão:', response.status);
      
      const result = await response.json();
      console.log('[Meus Destaques] Resultado da exclusão:', result);
      
      if (response.ok && result.success) {
        // Remover destaque da lista local
        setDestaques(prevDestaques => 
          prevDestaques.filter(d => d.id !== destaqueToDelete)
        );
        
        // Feedback de sucesso
        alert('Destaque excluído com sucesso!');
      } else {
        const errorMsg = result.error || result.message || `Erro HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Erro ao excluir destaque:', err);
      alert('Erro ao excluir destaque. Tente novamente.');
    } finally {
      setShowDeleteModal(false);
      setDestaqueToDelete(null);
    }
  };

  // Estatísticas dos destaques - usando status mapeado pela API
  const activeDestaques = destaques.filter(d => d.status === 'approved').length;
  const pendingDestaques = destaques.filter(d => d.status === 'pending' || d.status === 'pending_payment' || d.status === 'pending_review').length;
  const rejectedDestaques = destaques.filter(d => d.status === 'rejected').length;
  const totalViews = destaques.reduce((sum, d) => sum + (d.views || 0), 0);

  // Debugar os valores para melhor visu00e3o do que estu00e1 acontecendo
  console.log('Destaques para estatu00edsticas:', {
    total: destaques.length,
    ativos: activeDestaques,
    pendentes: pendingDestaques,
    rejeitados: rejectedDestaques,
    statusDetalhes: destaques.map(d => ({ id: d.id, status: d.status, moderationStatus: d.moderationStatus }))
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-3 text-red-700 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Meus destaques</h1>
            <p className="text-gray-600">Gerencie todos os seus destaques publicados</p>
          </div>
          <Link href="/painel-anunciante/publicar-destaques" className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
            <FaPlus className="mr-2" /> Novo destaque
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6 border border-gray-200 rounded-md overflow-hidden">
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Destaques Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeDestaques}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaHourglassHalf className="text-yellow-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Aguardando Aprovação</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingDestaques}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-start">
              <FaTimesCircle className="text-red-500 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejeitados</p>
                <p className="text-2xl font-semibold text-gray-900">{rejectedDestaques}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-start">
              <FaEye className="text-blue-600 mr-2 mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Visualizações</p>
                <p className="text-2xl font-semibold text-gray-900">{totalViews}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="flex justify-between mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Buscar destaques..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* Lista de destaques */}
        {destaques.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-8 text-center border border-gray-200">
            <div className="text-gray-400 text-5xl mb-4">
              <FaBullhorn className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Você ainda não tem destaques</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro destaque e aumente a visibilidade dos seus anúncios!</p>
            <Link 
              href="/painel-anunciante/publicar-destaques" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-green-500 hover:bg-green-600"
            >
              <FaPlus className="mr-2" /> Criar Destaque
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destaques
              .filter(destaque => destaque.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((destaque) => (
                <div key={destaque.id} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex">
                    <div className="w-1/3 relative">
                      <div className="h-full bg-gray-200">
                        {destaque.mediaUrl ? (
                          <img
                            src={destaque.mediaUrl}
                            alt={destaque.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback para uma imagem padrão em caso de erro
                              console.log('Erro ao carregar imagem:', destaque.mediaUrl);
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbSBJbmRpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <FaImages className="text-gray-400 text-3xl mb-2 mx-auto" />
                              <p className="text-xs text-gray-500">Sem imagem</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-2/3 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{destaque.title}</h3>
                        <StatusBadge status={destaque.status} moderationStatus={destaque.moderationStatus} />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div>
                          <span className="inline-block bg-gray-100 rounded-full px-2 py-0.5">{destaque.mediaType === 'foto' ? 'Imagem' : 'Vídeo'}</span>
                          <span className="mx-1">•</span>
                          <span>ID: #{destaque.id.substring(0, 8)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <FaEye className="mr-1 text-gray-400" />
                          <span>{destaque.views || 0} visualizações</span>
                        </div>
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1 text-gray-400" />
                          <span>Duração: {destaque.duration}h</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-2 flex justify-between">
                        <div className="flex space-x-1">
                          {destaque.status === 'rejected' && (
                            <Link 
                              href={`/painel-anunciante/editar-destaque/${destaque.id}`}
                              className="p-1.5 rounded text-green-600 hover:bg-green-50"
                            >
                              <FaEdit />
                            </Link>
                          )}
                          <button 
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            onClick={() => confirmDelete(destaque.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <button className="text-xs text-gray-500 hover:text-gray-700 p-1.5">
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este destaque? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button 
                onClick={deleteDestaque}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 