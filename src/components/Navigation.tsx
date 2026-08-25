import React from 'react';
import { UserProfile, Connection, Moment, Idea, SecuritySettings, Note, EventConfig, TrialQuotaMetrics } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { TrialHeaderPill } from './TrialHeaderPill';
import { 
  Home, 
  Users, 
  Camera, 
  Sparkles, 
  MoreHorizontal, 
  Lightbulb, 
  Clock, 
  Flame, 
  Download, 
  QrCode, 
  ShieldAlert, 
  Shield,
  Lock, 
  Trash2, 
  Search, 
  ExternalLink,
  LogOut,
  FileText,
  Globe,
  ChevronDown,
  Layers,
  Palette,
  HardDrive
} from 'lucide-react';
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
  security: SecuritySettings;
  onLockNow: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  profile,
  activeEvent,
  onOpenEventHub,
  onOpenSearch,
  overdueCount,
  connections,
  moments,
  ideas,
  notes = [],
  onOpenPortfolio,
  onOpenSecurity,
  onOpenTrashModal,
  onOpenContingencyHub,
  onOpenThemeModal,
  trialMetrics,
  onOpenTrialModal,
  security,
  onLockNow,
  onOpenProfile,
  onLogout,
}) => {
  const handleTabClick = (tab: NavTab) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  const primaryBrandColor = activeEvent?.branding?.primaryColor || 'var(--accent-primary)';

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] flex justify-between items-center w-full px-3.5 h-16 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSearch();
            }}
            aria-label="Search"
            className="text-[var(--text-secondary)] hover:text-white transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/[0.04] border border-[var(--border-subtle)] active:scale-95"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Event Hub Quick Trigger Pill */}
          {onOpenEventHub && activeEvent ? (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenEventHub();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-[var(--border-subtle)] text-left max-w-[130px] active:scale-95 transition-all"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 animate-pulse bg-[var(--accent-primary)]"
              />
              <span className="text-xs font-bold text-white truncate">
                {activeEvent.name}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>
          ) : (
            <span
              onClick={() => handleTabClick('home')}
              className="font-serif-display text-base font-bold text-white tracking-tight cursor-pointer"
            >
              Momentum
            </span>
          )}

          {/* 1-Day Trial Header Pill for Mobile */}
          {trialMetrics?.isTrial && onOpenTrialModal && (
            <div className="scale-90 origin-left">
              <TrialHeaderPill metrics={trialMetrics} onClick={onOpenTrialModal} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Switcher Button */}
          {onOpenThemeModal && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenThemeModal();
              }}
              title="Change Theme Palette"
              aria-label="Change Theme"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[var(--accent-primary)] border border-[var(--border-subtle)] transition-colors flex items-center justify-center active:scale-95"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          <SyncStatusBadge
            connections={connections}
            moments={moments}
            ideas={ideas}
          />

          {/* Portfolio QR Code Quick Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenPortfolio();
            }}
            title="Scan Portfolio QR"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--border-accent)] transition-colors flex items-center justify-center active:scale-95"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Security lock toggle */}
          {security.isLockEnabled && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onLockNow();
              }}
              title="Lock app for privacy"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 border border-white/10 transition-colors flex items-center justify-center active:scale-95"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenProfile) onOpenProfile();
              else onSelectTab('recap');
            }}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Edit My Profile & Picture"
          >
            <div
              className="w-7 h-7 rounded-full bg-[var(--bg-surface-subtle)] border-2 overflow-hidden flex-shrink-0 border-[var(--accent-primary)]"
            >
              <img
                alt={profile.name}
                className="w-full h-full object-cover"
                src={profile.avatarUrl}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden bg-[var(--bg-canvas)]/98 backdrop-blur-lg border-t border-[var(--border-subtle)] fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 pb-safe px-3">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'home' ? 'font-bold text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${currentTab === 'home' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('people')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] relative ${
            currentTab === 'people' || currentTab === 'followups'
              ? 'font-bold text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Users className={`w-5 h-5 transition-transform ${currentTab === 'people' || currentTab === 'followups' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">People</span>
          {overdueCount > 0 && (
            <span
              className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse"
            />
          )}
        </button>

        <button
          onClick={() => handleTabClick('capture')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'capture' ? 'font-bold text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Camera className={`w-5 h-5 transition-transform ${currentTab === 'capture' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Capture</span>
        </button>

        <button
          onClick={() => handleTabClick('moments')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'moments' ? 'font-bold text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Sparkles className={`w-5 h-5 transition-transform ${currentTab === 'moments' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Moments</span>
        </button>

        <button
          onClick={() => handleTabClick('more')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
              ? 'font-bold text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 transition-transform ${currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">More</span>
        </button>
      </nav>

      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)] p-5 z-40 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              onClick={() => handleTabClick('home')}
              className="font-serif-display text-2xl font-bold text-white tracking-tight cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
            >
              Momentum
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase font-semibold">
              Universal Event OS
            </p>
          </div>
          <SyncStatusBadge
            connections={connections}
            moments={moments}
            ideas={ideas}
            notes={notes}
          />
        </div>

        {/* 1-Day Trial Status Card (If in Trial mode) */}
        {trialMetrics?.isTrial && onOpenTrialModal && (
          <div className="mb-3">
            <TrialHeaderPill metrics={trialMetrics} onClick={onOpenTrialModal} />
          </div>
        )}

        {/* ACTIVE EVENT SWITCHER WIDGET */}
        {activeEvent && onOpenEventHub && (
          <div
            onClick={() => {
              triggerHaptic('selection');
              onOpenEventHub();
            }}
            className="mb-3.5 p-3 rounded-2xl bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-white/20 transition-all cursor-pointer group shadow-md"
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
              >
                {activeEvent.eventType}
              </span>
              <span className="text-[10px] text-neutral-400 group-hover:text-white flex items-center gap-1 font-semibold transition-colors">
                Switch
                <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </div>
            <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[var(--accent-primary)] transition-colors">
              {activeEvent.name}
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
              {activeEvent.location || 'Global'} • Goal: {activeEvent.targetConnections}
            </p>
          </div>
        )}

        {/* Portfolio Showcase Banner */}
        <div className="mb-3.5 p-3 rounded-2xl bg-[var(--bg-surface-card)] border border-[var(--border-accent)] shadow-md">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-black shrink-0">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Attendee Portfolio</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">QR & Contact Pass</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenPortfolio();
            }}
            className="w-full py-1.5 px-3 bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--border-accent)] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <QrCode className="w-3 h-3" />
            <span>Show QR to Connect</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'home'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleTabClick('people')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'people'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>People & CRM</span>
            </div>
            {overdueCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('notes')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'notes'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Smart Notes & Q&A</span>
          </button>

          <button
            onClick={() => handleTabClick('capture')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'capture'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Capture Hub</span>
          </button>

          <button
            onClick={() => handleTabClick('moments')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'moments'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Moments Timeline</span>
          </button>

          <button
            onClick={() => handleTabClick('ideas')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'ideas'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Talk Insights</span>
          </button>

          <button
            onClick={() => handleTabClick('followups')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'followups'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Follow-ups Tracker</span>
          </button>

          <button
            onClick={() => handleTabClick('recap')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'recap'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Milestones & Recap</span>
          </button>

          <button
            onClick={() => handleTabClick('export')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'export'
                ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export & PDF</span>
          </button>

          {/* Theme Selector Navigation Item */}
          {onOpenThemeModal && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenThemeModal();
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-left"
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Palette</span>
            </button>
          )}

          {/* Event Hub Quick Link */}
          {onOpenEventHub && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenEventHub();
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all text-left"
            >
              <Globe className="w-4 h-4 text-neutral-400" />
              <span>Event Hub & Switcher</span>
            </button>
          )}

          {/* Quick utility controls */}
          <div className="pt-2 mt-1 border-t border-[var(--border-subtle)] space-y-1">
            {onOpenContingencyHub && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenContingencyHub();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors text-left"
              >
                <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Contingency & Health</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenTrashModal();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Demo Data & Trash</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenSecurity();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-amber-300 hover:bg-amber-950/20 transition-colors text-left"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Access & PIN Lock</span>
            </button>
          </div>
        </nav>

        {/* User Badge Profile info */}
        <div className="pt-3 border-t border-[var(--border-subtle)] mt-auto space-y-2">
          <div
            onClick={() => {
              triggerHaptic('light');
              if (onOpenProfile) onOpenProfile();
              else onSelectTab('recap');
            }}
            className="flex items-center gap-3 cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-colors group"
            title="Edit My Profile & Picture"
          >
            <div
              className="w-9 h-9 rounded-full border-2 overflow-hidden bg-[var(--bg-surface-subtle)] transition-colors relative flex-shrink-0 border-[var(--accent-primary)]"
            >
              <img
                alt={profile.name}
                className="w-full h-full object-cover"
                src={profile.avatarUrl}
              />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-[var(--accent-primary)] transition-colors">{profile.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate font-mono">{profile.email}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onLogout();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
              title="Sign out of workspace"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>{trialMetrics?.isTrial ? 'Exit Trial Pass' : 'Sign Out'}</span>
              </span>
              <span className="text-[10px] font-mono text-white/30">
                {trialMetrics?.isTrial ? 'Guest Mode' : 'Owner Session'}
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
