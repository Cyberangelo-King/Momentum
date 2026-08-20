import { Connection, Moment, Idea, EventSession, UserProfile } from '../types';
import { initialConnections, initialMoments, initialIdeas, initialSessions, initialProfile } from '../data/mockData';
import { syncManager } from './syncManager';
import { multiDeviceSync } from './multiDeviceSync';

const STORAGE_KEYS = {
  CONNECTIONS: 'momentum_connections_v1',
  MOMENTS: 'momentum_moments_v1',
  IDEAS: 'momentum_ideas_v1',
  SESSIONS: 'momentum_sessions_v1',
  PROFILE: 'momentum_profile_v1',
};

// Resilient storage setter to handle QuotaExceededError or private browsing edge cases
function safeStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`Storage Contingency: Error setting ${key}, attempting space recovery`, err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      try {
        // Attempt recovery: Clear temporary keys / prune old logs
        const tempKeys = Object.keys(localStorage).filter(
          (k) => k.startsWith('temp_') || k.startsWith('cache_')
        );
        tempKeys.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error('Storage Contingency: Storage critical quota limit reached', retryErr);
      }
    }
    return false;
  }
}

// Tag initial mock data with isDemo: true so user can distinguish demo data vs their live event data
const taggedMockConnections: Connection[] = initialConnections.map((c) => ({ ...c, isDemo: true }));
const taggedMockMoments: Moment[] = initialMoments.map((m) => ({ ...m, isDemo: true }));
const taggedMockIdeas: Idea[] = initialIdeas.map((i) => ({ ...i, isDemo: true }));

export function loadConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load connections from storage', e);
  }
  return taggedMockConnections;
}

export function saveConnections(connections: Connection[]): void {
  try {
    safeStorageSet(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    // Trigger queue sync via syncManager
    syncManager.flushQueue().catch(() => {});
    // Trigger multi-device real-time sync broadcast
    multiDeviceSync.pushState({ connections }).catch(() => {});
  } catch (e) {
    console.warn('Failed to save connections to storage', e);
  }
}

export function loadMoments(): Moment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load moments from storage', e);
  }
  return taggedMockMoments;
}

export function saveMoments(moments: Moment[]): void {
  try {
    safeStorageSet(STORAGE_KEYS.MOMENTS, JSON.stringify(moments));
    syncManager.flushQueue().catch(() => {});
    multiDeviceSync.pushState({ moments }).catch(() => {});
  } catch (e) {
    console.warn('Failed to save moments to storage', e);
  }
}

export function loadIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IDEAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load ideas from storage', e);
  }
  return taggedMockIdeas;
}

export function saveIdeas(ideas: Idea[]): void {
  try {
    safeStorageSet(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
    syncManager.flushQueue().catch(() => {});
    multiDeviceSync.pushState({ ideas }).catch(() => {});
  } catch (e) {
    console.warn('Failed to save ideas to storage', e);
  }
}

export function loadSessions(): EventSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load sessions from storage', e);
  }
  return initialSessions;
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load profile from storage', e);
  }
  return initialProfile;
}

export function saveProfile(profile: UserProfile): void {
  try {
    safeStorageSet(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    multiDeviceSync.pushState({ profile }).catch(() => {});
  } catch (e) {
    console.warn('Failed to save profile to storage', e);
  }
}

/**
 * Move all demo data items into trash so Angelo can restore them or empty trash completely
 */
export function sendDemoDataToTrash(): {
  connectionsCount: number;
  momentsCount: number;
  ideasCount: number;
} {
  const connections = loadConnections();
  const moments = loadMoments();
  const ideas = loadIdeas();

  let cCount = 0;
  let mCount = 0;
  let iCount = 0;

  const updatedConnections = connections.map((c) => {
    if (c.isDemo) {
      cCount++;
      return { ...c, inTrash: true, deletedAt: new Date().toISOString() };
    }
    return c;
  });

  const updatedMoments = moments.map((m) => {
    if (m.isDemo) {
      mCount++;
      return { ...m, inTrash: true, deletedAt: new Date().toISOString() };
    }
    return m;
  });

  const updatedIdeas = ideas.map((i) => {
    if (i.isDemo) {
      iCount++;
      return { ...i, inTrash: true, deletedAt: new Date().toISOString() };
    }
    return i;
  });

  saveConnections(updatedConnections);
  saveMoments(updatedMoments);
  saveIdeas(updatedIdeas);

  return { connectionsCount: cCount, momentsCount: mCount, ideasCount: iCount };
}

/**
 * Permanently deletes all demo data from local and cloud storage
 */
export function permanentlyDeleteDemoData(): {
  deletedConnections: number;
  deletedMoments: number;
  deletedIdeas: number;
} {
  const connections = loadConnections().filter((c) => !c.isDemo);
  const moments = loadMoments().filter((m) => !m.isDemo);
  const ideas = loadIdeas().filter((i) => !i.isDemo);

  saveConnections(connections);
  saveMoments(moments);
  saveIdeas(ideas);

  return {
    deletedConnections: initialConnections.length,
    deletedMoments: initialMoments.length,
    deletedIdeas: initialIdeas.length,
  };
}

/**
 * Restore all demo data from trash back to active view
 */
export function restoreAllDemoData(): void {
  const connections = loadConnections().map((c) => (c.isDemo ? { ...c, inTrash: false, deletedAt: undefined } : c));
  const moments = loadMoments().map((m) => (m.isDemo ? { ...m, inTrash: false, deletedAt: undefined } : m));
  const ideas = loadIdeas().map((i) => (i.isDemo ? { ...i, inTrash: false, deletedAt: undefined } : i));

  saveConnections(connections);
  saveMoments(moments);
  saveIdeas(ideas);
}

/**
 * Safely and permanently deletes a moment by ID:
 * 1. Removes the moment from local storage
 * 2. Unlinks the moment from any connections (prunes relatedMomentIds)
 * 3. Enqueues a permanent deletion action in the sync manager for cloud synchronization
 */
export function permanentlyDeleteMoment(momentId: string): {
  updatedMoments: Moment[];
  updatedConnections: Connection[];
} {
  const currentMoments = loadMoments();
  const currentConnections = loadConnections();

  const updatedMoments = currentMoments.filter((m) => m.id !== momentId);
  const updatedConnections = currentConnections.map((c) => {
    if (c.relatedMomentIds && c.relatedMomentIds.includes(momentId)) {
      return {
        ...c,
        relatedMomentIds: c.relatedMomentIds.filter((id) => id !== momentId),
      };
    }
    return c;
  });

  saveMoments(updatedMoments);
  saveConnections(updatedConnections);

  // Safely queue the delete command so it persists offline and clears Supabase upon reconnect
  syncManager.enqueue('moment', 'delete', { id: momentId });

  return { updatedMoments, updatedConnections };
}

/**
 * Safely and permanently deletes a connection by ID:
 * 1. Removes the connection from local storage
 * 2. Unlinks the connection from any moments (prunes taggedPeopleIds)
 * 3. Enqueues a permanent deletion action in the sync manager
 */
export function permanentlyDeleteConnection(connectionId: string): {
  updatedConnections: Connection[];
  updatedMoments: Moment[];
} {
  const currentConnections = loadConnections();
  const currentMoments = loadMoments();

  const updatedConnections = currentConnections.filter((c) => c.id !== connectionId);
  const updatedMoments = currentMoments.map((m) => {
    if (m.taggedPeopleIds && m.taggedPeopleIds.includes(connectionId)) {
      return {
        ...m,
        taggedPeopleIds: m.taggedPeopleIds.filter((id) => id !== connectionId),
        taggedPeopleNames: m.taggedPeopleNames ? m.taggedPeopleNames.filter((name) => name !== updatedConnections.find((c) => c.id === connectionId)?.name) : undefined,
      };
    }
    return m;
  });

  saveConnections(updatedConnections);
  saveMoments(updatedMoments);

  syncManager.enqueue('connection', 'delete', { id: connectionId });

  return { updatedConnections, updatedMoments };
}

/**
 * Safely and permanently deletes an idea by ID
 */
export function permanentlyDeleteIdea(ideaId: string): {
  updatedIdeas: Idea[];
} {
  const currentIdeas = loadIdeas();
  const updatedIdeas = currentIdeas.filter((i) => i.id !== ideaId);

  saveIdeas(updatedIdeas);
  syncManager.enqueue('idea', 'delete', { id: ideaId });

  return { updatedIdeas };
}

// Reset data back to initial TEDxAkure 2026 conference state
export function resetConferenceData(): void {
  localStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
  localStorage.removeItem(STORAGE_KEYS.MOMENTS);
  localStorage.removeItem(STORAGE_KEYS.IDEAS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}
