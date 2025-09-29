import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface HighlightUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  type: string;
}

interface Highlight {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaDuration?: number;
  isActive: boolean;
  isAdminPost: boolean;
  viewCount: number;
  status: string;
  moderationStatus: string;
  paymentStatus?: string;
  isPaid?: boolean;
  expiresAt: string | null;
  createdAt: string;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
  user: HighlightUser;
}

interface HighlightStats {
  total: number;
  pending_payment: number;
  pending_review: number;
  active: number;
  rejected: number;
  expired: number;
  pending: number;
  inactive: number;
}

interface UseHighlightsOptions {
  status?: string;
  adminOnly?: boolean;
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHighlightsReturn {
  highlights: Highlight[];
  stats: HighlightStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };

  // Actions
  refreshHighlights: () => Promise<void>;
  updateHighlight: (id: string, data: Partial<Highlight>) => Promise<boolean>;
  deleteHighlight: (id: string) => Promise<boolean>;
  moderateHighlight: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<boolean>;

  // Optimistic updates
  optimisticUpdate: (id: string, data: Partial<Highlight>) => void;
  optimisticDelete: (id: string) => void;
}

export function useHighlights(options: UseHighlightsOptions = {}): UseHighlightsReturn {
  const {
    status = 'all',
    adminOnly = false,
    limit = 50,
    offset = 0,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [stats, setStats] = useState<HighlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 50
  });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build API URL
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      status,
      adminOnly: adminOnly.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });
    return `/api/admin/highlights?${params.toString()}`;
  }, [status, adminOnly, limit, offset]);

  // Fetch highlights
  const fetchHighlights = useCallback(async (showLoading = true) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(buildApiUrl(), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar highlights');
      }

      // Update state
      setHighlights(data.data || data.highlights || []);
      setStats(data.stats || null);
      setPagination({
        total: data.pagination?.total || 0,
        offset: data.pagination?.offset || 0,
        limit: data.pagination?.limit || 50
      });

      console.log('[useHighlights] Dados carregados:', {
        total: data.data?.length || 0,
        stats: data.stats
      });

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useHighlights] Erro ao buscar highlights:', err);
        setError(err.message || 'Erro ao carregar highlights');
        setHighlights([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [buildApiUrl]);

  // Refresh function
  const refreshHighlights = useCallback(async () => {
    await fetchHighlights(false);
  }, [fetchHighlights]);

  // Update highlight
  const updateHighlight = useCallback(async (id: string, data: Partial<Highlight>): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/highlights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...data })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar highlight');
      }

      // Update local state
      setHighlights(prev => prev.map(h =>
        h.id === id ? { ...h, ...data, ...result.data } : h
      ));

      // Refresh stats
      await refreshHighlights();

      return true;
    } catch (err: any) {
      console.error('[useHighlights] Erro ao atualizar highlight:', err);
      setError(err.message);
      return false;
    }
  }, [refreshHighlights]);

  // Delete highlight
  const deleteHighlight = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/highlights?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao excluir highlight');
      }

      // Remove from local state
      setHighlights(prev => prev.filter(h => h.id !== id));

      // Refresh stats
      await refreshHighlights();

      return true;
    } catch (err: any) {
      console.error('[useHighlights] Erro ao excluir highlight:', err);
      setError(err.message);
      return false;
    }
  }, [refreshHighlights]);

  // Moderate highlight
  const moderateHighlight = useCallback(async (
    id: string,
    moderationStatus: 'approved' | 'rejected',
    reason?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = { moderationStatus };
      if (reason) {
        updateData.rejectionReason = reason;
      }

      return await updateHighlight(id, updateData);
    } catch (err: any) {
      console.error('[useHighlights] Erro ao moderar highlight:', err);
      return false;
    }
  }, [updateHighlight]);

  // Optimistic update (for immediate UI feedback)
  const optimisticUpdate = useCallback((id: string, data: Partial<Highlight>) => {
    setHighlights(prev => prev.map(h =>
      h.id === id ? { ...h, ...data } : h
    ));
  }, []);

  // Optimistic delete (for immediate UI feedback)
  const optimisticDelete = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    fetchHighlights(true);
  }, [fetchHighlights]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshHighlights();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refreshHighlights]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    highlights,
    stats,
    loading,
    error,
    pagination,
    refreshHighlights,
    updateHighlight,
    deleteHighlight,
    moderateHighlight,
    optimisticUpdate,
    optimisticDelete
  };
}