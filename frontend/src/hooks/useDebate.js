import { useState, useEffect, useRef, useCallback } from 'react';
import client from '../api/client';

export function useDebate(debateId, intervalMs = 4000) {
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchDebate = useCallback(async () => {
    if (!debateId) return;
    try {
      const res = await client.get(`/debates/${debateId}`);
      setDebate(res.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load debate');
      return null;
    } finally {
      setLoading(false);
    }
  }, [debateId]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(fetchDebate, intervalMs);
  }, [fetchDebate, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchDebate();
    return () => stopPolling();
  }, [debateId]);

  // Auto-stop polling when debate is completed
  useEffect(() => {
    if (debate?.status === 'completed') {
      stopPolling();
    }
  }, [debate?.status, stopPolling]);

  return { debate, loading, error, fetchDebate, startPolling, stopPolling };
}
