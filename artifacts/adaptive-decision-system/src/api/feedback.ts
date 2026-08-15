import { postJson } from './client';
import type { FeedbackRequest, FeedbackResponse, RequestOptions } from './types';

export function submit(
  body: FeedbackRequest,
  options?: RequestOptions,
): Promise<FeedbackResponse> {
  return postJson('/api/feedback', body, options);
}