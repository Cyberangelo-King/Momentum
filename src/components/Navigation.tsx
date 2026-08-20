import React from 'react';
import { UserProfile, Connection, Moment, Idea, SecuritySettings } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { QrCode, Shield, ShieldAlert, Lock, Trash2, Search, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export type NavTab = 'home' | 'people' | 'capture' | 'moments' | 'more' | 'ideas' | 'followups' | 'recap' | 'export';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  onOpenSearch: () => void;
  onOpenQuickConnect: () => void;
  overdueCount: number;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  onOpenPortfolio: () => void;
  onOpenSecurity: () => void;
  onOpenTrashModal: () => void;
  security: SecuritySettings;
  onLockNow: () => void;
  onOpenProfile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onOpenSearch,
  overdueCount,
  connections,
  moments,
  ideas,
  onOpenPortfolio,
  onOpenSecurity,
  onOpenTrashModal,
  security,
  onLockNow,
  onOpenProfile,
}) => {
  const handleTabClick = (tab: NavTab) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 flex justify-between items-center w-full px-4 h-16 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSearch();
            }}
            aria-label="Search"
            className="text-[#ffb59a] hover:text-[#FF5C00] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-neutral-900/80 border border-neutral-800 active:scale-95"
          >
            <Search className="w-4 h-4" />
          </button>
          <span
            onClick={() => handleTabClick('home')}
            className="font-serif-display text-xl font-bold text-[#ffb59a] tracking-tight cursor-pointer"
          >
            Momentum
          </span>
        </div>

        <div className="flex items-center gap-2.5">
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
            title="Scan Angelo's TEDx Portfolio QR"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF6B26] border border-[#FF4D00]/30 transition-colors flex items-center justify-center active:scale-95"
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
              className="min-w-[44px] min-h-[44px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 transition-colors flex items-center justify-center active:scale-95"
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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Edit My Profile & Picture"
          >
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border-2 border-[#FF5C00]/60 overflow-hidden flex-shrink-0">
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
      <nav className="md:hidden bg-[#0A0A0A]/98 backdrop-blur-lg border-t border-white/10 fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 pb-safe px-3">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'home' ? 'text-[#FF5C00] font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'home' ? 'fill-1 scale-110' : ''
            }`}
          >
            home
          </span>
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('people')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] relative ${
            currentTab === 'people' || currentTab === 'followups'
              ? 'text-[#FF5C00] font-bold'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'people' ? 'fill-1 scale-110' : ''
            }`}
          >
            group
          </span>
          <span className="text-[11px] font-medium mt-1">People</span>
          {overdueCount > 0 && (
            <span className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => handleTabClick('capture')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'capture' ? 'text-[#FF5C00] font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'capture' ? 'fill-1 scale-110' : ''
            }`}
          >
            add_a_photo
          </span>
          <span className="text-[11px] font-medium mt-1">Capture</span>
        </button>

        <button
          onClick={() => handleTabClick('moments')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'moments' ? 'text-[#FF5C00] font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'moments' ? 'fill-1 scale-110' : ''
            }`}
          >
            auto_awesome
          </span>
          <span className="text-[11px] font-medium mt-1">Moments</span>
        </button>

        <button
          onClick={() => handleTabClick('more')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
              ? 'text-[#FF5C00] font-bold'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
                ? 'fill-1 scale-110'
                : ''
            }`}
          >
            more_horiz
          </span>
          <span className="text-[11px] font-medium mt-1">More</span>
        </button>
      </nav>

      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#140b07] border-r border-white/10 p-5 z-40 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              onClick={() => handleTabClick('home')}
              className="font-serif-display text-2xl font-bold text-[#ffb59a] tracking-tight cursor-pointer hover:text-white transition-colors"
            >
              Momentum
            </h1>
            <p className="text-[10px] text-[#e4beb1]/60 tracking-wider uppercase font-semibold">
              TEDxAkure 2026 OS
            </p>
          </div>
          <SyncStatusBadge
            connections={connections}
            moments={moments}
            ideas={ideas}
          />
        </div>

        {/* Angelo Portfolio Showcase Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-[#1E110A] to-[#2C140A] border border-[#FF4D00]/30 shadow-lg shadow-black/40">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF4D00] flex items-center justify-center text-white shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Angelo's Portfolio</p>
              <p className="text-[10px] text-[#FF8246] truncate">TEDxAkure 2026 Showcase</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenPortfolio();
            }}
            className="w-full py-2 px-3 bg-[#FF4D00]/20 hover:bg-[#FF4D00]/30 text-[#FF8246] border border-[#FF4D00]/40 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Show QR to Connect</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'home'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'home' ? 'fill-1' : ''}`}>
              home
            </span>
            <span>Home</span>
          </button>

          <button
            onClick={() => handleTabClick('people')}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'people'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-lg ${currentTab === 'people' ? 'fill-1' : ''}`}>
                group
              </span>
              <span>People & CRM</span>
            </div>
            {overdueCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#370e00] text-[#ffb59a] border border-[#FF5C00]/40 font-bold">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('capture')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'capture'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'capture' ? 'fill-1' : ''}`}>
              add_a_photo
            </span>
            <span>Capture Hub</span>
          </button>

          <button
            onClick={() => handleTabClick('moments')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'moments'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'moments' ? 'fill-1' : ''}`}>
              auto_awesome
            </span>
            <span>Moments Timeline</span>
          </button>

          <button
            onClick={() => handleTabClick('ideas')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'ideas'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'ideas' ? 'fill-1' : ''}`}>
              lightbulb
            </span>
            <span>Talk Insights</span>
          </button>

          <button
            onClick={() => handleTabClick('followups')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'followups'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'followups' ? 'fill-1' : ''}`}>
              schedule
            </span>
            <span>Follow-ups Tracker</span>
          </button>

          <button
            onClick={() => handleTabClick('recap')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'recap'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'recap' ? 'fill-1' : ''}`}>
              local_fire_department
            </span>
            <span>Milestones & Recap</span>
          </button>

          <button
            onClick={() => handleTabClick('export')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'export'
                ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${currentTab === 'export' ? 'fill-1' : ''}`}>
              ios_share
            </span>
            <span>Export & PDF</span>
          </button>

          {/* Quick utility controls */}
          <div className="pt-3.5 mt-2 border-t border-white/10 space-y-1.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenTrashModal();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Demo Data & Trash</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenSecurity();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-amber-300 hover:bg-amber-950/20 transition-colors text-left"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Access & PIN Lock</span>
            </button>
          </div>
        </nav>

        {/* User Badge Profile info */}
        <div className="pt-3.5 border-t border-white/10 mt-auto">
          <div
            onClick={() => {
              triggerHaptic('light');
              if (onOpenProfile) onOpenProfile();
              else onSelectTab('recap');
            }}
            className="flex items-center gap-3 cursor-pointer p-2.5 rounded-2xl hover:bg-white/5 transition-colors group"
            title="Edit My Profile & Picture"
          >
            <div className="w-10 h-10 rounded-full border-2 border-[#FF4D00]/50 group-hover:border-[#FF5C00] overflow-hidden bg-[#1A1A1A] transition-colors relative flex-shrink-0">
              <img
                alt={profile.name}
                className="w-full h-full object-cover"
                src={profile.avatarUrl}
              />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-[#fadcd2] truncate group-hover:text-white transition-colors">{profile.name}</p>
              <p className="text-[10px] text-[#e4beb1]/60 truncate font-mono">{profile.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
