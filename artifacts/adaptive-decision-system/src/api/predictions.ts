import { postJson } from './client';
import type { PredictionRequest, PredictionResponse, RequestOptions } from './types';

export function predict(
  body: PredictionRequest,
  options?: RequestOptions,
): Promise<PredictionResponse> {
  return postJson('/api/predict', body, options);
}