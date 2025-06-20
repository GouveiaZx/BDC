"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaTrash, FaCheck, FaTimes, FaEye, FaUserSlash, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAdmin } from '../AdminContext';

type Report = {
  id: string;
  type: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  reportedItemId: string;
  reportedItemType: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  adminNotes?: string;
  resolvedBy?: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
};

export default function DenunciasPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <DenunciasPage />
    </Suspense>
  );
}

function DenunciasPage() {
  const { isAuthenticated, logout } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    types: {
      ad: 0,
      user: 0,
      highlight: 0,
      other: 0
    }
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemsPerPage = 10;

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, redirecionando...');
      window.location.href = '/admin/login';
      return;
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
      const status = searchParams.get('status') as 'all' | 'pending' | 'approved' | 'rejected' || 'pending';
      setFilter(status);
      setCurrentPage(1);
      fetchReports(status, 1);
    }
  }, [isAuthenticated, searchParams]);
  
  const fetchReports = useCallback(async (status: string, page: number) => {
    setLoading(true);
    try {
      // Calcular offset para paginação
      const offset = (page - 1) * itemsPerPage;
      
      // Construir URL com parâmetros
      const params = new URLSearchParams();
      if (status !== 'all') {
        params.append('status', status);
      }
      params.append('limit', itemsPerPage.toString());
      params.append('offset', offset.toString());
      
      const apiUrl = `/api/admin/reports?${params.toString()}`;
      console.log('[Denúncias] Buscando da API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401) {
        console.error('[Denúncias] Erro de autenticação: 401');
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => logout(), 2000);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Denúncias] Dados recebidos:', data.data?.length || 0, 'registros');
      
      if (data.success) {
        setReports(data.data || []);
        setStats(data.stats || stats);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      } else {
        throw new Error(data.message || 'Erro ao buscar denúncias');
      }
    } catch (error) {
      console.error('[Denúncias] Erro ao buscar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar denúncias';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [logout]);
  
  useEffect(() => {
    fetchReports(filter, currentPage);
  }, [fetchReports, filter, currentPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchReports(filter, page);
  };
  
  const handleFilterChange = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setFilter(status);
    router.push(`/admin/denuncias?status=${status}`);
  };
  
  const openReportModal = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setAdminNotes('');
  };
  
  // Atualizar status da denúncia
  const updateReportStatus = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!selectedReport) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedReport.id,
          status: status,
          admin_notes: adminNotes,
          resolved_by: 'admin',
          resolved_at: new Date().toISOString()
        }),
        credentials: 'include'
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao atualizar denúncia');
      }

      const actionText = status === 'approved' ? 'aprovada' : 'rejeitada';
      toast.success(`Denúncia ${actionText} com sucesso!`);
      
      // Recarregar dados
      await fetchReports(filter, currentPage);
      closeModal();
      
    } catch (error) {
      console.error('Erro ao atualizar denúncia:', error);
      toast.error('Erro ao atualizar denúncia');
    } finally {
      setActionLoading(false);
    }
  };

  // Excluir denúncia
  const deleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta denúncia?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports?id=${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => logout(), 1500);
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir denúncia');
      }

      toast.success('Denúncia excluída com sucesso!');
      await fetchReports(filter, currentPage);

    } catch (error) {
      console.error('Erro ao excluir denúncia:', error);
      toast.error('Erro ao excluir denúncia');
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const getStatusTranslation = (status: string) => {
    const translations = {
      'pending': 'Pendente',
      'approved': 'Aprovada',
      'rejected': 'Rejeitada'
    };
    return translations[status as keyof typeof translations] || status;
  };

  const getTypeTranslation = (type: string) => {
    const translations = {
      'ad': 'Anúncio',
      'user': 'Usuário',
      'highlight': 'Destaque',
      'other': 'Outro'
    };
    return translations[type as keyof typeof translations] || type;
  };

  // Se não autenticado, não renderizar nada (vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Denúncias</h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie as denúncias de usuários</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaExclamationTriangle className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaTimes className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheck className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FaTimes className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendentes ({stats.pending})
          </button>
          <button
            onClick={() => handleFilterChange('approved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aprovadas ({stats.approved})
          </button>
          <button
            onClick={() => handleFilterChange('rejected')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'rejected'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejeitadas ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Estado de Carregamento */}
      {loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando denúncias...</p>
        </div>
      )}

      {/* Lista de Denúncias */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <FaExclamationTriangle className="text-4xl mx-auto mb-2 opacity-50" />
                <h3 className="text-lg font-medium">Nenhuma denúncia encontrada</h3>
              </div>
              <p className="text-gray-400">
                {filter !== 'all'
                  ? `Não há denúncias com status "${getStatusTranslation(filter)}"`
                  : 'Quando houver denúncias, elas aparecerão aqui.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Denunciante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getTypeTranslation(report.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {report.reason}
                          </div>
                          {report.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {report.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.reporter.name}</div>
                          <div className="text-xs text-gray-500">{report.reporter.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                            {getStatusTranslation(report.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openReportModal(report)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Ver detalhes"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => deleteReport(report.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Excluir denúncia"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando página {currentPage} de {totalPages}
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === 1 || page === totalPages ||
                                   (page >= currentPage - 2 && page <= currentPage + 2);
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes da Denúncia
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <p className="text-gray-900">{getTypeTranslation(selectedReport.type)}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedReport.status)}`}>
                      {getStatusTranslation(selectedReport.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Motivo:</span>
                  <p className="text-gray-900">{selectedReport.reason}</p>
                </div>

                {selectedReport.description && (
                  <div>
                    <span className="font-medium text-gray-700">Descrição:</span>
                    <p className="text-gray-900">{selectedReport.description}</p>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700">Denunciante:</span>
                  <p className="text-gray-900">{selectedReport.reporter.name}</p>
                  <p className="text-gray-600 text-sm">{selectedReport.reporter.email}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Data da Denúncia:</span>
                  <p className="text-gray-900">{formatDate(selectedReport.createdAt)}</p>
                </div>

                {selectedReport.processedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Data de Processamento:</span>
                    <p className="text-gray-900">{formatDate(selectedReport.processedAt)}</p>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Notas do Administrador:
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Adicione suas observações sobre esta denúncia..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReportStatus('rejected')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processando...' : 'Rejeitar'}
                    </button>
                    <button
                      onClick={() => updateReportStatus('approved')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processando...' : 'Aprovar'}
                    </button>
                  </>
                )}
                
                {selectedReport.status !== 'pending' && (
                  <button
                    onClick={() => updateReportStatus('pending')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Processando...' : 'Reabrir'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 