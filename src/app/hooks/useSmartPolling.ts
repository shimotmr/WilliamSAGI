import { useEffect, useRef, useCallback } from 'react';

/**
 * Smart polling hook that pauses when tab is hidden.
 * Reduces unnecessary API calls and Vercel serverless function invocations.
 */
export function useSmartPolling(
  callback: () => void,
  intervalMs: number,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        callbackRef.current();
      }
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    callbackRef.current();
    startPolling();

    const handleVisibility = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        stopPolling();
      } else {
        isVisibleRef.current = true;
        callbackRef.current(); // Refresh on return
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPolling, stopPolling, ...deps]);

  return { startPolling, stopPolling };
}
