import React, { useState } from 'react';
import { UserProfile, Connection, Moment, Idea, SecuritySettings, Note, EventConfig, TrialQuotaMetrics } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { TrialHeaderPill } from './TrialHeaderPill';
import { Home, Users, Camera, MoreHorizontal, Search, QrCode, Lock, ChevronDown, Sparkles, Lightbulb, FileText, Download, Shield, Trash2, Palette, LogOut } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export type NavTab = 'home' | 'people' | 'capture' | 'moments' | 'notes' | 'more' | 'ideas' | 'followups' | 'recap' | 'export';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  activeEvent?: EventConfig;
  onOpenEventHub?: () => void;
  onOpenSearch: () => void;
  onOpenQuickConnect: () => void;
  overdueCount: number;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes?: Note[];
  onOpenPortfolio: () => void;
  onOpenSecurity: () => void;
  onOpenTrashModal: () => void;
  onOpenContingencyHub?: () => void;
  onOpenThemeModal?: () => void;
  trialMetrics?: TrialQuotaMetrics;
  onOpenTrialModal?: () => void;
  onOpenOnboarding?: () => void;
  security: SecuritySettings;
  onLockNow: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab, onSelectTab, profile, activeEvent, onOpenEventHub, onOpenSearch, onOpenQuickConnect,
  overdueCount, connections, moments, ideas, notes = [], onOpenPortfolio, onOpenSecurity, onOpenTrashModal,
  onOpenContingencyHub, onOpenThemeModal, trialMetrics, onOpenTrialModal, onOpenOnboarding, security,
  onLockNow, onOpenProfile, onLogout,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const select = (tab: NavTab) => { triggerHaptic('light'); onSelectTab(tab); setMoreOpen(false); };
  const secondary: Array<{ tab: NavTab; label: string; icon: React.ReactNode }> = [
    { tab: 'moments', label: 'Moments', icon: <Sparkles className="h-4 w-4" /> },
    { tab: 'ideas', label: 'Ideas', icon: <Lightbulb className="h-4 w-4" /> },
    { tab: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
    { tab: 'recap', label: 'Recap', icon: <FileText className="h-4 w-4" /> },
    { tab: 'export', label: 'Export', icon: <Download className="h-4 w-4" /> },
  ];

  const MoreMenu = () => moreOpen ? (
    <div className="absolute bottom-24 left-3 right-3 md:bottom-auto md:left-3 md:right-auto md:top-16 md:w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-card)] p-2 shadow-2xl z-50">
      <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">More</p>
      {secondary.map((item) => <button key={item.tab} onClick={() => select(item.tab)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white">{item.icon}<span>{item.label}</span></button>)}
      <div className="my-1 border-t border-[var(--border-subtle)]" />
      {onOpenEventHub && <button onClick={() => { setMoreOpen(false); onOpenEventHub(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />Event</button>}
      <button onClick={() => { setMoreOpen(false); onOpenPortfolio(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><QrCode className="h-4 w-4" />Portfolio QR</button>
      {onOpenSecurity && <button onClick={() => { setMoreOpen(false); onOpenSecurity(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><Shield className="h-4 w-4" />Security</button>}
      {onOpenThemeModal && <button onClick={() => { setMoreOpen(false); onOpenThemeModal(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><Palette className="h-4 w-4" />Theme</button>}
      {onOpenTrashModal && <button onClick={() => { setMoreOpen(false); onOpenTrashModal(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><Trash2 className="h-4 w-4" />Trash</button>}
      {onOpenContingencyHub && <button onClick={() => { setMoreOpen(false); onOpenContingencyHub(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"><Lock className="h-4 w-4" />Recovery</button>}
      {onLogout && <button onClick={() => { setMoreOpen(false); onLogout(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10"><LogOut className="h-4 w-4" />Sign out</button>}
    </div>
  ) : null;

  const Primary = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'grid grid-cols-5 w-full' : 'space-y-1'}>
      <button onClick={() => select('home')} className={`${mobile ? 'flex flex-col items-center justify-center min-h-12' : 'flex w-full items-center gap-3 px-3.5 py-3'} rounded-xl text-xs font-semibold ${currentTab === 'home' ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white'}`}><Home className="h-5 w-5" /><span className={mobile ? 'mt-1' : ''}>Home</span></button>
      <button onClick={() => select('people')} className={`${mobile ? 'flex flex-col items-center justify-center min-h-12 relative' : 'flex w-full items-center gap-3 px-3.5 py-3'} rounded-xl text-xs font-semibold ${currentTab === 'people' ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white'}`}><Users className="h-5 w-5" /><span className={mobile ? 'mt-1' : ''}>People</span>{overdueCount > 0 && <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full bg-red-400" />}</button>
      <button onClick={() => { triggerHaptic('light'); onOpenQuickConnect(); }} className={`${mobile ? 'flex flex-col items-center justify-center min-h-12' : 'flex w-full items-center gap-3 px-3.5 py-3'} rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-black hover:brightness-110`}><Camera className="h-5 w-5" /><span className={mobile ? 'mt-1' : ''}>Capture</span></button>
      <button onClick={() => select('followups')} className={`${mobile ? 'flex flex-col items-center justify-center min-h-12' : 'flex w-full items-center gap-3 px-3.5 py-3'} rounded-xl text-xs font-semibold ${currentTab === 'followups' ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white'}`}><ClockIcon /><span className={mobile ? 'mt-1' : ''}>Follow-ups</span></button>
      <button onClick={() => setMoreOpen((v) => !v)} className={`${mobile ? 'flex flex-col items-center justify-center min-h-12' : 'flex w-full items-center gap-3 px-3.5 py-3'} rounded-xl text-xs font-semibold ${moreOpen || secondary.some((x) => x.tab === currentTab) ? 'bg-white/[0.06] text-white' : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white'}`}><MoreHorizontal className="h-5 w-5" /><span className={mobile ? 'mt-1' : ''}>More</span></button>
    </div>
  );

  return <>
    <header className="fixed inset-x-0 top-0 z-40 hidden md:flex h-16 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-md px-6">
      <div className="flex w-full items-center gap-5">
        <button onClick={() => select('home')} className="mr-2 text-xl font-bold font-serif-display text-white">Momentum</button>
        <button onClick={onOpenSearch} aria-label="Search" className="min-h-10 min-w-10 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] flex items-center justify-center text-[var(--text-secondary)] hover:text-white"><Search className="h-4 w-4" /></button>
        {activeEvent && onOpenEventHub && <button onClick={onOpenEventHub} className="flex max-w-56 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white"><span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" /> <span className="truncate">{activeEvent.name}</span><ChevronDown className="h-3 w-3" /></button>}
        <div className="ml-auto flex items-center gap-3"><SyncStatusBadge connections={connections} moments={moments} ideas={ideas} notes={notes} />{trialMetrics?.isTrial && onOpenTrialModal && <TrialHeaderPill metrics={trialMetrics} onClick={onOpenTrialModal} />}<button onClick={() => onOpenProfile?.()} className="h-9 w-9 overflow-hidden rounded-full border-2 border-[var(--accent-primary)]"><img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" /></button></div>
      </div>
    </header>

    <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 md:block">
      <Primary />
      <MoreMenu />
    </aside>

    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 px-3 backdrop-blur-md md:hidden">
      <button onClick={onOpenSearch} aria-label="Search" className="min-h-10 min-w-10 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)]"><Search className="h-4 w-4" /></button>
      <div className="ml-3 min-w-0 flex-1">{activeEvent && onOpenEventHub ? <button onClick={onOpenEventHub} className="flex max-w-full items-center gap-2 text-left"><span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)]" /><span className="truncate text-sm font-bold text-white">{activeEvent.name}</span></button> : <span className="font-serif-display font-bold text-white">Momentum</span>}</div>
      <button onClick={() => onOpenProfile?.()} className="h-9 w-9 overflow-hidden rounded-full border-2 border-[var(--accent-primary)]"><img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" /></button>
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/98 px-2 pb-safe pt-1 backdrop-blur-lg md:hidden">
      <div className="relative"><Primary mobile /><MoreMenu /></div>
    </nav>
  </>;
};

const ClockIcon = () => <span className="relative flex h-5 w-5 items-center justify-center"><span className="h-4 w-4 rounded-full border-2 border-current" /><span className="absolute h-1.5 w-px bg-current -translate-y-1" /><span className="absolute h-px w-1.5 bg-current translate-x-1 -translate-y-0.5" /></span>;
