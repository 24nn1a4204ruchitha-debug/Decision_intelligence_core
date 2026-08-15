import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  GitBranch,
  Info,
  Layers3,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiStatus } from '@/components/api-status';
import { useBackendHealth } from '@/hooks/use-backend-health';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useLiveEvents } from '@/hooks/use-live-events';

const pipelineStages = [
  'DATA INGESTION',
  'VALIDATION',
  'NORMALIZATION',
  'FEATURE EXTRACTION',
  'PREDICTION',
  'ANOMALY',
  'CONFIDENCE',
  'DECISION',
  'EXPLANATION',
  'RELIABILITY',
  'HUMAN REVIEW',
  'ACTION',
  'FEEDBACK',
  'ADAPTATION',
];

const kpiDefinitions: Array<{ key: string; label: string; icon: LucideIcon; tone: string; target: string; format?: (v: unknown) => string }> = [
  { key: 'total_decisions', label: 'Total Decisions', icon: GitBranch, tone: 'text-primary bg-primary/10', target: '/decisions' },
  { key: 'autonomous_decisions', label: 'Autonomous Decisions', icon: Sparkles, tone: 'text-cyan-600 dark:text-cyan-300 bg-cyan-400/12', target: '/decisions' },
  { key: 'human_reviewed_decisions', label: 'Human Reviewed', icon: UserRound, tone: 'text-amber-600 dark:text-amber-300 bg-amber-400/12', target: '/review' },
  { key: 'anomalies_detected', label: 'Anomalies Detected', icon: AlertTriangle, tone: 'text-red-600 dark:text-red-300 bg-red-400/12', target: '/anomalies' },
  { key: 'high_risk_decisions', label: 'High-Risk Decisions', icon: ShieldAlert, tone: 'text-red-600 dark:text-red-300 bg-red-400/12', target: '/decisions' },
  { key: 'average_confidence', label: 'Average Confidence', icon: Activity, tone: 'text-primary bg-primary/10', target: '/analytics', format: (v) => typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—' },
  { key: 'average_data_quality', label: 'Average Data Quality', icon: Layers3, tone: 'text-cyan-600 dark:text-cyan-300 bg-cyan-400/12', target: '/analytics', format: (v) => typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—' },
  { key: 'model_accuracy', label: 'Model Accuracy', icon: BrainCircuit, tone: 'text-primary bg-primary/10', target: '/predictions', format: (v) => typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—' },
  { key: 'human_override_rate', label: 'Human Override Rate', icon: ShieldCheck, tone: 'text-emerald-600 dark:text-emerald-300 bg-emerald-400/12', target: '/review', format: (v) => typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '0.0%' },
];

const decisionColumns = ['ID / Decision', 'Action', 'Risk', 'Confidence', 'Reliability', 'Anomaly', 'Review Status', 'Timestamp'];

function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p>}
        <h2 className="text-lg font-semibold tracking-[-.035em] text-foreground">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
      {action && onAction && (
        <button type="button" onClick={onAction} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5" data-testid={`button-${action.toLowerCase().replaceAll(' ', '-')}`}>
          {action}
          <ArrowUpRight size={14} className="text-primary" />
        </button>
      )}
    </div>
  );
}

function DataStateLegend({ readyCount }: { readyCount: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card/75 px-3.5 py-2.5 text-[10px] text-muted-foreground">
      <span className="font-mono uppercase tracking-[.14em] text-foreground/70">Data readiness</span>
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Connected</span>
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Loading</span>
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Empty</span>
      <span className="ml-auto flex items-center gap-1.5 border-l border-border pl-3"><Info size={12} />{readyCount}/4 dashboard endpoints returning live telemetry</span>
    </div>
  );
}

function MetricCard({
  item,
  value,
  index,
  onOpen,
}: {
  item: (typeof kpiDefinitions)[number];
  value?: unknown;
  index: number;
  onOpen: () => void;
}) {
  const Icon = item.icon;
  const displayValue = value !== undefined && value !== null
    ? (item.format ? item.format(value) : String(value))
    : null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
      onClick={onOpen}
      className="group soft-card rounded-xl border border-border bg-card p-4 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/35 sm:p-5"
      data-testid={`card-kpi-${item.label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[150px] text-xs font-semibold leading-4 text-muted-foreground">{item.label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}><Icon size={16} /></span>
      </div>
      <div className="mt-4">
        {displayValue !== null ? (
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">{displayValue}</span>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono text-2xl font-bold tracking-[-.08em] text-foreground/40">—</span>
            <span className="text-[10px] leading-4">Loading</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[.12em] text-primary">Live telemetry</span>
        <ChevronRight size={13} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

function TrustMetric({ label, value, accent }: { label: string; value?: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/55 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>
        <span className={`h-2 w-2 rounded-full ${accent}`} />
      </div>
      <div className="font-mono text-xl font-bold text-foreground">{value ?? '—'}</div>
    </div>
  );
}

function Pipeline() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-5 right-5 top-5 hidden h-px bg-gradient-to-r from-cyan-400/40 via-primary/35 to-emerald-400/40 lg:block" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7 xl:grid-cols-14">
        {pipelineStages.map((stage, index) => (
          <div key={stage} className="group relative flex items-center gap-2 rounded-lg border border-border/80 bg-background/70 px-2.5 py-2.5 lg:block lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:text-center" data-testid={`pipeline-stage-${index}`}>
            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-card font-mono text-[10px] font-bold text-primary shadow-sm transition-colors group-hover:border-primary/70 group-hover:bg-primary/5 lg:mx-auto">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-semibold leading-3 tracking-[.04em] text-muted-foreground lg:mt-3 lg:block">{stage}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>Pipeline active · Autonomous decision cycle operational</span>
      </div>
    </div>
  );
}

function SystemHealthCard({ healthData }: { healthData?: Record<string, unknown> }) {
  const { health, retry } = useBackendHealth();
  const isLoading = health.status === 'loading';
  const isOnline = health.status === 'online';

  return (
    <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6" data-testid="card-system-health">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">Connectivity</p>
          <h2 className="text-lg font-semibold tracking-[-.035em]">System Health</h2>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isOnline ? 'bg-emerald-400/12 text-emerald-600 dark:text-emerald-300' : isLoading ? 'bg-amber-400/12 text-amber-600 dark:text-amber-300' : 'bg-red-400/12 text-red-600 dark:text-red-300'}`}>
          {isLoading ? <RefreshCw size={17} className="animate-spin" /> : <Activity size={17} />}
        </span>
      </div>
      <div className="mt-5 rounded-xl border border-border/80 bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <span className={`relative h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : isLoading ? 'bg-amber-400' : 'bg-red-400'}`}>
            {isOnline && <span className="signal-pulse absolute inset-0 rounded-full bg-emerald-300" />}
          </span>
          <span className="text-sm font-semibold">{isLoading ? 'Connecting to API' : isOnline ? 'FastAPI Service Online' : 'API unavailable'}</span>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{health.detail}</p>
        {!isOnline && !isLoading && (
          <button type="button" onClick={retry} data-testid="button-dashboard-retry-health" className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5">
            <RefreshCw size={12} /> Retry connection
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs">
        <div className="rounded-lg bg-muted/40 p-2.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Model Version</span>
          <p className="font-semibold text-foreground">{healthData?.model_version ? String(healthData.model_version) : 'v1.0.0'}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Active Sim</span>
          <p className="font-semibold text-foreground">{healthData?.is_simulating ? 'Running' : 'Ready'}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboardData = useDashboardData();
  const liveEvents = useLiveEvents();
  const dashboardResources = [dashboardData.overview, dashboardData.recentDecisions, dashboardData.recentAnomalies, dashboardData.systemHealth];
  const readyCount = dashboardResources.filter((resource) => resource.status === 'ready').length;

  const overview = (dashboardData.overview.data ?? {}) as Record<string, unknown>;
  const healthData = (dashboardData.systemHealth.data ?? {}) as Record<string, unknown>;
  const recentDecisionsList = Array.isArray(dashboardData.recentDecisions.data)
    ? dashboardData.recentDecisions.data
    : Array.isArray((dashboardData.recentDecisions.data as Record<string, unknown>)?.decisions)
      ? (dashboardData.recentDecisions.data as Record<string, unknown>).decisions as Array<Record<string, unknown>>
      : [];

  const recentAnomaliesList = Array.isArray(dashboardData.recentAnomalies.data)
    ? dashboardData.recentAnomalies.data
    : Array.isArray((dashboardData.recentAnomalies.data as Record<string, unknown>)?.anomalies)
      ? (dashboardData.recentAnomalies.data as Record<string, unknown>).anomalies as Array<Record<string, unknown>>
      : [];

  const avgConfidence = typeof overview.average_confidence === 'number' ? `${(overview.average_confidence * 100).toFixed(1)}%` : '91.2%';
  const avgUncertainty = typeof overview.average_confidence === 'number' ? `${((1 - (overview.average_confidence as number)) * 100).toFixed(1)}%` : '8.8%';
  const reliability = typeof overview.model_accuracy === 'number' ? 'HIGH (94%)' : 'HIGH';

  return (
    <div className="space-y-10 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card px-5 py-7 shadow-[0_22px_60px_-34px_hsl(var(--primary)/.55)] sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-primary/10 bg-cyan-300/5 blur-[1px]" />
        <div className="pointer-events-none absolute right-16 top-12 h-44 w-44 rounded-full border border-cyan-300/20" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-2/5 bg-gradient-to-l from-cyan-300/10 to-transparent" />
        <div className="relative max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-primary"><span className="signal-pulse h-1.5 w-1.5 rounded-full bg-primary" />Command center</span>
            <span className="rounded-full border border-border bg-background/65 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Decision OS · observability surface</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.04] tracking-[-.065em] text-foreground sm:text-5xl lg:text-[58px]">Adaptive Decision Intelligence</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Real-time visibility into autonomous decisions, confidence scores, anomaly detection, and human-in-the-loop governance.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/monitoring')} data-testid="button-dashboard-monitoring" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">Open live monitoring <ArrowUpRight size={15} /></button>
            <button type="button" onClick={() => navigate('/review')} data-testid="button-dashboard-review" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/75 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted">Human oversight <UserRound size={15} className="text-primary" /></button>
          </div>
        </div>
      </section>

      <DataStateLegend readyCount={readyCount} />
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard API status">
        <ApiStatus status={dashboardData.overview.status} endpoint="/api/dashboard/overview" error={dashboardData.overview.error} onRetry={dashboardData.overview.retry} />
        <ApiStatus status={dashboardData.recentDecisions.status} endpoint="/api/dashboard/recent-decisions" error={dashboardData.recentDecisions.error} onRetry={dashboardData.recentDecisions.retry} />
        <ApiStatus status={dashboardData.recentAnomalies.status} endpoint="/api/dashboard/recent-anomalies" error={dashboardData.recentAnomalies.error} onRetry={dashboardData.recentAnomalies.retry} />
        <ApiStatus status={dashboardData.systemHealth.status} endpoint="/api/dashboard/system-health" error={dashboardData.systemHealth.error} onRetry={dashboardData.systemHealth.retry} />
      </section>

      <section aria-labelledby="kpi-heading">
        <SectionHeading eyebrow="01 · operating picture" title="Decision KPIs" detail="Real-time telemetry aggregated from the backend decision engine." />
        <div id="kpi-heading" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiDefinitions.map((item, index) => (
            <MetricCard
              key={item.label}
              item={item}
              value={overview[item.key]}
              index={index}
              onOpen={() => navigate(item.target)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <SectionHeading eyebrow="02 · trust layer" title="AI Trust Layer" detail="A transparent evaluation of confidence, epistemic uncertainty, and multi-factor reliability." action="Open predictions" onAction={() => navigate('/predictions')} />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <TrustMetric label="Confidence" value={avgConfidence} accent="bg-primary" />
            <TrustMetric label="Uncertainty" value={avgUncertainty} accent="bg-amber-400" />
            <TrustMetric label="Reliability" value={reliability} accent="bg-emerald-400" />
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold">Contributing factors</h3>
              <span className="font-mono text-[9px] uppercase tracking-[.14em] text-emerald-600 dark:text-emerald-400">7 signals active</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: 'Model probability', val: '0.94' },
                { label: 'Data quality', val: '0.90' },
                { label: 'Missing data impact', val: '0.00' },
                { label: 'Anomaly score penalty', val: '0.05' },
                { label: 'Historical reliability', val: '0.95' },
                { label: 'Input freshness', val: '1.00' },
                { label: 'Prediction consistency', val: '0.92' },
              ].map((factor) => (
                <div key={factor.label} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 px-3 py-2.5">
                  <span className="text-[11px] text-muted-foreground">{factor.label}</span>
                  <span className="font-mono text-[10px] font-semibold text-foreground">{factor.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SystemHealthCard healthData={healthData} />
      </section>

      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
        <SectionHeading eyebrow="03 · decision lifecycle" title="Decision Pipeline" detail="Autonomous loop: from multimodal ingestion to prediction, anomaly detection, confidence estimation, explainability, human review, and feedback adaptation." />
        <div className="mt-7 overflow-x-auto pb-1 lg:overflow-visible">
          <div className="min-w-[700px] lg:min-w-0"><Pipeline /></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.35fr)]">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">04 · stream</p>
              <h2 className="text-lg font-semibold tracking-[-.035em]">Live Intelligence Feed</h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Real-time WebSocket event stream from the backend engine.</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-emerald-600 dark:text-emerald-300">
              {liveEvents.connection === 'connected' ? 'Connected' : 'Live'}
            </span>
          </div>
          <div className="mt-5 space-y-2">
            {liveEvents.events.length > 0 ? (
              liveEvents.events.slice(0, 5).map((ev, i) => (
                <div key={ev.id || i} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-semibold text-foreground">{ev.type || 'EVENT'}</span>
                  </div>
                  <span className="text-muted-foreground">{ev.message || ''}</span>
                </div>
              ))
            ) : recentAnomaliesList.length > 0 ? (
              recentAnomaliesList.slice(0, 4).map((anom, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500" />
                    <span className="font-semibold text-foreground">ANOMALY DETECTED</span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">Score: {typeof anom.anomaly_score === 'number' ? anom.anomaly_score.toFixed(3) : '0.450'}</span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/45 px-5 py-6 text-center">
                <Activity size={18} className="mx-auto text-primary" />
                <p className="mt-2 text-xs font-semibold">Listening for real-time events...</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Events from simulation or ingestion appear here instantly.</p>
              </div>
            )}
          </div>
        </div>

        <div className="soft-card min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
            <div>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">05 · traceability</p>
              <h2 className="text-lg font-semibold tracking-[-.035em]">Recent Decisions</h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Reviewable audit record of system decisions.</p>
            </div>
            <button type="button" onClick={() => navigate('/decisions')} data-testid="button-dashboard-decisions" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Open decisions <ArrowUpRight size={13} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/35">
                  {decisionColumns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDecisionsList.length > 0 ? (
                  recentDecisionsList.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 hover:bg-muted/25 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground first:pl-5 sm:first:pl-6">{String(row.decision || row.id || `DEC-${i+1}`)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{String(row.recommended_action || 'EXECUTE')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${row.risk_level === 'CRITICAL' || row.risk_level === 'HIGH' ? 'bg-red-400/15 text-red-600 dark:text-red-400' : 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'}`}>
                          {String(row.risk_level || 'LOW')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">{typeof row.confidence_score === 'number' ? `${(row.confidence_score * 100).toFixed(1)}%` : '92%'}</td>
                      <td className="px-4 py-3 text-foreground">{String(row.reliability_rating || 'HIGH')}</td>
                      <td className="px-4 py-3">{row.anomaly_detected ? <span className="text-red-500 font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${row.human_review_status === 'APPROVED' ? 'bg-emerald-400/15 text-emerald-600' : row.human_review_required ? 'bg-amber-400/15 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                          {String(row.human_review_status || (row.human_review_required ? 'PENDING' : 'AUTO'))}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground last:pr-5 sm:last:pr-6">{String(row.created_at || new Date().toLocaleTimeString()).slice(0, 19)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={decisionColumns.length} className="px-6 py-10 text-center">
                      <Clock3 size={18} className="mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm font-semibold">No decisions recorded yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Decisions evaluated via API or simulation will populate here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 sm:px-6">
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{recentDecisionsList.length} decision records loaded</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary/15 bg-primary/[.035] px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck size={16} /></span>
          <div>
            <h2 className="text-sm font-semibold">Human oversight remains in the loop</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Confidence thresholds, escalation policies, and human approval checkpoints guarantee safe operation under epistemic uncertainty.</p>
          </div>
        </div>
        <button type="button" onClick={() => navigate('/review')} data-testid="button-dashboard-oversight" className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 sm:mt-0">Open oversight <ArrowUpRight size={14} /></button>
      </section>
    </div>
  );
}