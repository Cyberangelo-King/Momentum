import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Lightbulb, MessageCircle, Plus, Users, Zap, Globe2, ChevronRight } from 'lucide-react';
import { Connection, EventSession, Moment, Idea, UserProfile, Note, EventConfig } from '../types';

interface DashboardViewProps {
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

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

export const DashboardView: React.FC<DashboardViewProps> = ({
  connections, moments, ideas, profile, activeEvent, onOpenEventHub,
  onOpenQuickConnect, onOpenCapture, onSelectConnection, onSelectTab,
}) => {
  const scoped = useMemo(
    () => activeEvent ? connections.filter((c) => !c.eventId || c.eventId === activeEvent.id) : connections,
    [connections, activeEvent],
  );
  const needsAction = scoped.filter((c) => c.followUpStatus === 'today' || c.followUpStatus === 'overdue');
  const completed = scoped.filter((c) => c.followUpStatus === 'completed').length;
  const progressed = scoped.filter((c) => ['replied', 'meeting-booked', 'closed-deal'].includes(c.pipelineStage || '')).length;
  const target = activeEvent?.targetConnections || profile.targetConnections || 50;
  const queue = [...needsAction, ...scoped.filter((c) => !needsAction.includes(c))].slice(0, 5);
  const recentMoments = moments.slice(-3).reverse();
  const recentIdeas = ideas.slice(-3).reverse();
  const progress = Math.min((scoped.length / Math.max(target, 1)) * 100, 100);

  const metrics = [
    { label: 'People', value: scoped.length, icon: Users, hint: 'captured' },
    { label: 'Needs action', value: needsAction.length, icon: Clock3, hint: 'to follow up' },
    { label: 'Followed through', value: completed, icon: CheckCircle2, hint: 'completed' },
    { label: 'Progressions', value: progressed, icon: Zap, hint: 'moved forward' },
  ];

  return (
    <main className="w-full max-w-5xl mx-auto px-1 pb-28 md:pb-12 space-y-6 text-[var(--text-primary)]">
      <header className="pt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] truncate">
                {activeEvent?.name || 'Your network'}
              </p>
            </div>
            <h1 className="text-[28px] sm:text-3xl font-semibold tracking-[-0.035em] text-white">Who matters next?</h1>
            <p className="text-sm leading-6 text-[var(--text-secondary)] mt-1.5 max-w-2xl">
              Remember the right people. Take the right action. Keep relationships moving.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {onOpenEventHub && (
              <button onClick={onOpenEventHub} className="inline-flex items-center gap-2 min-h-10 px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] text-white text-xs font-semibold hover:bg-[var(--bg-surface-subtle)] transition-colors">
                <Globe2 className="w-4 h-4 text-[var(--text-secondary)]" /> Event
              </button>
            )}
            <button onClick={onOpenQuickConnect} className="inline-flex items-center gap-2 min-h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-black text-xs font-bold shadow-[var(--shadow-glow)] hover:brightness-105 active:scale-[.98] transition-all">
              <Plus className="w-4 h-4" /> Add person
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" aria-label="Relationship overview">
        {metrics.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
              <Icon className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
            </div>
            <div className="mt-2.5 flex items-end gap-2">
              <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</span>
              <span className="pb-0.5 text-[10px] text-[var(--text-secondary)]">{hint}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[var(--border-accent)] bg-[linear-gradient(135deg,var(--bg-surface-card),var(--bg-surface-subtle))] p-5 sm:p-6 shadow-[var(--shadow-card)]">
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[var(--accent-glow)] blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-glow)] text-[var(--accent-primary)] text-xs font-bold">01</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Relationship loop</p>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mt-3">Capture the person before the moment disappears.</h2>
            <p className="text-xs sm:text-sm leading-5 text-[var(--text-secondary)] mt-1.5">{scoped.length} {scoped.length === 1 ? 'person' : 'people'} captured. {needsAction.length ? `${needsAction.length} ${needsAction.length === 1 ? 'needs' : 'need'} your attention.` : 'Nothing is waiting on you right now.'}</p>
          </div>
          <button onClick={onOpenCapture} className="relative inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-[.98] transition-all shrink-0">
            Capture someone <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mt-6">
          <div className="h-2 rounded-full bg-white/[.06] overflow-hidden" aria-label={`${Math.round(progress)} percent of event connection target reached`}>
            <div className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
            <span>{scoped.length} captured</span>
            <span>{target} target</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold text-white">Your relationship queue</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">The next people worth your attention.</p>
          </div>
          <button onClick={() => onSelectTab('people')} className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-primary)] hover:text-white transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {queue.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-11 w-11 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <p className="text-sm font-semibold text-white mt-3">Your network starts here.</p>
            <p className="text-xs leading-5 text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">Capture someone you meet. Momentum will keep the context so the next action is easier to see.</p>
            <button onClick={onOpenCapture} className="mt-5 min-h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-black text-xs font-bold">Capture first person</button>
          </div>
        ) : queue.map((person, index) => (
          <button key={person.id} onClick={() => onSelectConnection(person)} className="w-full text-left px-5 py-3.5 flex items-center gap-3 border-b last:border-0 border-[var(--border-subtle)] hover:bg-white/[.025] focus-visible:bg-white/[.04] transition-colors group">
            <div className="relative shrink-0">
              {person.avatarUrl ? <img src={person.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-[var(--bg-surface-subtle)]" /> : <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[11px] font-bold text-white">{initials(person.name)}</div>}
              {index === 0 && <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-[var(--bg-surface-card)] bg-[var(--accent-primary)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{person.name}</span>
                {person.priority === 'high' && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">Priority</span>}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{person.company || person.profession || 'Connection'}</div>
            </div>
            <span className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded-full border ${person.followUpStatus === 'overdue' ? 'bg-red-500/10 text-red-300 border-red-500/20' : person.followUpStatus === 'today' ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border-[var(--border-accent)]' : 'bg-white/[.04] text-[var(--text-secondary)] border-transparent'}`}>
              {person.followUpStatus === 'overdue' ? 'Overdue' : person.followUpStatus === 'today' ? 'Today' : person.followUpStatus === 'completed' ? 'Done' : person.pipelineStage === 'replied' ? 'Replied' : person.pipelineStage === 'meeting' || person.pipelineStage === 'meeting-booked' ? 'Meeting' : 'New'}
            </span>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
          </button>
        ))}
      </section>

      {(recentMoments.length > 0 || recentIdeas.length > 0) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentMoments.length > 0 && <button onClick={() => onSelectTab('moments')} className="text-left rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-5 hover:bg-[var(--bg-surface-subtle)] transition-colors">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[var(--accent-primary)]" /><h2 className="text-sm font-semibold text-white">Recent moments</h2></div><ChevronRight className="w-4 h-4 text-white/25" /></div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">{recentMoments.length} recent memory {recentMoments.length === 1 ? 'signal' : 'signals'}.</p>
          </button>}
          {recentIdeas.length > 0 && <button onClick={() => onSelectTab('ideas')} className="text-left rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-5 hover:bg-[var(--bg-surface-subtle)] transition-colors">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[var(--accent-primary)]" /><h2 className="text-sm font-semibold text-white">Ideas & opportunities</h2></div><ChevronRight className="w-4 h-4 text-white/25" /></div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">{recentIdeas.length} recent {recentIdeas.length === 1 ? 'idea' : 'ideas'} captured.</p>
          </button>}
        </section>
      )}

      <button onClick={onOpenCapture} className="sm:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-2xl bg-[var(--accent-primary)] text-black shadow-[var(--shadow-glow)] flex items-center justify-center active:scale-95 transition-transform" aria-label="Capture person"><Plus className="w-6 h-6" /></button>
    </main>
  );
};
