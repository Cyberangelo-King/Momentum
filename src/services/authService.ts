import { SecuritySettings } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { triggerHaptic } from './haptics';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

const SECURITY_SETTINGS_STORAGE_KEY = 'momentum_security_settings_v1';

/**
 * Retrieves the designated owner email from environment configuration.
 * Momentum V1 is a private, single-owner system.
 */
export function getOwnerEmail(): string {
  const metaEnv = (import.meta as any).env || {};
  const configured = metaEnv.VITE_OWNER_EMAIL || '';
  if (configured && configured.trim()) {
    return configured.trim().toLowerCase();
  }
  // Default fallback owner configuration
  return 'faithakinboyejo@gmail.com';
}

/**
 * Checks if the given email matches the designated single owner.
 */
export function isDesignatedOwner(email?: string | null): boolean {
  if (!email) return false;
  const ownerEmail = getOwnerEmail();
  return email.trim().toLowerCase() === ownerEmail.toLowerCase();
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  isUnauthorizedUser?: boolean;
}

/**
 * Authenticates the single designated owner using Supabase Auth.
 * If a valid Supabase account signs in that is NOT the designated owner,
 * access is immediately denied and the session is terminated.
 */
export async function loginWithOwnerCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AuthResult> {
  const client = getSupabaseClient();
  const trimmedEmail = emailInput.trim();

  if (!isSupabaseConfigured() || !client) {
    return {
      success: false,
      error: 'Supabase authentication is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  // Pre-check owner email format before sending
  if (!trimmedEmail) {
    return {
      success: false,
      error: 'Please enter your registered owner email address.',
    };
  }

  if (!passwordInput) {
    return {
      success: false,
      error: 'Please enter your password.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password: passwordInput,
    });

    if (error) {
      triggerHaptic('error');
      // Format clean, user-friendly error messages
      let message = error.message;
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        message = 'Your Supabase email has not been confirmed yet. Please confirm your email.';
      }
      return {
        success: false,
        error: message,
      };
    }

    if (!data.user || !data.session) {
      triggerHaptic('error');
      return {
        success: false,
        error: 'Authentication failed. No active session returned.',
      };
    }

    // STRICT OWNER ENFORCEMENT
    if (!isDesignatedOwner(data.user.email)) {
      // Immediately terminate unauthorized session
      await client.auth.signOut();
      triggerHaptic('error');
      return {
        success: false,
        isUnauthorizedUser: true,
        error: `Access Denied. Account (${data.user.email}) is not the authorized owner of this Momentum instance.`,
      };
    }

    triggerHaptic('unlock');
    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    triggerHaptic('error');
    console.error('Supabase authentication error:', err);
    return {
      success: false,
      error: err?.message || 'A network error occurred while connecting to Supabase Auth.',
    };
  }
}

/**
 * Signs out the owner and terminates the Supabase session.
 */
export async function logoutOwner(): Promise<void> {
  const client = getSupabaseClient();
  try {
    if (client) {
      await client.auth.signOut();
    }
  } catch (err) {
    console.warn('Error during Supabase signOut:', err);
  } finally {
    triggerHaptic('medium');
  }
}

/**
 * Restores and verifies the current Supabase session.
 * Handles offline scenarios gracefully for already authenticated sessions.
 */
export async function getVerifiedOwnerSession(): Promise<{
  session: Session | null;
  user: User | null;
  isOwner: boolean;
  isOffline: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (!isSupabaseConfigured() || !client) {
    return {
      session: null,
      user: null,
      isOwner: false,
      isOffline,
      error: 'Supabase is not configured.',
    };
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      // If offline, check if there's a cached session that failed network refresh
      if (isOffline && data?.session?.user) {
        const email = data.session.user.email;
        const isOwner = isDesignatedOwner(email);
        return {
          session: data.session,
          user: data.session.user,
          isOwner,
          isOffline: true,
        };
      }
      return {
        session: null,
        user: null,
        isOwner: false,
        isOffline,
        error: error.message,
      };
    }

    if (!data.session || !data.session.user) {
      return {
        session: null,
        user: null,
        isOwner: false,
        isOffline,
      };
    }

    const email = data.session.user.email;
    const isOwner = isDesignatedOwner(email);

    if (!isOwner) {
      // Non-owner detected in session storage, sign out immediately
      await client.auth.signOut();
      return {
        session: null,
        user: null,
        isOwner: false,
        isOffline,
        error: 'Unauthorized account detected and signed out.',
      };
    }

    return {
      session: data.session,
      user: data.session.user,
      isOwner: true,
      isOffline,
    };
  } catch (err: any) {
    console.warn('Failed to retrieve Supabase session:', err);
    return {
      session: null,
      user: null,
      isOwner: false,
      isOffline,
      error: err?.message,
    };
  }
}

/**
 * Subscribes to Supabase Auth state changes.
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null, isOwner: boolean) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(async (event, session) => {
    const email = session?.user?.email;
    const isOwner = isDesignatedOwner(email);

    if (session && !isOwner) {
      // Immediate eviction of non-owner accounts
      await client.auth.signOut();
      callback('SIGNED_OUT', null, false);
      return;
    }

    callback(event, session, isOwner);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// OPTIONAL SECONDARY IN-SESSION PRIVACY LOCK (SCREEN SHADE)
// ============================================================================
// Note: This is an optional secondary in-session lock when the owner is away from
// their device. It is NOT a substitute for primary Supabase authentication.

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'pin_hash_' + Math.abs(hash).toString(36) + '_' + pin.length;
}

export function getInitialSecuritySettings(): SecuritySettings {
  return {
    isLockEnabled: false,
    pinHash: null,
    authorizedEmail: getOwnerEmail(),
    isLocked: false,
    lastUnlockedAt: new Date().toISOString(),
  };
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const data = localStorage.getItem(SECURITY_SETTINGS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...getInitialSecuritySettings(),
        ...parsed,
        authorizedEmail: getOwnerEmail(),
      };
    }
  } catch (e) {
    console.warn('Failed to load security settings', e);
  }
  return getInitialSecuritySettings();
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(SECURITY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save security settings', e);
  }
}

export function verifySessionPin(input: string, settings: SecuritySettings): boolean {
  const clean = input.trim();
  if (!settings.pinHash) {
    // If no pin is set yet, any 4-digit setup attempt or owner email unlocks
    return clean.length >= 4;
  }
  const match = hashPin(clean) === settings.pinHash;
  if (match) triggerHaptic('unlock');
  else triggerHaptic('error');
  return match;
}

export function updateSessionPin(newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  const current = loadSecuritySettings();
  current.pinHash = hashPin(newPin);
  current.isLockEnabled = true;
  saveSecuritySettings(current);
  triggerHaptic('success');
  return true;
}

export function setAppLockState(isLocked: boolean): void {
  const current = loadSecuritySettings();
  current.isLocked = isLocked;
  if (!isLocked) {
    current.lastUnlockedAt = new Date().toISOString();
    triggerHaptic('unlock');
  } else {
    triggerHaptic('medium');
  }
  saveSecuritySettings(current);
}
