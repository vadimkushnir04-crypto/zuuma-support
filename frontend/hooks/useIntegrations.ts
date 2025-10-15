// hooks/useIntegrations.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { integrationsAPI, Integration } from '../lib/api/integrations';

type ProcMap = Record<string, boolean>;

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<ProcMap>({});
  const refreshTimeoutRef = useRef<number | null>(null);

  const setProcessing = useCallback((id: string, v: boolean) => {
    setProcessingIds(prev => ({ ...prev, [id]: v }));
  }, []);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await integrationsAPI.getAllIntegrations();
      setIntegrations(Array.isArray(data) ? data : []);
      setError(null);
      return data;
    } catch (err) {
      console.error('useIntegrations: loadIntegrations error', err);
      setError('Не удалось загрузить интеграции');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [loadIntegrations]);

  const scheduleRefresh = useCallback((delay = 1200) => {
    if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = window.setTimeout(() => {
      loadIntegrations();
      refreshTimeoutRef.current = null;
    }, delay) as unknown as number;
  }, [loadIntegrations]);

  // 🔧 FIXED toggleIntegration
  const toggleIntegration = useCallback(async (id: string) => {
    const prev = integrations.find(i => i.id === id);
    if (!prev) {
      await loadIntegrations();
      throw new Error('Integration not found locally');
    }

    const optimisticStatus = prev.status === 'active' ? 'inactive' : 'active';

    // Оптимистичное обновление UI
    setIntegrations(list =>
      list.map(i => (i.id === id ? { ...i, status: optimisticStatus } : i))
    );

    setProcessing(id, true);

    try {
      const res = await integrationsAPI.toggleIntegration(id);

      if (res?.success && res.integration) {
        // 🧠 Явно указываем тип массива
        setIntegrations(list =>
          list.map(i => (i.id === id ? res.integration! : i)) as Integration[]
        );
      } else {
        scheduleRefresh();
      }

      scheduleRefresh();
      return res;
    } catch (err) {
      // rollback
      setIntegrations(list =>
        list.map(i => (i.id === id ? prev : i)) as Integration[]
      );
      scheduleRefresh();
      console.error('useIntegrations: toggleIntegration failed', err);
      throw err;
    } finally {
      setProcessing(id, false);
    }
  }, [integrations, loadIntegrations, scheduleRefresh, setProcessing]);

  // 🔧 FIXED deleteIntegration
  const deleteIntegration = useCallback(async (id: string) => {
    const prev = integrations.find(i => i.id === id);
    if (!prev) {
      await loadIntegrations();
      throw new Error('Integration not found locally');
    }

    // Оптимистичное удаление
    setIntegrations(list => list.filter(i => i.id !== id));
    setProcessing(id, true);

    try {
      const res = await integrationsAPI.deleteIntegration(id);
      if (!res?.success) {
        // rollback если сервер вернул ошибку
        setIntegrations(list => [prev, ...list] as Integration[]);
        scheduleRefresh();
      } else {
        scheduleRefresh();
      }
      return res;
    } catch (err) {
      setIntegrations(list => [prev, ...list] as Integration[]);
      scheduleRefresh();
      console.error('useIntegrations: deleteIntegration failed', err);
      throw err;
    } finally {
      setProcessing(id, false);
    }
  }, [integrations, loadIntegrations, scheduleRefresh, setProcessing]);

  const applyLocalUpdate = useCallback((updated: Integration) => {
    setIntegrations(list =>
      list.map(i => (i.id === updated.id ? updated : i)) as Integration[]
    );
  }, []);

  return {
    integrations,
    loading,
    error,
    processingIds,
    isProcessing: (id: string) => !!processingIds[id],
    toggleIntegration,
    deleteIntegration,
    refreshIntegrations: loadIntegrations,
    applyLocalUpdate,
  };
}
