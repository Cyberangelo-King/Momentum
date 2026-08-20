import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Shield, 
  KeyRound, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserCheck, 
  X,
  Fingerprint,
  ScanFace,
  Trash2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { SecuritySettings, UserProfile } from '../types';
import { updateSessionPin, saveSecuritySettings, getOwnerEmail } from '../services/authService';
import { 
  checkBiometricAvailability, 
  registerDeviceBiometrics, 
  authenticateWithBiometrics, 
  removeBiometricCredential,
  setBiometricEnabledState,
  BiometricAvailability 
} from '../services/biometricService';

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
  const [activeTab, setActiveTab] = useState<'status' | 'biometrics' | 'changePin'>('status');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [biometricInfo, setBiometricInfo] = useState<BiometricAvailability | null>(null);
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);

  const ownerEmail = getOwnerEmail();

  // Load biometric status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkBiometricAvailability().then(setBiometricInfo);
    }
  }, [isOpen, activeTab]);

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

  const handleToggleBiometrics = (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    const updated: SecuritySettings = {
      ...security,
      isBiometricEnabled: enabled,
    };
    saveSecuritySettings(updated);
    onSecurityUpdate(updated);
    if (biometricInfo) {
      setBiometricInfo({ ...biometricInfo, isEnabled: enabled });
    }
    setSuccessMsg(enabled ? 'Biometric unlock enabled' : 'Biometric unlock disabled');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleRegisterBiometrics = async () => {
    setIsRegisteringBio(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await registerDeviceBiometrics();
      if (res.success && res.credentialId) {
        const updated: SecuritySettings = {
          ...security,
          isBiometricEnabled: true,
          biometricCredentialId: res.credentialId,
        };
        saveSecuritySettings(updated);
        onSecurityUpdate(updated);
        const refreshedBio = await checkBiometricAvailability();
        setBiometricInfo(refreshedBio);
        setSuccessMsg(`Device biometrics (${refreshedBio.biometricLabel}) registered successfully!`);
      } else {
        setErrorMsg(res.error || 'Failed to register biometric credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Biometric registration failed.');
    } finally {
      setIsRegisteringBio(false);
    }
  };

  const handleTestBiometrics = async () => {
    setIsTestingBio(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authenticateWithBiometrics();
      if (res.success) {
        setSuccessMsg('Biometric verification passed! Hardware credentials valid.');
      } else if (!res.cancelled) {
        setErrorMsg(res.error || 'Biometric verification failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Biometric test failed.');
    } finally {
      setIsTestingBio(false);
    }
  };

  const handleRemoveBiometrics = () => {
    removeBiometricCredential();
    const updated: SecuritySettings = {
      ...security,
      isBiometricEnabled: false,
      biometricCredentialId: null,
    };
    saveSecuritySettings(updated);
    onSecurityUpdate(updated);
    checkBiometricAvailability().then(setBiometricInfo);
    setSuccessMsg('Biometric credential removed from this device.');
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
      <div className="relative w-full max-w-md bg-[#120906] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1a0c07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5C00] to-[#E62B1E] flex items-center justify-center text-black shadow-lg shadow-[#FF5C00]/20 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Device & Privacy Security
              </h2>
              <p className="text-xs text-[#e4beb1]/70">Biometrics & Screen Lock Settings</p>
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
        <div className="grid grid-cols-3 p-2 bg-[#0c0503] border-b border-white/10 gap-1">
          <button
            onClick={() => {
              setActiveTab('status');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'status'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Lock Status
          </button>
          <button
            onClick={() => {
              setActiveTab('biometrics');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
              activeTab === 'biometrics'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Biometrics</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('changePin');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'changePin'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Custom PIN
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Owner verification banner */}
          <div className="p-3.5 bg-[#1a0d08] border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Owner Account</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                  Supabase Verified
                </span>
              </div>
              <p className="text-xs text-white/60 font-mono truncate">{ownerEmail}</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1a0d08] border border-white/5 rounded-2xl space-y-3">
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
                      Quickly shade screen with PIN / Biometrics when away
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

              {/* Biometric quick summary */}
              <div className="p-4 bg-[#1a0d08] border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    Biometrics ({biometricInfo?.biometricLabel || 'FaceID/TouchID'})
                  </h4>
                  <p className="text-[11px] text-[#e4beb1]/60">
                    {biometricInfo?.isRegistered ? 'Paired to this device' : 'Not paired on this browser'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('biometrics')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Configure
                </button>
              </div>

              <div className="p-3 bg-[#0c0503] border border-white/5 rounded-2xl text-xs text-[#e4beb1]/60 space-y-1.5">
                <p className="font-semibold text-white">Security Model Note:</p>
                <p>
                  Primary gatekeeping is handled via <strong className="text-white">Supabase Auth</strong>. Biometrics and PIN serve as an instant hardware security layer on this device.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BIOMETRICS (WebAuthn / Credential API) */}
          {activeTab === 'biometrics' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1a0d08] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {biometricInfo?.biometricLabel || 'Device Biometrics'}
                    </h4>
                    <p className="text-xs text-[#e4beb1]/70">
                      WebAuthn Platform Authenticator
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#e4beb1]/60 space-y-1 pt-1 border-t border-white/5">
                  <div className="flex justify-between py-1">
                    <span>WebAuthn API:</span>
                    <span className="font-mono text-white">
                      {biometricInfo?.isSupported ? 'Supported' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Hardware Sensor:</span>
                    <span className="font-mono text-white">
                      {biometricInfo?.hasPlatformAuthenticator ? 'Detected' : 'Not detected / Simulator'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Registration State:</span>
                    <span className={`font-mono ${biometricInfo?.isRegistered ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {biometricInfo?.isRegistered ? 'Paired' : 'Unregistered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                {!biometricInfo?.isRegistered ? (
                  <button
                    type="button"
                    onClick={handleRegisterBiometrics}
                    disabled={isRegisteringBio}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{isRegisteringBio ? 'Scanning Sensor...' : `Pair Device ${biometricInfo?.biometricLabel || 'Biometrics'}`}</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-[#1a0d08] border border-white/5 rounded-2xl">
                      <span className="text-xs font-semibold text-white">Enable Biometric Screen Unlock</span>
                      <button
                        onClick={() => handleToggleBiometrics(!biometricInfo.isEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          biometricInfo.isEnabled ? 'bg-emerald-500' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            biometricInfo.isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleTestBiometrics}
                        disabled={isTestingBio}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Test Scan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveBiometrics}
                        className="py-2.5 px-3 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unpair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PIN */}
          {activeTab === 'changePin' && (
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
