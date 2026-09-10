import React, { useMemo, useState } from 'react';
import { Connection, FollowUpStatus } from '../types';
import { CheckCircle2, Clock3, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
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

  return (
    <main className="w-full max-w-4xl mx-auto space-y-5 pb-28 md:pb-10">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Relationship follow-through</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-serif-display text-white">Follow-ups</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">The people you said you would get back to{eventName ? ` from ${eventName}` : ''}.</p>
      </header>

      <section className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)]" aria-label="Follow-up filters">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-12 rounded-xl px-2 text-xs font-bold transition-colors ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'}`}>
            <span className="block">{tab.label}</span>
            <span className={`text-[10px] ${activeTab === tab.id ? 'text-black/70' : 'opacity-60'}`}>{counts[tab.id]}</span>
          </button>
        ))}
      </section>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] px-6 py-14 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <h2 className="mt-3 text-sm font-bold text-white">Nothing here.</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeTab === 'today' ? 'Your queue is clear. Good.' : `No ${activeTab} follow-ups right now.`}</p>
        </section>
      ) : (
        <section className="space-y-2" aria-label={`${activeTab} follow-ups`}>
          {items.map((connection) => (
            <article key={connection.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-4 hover:border-white/15 transition-colors">
              <div className="flex items-start gap-3">
                <button onClick={() => onSelectConnection(connection)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <img src={connection.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover bg-[var(--bg-surface-subtle)]" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2"><strong className="truncate text-sm text-white">{connection.name}</strong>{connection.priority === 'high' && <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">High</span>}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{connection.profession} · {connection.company}</span>
                    <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">{activeTab === 'overdue' ? <AlertCircle className="h-3.5 w-3.5 text-red-400" /> : <Clock3 className="h-3.5 w-3.5" />}{connection.followUpDate || 'Follow up'}</span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => onOpenQuickMessage(connection)} aria-label={`Message ${connection.name}`} className="min-h-10 min-w-10 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] text-[var(--text-secondary)] hover:text-white flex items-center justify-center"><MessageSquare className="h-4 w-4" /></button>
                  {activeTab !== 'completed' && <button onClick={() => complete(connection)} aria-label={`Mark ${connection.name} complete`} className="min-h-10 min-w-10 rounded-xl bg-[var(--accent-primary)] text-black flex items-center justify-center hover:brightness-110"><CheckCircle2 className="h-4 w-4" /></button>}
                </div>
              </div>
              {connection.notes && <button onClick={() => onSelectConnection(connection)} className="mt-3 w-full rounded-xl bg-[var(--bg-surface-subtle)] p-3 text-left text-xs leading-relaxed text-[var(--text-secondary)] hover:text-white"><span className="line-clamp-2">{connection.notes}</span></button>}
              <button onClick={() => onSelectConnection(connection)} className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-primary)]">View relationship <ArrowRight className="h-3 w-3" /></button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
