import type { ReactNode } from 'react';
import { Info, LockKeyhole } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SurfaceTone = 'blue' | 'cyan' | 'amber' | 'red';

const toneStyles: Record<SurfaceTone, { icon: string; chip: string }> = {
  blue: { icon: 'bg-primary/10 text-primary border-primary/20', chip: 'border-primary/20 bg-primary/5 text-primary' },
  cyan: { icon: 'bg-cyan-400/12 text-cyan-600 dark:text-cyan-300 border-cyan-400/20', chip: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-700 dark:text-cyan-300' },
  amber: { icon: 'bg-amber-400/12 text-amber-600 dark:text-amber-300 border-amber-400/20', chip: 'border-amber-400/20 bg-amber-400/5 text-amber-700 dark:text-amber-300' },
  red: { icon: 'bg-red-400/12 text-red-600 dark:text-red-300 border-red-400/20', chip: 'border-red-400/20 bg-red-400/5 text-red-700 dark:text-red-300' },
};

export function SurfaceHeader({
  index,
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'blue',
  status,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: SurfaceTone;
  status?: string;
}) {
  const styles = toneStyles[tone];
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-6 shadow-[0_22px_60px_-34px_hsl(var(--primary)/.45)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-24 -top-40 h-[440px] w-[440px] rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute right-16 top-12 h-36 w-36 rounded-full border border-cyan-400/15" />
      <div className="relative max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] ${styles.chip}`}>0{index} · {eyebrow}</span>
          {status && <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{status}</span>}
        </div>
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${styles.icon}`}><Icon size={23} /></div>
        <h2 className="text-3xl font-semibold tracking-[-.06em] sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
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

export function EmptyState({
  title,
  detail,
  icon: Icon = Info,
  action,
}: {
  title: string;
  detail: string;
  icon?: LucideIcon;
  action?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[.025] px-5 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary"><Icon size={19} /></div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">{detail}</p>
      {action && <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground"><Info size={12} />{action}</span>}
    </div>
  );
}

export function UnavailableNotice({ detail = 'This surface is ready for live data, but no supporting backend contract is connected.' }: { detail?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-400/20 bg-amber-400/[.06] px-3.5 py-3 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1.5 font-mono uppercase tracking-[.12em] text-amber-700 dark:text-amber-300"><LockKeyhole size={12} />Unavailable</span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>{detail}</span>
    </div>
  );
}

export function ChartEmptyState({ title = 'No chart data available', detail = 'This visualization will render when the backend returns a compatible data series.' }: { title?: string; detail?: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-background/40 px-5 text-center">
      <div>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Info size={18} /></div>
        <p className="mt-3 text-sm font-semibold">{title}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function MetricPlaceholder({ label, detail = 'Awaiting data' }: { label: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/45 p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-5 font-mono text-2xl tracking-[-.08em] text-foreground/35">—</p>
      <p className="mt-2 text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}