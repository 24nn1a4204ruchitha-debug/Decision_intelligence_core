import { useCallback } from 'react';
import {
  getOverview,
  getRecentAnomalies,
  getRecentDecisions,
  getSystemHealth,
} from '@/api/dashboard';
import { useApiResource } from './use-api-resource';

export function useDashboardData() {
  const overview = useApiResource('dashboard-overview', useCallback((signal) => getOverview({ signal }), []));
  const recentDecisions = useApiResource('dashboard-recent-decisions', useCallback((signal) => getRecentDecisions({ signal }), []));
  const recentAnomalies = useApiResource('dashboard-recent-anomalies', useCallback((signal) => getRecentAnomalies({ signal }), []));
  const systemHealth = useApiResource('dashboard-system-health', useCallback((signal) => getSystemHealth({ signal }), []));

  return { overview, recentDecisions, recentAnomalies, systemHealth };
}