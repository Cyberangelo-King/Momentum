import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, ArrowRight, KeyRound, Sparkles, LogOut } from 'lucide-react';
import { SecuritySettings, UserProfile } from '../types';
import { verifySessionPin, setAppLockState } from '../services/authService';

interface LockScreenOverlayProps {
  isLocked: boolean;
  security: SecuritySettings;
  profile: UserProfile;
  onUnlock: () => void;
  onLogout?: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({
  isLocked,
  security,
  profile,
  onUnlock,
  onLogout,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isLocked) return null;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySessionPin(inputVal, security)) {
      setAppLockState(false);
      onUnlock();
      setInputVal('');
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/95 backdrop-blur-xl text-neutral-100 animate-fade-in">
      <div
        className={`w-full max-w-sm bg-[#120906] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Lock Graphic */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF5C00]/20 to-[#E62B1E]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00] shadow-lg shadow-[#FF5C00]/10">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-white font-serif-display">Privacy Lock Active</h2>
          <p className="text-xs text-[#e4beb1]/70">
            Workspace for <strong className="text-white">{profile.name}</strong>
          </p>
          <p className="text-[11px] font-mono text-white/40">{security.authorizedEmail}</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="password"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN Passcode"
              autoFocus
              className={`w-full bg-[#1c0d08] border ${
                error ? 'border-rose-500 text-rose-300' : 'border-white/15 text-white focus:border-[#FF5C00]'
              } rounded-2xl px-4 py-3.5 text-center text-base tracking-widest placeholder-white/20 focus:outline-none transition-colors font-mono`}
            />
            {error && (
              <p className="text-xs text-rose-400 font-medium">
                Incorrect PIN passcode.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#FF5C00] to-[#E62B1E] hover:from-[#ff7324] hover:to-[#FF5C00] text-black font-bold rounded-2xl text-sm transition-all shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Workspace</span>
          </button>
        </form>

        {/* Logout Option */}
        {onLogout && (
          <div className="pt-2 border-t border-white/5 text-center">
            <button
              onClick={onLogout}
              className="text-xs text-white/40 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Full Supabase Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
