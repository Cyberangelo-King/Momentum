import React, { useState, useEffect, useMemo } from 'react';
import { Connection, Moment, Idea, EventSession, UserProfile, SecuritySettings, Note, EventConfig, EventTemplatePreset } from './types';
import {
  loadConnections,
  saveConnections,
  loadMoments,
  saveMoments,
  loadIdeas,
  saveIdeas,
  loadNotes,
  saveNotes,
  loadSessions,
  loadProfile,
  saveProfile,
  resetConferenceData,
  sendDemoDataToTrash,
  permanentlyDeleteMoment,
  permanentlyDeleteConnection,
  permanentlyDeleteIdea,
  permanentlyDeleteNote,
  loadEventsCatalog,
  saveEventsCatalog,
  loadActiveEventId,
  saveActiveEventId,
  loadActiveEventConfig,
  createEventFromPreset,
} from './services/storage';
import { loadSecuritySettings, saveSecuritySettings, setAppLockState, getVerifiedOwnerSession, subscribeToAuthChanges, logoutOwner } from './services/authService';
import { calculateGamification } from './services/gamification';
import { syncManager } from './services/syncManager';
import { motion, AnimatePresence } from 'motion/react';

import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { PeopleView } from './components/PeopleView';
import { CaptureHubView } from './components/CaptureHubView';
import { MomentsView } from './components/MomentsView';
import { IdeasView } from './components/IdeasView';
import { FollowUpsView } from './components/FollowUpsView';
import { RecapView } from './components/RecapView';
import { ExportsView } from './components/ExportsView';
import { SmartNotesView } from './components/SmartNotesView';
import { LoginView } from './components/LoginView';
import { AccessDeniedView } from './components/AccessDeniedView';
import { AuthLoadingSplash } from './components/AuthLoadingSplash';

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
import { ContingencyHubModal } from './components/ContingencyHubModal';
import { SessionDossierModal } from './components/SessionDossierModal';
import { PostEventReflectionModal } from './components/PostEventReflectionModal';
import { EventHubModal } from './components/EventHubModal';
import { ConstellationGraphModal } from './components/ConstellationGraphModal';
import { PitchSimulatorModal } from './components/PitchSimulatorModal';
import { DigitalBadgeModal } from './components/DigitalBadgeModal';
import { LiveCopilotModal } from './components/LiveCopilotModal';
import { EventAnalyticsModal } from './components/EventAnalyticsModal';
import { InstantCaptureBar } from './components/InstantCaptureBar';
import { createEmergencySnapshot } from './services/contingencyService';
import { 
  ShieldCheck, 
  ChevronRight, 
  QrCode, 
  Trash2, 
  Lock, 
  Lightbulb, 
  Clock, 
  Flame, 
  Download, 
  LayoutGrid, 
  WifiOff,
  LogOut,
  Globe
} from 'lucide-react';

/**
 * Parses deep links or bookmarks from window.location pathname, query or hash
 */
const getTabFromUrl = (): NavTab => {
  if (typeof window === 'undefined') return 'home';

  // Normalize pathname, stripping leading and trailing slashes
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (path === 'people' || path === 'connections') return 'people';
  if (path === 'capture') return 'capture';
  if (path === 'moments') return 'moments';
  if (path === 'ideas' || path === 'insights') return 'ideas';
  if (path === 'followups' || path === 'follow-ups') return 'followups';
  if (path === 'recap' || path === 'summary') return 'recap';
  if (path === 'export' || path === 'exports') return 'export';
  if (path === 'more') return 'more';

  // Check query parameter (?tab=ideas or ?tab=followups)
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab')?.toLowerCase();
  if (['home', 'people', 'capture', 'moments', 'ideas', 'followups', 'recap', 'export', 'more'].includes(tabParam || '')) {
    return tabParam as NavTab;
  }

  // Check hash fragment (#ideas or #/ideas)
  const hash = window.location.hash.toLowerCase().replace(/^[#/]+/, '');
  if (['home', 'people', 'capture', 'moments', 'ideas', 'followups', 'recap', 'export', 'more'].includes(hash)) {
    return hash as NavTab;
  }

  return 'home';
};

export const App: React.FC = () => {
  // Primary Supabase Authentication & Single-Owner Gatekeeper
  type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'unauthorized';
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<NavTab>(getTabFromUrl);
  const [connections, setConnections] = useState<Connection[]>(loadConnections);
  const [moments, setMoments] = useState<Moment[]>(loadMoments);
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [sessions] = useState<EventSession[]>(loadSessions);
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [security, setSecurity] = useState<SecuritySettings>(loadSecuritySettings);
  const [isLocked, setIsLocked] = useState<boolean>(security.isLocked);

  // Sync state tracking from SyncManager
  const [syncState, setSyncState] = useState(syncManager.getState());
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);

  // Supabase Auth session initial check and persistent listener
  useEffect(() => {
    let isMounted = true;

    async function checkInitialSession() {
      try {
        const { session, user, isOwner } = await getVerifiedOwnerSession();
        if (!isMounted) return;

        if (session && isOwner) {
          setAuthState('authenticated');
          setUnauthorizedEmail(null);
        } else if (session && !isOwner) {
          setAuthState('unauthorized');
          setUnauthorizedEmail(user?.email || null);
        } else {
          setAuthState('unauthenticated');
        }
      } catch (err) {
        if (!isMounted) return;
        setAuthState('unauthenticated');
      }
    }

    checkInitialSession();

    const unsubscribe = subscribeToAuthChanges((event, session, isOwner) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session && isOwner) {
          setAuthState('authenticated');
          setUnauthorizedEmail(null);
        } else if (session && !isOwner) {
          setAuthState('unauthorized');
          setUnauthorizedEmail(session.user?.email || null);
        } else {
          setAuthState('unauthenticated');
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
        setUnauthorizedEmail(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutOwner();
    setAuthState('unauthenticated');
    setIsConfirmLogoutOpen(false);
  };

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
  const [isContingencyOpen, setIsContingencyOpen] = useState(false);
  const [sessionDossierSession, setSessionDossierSession] = useState<EventSession | null>(null);
  const [isPostEventReviewOpen, setIsPostEventReviewOpen] = useState(false);
  const [isEventHubOpen, setIsEventHubOpen] = useState(false);
  const [isConstellationOpen, setIsConstellationOpen] = useState(false);
  const [isPitchSimulatorOpen, setIsPitchSimulatorOpen] = useState(false);
  const [isDigitalBadgeOpen, setIsDigitalBadgeOpen] = useState(false);
  const [isLiveCopilotOpen, setIsLiveCopilotOpen] = useState(false);
  const [isEventAnalyticsOpen, setIsEventAnalyticsOpen] = useState(false);

  // Multi-Event Management System
  const [events, setEvents] = useState<EventConfig[]>(loadEventsCatalog);
  const [activeEventId, setActiveEventId] = useState<string>(loadActiveEventId);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || loadActiveEventConfig();
  }, [events, activeEventId]);

  useEffect(() => {
    saveEventsCatalog(events);
  }, [events]);

  useEffect(() => {
    saveActiveEventId(activeEventId);
  }, [activeEventId]);

  const handleSelectEvent = (event: EventConfig) => {
    setActiveEventId(event.id);
    saveActiveEventId(event.id);
    setIsEventHubOpen(false);
  };

  const handleCreateFromPreset = (preset: EventTemplatePreset, overrides?: Partial<EventConfig>) => {
    const newEvent = createEventFromPreset(preset, overrides);
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    saveActiveEventId(newEvent.id);
    setIsEventHubOpen(false);
  };

  const handleCreateCustomEvent = (eventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: EventConfig = {
      ...eventData,
      id: `event-custom-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    saveActiveEventId(newEvent.id);
    setIsEventHubOpen(false);
  };

  const handleDuplicateEvent = (eventId: string) => {
    const source = events.find((e) => e.id === eventId);
    if (!source) return;
    const duplicated: EventConfig = {
      ...source,
      id: `event-copy-${Date.now().toString(36)}`,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEvents((prev) => [duplicated, ...prev]);
  };

  const handleUpdateEvent = (updated: EventConfig) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => {
      const nextEvents = prev.filter((e) => e.id !== eventId);
      if (activeEventId === eventId) {
        const nextActive = nextEvents[0]?.id || 'event_tedx_akure_2026';
        setActiveEventId(nextActive);
        saveActiveEventId(nextActive);
      }
      return nextEvents;
    });
  };

  const [isUltraPowerSaver, setIsUltraPowerSaver] = useState<boolean>(() => {
    try {
      return localStorage.getItem('momentum_ultra_power_saver') === 'true';
    } catch {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Power saver mode persistence
  const handleToggleUltraPowerSaver = (enabled: boolean) => {
    setIsUltraPowerSaver(enabled);
    try {
      localStorage.setItem('momentum_ultra_power_saver', enabled ? 'true' : 'false');
    } catch {}
  };

  // Reload all storage state when restoring a contingency snapshot
  const handleReloadFromStorage = () => {
    setConnections(loadConnections());
    setMoments(loadMoments());
    setIdeas(loadIdeas());
    setNotes(loadNotes());
    setProfile(loadProfile());
    setEvents(loadEventsCatalog());
    setActiveEventId(loadActiveEventId());
  };

  // Automated 15-minute emergency snapshot timer
  useEffect(() => {
    // Take initial snapshot on boot after 5 seconds
    const initialTimer = setTimeout(() => {
      createEmergencySnapshot();
    }, 5000);

    // Then schedule recurring auto-snapshot every 15 minutes
    const interval = setInterval(() => {
      createEmergencySnapshot();
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Navigation tab handler that updates URL path history
  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'home' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  // Browser back/forward button popstate listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Subscribe to SyncManager state updates (offline-first push to Supabase)
  useEffect(() => {
    let prevIsSyncing = false;
    const unsubscribe = syncManager.subscribe((state) => {
      if (prevIsSyncing && !state.isSyncing && !state.error) {
        setShowSyncSuccessToast(true);
        setTimeout(() => setShowSyncSuccessToast(false), 3000);
      }
      prevIsSyncing = state.isSyncing;
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

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
    saveNotes(notes);
  }, [notes]);

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
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline 
      ? { ...newConn, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() } 
      : newConn;
    setConnections((prev) => [itemToSave, ...prev]);
  };

  const handleTrashConnection = (connection: Connection) => {
    const trashed = { ...connection, inTrash: true, deletedAt: new Date().toISOString() };
    setConnections((prev) => prev.map((c) => (c.id === connection.id ? trashed : c)));
  };

  const handleRestoreConnection = (connectionId: string) => {
    setConnections((prev) => prev.map((c) => (c.id === connectionId ? { ...c, inTrash: false, deletedAt: undefined } : c)));
  };

  const handleUpdateConnection = (updated: Connection) => {
    setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedConnection && selectedConnection.id === updated.id) {
      setSelectedConnection(updated);
    }
  };

  const handleDeleteConnection = (id: string) => {
    const { updatedConnections, updatedMoments } = permanentlyDeleteConnection(id);
    setConnections(updatedConnections);
    setMoments(updatedMoments);
  };

  const handleDeleteMoment = (id: string) => {
    const { updatedMoments, updatedConnections } = permanentlyDeleteMoment(id);
    setMoments(updatedMoments);
    setConnections(updatedConnections);
  };

  const handleDeleteIdea = (id: string) => {
    const { updatedIdeas } = permanentlyDeleteIdea(id);
    setIdeas(updatedIdeas);
  };

  const handleSaveNote = (newNote: Note) => {
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline
      ? { ...newNote, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() }
      : newNote;
    setNotes((prev) => [itemToSave, ...prev]);
  };

  const handleUpdateNote = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = (id: string) => {
    const { updatedNotes } = permanentlyDeleteNote(id);
    setNotes(updatedNotes);
  };

  const handleTrashNote = (note: Note) => {
    const trashed = { ...note, inTrash: true, deletedAt: new Date().toISOString() };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? trashed : n)));
  };

  const handleRestoreNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, inTrash: false, deletedAt: undefined } : n))
    );
  };

  const handleAddMoment = (newMoment: Moment) => {
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline 
      ? { ...newMoment, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() } 
      : newMoment;
    setMoments((prev) => [itemToSave, ...prev]);
  };

  const handleAddIdea = (newIdea: Idea) => {
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline 
      ? { ...newIdea, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() } 
      : newIdea;
    setIdeas((prev) => [itemToSave, ...prev]);
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
    setNotes(loadNotes());
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
    setNotes(loadNotes());
  };

  const handleDataRefresh = (newConn: Connection[], newMoments: Moment[], newIdeas: Idea[], newNotes?: Note[]) => {
    setConnections(newConn);
    setMoments(newMoments);
    setIdeas(newIdeas);
    if (newNotes) setNotes(newNotes);
  };

  const overdueCount = activeConnections.filter(
    (c) => c.followUpStatus === 'overdue' || c.followUpStatus === 'today'
  ).length;

  // Supabase Auth Gatekeeper: Restrict entire UI to verified single owner
  if (authState === 'loading') {
    return <AuthLoadingSplash />;
  }

  if (authState === 'unauthorized') {
    return (
      <AccessDeniedView
        unauthorizedEmail={unauthorizedEmail}
        onReturnToLogin={() => setAuthState('unauthenticated')}
      />
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <LoginView
        onLoginSuccess={() => setAuthState('authenticated')}
        unauthorizedAttemptEmail={unauthorizedEmail}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#0A0A0A] text-[#fadcd2] flex flex-col md:flex-row antialiased selection:bg-[#FF5C00] selection:text-black ${isUltraPowerSaver ? 'ultra-power-saver' : ''}`}>
      {/* Navigation Layout */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        profile={profile}
        activeEvent={activeEvent}
        onOpenEventHub={() => setIsEventHubOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
        overdueCount={overdueCount}
        connections={activeConnections}
        moments={activeMoments}
        ideas={activeIdeas}
        notes={notes.filter((n) => !n.inTrash)}
        onOpenPortfolio={() => setIsPortfolioOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenTrashModal={() => setIsTrashModalOpen(true)}
        onOpenContingencyHub={() => setIsContingencyOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        security={security}
        onLockNow={handleLockApp}
        onLogout={() => setIsConfirmLogoutOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 md:ml-64 px-4 sm:px-8 pt-20 md:pt-8 max-w-5xl mx-auto w-full min-h-screen flex flex-col">
        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="mb-4 p-2.5 bg-[#28130a] border border-[#FF5C00]/40 rounded-xl text-xs text-[#ffb59a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#FF5C00]" />
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
            sessions={activeEvent?.sessions?.length ? activeEvent.sessions : sessions}
            profile={profile}
            activeEvent={activeEvent}
            onOpenEventHub={() => setIsEventHubOpen(true)}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenCapture={() => handleSelectTab('capture')}
            onOpenAddIdea={() => handleSelectTab('ideas')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onSelectTab={handleSelectTab}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenGamification={() => setIsGamificationOpen(true)}
            onOpenContingency={() => setIsContingencyOpen(true)}
            onOpenSessionDossier={(s) => setSessionDossierSession(s)}
            onOpenPostEventReview={() => setIsPostEventReviewOpen(true)}
            onOpenConstellation={() => setIsConstellationOpen(true)}
            onOpenPitchSimulator={() => setIsPitchSimulatorOpen(true)}
            onOpenDigitalBadge={() => setIsDigitalBadgeOpen(true)}
            onOpenLiveCopilot={() => setIsLiveCopilotOpen(true)}
            onOpenEventAnalytics={() => setIsEventAnalyticsOpen(true)}
          />
        )}

        {currentTab === 'people' && (
          <PeopleView
            connections={activeConnections}
            activeEvent={activeEvent}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
            onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
            targetCount={activeEvent?.targetConnections || profile.targetConnections}
            onClearDemoData={handleClearDemoData}
            onTrashConnection={handleTrashConnection}
            onRestoreConnection={handleRestoreConnection}
            onUpdateConnection={handleUpdateConnection}
          />
        )}

        {currentTab === 'capture' && (
          <CaptureHubView
            moments={activeMoments}
            ideas={activeIdeas}
            connections={activeConnections}
            activeEvent={activeEvent}
            onAddMoment={handleAddMoment}
            onAddIdea={handleAddIdea}
          />
        )}

        {currentTab === 'notes' && (
          <SmartNotesView
            notes={notes.filter((n) => !n.inTrash)}
            sessions={activeEvent?.sessions?.length ? activeEvent.sessions : sessions}
            connections={activeConnections}
            activeEvent={activeEvent}
            onSaveNote={handleSaveNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onTrashNote={handleTrashNote}
            onRestoreNote={handleRestoreNote}
            onOpenSpeakerDossier={(s) => setSessionDossierSession(s)}
          />
        )}

        {currentTab === 'moments' && (
          <MomentsView
            moments={activeMoments}
            connections={activeConnections}
            onOpenCapture={() => handleSelectTab('capture')}
            onSelectConnection={(c) => setSelectedConnection(c)}
            onAddMoment={handleAddMoment}
            onDeleteMoment={handleDeleteMoment}
          />
        )}

        {currentTab === 'ideas' && (
          <IdeasView
            ideas={activeIdeas}
            onAddIdea={handleAddIdea}
            onDeleteIdea={handleDeleteIdea}
          />
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
            onOpenExports={() => handleSelectTab('export')}
            onOpenCollage={() => setIsCollageOpen(true)}
            onOpenPostEventReview={() => setIsPostEventReviewOpen(true)}
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
                onClick={() => setIsEventHubOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#2a1307] to-[#1a0a03] hover:from-[#3d1808] hover:to-[#250d03] border border-[#FF5C00]/50 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Event Hub & Switcher</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] font-bold">
                        {activeEvent?.name || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Manage multiple conferences, hackathons & summits</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#FF5C00]/60 group-hover:text-[#FF5C00] transition-colors" />
              </button>

              {/* 1,000,000x AI Suite & Toolkit Entries */}
              <button
                onClick={() => setIsConstellationOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#241006] to-[#140803] hover:from-[#351608] hover:to-[#200c05] border border-[#FF5C00]/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Constellation Radar & Matchmaker</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] font-bold">
                        AI Match
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Visual network gravity & automated warm introductions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#FF5C00]" />
              </button>

              <button
                onClick={() => setIsPitchSimulatorOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#241006] to-[#140803] hover:from-[#351608] hover:to-[#200c05] border border-amber-500/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">AI Pitch Arena & Charisma Coach</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                        Sparring
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Simulate 30s elevator pitches against Tier-1 VC & tech personas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </button>

              <button
                onClick={() => setIsDigitalBadgeOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#241006] to-[#140803] hover:from-[#351608] hover:to-[#200c05] border border-emerald-500/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">3D Holographic Pass & NFC Studio</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        NFC Ready
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Interactive tilt lanyard, instant vCard download & NFC wave</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400" />
              </button>

              <button
                onClick={() => setIsLiveCopilotOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#241006] to-[#140803] hover:from-[#351608] hover:to-[#200c05] border border-purple-500/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <LayoutGrid className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Live Event Copilot & Venue Survival</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                        Real-Time HUD
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">WiFi cheatsheets, stage timers, & contextual hallway icebreakers</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>

              <button
                onClick={() => setIsEventAnalyticsOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#241006] to-[#140803] hover:from-[#351608] hover:to-[#200c05] border border-[#FF5C00]/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Executive ROI & Relationship Scorecard</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] font-bold">
                        AI Analytics
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Quantify pipeline velocity, relationship equity & investor readiness</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#FF5C00]" />
              </button>

              <button
                onClick={() => setIsContingencyOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#2c1206] to-[#1c0a04] hover:from-[#3a1808] hover:to-[#2c1206] border border-[#FF5C00]/40 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Event Contingency & Health Hub</h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold">
                        Protected
                      </span>
                    </div>
                    <p className="text-xs text-[#ffb59a]/70">Zero-Wi-Fi safe, 1-click backups & power saver</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

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
                <ChevronRight className="w-5 h-5 text-white/40" />
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
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#221008] to-[#170a04] hover:from-[#2e150b] hover:to-[#221008] border border-[#FF4D00]/30 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Angelo's Portfolio QR Code</h3>
                    <p className="text-xs text-[#FF8246]/80 font-mono">angelo-tedxakure-portfolio.netlify.app</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsTrashModalOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Demo Data & Clean Slate</h3>
                    <p className="text-xs text-[#e4beb1]/60">Wipe demo records or move to trash</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsSecurityOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Privacy & Passcode Lock</h3>
                    <p className="text-xs text-[#e4beb1]/60">Restrict workspace to Angelo (faithakinboyejo@gmail.com)</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('ideas')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Talk Insights & Quotes</h3>
                    <p className="text-xs text-[#e4beb1]/60">Captured theses and speaker notes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('followups')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Follow-ups Tracker</h3>
                    <p className="text-xs text-[#e4beb1]/60">Overdue, today, and upcoming messages</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('recap')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Milestones & AI Recap</h3>
                    <p className="text-xs text-[#e4beb1]/60">50-Goal celebration and LinkedIn post</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('export')}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Export CSV, JSON & PDF</h3>
                    <p className="text-xs text-[#e4beb1]/60">Download complete conference memory</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsCollageOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-[#20100a] border border-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#ffb59a] flex items-center justify-center flex-shrink-0">
                    <LayoutGrid className="w-5 h-5 text-[#ffb59a]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Photo Collage Generator</h3>
                    <p className="text-xs text-[#e4beb1]/60">Social media multi-photo creator</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsConfirmLogoutOpen(true)}
                className="w-full p-4 rounded-2xl bg-[#140b07] hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/40 flex items-center justify-between text-left transition-colors mt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fadcd2]">Sign Out of Momentum</h3>
                    <p className="text-xs text-[#e4beb1]/60">Terminate active Supabase session</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
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
        onLogout={() => setIsConfirmLogoutOpen(true)}
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

      {/* Universal Multi-Event Hub Modal */}
      <EventHubModal
        isOpen={isEventHubOpen}
        onClose={() => setIsEventHubOpen(false)}
        activeEvent={activeEvent}
        events={events}
        onSelectEvent={handleSelectEvent}
        onCreateFromPreset={handleCreateFromPreset}
        onCreateCustomEvent={handleCreateCustomEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onDuplicateEvent={handleDuplicateEvent}
      />

      {/* Quick Connect Modal */}
      <QuickConnectModal
        isOpen={isQuickConnectOpen}
        onClose={() => setIsQuickConnectOpen(false)}
        onSaveConnection={handleSaveConnection}
        existingCount={activeConnections.length}
        activeEvent={activeEvent}
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
        onSelectMoment={() => handleSelectTab('moments')}
        onSelectIdea={() => handleSelectTab('ideas')}
      />

      {/* Contingency, Backup & Health Hub Modal */}
      <ContingencyHubModal
        isOpen={isContingencyOpen}
        onClose={() => setIsContingencyOpen(false)}
        connections={activeConnections}
        isUltraPowerSaver={isUltraPowerSaver}
        onToggleUltraPowerSaver={handleToggleUltraPowerSaver}
        onReloadData={handleReloadFromStorage}
      />

      {/* Speaker Dossier Modal (BEFORE Stage) */}
      <SessionDossierModal
        session={sessionDossierSession}
        isOpen={sessionDossierSession !== null}
        onClose={() => setSessionDossierSession(null)}
        onOpenLiveCapture={(session) => {
          setSessionDossierSession(null);
          handleSelectTab('notes');
        }}
      />

      {/* Post-Event 5-Pillar Reflection Modal (REFLECT Stage) */}
      <PostEventReflectionModal
        isOpen={isPostEventReviewOpen}
        onClose={() => setIsPostEventReviewOpen(false)}
        connections={connections}
        moments={moments}
        ideas={ideas}
        notes={notes}
        sessions={sessions}
        profile={profile}
        onOpenQuickMessage={(c) => {
          setIsPostEventReviewOpen(false);
          setQuickMessageConnection(c);
        }}
      />

      {/* Constellation Radar & AI Matchmaker Modal */}
      <ConstellationGraphModal
        isOpen={isConstellationOpen}
        onClose={() => setIsConstellationOpen(false)}
        connections={activeConnections}
        profile={profile}
        onSelectConnection={(c) => setSelectedConnection(c)}
        onOpenQuickMessage={(c) => setQuickMessageConnection(c)}
      />

      {/* AI Pitch Arena & Charisma Coach Modal */}
      <PitchSimulatorModal
        isOpen={isPitchSimulatorOpen}
        onClose={() => setIsPitchSimulatorOpen(false)}
        profile={profile}
        activeEvent={activeEvent}
      />

      {/* 3D Holographic Pass & NFC Modal */}
      <DigitalBadgeModal
        isOpen={isDigitalBadgeOpen}
        onClose={() => setIsDigitalBadgeOpen(false)}
        profile={profile}
        activeEvent={activeEvent}
      />

      {/* Live Event Copilot HUD Modal */}
      <LiveCopilotModal
        isOpen={isLiveCopilotOpen}
        onClose={() => setIsLiveCopilotOpen(false)}
        activeEvent={activeEvent}
        connections={activeConnections}
        onOpenQuickConnect={() => setIsQuickConnectOpen(true)}
      />

      {/* Executive ROI Scorecard Modal */}
      <EventAnalyticsModal
        isOpen={isEventAnalyticsOpen}
        onClose={() => setIsEventAnalyticsOpen(false)}
        connections={activeConnections}
        moments={activeMoments}
        ideas={activeIdeas}
        notes={notes}
        profile={profile}
        activeEvent={activeEvent}
      />

      {/* Persistent Non-Intrusive Syncing & Status Indicator */}
      <AnimatePresence>
        {syncState.isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-40 px-4 py-2 rounded-full bg-[#180b06]/90 backdrop-blur-md border border-[#FF5C00]/50 shadow-2xl text-[#fadcd2] text-xs font-semibold flex items-center gap-2.5 select-none pointer-events-none"
          >
            <div className="w-3.5 h-3.5 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>
              Syncing {syncState.pendingCount > 0 ? `(${syncState.pendingCount} pending)` : ''} to Supabase...
            </span>
          </motion.div>
        )}

        {!syncState.isSyncing && showSyncSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-40 px-4 py-2 rounded-full bg-[#0d2112]/90 backdrop-blur-md border border-[#25D366]/40 shadow-2xl text-[#c4f8d4] text-xs font-semibold flex items-center gap-2 select-none pointer-events-none"
          >
            <span className="text-[#25D366] font-bold text-sm leading-none">✓</span>
            <span>Synced to Supabase</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Logout Confirmation Modal */}
      {isConfirmLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#120906] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white font-serif-display">Sign Out of Momentum?</h3>
              <p className="text-xs text-[#e4beb1]/70 leading-relaxed">
                This will end your active Supabase session on this device. You will need to enter your password to sign back in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmLogoutOpen(false)}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-2xl transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl transition-colors shadow-lg shadow-rose-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
