import { get, postJson } from './client';
import type {
  PendingReviewsResponse,
  RequestOptions,
  ReviewActionRequest,
  ReviewActionResponse,
} from './types';

export function getPending(options?: RequestOptions): Promise<PendingReviewsResponse> {
  return get('/api/reviews/pending', options);
}

export function approve(
  decisionId: string,
  body?: ReviewActionRequest,
  options?: RequestOptions,
): Promise<ReviewActionResponse> {
  return postJson(`/api/reviews/${encodeURIComponent(decisionId)}/approve`, body, options);
}

export function reject(
  decisionId: string,
  body?: ReviewActionRequest,
  options?: RequestOptions,
): Promise<ReviewActionResponse> {
  return postJson(`/api/reviews/${encodeURIComponent(decisionId)}/reject`, body, options);
}

export function modify(
  decisionId: string,
  body: ReviewActionRequest,
  options?: RequestOptions,
): Promise<ReviewActionResponse> {
  return postJson(`/api/reviews/${encodeURIComponent(decisionId)}/modify`, body, options);
}