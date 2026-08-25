/**
 * Haptic Vibration Service for Momentum OS
 * Provides subtle tactile feedback for navigation, saving, deleting, and milestone achievements.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'delete' | 'milestone' | 'unlock' | 'selection' | 'nfc_handshake' | 'nfc_bump';

export const triggerHaptic = (type: HapticType = 'light'): void => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return;

  try {
    switch (type) {
      case 'selection':
      case 'light':
        // Quick subtle tap for tab changes and buttons (12ms)
        navigator.vibrate(12);
        break;
      case 'medium':
        // Noticeable confirmation (25ms)
        navigator.vibrate(25);
        break;
      case 'heavy':
        // Firm confirmation (45ms)
        navigator.vibrate(45);
        break;
      case 'nfc_handshake':
      case 'nfc_bump':
        // Characteristic tactile triple-pulse handshake pattern for contactless phone bumps
        navigator.vibrate([60, 40, 90, 40, 160]);
        break;
      case 'success':
        // Dual pleasant pulse for saving records
        navigator.vibrate([18, 40, 25]);
        break;
      case 'warning':
      case 'error':
        // Staccato alert for errors/warnings
        navigator.vibrate([30, 40, 30]);
        break;
      case 'delete':
        // Heavier cautionary vibration for trashing / deleting
        navigator.vibrate([40, 50, 45]);
        break;
      case 'unlock':
        // Smooth unlocking sequence
        navigator.vibrate([20, 30, 20]);
        break;
      case 'milestone':
        // Celebratory rhythm when hitting 50 connections or leveling up
        navigator.vibrate([40, 50, 60, 50, 100]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Gracefully handle any browser permission restriction or quiet mode
  }
};

export const haptic = {
  tap: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  success: () => triggerHaptic('success'),
  nfc: () => triggerHaptic('nfc_handshake'),
  delete: () => triggerHaptic('delete'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  unlock: () => triggerHaptic('unlock'),
  milestone: () => triggerHaptic('milestone'),
};
