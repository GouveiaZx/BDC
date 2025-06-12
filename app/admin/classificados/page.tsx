"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaSearch, 
  FaFilter, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTrash,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaTag,
  FaUser
} from 'react-icons/fa';
import { BusinessProfile, BusinessModerationStatus, BusinessCategory, businessCategoryNames } from '../../models/types';

export default function AdminClassificados() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessProfile[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BusinessProfile | 'categories',
    direction: 'asc' | 'desc'
  }>({ key: 'createdAt', direction: 'desc' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  
  // Modificar useEffect para buscar dados reais em vez de usar dados de exemplo
  useEffect(() => {
    fetchBusinesses();
  }, []);
  
  // Adicionar função para buscar dados das empresas
  const fetchBusinesses = async () => {
    try {
      console.log('=============================================');
      console.log('INICIANDO BUSCA DE EMPRESAS NA ÁREA ADMIN');
      console.log('=============================================');
      
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      console.log('Parâmetros de consulta:', params.toString());
      
      const response = await fetch(`/api/admin/businesses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar empresas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (data.success) {
        console.log(`Total de empresas retornadas: ${data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          console.log('Primeira empresa:', data.data[0]);
        } else {
          console.log('Nenhuma empresa encontrada no banco de dados.');
        }
        
        setBusinesses(data.data || []);
        setFilteredBusinesses(data.data || []);
      } else {
        console.error('Erro na resposta da API:', data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };
  
  // Atualizar useEffect para reagir às mudanças nos filtros
  useEffect(() => {
    if (businesses.length > 0) {
      fetchBusinesses();
    }
  }, [statusFilter, categoryFilter, searchTerm]);
  
  // Efeito para filtrar empresas
  useEffect(() => {
    let result = [...businesses];
    
    // Filtro de busca
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(business => 
        business.businessName.toLowerCase().includes(lowerCaseSearch) || 
        business.description.toLowerCase().includes(lowerCaseSearch) ||
        business.contactName.toLowerCase().includes(lowerCaseSearch) ||
        business.city.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Filtro de status
    if (statusFilter !== 'all') {
      result = result.filter(business => business.moderationStatus === statusFilter);
    }
    
    // Filtro de categoria
    if (categoryFilter !== 'all') {
      result = result.filter(business => 
        business.categories.includes(categoryFilter as unknown as BusinessCategory)
      );
    }
    
    // Ordenação
    result.sort((a, b) => {
      const key = sortConfig.key;
      let aValue: any = '';
      let bValue: any = '';
      
      if (key === 'categories') {
        aValue = a.categories.length > 0 ? businessCategoryNames[a.categories[0]] : '';
        bValue = b.categories.length > 0 ? businessCategoryNames[b.categories[0]] : '';
      } else {
        aValue = a[key] || '';
        bValue = b[key] || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (bValue > aValue ? 1 : -1);
    });
    
    setFilteredBusinesses(result);
  }, [businesses, searchTerm, statusFilter, categoryFilter, sortConfig]);
  
  // Atualizar a função handleViewBusiness para visualizar informações da empresa e do usuário
  const handleViewBusiness = async (business: BusinessProfile) => {
    setSelectedBusiness(business);
    setIsPreviewOpen(true);
    
    // Se houver um ID de usuário, buscar detalhes do usuário
    if (business.userId) {
      try {
        const response = await fetch(`/api/admin/users?id=${business.userId}`);
        
        if (response.ok) {
          const userData = await response.json();
          
          if (userData.success && userData.data.length > 0) {
            // Atualizar objeto de empresa selecionada com dados do usuário
            setSelectedBusiness(prev => ({
              ...prev!,
              user: userData.data[0]
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
      }
    }
  };
  
  // Atualizar a função handleApproveBusiness para usar a API
  const handleApproveBusiness = async (id: string) => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          moderationStatus: BusinessModerationStatus.APPROVED
        })
      });
      
      if (response.ok) {
        // Atualizar lista de empresas após aprovação
        fetchBusinesses();
        
        // Fechar modal se estiver aberto
        if (selectedBusiness?.id === id) {
          setIsPreviewOpen(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao aprovar empresa:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao aprovar empresa:', error);
    }
  };
  
  // Atualizar a função handleRejectBusiness para usar a API
  const handleRejectBusiness = async (id: string) => {
    if (!rejectionReason) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          moderationStatus: BusinessModerationStatus.REJECTED,
          moderationReason: rejectionReason
        })
      });
      
      if (response.ok) {
        // Atualizar lista de empresas após rejeição
        fetchBusinesses();
        
        // Limpar formulário e fechar modal
        setRejectionReason('');
        setShowRejectionForm(false);
        
        // Fechar modal de visualização se estiver aberto
        if (selectedBusiness?.id === id) {
          setIsPreviewOpen(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao rejeitar empresa:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao rejeitar empresa:', error);
    }
  };
  
  // Atualizar a função handleDeleteBusiness para usar a API
  const handleDeleteBusiness = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        const response = await fetch(`/api/admin/businesses?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Atualizar lista de empresas após exclusão
          fetchBusinesses();
          
          // Fechar modal se estiver aberto
          if (selectedBusiness?.id === id) {
            setSelectedBusiness(null);
            setIsPreviewOpen(false);
          }
        } else {
          const errorData = await response.json();
          console.error('Erro ao excluir empresa:', errorData.error);
        }
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
      }
    }
  };
  
  // Adicionar função para bloquear/desbloquear usuário
  const handleToggleUserBlock = async (userId: string, block: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          isBlocked: block,
          action: block ? 'block' : 'unblock'
        })
      });
      
      if (response.ok) {
        // Atualizar dados do usuário após bloqueio/desbloqueio
        // Se o usuário estiver sendo visualizado, atualizar informações
        if (selectedBusiness?.userId === userId) {
          handleViewBusiness(selectedBusiness);
        }
        
        // Notificar usuario
        alert(block ? 'Usuário bloqueado com sucesso!' : 'Usuário desbloqueado com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('Erro ao atualizar status do usuário:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
    }
  };
  
  // Adicionar componente de visualização do perfil do usuário
  const UserProfileSection = ({ user }: { user: BusinessProfile['user'] }) => {
    if (!user) return null;
    
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Informações do Anunciante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="flex items-center text-gray-600">
              <FaUser className="mr-2 text-gray-500" /> Nome: {user.name || 'Não informado'}
            </p>
            <p className="flex items-center text-gray-600">
              <FaEnvelope className="mr-2 text-gray-500" /> Email: {user.email || 'Não informado'}
            </p>
            <p className="flex items-center text-gray-600">
              <FaPhone className="mr-2 text-gray-500" /> Telefone: {user.phone || 'Não informado'}
            </p>
          </div>
          <div>
            <p className="flex items-center text-gray-600">
              <span className="mr-2">🏢</span> Tipo: {user.type === 'business' ? 'Empresa' : 'Pessoa Física'}
            </p>
            <p className="flex items-center text-gray-600">
              <span className="mr-2">🗓️</span> Cadastro: {formatDate(user.createdAt.toString())}
            </p>
            <p className="flex items-center text-gray-600">
              <span className="mr-2">🔒</span> Status: {
                user.isBlocked 
                  ? <span className="text-red-600 font-semibold">Bloqueado</span> 
                  : <span className="text-green-600 font-semibold">Ativo</span>
              }
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          {user.isBlocked ? (
            <button
              onClick={() => handleToggleUserBlock(user.id, false)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Desbloquear Usuário
            </button>
          ) : (
            <button
              onClick={() => handleToggleUserBlock(user.id, true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Bloquear Usuário
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const handleSort = (key: keyof BusinessProfile | 'categories') => {
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
  
  const getSortIcon = (key: keyof BusinessProfile | 'categories') => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
  };
  
  const openRejectionForm = () => {
    setShowRejectionForm(true);
  };
  
  const getStatusBadge = (status: BusinessModerationStatus) => {
    switch (status) {
      case BusinessModerationStatus.PENDING:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendente</span>;
      case BusinessModerationStatus.APPROVED:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Aprovado</span>;
      case BusinessModerationStatus.REJECTED:
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
      
      // Se após a limpeza ainda tiver aspas, fazer nova tentativa
      if (cleanUrl.includes('\"')) {
        cleanUrl = cleanUrl.replace(/\"/g, '');
      }
    }
    
    return cleanUrl;
  };
  

  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaStore className="mr-2 text-blue-600" /> Classificados
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <FaFilter className="mr-2" /> Filtros
            </button>
            

          </div>
        </div>
        
        {isFilterOpen && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="approved">Aprovados</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as categorias</option>
                  {Object.entries(businessCategoryNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('businessName')}>
                  <div className="flex items-center">
                    Empresa {getSortIcon('businessName')}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('categories')}>
                  <div className="flex items-center">
                    Categoria {getSortIcon('categories')}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('city')}>
                  <div className="flex items-center">
                    Cidade {getSortIcon('city')}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center">
                    Data de Criação {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 relative">
                            {business.logo ? (
                              <Image
                                src={cleanImageUrl(business.logo)}
                                alt={business.businessName}
                                width={40}
                                height={40}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                <FaStore />
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{business.businessName}</div>
                          <div className="text-sm text-gray-500">{business.contactName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {business.categories.map((category) => (
                          <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {businessCategoryNames[category]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {business.city}, {business.state}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(business.createdAt.toString())}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(business.moderationStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewBusiness(business)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <FaEye />
                        </button>
                        {business.moderationStatus === BusinessModerationStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleApproveBusiness(business.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Aprovar"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBusiness(business);
                                openRejectionForm();
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Rejeitar"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteBusiness(business.id)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de Visualização de Empresa */}
      {isPreviewOpen && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 bg-gray-200">
              {selectedBusiness.banner ? (
                <Image
                  src={selectedBusiness.banner}
                  alt={selectedBusiness.businessName}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                  <FaStore className="text-4xl" />
                </div>
              )}
              
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 relative">
              <div className="absolute -top-16 left-6">
                <div className="h-24 w-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                  {selectedBusiness.logo ? (
                    <Image
                      src={cleanImageUrl(selectedBusiness.logo)}
                      alt={selectedBusiness.businessName}
                      width={96}
                      height={96}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                      <FaStore className="text-2xl" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedBusiness.businessName}</h2>
                  {getStatusBadge(selectedBusiness.moderationStatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Informações de Contato</h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-600">
                        <FaUser className="mr-2 text-gray-500" /> {selectedBusiness.contactName}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <FaPhone className="mr-2 text-gray-500" /> {selectedBusiness.phone}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <FaEnvelope className="mr-2 text-gray-500" /> {selectedBusiness.email}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-2 text-gray-500" /> {selectedBusiness.address}, {selectedBusiness.city}, {selectedBusiness.state}
                      </p>
                      {selectedBusiness.website && (
                        <p className="flex items-center text-gray-600">
                          <FaGlobe className="mr-2 text-gray-500" />
                          <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedBusiness.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Detalhes do Negócio</h3>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {selectedBusiness.categories.map((category) => (
                          <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FaTag className="mr-1" /> {businessCategoryNames[category]}
                          </span>
                        ))}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Cadastrado em: {formatDate(selectedBusiness.createdAt.toString())}</p>
                        {selectedBusiness.moderationDate && (
                          <p className="text-sm text-gray-500">
                            {selectedBusiness.moderationStatus === BusinessModerationStatus.APPROVED ? 'Aprovado em: ' : 'Rejeitado em: '}
                            {formatDate(selectedBusiness.moderationDate.toString())}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedBusiness.socialMedia?.facebook && (
                          <a href={`https://facebook.com/${selectedBusiness.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                            <FaFacebook />
                          </a>
                        )}
                        {selectedBusiness.socialMedia?.instagram && (
                          <a href={`https://instagram.com/${selectedBusiness.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600">
                            <FaInstagram />
                          </a>
                        )}
                        {selectedBusiness.socialMedia?.whatsapp && (
                          <a href={`https://wa.me/${selectedBusiness.socialMedia.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
                            <FaWhatsapp />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Descrição</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedBusiness.description}</p>
                </div>
                
                {selectedBusiness.moderationStatus === BusinessModerationStatus.REJECTED && selectedBusiness.moderationReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                    <h3 className="font-medium text-red-800 mb-1">Motivo da rejeição:</h3>
                    <p className="text-red-700">{selectedBusiness.moderationReason}</p>
                  </div>
                )}
                
                {selectedBusiness.user && (
                  <UserProfileSection user={selectedBusiness.user} />
                )}
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                  
                  {selectedBusiness.moderationStatus === BusinessModerationStatus.PENDING && (
                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          handleApproveBusiness(selectedBusiness.id);
                          setIsPreviewOpen(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          openRejectionForm();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Rejeição */}
      {showRejectionForm && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Rejeitar Empresa</h2>
              <p className="text-gray-600 mb-4">
                Você está rejeitando o cadastro da empresa <strong>{selectedBusiness.businessName}</strong>. 
                Por favor, forneça um motivo para a rejeição.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 h-32"
              ></textarea>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleRejectBusiness(selectedBusiness.id);
                    setIsPreviewOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={!rejectionReason}
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 