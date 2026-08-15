import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileClock,
  GitBranch,
  LayoutDashboard,
  Menu,
  Moon,
  PlayCircle,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { NavItem } from '@/types/navigation';
import { useBackendHealth } from '@/hooks/use-backend-health';
import { useTheme } from '@/hooks/use-theme';

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, section: 'Overview' },
  { label: 'Live monitoring', path: '/monitoring', icon: Activity, section: 'Operations' },
  { label: 'Demo control', path: '/demo', icon: PlayCircle, section: 'Operations' },
  { label: 'Data ingestion', path: '/ingestion', icon: Database, section: 'Operations' },
  { label: 'Predictions', path: '/predictions', icon: BrainCircuit, section: 'Intelligence' },
  { label: 'Anomalies', path: '/anomalies', icon: AlertTriangle, section: 'Intelligence' },
  { label: 'Decisions', path: '/decisions', icon: GitBranch, section: 'Intelligence' },
  { label: 'Human review', path: '/review', icon: UserRound, section: 'Governance' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, section: 'Governance' },
  { label: 'Audit trail', path: '/audit', icon: FileClock, section: 'Governance' },
  { label: 'Settings', path: '/settings', icon: Settings, section: 'System' },
];

const sections: NavItem['section'][] = ['Overview', 'Operations', 'Intelligence', 'Governance', 'System'];

function LogoMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,.22)]">
      <span className="absolute h-4 w-4 rounded-full border-2 border-slate-950/80" />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-slate-950" />
      <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-slate-950" />
    </div>
  );
}

function StatusDot({ state }: { state: 'loading' | 'online' | 'offline' }) {
  return (
    <span className={`relative flex h-2 w-2 shrink-0 rounded-full ${state === 'online' ? 'bg-emerald-400' : state === 'offline' ? 'bg-red-400' : 'bg-amber-300'}`}>
      {state === 'online' && <span className="signal-pulse absolute inset-0 rounded-full bg-emerald-300" />}
    </span>
  );
}

function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside className={`${mobile ? 'flex h-full w-[286px] shadow-2xl' : 'hidden w-[258px] lg:flex'} fixed inset-y-0 left-0 z-40 flex-col border-r border-slate-700/50 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]`}>
      <div className="flex h-[76px] items-center justify-between border-b border-slate-700/50 px-6">
        <NavLink to="/" data-testid="link-brand" className="flex items-center gap-3" onClick={onClose}>
          <LogoMark />
          <div>
            <p className="text-sm font-bold tracking-[-.02em] text-slate-100">Astra</p>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-cyan-300/75">Decision OS</p>
          </div>
        </NavLink>
        {mobile && (
          <button type="button" onClick={onClose} data-testid="button-close-mobile-nav" className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/60 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section} className="mb-5">
            <p className="mb-2 px-3 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">{section}</p>
            <nav className="space-y-1" aria-label={`${section} navigation`}>
              {navItems.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                    className={({ isActive }) => `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isActive ? 'bg-slate-700/65 font-semibold text-slate-50' : 'text-slate-400 hover:bg-slate-800/65 hover:text-slate-100'}`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-cyan-300" />}
                        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-300'} />
                        <span>{item.label}</span>
                        {item.label === 'Human review' && <span className="ml-auto rounded-full bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">12</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-700/50 p-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/35 p-3">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-cyan-300" />
            <span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-400">Oversight mode</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">Human checkpoints are active for high-impact decisions.</p>
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-emerald-300"><StatusDot state="online" /> Protected</div>
        </div>
        <div className="flex items-center gap-3 px-2 pb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400/15 text-xs font-semibold text-blue-200">MR</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-200">Maya Rios</p>
            <p className="truncate text-[10px] text-slate-500">Systems operator</p>
          </div>
          <button type="button" data-testid="button-sidebar-profile" className="ml-auto text-slate-500 hover:text-slate-200"><ChevronRight size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

function Header({
  onMenu,
  theme,
  onThemeToggle,
}: {
  onMenu: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { health, retry } = useBackendHealth();
  const current = navItems.find((item) => item.path === location.pathname) ?? { label: 'Not found', path: '', section: 'System' as const, icon: CircleHelp };
  const filteredItems = useMemo(() => navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} data-testid="button-open-mobile-nav" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden">
          <Menu size={21} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            <span>Workspace</span><ChevronRight size={12} /><span>{current.section}</span><ChevronRight size={12} /><span className="text-foreground/70">{current.label}</span>
          </div>
          <h1 className="truncate text-lg font-semibold tracking-[-.025em] text-foreground sm:mt-1 sm:text-xl">{current.label}</h1>
        </div>

        <div className="relative hidden md:block">
          <div className={`flex h-10 items-center gap-2 rounded-xl border bg-card px-3 transition-all ${searchOpen ? 'w-72 border-primary/50 ring-4 ring-primary/10' : 'w-56 border-border'}`}>
            <Search size={16} className="text-muted-foreground" />
            <input ref={searchRef} type="search" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => setQuery(event.target.value)} placeholder="Search workspace" data-testid="input-global-search" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground lg:block">⌘ K</kbd>
          </div>
          {searchOpen && (
            <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-xl">
              <p className="px-2 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{query ? 'Matching surfaces' : 'Jump to a surface'}</p>
              {filteredItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return <button type="button" key={item.path} onClick={() => { navigate(item.path); setSearchOpen(false); setQuery(''); }} data-testid={`button-search-${item.label.toLowerCase().replaceAll(' ', '-')}`} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs hover:bg-muted"><Icon size={15} className="text-primary" />{item.label}<span className="ml-auto font-mono text-[9px] text-muted-foreground">{item.path}</span></button>;
              })}
              {filteredItems.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No workspace surfaces match that search.</p>}
            </div>
          )}
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 xl:flex" title={health.detail}>
          <StatusDot state={health.status} />
          <span className="font-mono text-[10px] text-muted-foreground">API {health.label}</span>
          {health.status === 'offline' && <button type="button" onClick={retry} data-testid="button-retry-health" className="ml-1 text-[10px] font-semibold text-primary hover:underline">Retry</button>}
        </div>
        <button type="button" onClick={onThemeToggle} data-testid="button-toggle-theme" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setNotificationsOpen((open) => !open)} data-testid="button-notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-background" />
          </button>
          {notificationsOpen && <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-popover p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Signal inbox</p><span className="font-mono text-[9px] text-muted-foreground">3 new</span></div><div className="space-y-3"><p className="border-l-2 border-amber-400 pl-3 text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Review queue</span> has 12 decisions awaiting a human checkpoint.</p><p className="border-l-2 border-cyan-400 pl-3 text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Drift signal</span> detected in the Northstar model cohort.</p></div><button type="button" onClick={() => { navigate('/review'); setNotificationsOpen(false); }} data-testid="button-view-notifications" className="mt-4 text-xs font-semibold text-primary hover:underline">Open review queue</button></div>}
        </div>
        <div className="relative">
          <button type="button" onClick={() => setProfileOpen((open) => !open)} data-testid="button-profile-menu" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">MR</span><ChevronDown size={14} className="hidden text-muted-foreground sm:block" />
          </button>
          {profileOpen && <div className="absolute right-0 top-12 w-52 rounded-xl border border-border bg-popover p-2 shadow-xl"><div className="border-b border-border px-2 pb-3 pt-1"><p className="text-xs font-semibold">Maya Rios</p><p className="mt-0.5 text-[10px] text-muted-foreground">Systems operator</p></div><button type="button" onClick={() => { navigate('/settings'); setProfileOpen(false); }} data-testid="button-profile-settings" className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-muted"><Settings size={14} />Workspace settings</button><button type="button" data-testid="button-profile-help" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-muted"><CircleHelp size={14} />Operator guide</button></div>}
        </div>
      </div>
      {searchOpen && <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} data-testid="button-close-search" className="fixed inset-0 -z-10 h-full w-full cursor-default" />}
    </header>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden"><button type="button" onClick={() => setMobileOpen(false)} data-testid="button-dismiss-mobile-nav" className="absolute inset-0 h-full w-full cursor-default" aria-label="Close navigation" /><motion.div initial={{ x: -30 }} animate={{ x: 0 }} exit={{ x: -30 }} transition={{ duration: .2 }} className="relative z-10 h-full w-fit"><Sidebar mobile onClose={() => setMobileOpen(false)} /></motion.div></motion.div>}
      </AnimatePresence>
      <div className="lg:pl-[258px]">
         <Header onMenu={() => setMobileOpen(true)} theme={theme} onThemeToggle={toggleTheme} />
        <main className="signal-grid min-h-[calc(100dvh-76px)] overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .22, ease: 'easeOut' }} className="mx-auto max-w-[1480px]">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}