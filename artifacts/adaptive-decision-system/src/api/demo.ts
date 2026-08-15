import { get, postJson } from './client';
import type { DemoResponse, RequestOptions } from './types';

export function start(options?: RequestOptions): Promise<DemoResponse> {
  return postJson('/api/demo/start', undefined, options);
}

export function stop(options?: RequestOptions): Promise<DemoResponse> {
  return postJson('/api/demo/stop', undefined, options);
}

export function getStatus(options?: RequestOptions): Promise<DemoResponse> {
  return get('/api/demo/status', options);
}