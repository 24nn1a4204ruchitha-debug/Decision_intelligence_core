import { useState } from 'react';
import { Check, CircleHelp, GitBranch, LockKeyhole, Pencil, ShieldAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/surface-primitives';
import type { ApiResourceStatus } from '@/hooks/use-api-resource';

export type ReviewRecord = {
  id: string;
  originalData?: unknown;
  prediction?: string;
  confidence?: number;
  uncertainty?: number;
  anomaly?: number;
  risk?: string;
  explanation?: string;
  recommendedAction?: string;
};

export type ReviewAction = 'approve' | 'reject' | 'modify';

const actions: Array<{ value: ReviewAction; label: string; icon: LucideIcon; tone: string }> = [
  { value: 'approve', label: 'Approve', icon: Check, tone: 'border-emerald-400/25 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-400/10' },
  { value: 'reject', label: 'Reject', icon: X, tone: 'border-red-400/25 text-red-700 dark:text-red-300 hover:bg-red-400/10' },
  { value: 'modify', label: 'Modify', icon: Pencil, tone: 'border-amber-400/25 text-amber-700 dark:text-amber-300 hover:bg-amber-400/10' },
];

function displayValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'number') return `${Math.round(value * 100)}%`;
  return String(value);
}

export function ReviewCard({ review, onSelect }: { review: ReviewRecord; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[.025]">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Review request</p><h3 className="mt-1 text-sm font-semibold">{review.id}</h3></div><ShieldAlert size={17} className="text-amber-500" /></div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="text-muted-foreground">Prediction</span><span className="text-right font-semibold">{displayValue(review.prediction)}</span><span className="text-muted-foreground">Confidence</span><span className="text-right font-mono">{displayValue(review.confidence)}</span><span className="text-muted-foreground">Risk</span><span className="text-right font-semibold">{displayValue(review.risk)}</span></div>
    </button>
  );
}

export function ReviewDetail({ review, onAction, disabled = false }: { review: ReviewRecord | null; onAction: (action: ReviewAction) => void; disabled?: boolean }) {
  if (!review) {
    return <EmptyState title="No review selected" detail="Select a pending decision to inspect its evidence and available human checkpoint actions." icon={CircleHelp} action="Waiting for a review record" />;
  }

  const fields = [
    ['Prediction', review.prediction],
    ['Confidence', review.confidence],
    ['Uncertainty', review.uncertainty],
    ['Anomaly', review.anomaly],
    ['Risk', review.risk],
    ['Recommended action', review.recommendedAction],
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/45 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Selected request</p><h3 className="mt-1 text-lg font-semibold">{review.id}</h3></div><GitBranch size={18} className="text-primary" /></div><pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-950/[.04] p-3 font-mono text-[10px] leading-5 text-muted-foreground dark:bg-slate-950/30">{review.originalData ? JSON.stringify(review.originalData, null, 2) : 'Original data unavailable'}</pre></div>
      <div className="grid gap-2 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-lg border border-border/80 bg-background/45 px-3.5 py-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold">{displayValue(value)}</p></div>)}</div>
      <div className="rounded-xl border border-primary/15 bg-primary/[.035] p-4"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">AI explanation</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{review.explanation ?? 'Explanation unavailable until a review record is connected.'}</p></div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">{actions.map(({ value, label, icon: Icon, tone }) => <button key={value} type="button" disabled={disabled} title={disabled ? 'Review action is unavailable while the request is loading' : undefined} onClick={() => onAction(value)} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold ${disabled ? 'opacity-60' : ''} ${tone}`}><Icon size={14} />{label}{disabled && <LockKeyhole size={12} />}</button>)}</div>
    </div>
  );
}

export function ReviewActionModal({
  action,
  decisionId,
  status = 'idle',
  error,
  onClose,
  onSubmit,
}: {
  action: ReviewAction | null;
  decisionId?: string;
  status?: ApiResourceStatus | 'idle' | 'success';
  error?: string;
  onClose: () => void;
  onSubmit: (action: ReviewAction, note: string) => void;
}) {
  const [note, setNote] = useState('');
  if (!action) return null;
  const label = action === 'approve' ? 'Approve decision' : action === 'reject' ? 'Reject decision' : 'Modify decision';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="review-action-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-amber-600 dark:text-amber-300">Confirmation required</p><h2 id="review-action-title" className="mt-1.5 text-xl font-semibold">{label}</h2></div><button type="button" onClick={onClose} aria-label="Close confirmation" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={17} /></button></div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">This action will be sent to the contract-defined review endpoint. A failed request leaves the decision unchanged.</p>
        {action === 'modify' && <label className="mt-5 block"><span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Modification note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-lg border border-input bg-background/70 px-3 py-2 text-xs outline-none focus:border-primary/50" placeholder="Optional operator instruction" /></label>}
        {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.05] px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-border px-3.5 py-2.5 text-xs font-semibold hover:bg-muted">Cancel</button><button type="button" disabled={!decisionId || status === 'loading'} onClick={() => onSubmit(action, note)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">{status === 'loading' ? 'Submitting…' : 'Confirm action'}{status === 'loading' ? <LockKeyhole size={13} /> : <Check size={13} />}</button></div>
      </div>
    </div>
  );
}

export function ReviewQueueEmpty() {
  return <EmptyState title="No pending reviews available" detail="Pending decisions will appear here when the human review service is connected. No review records are being generated locally." icon={ShieldAlert} action="Awaiting review data" />;
}