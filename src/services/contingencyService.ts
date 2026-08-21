import { Connection, Moment, Idea, UserProfile, Note } from '../types';
import { loadConnections, loadMoments, loadIdeas, loadProfile, loadNotes } from './storage';

export interface StorageSnapshot {
  id: string;
  timestamp: string;
  createdAt: number;
  connectionsCount: number;
  momentsCount: number;
  ideasCount: number;
  notesCount?: number;
  data: {
    connections: Connection[];
    moments: Moment[];
    ideas: Idea[];
    notes?: Note[];
    profile: UserProfile;
  };
}

const SNAPSHOTS_KEY = 'momentum_auto_snapshots_v1';
const MAX_SNAPSHOTS = 5;

/**
 * Creates an emergency recovery snapshot of all current data
 */
export function createEmergencySnapshot(): StorageSnapshot {
  const connections = loadConnections();
  const moments = loadMoments();
  const ideas = loadIdeas();
  const notes = loadNotes();
  const profile = loadProfile();

  const snapshot: StorageSnapshot = {
    id: `snap_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAt: Date.now(),
    connectionsCount: connections.length,
    momentsCount: moments.length,
    ideasCount: ideas.length,
    notesCount: notes.length,
    data: {
      connections,
      moments,
      ideas,
      notes,
      profile,
    },
  };

  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    const snapshots: StorageSnapshot[] = raw ? JSON.parse(raw) : [];
    // Keep newest MAX_SNAPSHOTS
    const updated = [snapshot, ...snapshots.slice(0, MAX_SNAPSHOTS - 1)];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Contingency: Failed to save snapshot to local storage', err);
  }

  return snapshot;
}

/**
 * Retrieves all stored recovery snapshots
 */
export function getStoredSnapshots(): StorageSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Contingency: Failed to retrieve snapshots', err);
  }
  return [];
}

/**
 * Restores all application data from a chosen snapshot
 */
export function restoreFromSnapshot(snapshot: StorageSnapshot): void {
  try {
    localStorage.setItem('momentum_connections_v1', JSON.stringify(snapshot.data.connections));
    localStorage.setItem('momentum_moments_v1', JSON.stringify(snapshot.data.moments));
    localStorage.setItem('momentum_ideas_v1', JSON.stringify(snapshot.data.ideas));
    if (snapshot.data.notes) {
      localStorage.setItem('momentum_notes_v1', JSON.stringify(snapshot.data.notes));
    }
    localStorage.setItem('momentum_profile_v1', JSON.stringify(snapshot.data.profile));
  } catch (err) {
    console.error('Contingency: Failed to restore snapshot', err);
    throw err;
  }
}

/**
 * Generates an emergency downloadable JSON file containing all application records
 */
export function downloadEmergencyBackup(): void {
  const connections = loadConnections();
  const moments = loadMoments();
  const ideas = loadIdeas();
  const notes = loadNotes();
  const profile = loadProfile();

  const backupData = {
    app: 'Momentum OS - TEDxAkure 2026',
    exportedAt: new Date().toISOString(),
    profile,
    stats: {
      connections: connections.length,
      moments: moments.length,
      ideas: ideas.length,
      notes: notes.length,
    },
    data: {
      connections,
      moments,
      ideas,
      notes,
    },
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TEDxAkure_Emergency_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Estimates storage usage in bytes & MB
 */
export async function getStorageMetrics(): Promise<{
  usedBytes: number;
  usedMB: string;
  quotaMB: string;
  percentUsed: number;
}> {
  let usedBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        usedBytes += (key.length + (val ? val.length : 0)) * 2; // UTF-16 characters = 2 bytes
      }
    }
  } catch {
    usedBytes = 1024 * 500;
  }

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 50 * 1024 * 1024;
      const usage = estimate.usage || usedBytes;
      return {
        usedBytes: usage,
        usedMB: (usage / (1024 * 1024)).toFixed(2),
        quotaMB: (quota / (1024 * 1024)).toFixed(0),
        percentUsed: Math.min(100, Math.round((usage / quota) * 100)),
      };
    } catch {
      // Fallback
    }
  }

  const defaultQuota = 10 * 1024 * 1024; // 10MB typical localstorage
  return {
    usedBytes,
    usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
    quotaMB: '10',
    percentUsed: Math.min(100, Math.round((usedBytes / defaultQuota) * 100)),
  };
}
