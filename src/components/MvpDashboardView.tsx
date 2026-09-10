import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Clock3, MessageCircle, Plus, Users, Zap } from 'lucide-react';
import { Connection, EventSession, Idea, Moment, Note, UserProfile, EventConfig } from '../types';

interface MvpDashboardViewProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes?: Note[];
  sessions: EventSession[];
  profile: UserProfile;
  activeEvent?: EventConfig;
  onOpenEventHub?: () => void;
  onOpenQuickConnect: () => void;
  onOpenCapture: () => void;
  onOpenAddIdea: () => void;
  onSelectConnection: (connection: Connection) => void;
  onSelectTab: (tab: any) => void;
  onOpenProfile?: () => void;
  onOpenGamification?: () => void;
  onOpenContingency?: () => void;
  onOpenSessionDossier?: (session: EventSession) => void;
  onOpenPostEventReview?: () => void;
  onOpenConstellation?: () => void;
  onOpenPitchSimulator?: () => void;
  onOpenDigitalBadge?: () => void;
  onOpenLiveCopilot?: () => void;
  onOpenEventAnalytics?: () => void;
  onOpenOnboarding?: () => void;
}

export const MvpDashboardView: React.FC<MvpDashboardViewProps> = ({
  connections,
  moments,
  ideas,
  profile,
  activeEvent,
  onOpenQuickConnect,
  onOpenCapture,
  onSelectConnection,
  onSelectTab,
}) => {
  const scoped = useMemo(() => activeEvent ? connections.filter(c => !c.eventId || c.eventId === activeEvent.id) : connections, [connections, activeEvent]);
  const needsAction = scoped.filter(c => c.followUpStatus === 'today' || c.followUpStatus === 'overdue');
  const completed = scoped.filter(c => c.followUpStatus === 'completed').length;
  const progressed = scoped.filter(c => ['replied', 'meeting-booked', 'closed-deal'].includes(c.pipelineStage || '')).length;
  const target = activeEvent?.targetConnections || profile.targetConnections || 50;
  const priority = [...needsAction, ...scoped.filter(c => !needsAction.includes(c))].slice(0, 5);

  return (
    <main className="w-full max-w-5xl mx-auto px-1 pb-28 md:pb-12 space-y-5">
      <header className="flex items-end justify-between gap-4 pt-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-secondary)]">{activeEvent?.name || 'Momentum'}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">Who matters next?</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">Remember the right people. Take the right action. Keep relationships moving.</p>
        </div>
        <button onClick={onOpenQuickConnect} className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black text-sm font-bold hover:brightness-105 active:scale-[.98]">
          <Plus className="w-4 h-4" /> Add person
        </button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['People', scoped.length, Users],
          ['Needs action', needsAction.length, Clock3],
          ['Followed through', completed, CheckCircle2],
          ['Progressions', progressed, Zap],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-4">
            <div className="flex items-center justify-between text-[var(--text-secondary)]"><span className="text-xs">{label}</span><Icon className="w-4 h-4" /></div>
            <div className="text-2xl font-semibold text-white mt-2">{value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--border-accent)] bg-[var(--bg-surface-card)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">Core loop</p>
            <h2 className="text-lg font-semibold text-white mt-1">Capture → understand → act → progress</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{scoped.length} people captured. {needsAction.length} currently need a decision.</p>
          </div>
          <button onClick={onOpenCapture} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90">
            Capture someone <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/[.06] overflow-hidden"><div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${Math.min((scoped.length / Math.max(target, 1)) * 100, 100)}%` }} /></div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div><h2 className="font-semibold text-white">Relationship queue</h2><p className="text-xs text-[var(--text-secondary)] mt-0.5">The people Momentum thinks deserve attention.</p></div>
          <button onClick={() => onSelectTab('people')} className="text-xs font-semibold text-[var(--accent-primary)]">View all</button>
        </div>
        {priority.length === 0 ? (
          <div className="p-8 text-center"><MessageCircle className="w-7 h-7 mx-auto text-[var(--text-secondary)]" /><p className="text-sm text-white mt-3">No relationship queue yet.</p><p className="text-xs text-[var(--text-secondary)] mt-1">Capture your first person and Momentum can start learning.</p></div>
        ) : priority.map((person, index) => (
          <button key={person.id} onClick={() => onSelectConnection(person)} className="w-full text-left px-5 py-4 flex items-center gap-3 border-b last:border-0 border-[var(--border-subtle)] hover:bg-white/[.025] transition-colors">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-white">{(person.name || '?').slice(0,1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white truncate">{person.name}</div><div className="text-xs text-[var(--text-secondary)] truncate">{person.company || person.profession || 'Connection'}</div></div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${person.followUpStatus === 'overdue' ? 'bg-red-500/10 text-red-300' : person.followUpStatus === 'today' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-white/[.05] text-[var(--text-secondary)]'}`}>{person.followUpStatus === 'overdue' ? 'Overdue' : person.followUpStatus === 'today' ? 'Today' : person.pipelineStage || 'New'}</span>
            <ArrowRight className="w-4 h-4 text-white/25 shrink-0" />
          </button>
        ))}
      </section>

      <button onClick={onOpenCapture} className="sm:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-black shadow-xl flex items-center justify-center active:scale-95" aria-label="Capture person"><Plus className="w-6 h-6" /></button>
    </main>
  );
};
