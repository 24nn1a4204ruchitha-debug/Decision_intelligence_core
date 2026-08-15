import { AnimatePresence, motion } from 'framer-motion';
import { Activity, RefreshCw, Radio, WifiOff } from 'lucide-react';
import type { LiveEvent, LiveConnectionState } from '@/hooks/use-live-events';
import { EmptyState } from '@/components/surface-primitives';

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return 'Timestamp unavailable';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function connectionCopy(connection: LiveConnectionState, detail: string) {
  if (connection === 'connected') return { label: 'Connected', tone: 'text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-400', icon: Radio };
  if (connection === 'connecting') return { label: 'Connecting', tone: 'text-amber-600 dark:text-amber-300', dot: 'bg-amber-400', icon: RefreshCw };
  return { label: 'Unavailable', tone: 'text-red-600 dark:text-red-300', dot: 'bg-red-400', icon: WifiOff };
}

export function LiveEventFeed({
  events,
  connection,
  detail,
  onRetry,
}: {
  events: LiveEvent[];
  connection: LiveConnectionState;
  detail: string;
  onRetry: () => void;
}) {
  const copy = connectionCopy(connection, detail);
  const ConnectionIcon = copy.icon;
  return (
    <section className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">02 · realtime</p>
          <h2 className="text-lg font-semibold tracking-[-.035em]">Live event stream</h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Inspectable event activity from the configured real-time connection.</p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${copy.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${copy.dot}`} />
          {copy.label}
        </span>
      </div>
      {connection === 'unavailable' && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-400/[.05] p-3.5 text-xs text-muted-foreground">
          <ConnectionIcon size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div><p className="font-semibold text-foreground">Real-time connection unavailable</p><p className="mt-1 leading-5">{detail}.</p><button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><RefreshCw size={12} />Retry connection</button></div>
        </div>
      )}
      {connection === 'connecting' && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[.05] px-3.5 py-3 text-xs text-muted-foreground"><RefreshCw size={14} className="animate-spin text-amber-500" />{detail}</div>
      )}
      <div className="mt-5">
        {events.length === 0 ? (
          <EmptyState title="No live events received" detail="Events will appear here when the configured WebSocket publishes data. Nothing is being simulated locally." icon={Activity} action={connection === 'connected' ? 'Listening for events' : 'No stream data'} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {events.map((event, index) => (
                <motion.div key={`${event.id ?? 'event'}-${index}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border/80 bg-background/45 px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold">{event.type ?? 'Live event'}</p>{event.severity && <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">{event.severity}</span>}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.message ?? 'Event received without a message field.'}</p>
                    </div>
                    <time className="shrink-0 font-mono text-[9px] text-muted-foreground">{formatTimestamp(event.timestamp)}</time>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}