import { motion } from 'framer-motion';
import { ArrowRight, CircleHelp, Database, FileClock, Gauge, GitBranch, Layers3, ListFilter, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Gauge;
  accent: string;
  next: string;
  nextLabel: string;
};

export const pageConfigs: Record<string, PageConfig> = {
  monitoring: { eyebrow: 'Operations / live signal', title: 'Live monitoring', description: 'A calm surface for watching autonomous behavior as it unfolds. Connect your streams to see event-level traces, confidence shifts, and guardrail status here.', icon: Gauge, accent: 'cyan', next: '/ingestion', nextLabel: 'Review ingestion surfaces' },
  ingestion: { eyebrow: 'Operations / source health', title: 'Data ingestion', description: 'Bring the inputs behind every decision into one accountable view. Source freshness, schema health, and lineage will appear here when your data connectors are enabled.', icon: Database, accent: 'blue', next: '/predictions', nextLabel: 'Explore prediction surfaces' },
  predictions: { eyebrow: 'Intelligence / forecast layer', title: 'Predictions', description: 'Understand what the decision system sees before it acts. This surface is reserved for model outputs, confidence bands, and the context behind each prediction.', icon: Sparkles, accent: 'cyan', next: '/anomalies', nextLabel: 'Check anomaly signals' },
  anomalies: { eyebrow: 'Intelligence / exception layer', title: 'Anomalies', description: 'Signals that fall outside the expected operating envelope belong here, with enough context to decide whether to observe, investigate, or intervene.', icon: ListFilter, accent: 'amber', next: '/decisions', nextLabel: 'Trace a decision path' },
  decisions: { eyebrow: 'Intelligence / action layer', title: 'Decisions', description: 'Follow autonomous choices from input to outcome. Decision graphs, guardrail checks, and rationale traces will make this the system’s most transparent surface.', icon: GitBranch, accent: 'blue', next: '/review', nextLabel: 'Open human checkpoints' },
  review: { eyebrow: 'Governance / human checkpoint', title: 'Human review', description: 'A focused queue for the moments where human judgment matters most. Review, annotate, and release high-impact decisions without losing the original trace.', icon: ShieldCheck, accent: 'amber', next: '/audit', nextLabel: 'View audit trail' },
  analytics: { eyebrow: 'Governance / operating patterns', title: 'Analytics', description: 'Measure how the system behaves over time without burying the signal. Trends, cohorts, and operating thresholds will land here in the next phase.', icon: Layers3, accent: 'cyan', next: '/audit', nextLabel: 'Inspect trace history' },
  audit: { eyebrow: 'Governance / immutable trace', title: 'Audit trail', description: 'Every consequential system action should be explainable after the fact. This surface will preserve a searchable record of decisions, overrides, and policy changes.', icon: FileClock, accent: 'blue', next: '/settings', nextLabel: 'Configure workspace' },
  settings: { eyebrow: 'System / workspace controls', title: 'Settings', description: 'Shape the boundaries around autonomous operations. Workspace preferences, notification policies, model environments, and oversight rules will be managed here.', icon: SlidersHorizontal, accent: 'cyan', next: '/', nextLabel: 'Return to dashboard' },
};

const accentStyles = {
  blue: { icon: 'bg-primary/10 text-primary', line: 'bg-primary', chip: 'border-primary/20 bg-primary/5 text-primary' },
  cyan: { icon: 'bg-cyan-400/12 text-cyan-600 dark:text-cyan-300', line: 'bg-cyan-400', chip: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-600 dark:text-cyan-300' },
  amber: { icon: 'bg-amber-400/12 text-amber-600 dark:text-amber-300', line: 'bg-amber-400', chip: 'border-amber-400/20 bg-amber-400/5 text-amber-600 dark:text-amber-300' },
};

export default function Placeholder({ config }: { config: PageConfig }) {
  const navigate = useNavigate();
  const Icon = config.icon;
  const accent = accentStyles[config.accent as keyof typeof accentStyles];
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${accent.line}`} />{config.eyebrow}</div>
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_18px_44px_-28px_hsl(var(--primary)/.35)] sm:p-10">
        <div className="pointer-events-none absolute right-[-5%] top-[-45%] h-[420px] w-[420px] rounded-full border border-primary/10" /><div className="pointer-events-none absolute right-[8%] top-[-18%] h-[250px] w-[250px] rounded-full border border-cyan-400/10" />
        <div className="relative max-w-2xl">
          <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${accent.icon}`}><Icon size={23} /></div>
          <h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">{config.title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{config.description}</p>
          <div className={`mt-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.1em] ${accent.chip}`}><RefreshCw size={12} />Surface ready for live data</div>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Signal canvas</h3><p className="mt-1 text-xs text-muted-foreground">A preview of the workspace you will operate in.</p></div><CircleHelp size={17} className="text-muted-foreground" /></div>
          <div className="mt-6 rounded-xl border border-dashed border-primary/25 bg-primary/[.025] p-6 sm:p-10">
            <div className="mx-auto max-w-sm text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary"><Sparkles size={19} /></div><p className="text-sm font-semibold">No live signals connected yet</p><p className="mt-2 text-xs leading-5 text-muted-foreground">When the backend surface is enabled, this area will show traceable events instead of placeholder telemetry.</p><div className="mx-auto mt-6 h-1 max-w-[180px] overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: '66%' }} transition={{ delay: .25, duration: .7 }} className={`h-full rounded-full ${accent.line}`} /></div></div>
          </div>
        </div>
        <div className="soft-card rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /><h3 className="text-sm font-semibold">Operator context</h3></div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">The shell is connected and ready. No data calls are made from this preview surface.</p>
          <div className="mt-5 space-y-3 border-t border-border pt-4"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Workspace mode</span><span className="font-mono text-foreground">Oversight</span></div><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Trace retention</span><span className="font-mono text-foreground">Configured</span></div><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Surface state</span><span className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ready</span></div></div>
          <button type="button" onClick={() => navigate(config.next)} data-testid={`button-next-${config.title.toLowerCase().replaceAll(' ', '-')}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-xs font-semibold hover:bg-muted">{config.nextLabel}<ArrowRight size={14} /></button>
        </div>
      </section>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground"><GitBranch size={15} className="text-primary" /><span>This route is part of the shared Astra command surface.</span><span className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:block">BUILD 0.1 / FOUNDATION</span></div>
    </div>
  );
}