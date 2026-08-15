import { get } from './client';
import type { AuditResponse, RequestOptions } from './types';

export function getByDecisionId(
  decisionId: string,
  options?: RequestOptions,
): Promise<AuditResponse> {
  return get(`/api/audit/${encodeURIComponent(decisionId)}`, options);
}