"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaHeart, FaUser } from 'react-icons/fa';
import Avatar from './Avatar';
import { useAuth } from '../lib/authSync';

interface Viewer {
  id?: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  viewed_at: string;
  liked?: boolean; // Se este usuário também curtiu
  session_id?: string; // Para usuários não logados
}

interface ViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightId: string;
  highlightOwnerId: string; // Para verificar se o usuário pode ver as visualizações
  totalViews: number;
}

const ViewersModal: React.FC<ViewersModalProps> = ({
  isOpen,
  onClose,
  highlightId,
  highlightOwnerId,
  totalViews
}) => {
  const { user, isAuthenticated } = useAuth();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'views' | 'likes'>('views');

  // Verificar se o usuário pode ver as visualizações (apenas dono do destaque)
  const canViewDetails = isAuthenticated && user?.id === highlightOwnerId;

  useEffect(() => {
    if (isOpen && canViewDetails) {
      fetchViewers();
    }
  }, [isOpen, highlightId, canViewDetails]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = activeTab === 'views'
        ? `/api/destaques/${highlightId}/views`
        : `/api/destaques/${highlightId}/likes`;

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setViewers(data.viewers || data.likes || []);
      } else if (response.status === 403) {
        setError('Você não tem permissão para ver essas informações');
      } else {
        throw new Error('Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao buscar visualizadores:', error);
      setError('Erro ao carregar informações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando mudar de aba
  useEffect(() => {
    if (isOpen && canViewDetails) {
      fetchViewers();
    }
  }, [activeTab]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const getUserDisplayName = (viewer: Viewer): string => {
    if (viewer.user_name) return viewer.user_name;
    if (viewer.user_id) return 'Usuário';
    return 'Visitante anônimo';
  };

  const getUserAvatar = (viewer: Viewer): string => {
    if (viewer.user_avatar) return viewer.user_avatar;

    // Avatar gerado para usuários com nome
    if (viewer.user_name) {
      const encodedName = encodeURIComponent(viewer.user_name);
      return `https://ui-avatars.com/api/?name=${encodedName}&background=7ad38e&color=ffffff&size=40&bold=true&rounded=true`;
    }

    // Avatar padrão para anônimos
    return '/images/avatar-placeholder.png';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FaEye className="text-gray-600" />
            <h3 className="font-semibold text-lg">
              {activeTab === 'views' ? 'Visualizações' : 'Curtidas'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('views')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'views'
                ? 'text-[#7ad38e] border-b-2 border-[#7ad38e]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaEye className="inline mr-2" />
            Visualizações ({totalViews})
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'likes'
                ? 'text-[#7ad38e] border-b-2 border-[#7ad38e]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaHeart className="inline mr-2" />
            Curtidas
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {!canViewDetails ? (
            <div className="text-center py-8 text-gray-600">
              <FaUser className="mx-auto mb-4 text-4xl opacity-50" />
              <p className="text-lg font-medium mb-2">Acesso Restrito</p>
              <p className="text-sm">
                Apenas o criador do destaque pode ver quem visualizou
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#7ad38e] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p className="mb-4">❌ {error}</p>
              <button
                onClick={fetchViewers}
                className="bg-[#7ad38e] text-white px-4 py-2 rounded-lg hover:bg-[#5baf6f] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-4xl mb-4">
                {activeTab === 'views' ? '👀' : '💔'}
              </div>
              <p className="text-lg font-medium mb-2">
                Nenhum{activeTab === 'views' ? 'a visualização' : 'a curtida'} ainda
              </p>
              <p className="text-sm">
                {activeTab === 'views'
                  ? 'Compartilhe seu destaque para receber mais visualizações'
                  : 'Seja o primeiro a receber curtidas!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer, index) => (
                <div
                  key={viewer.id || viewer.user_id || `${viewer.session_id}-${index}`}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {/* Avatar */}
                  <Avatar
                    src={getUserAvatar(viewer)}
                    alt={getUserDisplayName(viewer)}
                    size={40}
                    fallbackName={getUserDisplayName(viewer)}
                    showBorder={false}
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">
                        {getUserDisplayName(viewer)}
                      </p>
                      {/* Mostrar coração se curtiu (na aba de visualizações) */}
                      {activeTab === 'views' && viewer.liked && (
                        <FaHeart className="text-red-500 text-sm" title="Também curtiu" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {activeTab === 'views' ? 'Visualizou' : 'Curtiu'} {formatTimeAgo(viewer.viewed_at)}
                    </p>
                  </div>

                  {/* Link para perfil (se for usuário logado) */}
                  {viewer.user_id && (
                    <button
                      onClick={() => {
                        // Fechar modal e redirecionar para perfil
                        onClose();
                        window.open(`/loja/${viewer.user_id}`, '_blank');
                      }}
                      className="text-[#7ad38e] hover:text-[#5baf6f] text-sm font-medium"
                    >
                      Ver perfil
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com informações adicionais */}
        {canViewDetails && viewers.length > 0 && (
          <div className="border-t p-4 bg-gray-50 text-center">
            <p className="text-sm text-gray-600">
              {activeTab === 'views'
                ? `Total de ${totalViews} visualizações únicas`
                : `${viewers.length} curtida${viewers.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewersModal;