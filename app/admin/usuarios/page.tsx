"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { FaSync, FaTrash, FaUser, FaBuilding, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
  hasProfile?: boolean;
  hasBusinessProfile?: boolean;
  profileId?: string;
  businessProfileId?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Carregar usuários e suas relações
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      
      // Buscar usuários da tabela auth.users (via API)
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      
      const data = await response.json();
      
      if (data.success && data.users) {
        // Buscar perfis para verificar relações
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, user_id');
          
        // Buscar perfis de negócios para verificar relações
        const { data: businessProfiles } = await supabase
          .from('business_profiles')
          .select('id, user_id');
        
        // Mapear usuários com suas relações
        const mappedUsers = data.users.map((user: any) => {
          const userProfile = profiles?.find(p => p.id === user.id || p.email === user.email);
          const userBusinessProfile = businessProfiles?.find(bp => bp.user_id === user.id);
          
          return {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            created_at: user.created_at,
            hasProfile: !!userProfile,
            hasBusinessProfile: !!userBusinessProfile,
            profileId: userProfile?.id,
            businessProfileId: userBusinessProfile?.id
          };
        });
        
        setUsers(mappedUsers);
      } else {
        setError('Não foi possível carregar os usuários');
      }
    } catch (error: any) {
      setError(`Erro ao carregar usuários: ${error.message}`);
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Sincronizar perfil do usuário
  const syncUserProfile = async (userId: string, email: string) => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/admin/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, email })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao sincronizar perfil');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Perfil de ${email} sincronizado com sucesso`);
        
        // Recarregar usuários após a sincronização
        await loadUsers();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setError(`Erro ao sincronizar perfil: ${error.message}`);
      console.error('Erro ao sincronizar perfil:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Limpar dados duplicados
  const cleanDuplicateData = async (email: string) => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/admin/clean-duplicate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao limpar dados duplicados');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Dados duplicados de ${email} limpos com sucesso`);
        
        // Recarregar usuários após a limpeza
        await loadUsers();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setError(`Erro ao limpar dados duplicados: ${error.message}`);
      console.error('Erro ao limpar dados duplicados:', error);
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
              <th className="px-4 py-2 text-left">Data de Criação</th>
              <th className="px-4 py-2 text-center">Perfil</th>
              <th className="px-4 py-2 text-center">Perfil de Negócio</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-2 text-center">
                  <div className="flex justify-center my-4">
                    <FaSync className="animate-spin text-2xl text-blue-500" />
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-2 text-center">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-2 text-sm font-mono">{user.id.substring(0, 8)}...</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.name || '-'}</td>
                  <td className="px-4 py-2">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {user.hasProfile ? (
                      <FaCheck className="text-green-500 inline" title="Tem perfil" />
                    ) : (
                      <FaTimes className="text-red-500 inline" title="Sem perfil" />
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {user.hasBusinessProfile ? (
                      <FaCheck className="text-green-500 inline" title="Tem perfil de negócio" />
                    ) : (
                      <FaTimes className="text-red-500 inline" title="Sem perfil de negócio" />
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => syncUserProfile(user.id, user.email)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Sincronizar perfil"
                      >
                        <FaSync className={refreshing ? 'animate-spin' : ''} />
                      </button>
                      <button 
                        onClick={() => cleanDuplicateData(user.email)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Limpar dados duplicados"
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
  );
} 