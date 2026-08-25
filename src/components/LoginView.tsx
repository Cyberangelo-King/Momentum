import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  WifiOff, 
  AlertCircle,
  CheckCircle2,
  Terminal,
  Loader2,
  Fingerprint,
  RefreshCw,
  Send,
  Palette,
  Clock,
  UserCheck,
  X
} from 'lucide-react';
import { 
  loginWithOwnerCredentials, 
  getOwnerEmail, 
  resendOwnerConfirmationEmail,
  getAuthRedirectUrl 
} from '../services/authService';
import { 
  checkBiometricAvailability, 
  authenticateWithBiometrics, 
  BiometricAvailability 
} from '../services/biometricService';
import { startGuestTrial } from '../services/trialService';
import { triggerHaptic } from '../services/haptics';
import { ThemeSelectorModal } from './ThemeSelectorModal';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onStartGuestTrial?: () => void;
  unauthorizedAttemptEmail?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onStartGuestTrial,
  unauthorizedAttemptEmail,
}) => {
  const configuredOwnerEmail = getOwnerEmail();
  const currentRedirectUrl = getAuthRedirectUrl();
  const [email, setEmail] = useState<string>(configuredOwnerEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    unauthorizedAttemptEmail
      ? `Access Denied: Account (${unauthorizedAttemptEmail}) is not the designated owner of this Momentum instance.`
      : null
  );
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(Boolean(unauthorizedAttemptEmail));
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const [biometricInfo, setBiometricInfo] = useState<BiometricAvailability | null>(null);
  const [isBioScanning, setIsBioScanning] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isTrialPromptOpen, setIsTrialPromptOpen] = useState<boolean>(false);
  const [guestNameInput, setGuestNameInput] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability().then(setBiometricInfo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsUnauthorized(false);
    setResendSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your owner email address.');
      triggerHaptic('warning');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      triggerHaptic('warning');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    try {
      const result = await loginWithOwnerCredentials(email, password);

      if (result.success) {
        triggerHaptic('success');
        onLoginSuccess();
      } else {
        if (result.isUnauthorizedUser) {
          setIsUnauthorized(true);
        }
        if (result.isUnconfirmedEmail) {
          setIsUnconfirmed(true);
        }
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
        triggerHaptic('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during login.');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await resendOwnerConfirmationEmail(email);
      if (res.success) {
        setResendSuccessMessage(
          `Confirmation email sent to ${email}. When you click the link in your email, you will be redirected to: ${currentRedirectUrl}`
        );
        triggerHaptic('success');
      } else {
        setErrorMessage(res.error || 'Failed to resend confirmation email.');
        triggerHaptic('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error sending confirmation email.');
      triggerHaptic('error');
    } finally {
      setIsResending(false);
    }
  };

  const handleBiometricQuickUnlock = async () => {
    if (isBioScanning) return;
    setIsBioScanning(true);
    setErrorMessage(null);

    try {
      const res = await authenticateWithBiometrics();
      if (res.success) {
        triggerHaptic('unlock');
        onLoginSuccess();
      } else if (!res.cancelled && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      console.warn('Biometric login exception:', err);
    } finally {
      setIsBioScanning(false);
    }
  };

  const handleActivateGuestTrial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('success');
    const guestName = guestNameInput.trim() || 'Guest Explorer';
    startGuestTrial(guestName);
    setIsTrialPromptOpen(false);
    if (onStartGuestTrial) {
      onStartGuestTrial();
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between items-center px-4 py-8 relative">
      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="font-semibold text-base text-white tracking-tight">
            Momentum
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[var(--text-secondary)] hover:text-white transition-colors"
            title="Appearance settings"
            aria-label="Theme settings"
          >
            <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-[var(--text-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-7 shadow-xl space-y-6"
        >
          {/* Card Title */}
          <div className="space-y-1 text-left">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Sign In
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Access your offline-ready event companion and network directory.
            </p>
          </div>

          {/* Guest Trial Option */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <h3 className="text-xs font-semibold text-white">
                    24-Hour Guest Trial
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Evaluate Momentum for today's event with offline capture and export capabilities.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTrialPromptOpen(true)}
              className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Launch Guest Session</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[var(--bg-surface-card)] px-2.5 text-[10px] uppercase tracking-wider font-mono text-[var(--text-secondary)]">
              Account Login
            </span>
          </div>

          {/* Offline Warning Banner */}
          {!isOnline && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline:</strong> Connect to authenticate. Cached sessions are preserved locally.
              </span>
            </div>
          )}

          {/* Success Banner */}
          <AnimatePresence>
            {resendSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl border bg-emerald-950/40 border-emerald-500/30 text-emerald-200 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Confirmation Email Sent</p>
                  <p className="text-[11px] opacity-90">{resendSuccessMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / Access Denied Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-xl border flex flex-col gap-2 text-xs leading-relaxed ${
                  isUnauthorized
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isUnauthorized ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 flex-1">
                    <p className="font-semibold">
                      {isUnauthorized ? 'Access Restricted' : 'Authentication Error'}
                    </p>
                    <p className="text-[11px] opacity-90">{errorMessage}</p>
                  </div>
                </div>

                {isUnconfirmed && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-white/50">Need a link?</span>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-lg text-[11px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isResending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Resend confirmation</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Biometric Quick Unlock */}
          {biometricInfo?.isRegistered && (
            <button
              type="button"
              onClick={handleBiometricQuickUnlock}
              disabled={isBioScanning}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isBioScanning ? 'Scanning Sensor...' : `Unlock with ${biometricInfo.biometricLabel}`}</span>
            </button>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div className="space-y-1">
              <label 
                htmlFor="owner-email-input"
                className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between"
              >
                <span>Email Address</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">Owner</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="owner-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@domain.com"
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label 
                htmlFor="owner-password-input"
                className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between"
              >
                <span>Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="owner-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-1 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Environment Indicator */}
          <div className="pt-2 border-t border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
              <Terminal className="w-3 h-3 opacity-60" />
              <span>Momentum Workspace</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center text-[11px] text-[var(--text-secondary)] py-2 z-10">
        <p>Momentum OS · Event Intelligence Terminal · Safe Sandbox Protected</p>
      </footer>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* 1-Day Trial Guest Activation Modal */}
      <AnimatePresence>
        {isTrialPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrialPromptOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl z-10 text-[var(--text-primary)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Start Guest Session
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">24-hour evaluation with local export</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTrialPromptOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleActivateGuestTrial} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Name or Alias
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      placeholder="e.g. Alex Rivers"
                      autoFocus
                      className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] focus:border-sky-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[var(--text-secondary)] text-[11px] leading-relaxed space-y-1">
                  <div className="font-medium text-white/90">Session Parameters:</div>
                  <ul className="space-y-0.5 text-[10px] text-white/70">
                    <li>• Active for 24 hours from activation</li>
                    <li>• 12MB isolated client storage quota</li>
                    <li>• 30MB client bandwidth transfer guardrail</li>
                    <li>• 1-click export to CSV and JSON anytime</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTrialPromptOpen(false)}
                    className="w-1/3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-sm"
                  >
                    Start Session
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
