'use client';

import { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

type SyncAsaasButtonProps = {
  onSyncComplete?: () => void;
  className?: string;
};

export default function SyncAsaasButton({ onSyncComplete, className = '' }: SyncAsaasButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const syncSubscriptions = async () => {
    setLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado como administrador");
        return;
      }
      
      // Chamar API de sincronização
      const response = await fetch('/api/admin/subscriptions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao sincronizar assinaturas');
      }
      
      toast.success(`Sincronização concluída! Processadas ${result.total} assinaturas`);
      
      // Chamar callback se fornecido
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar assinaturas:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={syncSubscriptions}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Sincronizando...</span>
        </>
      ) : (
        <>
          <FaSync />
          <span>Sincronizar com Asaas</span>
        </>
      )}
    </button>
  );
} 