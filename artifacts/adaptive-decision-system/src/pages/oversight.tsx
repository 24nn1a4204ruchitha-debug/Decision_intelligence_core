import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  Database,
  FileClock,
  GitBranch,
  Info,
  LineChart as LineChartIcon,
  Radio,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCallback, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LiveEventFeed } from '@/components/live-event-feed';
import { EmptyState, ChartEmptyState, MetricPlaceholder, SectionTitle, SurfaceHeader, UnavailableNotice } from '@/components/surface-primitives';
import { ReviewActionModal, ReviewCard, ReviewDetail, ReviewQueueEmpty, type ReviewAction, type ReviewRecord } from '@/components/review-components';
import { ApiResponsePreview, ApiStatus } from '@/components/api-status';
import { getPending, approve, modify, reject } from '@/api/reviews';
import { getModelPerformance, retrainModel } from '@/api/analytics';
import { getByDecisionId } from '@/api/audit';
import { getStatus as getDemoStatus, start as startDemo, stop as stopDemo } from '@/api/demo';
import type { ApiRecord, JsonObject, PendingReviewsResponse } from '@/api/types';
import { useApiMutation, useApiResource } from '@/hooks/use-api-resource';
import { useBackendHealth } from '@/hooks/use-backend-health';
import { useLiveEvents } from '@/hooks/use-live-events';
import { useTheme } from '@/hooks/use-theme';

function HealthCard() {
  const { health, retry } = useBackendHealth();
  const isLoading = health.status === 'loading';
  const isOnline = health.status === 'online';
  return (
    <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
      <SectionTitle eyebrow="01 · system state" title="System health" detail="Connectivity is the only live status currently available to this frontend." action={<Wifi size={17} className={isOnline ? 'text-emerald-500' : 'text-muted-foreground'} />} />
      <div className="mt-6 rounded-xl border border-border/80 bg-background/55 p-4">
        <div className="flex items-center gap-2"><span className={`relative h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : isLoading ? 'bg-amber-400' : 'bg-red-400'}`} /> <span className="text-sm font-semibold">{isLoading ? 'Connecting to API' : isOnline ? 'API connected' : 'API unavailable'}</span></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{health.detail}</p>
        {!isOnline && !isLoading && <button type="button" onClick={retry} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Retry connection</button>}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3"><MetricPlaceholder label="Queue depth" /><MetricPlaceholder label="Model state" /><MetricPlaceholder label="Latency" /></div>
    </div>
  );
}

function EmptySignalPanel({ title, detail, icon: Icon = Activity }: { title: string; detail: string; icon?: typeof Activity }) {
  return (
    <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
      <SectionTitle eyebrow="Telemetry" title={title} detail={detail} />
      <div className="mt-5"><EmptyState title="No signal data" detail="This panel will populate when the corresponding telemetry is available. Nothing is being inferred locally." icon={Icon} action="Awaiting live data" /></div>
    </div>
  );
}

function EmptyRechartsFrame({ kind }: { kind: 'area' | 'bar' | 'line' | 'pie' }) {
  return (
    <div className="relative h-[220px] overflow-hidden rounded-xl border border-dashed border-border bg-background/40">
      <div className="absolute inset-0 opacity-35" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'bar' ? (
            <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
          ) : kind === 'line' ? (
            <LineChart data={[]}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="value" stroke="hsl(var(--primary))" /></LineChart>
          ) : kind === 'pie' ? (
            <PieChart><Tooltip /><Pie data={[]} dataKey="value" nameKey="label" /></PieChart>
          ) : (
            <AreaChart data={[]}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Area dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / .12)" /></AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-card/35 px-4"><ChartEmptyState /></div>
    </div>
  );
}

export function LiveMonitoringPage() {
  const liveEvents = useLiveEvents();
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="1" eyebrow="Operations / live signal" title="Live monitoring" description="An operations center for watching system health, event activity, decision flow, anomalies, and confidence changes as they arrive." icon={Radio} tone="cyan" status="WebSocket-ready" />
      <UnavailableNotice detail="Live monitoring will show actual telemetry only when the configured backend and WebSocket are available." />
      <HealthCard />
      <LiveEventFeed events={liveEvents.events} connection={liveEvents.connection} detail={liveEvents.detail} onRetry={liveEvents.retry} />
      <section className="grid gap-5 xl:grid-cols-2">
        <EmptySignalPanel title="Recent decisions" detail="Latest decision records will be shown here without duplicating the dashboard table." icon={GitBranch} />
        <EmptySignalPanel title="Anomaly alerts" detail="Anomaly alerts will appear here when live anomaly events are received." icon={AlertTriangle} />
        <EmptySignalPanel title="Confidence changes" detail="Confidence movements will be derived from real events and displayed with their timestamps." icon={Activity} />
        <EmptySignalPanel title="Latest activity" detail="The latest activity timeline is reserved for backend event history." icon={Clock3} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="05 · risk posture" title="Risk distribution" detail="Risk bands will be charted from returned decision telemetry." /><div className="mt-5"><EmptyRechartsFrame kind="bar" /></div></div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="06 · confidence posture" title="Confidence distribution" detail="Confidence bands will be charted from returned prediction telemetry." /><div className="mt-5"><EmptyRechartsFrame kind="area" /></div></div>
      </section>
    </div>
  );
}

export function HumanReviewPage() {
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);
  const [action, setAction] = useState<ReviewAction | null>(null);
  const pending = useApiResource('reviews-pending', useCallback((signal) => getPending({ signal }), []));
  const reviewAction = useApiMutation<{ action: ReviewAction; decisionId: string; body: JsonObject }, ApiRecord>(useCallback(({ action: selectedAction, decisionId, body }, signal) => {
    if (selectedAction === 'approve') return approve(decisionId, body, { signal });
    if (selectedAction === 'reject') return reject(decisionId, body, { signal });
    return modify(decisionId, body, { signal });
  }, []));
  const reviews = useMemo(() => normalizeReviews(pending.data), [pending.data]);
  useEffect(() => {
    if (!selectedReview && reviews.length > 0) setSelectedReview(reviews[0]);
  }, [reviews, selectedReview]);
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="2" eyebrow="Governance / human checkpoint" title="Human review" description="A focused checkpoint for decisions that require human judgment before they can move forward." icon={ShieldCheck} tone="amber" status="Review queue ready" />
      <UnavailableNotice detail="No review records are connected. Actions remain disabled until the backend review contract is available." />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
           <SectionTitle eyebrow="01 · pending queue" title="Decisions requiring attention" detail="Pending decisions will be listed with their risk and confidence context." action={<span className="rounded-full border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">{reviews.length} pending</span>} />
           <div className="mt-6">{pending.status === 'loading' && <ApiStatus status={pending.status} endpoint="/api/reviews/pending" />}{pending.status === 'error' && <ApiStatus status={pending.status} endpoint="/api/reviews/pending" error={pending.error} onRetry={pending.retry} />}{pending.status === 'ready' && reviews.length === 0 && <ReviewQueueEmpty />}{reviews.length > 0 && <div className="space-y-2">{reviews.map((review) => <ReviewCard key={review.id} review={review} onSelect={() => setSelectedReview(review)} />)}</div>}{pending.data && reviews.length === 0 && <ApiResponsePreview value={pending.data} />}</div>
        </div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle eyebrow="02 · evidence review" title="Review detail" detail="Inspect original data, model context, rationale, and recommended action before responding." />
           <div className="mt-6"><ReviewDetail review={selectedReview} onAction={setAction} disabled={reviewAction.status === 'loading'} /></div>
        </div>
      </section>
      <section className="rounded-xl border border-primary/15 bg-primary/[.035] px-5 py-5 sm:px-6"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound size={16} /></span><div><h2 className="text-sm font-semibold">Human judgment stays explicit</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Approve, reject, and modify flows are prepared with confirmation dialogs and will remain unavailable rather than implying a successful action.</p></div></div></section>
       <ReviewActionModal action={action} decisionId={selectedReview?.id} status={reviewAction.status} error={reviewAction.error} onClose={() => setAction(null)} onSubmit={(selectedAction, note) => { if (!selectedReview) return; void reviewAction.execute({ action: selectedAction, decisionId: selectedReview.id, body: selectedAction === 'modify' && note.trim() ? { note } : {} }); }} />
       {reviewAction.data && <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-emerald-400/20 bg-card p-4 shadow-xl"><ApiStatus status="success" endpoint={`/api/reviews/${selectedReview?.id ?? 'decision_id'}/${action ?? 'action'}`} /> <ApiResponsePreview value={reviewAction.data} /></div>}
    </div>
  );
}

function normalizeReviews(value: PendingReviewsResponse | undefined): ReviewRecord[] {
  if (!value) return [];
  const candidate = Array.isArray(value) ? value : value.reviews ?? value.items ?? value.data;
  if (!Array.isArray(candidate)) return [];
  return candidate.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = record.id ?? record.decision_id ?? record.decisionId;
    if (id === undefined || id === null) return [];
    return [{
      id: String(id),
      originalData: record.originalData ?? record.original_data ?? record.input,
      prediction: typeof (record.prediction ?? record.prediction_result) === 'string' ? String(record.prediction ?? record.prediction_result) : undefined,
      confidence: typeof record.confidence === 'number' ? record.confidence : undefined,
      uncertainty: typeof record.uncertainty === 'number' ? record.uncertainty : undefined,
      anomaly: typeof (record.anomaly ?? record.anomaly_score) === 'number' ? Number(record.anomaly ?? record.anomaly_score) : undefined,
      risk: typeof record.risk === 'string' ? record.risk : undefined,
      explanation: typeof record.explanation === 'string' ? record.explanation : undefined,
      recommendedAction: typeof (record.recommendedAction ?? record.recommended_action) === 'string' ? String(record.recommendedAction ?? record.recommended_action) : undefined,
    }];
  });
}

const analyticsCharts: Array<{ title: string; detail: string; kind: 'area' | 'bar' | 'line' | 'pie'; icon: typeof BarChart3 }> = [
  { title: 'Decision volume', detail: 'Decision counts across the selected period.', kind: 'bar', icon: GitBranch },
  { title: 'Confidence over time', detail: 'Confidence movement for returned predictions.', kind: 'line', icon: Activity },
  { title: 'Anomaly rate', detail: 'Anomaly frequency relative to observed activity.', kind: 'area', icon: AlertTriangle },
  { title: 'Data quality', detail: 'Quality signals across ingested records.', kind: 'line', icon: Database },
  { title: 'Human intervention rate', detail: 'Human checkpoint activity over time.', kind: 'area', icon: UserRound },
  { title: 'Prediction accuracy', detail: 'Accuracy from the model performance contract.', kind: 'line', icon: CheckCircle2 },
  { title: 'Risk distribution', detail: 'Decision distribution by risk band.', kind: 'pie', icon: ShieldAlert },
  { title: 'Model performance', detail: 'Model metrics returned by the backend.', kind: 'bar', icon: LineChartIcon },
];

export function AnalyticsPage() {
  const performance = useApiResource('model-performance', useCallback((signal) => getModelPerformance({ signal }), []));
  const retrain = useApiMutation<void, ApiRecord>(useCallback((_input, signal) => retrainModel(undefined, { signal }), []));
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="3" eyebrow="Governance / operating patterns" title="Analytics" description="Measure how decisions, confidence, anomalies, data quality, and human intervention behave over time." icon={BarChart3} tone="cyan" status="Charts ready" />
      <UnavailableNotice detail="Analytics charts are intentionally empty until real series are returned by the backend." />
      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><SectionTitle eyebrow="00 · model contract" title="Model performance response" detail="The exact performance schema will be rendered as returned by the FastAPI service." /><button type="button" disabled={retrain.status === 'loading'} onClick={() => void retrain.execute(undefined)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">{retrain.status === 'loading' ? 'Retraining…' : 'Request retraining'}</button></div><div className="mt-5"><ApiStatus status={performance.status} endpoint="/api/model/performance" error={performance.error} onRetry={performance.retry} />{performance.data && <ApiResponsePreview value={performance.data} />}{(retrain.status === 'error' || retrain.status === 'success') && <div className="mt-3"><ApiStatus status={retrain.status} endpoint="/api/model/retrain" error={retrain.error} />{retrain.data && <ApiResponsePreview value={retrain.data} />}</div>}</div></section>
      <section className="grid gap-5 md:grid-cols-2">
        {analyticsCharts.map(({ title, detail, kind, icon: Icon }, index) => (
          <motion.div key={title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }} className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle eyebrow={`0${index + 1} · analytics`} title={title} detail={detail} action={<Icon size={17} className="text-muted-foreground" />} />
            <div className="mt-5"><EmptyRechartsFrame kind={kind} /></div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

const auditColumns = ['Event ID', 'User / system', 'Input reference', 'Prediction', 'Confidence', 'Anomaly score', 'Decision', 'Explanation', 'Human intervention', 'Final outcome', 'Timestamp'];

export function AuditTrailPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const audit = useApiMutation<string, ApiRecord>(useCallback((decisionId, signal) => getByDecisionId(decisionId, { signal }), []));
  const filterLabel = filter === 'all' ? 'All events' : filter;
  const resultLabel = useMemo(() => query || filter !== 'all' ? `No ${filterLabel.toLowerCase()} matches` : 'No audit events available', [filter, filterLabel, query]);
  const openAuditDetail = () => {
    setDrawerOpen(true);
    if (query.trim()) void audit.execute(query.trim());
  };
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="4" eyebrow="Governance / immutable trace" title="Audit trail" description="Trace consequential system actions, human interventions, and final outcomes through an accountable event history." icon={FileClock} tone="blue" status="Trace ready" />
      <UnavailableNotice detail="The audit table and timeline will remain empty until the backend exposes audit records." />
      <section className="soft-card overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-5 sm:p-6">
          <SectionTitle eyebrow="01 · event history" title="Audit events" detail="Search and filter the immutable record without implying that records exist." />
          <div className="flex flex-wrap gap-2">
             <label className="relative"><Search size={13} className="absolute left-3 top-2.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Decision ID" aria-label="Decision ID for audit lookup" className="h-8 w-40 rounded-lg border border-input bg-background pl-8 pr-2 text-[11px] outline-none focus:border-primary/50" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter audit events" className="h-8 rounded-lg border border-input bg-background px-2.5 text-[11px] font-semibold outline-none focus:border-primary/50"><option value="all">All events</option><option value="system">System events</option><option value="human">Human actions</option></select>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1280px] text-left"><thead><tr className="border-b border-border bg-muted/35">{auditColumns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground first:pl-5">{column}</th>)}</tr></thead><tbody><tr><td colSpan={auditColumns.length} className="px-5 py-12"><EmptyState title={resultLabel} detail="Audit records will appear here when the trace endpoint is available. No events are being fabricated for this view." icon={FileClock} action="No records to inspect" /></td></tr></tbody></table></div>
         <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Decision-specific trace lookup</span><div className="flex items-center gap-2"><button type="button" disabled className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold opacity-50">Previous</button><button type="button" disabled className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold opacity-50">Next</button><button type="button" onClick={openAuditDetail} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">Open detail drawer <Info size={13} /></button></div></div>
      </section>
      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="02 · chronology" title="Audit timeline" detail="A chronological view will mirror returned trace events and interventions." /><div className="mt-5"><EmptyState title="No timeline events" detail="The timeline will render when audit records include timestamps and event ownership." icon={Clock3} action="Awaiting audit data" /></div></section>
       {drawerOpen && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" role="presentation" onClick={() => setDrawerOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Audit detail" onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Audit detail</p><h2 className="mt-2 text-xl font-semibold">{query.trim() ? query.trim() : 'No decision ID entered'}</h2></div><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close audit detail" className="rounded-lg p-2 text-muted-foreground hover:bg-muted">×</button></div><div className="mt-7"><ApiStatus status={audit.status} endpoint="/api/audit/{decision_id}" error={audit.error} />{audit.data ? <ApiResponsePreview value={audit.data} /> : audit.status === 'idle' && <EmptyState title="Enter a decision ID" detail="The audit contract exposes decision-specific trace records rather than an unscoped event list." icon={FileClock} action="Awaiting decision ID" />}</div></aside></div>}
    </div>
  );
}

function PreferenceToggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/45 px-4 py-3.5"><span><span className="block text-xs font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{detail}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /></label>;
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { health, retry } = useBackendHealth();
  const [notifications, setNotifications] = useState(() => localStorage.getItem('astra-notifications') !== 'off');
  const [reviewAlerts, setReviewAlerts] = useState(() => localStorage.getItem('astra-review-alerts') !== 'off');
  const updatePreference = (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, value ? 'on' : 'off');
  };
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="5" eyebrow="System / workspace controls" title="Settings" description="Manage local appearance and notification preferences while keeping unsupported backend settings out of the interface." icon={SettingsIcon} tone="cyan" status="Local preferences" />
      <UnavailableNotice detail="Only browser-local preferences are editable here. Backend model, workspace, and policy settings are not exposed without a confirmed contract." />
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="01 · appearance" title="Appearance" detail="Choose the visual mode for this browser." /><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={`rounded-xl border p-4 text-left ${theme === 'light' ? 'border-primary bg-primary/[.06]' : 'border-border bg-background/45'}`}><span className="block text-xs font-semibold">Light mode</span><span className="mt-1 block text-[11px] text-muted-foreground">Bright operational workspace</span></button><button type="button" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={`rounded-xl border p-4 text-left ${theme === 'dark' ? 'border-primary bg-primary/[.06]' : 'border-border bg-background/45'}`}><span className="block text-xs font-semibold">Dark mode</span><span className="mt-1 block text-[11px] text-muted-foreground">Low-glare command surface</span></button></div></div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="02 · notifications" title="Notifications" detail="These preferences affect this browser only." /><div className="mt-5 space-y-2"><PreferenceToggle label="Signal inbox" detail="Show locally stored notification indicators." checked={notifications} onChange={(value) => updatePreference('astra-notifications', value, setNotifications)} /><PreferenceToggle label="Human review alerts" detail="Highlight review-related notifications when supported." checked={reviewAlerts} onChange={(value) => updatePreference('astra-review-alerts', value, setReviewAlerts)} /></div></div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="03 · connection" title="Connection status" detail="The shell currently checks the backend health endpoint." action={<ShieldCheck size={17} className={health.status === 'online' ? 'text-emerald-500' : 'text-muted-foreground'} />} /><div className="mt-5 rounded-xl border border-border/80 bg-background/45 p-4"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${health.status === 'online' ? 'bg-emerald-400' : health.status === 'loading' ? 'bg-amber-400' : 'bg-red-400'}`} /><span className="text-sm font-semibold">{health.label}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{health.detail}</p>{health.status === 'offline' && <button type="button" onClick={retry} className="mt-3 text-xs font-semibold text-primary hover:underline">Retry health check</button>}</div></div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6"><SectionTitle eyebrow="04 · account" title="Account" detail="Current operator identity is presented by the existing shell." /><div className="mt-5 flex items-center gap-3 rounded-xl border border-border/80 bg-background/45 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">MR</div><div><p className="text-sm font-semibold">Maya Rios</p><p className="mt-1 text-xs text-muted-foreground">Systems operator</p></div></div></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Info size={16} /></span><div><h2 className="text-sm font-semibold">About Astra Decision OS</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">A responsive operational surface for inspectable decisions, confidence, anomalies, reliability, and human oversight.</p></div></div><p className="mt-4 shrink-0 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground sm:mt-0">Foundation build 0.1</p></section>
    </div>
  );
}

export function DemoPage() {
  const status = useApiResource('demo-status', useCallback((signal) => getDemoStatus({ signal }), []));
  const demoAction = useApiMutation<'start' | 'stop', ApiRecord>(useCallback((action, signal) => action === 'start' ? startDemo({ signal }) : stopDemo({ signal }), []));
  return (
    <div className="space-y-7 pb-10">
      <SurfaceHeader index="6" eyebrow="Operations / controlled simulation" title="Demo control" description="Start, stop, and inspect the backend-managed demo lifecycle without simulating a successful response in the browser." icon={Radio} tone="amber" status="Contract connected" />
      <UnavailableNotice detail="The demo controls call the contract-defined endpoints. They remain visibly unavailable when the FastAPI service is absent." />
      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><SectionTitle eyebrow="01 · demo lifecycle" title="Demo status" detail="Status is read from the backend and is never generated locally." /><div className="flex gap-2"><button type="button" disabled={demoAction.status === 'loading'} onClick={() => void demoAction.execute('start')} className="rounded-lg bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">Start demo</button><button type="button" disabled={demoAction.status === 'loading'} onClick={() => void demoAction.execute('stop')} className="rounded-lg border border-border px-3.5 py-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Stop demo</button></div></div>
        <div className="mt-5"><ApiStatus status={status.status} endpoint="/api/demo/status" error={status.error} onRetry={status.retry} />{status.data && <ApiResponsePreview value={status.data} />}{(demoAction.status === 'error' || demoAction.status === 'success') && <div className="mt-3"><ApiStatus status={demoAction.status} endpoint={demoAction.data ? '/api/demo/start or /api/demo/stop' : '/api/demo/start or /api/demo/stop'} error={demoAction.error} />{demoAction.data && <ApiResponsePreview value={demoAction.data} />}</div>}</div>
      </section>
    </div>
  );
}