import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { ApiResourceStatus } from '@/hooks/use-api-resource';

export function ApiStatus({
  status,
  endpoint,
  error,
  onRetry,
}: {
  status: ApiResourceStatus | 'idle' | 'success';
  endpoint: string;
  error?: string;
  onRetry?: () => void;
}) {
  if (status === 'loading') {
    return <div className="rounded-lg border border-amber-400/20 bg-amber-400/[.05] px-3.5 py-3 text-xs text-muted-foreground">Loading from <span className="font-mono text-[10px]">{endpoint}</span>…</div>;
  }
  if (status === 'error') {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-400/[.05] p-3.5 text-xs text-muted-foreground">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1"><p className="font-semibold text-foreground">API request unavailable</p><p className="mt-1 leading-5">{error ?? `Unable to reach ${endpoint}`}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><RefreshCw size={12} />Retry request</button>}</div>
      </div>
    );
  }
  if (status === 'ready' || status === 'success') {
    return <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[.05] px-3.5 py-3 text-xs text-muted-foreground"><CheckCircle2 size={14} className="text-emerald-500" />Response received from <span className="font-mono text-[10px]">{endpoint}</span></div>;
  }
  return null;
}

export function ApiResponsePreview({ value }: { value: unknown }) {
  return (
    <details className="mt-4 rounded-lg border border-border/80 bg-background/45 p-3.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">Inspect raw API response</summary>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-5 text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}