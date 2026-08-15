import { get, postJson } from './client';
import type {
  AnomalyDetectionRequest,
  AnomalyListResponse,
  AnomalyResponse,
  RequestOptions,
} from './types';

export function detect(
  body: AnomalyDetectionRequest,
  options?: RequestOptions,
): Promise<AnomalyResponse> {
  return postJson('/api/anomaly/detect', body, options);
}

export function list(options?: RequestOptions): Promise<AnomalyListResponse> {
  return get('/api/anomalies', options);
}

export function getById(id: string, options?: RequestOptions): Promise<AnomalyResponse> {
  return get(`/api/anomalies/${encodeURIComponent(id)}`, options);
}