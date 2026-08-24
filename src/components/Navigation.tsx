import React from 'react';
import { UserProfile, Connection, Moment, Idea, SecuritySettings, Note, EventConfig } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';
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
  Layers
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
  security,
  onLockNow,
  onOpenProfile,
  onLogout,
}) => {
  const handleTabClick = (tab: NavTab) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  const primaryBrandColor = activeEvent?.branding?.primaryColor || '#FF5C00';

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 flex justify-between items-center w-full px-3.5 h-16 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSearch();
            }}
            aria-label="Search"
            className="text-[#ffb59a] hover:text-[#FF5C00] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-neutral-900/80 border border-neutral-800 active:scale-95"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 border border-white/10 text-left max-w-[150px] active:scale-95 transition-all"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: primaryBrandColor }}
              />
              <span className="text-xs font-bold text-white truncate">
                {activeEvent.name}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>
          ) : (
            <span
              onClick={() => handleTabClick('home')}
              className="font-serif-display text-lg font-bold text-[#ffb59a] tracking-tight cursor-pointer"
            >
              Momentum
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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
            className="min-w-[38px] min-h-[38px] rounded-xl bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF6B26] border border-[#FF4D00]/30 transition-colors flex items-center justify-center active:scale-95"
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
              className="min-w-[38px] min-h-[38px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 transition-colors flex items-center justify-center active:scale-95"
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
            className="min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Edit My Profile & Picture"
          >
            <div
              className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 overflow-hidden flex-shrink-0"
              style={{ borderColor: primaryBrandColor }}
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
      <nav className="md:hidden bg-[#0A0A0A]/98 backdrop-blur-lg border-t border-white/10 fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 pb-safe px-3">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'home' ? 'font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
          style={{ color: currentTab === 'home' ? primaryBrandColor : undefined }}
        >
          <Home className={`w-5 h-5 transition-transform ${currentTab === 'home' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('people')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] relative ${
            currentTab === 'people' || currentTab === 'followups'
              ? 'font-bold'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
          style={{ color: currentTab === 'people' || currentTab === 'followups' ? primaryBrandColor : undefined }}
        >
          <Users className={`w-5 h-5 transition-transform ${currentTab === 'people' || currentTab === 'followups' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">People</span>
          {overdueCount > 0 && (
            <span
              className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: primaryBrandColor }}
            />
          )}
        </button>

        <button
          onClick={() => handleTabClick('capture')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'capture' ? 'font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
          style={{ color: currentTab === 'capture' ? primaryBrandColor : undefined }}
        >
          <Camera className={`w-5 h-5 transition-transform ${currentTab === 'capture' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Capture</span>
        </button>

        <button
          onClick={() => handleTabClick('moments')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'moments' ? 'font-bold' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
          style={{ color: currentTab === 'moments' ? primaryBrandColor : undefined }}
        >
          <Sparkles className={`w-5 h-5 transition-transform ${currentTab === 'moments' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">Moments</span>
        </button>

        <button
          onClick={() => handleTabClick('more')}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 min-h-[48px] min-w-[52px] ${
            currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
              ? 'font-bold'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
          style={{ color: currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export' ? primaryBrandColor : undefined }}
        >
          <MoreHorizontal className={`w-5 h-5 transition-transform ${currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export' ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium mt-1">More</span>
        </button>
      </nav>

      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#140b07] border-r border-white/10 p-5 z-40 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              onClick={() => handleTabClick('home')}
              className="font-serif-display text-2xl font-bold text-[#ffb59a] tracking-tight cursor-pointer hover:text-white transition-colors"
            >
              Momentum
            </h1>
            <p className="text-[10px] text-[#e4beb1]/60 tracking-wider uppercase font-semibold">
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

        {/* ACTIVE EVENT SWITCHER WIDGET */}
        {activeEvent && onOpenEventHub && (
          <div
            onClick={() => {
              triggerHaptic('selection');
              onOpenEventHub();
            }}
            className="mb-4 p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-md"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${primaryBrandColor}25`,
                  color: primaryBrandColor,
                }}
              >
                {activeEvent.eventType}
              </span>
              <span className="text-[10px] text-neutral-400 group-hover:text-white flex items-center gap-1 font-semibold transition-colors">
                Switch
                <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </div>
            <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ffb59a] transition-colors">
              {activeEvent.name}
            </h3>
            <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
              {activeEvent.location || 'Global'} • Goal: {activeEvent.targetConnections}
            </p>
          </div>
        )}

        {/* Angelo Portfolio Showcase Banner */}
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-[#1E110A] to-[#2C140A] border border-[#FF4D00]/30 shadow-lg shadow-black/40">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF4D00] flex items-center justify-center text-white shrink-0">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Angelo's Portfolio</p>
              <p className="text-[10px] text-[#FF8246] truncate">Speaker & Founder QR</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenPortfolio();
            }}
            className="w-full py-1.5 px-3 bg-[#FF4D00]/20 hover:bg-[#FF4D00]/30 text-[#FF8246] border border-[#FF4D00]/40 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <QrCode className="w-3 h-3" />
            <span>Show QR to Connect</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'home'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'home' ? primaryBrandColor : undefined,
            }}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleTabClick('people')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'people'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'people' ? primaryBrandColor : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>People & CRM</span>
            </div>
            {overdueCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#370e00] text-[#ffb59a] border border-[#FF5C00]/40 font-bold">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('notes')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'notes'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'notes' ? primaryBrandColor : undefined,
            }}
          >
            <FileText className="w-4 h-4" />
            <span>Smart Notes & Q&A</span>
          </button>

          <button
            onClick={() => handleTabClick('capture')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'capture'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'capture' ? primaryBrandColor : undefined,
            }}
          >
            <Camera className="w-4 h-4" />
            <span>Capture Hub</span>
          </button>

          <button
            onClick={() => handleTabClick('moments')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'moments'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'moments' ? primaryBrandColor : undefined,
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Moments Timeline</span>
          </button>

          <button
            onClick={() => handleTabClick('ideas')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'ideas'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'ideas' ? primaryBrandColor : undefined,
            }}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Talk Insights</span>
          </button>

          <button
            onClick={() => handleTabClick('followups')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'followups'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'followups' ? primaryBrandColor : undefined,
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Follow-ups Tracker</span>
          </button>

          <button
            onClick={() => handleTabClick('recap')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'recap'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'recap' ? primaryBrandColor : undefined,
            }}
          >
            <Flame className="w-4 h-4" />
            <span>Milestones & Recap</span>
          </button>

          <button
            onClick={() => handleTabClick('export')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              currentTab === 'export'
                ? 'text-black font-bold shadow-md'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
            style={{
              backgroundColor: currentTab === 'export' ? primaryBrandColor : undefined,
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export & PDF</span>
          </button>

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
          <div className="pt-2.5 mt-1 border-t border-white/10 space-y-1">
            {onOpenContingencyHub && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenContingencyHub();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#FF5C00] hover:bg-[#FF5C00]/10 transition-colors text-left"
              >
                <ShieldAlert className="w-4 h-4 text-[#FF5C00]" />
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
        <div className="pt-3 border-t border-white/10 mt-auto space-y-2">
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
              className="w-9 h-9 rounded-full border-2 group-hover:border-[#FF5C00] overflow-hidden bg-[#1A1A1A] transition-colors relative flex-shrink-0"
              style={{ borderColor: `${primaryBrandColor}80` }}
            >
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

          {onLogout && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onLogout();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
              title="Sign out of Supabase workspace"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </span>
              <span className="text-[10px] font-mono text-white/30">Owner Session</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

