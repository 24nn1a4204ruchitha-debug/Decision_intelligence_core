import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  FileJson,
  FileText,
  GitBranch,
  Image as ImageIcon,
  LockKeyhole,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  X,
  Code2,
  CloudUpload,
  Info,
  CircleHelp,
  SlidersHorizontal
} from 'lucide-react';
import { useMemo, useRef, useState, useCallback } from 'react';
import { ApiStatus, ApiResponsePreview } from '@/components/api-status';
import { ingestEvent, ingestJson, ingestSensor, ingestText, simulateDegradation } from '@/api/ingestion';
import { list as listAnomalies } from '@/api/anomalies';
import { evaluate } from '@/api/decisions';
import { predict } from '@/api/predictions';
import type { ApiRecord, IngestionResponse, JsonObject, PredictionResponse } from '@/api/types';
import { useApiMutation, useApiResource } from '@/hooks/use-api-resource';
import { useBackendHealth } from '@/hooks/use-backend-health';

type IngestionTab = 'Sensor' | 'JSON/Text' | 'Degradation Simulation' | 'Real-time Event';
const ingestionTabs: Array<{ label: IngestionTab; icon: typeof FileText }> = [
  { label: 'Sensor', icon: Radio },
  { label: 'JSON/Text', icon: FileJson },
  { label: 'Degradation Simulation', icon: SlidersHorizontal },
  { label: 'Real-time Event', icon: Radio },
];

function PageIntro({
  index,
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'blue',
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Database;
  tone?: 'blue' | 'cyan' | 'amber' | 'red';
}) {
  const colors = {
    blue: 'bg-primary/10 text-primary border-primary/20',
    cyan: 'bg-cyan-400/12 text-cyan-600 dark:text-cyan-300 border-cyan-400/20',
    amber: 'bg-amber-400/12 text-amber-600 dark:text-amber-300 border-amber-400/20',
    red: 'bg-red-400/12 text-red-600 dark:text-red-300 border-red-400/20',
  };
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-6 shadow-[0_22px_60px_-34px_hsl(var(--primary)/.45)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-24 -top-40 h-[440px] w-[440px] rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute right-16 top-12 h-36 w-36 rounded-full border border-cyan-400/15" />
      <div className="relative max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">0{index} · {eyebrow}</span>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-300"><ShieldCheck size={11} /> API Connected</span>
        </div>
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${colors[tone]}`}><Icon size={23} /></div>
        <h2 className="text-3xl font-semibold tracking-[-.06em] sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
        <h3 className="text-lg font-semibold tracking-[-.035em]">{title}</h3>
        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function parseJsonPayload(value: string, label: string): unknown {
  if (!value.trim()) throw new Error(`${label} cannot be empty.`);
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function JsonEditor({ value, onChange, label = 'Payload editor', placeholder = '{\\n  "input": "..."\\n}' }: { value: string; onChange: (value: string) => void; label?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-muted-foreground"><Code2 size={12} className="text-primary" />{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid={`textarea-${label.toLowerCase().replaceAll(' ', '-')}`} className="min-h-[176px] w-full resize-y rounded-xl border border-input bg-slate-950/[.035] px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:bg-slate-950/30" />
    </label>
  );
}

export function DataIngestionPage() {
  const [tab, setTab] = useState<IngestionTab>('Sensor');
  const [text, setText] = useState('{\n  "vibration": 1.25,\n  "temperature": 72.4,\n  "pressure": 28.5,\n  "speed": 1520.0,\n  "source": "turbine-unit-01"\n}');

  const ingestionRequest = useApiMutation<{ tab: IngestionTab; text: string }, IngestionResponse>(useCallback(async ({ tab: selectedTab, text: payload }, signal) => {
    const parsed = parseJsonPayload(payload, 'Payload') as JsonObject;
    if (selectedTab === 'JSON/Text') return ingestJson(parsed as import('@/api/types').JsonValue, { signal });
    if (selectedTab === 'Sensor') return ingestSensor(parsed, { signal });
    if (selectedTab === 'Real-time Event') return ingestEvent(parsed, { signal });
    if (selectedTab === 'Degradation Simulation') return simulateDegradation(parsed, { signal });
    return ingestJson(parsed, { signal });
  }, []));

  const loadSample = (type: string) => {
    if (type === 'nominal') {
      setText('{\n  "vibration": 1.2,\n  "temperature": 68.5,\n  "pressure": 29.1,\n  "speed": 1500.0,\n  "source": "sensor-alpha"\n}');
    } else if (type === 'anomaly') {
      setText('{\n  "vibration": 5.8,\n  "temperature": 98.2,\n  "pressure": 45.1,\n  "speed": 2100.0,\n  "source": "turbine-critical-09"\n}');
    } else if (type === 'degraded') {
      setText('{\n  "missing_percentage": 0.3,\n  "noise_level": 0.2,\n  "drift_factor": 0.15,\n  "sensor_data": {\n    "vibration": 3.4,\n    "temperature": null,\n    "pressure": 35.0\n  }\n}');
    }
  };

  return (
    <div className="space-y-7 pb-10">
      <PageIntro index="1" eyebrow="Operations / source health" title="Multimodal Data Ingestion" description="Ingest heterogeneous data including sensor streams, JSON telemetry, text reports, and run degradation tests with validation & automatic fallback strategies." icon={Database} />

      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
        <SectionTitle eyebrow="01 · input surface" title="Live Signal Ingestion" detail="Choose source format or use quick test presets." action={
          <div className="flex gap-2">
            <button type="button" onClick={() => loadSample('nominal')} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted">Nominal</button>
            <button type="button" onClick={() => loadSample('anomaly')} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted">High Spike</button>
            <button type="button" onClick={() => loadSample('degraded')} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted">Degraded</button>
          </div>
        } />
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
          {ingestionTabs.map(({ label, icon: Icon }) => (
            <button type="button" key={label} onClick={() => setTab(label)} aria-pressed={tab === label} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${tab === label ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <JsonEditor value={text} onChange={setText} label={`${tab} Payload`} />
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" disabled={ingestionRequest.status === 'loading'} onClick={() => void ingestionRequest.execute({ tab, text })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 disabled:opacity-50">
            {ingestionRequest.status === 'loading' ? 'Ingesting...' : `Submit ${tab}`} <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {(ingestionRequest.status === 'error' || ingestionRequest.status === 'success') && (
        <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <ApiStatus status={ingestionRequest.status} endpoint="/api/data/*" error={ingestionRequest.error} />
          {ingestionRequest.data && <ApiResponsePreview value={ingestionRequest.data} />}
        </section>
      )}
    </div>
  );
}

export function PredictionsPage() {
  const [payload, setPayload] = useState('{\n  "vibration": 1.45,\n  "temperature": 70.2,\n  "pressure": 30.1,\n  "speed": 1500.0\n}');
  const [payloadError, setPayloadError] = useState<string>();
  const prediction = useApiMutation<JsonObject, PredictionResponse>(useCallback((body, signal) => predict(body, { signal }), []));

  const runPrediction = () => {
    try {
      setPayloadError(undefined);
      void prediction.execute(parseJsonPayload(payload, 'Prediction payload') as JsonObject);
    } catch (error) {
      setPayloadError(error instanceof Error ? error.message : 'Prediction payload is invalid.');
    }
  };

  const loadPreset = (critical: boolean) => {
    if (critical) {
      setPayload('{\n  "vibration": 6.2,\n  "temperature": 99.5,\n  "pressure": 52.0,\n  "speed": 2400.0\n}');
    } else {
      setPayload('{\n  "vibration": 1.25,\n  "temperature": 71.0,\n  "pressure": 29.5,\n  "speed": 1510.0\n}');
    }
  };

  return (
    <div className="space-y-7 pb-10">
      <PageIntro index="2" eyebrow="Intelligence / forecast layer" title="Adaptive Predictions" description="Evaluate model predictions, probability scores, epistemic uncertainty, and feature contributions with scikit-learn models." icon={Sparkles} tone="cyan" />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle eyebrow="01 · model input" title="Prediction Features" detail="Supply sensor parameters or select test samples." action={
            <div className="flex gap-2">
              <button type="button" onClick={() => loadPreset(false)} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold">Nominal Sample</button>
              <button type="button" onClick={() => loadPreset(true)} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold">High-Risk Sample</button>
            </div>
          } />
          <div className="mt-6">
            <JsonEditor value={payload} onChange={(value) => { setPayload(value); setPayloadError(undefined); }} label="Input features" />
          </div>
          {payloadError && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.05] px-3 py-2 text-xs text-red-600">{payloadError}</p>}
          <div className="mt-5 flex justify-end">
            <button type="button" disabled={prediction.status === 'loading'} onClick={runPrediction} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 disabled:opacity-50">
              {prediction.status === 'loading' ? 'Evaluating...' : 'Run Prediction'} <ArrowRight size={13} />
            </button>
          </div>
        </div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle eyebrow="02 · model output" title="Prediction Result" detail="Live inference breakdown from the backend." />
          <div className="mt-6">
            {prediction.status === 'idle' && (
              <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center text-xs text-muted-foreground">
                Click "Run Prediction" to evaluate the input features.
              </div>
            )}
            {(prediction.status === 'error' || prediction.status === 'success') && (
              <>
                <ApiStatus status={prediction.status} endpoint="/api/predict" error={prediction.error} />
                {prediction.data && <ApiResponsePreview value={prediction.data} />}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function AnomaliesPage() {
  const anomalies = useApiResource('anomalies', useCallback((signal) => listAnomalies({ signal }), []));
  const anomaliesData = (anomalies.data ?? {}) as Record<string, unknown>;
  const list = Array.isArray(anomalies.data)
    ? anomalies.data
    : Array.isArray(anomaliesData.anomalies)
      ? (anomaliesData.anomalies as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="space-y-7 pb-10">
      <PageIntro index="3" eyebrow="Intelligence / exception layer" title="Anomaly Detection" description="Isolation Forest & z-score anomaly detection engine for identifying subtle irregularities, spikes, and degradation patterns." icon={AlertTriangle} tone="amber" />
      <section>
        <SectionTitle eyebrow="01 · operating picture" title="Anomaly Summary" detail="Summary metrics from the active anomaly detector." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="soft-card rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">Total Anomalies</p>
            <p className="mt-3 font-mono text-2xl font-bold text-foreground">{list.length}</p>
          </div>
          {severities.map((sev) => {
            const count = list.filter((a) => String(a.severity).toUpperCase() === sev).length;
            return (
              <div key={sev} className="soft-card rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground">{sev}</p>
                <p className="mt-3 font-mono text-2xl font-bold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="soft-card overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5 sm:p-6">
          <SectionTitle eyebrow="02 · investigation queue" title="Detected Anomaly Records" detail="Historical and real-time anomalies detected by the platform." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/35">
                {['ID', 'Score', 'Severity', 'Explanation', 'Timestamp'].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((anom, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/25">
                    <td className="px-4 py-3 font-mono font-semibold">{String(anom.id || `ANOM-${i+1}`)}</td>
                    <td className="px-4 py-3 font-mono text-amber-600 font-bold">{typeof anom.anomaly_score === 'number' ? anom.anomaly_score.toFixed(3) : '0.450'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-amber-400/15 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-300">{String(anom.severity || 'MEDIUM')}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{String(anom.explanation || 'Anomaly detected in telemetry stream')}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{String(anom.created_at || 'Just now').slice(0, 19)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No anomalies recorded yet. Run an ingestion test or simulation to trigger anomalies.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function DecisionsPage() {
  const [payload, setPayload] = useState('{\n  "vibration": 1.25,\n  "temperature": 72.0,\n  "pressure": 29.5,\n  "speed": 1500.0\n}');
  const [payloadError, setPayloadError] = useState<string>();
  const decision = useApiMutation<JsonObject, ApiRecord>(useCallback((body, signal) => evaluate(body, { signal }), []));

  const runEvaluation = () => {
    try {
      setPayloadError(undefined);
      void decision.execute(parseJsonPayload(payload, 'Decision payload') as JsonObject);
    } catch (error) {
      setPayloadError(error instanceof Error ? error.message : 'Decision payload is invalid.');
    }
  };

  return (
    <div className="space-y-7 pb-10">
      <PageIntro index="4" eyebrow="Intelligence / action layer" title="Autonomous Decision Engine" description="Evaluate decisions with confidence gating, uncertainty quantification, safety guardrails, and explainable AI rationales." icon={GitBranch} />
      <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
        <SectionTitle eyebrow="01 · decision surface" title="Evaluate Decision" detail="Submit context features to generate autonomous recommendations or human escalation." />
        <div className="mt-6">
          <JsonEditor value={payload} onChange={(value) => { setPayload(value); setPayloadError(undefined); }} label="Decision evaluation features" />
        </div>
        {payloadError && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[.05] px-3 py-2 text-xs text-red-600">{payloadError}</p>}
        <div className="mt-4 flex justify-end">
          <button type="button" disabled={decision.status === 'loading'} onClick={runEvaluation} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 disabled:opacity-50">
            {decision.status === 'loading' ? 'Evaluating...' : 'Evaluate Decision'} <ArrowRight size={13} />
          </button>
        </div>
        <div className="mt-5">
          <ApiStatus status={decision.status} endpoint="/api/decision/evaluate" error={decision.error} />
          {decision.data && <ApiResponsePreview value={decision.data} />}
        </div>
      </section>
    </div>
  );
}
