import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { SecuritySettings, UserProfile } from '../types';
import { verifyPinOrOwner, setAppLockState } from '../services/authService';

interface LockScreenOverlayProps {
  isLocked: boolean;
  security: SecuritySettings;
  profile: UserProfile;
  onUnlock: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({
  isLocked,
  security,
  profile,
  onUnlock,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isLocked) return null;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPinOrOwner(inputVal, security)) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A] backdrop-blur-xl text-neutral-100 animate-fade-in">
      <div
        className={`w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Lock Graphic */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF4D00]/20 to-[#E62B1E]/20 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF6B26] shadow-lg shadow-[#FF4D00]/10">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-white">Momentum Locked</h2>
          <p className="text-xs text-neutral-400">
            Exclusive workspace for <strong className="text-white">{profile.name}</strong>
          </p>
          <p className="text-[11px] font-mono text-neutral-500">{security.authorizedEmail}</p>
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
              placeholder="Enter PIN or Owner Email"
              autoFocus
              className={`w-full bg-neutral-900 border ${
                error ? 'border-rose-500 text-rose-300' : 'border-neutral-700 text-white focus:border-[#FF4D00]'
              } rounded-2xl px-4 py-3.5 text-center text-base tracking-widest placeholder-neutral-600 focus:outline-none transition-colors font-mono`}
            />
            {error && (
              <p className="text-xs text-rose-400 font-medium">
                Incorrect PIN. (Default: 2026 or use your email)
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#FF4D00] to-[#E62B1E] hover:from-[#FF6B26] hover:to-[#FF4D00] text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-[#FF4D00]/20 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Workspace</span>
          </button>
        </form>

        {/* Quick hint for Angelo */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-neutral-500">
            Default event PIN: <strong className="text-neutral-300 font-mono">2026</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
