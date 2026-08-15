import { type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error-boundary';
import Dashboard from '@/pages/dashboard';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/layouts/app-shell';
import { AnomaliesPage, DataIngestionPage, DecisionsPage, PredictionsPage } from '@/pages/operations';
import { AnalyticsPage, AuditTrailPage, DemoPage, HumanReviewPage, LiveMonitoringPage, SettingsPage } from '@/pages/oversight';

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="monitoring" element={<LiveMonitoringPage />} />
          <Route path="ingestion" element={<DataIngestionPage />} />
          <Route path="predictions" element={<PredictionsPage />} />
          <Route path="anomalies" element={<AnomaliesPage />} />
          <Route path="decisions" element={<DecisionsPage />} />
          <Route path="review" element={<HumanReviewPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit" element={<AuditTrailPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </RoutedErrorBoundary>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <BrowserRouter basename={basename}>
      <Router />
    </BrowserRouter>
  );
}

export default App;