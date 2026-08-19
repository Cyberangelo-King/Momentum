import React, { useState, useEffect } from 'react';
import { Connection, Moment, Idea, EventSession, UserProfile } from './types';
import {
  loadConnections,
  saveConnections,
  loadMoments,
  saveMoments,
  loadIdeas,
  saveIdeas,
  loadSessions,
  loadProfile,
  resetConferenceData,
} from './services/storage';

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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [connections, setConnections] = useState<Connection[]>(loadConnections);
  const [moments, setMoments] = useState<Moment[]>(loadMoments);
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas);
  const [sessions] = useState<EventSession[]>(loadSessions);
  const [profile] = useState<UserProfile>(loadProfile);

  // Modals state
  const [isQuickConnectOpen, setIsQuickConnectOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [quickMessageConnection, setQuickMessageConnection] = useState<Connection | null>(null);
  const [isCollageOpen, setIsCollageOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Keyboard Shortcuts (Ctrl/Cmd + K = Search, Ctrl/Cmd + N = Quick Connect)
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const overdueCount = connections.filter(
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
      />

      {/* Main Content Viewport */}
      <main className="flex-1 md:ml-64 px-4 sm:px-8 pt-20 md:pt-8 max-w-5xl mx-auto w-full min-h-screen flex flex-col">
        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="mb-4 p-2.5 bg-[#28130a] border border-[#FF5C00]/40 rounded-xl text-xs text-[#ffb59a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#FF5C00]">cloud_off</span>
              <span>
                <strong>Offline Mode Active:</strong> All changes, snaps & notes saved locally.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#FF5C00]">Zero Latency</span>
          </div>
        )}

        {/* Tab Router */}
        {currentTab === 'home' && (
          <DashboardView
            connections={connections}
            moments={moments}
            ideas={ideas}
            sessions={sessions}
            profile={profile}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenCapture={() => setCurrentTab('capture')}
            onOpenAddIdea={() => setCurrentTab('ideas')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'people' && (
          <PeopleView
            connections={connections}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
            targetCount={profile.targetConnections}
          />
        )}

        {currentTab === 'capture' && (
          <CaptureHubView
            moments={moments}
            ideas={ideas}
            connections={connections}
            onAddMoment={handleAddMoment}
            onAddIdea={handleAddIdea}
          />
        )}

        {currentTab === 'moments' && (
          <MomentsView
            moments={moments}
            connections={connections}
            onOpenCapture={() => setCurrentTab('capture')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onAddMoment={handleAddMoment}
          />
        )}

        {currentTab === 'ideas' && (
          <IdeasView ideas={ideas} onAddIdea={handleAddIdea} />
        )}

        {currentTab === 'followups' && (
          <FollowUpsView
            connections={connections}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
            onUpdateConnection={handleUpdateConnection}
          />
        )}

        {currentTab === 'recap' && (
          <RecapView
            connections={connections}
            moments={moments}
            ideas={ideas}
            profile={profile}
            onOpenExports={() => setCurrentTab('export')}
            onOpenCollage={() => setIsCollageOpen(true)}
          />
        )}

        {currentTab === 'export' && (
          <ExportsView
            connections={connections}
            moments={moments}
            ideas={ideas}
            profile={profile}
            onOpenCollage={() => setIsCollageOpen(true)}
            onResetData={handleResetData}
          />
        )}

        {currentTab === 'more' && (
          <div className="space-y-6 max-w-lg mx-auto pb-24">
            <h1 className="text-2xl font-bold font-serif-display text-[#fadcd2]">
              Event OS Features
            </h1>

            <div className="space-y-2">
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

      {/* Quick Connect Modal */}
      <QuickConnectModal
        isOpen={isQuickConnectOpen}
        onClose={() => setIsQuickConnectOpen(false)}
        onSaveConnection={handleSaveConnection}
        existingCount={connections.length}
      />

      {/* Connection Detail Modal */}
      <ConnectionDetailModal
        connection={selectedConnection}
        onClose={() => setSelectedConnection(null)}
        onUpdateConnection={handleUpdateConnection}
        onDeleteConnection={handleDeleteConnection}
        relatedMoments={
          selectedConnection
            ? moments.filter((m) => m.taggedPeopleIds?.includes(selectedConnection.id))
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
        moments={moments}
        ideas={ideas}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        connections={connections}
        moments={moments}
        ideas={ideas}
        onSelectConnection={(c) => setSelectedConnection(c)}
        onSelectMoment={() => setCurrentTab('moments')}
        onSelectIdea={() => setCurrentTab('ideas')}
      />
    </div>
  );
};

export default App;
