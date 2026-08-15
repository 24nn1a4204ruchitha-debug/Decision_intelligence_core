import { ArrowLeft, Compass, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[calc(100dvh-150px)] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary"><SearchX size={28} /></div>
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Signal not found / 404</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-.05em]">This surface is outside the map.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">The route you requested does not exist in this workspace. Return to the command surface or choose another operational view.</p>
        <div className="mt-7 flex justify-center gap-3"><button type="button" onClick={() => navigate(-1)} data-testid="button-go-back" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted"><ArrowLeft size={14} />Go back</button><button type="button" onClick={() => navigate('/')} data-testid="button-return-dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Compass size={14} />Dashboard</button></div>
      </div>
    </div>
  );
}