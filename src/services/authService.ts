import { SecuritySettings, UserProfile } from '../types';
import { initialProfile } from '../data/mockData';

const SECURITY_STORAGE_KEY = 'momentum_security_v1';
const OWNER_EMAIL = 'faithakinboyejo@gmail.com';
const DEFAULT_PIN = '2026'; // Default event pin, customizable by Angelo

// Simple secure hash simulation for local PIN storage
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
    isLockEnabled: false, // User can enable lock with 1 click
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

export function verifyPinOrOwner(input: string, settings: SecuritySettings): boolean {
  const clean = input.trim();
  // Check if matches owner email
  if (clean.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    return true;
  }
  // Check if matches default pin or configured pin
  if (settings.pinHash) {
    return hashPin(clean) === settings.pinHash || clean === DEFAULT_PIN;
  }
  return clean === DEFAULT_PIN;
}

export function updatePin(newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  const current = loadSecuritySettings();
  current.pinHash = hashPin(newPin);
  current.isLockEnabled = true;
  saveSecuritySettings(current);
  return true;
}

export function setAppLockState(isLocked: boolean): void {
  const current = loadSecuritySettings();
  current.isLocked = isLocked;
  if (!isLocked) {
    current.lastUnlockedAt = new Date().toISOString();
  }
  saveSecuritySettings(current);
}
