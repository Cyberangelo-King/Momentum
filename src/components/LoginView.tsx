import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { loginWithOwnerCredentials, getOwnerEmail } from '../services/authService';
import { triggerHaptic } from '../services/haptics';

interface LoginViewProps {
  onLoginSuccess: () => void;
  unauthorizedAttemptEmail?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  unauthorizedAttemptEmail,
}) => {
  const configuredOwnerEmail = getOwnerEmail();
  const [email, setEmail] = useState<string>(configuredOwnerEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    unauthorizedAttemptEmail
      ? `Access Denied: Account (${unauthorizedAttemptEmail}) is not the designated owner of this Momentum instance.`
      : null
  );
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(Boolean(unauthorizedAttemptEmail));
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsUnauthorized(false);

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

  return (
    <div className="min-h-screen w-full bg-[#070403] text-[#fadcd2] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden selection:bg-[#FF5C00] selection:text-black">
      {/* Subtle Background Glows */}
      <div 
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true"
        className="absolute bottom-10 right-10 w-80 h-80 bg-[#E62B1E]/5 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Top Header Badge */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5C00] to-[#E62B1E] flex items-center justify-center text-black font-black text-sm shadow-md shadow-[#FF5C00]/20">
            M
          </div>
          <span className="font-serif-display font-bold text-lg text-white tracking-tight">
            Momentum <span className="text-[#FF5C00] text-xs font-mono font-normal">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#e4beb1]/80">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF5C00]" />
          <span>SECURITY V1</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-[#120906]/90 border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6"
        >
          {/* Card Title & Icon */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5C00]/20 to-[#E62B1E]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00] shadow-lg shadow-[#FF5C00]/10">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white font-serif-display">
                Private Workspace
              </h1>
              <p className="text-xs text-[#e4beb1]/70 max-w-xs mx-auto">
                Single-owner terminal for <strong className="text-white">TEDxAkure 2026</strong>. Enter credentials to authenticate.
              </p>
            </div>
          </div>

          {/* Offline Warning Banner */}
          {!isOnline && (
            <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-amber-200">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline:</strong> Connect to internet to authenticate. If already logged in on this device, refresh will restore your cached session.
              </span>
            </div>
          )}

          {/* Error / Access Denied Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                  isUnauthorized
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    : 'bg-[#260f08] border-[#FF5C00]/40 text-[#ffc5b2]'
                }`}
              >
                {isUnauthorized ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold">
                    {isUnauthorized ? 'Access Denied' : 'Authentication Error'}
                  </p>
                  <p className="text-[11px] opacity-90">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="owner-email-input"
                className="text-xs font-semibold text-[#e4beb1] flex items-center justify-between"
              >
                <span>Owner Email</span>
                <span className="text-[10px] text-[#FF5C00] font-mono">Single Owner</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
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
                  placeholder="faithakinboyejo@gmail.com"
                  className="w-full bg-[#1c0d08] border border-white/10 focus:border-[#FF5C00] rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="owner-password-input"
                className="text-xs font-semibold text-[#e4beb1] flex items-center justify-between"
              >
                <span>Supabase Password</span>
                <span className="text-[10px] text-white/40 font-mono">Encrypted</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
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
                  className="w-full bg-[#1c0d08] border border-white/10 focus:border-[#FF5C00] rounded-2xl pl-10 pr-11 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
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
              className="w-full py-4 bg-gradient-to-r from-[#FF5C00] to-[#E62B1E] hover:from-[#ff7324] hover:to-[#FF5C00] text-black font-bold rounded-2xl text-sm transition-all shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Authenticating Owner...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Momentum</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & No Public Registration Notice */}
          <div className="pt-2 border-t border-white/5 space-y-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#e4beb1]/60">
              <Terminal className="w-3 h-3 text-[#FF5C00]" />
              <span>Public Registration: <strong>DISABLED</strong></span>
            </div>
            <p className="text-[10px] text-white/30 leading-normal max-w-xs mx-auto">
              All attendee contacts, voice transcripts, memories, and conference insights are strictly isolated and private to the verified owner.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer System Status */}
      <footer className="w-full max-w-md text-center text-[11px] text-white/40 py-2 z-10">
        <p>Momentum OS · TEDxAkure 2026 · Confidential & Proprietary</p>
      </footer>
    </div>
  );
};
