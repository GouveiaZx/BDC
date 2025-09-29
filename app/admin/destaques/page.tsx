"use client";

import React, { useState, useCallback } from 'react';
import {
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaSync,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaPhotoVideo,
  FaVideo,
  FaImage,
  FaUser,
  FaClock,
  FaInfoCircle
} from 'react-icons/fa';
import { useHighlights } from '../../lib/hooks/useHighlights';
import Avatar from '../../components/Avatar';

// Types
type ActiveTab = 'pending' | 'approved' | 'admin';

interface HighlightActionsProps {
  highlight: any;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

// Components
const HighlightActions: React.FC<HighlightActionsProps> = ({
  highlight,
  onApprove,
  onReject,
  onDelete,
  isLoading = false
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    onReject(highlight.id, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <FaSpinner className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {highlight.status === 'pending' && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(highlight.id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaCheck className="text-sm" />
              Aprovar
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaTimes className="text-sm" />
              Rejeitar
            </button>
          </div>

          {showRejectForm && (
            <div className="border-t pt-2 mt-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo da rejeição (opcional)"
                className="w-full p-2 border rounded-lg text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Confirmar Rejeição
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => onDelete(highlight.id)}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <FaTrash className="text-sm" />
        Excluir
      </button>
    </div>
  );
};

const HighlightCard: React.FC<{
  highlight: any;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete: (id: string) => void;
  loadingActions?: string[];
}> = ({ highlight, onApprove, onReject, onDelete, loadingActions = [] }) => {
  const isLoading = loadingActions.includes(highlight.id);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `há ${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
    return `há ${Math.floor(diffInSeconds / 86400)}d`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };

    const statusText = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      inactive: 'Inativo'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.inactive}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${isLoading ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={highlight.user?.avatar}
            fallbackName={highlight.user?.name || 'Usuário'}
            size={32}
          />
          <div>
            <h3 className="font-medium text-gray-900">{highlight.user?.name || 'Usuário'}</h3>
            <p className="text-sm text-gray-500">{formatTimeAgo(highlight.createdAt)}</p>
          </div>
        </div>
        {getStatusBadge(highlight.status)}
      </div>

      {/* Content */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1">{highlight.title}</h4>
        {highlight.description && (
          <p className="text-sm text-gray-600">{highlight.description}</p>
        )}
      </div>

      {/* Media Preview */}
      {highlight.mediaUrl && (
        <div className="mb-3 relative">
          {highlight.mediaType === 'video' ? (
            <video
              src={highlight.mediaUrl}
              className="w-full h-32 object-cover rounded-lg"
              controls={false}
              muted
            />
          ) : (
            <img
              src={highlight.mediaUrl}
              alt={highlight.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          <div className="absolute top-2 left-2">
            {highlight.mediaType === 'video' ? (
              <FaVideo className="text-white bg-black bg-opacity-50 p-1 rounded" size={20} />
            ) : (
              <FaImage className="text-white bg-black bg-opacity-50 p-1 rounded" size={20} />
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <FaEye />
          {highlight.viewCount || 0}
        </span>
        {highlight.expiresAt && (
          <span className="flex items-center gap-1">
            <FaClock />
            Expira: {new Date(highlight.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      <HighlightActions
        highlight={highlight}
        onApprove={onApprove}
        onReject={onReject}
        onDelete={onDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default function AdminDestaquesOptimized() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingActions, setLoadingActions] = useState<string[]>([]);

  // Determine hook options based on active tab
  const getHookOptions = () => {
    switch (activeTab) {
      case 'pending':
        return { status: 'pending', adminOnly: false };
      case 'approved':
        return { status: 'approved', adminOnly: false };
      case 'admin':
        return { status: 'all', adminOnly: true };
      default:
        return { status: 'all', adminOnly: false };
    }
  };

  const {
    highlights,
    stats,
    loading,
    error,
    refreshHighlights,
    moderateHighlight,
    deleteHighlight,
    optimisticUpdate,
    optimisticDelete
  } = useHighlights(getHookOptions());

  // Filter highlights based on search term
  const filteredHighlights = highlights.filter(highlight =>
    highlight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    highlight.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    highlight.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Action handlers with optimistic updates
  const handleApprove = useCallback(async (id: string) => {
    setLoadingActions(prev => [...prev, id]);

    // Optimistic update
    optimisticUpdate(id, { status: 'approved', moderationStatus: 'approved' });

    try {
      const success = await moderateHighlight(id, 'approved');
      if (!success) {
        // Revert optimistic update on failure
        await refreshHighlights();
      }
    } catch (error) {
      await refreshHighlights();
    } finally {
      setLoadingActions(prev => prev.filter(actionId => actionId !== id));
    }
  }, [moderateHighlight, optimisticUpdate, refreshHighlights]);

  const handleReject = useCallback(async (id: string, reason?: string) => {
    setLoadingActions(prev => [...prev, id]);

    // Optimistic update
    optimisticUpdate(id, { status: 'rejected', moderationStatus: 'rejected' });

    try {
      const success = await moderateHighlight(id, 'rejected', reason);
      if (!success) {
        await refreshHighlights();
      }
    } catch (error) {
      await refreshHighlights();
    } finally {
      setLoadingActions(prev => prev.filter(actionId => actionId !== id));
    }
  }, [moderateHighlight, optimisticUpdate, refreshHighlights]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este destaque?')) return;

    setLoadingActions(prev => [...prev, id]);

    // Optimistic delete
    optimisticDelete(id);

    try {
      const success = await deleteHighlight(id);
      if (!success) {
        await refreshHighlights();
      }
    } catch (error) {
      await refreshHighlights();
    } finally {
      setLoadingActions(prev => prev.filter(actionId => actionId !== id));
    }
  }, [deleteHighlight, optimisticDelete, refreshHighlights]);

  // Tab counts from stats
  const getTabCount = (tab: ActiveTab) => {
    if (!stats) return 0;
    switch (tab) {
      case 'pending':
        return stats.pending || 0;
      case 'approved':
        return stats.active || 0;
      case 'admin':
        // This would need to be calculated separately for admin posts
        return highlights.filter(h => h.isAdminPost).length;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Destaques</h1>
            <p className="text-gray-600 mt-1">Gerencie e modere os destaques da plataforma</p>
          </div>

          <button
            onClick={refreshHighlights}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {(['pending', 'approved', 'admin'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'pending' && 'Pendentes'}
                {tab === 'approved' && 'Aprovados'}
                {tab === 'admin' && 'Admin Posts'}
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {getTabCount(tab)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, descrição ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaPhotoVideo className="text-blue-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaClock className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaCheck className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaTimes className="text-red-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Rejeitados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaInfoCircle className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
            <span className="text-gray-600">Carregando destaques...</span>
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FaPhotoVideo className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum destaque encontrado'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Tente ajustar os termos de busca'
                : 'Não há destaques nesta categoria no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHighlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                loadingActions={loadingActions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}