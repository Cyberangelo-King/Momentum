import React, { useState, useEffect } from 'react';
import { Connection, Moment, Idea, EventSession, UserProfile, SecuritySettings } from './types';
import {
  loadConnections,
  saveConnections,
  loadMoments,
  saveMoments,
  loadIdeas,
  saveIdeas,
  loadSessions,
  loadProfile,
  saveProfile,
  resetConferenceData,
  sendDemoDataToTrash,
} from './services/storage';
import { loadSecuritySettings, saveSecuritySettings, setAppLockState } from './services/authService';
import { calculateGamification } from './services/gamification';

import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { PeopleView } from './components/PeopleView';
import { CaptureHubView } from './components/CaptureHubView';
import { MomentsView } from './components/MomentsView';
import { IdeasView } from './components/IdeasView';
import { FollowUpsView } from './components/FollowUpsView';
import { RecapView } from './components/RecapView';
import { ExportsView } from './components/ExportsView';

import { QuickConnectModal } from './components/QuickConnectModal';
import { ConnectionDetailModal } from './components/ConnectionDetailModal';
import { QuickMessageModal } from './components/QuickMessageModal';
import { CollageGeneratorModal } from './components/CollageGeneratorModal';
import { SearchModal } from './components/SearchModal';
import { PortfolioModal } from './components/PortfolioModal';
import { SecurityLockModal } from './components/SecurityLockModal';
import { LockScreenOverlay } from './components/LockScreenOverlay';
import { TrashAndDemoModal } from './components/TrashAndDemoModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { GamificationModal } from './components/GamificationModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [connections, setConnections] = useState<Connection[]>(loadConnections);
  const [moments, setMoments] = useState<Moment[]>(loadMoments);
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas);
  const [sessions] = useState<EventSession[]>(loadSessions);
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [security, setSecurity] = useState<SecuritySettings>(loadSecuritySettings);
  const [isLocked, setIsLocked] = useState<boolean>(security.isLocked);

  // Modals state
  const [isQuickConnectOpen, setIsQuickConnectOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [quickMessageConnection, setQuickMessageConnection] = useState<Connection | null>(null);
  const [isCollageOpen, setIsCollageOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Filter out trashed items from active tab views
  const activeConnections = connections.filter((c) => !c.inTrash);
  const activeMoments = moments.filter((m) => !m.inTrash);
  const activeIdeas = ideas.filter((i) => !i.inTrash);

  // Calculate real-time gamification stats
  const gamificationStats = calculateGamification(
    activeConnections,
    activeMoments,
    activeIdeas,
    profile.targetConnections || 50
  );

  // Sync to local storage
  useEffect(() => {
    saveConnections(connections);
  }, [connections]);

  useEffect(() => {
    saveMoments(moments);
  }, [moments]);

  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard Shortcuts (Ctrl/Cmd + K = Search, Ctrl/Cmd + N = Quick Connect, Ctrl/Cmd + P = Portfolio QR, Ctrl/Cmd + L = Lock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsQuickConnectOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsPortfolioOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l' && security.isLockEnabled) {
        e.preventDefault();
        handleLockApp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [security.isLockEnabled]);

  // Lock App
  const handleLockApp = () => {
    setAppLockState(true);
    setIsLocked(true);
    setSecurity((prev) => ({ ...prev, isLocked: true }));
  };

  const handleUnlockApp = () => {
    setIsLocked(false);
    setSecurity((prev) => ({ ...prev, isLocked: false }));
  };

  // Handlers
  const handleSaveConnection = (newConn: Connection) => {
    setConnections((prev) => [newConn, ...prev]);
  };

  const handleUpdateConnection = (updated: Connection) => {
    setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedConnection && selectedConnection.id === updated.id) {
      setSelectedConnection(updated);
    }
  };

  const handleDeleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddMoment = (newMoment: Moment) => {
    setMoments((prev) => [newMoment, ...prev]);
  };

  const handleAddIdea = (newIdea: Idea) => {
    setIdeas((prev) => [newIdea, ...prev]);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  const handleClearDemoData = () => {
    sendDemoDataToTrash();
    setConnections(loadConnections());
    setMoments(loadMoments());
    setIdeas(loadIdeas());
  };

  const handleMarkFollowUpComplete = (connectionId: string, message: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? {
              ...c,
              followUpStatus: 'completed',
              lastFollowUpMessage: message,
            }
          : c
      )
    );
  };

  const handleResetData = () => {
    resetConferenceData();
    setConnections(loadConnections());
    setMoments(loadMoments());
    setIdeas(loadIdeas());
  };

  const handleDataRefresh = (newConn: Connection[], newMoments: Moment[], newIdeas: Idea[]) => {
    setConnections(newConn);
    setMoments(newMoments);
    setIdeas(newIdeas);
  };

  const overdueCount = activeConnections.filter(
    (c) => c.followUpStatus === 'overdue' || c.followUpStatus === 'today'
  ).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#fadcd2] flex flex-col md:flex-row antialiased selection:bg-[#FF5C00] selection:text-black">
      {/* Navigation Layout */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
        overdueCount={overdueCount}
        connections={activeConnections}
        moments={activeMoments}
        ideas={activeIdeas}
        onOpenPortfolio={() => setIsPortfolioOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenTrashModal={() => setIsTrashModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        security={security}
        onLockNow={handleLockApp}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 md:ml-64 px-4 sm:px-8 pt-20 md:pt-8 max-w-5xl mx-auto w-full min-h-screen flex flex-col">
        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="mb-4 p-2.5 bg-[#28130a] border border-[#FF5C00]/40 rounded-xl text-xs text-[#ffb59a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#FF5C00]">cloud_off</span>
              <span>
                <strong>Offline Mode Active:</strong> All changes, snaps & notes saved locally and will sync when reconnected.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#FF5C00]">Zero Latency</span>
          </div>
        )}

        {/* Tab Router */}
        {currentTab === 'home' && (
          <DashboardView
            connections={activeConnections}
            moments={activeMoments}
            ideas={activeIdeas}
            sessions={sessions}
            profile={profile}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenCapture={() => setCurrentTab('capture')}
            onOpenAddIdea={() => setCurrentTab('ideas')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onSelectTab={setCurrentTab}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenGamification={() => setIsGamificationOpen(true)}
          />
        )}

        {currentTab === 'people' && (
          <PeopleView
            connections={activeConnections}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
            targetCount={profile.targetConnections}
            onClearDemoData={handleClearDemoData}
          />
        )}

        {currentTab === 'capture' && (
          <CaptureHubView
            moments={activeMoments}
            ideas={activeIdeas}
            connections={activeConnections}
            onAddMoment={handleAddMoment}
            onAddIdea={handleAddIdea}
          />
        )}

        {currentTab === 'moments' && (
          <MomentsView
            moments={activeMoments}
            connections={activeConnections}
            onOpenCapture={() => setCurrentTab('capture')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onAddMoment={handleAddMoment}
          />
        )}

        {currentTab === 'ideas' && (
          <IdeasView ideas={activeIdeas} onAddIdea={handleAddIdea} />
        )}

        {currentTab === 'followups' && (
          <FollowUpsView
            connections={activeConnections}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
            onUpdateConnection={handleUpdateConnection}
          />
        )}

        {currentTab === 'recap' && (
          <RecapView
            connections={activeConnections}
            moments={activeMoments}
            ideas={activeIdeas}
            profile={profile}
            onOpenExports={() => setCurrentTab('export')}
            onOpenCollage={() => setIsCollageOpen(true)}
          />
        )}

        {currentTab === 'export' && (
          <ExportsView
            connections={activeConnections}
            moments={activeMoments}
            ideas={activeIdeas}
            profile={profile}
            onOpenCollage={() => setIsCollageOpen(true)}
            onResetData={handleResetData}
          />
        )}

        {currentTab === 'more' && (
          <div className="space-y-6 max-w-lg mx-auto pb-24">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold font-serif-display text-[#fadcd2]">
                Event OS Features
              </h1>
              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4D00]/20 hover:bg-[#FF4D00]/30 text-[#FF8246] border border-[#FF4D00]/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Angelo's QR</span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#FF5C00]/40 overflow-hidden bg-black flex-shrink-0">
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Edit My Profile & Photo</h3>
                    <p className="text-xs text-[#e4beb1]/60">Change picture, headline, and bio</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setIsGamificationOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {gamificationStats.levelBadge}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Badges & Achievements</h3>
                    <p className="text-xs text-[#e4beb1]/60">Level {gamificationStats.level} • {gamificationStats.totalXp} XP</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#221008] to-[#170a04] hover:from-[#2e150b] hover:to-[#221008] border border-[#FF4D00]/30 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#FF5C00]">qr_code_2</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Angelo's Portfolio QR Code</h3>
                    <p className="text-xs text-[#FF8246]/80 font-mono">angelo-tedxakure-portfolio.netlify.app</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setIsTrashModalOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-rose-400">delete_sweep</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Demo Data & Clean Slate</h3>
                    <p className="text-xs text-[#e4beb1]/60">Wipe demo records or move to trash</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setIsSecurityOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-amber-400">lock</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Privacy & Passcode Lock</h3>
                    <p className="text-xs text-[#e4beb1]/60">Restrict workspace to Angelo (faithakinboyejo@gmail.com)</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setCurrentTab('ideas')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#FF5C00]">lightbulb</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Talk Insights & Quotes</h3>
                    <p className="text-xs text-[#e4beb1]/60">Captured theses and speaker notes</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setCurrentTab('followups')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#FF5C00]">schedule</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Follow-ups Tracker</h3>
                    <p className="text-xs text-[#e4beb1]/60">Overdue, today, and upcoming messages</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setCurrentTab('recap')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#FF5C00]">
                    local_fire_department
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Milestones & AI Recap</h3>
                    <p className="text-xs text-[#e4beb1]/60">50-Goal celebration and LinkedIn post</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setCurrentTab('export')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#FF5C00]">ios_share</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Export CSV, JSON & PDF</h3>
                    <p className="text-xs text-[#e4beb1]/60">Download complete conference memory</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              <button
                onClick={() => setIsCollageOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#ffb59a]">grid_view</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Photo Collage Generator</h3>
                    <p className="text-xs text-[#e4beb1]/60">Social media multi-photo creator</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      {/* Gamification Modal */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        stats={gamificationStats}
      />

      {/* Angelo Portfolio QR Code Modal */}
      <PortfolioModal
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        profile={profile}
      />

      {/* Security Settings & PIN Modal */}
      <SecurityLockModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        security={security}
        onSecurityUpdate={(updated) => setSecurity(updated)}
        profile={profile}
      />

      {/* Full Screen Workspace Lock Overlay */}
      <LockScreenOverlay
        isLocked={isLocked}
        security={security}
        profile={profile}
        onUnlock={handleUnlockApp}
      />

      {/* Clean Slate & Demo Data Modal */}
      <TrashAndDemoModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        connections={connections}
        moments={moments}
        ideas={ideas}
        onDataRefresh={handleDataRefresh}
      />

      {/* Quick Connect Modal */}
      <QuickConnectModal
        isOpen={isQuickConnectOpen}
        onClose={() => setIsQuickConnectOpen(false)}
        onSaveConnection={handleSaveConnection}
        existingCount={activeConnections.length}
      />

      {/* Connection Detail Modal */}
      <ConnectionDetailModal
        connection={selectedConnection}
        onClose={() => setSelectedConnection(null)}
        onUpdateConnection={handleUpdateConnection}
        onDeleteConnection={handleDeleteConnection}
        relatedMoments={
          selectedConnection
            ? activeMoments.filter((m) => m.taggedPeopleIds?.includes(selectedConnection.id))
            : []
        }
        onOpenQuickMessage={(c) => {
          setSelectedConnection(null);
          setQuickMessageConnection(c);
        }}
      />

      {/* AI Quick Message Modal */}
      <QuickMessageModal
        connection={quickMessageConnection}
        isOpen={quickMessageConnection !== null}
        onClose={() => setQuickMessageConnection(null)}
        onMarkFollowUpComplete={handleMarkFollowUpComplete}
      />

      {/* Collage Generator Modal */}
      <CollageGeneratorModal
        isOpen={isCollageOpen}
        onClose={() => setIsCollageOpen(false)}
        moments={activeMoments}
        ideas={activeIdeas}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        connections={activeConnections}
        moments={activeMoments}
        ideas={activeIdeas}
        onSelectConnection={(c) => setSelectedConnection(c)}
        onSelectMoment={() => setCurrentTab('moments')}
        onSelectIdea={() => setCurrentTab('ideas')}
      />
    </div>
  );
};

export default App;
