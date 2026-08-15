import { postJson } from './client';
import type { DecisionEvaluationRequest, DecisionResponse, RequestOptions } from './types';

export function evaluate(
  body: DecisionEvaluationRequest,
  options?: RequestOptions,
): Promise<DecisionResponse> {
  return postJson('/api/decision/evaluate', body, options);
}