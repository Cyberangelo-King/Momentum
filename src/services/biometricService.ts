import { triggerHaptic } from './haptics';
import { getOwnerEmail } from './authService';

const BIOMETRIC_CREDENTIAL_ID_KEY = 'momentum_biometric_credential_id_v1';
const BIOMETRIC_ENABLED_KEY = 'momentum_biometric_enabled_v1';

// Helper utilities for ArrayBuffer <-> Base64Url conversion
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface BiometricAvailability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  isRegistered: boolean;
  isEnabled: boolean;
  biometricLabel: string;
  error?: string;
}

/**
 * Detects whether the current device/browser supports WebAuthn platform biometrics
 * (Touch ID, Face ID, Windows Hello, Android Biometrics).
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  const label = detectBiometricTypeLabel();
  const isRegistered = Boolean(getStoredBiometricCredentialId());
  const isEnabled = isBiometricEnabled();

  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      isSupported: false,
      hasPlatformAuthenticator: false,
      isRegistered,
      isEnabled,
      biometricLabel: label,
      error: 'WebAuthn is not supported in this browser.',
    };
  }

  // Check if platform authenticator (TouchID / FaceID / Windows Hello) is available
  try {
    const hasPlatformAuthenticator =
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
        ? await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        : false;

    return {
      isSupported: true,
      hasPlatformAuthenticator,
      isRegistered,
      isEnabled: isEnabled && isRegistered,
      biometricLabel: label,
    };
  } catch (err: any) {
    return {
      isSupported: true,
      hasPlatformAuthenticator: false,
      isRegistered,
      isEnabled,
      biometricLabel: label,
      error: err?.message,
    };
  }
}

/**
 * Returns a human-friendly label based on platform (e.g. Face ID / Touch ID).
 */
export function detectBiometricTypeLabel(): string {
  if (typeof navigator === 'undefined') return 'Biometrics';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'Face ID / Touch ID';
  }
  if (/Macintosh|Mac OS X/.test(ua)) {
    return 'Touch ID';
  }
  if (/Windows/.test(ua)) {
    return 'Windows Hello';
  }
  if (/Android/.test(ua)) {
    return 'Fingerprint / Face Unlock';
  }
  return 'Biometrics (Face ID / Touch ID)';
}

export function getStoredBiometricCredentialId(): string | null {
  try {
    return localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
  } catch (e) {
    return null;
  }
}

export function isBiometricEnabled(): boolean {
  try {
    const val = localStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch (e) {
    return false;
  }
}

export function setBiometricEnabledState(enabled: boolean): void {
  try {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to save biometric state:', e);
  }
}

/**
 * Registers the device's platform authenticator (TouchID/FaceID) for the Momentum owner.
 */
export async function registerDeviceBiometrics(): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return {
      success: false,
      error: 'Biometric authentication is not supported on this browser/device.',
    };
  }

  const ownerEmail = getOwnerEmail();
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(ownerEmail);

  // Extract hostname cleanly (handles domains and localhost)
  const rpId = window.location.hostname || 'localhost';

  const createOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: 'Momentum OS (TEDxAkure)',
        id: rpId,
      },
      user: {
        id: userId,
        name: ownerEmail,
        displayName: `Owner (${ownerEmail})`,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256 (ECDSA w/ SHA-256) - iOS FaceID / Android / Mac TouchID
        { type: 'public-key', alg: -257 }, // RS256 (RSA w/ SHA-256) - Windows Hello
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Ensures device biometric hardware is preferred
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  };

  try {
    triggerHaptic('light');
    const credential = (await navigator.credentials.create(createOptions)) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: 'Biometric registration was cancelled or failed.',
      };
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialId);
    setBiometricEnabledState(true);

    triggerHaptic('success');
    return {
      success: true,
      credentialId,
    };
  } catch (err: any) {
    triggerHaptic('error');
    console.warn('Biometric registration error:', err);

    let friendlyMessage = err?.message || 'Biometric registration failed.';
    if (err.name === 'NotAllowedError') {
      friendlyMessage = 'Biometric prompt was cancelled or timed out.';
    } else if (err.name === 'InvalidStateError') {
      friendlyMessage = 'This biometric credential is already registered on this device.';
    } else if (err.name === 'NotSupportedError') {
      friendlyMessage = 'Device platform authenticator is not supported on this origin.';
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  }
}

/**
 * Prompts the owner for Face ID / Touch ID verification to quickly unlock the app.
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  error?: string;
  cancelled?: boolean;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return {
      success: false,
      error: 'Biometric authentication is not supported.',
    };
  }

  const storedCredId = getStoredBiometricCredentialId();
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const rpId = window.location.hostname || 'localhost';

  const getOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      rpId,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: storedCredId
        ? [
            {
              id: base64UrlToBuffer(storedCredId),
              type: 'public-key',
              transports: ['internal'],
            },
          ]
        : [], // If not provided, allow any matching resident platform key
    },
  };

  try {
    triggerHaptic('light');
    const assertion = await navigator.credentials.get(getOptions);

    if (assertion) {
      triggerHaptic('unlock');
      return { success: true };
    } else {
      triggerHaptic('error');
      return { success: false, error: 'Biometric verification did not produce an assertion.' };
    }
  } catch (err: any) {
    triggerHaptic('error');
    console.warn('Biometric assertion error:', err);

    const isCancelled = err.name === 'NotAllowedError' || err.name === 'AbortError';
    return {
      success: false,
      cancelled: isCancelled,
      error: isCancelled
        ? 'Biometric verification cancelled.'
        : err?.message || 'Biometric verification failed.',
    };
  }
}

/**
 * Removes biometric credential pairing from this device.
 */
export function removeBiometricCredential(): void {
  try {
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    setBiometricEnabledState(false);
    triggerHaptic('medium');
  } catch (e) {
    console.warn('Failed to remove biometric credential:', e);
  }
}
