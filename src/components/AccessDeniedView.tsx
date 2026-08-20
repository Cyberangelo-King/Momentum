import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, Lock, ArrowLeft, Terminal } from 'lucide-react';
import { logoutOwner, getOwnerEmail } from '../services/authService';
import { triggerHaptic } from '../services/haptics';

interface AccessDeniedViewProps {
  unauthorizedEmail?: string | null;
  onReturnToLogin: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  unauthorizedEmail,
  onReturnToLogin,
}) => {
  const configuredOwnerEmail = getOwnerEmail();

  const handleSignOut = async () => {
    triggerHaptic('medium');
    await logoutOwner();
    onReturnToLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#070403] text-[#fadcd2] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Red ambient warning background */}
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
          className="bg-[#120807]/95 border border-rose-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif-display">
              Access Denied
            </h1>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Momentum OS is a <strong className="text-white">single-owner private application</strong>. You have authenticated with an account that is not authorized for this workspace.
            </p>
          </div>

          {/* Account Detail Box */}
          <div className="p-4 bg-black/40 border border-rose-950 rounded-2xl text-left space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-white/50 text-[11px]">
              <span>Attempted Login:</span>
              <span className="text-rose-400 font-bold">Unauthorized</span>
            </div>
            <p className="text-rose-300 font-semibold truncate bg-rose-950/40 p-2 rounded-lg border border-rose-900/30">
              {unauthorizedEmail || 'Non-owner account'}
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-white/50 text-[11px]">
              <span>Authorized Owner:</span>
              <span className="text-[#FF5C00] font-mono">{configuredOwnerEmail}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Return to Login</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/40">
            <Terminal className="w-3 h-3 text-rose-400" />
            <span>Unauthorized sessions are immediately purged.</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center text-[11px] text-white/30 py-2 z-10">
        Momentum Security Engine · Zero Trust Architecture
      </footer>
    </div>
  );
};
