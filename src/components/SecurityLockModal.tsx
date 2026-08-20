import React, { useState } from 'react';
import { Lock, Unlock, Shield, KeyRound, Check, AlertCircle, Eye, EyeOff, UserCheck, X } from 'lucide-react';
import { SecuritySettings, UserProfile } from '../types';
import { updatePin, verifyPinOrOwner, saveSecuritySettings } from '../services/authService';

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
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleLock = () => {
    const updated = {
      ...security,
      isLockEnabled: !security.isLockEnabled,
    };
    saveSecuritySettings(updated);
    onSecurityUpdate(updated);
    setSuccessMsg(updated.isLockEnabled ? 'Privacy lock enabled for Angelo' : 'Privacy lock disabled');
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

    const updated = updatePin(newPinInput);
    if (updated) {
      const refreshed = { ...security, isLockEnabled: true };
      onSecurityUpdate(refreshed);
      setSuccessMsg('Security PIN updated successfully!');
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
      <div className="relative w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Privacy & Access Lock
              </h2>
              <p className="text-xs text-neutral-400">Exclusive access for Angelo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 p-2 bg-[#0F0F0F] border-b border-neutral-800 gap-1">
          <button
            onClick={() => {
              setActiveTab('status');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'status'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Access Security
          </button>
          <button
            onClick={() => {
              setActiveTab('changePin');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'changePin'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Update Passcode
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Owner verification banner */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Authorized Owner</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                  Verified
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-200">{profile.name} (Angelo)</p>
              <p className="text-xs text-neutral-400 font-mono truncate">{security.authorizedEmail}</p>
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
              <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {security.isLockEnabled ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Unlock className="w-4 h-4 text-neutral-400" />
                      )}
                      Privacy Passcode Protection
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Require PIN or email verification to view private notes & outreach
                    </p>
                  </div>
                  <button
                    onClick={handleToggleLock}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      security.isLockEnabled ? 'bg-[#FF4D00]' : 'bg-neutral-700'
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

              <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-xs text-neutral-400 space-y-1.5">
                <p className="font-semibold text-neutral-300">Default Recovery Credential:</p>
                <p>
                  Your app can always be unlocked with your email: <strong className="text-white font-mono">{security.authorizedEmail}</strong> or default event PIN <strong className="text-[#FF6B26] font-mono">2026</strong>.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">New 4-Digit Passcode</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 4-8 digit PIN"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF4D00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Confirm Passcode</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat new PIN"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FF4D00] to-[#E62B1E] hover:from-[#FF6B26] hover:to-[#FF4D00] text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#FF4D00]/20 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Save New PIN</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#141414] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
