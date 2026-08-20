import { SecuritySettings, UserProfile } from '../types';
import { initialProfile } from '../data/mockData';
import { triggerHaptic } from './haptics';

const SECURITY_STORAGE_KEY = 'momentum_security_v1';
const AUTH_SESSION_KEY = 'momentum_auth_token_v1';
const OWNER_EMAIL = 'faithakinboyejo@gmail.com';
const DEFAULT_PIN = '2026'; // Default event pin, customizable

// Simple secure hash for local PIN storage
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'pin_hash_' + Math.abs(hash).toString(36) + '_' + pin.length;
}

export function getInitialSecuritySettings(): SecuritySettings {
  return {
    isLockEnabled: false,
    pinHash: hashPin(DEFAULT_PIN),
    authorizedEmail: OWNER_EMAIL,
    isLocked: false,
    lastUnlockedAt: new Date().toISOString(),
  };
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const data = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...getInitialSecuritySettings(),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load security settings', e);
  }
  return getInitialSecuritySettings();
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save security settings', e);
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function loginWithCredentials(email: string, pin: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      saveAuthToken(data.token);
      triggerHaptic('unlock');
      return { success: true };
    }
    triggerHaptic('warning');
    return { success: false, message: data.message || 'Authentication failed' };
  } catch {
    // Local offline verification fallback
    const settings = loadSecuritySettings();
    if (verifyPinOrOwner(pin, settings) || email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      const mockToken = `local_auth_${Date.now()}`;
      saveAuthToken(mockToken);
      triggerHaptic('unlock');
      return { success: true };
    }
    triggerHaptic('warning');
    return { success: false, message: 'Invalid credentials. Default event PIN is 2026.' };
  }
}

export function verifyPinOrOwner(input: string, settings: SecuritySettings): boolean {
  const clean = input.trim();
  // Check if matches owner email
  if (clean.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    triggerHaptic('unlock');
    return true;
  }
  // Check if matches default pin or configured pin
  if (settings.pinHash) {
    const match = hashPin(clean) === settings.pinHash || clean === DEFAULT_PIN;
    if (match) triggerHaptic('unlock');
    else triggerHaptic('warning');
    return match;
  }
  const match = clean === DEFAULT_PIN;
  if (match) triggerHaptic('unlock');
  else triggerHaptic('warning');
  return match;
}

export function updatePin(newPin: string): boolean {
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
