import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, Lock, ArrowLeft, Terminal, Sparkles, Clock } from 'lucide-react';
import { logoutOwner, getOwnerEmail } from '../services/authService';
import { startGuestTrial } from '../services/trialService';
import { triggerHaptic } from '../services/haptics';

interface AccessDeniedViewProps {
  unauthorizedEmail?: string | null;
  onReturnToLogin: () => void;
  onStartGuestTrial?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  unauthorizedEmail,
  onReturnToLogin,
  onStartGuestTrial,
}) => {
  const configuredOwnerEmail = getOwnerEmail();

  const handleSignOut = async () => {
    triggerHaptic('medium');
    await logoutOwner();
    onReturnToLogin();
  };

  const handleLaunchTrial = async () => {
    triggerHaptic('success');
    await logoutOwner();
    const guestLabel = unauthorizedEmail ? unauthorizedEmail.split('@')[0] : 'Guest';
    startGuestTrial(guestLabel);
    if (onStartGuestTrial) {
      onStartGuestTrial();
    } else {
      onReturnToLogin();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Ambient warning background */}
      <div 
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-black text-sm">
            !
          </div>
          <span className="font-serif-display font-bold text-lg text-white tracking-tight">
            Momentum <span className="text-rose-500 text-xs font-mono font-normal">SECURITY</span>
          </span>
        </div>

        <div className="px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-[11px] font-mono text-rose-300">
          ACCESS BLOCKED
        </div>
      </header>

      {/* Main Warning Card */}
      <main className="w-full max-w-md my-auto py-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--bg-surface-card)] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-5"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif-display">
              Owner Authorization Required
            </h1>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Master storage is restricted to the verified single owner.
            </p>
          </div>

          {/* Account Detail Box */}
          <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl text-left space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-white/50 text-[11px]">
              <span>Signed-In Account:</span>
              <span className="text-rose-400 font-bold">Non-Owner</span>
            </div>
            <p className="text-rose-300 font-semibold truncate bg-rose-950/40 p-2 rounded-lg border border-rose-900/30">
              {unauthorizedEmail || 'Non-owner account'}
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-white/50 text-[11px]">
              <span>Authorized Owner:</span>
              <span className="text-[var(--accent-primary)] font-mono">{configuredOwnerEmail}</span>
            </div>
          </div>

          {/* 1-Day Trial Option */}
          <div className="p-3.5 rounded-2xl bg-sky-950/50 border border-sky-500/30 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Want to test Momentum for today's event?</span>
            </div>
            <p className="text-[11px] text-sky-200/70 leading-normal">
              You can start a safe 24-Hour Guest Trial with dedicated bandwidth and storage guardrails.
            </p>
            <button
              type="button"
              onClick={handleLaunchTrial}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 text-black font-bold text-xs shadow-md transition-all hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Launch 24-Hour Free Event Trial</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Return to Login</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/40">
            <Terminal className="w-3 h-3 text-[var(--accent-primary)]" />
            <span>Master database is isolated from trial environments.</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center text-[11px] text-white/30 py-2 z-10">
        Momentum Security Engine · Safe Sandbox Protected
      </footer>
    </div>
  );
};
