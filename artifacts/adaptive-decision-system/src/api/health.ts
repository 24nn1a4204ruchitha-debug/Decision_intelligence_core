import { get } from './client';

export type BackendHealth = {
  status: string;
};

export async function readBackendHealth(signal?: AbortSignal): Promise<BackendHealth> {
  return get('/api/healthz', { signal });
}