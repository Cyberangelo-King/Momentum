import React, { useState, useEffect, useMemo } from 'react';
import { 
  Connection, 
  Moment, 
  Idea, 
  EventSession, 
  UserProfile, 
  SecuritySettings, 
  Note, 
  EventConfig, 
  EventTemplatePreset,
  TrialQuotaMetrics
} from './types';
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
  loadEvents,
  saveEvents,
  loadActiveEventId,
  saveActiveEventId,
  createEventFromPreset,
  duplicateEvent,
  deleteEvent
} from './services/storage';
import { 
  loadSecuritySettings, 
  saveSecuritySettings, 
  setAppLockState, 
  getVerifiedOwnerSession, 
  subscribeToAuthChanges, 
  logoutOwner 
} from './services/authService';
import { getStoredTheme, applyThemeToDOM } from './services/themeService';
import { 
  isTrialActive, 
  getTrialSession, 
  getTrialMetrics, 
  checkTrialGuardrail, 
  recordBandwidthUsage, 
  endTrialSession 
} from './services/trialService';
import { calculateGamification } from './services/gamification';
import { syncManager } from './services/syncManager';
import { triggerHaptic } from './services/haptics';
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
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { TrialManagerModal } from './components/TrialManagerModal';
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
  Globe,
  Palette,
  Sparkles
} from 'lucide-react';

/**
 * Parses deep links or bookmarks from window.location pathname, query or hash
 */
const getTabFromUrl = (): NavTab => {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (path === 'people' || path === 'connections') return 'people';
  if (path === 'capture') return 'capture';
  if (path === 'moments') return 'moments';
  if (path === 'ideas' || path === 'insights') return 'ideas';
  if (path === 'followups' || path === 'follow-ups') return 'followups';
  if (path === 'recap' || path === 'summary') return 'recap';
  if (path === 'export' || path === 'exports') return 'export';
  if (path === 'more') return 'more';

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab')?.toLowerCase();
  if (['home', 'people', 'capture', 'moments', 'ideas', 'followups', 'recap', 'export', 'more'].includes(tabParam || '')) {
    return tabParam as NavTab;
  }

  const hash = window.location.hash.toLowerCase().replace(/^[#/]+/, '');
  if (['home', 'people', 'capture', 'moments', 'ideas', 'followups', 'recap', 'export', 'more'].includes(hash)) {
    return hash as NavTab;
  }

  return 'home';
};

export const App: React.FC = () => {
  // Theme initialization on boot
  useEffect(() => {
    const stored = getStoredTheme();
    applyThemeToDOM(stored);
  }, []);

  // Primary Supabase Authentication & Single-Owner / 1-Day Trial Gatekeeper
  type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'unauthorized' | 'trial';
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

  // 1-Day Trial and Theme Modals State
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState<boolean>(false);
  const [trialToastMessage, setTrialToastMessage] = useState<string | null>(null);

  const trialMetrics = useMemo(() => {
    return getTrialMetrics(connections, moments, ideas, notes);
  }, [connections, moments, ideas, notes]);

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
          if (isTrialActive()) {
            setAuthState('trial');
          } else {
            setAuthState('unauthorized');
            setUnauthorizedEmail(user?.email || null);
          }
        } else {
          if (isTrialActive()) {
            setAuthState('trial');
          } else {
            setAuthState('unauthenticated');
          }
        }
      } catch (err) {
        if (!isMounted) return;
        if (isTrialActive()) {
          setAuthState('trial');
        } else {
          setAuthState('unauthenticated');
        }
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
          if (isTrialActive()) {
            setAuthState('trial');
          } else {
            setAuthState('unauthorized');
            setUnauthorizedEmail(session.user?.email || null);
          }
        } else {
          if (isTrialActive()) {
            setAuthState('trial');
          } else {
            setAuthState('unauthenticated');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isTrialActive()) {
          setAuthState('trial');
        } else {
          setAuthState('unauthenticated');
          setUnauthorizedEmail(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isTrialActive()) {
      endTrialSession();
      setAuthState('unauthenticated');
      setIsConfirmLogoutOpen(false);
      triggerHaptic('medium');
      return;
    }
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
  const [events, setEvents] = useState<EventConfig[]>(loadEvents);
  const [activeEventId, setActiveEventId] = useState<string>(loadActiveEventId);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0];
  }, [events, activeEventId]);

  const handleSelectEvent = (event: EventConfig) => {
    setActiveEventId(event.id);
    saveActiveEventId(event.id);
  };

  const handleCreateFromPreset = (preset: EventTemplatePreset, overrides?: Partial<EventConfig>) => {
    const newEvent = createEventFromPreset(preset, overrides);
    const updated = [newEvent, ...events];
    setEvents(updated);
    saveEvents(updated);
    setActiveEventId(newEvent.id);
    saveActiveEventId(newEvent.id);
  };

  const handleCreateCustomEvent = (eventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: EventConfig = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    saveEvents(updated);
    setActiveEventId(newEvent.id);
    saveActiveEventId(newEvent.id);
  };

  const handleUpdateEvent = (updated: EventConfig) => {
    const updatedList = events.map((e) => (e.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : e));
    setEvents(updatedList);
    saveEvents(updatedList);
  };

  const handleDeleteEvent = (eventId: string) => {
    const result = deleteEvent(eventId);
    setEvents(result.updatedEvents);
    setActiveEventId(result.newActiveEvent.id);
  };

  const handleDuplicateEvent = (eventId: string) => {
    const duplicated = duplicateEvent(eventId);
    setEvents(loadEvents());
    setActiveEventId(duplicated.id);
  };

  const [isUltraPowerSaver, setIsUltraPowerSaver] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Sync Manager Subscription
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
      if (state.lastSyncedAt && !state.isSyncing && !state.error) {
        setShowSyncSuccessToast(true);
        setTimeout(() => setShowSyncSuccessToast(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncManager.flushQueue().catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save connections to storage
  useEffect(() => {
    saveConnections(connections);
  }, [connections]);

  // Auto-save moments to storage
  useEffect(() => {
    saveMoments(moments);
  }, [moments]);

  // Auto-save ideas to storage
  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

  // Auto-save notes to storage
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // URL Tab state listener for Browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL query/history when active tab changes
  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  const activeConnections = useMemo(() => {
    return connections.filter((c) => !c.inTrash);
  }, [connections]);

  const activeMoments = useMemo(() => {
    return moments.filter((m) => !m.inTrash);
  }, [moments]);

  const activeIdeas = useMemo(() => {
    return ideas.filter((i) => !i.inTrash);
  }, [ideas]);

  const gamificationStats = useMemo(() => {
    return calculateGamification(activeConnections, activeMoments, activeIdeas, profile.targetConnections);
  }, [activeConnections, activeMoments, activeIdeas, profile.targetConnections]);

  const handleToggleUltraPowerSaver = () => {
    setIsUltraPowerSaver(!isUltraPowerSaver);
  };

  const handleReloadFromStorage = () => {
    setConnections(loadConnections());
    setMoments(loadMoments());
    setIdeas(loadIdeas());
    setNotes(loadNotes());
    setProfile(loadProfile());
  };

  const handleLockApp = () => {
    setAppLockState(true);
    setIsLocked(true);
    setSecurity((prev) => ({ ...prev, isLocked: true }));
  };

  const handleUnlockApp = () => {
    setIsLocked(false);
    setSecurity((prev) => ({ ...prev, isLocked: false }));
  };

  // Guardrail helper for 1-Day Trial guest protection
  const verifyTrialAllowance = (
    action: 'connection' | 'moment' | 'idea' | 'note' | 'photo' | 'bandwidth',
    sizeBytes = 1000
  ): boolean => {
    if (!trialMetrics.isTrial) return true;

    const guard = checkTrialGuardrail(action, trialMetrics, sizeBytes);
    if (!guard.allowed) {
      triggerHaptic('error');
      setTrialToastMessage(guard.reason || '1-Day Trial limit reached.');
      setIsTrialModalOpen(true);
      return false;
    }
    return true;
  };

  // Handlers with Trial Guardrails
  const handleSaveConnection = (newConn: Connection) => {
    if (!verifyTrialAllowance('connection', 500)) return;

    recordBandwidthUsage(350);
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
    recordBandwidthUsage(200);
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
    if (!verifyTrialAllowance('note', 1200)) return;

    recordBandwidthUsage(400);
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline
      ? { ...newNote, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() }
      : newNote;
    setNotes((prev) => [itemToSave, ...prev]);
  };

  const handleUpdateNote = (updated: Note) => {
    recordBandwidthUsage(250);
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
    const photoSizeEstimate = newMoment.mediaUrl ? 15000 : 1000;
    if (!verifyTrialAllowance('moment', photoSizeEstimate)) return;

    recordBandwidthUsage(photoSizeEstimate);
    const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    const itemToSave = isCurrentlyOffline 
      ? { ...newMoment, isOfflineCaptured: true, savedOfflineAt: new Date().toISOString() } 
      : newMoment;
    setMoments((prev) => [itemToSave, ...prev]);
  };

  const handleAddIdea = (newIdea: Idea) => {
    if (!verifyTrialAllowance('idea', 600)) return;

    recordBandwidthUsage(300);
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
    recordBandwidthUsage(150);
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

  // Supabase Auth & Trial Gatekeeper
  if (authState === 'loading') {
    return <AuthLoadingSplash />;
  }

  if (authState === 'unauthorized' && !isTrialActive()) {
    return (
      <AccessDeniedView
        unauthorizedEmail={unauthorizedEmail}
        onReturnToLogin={() => setAuthState('unauthenticated')}
        onStartGuestTrial={() => {
          setAuthState('trial');
        }}
      />
    );
  }

  if (authState === 'unauthenticated' && !isTrialActive()) {
    return (
      <LoginView
        onLoginSuccess={() => setAuthState('authenticated')}
        onStartGuestTrial={() => {
          setAuthState('trial');
        }}
        unauthorizedAttemptEmail={unauthorizedEmail}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col md:flex-row antialiased selection:bg-[var(--accent-primary)] selection:text-black ${isUltraPowerSaver ? 'ultra-power-saver' : ''}`}>
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
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        trialMetrics={trialMetrics}
        onOpenTrialModal={() => setIsTrialModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        security={security}
        onLockNow={handleLockApp}
        onLogout={() => setIsConfirmLogoutOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 md:ml-64 px-4 sm:px-8 pt-20 md:pt-8 max-w-5xl mx-auto w-full min-h-screen flex flex-col">
        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="mb-4 p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>
                <strong>Offline Mode Active:</strong> All changes, snaps & notes saved locally in protected memory.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400">Zero Latency</span>
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
              <h1 className="text-2xl font-bold font-serif-display text-white">
                Event OS Features
              </h1>
              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Attendee Pass</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Theme & Palette Switcher */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsThemeModalOpen(true);
                }}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] flex items-center justify-between text-left transition-colors group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Theme & Color Palette</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold">
                        Cool & Modern
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Cyber Cobalt, Nordic Emerald, Royal Iris, Sunset</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
              </button>

              {/* 1-Day Trial Manager */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsTrialModalOpen(true);
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-colors group shadow-md ${
                  trialMetrics.isTrial 
                    ? 'bg-sky-950/40 border-sky-500/40 hover:bg-sky-950/60' 
                    : 'bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform ${
                    trialMetrics.isTrial ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10 text-white/70'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {trialMetrics.isTrial ? '1-Day Guest Pass (Active)' : '1-Day Guest Trial Sandbox'}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        trialMetrics.isTrial ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/10 text-white/60'
                      }`}>
                        {trialMetrics.isTrial ? trialMetrics.remainingTimeFormatted : 'Safe Limits'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {trialMetrics.isTrial 
                        ? `${trialMetrics.storagePercent}% Storage used · ${trialMetrics.bandwidthPercent}% Bandwidth` 
                        : 'Allow multiple guests to test Momentum for 24h safely'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
              </button>

              {/* Event Hub & Switcher */}
              <button
                onClick={() => setIsEventHubOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Event Hub & Switcher</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold">
                        {activeEvent?.name || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Manage multiple conferences, hackathons & summits</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
              </button>

              {/* AI Suite Entries */}
              <button
                onClick={() => setIsConstellationOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Constellation Radar & Matchmaker</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                        AI Match
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Visual network gravity & automated introductions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400" />
              </button>

              <button
                onClick={() => setIsPitchSimulatorOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
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
                    <p className="text-xs text-[var(--text-secondary)]">Simulate 30s elevator pitches against Tier-1 VC personas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </button>

              <button
                onClick={() => setIsDigitalBadgeOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">3D Pass & NFC Bump Studio</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        NFC Ready
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Interactive tilt pass, instant vCard download & NFC wave</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400" />
              </button>

              <button
                onClick={() => setIsLiveCopilotOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
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
                    <p className="text-xs text-[var(--text-secondary)]">WiFi cheatsheets, stage timers, & contextual icebreakers</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>

              <button
                onClick={() => setIsEventAnalyticsOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Executive ROI & Scorecard</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                        AI Analytics
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Quantify pipeline velocity, relationship equity & outcomes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-teal-400" />
              </button>

              <button
                onClick={() => setIsContingencyOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Event Contingency & Health Hub</h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Protected
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Zero-Wi-Fi safe, 1-click backups & power saver</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[var(--accent-primary)] overflow-hidden bg-black flex-shrink-0">
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Edit My Profile & Photo</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Change picture, headline, and bio</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsGamificationOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {gamificationStats.levelBadge}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Badges & Achievements</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Level {gamificationStats.level} • {gamificationStats.totalXp} XP</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsPortfolioOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Attendee Portfolio QR Code</h3>
                    <p className="text-xs text-sky-300 font-mono">Instant digital card exchange</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsTrashModalOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Demo Data & Clean Slate</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Wipe demo records or move to trash</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsSecurityOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Privacy & Passcode Lock</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Restrict workspace with PIN & Biometrics</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('ideas')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Talk Insights & Quotes</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Captured theses and speaker notes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('followups')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Follow-ups Tracker</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Overdue, today, and upcoming messages</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('recap')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Milestones & AI Recap</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Goal celebration and LinkedIn post</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setCurrentTab('export')}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Export CSV, JSON & PDF</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Download complete conference memory</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsCollageOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Photo Collage Generator</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Social media multi-photo creator</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button
                onClick={() => setIsConfirmLogoutOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-rose-950/20 border border-[var(--border-subtle)] hover:border-rose-500/40 flex items-center justify-between text-left transition-colors mt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {trialMetrics.isTrial ? 'Exit 1-Day Guest Trial' : 'Sign Out of Momentum'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {trialMetrics.isTrial ? 'End your 24-hour guest session' : 'Terminate active Supabase session'}
                    </p>
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

      {/* Post-Event Reflection Modal (REFLECT Stage) */}
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

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* 1-Day Trial Manager & Quota Protection Modal */}
      <TrialManagerModal
        isOpen={isTrialModalOpen}
        onClose={() => {
          setIsTrialModalOpen(false);
          setTrialToastMessage(null);
        }}
        metrics={trialMetrics}
        connections={connections}
        moments={moments}
        ideas={ideas}
        notes={notes}
        profile={profile}
        onEndTrial={() => {
          endTrialSession();
          setAuthState('unauthenticated');
          setIsTrialModalOpen(false);
        }}
      />

      {/* Persistent Non-Intrusive Syncing & Status Indicator */}
      <AnimatePresence>
        {syncState.isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-40 px-4 py-2 rounded-full bg-[var(--bg-surface-card)]/90 backdrop-blur-md border border-[var(--border-subtle)] shadow-2xl text-[var(--text-primary)] text-xs font-semibold flex items-center gap-2.5 select-none pointer-events-none"
          >
            <div className="w-3.5 h-3.5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
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
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-40 px-4 py-2 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 shadow-2xl text-emerald-200 text-xs font-semibold flex items-center gap-2 select-none pointer-events-none"
          >
            <span className="text-emerald-400 font-bold text-sm leading-none">✓</span>
            <span>Synced to Supabase</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      {isConfirmLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white font-serif-display">
                {trialMetrics.isTrial ? 'Exit 1-Day Guest Trial?' : 'Sign Out of Momentum?'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {trialMetrics.isTrial
                  ? 'Your guest session will be concluded. You can download all your leads & notes first if you wish.'
                  : 'This will end your active Supabase session on this device. You will need your master credentials to sign back in.'}
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
                <span>{trialMetrics.isTrial ? 'Exit Trial' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
