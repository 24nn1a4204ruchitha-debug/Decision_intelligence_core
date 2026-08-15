import { get, postJson } from './client';
import type {
  ModelPerformanceResponse,
  ModelRetrainRequest,
  ModelRetrainResponse,
  RequestOptions,
} from './types';

export function getModelPerformance(options?: RequestOptions): Promise<ModelPerformanceResponse> {
  return get('/api/model/performance', options);
}

export function retrainModel(
  body?: ModelRetrainRequest,
  options?: RequestOptions,
): Promise<ModelRetrainResponse> {
  return postJson('/api/model/retrain', body, options);
}