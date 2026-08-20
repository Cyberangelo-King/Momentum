import React, { useState } from 'react';
import { Lock, Unlock, Shield, KeyRound, Check, AlertCircle, Eye, EyeOff, UserCheck, X } from 'lucide-react';
import { SecuritySettings, UserProfile } from '../types';
import { updateSessionPin, saveSecuritySettings, getOwnerEmail } from '../services/authService';

interface SecurityLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  security: SecuritySettings;
  onSecurityUpdate: (newSettings: SecuritySettings) => void;
  profile: UserProfile;
}

export const SecurityLockModal: React.FC<SecurityLockModalProps> = ({
  isOpen,
  onClose,
  security,
  onSecurityUpdate,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'changePin'>('status');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const ownerEmail = getOwnerEmail();

  if (!isOpen) return null;

  const handleToggleLock = () => {
    const updated = {
      ...security,
      isLockEnabled: !security.isLockEnabled,
    };
    saveSecuritySettings(updated);
    onSecurityUpdate(updated);
    setSuccessMsg(updated.isLockEnabled ? 'Secondary screen privacy lock enabled' : 'Secondary screen privacy lock disabled');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPinInput.length < 4) {
      setErrorMsg('PIN must be at least 4 digits');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setErrorMsg('New PIN and confirmation do not match');
      return;
    }

    const updated = updateSessionPin(newPinInput);
    if (updated) {
      const refreshed = { ...security, isLockEnabled: true };
      onSecurityUpdate(refreshed);
      setSuccessMsg('Secondary PIN updated successfully!');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('status');
      }, 1500);
    } else {
      setErrorMsg('Failed to update PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#120906] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1a0c07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5C00] to-[#E62B1E] flex items-center justify-center text-black shadow-lg shadow-[#FF5C00]/20 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Secondary Privacy Lock
              </h2>
              <p className="text-xs text-[#e4beb1]/70">Optional in-session screen shade</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 p-2 bg-[#0c0503] border-b border-white/10 gap-1">
          <button
            onClick={() => {
              setActiveTab('status');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Lock Status
          </button>
          <button
            onClick={() => {
              setActiveTab('changePin');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'changePin'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Set Custom PIN
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Owner verification banner */}
          <div className="p-4 bg-[#1a0d08] border border-white/5 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Authenticated Owner</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                  Supabase Verified
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{profile.name}</p>
              <p className="text-xs text-white/50 font-mono truncate">{ownerEmail}</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'status' ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#1a0d08] border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {security.isLockEnabled ? (
                        <Lock className="w-4 h-4 text-[#FF5C00]" />
                      ) : (
                        <Unlock className="w-4 h-4 text-white/40" />
                      )}
                      In-Session Screen Lock
                    </h4>
                    <p className="text-xs text-[#e4beb1]/60">
                      Quickly shade your screen with a PIN when stepping away
                    </p>
                  </div>
                  <button
                    onClick={handleToggleLock}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      security.isLockEnabled ? 'bg-[#FF5C00]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        security.isLockEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#0c0503] border border-white/5 rounded-xl text-xs text-[#e4beb1]/60 space-y-1.5">
                <p className="font-semibold text-white">Security Model Note:</p>
                <p>
                  Primary security is enforced by <strong className="text-white">Supabase Auth</strong>. Only your verified owner account ({ownerEmail}) can access Momentum.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#e4beb1]">New 4-8 Digit PIN</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 4-8 digit PIN"
                    className="w-full bg-[#1a0d08] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF5C00] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-white/40 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#e4beb1]">Confirm PIN</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat new PIN"
                  className="w-full bg-[#1a0d08] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF5C00] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FF5C00] to-[#E62B1E] hover:from-[#ff7324] hover:to-[#FF5C00] text-black font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>Save New PIN</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#160a05] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
