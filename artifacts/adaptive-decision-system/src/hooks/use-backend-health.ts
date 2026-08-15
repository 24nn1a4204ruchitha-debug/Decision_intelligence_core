import { useCallback, useEffect, useState } from 'react';
import { readBackendHealth } from '@/api/health';

type HealthState = {
  status: 'loading' | 'online' | 'offline';
  label: string;
  detail: string;
};

const initialState: HealthState = {
  status: 'loading',
  label: 'Connecting',
  detail: 'Checking the decision service',
};

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthState>(initialState);
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => {
    setHealth(initialState);
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    readBackendHealth(controller.signal)
      .then((result) => {
        setHealth({
          status: 'online',
          label: 'Operational',
          detail: `Health endpoint: ${result.status}`,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHealth({
          status: 'offline',
          label: 'Unavailable',
          detail: 'Unable to reach the health endpoint',
        });
      });

    return () => controller.abort();
  }, [retryToken]);

  return { health, retry };
}