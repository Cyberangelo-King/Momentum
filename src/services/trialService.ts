import { GuestTrialSession, TrialQuotaMetrics, Connection, Moment, Idea, Note, UserProfile } from '../types';

const TRIAL_SESSION_KEY = 'momentum_guest_trial_session_v1';
const TRIAL_BANDWIDTH_KEY = 'momentum_guest_trial_bandwidth_bytes_v1';

// Strict Safety Guardrails for 1-Day Trial to prevent system overload / damage
export const TRIAL_LIMITS = {
  DURATION_MS: 24 * 60 * 60 * 1000, // Exactly 24 Hours (1 Day)
  MAX_STORAGE_BYTES: 12 * 1024 * 1024, // 12 Megabytes
  MAX_BANDWIDTH_BYTES: 30 * 1024 * 1024, // 30 Megabytes transfer limit
  MAX_CONNECTIONS: 35,
  MAX_MOMENTS: 25,
  MAX_IDEAS: 25,
  MAX_NOTES: 25,
  MAX_PHOTOS: 15,
};

export function getTrialSession(): GuestTrialSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TRIAL_SESSION_KEY);
    if (!raw) return null;
    const session: GuestTrialSession = JSON.parse(raw);

    // Check expiration
    const now = Date.now();
    const expires = new Date(session.expiresAt).getTime();
    if (now > expires) {
      session.isActive = false;
    }
    return session;
  } catch (e) {
    console.warn('Failed to parse trial session', e);
    return null;
  }
}

export function isTrialActive(): boolean {
  const session = getTrialSession();
  if (!session) return false;
  const now = Date.now();
  const expires = new Date(session.expiresAt).getTime();
  return session.isActive && now <= expires;
}

export function startGuestTrial(guestName: string = 'Guest Explorer'): GuestTrialSession {
  const now = Date.now();
  const expiresAt = new Date(now + TRIAL_LIMITS.DURATION_MS).toISOString();

  const newSession: GuestTrialSession = {
    trialId: `trial_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    guestName: guestName.trim() || 'Guest Explorer',
    startedAt: new Date(now).toISOString(),
    expiresAt,
    isActive: true,
    storageQuotaBytes: TRIAL_LIMITS.MAX_STORAGE_BYTES,
    bandwidthQuotaBytes: TRIAL_LIMITS.MAX_BANDWIDTH_BYTES,
    bandwidthUsedBytes: 0,
    maxConnections: TRIAL_LIMITS.MAX_CONNECTIONS,
    maxMoments: TRIAL_LIMITS.MAX_MOMENTS,
    maxIdeas: TRIAL_LIMITS.MAX_IDEAS,
    maxNotes: TRIAL_LIMITS.MAX_NOTES,
    maxPhotos: TRIAL_LIMITS.MAX_PHOTOS,
  };

  try {
    localStorage.setItem(TRIAL_SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(TRIAL_BANDWIDTH_KEY, '0');
  } catch (e) {
    console.error('Could not start trial session in storage', e);
  }

  return newSession;
}

export function recordBandwidthUsage(bytes: number): number {
  if (typeof window === 'undefined' || bytes <= 0) return 0;
  try {
    const current = parseInt(localStorage.getItem(TRIAL_BANDWIDTH_KEY) || '0', 10);
    const updated = current + bytes;
    localStorage.setItem(TRIAL_BANDWIDTH_KEY, updated.toString());
    return updated;
  } catch {
    return 0;
  }
}

export function getBandwidthUsage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(TRIAL_BANDWIDTH_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function calculateStorageUsedBytes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        total += (key.length + val.length) * 2; // UTF-16 bytes approx
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export function getTrialMetrics(
  connections: Connection[] = [],
  moments: Moment[] = [],
  ideas: Idea[] = [],
  notes: Note[] = []
): TrialQuotaMetrics {
  const session = getTrialSession();
  const isTrial = isTrialActive();
  const guestName = session?.guestName || 'Guest Explorer';

  const now = Date.now();
  const expiresMs = session ? new Date(session.expiresAt).getTime() : now;
  const remainingTimeMs = Math.max(0, expiresMs - now);
  const isExpired = session ? now > expiresMs : false;

  // Format remaining time (e.g. "23h 45m" or "52m 10s")
  const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

  let remainingTimeFormatted = 'Expired';
  if (remainingTimeMs > 0) {
    if (hours > 0) {
      remainingTimeFormatted = `${hours}h ${mins}m remaining`;
    } else if (mins > 0) {
      remainingTimeFormatted = `${mins}m ${secs}s remaining`;
    } else {
      remainingTimeFormatted = `${secs}s remaining`;
    }
  }

  const storageUsedBytes = calculateStorageUsedBytes();
  const storageQuotaBytes = TRIAL_LIMITS.MAX_STORAGE_BYTES;
  const storagePercent = Math.min(100, Math.round((storageUsedBytes / storageQuotaBytes) * 100));

  const bandwidthUsedBytes = getBandwidthUsage();
  const bandwidthQuotaBytes = TRIAL_LIMITS.MAX_BANDWIDTH_BYTES;
  const bandwidthPercent = Math.min(100, Math.round((bandwidthUsedBytes / bandwidthQuotaBytes) * 100));

  return {
    isTrial,
    guestName,
    remainingTimeMs,
    remainingTimeFormatted,
    isExpired,
    storageUsedBytes,
    storageQuotaBytes,
    storagePercent,
    bandwidthUsedBytes,
    bandwidthQuotaBytes,
    bandwidthPercent,
    connectionsCount: connections.filter((c) => !c.inTrash).length,
    maxConnections: TRIAL_LIMITS.MAX_CONNECTIONS,
    momentsCount: moments.filter((m) => !m.inTrash).length,
    maxMoments: TRIAL_LIMITS.MAX_MOMENTS,
    ideasCount: ideas.filter((i) => !i.inTrash).length,
    maxIdeas: TRIAL_LIMITS.MAX_IDEAS,
    notesCount: notes.filter((n) => !n.inTrash).length,
    maxNotes: TRIAL_LIMITS.MAX_NOTES,
  };
}

export function checkTrialGuardrail(
  action: 'connection' | 'moment' | 'idea' | 'note' | 'photo' | 'bandwidth',
  metrics: TrialQuotaMetrics,
  payloadSizeBytes: number = 0
): { allowed: boolean; reason?: string } {
  if (!metrics.isTrial) {
    return { allowed: true };
  }

  if (metrics.isExpired) {
    return {
      allowed: false,
      reason: 'Your 24-hour guest trial has concluded. Please export your session data or log in with owner credentials.',
    };
  }

  if (metrics.storageUsedBytes + payloadSizeBytes >= metrics.storageQuotaBytes) {
    return {
      allowed: false,
      reason: `Trial storage quota limit (12MB) reached. Delete older photos or export your data to free up space.`,
    };
  }

  if (action === 'connection' && metrics.connectionsCount >= metrics.maxConnections) {
    return {
      allowed: false,
      reason: `Trial limit of ${metrics.maxConnections} contacts reached. Export your leads to CSV or upgrade to full license.`,
    };
  }

  if (action === 'moment' && metrics.momentsCount >= metrics.maxMoments) {
    return {
      allowed: false,
      reason: `Trial limit of ${metrics.maxMoments} moments reached to protect device bandwidth.`,
    };
  }

  if (action === 'idea' && metrics.ideasCount >= metrics.maxIdeas) {
    return {
      allowed: false,
      reason: `Trial limit of ${metrics.maxIdeas} ideas reached for this 24-hour session.`,
    };
  }

  if (action === 'note' && metrics.notesCount >= metrics.maxNotes) {
    return {
      allowed: false,
      reason: `Trial limit of ${metrics.maxNotes} smart notes reached.`,
    };
  }

  if (metrics.bandwidthUsedBytes >= metrics.bandwidthQuotaBytes) {
    return {
      allowed: false,
      reason: `Trial bandwidth transfer quota (${Math.round(TRIAL_LIMITS.MAX_BANDWIDTH_BYTES / 1024 / 1024)}MB) reached.`,
    };
  }

  return { allowed: true };
}

export function endTrialSession(): void {
  try {
    localStorage.removeItem(TRIAL_SESSION_KEY);
    localStorage.removeItem(TRIAL_BANDWIDTH_KEY);
  } catch (e) {
    console.warn('Failed to clear trial session', e);
  }
}

export function exportTrialDataZipOrJson(
  connections: Connection[],
  moments: Moment[],
  ideas: Idea[],
  notes: Note[],
  profile: UserProfile
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    trialSession: getTrialSession(),
    profile,
    connections,
    moments,
    ideas,
    notes,
    summary: {
      totalConnections: connections.length,
      totalMoments: moments.length,
      totalIdeas: ideas.length,
      totalNotes: notes.length,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Momentum_1DayTrial_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
