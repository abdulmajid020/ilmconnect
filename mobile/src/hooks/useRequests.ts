import { useCallback, useEffect, useState } from 'react';
import { RequestsService, RespondRequestPayload } from '../services/requests.service';

export function useRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await RequestsService.getReceivedRequests();
      setRequests(Array.isArray(res) ? res : []);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const respondToRequest = useCallback(
    async (id: string, payload: RespondRequestPayload) => {
      await RequestsService.respondToRequest(id, payload);
      await loadRequests();
    },
    [loadRequests]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
  }, [loadRequests]);

  return {
    requests,
    setRequests,
    isLoading,
    refreshing,
    loadRequests,
    onRefresh,
    respondToRequest,
  };
}

