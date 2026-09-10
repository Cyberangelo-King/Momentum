import React, { useMemo, useState } from 'react';
import { Connection, FollowUpStatus } from '../types';
import { CheckCircle2, Clock3, MessageSquare, ArrowRight, AlertCircle, CalendarDays } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface FollowUpsViewProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickMessage: (connection: Connection) => void;
  onUpdateConnection: (updated: Connection) => void;
  eventName?: string;
  profileName?: string;
}

const TABS: Array<{ id: FollowUpStatus; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Done' },
];

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

const statusCopy = (status: FollowUpStatus) => {
  if (status === 'today') return { title: 'Due today', body: 'A small action now is usually better than a perfect message later.' };
  if (status === 'overdue') return { title: 'Needs attention', body: 'These follow-ups are already late. Start with the highest-value relationship.' };
  if (status === 'upcoming') return { title: 'Coming up', body: 'Keep these on your radar without turning your network into a task list.' };
  return { title: 'Followed through', body: 'Completed actions and the relationships they belong to.' };
};

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  connections,
  onSelectConnection,
  onOpenQuickMessage,
  onUpdateConnection,
  eventName,
}) => {
  const [activeTab, setActiveTab] = useState<FollowUpStatus>('today');

  const counts = useMemo(() => TABS.reduce((acc, tab) => {
    acc[tab.id] = connections.filter((c) => c.followUpStatus === tab.id && !c.inTrash).length;
    return acc;
  }, {} as Record<FollowUpStatus, number>), [connections]);

  const items = useMemo(() => connections
    .filter((c) => c.followUpStatus === activeTab && !c.inTrash)
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.priority] - rank[b.priority] || a.name.localeCompare(b.name);
    }), [connections, activeTab]);

  const complete = (connection: Connection) => {
    onUpdateConnection({
      ...connection,
      followUpStatus: 'completed',
      pipelineStage: connection.pipelineStage || 'sent',
      lastFollowUpMessage: connection.lastFollowUpMessage || 'Follow-up completed',
    });
    triggerHaptic('success');
  };

  const copy = statusCopy(activeTab);

  return (
    <main className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-10 text-[var(--text-primary)]">
      <header className="pt-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Relationship follow-through</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-3xl font-semibold tracking-[-0.035em] text-white">Follow-ups</h1>
            <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">The people you said you would get back to{eventName ? ` from ${eventName}` : ''}.</p>
          </div>
          <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] text-[var(--accent-primary)]">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] shadow-[var(--shadow-card)]" aria-label="Follow-up filters">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`min-h-12 rounded-xl px-2 text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-black shadow-sm' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'}`}>
            <span className="block">{tab.label}</span>
            <span className={`mt-0.5 block text-[10px] tabular-nums ${activeTab === tab.id ? 'text-black/65' : 'opacity-60'}`}>{counts[tab.id]}</span>
          </button>
        ))}
      </section>

      <section className={`rounded-2xl border p-4 sm:p-5 ${activeTab === 'overdue' ? 'border-red-500/20 bg-red-500/[0.045]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface-card)]'}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activeTab === 'overdue' ? 'bg-red-500/10 text-red-300' : 'bg-[var(--accent-glow)] text-[var(--accent-primary)]'}`}>
            {activeTab === 'overdue' ? <AlertCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{copy.title}</h2>
            <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">{copy.body}</p>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] px-6 py-14 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto h-11 w-11 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-[var(--text-secondary)]" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-white">Nothing here.</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{activeTab === 'today' ? 'Your queue is clear. Good.' : `No ${activeTab} follow-ups right now.`}</p>
        </section>
      ) : (
        <section className="space-y-2.5" aria-label={`${activeTab} follow-ups`}>
          {items.map((connection) => (
            <article key={connection.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-4 shadow-[var(--shadow-card)] hover:border-white/15 transition-colors">
              <div className="flex items-start gap-3">
                <button onClick={() => onSelectConnection(connection)} className="flex min-w-0 flex-1 items-start gap-3 text-left group">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center">
                    {connection.avatarUrl ? <img src={connection.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-white">{initials(connection.name)}</span>}
                  </div>
                  <span className="min-w-0 pt-0.5">
                    <span className="flex items-center gap-2">
                      <strong className="truncate text-sm text-white group-hover:text-[var(--accent-primary)] transition-colors">{connection.name}</strong>
                      {connection.priority === 'high' && <span className="shrink-0 rounded-full bg-[var(--accent-glow)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">High</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{[connection.profession, connection.company].filter(Boolean).join(' · ') || 'Connection'}</span>
                    <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">{activeTab === 'overdue' ? <AlertCircle className="h-3.5 w-3.5 text-red-400" /> : <Clock3 className="h-3.5 w-3.5" />}{connection.followUpDate || 'Follow up'}</span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => onOpenQuickMessage(connection)} aria-label={`Message ${connection.name}`} className="min-h-10 min-w-10 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors"><MessageSquare className="h-4 w-4" /></button>
                  {activeTab !== 'completed' && <button onClick={() => complete(connection)} aria-label={`Mark ${connection.name} complete`} className="min-h-10 min-w-10 rounded-xl bg-[var(--accent-primary)] text-black flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"><CheckCircle2 className="h-4 w-4" /></button>}
                </div>
              </div>
              {connection.notes && <button onClick={() => onSelectConnection(connection)} className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-left text-xs leading-5 text-[var(--text-secondary)] hover:text-white transition-colors"><span className="line-clamp-2">{connection.notes}</span></button>}
              <button onClick={() => onSelectConnection(connection)} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">View relationship <ArrowRight className="h-3 w-3" /></button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
