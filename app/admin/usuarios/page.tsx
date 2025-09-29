"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { FaSync, FaTrash, FaUser, FaBuilding, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  phone?: string;
  whatsapp?: string;
  profile_image_url?: string;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  last_login_at?: string;
  login_count: number;
  hasProfile: boolean;
  hasBusinessProfile: boolean;
  subscription_plan: string;
  business_name?: string;
  business_status?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string | null>(null);

  // Carregar planos disponíveis
  const loadPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailablePlans(data.plans || []);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Admin-Users] Erro ao carregar planos:', error.message);
      }
    }
  };

  // Carregar TODOS os usuários cadastrados
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [ADMIN-USERS] Carregando TODOS os usuários...');
      
      // Buscar TODOS os usuários via API com cache-busting
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/users?limit=500&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      
      const data = await response.json();
      
      if (data.success && data.users) {
        console.log(`✅ [ADMIN-USERS] Carregados ${data.users.length} usuários`);
        setUsers(data.users);
        if (data.timestamp) {
          setLastUpdateTimestamp(data.timestamp);
        }
      } else {
        setError('Não foi possível carregar os usuários');
      }
    } catch (error: any) {
      setError(`Erro ao carregar usuários: ${error.message}`);
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Admin-Users] Erro ao carregar usuários:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    loadUsers();
    loadPlans();
  }, []);

  // Bloquear/Desbloquear usuário
  const toggleUserBlock = async (userId: string, email: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'desbloquear' : 'bloquear';
    
    if (!confirm(`Tem certeza que deseja ${action} o usuário ${email}?`)) {
      return;
    }
    
    try {
      setRefreshing(true);
      console.log(`🔄 ${action.toUpperCase()} usuário:`, email);
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          id: userId, 
          isBlocked: !currentlyBlocked,
          action: currentlyBlocked ? 'unblock' : 'block'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao ${action} usuário`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Usuário ${email} ${currentlyBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso`);
        await loadUsers();
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setError(`Erro ao ${action} usuário: ${error.message}`);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Admin-Users] Erro ao ${action} usuário:`, error.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Alterar plano do usuário com atualizações otimistas
  const changePlan = async (userId: string, userEmail: string, newPlanId: string, isUserWithoutSubscription: boolean = false) => {
    if (!newPlanId) {
      setError('Selecione um plano válido');
      return;
    }

    const plan = availablePlans.find(p => p.id === newPlanId);
    if (!plan) {
      setError('Plano não encontrado');
      return;
    }

    if (!confirm(`Tem certeza que deseja alterar o plano do usuário ${userEmail} para "${plan.name}"?`)) {
      return;
    }

    // Atualização otimista da UI
    const previousUsers = [...users];
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, subscription_plan: plan.name };
      }
      return user;
    });
    setUsers(updatedUsers);

    try {
      setChangingPlan(userId);
      console.log('🔄 Alterando plano do usuário:', userEmail, 'para:', plan.name);
      
      // Se o usuário não tem assinatura, usar o prefixo "free-"
      const requestId = isUserWithoutSubscription ? `free-${userId}` : userId;
      
      const response = await fetch(`/api/admin/users-subscriptions/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: newPlanId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta não é um JSON válido');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Mensagem de sucesso detalhada
        let successMsg = `Plano do usuário ${userEmail} alterado para "${plan.name}" com sucesso!`;
        if (data.planChanges && data.planChanges.length > 0) {
          successMsg += ` (${data.planChanges.length} limitações aplicadas)`;
        }
        setSuccessMessage(successMsg);
        
        // Sincronização cross-dashboard aprimorada
        try {
          console.log('🔄 Sincronizando dashboards após mudança de plano...');
          
          // 1. Recarregar dados do servidor para garantir sincronização
          await loadUsers();
          
          // 2. Invalidar cache do localStorage se existir
          if (typeof window !== 'undefined') {
            const cacheKeys = ['users-cache', 'subscriptions-cache', 'admin-users-cache'];
            cacheKeys.forEach(key => {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });
          }
          
          // 3. Notificar outros componentes sobre a mudança
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('planChanged', {
              detail: {
                userId,
                userEmail,
                newPlan: plan.name,
                planChanges: data.planChanges
              }
            }));
          }
          
          // 4. Log das limitações aplicadas para debugging
          if (data.planChanges && data.planChanges.length > 0) {
            console.log('📋 Limitações aplicadas na mudança de plano:', data.planChanges);
          }
          
          // 5. Validação adicional - buscar benefícios aplicados
          try {
            const validationResponse = await fetch('/api/destaques/validation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId,
                newPlanId: newPlanId
              })
            });
            
            if (validationResponse.ok) {
              const validationData = await validationResponse.json();
              if (validationData.success && validationData.planComparison) {
                console.log('✅ Benefícios validados:', validationData.planComparison.benefits);
                console.log('⚠️ Limitações:', validationData.planComparison.limitations);
                if (validationData.planComparison.warnings.length > 0) {
                  console.warn('⚠️ Avisos:', validationData.planComparison.warnings);
                }
              }
            }
          } catch (validationError) {
            console.warn('Erro na validação de benefícios (não crítico):', validationError);
          }
          
        } catch (reloadError) {
          console.warn('⚠️ Erro ao sincronizar dashboards após atualização:', reloadError);
          // Manter a atualização otimista se o reload falhar
        }
        
        setTimeout(() => setSuccessMessage(null), 5000); // Aumentado para 5 segundos para dar tempo de ler
      } else {
        // Reverter mudanças otimistas em caso de erro
        setUsers(previousUsers);
        throw new Error(data.message || 'Falha na comunicação com o servidor');
      }
    } catch (error: any) {
      // Reverter mudanças otimistas em caso de erro
      setUsers(previousUsers);
      setError(`Erro ao alterar plano: ${error.message}`);
      
      // Log error in development without interfering with React DevTools
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Admin] Erro ao alterar plano:', error.message);
      }
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setChangingPlan(null);
    }
  };

  // Excluir usuário permanentemente
  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${email}?\n\nEsta ação irá remover:\n- O usuário\n- Todos os anúncios\n- Assinaturas\n- Perfis de negócio\n- Destaques\n- Todos os dados relacionados\n\nEsta ação NÃO PODE ser desfeita!`)) {
      return;
    }
    
    // Segunda confirmação para segurança
    if (!confirm(`CONFIRMAÇÃO FINAL: Digite "EXCLUIR" no próximo prompt para confirmar a exclusão de ${email}`)) {
      return;
    }
    
    const userConfirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão permanente:');
    if (userConfirmation !== 'EXCLUIR') {
      alert('Exclusão cancelada - texto de confirmação incorreto');
      return;
    }
    
    try {
      setRefreshing(true);
      console.log('🗑️ Excluindo usuário:', email);
      
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Usuário ${email} excluído permanentemente com sucesso`);
        await loadUsers();
        
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setError(`Erro ao excluir usuário: ${error.message}`);
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Admin-Users] Erro ao excluir usuário:', error.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Usuários</h1>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro: </strong> {error}
          <button 
            className="float-right text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Sucesso: </strong> {successMessage}
          <button 
            className="float-right text-green-700 hover:text-green-900"
            onClick={() => setSuccessMessage(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Botão para recarregar usuários */}
      <div className="mb-4">
        <button 
          onClick={loadUsers}
          disabled={loading || refreshing}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
        >
          <FaSync className={`mr-2 ${loading || refreshing ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>
      
      {/* Tabela de usuários */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Plano</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Perfis</th>
              <th className="px-4 py-2 text-left">Criado em</th>
              <th className="px-4 py-2 text-left">Último Login</th>
              <th className="px-4 py-2 text-center">Alterar Plano</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-2 text-center">
                  <div className="flex justify-center my-4">
                    <FaSync className="animate-spin text-2xl text-blue-500" />
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-2 text-center">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 border-t border-gray-200 ${user.is_blocked ? 'bg-red-50' : ''} ${!user.is_active ? 'bg-gray-100' : ''}`}>
                  <td className="px-4 py-2 text-sm font-mono" title={user.id}>
                    {user.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center">
                      {user.profile_image_url && (
                        <img 
                          src={user.profile_image_url} 
                          alt={user.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      )}
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {user.name}
                    {user.business_name && (
                      <div className="text-xs text-gray-500">
                        📢 {user.business_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.user_type === 'business' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.user_type === 'admin' ? 'Admin' :
                       user.user_type === 'business' ? 'Empresa' : 'Pessoal'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.subscription_plan === 'Gratuito' ? 'bg-gray-100 text-gray-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.subscription_plan}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      {user.is_blocked ? (
                        <span className="text-red-600 text-xs font-medium">🚫 BLOQUEADO</span>
                      ) : user.is_active ? (
                        <span className="text-green-600 text-xs font-medium">✅ ATIVO</span>
                      ) : (
                        <span className="text-gray-600 text-xs font-medium">⏸️ INATIVO</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center space-x-1">
                      {user.hasProfile && (
                        <FaUser className="text-green-500" title="Tem perfil pessoal" />
                      )}
                      {user.hasBusinessProfile && (
                        <FaBuilding className="text-blue-500" title="Tem perfil de negócio" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {user.last_login_at ? (
                      <div>
                        {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                        <div className="text-xs text-gray-500">
                          {user.login_count} logins
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <select
                        value={availablePlans.find(p => p.name === user.subscription_plan)?.id || availablePlans.find(p => p.slug === 'free')?.id || ''}
                        onChange={(e) => {
                          const newPlanId = e.target.value;
                          const currentPlanId = availablePlans.find(p => p.name === user.subscription_plan)?.id;
                          if (newPlanId !== currentPlanId) {
                            const isUserWithoutSubscription = !user.subscription_plan || user.subscription_plan === 'Gratuito';
                            changePlan(user.id, user.email, newPlanId, isUserWithoutSubscription);
                          }
                        }}
                        disabled={changingPlan === user.id}
                        className={`text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          changingPlan === user.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {availablePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      {changingPlan === user.id && (
                        <div className="flex items-center text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                          Alterando...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center space-x-1">
                      {/* Botão de Bloquear/Desbloquear */}
                      <button
                        onClick={() => toggleUserBlock(user.id, user.email, user.is_blocked)}
                        disabled={refreshing}
                        className={`${
                          user.is_blocked 
                            ? 'bg-green-500 hover:bg-green-700' 
                            : 'bg-yellow-500 hover:bg-yellow-700'
                        } text-white p-1 rounded text-sm inline-flex items-center disabled:opacity-50`}
                        title={user.is_blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                      >
                        {user.is_blocked ? <FaCheck /> : <FaTimes />}
                      </button>
                      
                      {/* Botão de Excluir */}
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        disabled={refreshing}
                        className="bg-red-500 hover:bg-red-700 text-white p-1 rounded text-sm inline-flex items-center disabled:opacity-50"
                        title="Excluir usuário permanentemente"
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
      
      {/* Estatísticas */}
      {users.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-blue-800 font-bold text-lg">
              {users.length}
            </div>
            <div className="text-blue-600 text-sm">Total de Usuários</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-green-800 font-bold text-lg">
              {users.filter(u => u.is_active && !u.is_blocked).length}
            </div>
            <div className="text-green-600 text-sm">Usuários Ativos</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <div className="text-red-800 font-bold text-lg">
              {users.filter(u => u.is_blocked).length}
            </div>
            <div className="text-red-600 text-sm">Usuários Bloqueados</div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="text-purple-800 font-bold text-lg">
              {users.filter(u => u.subscription_plan !== 'Gratuito').length}
            </div>
            <div className="text-purple-600 text-sm">Usuários Pagantes</div>
          </div>
        </div>
      )}
    </div>
  );
}