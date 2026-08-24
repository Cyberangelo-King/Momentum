import { Connection, Moment, Idea, EventSession, UserProfile, Note, EventConfig, EventTemplatePreset } from '../types';
import { initialConnections, initialMoments, initialIdeas, initialSessions, initialProfile, initialNotes } from '../data/mockData';
import { defaultTedxAkureEvent, eventTemplatePresets } from '../data/eventTemplates';
import { syncManager } from './syncManager';
import { multiDeviceSync } from './multiDeviceSync';

const STORAGE_KEYS = {
  EVENTS_CATALOG: 'momentum_events_catalog_v1',
  ACTIVE_EVENT_ID: 'momentum_active_event_id_v1',
  CONNECTIONS: 'momentum_connections_v1',
  MOMENTS: 'momentum_moments_v1',
  IDEAS: 'momentum_ideas_v1',
  NOTES: 'momentum_notes_v1',
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

// Tag initial mock data with isDemo: true and default event ID
const taggedMockConnections: Connection[] = initialConnections.map((c) => ({
  ...c,
  isDemo: true,
  eventId: defaultTedxAkureEvent.id,
}));
const taggedMockMoments: Moment[] = initialMoments.map((m) => ({
  ...m,
  isDemo: true,
  eventId: defaultTedxAkureEvent.id,
}));
const taggedMockIdeas: Idea[] = initialIdeas.map((i) => ({
  ...i,
  isDemo: true,
  eventId: defaultTedxAkureEvent.id,
}));
const taggedMockNotes: Note[] = initialNotes.map((n) => ({
  ...n,
  isDemo: true,
  eventId: defaultTedxAkureEvent.id,
}));

// ==========================================
// EVENT MANAGEMENT & MULTI-EVENT STORAGE
// ==========================================

export function loadEvents(): EventConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS_CATALOG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load events catalog from storage', e);
  }
  // Initialize with default TEDxAkure 2026 event
  const initialCatalog = [defaultTedxAkureEvent];
  saveEvents(initialCatalog);
  return initialCatalog;
}

export function saveEvents(events: EventConfig[]): void {
  try {
    safeStorageSet(STORAGE_KEYS.EVENTS_CATALOG, JSON.stringify(events));
  } catch (e) {
    console.warn('Failed to save events catalog to storage', e);
  }
}

export function loadActiveEventId(): string {
  try {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT_ID);
    if (activeId) return activeId;
  } catch (e) {
    console.warn('Failed to load active event ID', e);
  }
  return defaultTedxAkureEvent.id;
}

export function saveActiveEventId(eventId: string): void {
  try {
    safeStorageSet(STORAGE_KEYS.ACTIVE_EVENT_ID, eventId);
  } catch (e) {
    console.warn('Failed to save active event ID', e);
  }
}

export function getActiveEvent(): EventConfig {
  const events = loadEvents();
  const activeId = loadActiveEventId();
  const found = events.find((e) => e.id === activeId);
  if (found) return found;
  if (events.length > 0) {
    saveActiveEventId(events[0].id);
    return events[0];
  }
  return defaultTedxAkureEvent;
}

export const loadEventsCatalog = loadEvents;
export const saveEventsCatalog = saveEvents;
export const loadActiveEventConfig = getActiveEvent;

export function createEventFromPreset(preset: EventTemplatePreset, customOverrides?: Partial<EventConfig>): EventConfig {
  const newId = `event-${preset.eventType}-${Date.now().toString(36)}`;
  const newEvent: EventConfig = {
    id: newId,
    name: customOverrides?.name || preset.title,
    year: customOverrides?.year || new Date().getFullYear().toString(),
    tagline: customOverrides?.tagline || preset.sampleTagline,
    themeDescription: customOverrides?.themeDescription || preset.sampleThemeDescription,
    eventType: preset.eventType,
    startDate: customOverrides?.startDate || new Date().toISOString().split('T')[0],
    endDate: customOverrides?.endDate,
    location: customOverrides?.location || preset.sampleLocation,
    venue: customOverrides?.venue || preset.sampleLocation,
    city: customOverrides?.city || 'Global',
    country: customOverrides?.country || '',
    targetConnections: customOverrides?.targetConnections || preset.defaultTarget,
    stages: customOverrides?.stages || preset.sampleStages,
    branding: {
      themeKey: preset.themeKey,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      badgeBgColor: `${preset.primaryColor}25`,
      badgeTextColor: preset.primaryColor,
      bannerGradient: `from-[${preset.primaryColor}33] via-[#1a0c06] to-[#0a0a0a]`,
      taglineColor: '#fadcd2',
    },
    sessions: preset.sampleSessions.map((s, idx) => ({
      ...s,
      id: `s-${newId}-${idx + 1}`,
    })),
    customIcebreakers: preset.sampleIcebreakers,
    isArchived: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allEvents = loadEvents();
  const updatedEvents = [newEvent, ...allEvents];
  saveEvents(updatedEvents);
  saveActiveEventId(newEvent.id);
  return newEvent;
}

export function createCustomEvent(eventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'>): EventConfig {
  const newId = `event-${Date.now().toString(36)}`;
  const newEvent: EventConfig = {
    ...eventData,
    id: newId,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allEvents = loadEvents();
  const updatedEvents = [newEvent, ...allEvents];
  saveEvents(updatedEvents);
  saveActiveEventId(newEvent.id);
  return newEvent;
}

export function updateEvent(updatedEvent: EventConfig): EventConfig[] {
  const allEvents = loadEvents();
  const updatedList = allEvents.map((e) =>
    e.id === updatedEvent.id ? { ...updatedEvent, updatedAt: new Date().toISOString() } : e
  );
  saveEvents(updatedList);
  return updatedList;
}

export function deleteEvent(eventId: string): { updatedEvents: EventConfig[]; newActiveEvent: EventConfig } {
  const allEvents = loadEvents();
  const filtered = allEvents.filter((e) => e.id !== eventId);
  const finalList = filtered.length > 0 ? filtered : [defaultTedxAkureEvent];
  saveEvents(finalList);

  const activeId = loadActiveEventId();
  let newActive = finalList[0];
  if (activeId === eventId) {
    saveActiveEventId(newActive.id);
  } else {
    newActive = finalList.find((e) => e.id === activeId) || finalList[0];
  }

  return { updatedEvents: finalList, newActiveEvent: newActive };
}

export function duplicateEvent(eventId: string): EventConfig {
  const allEvents = loadEvents();
  const source = allEvents.find((e) => e.id === eventId) || defaultTedxAkureEvent;
  const newId = `event-copy-${Date.now().toString(36)}`;

  const duplicated: EventConfig = {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    sessions: source.sessions.map((s, i) => ({ ...s, id: `s-${newId}-${i + 1}` })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [duplicated, ...allEvents];
  saveEvents(updatedList);
  saveActiveEventId(duplicated.id);
  return duplicated;
}

// ==========================================
// CONNECTIONS, MOMENTS, IDEAS, NOTES
// ==========================================

export function loadConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    if (raw) {
      const parsed: Connection[] = JSON.parse(raw);
      return parsed;
    }
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
    if (raw) {
      const parsed: Moment[] = JSON.parse(raw);
      return parsed;
    }
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
    if (raw) {
      const parsed: Idea[] = JSON.parse(raw);
      return parsed;
    }
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

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (raw) {
      const parsed: Note[] = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load notes from storage', e);
  }
  return taggedMockNotes;
}

export function saveNotes(notes: Note[]): void {
  try {
    safeStorageSet(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    syncManager.flushQueue().catch(() => {});
    multiDeviceSync.pushState({ notes }).catch(() => {});
  } catch (e) {
    console.warn('Failed to save notes to storage', e);
  }
}

export function permanentlyDeleteNote(noteId: string): { updatedNotes: Note[] } {
  const currentNotes = loadNotes();
  const updatedNotes = currentNotes.filter((n) => n.id !== noteId);
  saveNotes(updatedNotes);
  return { updatedNotes };
}

export function loadSessions(): EventSession[] {
  const activeEvent = getActiveEvent();
  if (activeEvent && activeEvent.sessions && activeEvent.sessions.length > 0) {
    return activeEvent.sessions;
  }
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

// ==========================================
// CROSS-EVENT SEARCH & INTELLIGENCE
// ==========================================

export interface UniversalSearchResult {
  connections: Array<Connection & { eventName?: string }>;
  notes: Array<Note & { eventName?: string }>;
  moments: Array<Moment & { eventName?: string }>;
  ideas: Array<Idea & { eventName?: string }>;
}

export function searchAcrossAllEvents(query: string): UniversalSearchResult {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { connections: [], notes: [], moments: [], ideas: [] };
  }

  const events = loadEvents();
  const eventMap = new Map<string, string>();
  events.forEach((e) => eventMap.set(e.id, e.name));

  const allConnections = loadConnections().filter((c) => !c.inTrash);
  const allNotes = loadNotes().filter((n) => !n.inTrash);
  const allMoments = loadMoments().filter((m) => !m.inTrash);
  const allIdeas = loadIdeas().filter((i) => !i.inTrash);

  const matchedConnections = allConnections
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.profession.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    )
    .map((c) => ({
      ...c,
      eventName: c.eventId ? eventMap.get(c.eventId) || 'General' : 'TEDxAkure 2026',
    }));

  const matchedNotes = allNotes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.speakerName && n.speakerName.toLowerCase().includes(q)) ||
        (n.speaker && n.speaker.toLowerCase().includes(q)) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
    .map((n) => ({
      ...n,
      eventName: n.eventId ? eventMap.get(n.eventId) || 'General' : 'TEDxAkure 2026',
    }));

  const matchedMoments = allMoments
    .filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.caption.toLowerCase().includes(q) ||
        (m.speakerName && m.speakerName.toLowerCase().includes(q))
    )
    .map((m) => ({
      ...m,
      eventName: m.eventId ? eventMap.get(m.eventId) || 'General' : 'TEDxAkure 2026',
    }));

  const matchedIdeas = allIdeas
    .filter(
      (i) =>
        i.quote.toLowerCase().includes(q) ||
        i.speakerName.toLowerCase().includes(q) ||
        (i.takeaway && i.takeaway.toLowerCase().includes(q))
    )
    .map((i) => ({
      ...i,
      eventName: i.eventId ? eventMap.get(i.eventId) || 'General' : 'TEDxAkure 2026',
    }));

  return {
    connections: matchedConnections,
    notes: matchedNotes,
    moments: matchedMoments,
    ideas: matchedIdeas,
  };
}

export function getMultiEventStats() {
  const events = loadEvents();
  const connections = loadConnections().filter((c) => !c.inTrash);
  const moments = loadMoments().filter((m) => !m.inTrash);
  const ideas = loadIdeas().filter((i) => !i.inTrash);
  const notes = loadNotes().filter((n) => !n.inTrash);

  return {
    totalEvents: events.length,
    activeEvents: events.filter((e) => !e.isArchived).length,
    totalConnections: connections.length,
    totalMoments: moments.length,
    totalIdeas: ideas.length,
    totalNotes: notes.length,
  };
}

/**
 * Move all demo data items into trash so Angelo can restore them or empty trash completely
 */
export function sendDemoDataToTrash(): {
  connectionsCount: number;
  momentsCount: number;
  ideasCount: number;
  notesCount: number;
} {
  const connections = loadConnections();
  const moments = loadMoments();
  const ideas = loadIdeas();
  const notes = loadNotes();

  let cCount = 0;
  let mCount = 0;
  let iCount = 0;
  let nCount = 0;

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

  const updatedNotes = notes.map((n) => {
    if (n.isDemo) {
      nCount++;
      return { ...n, inTrash: true, deletedAt: new Date().toISOString() };
    }
    return n;
  });

  saveConnections(updatedConnections);
  saveMoments(updatedMoments);
  saveIdeas(updatedIdeas);
  saveNotes(updatedNotes);

  return { connectionsCount: cCount, momentsCount: mCount, ideasCount: iCount, notesCount: nCount };
}

/**
 * Permanently deletes all demo data from local and cloud storage
 */
export function permanentlyDeleteDemoData(): {
  deletedConnections: number;
  deletedMoments: number;
  deletedIdeas: number;
  deletedNotes: number;
} {
  const connections = loadConnections().filter((c) => !c.isDemo);
  const moments = loadMoments().filter((m) => !m.isDemo);
  const ideas = loadIdeas().filter((i) => !i.isDemo);
  const notes = loadNotes().filter((n) => !n.isDemo);

  saveConnections(connections);
  saveMoments(moments);
  saveIdeas(ideas);
  saveNotes(notes);

  return {
    deletedConnections: initialConnections.length,
    deletedMoments: initialMoments.length,
    deletedIdeas: initialIdeas.length,
    deletedNotes: initialNotes.length,
  };
}

/**
 * Restore all demo data from trash back to active view
 */
export function restoreAllDemoData(): void {
  const connections = loadConnections().map((c) => (c.isDemo ? { ...c, inTrash: false, deletedAt: undefined } : c));
  const moments = loadMoments().map((m) => (m.isDemo ? { ...m, inTrash: false, deletedAt: undefined } : m));
  const ideas = loadIdeas().map((i) => (i.isDemo ? { ...i, inTrash: false, deletedAt: undefined } : i));
  const notes = loadNotes().map((n) => (n.isDemo ? { ...n, inTrash: false, deletedAt: undefined } : n));

  saveConnections(connections);
  saveMoments(moments);
  saveIdeas(ideas);
  saveNotes(notes);
}

/**
 * Safely and permanently deletes a moment by ID
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
  syncManager.enqueue('moment', 'delete', { id: momentId });

  return { updatedMoments, updatedConnections };
}

/**
 * Safely and permanently deletes a connection by ID
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

// Reset data back to initial state
export function resetConferenceData(): void {
  localStorage.removeItem(STORAGE_KEYS.EVENTS_CATALOG);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_EVENT_ID);
  localStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
  localStorage.removeItem(STORAGE_KEYS.MOMENTS);
  localStorage.removeItem(STORAGE_KEYS.IDEAS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}
