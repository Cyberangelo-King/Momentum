import { SecuritySettings } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { triggerHaptic } from './haptics';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getStoredBiometricCredentialId, isBiometricEnabled, authenticateWithBiometrics } from './biometricService';

const SECURITY_SETTINGS_STORAGE_KEY = 'momentum_security_settings_v1';

/**
 * Computes the environment-aware redirect URL for Supabase Auth emails (confirmations, password resets, magic links).
 * - Local development uses the active local origin (e.g., http://localhost:3000).
 * - Production uses the deployed origin (e.g., https://angelomomentum.netlify.app or active production origin).
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Local development check
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    // Deployed Netlify / production check
    if (origin.includes('netlify.app') || origin.includes('angelomomentum')) {
      return origin;
    }
    // Environment variable check
    const metaEnv = (import.meta as any).env || {};
    const configuredUrl = (metaEnv.VITE_APP_URL || metaEnv.APP_URL || '').trim();
    if (configuredUrl && !configuredUrl.includes('localhost') && !configuredUrl.includes('MY_APP_URL')) {
      return configuredUrl.replace(/\/$/, '');
    }
    return origin;
  }
  return 'https://angelomomentum.netlify.app';
}

/**
 * Retrieves the designated owner email from environment configuration.
 * Momentum V1 is a private, single-owner system.
 * Security requirement: Fails closed in production if VITE_OWNER_EMAIL is not explicitly configured.
 */
export function getOwnerEmail(): string {
  const metaEnv = (import.meta as any).env || {};
  const configured = metaEnv.VITE_OWNER_EMAIL || '';
  if (configured && configured.trim()) {
    return configured.trim().toLowerCase();
  }
  // In development environments without env, support local development if explicit
  const isProd = metaEnv.PROD || metaEnv.NODE_ENV === 'production';
  if (!isProd) {
    return (metaEnv.VITE_OWNER_EMAIL || 'faithakinboyejo@gmail.com').trim().toLowerCase();
  }
  // Fail closed in production: no hardcoded default
  return '';
}

/**
 * Checks if the given email matches the designated single owner.
 * Fails closed if the owner email is unconfigured or null.
 */
export function isDesignatedOwner(email?: string | null): boolean {
  if (!email) return false;
  const ownerEmail = getOwnerEmail();
  if (!ownerEmail) {
    console.error('Security Alert: VITE_OWNER_EMAIL is not configured. Access denied.');
    return false;
  }
  return email.trim().toLowerCase() === ownerEmail.toLowerCase();
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  isUnauthorizedUser?: boolean;
  isUnconfirmedEmail?: boolean;
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
      let message = error.message;
      const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed');

      if (error.message.toLowerCase().includes('invalid login credentials')) {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (isUnconfirmed) {
        message = 'Your Supabase email has not been confirmed yet. Please confirm your email using the link sent to your inbox.';
      }

      return {
        success: false,
        isUnconfirmedEmail: isUnconfirmed,
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
 * Resends the Supabase signup confirmation email to the owner with environment-aware redirect URL.
 */
export async function resendOwnerConfirmationEmail(emailInput?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  const email = (emailInput || getOwnerEmail()).trim();
  const redirectUrl = getAuthRedirectUrl();

  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase authentication is not configured.',
    };
  }

  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      triggerHaptic('error');
      return {
        success: false,
        error: error.message,
      };
    }

    triggerHaptic('success');
    return {
      success: true,
      message: `Confirmation email dispatched to ${email}. Redirect destination: ${redirectUrl}`,
    };
  } catch (err: any) {
    triggerHaptic('error');
    return {
      success: false,
      error: err?.message || 'Failed to resend confirmation email.',
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
 * Handles incoming email confirmation tokens, PKCE auth codes, and offline scenarios.
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
    // 1. Check for incoming PKCE auth code in URL (e.g. from email confirmation redirect)
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        try {
          const { data: exchangeData, error: exchangeError } = await client.auth.exchangeCodeForSession(code);
          if (!exchangeError && exchangeData.session) {
            // Clean URL search parameters without reloading
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl || '/');

            const email = exchangeData.session.user.email;
            const isOwner = isDesignatedOwner(email);

            if (isOwner) {
              triggerHaptic('unlock');
              return {
                session: exchangeData.session,
                user: exchangeData.session.user,
                isOwner: true,
                isOffline: false,
              };
            }
          }
        } catch (exchangeErr) {
          console.warn('Error exchanging PKCE code for session:', exchangeErr);
        }
      }
    }

    // 2. Check for incoming access_token hash from email confirmation
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      // Delay clean URL slightly to allow Supabase listener to capture token
      setTimeout(() => {
        try {
          if (window.location.hash.includes('access_token=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {}
      }, 600);
    }

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
// OPTIONAL SECONDARY IN-SESSION PRIVACY LOCK (SCREEN SHADE + BIOMETRICS)
// ============================================================================

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
    isBiometricEnabled: isBiometricEnabled(),
    biometricCredentialId: getStoredBiometricCredentialId(),
  };
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const data = localStorage.getItem(SECURITY_SETTINGS_STORAGE_KEY);
    const bioEnabled = isBiometricEnabled();
    const bioId = getStoredBiometricCredentialId();
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...getInitialSecuritySettings(),
        ...parsed,
        isBiometricEnabled: parsed.isBiometricEnabled ?? bioEnabled,
        biometricCredentialId: parsed.biometricCredentialId ?? bioId,
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
    return clean.length >= 4;
  }
  const match = hashPin(clean) === settings.pinHash;
  if (match) triggerHaptic('unlock');
  else triggerHaptic('error');
  return match;
}

export async function verifySessionBiometrics(): Promise<boolean> {
  const res = await authenticateWithBiometrics();
  return res.success;
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
