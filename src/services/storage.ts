import { Connection, Moment, Idea, EventSession, UserProfile } from '../types';
import { initialConnections, initialMoments, initialIdeas, initialSessions, initialProfile } from '../data/mockData';
import { syncConnectionsToSupabase, syncMomentsToSupabase, syncIdeasToSupabase, isSupabaseConfigured } from './supabaseSync';

const STORAGE_KEYS = {
  CONNECTIONS: 'momentum_connections_v1',
  MOMENTS: 'momentum_moments_v1',
  IDEAS: 'momentum_ideas_v1',
  SESSIONS: 'momentum_sessions_v1',
  PROFILE: 'momentum_profile_v1',
};

// Safe LocalStorage helpers
export function loadConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load connections from storage', e);
  }
  return initialConnections;
}

export function saveConnections(connections: Connection[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    if (isSupabaseConfigured()) {
      syncConnectionsToSupabase(connections).catch((err) =>
        console.warn('Background Supabase connection sync failed:', err)
      );
    }
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
  return initialMoments;
}

export function saveMoments(moments: Moment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOMENTS, JSON.stringify(moments));
    if (isSupabaseConfigured()) {
      syncMomentsToSupabase(moments).catch((err) =>
        console.warn('Background Supabase moments sync failed:', err)
      );
    }
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
  return initialIdeas;
}

export function saveIdeas(ideas: Idea[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
    if (isSupabaseConfigured()) {
      syncIdeasToSupabase(ideas).catch((err) =>
        console.warn('Background Supabase ideas sync failed:', err)
      );
    }
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
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save profile to storage', e);
  }
}

// Reset data back to initial TEDxAkure 2026 conference state
export function resetConferenceData(): void {
  localStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
  localStorage.removeItem(STORAGE_KEYS.MOMENTS);
  localStorage.removeItem(STORAGE_KEYS.IDEAS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}
