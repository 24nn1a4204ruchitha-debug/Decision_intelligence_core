import { get } from './client';
import type {
  DashboardOverviewResponse,
  DashboardRecentAnomaliesResponse,
  DashboardRecentDecisionsResponse,
  DashboardSystemHealthResponse,
  RequestOptions,
} from './types';

export function getOverview(options?: RequestOptions): Promise<DashboardOverviewResponse> {
  return get('/api/dashboard/overview', options);
}

export function getRecentDecisions(options?: RequestOptions): Promise<DashboardRecentDecisionsResponse> {
  return get('/api/dashboard/recent-decisions', options);
}

export function getRecentAnomalies(options?: RequestOptions): Promise<DashboardRecentAnomaliesResponse> {
  return get('/api/dashboard/recent-anomalies', options);
}

export function getSystemHealth(options?: RequestOptions): Promise<DashboardSystemHealthResponse> {
  return get('/api/dashboard/system-health', options);
}