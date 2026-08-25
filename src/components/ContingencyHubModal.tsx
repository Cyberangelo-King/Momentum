import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Download, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  Database, 
  Zap, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  HardDrive,
  RefreshCw,
  Share2,
  Lock,
  Sparkles,
  Smartphone,
  Radio
} from 'lucide-react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../services/haptics';
import { useBatteryStatus } from '../hooks/useBatteryStatus';
import { 
  getNfcServiceEnabled, 
  setNfcServiceEnabled, 
  isWebNfcSupported 
} from '../services/nfcService';
import { 
  downloadEmergencyBackup, 
  createEmergencySnapshot, 
  getStoredSnapshots, 
  restoreFromSnapshot, 
  getStorageMetrics, 
  StorageSnapshot 
} from '../services/contingencyService';
import { syncManager } from '../services/syncManager';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { Connection } from '../types';

interface ContingencyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  isUltraPowerSaver: boolean;
  onToggleUltraPowerSaver: (enabled: boolean) => void;
  onReloadData: () => void;
}

export const ContingencyHubModal: React.FC<ContingencyHubModalProps> = ({
  isOpen,
  onClose,
  connections,
  isUltraPowerSaver,
  onToggleUltraPowerSaver,
  onReloadData,
}) => {
  const battery = useBatteryStatus();
  const [snapshots, setSnapshots] = useState<StorageSnapshot[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ usedMB: string; quotaMB: string; percentUsed: number } | null>(null);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [restoredSuccessMsg, setRestoredSuccessMsg] = useState<string | null>(null);
  const [syncState, setSyncState] = useState(syncManager.getState());
  const [isNfcEnabled, setIsNfcEnabled] = useState(getNfcServiceEnabled());

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getStoredSnapshots());
      getStorageMetrics().then(setStorageInfo);
      setSyncState(syncManager.getState());
      setIsNfcEnabled(getNfcServiceEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleNfc = (nextState: boolean) => {
    triggerHaptic('light');
    setIsNfcEnabled(nextState);
    setNfcServiceEnabled(nextState);
    setRestoredSuccessMsg(
      nextState
        ? 'Web-NFC scanner activated for attendee phone bumps'
        : 'Web-NFC scanner paused to conserve device battery'
    );
    setTimeout(() => setRestoredSuccessMsg(null), 3500);
  };

  const handleCreateSnapshot = () => {
    triggerHaptic('medium');
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      const snap = createEmergencySnapshot();
      setSnapshots(getStoredSnapshots());
      setIsCreatingSnapshot(false);
      setRestoredSuccessMsg(`Created snapshot (${snap.connectionsCount} connections)`);
      setTimeout(() => setRestoredSuccessMsg(null), 3500);
    }, 400);
  };

  const handleRestoreSnapshot = (snap: StorageSnapshot) => {
    const confirmed = window.confirm(
      `Restore snapshot from ${snap.timestamp} with ${snap.connectionsCount} connections? This will replace current unsaved drafts.`
    );
    if (confirmed) {
      triggerHaptic('medium');
      restoreFromSnapshot(snap);
      onReloadData();
      setRestoredSuccessMsg(`Restored snapshot from ${snap.timestamp}!`);
      setTimeout(() => setRestoredSuccessMsg(null), 3500);
    }
  };

  const handleDownloadBackup = () => {
    triggerHaptic('light');
    downloadEmergencyBackup();
  };

  const handleForceSync = async () => {
    triggerHaptic('light');
    await syncManager.flushQueue();
    setSyncState(syncManager.getState());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#140804] border border-[#FF5C00]/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#fadcd2]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#1b0c05]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif-display text-white">Event Contingency & Health Hub</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold uppercase tracking-wider">
                  Live Guard
                </span>
              </div>
              <p className="text-xs text-[#e4beb1]/70 mt-0.5">
                Safeguards for zero Wi-Fi, low battery, device crashes, and rapid backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#e4beb1]/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notification Banner */}
          {restoredSuccessMsg && (
            <div className="p-3 rounded-2xl bg-[#0d2614] border border-[#25D366]/40 text-[#c7f8d6] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
              <span>{restoredSuccessMsg}</span>
            </div>
          )}

          {/* Quick Health Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Network State */}
            <div className="p-3 rounded-2xl bg-[#1b0e08] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase">
                <span>Network</span>
                {navigator.onLine ? <Wifi className="w-3.5 h-3.5 text-[#25D366]" /> : <WifiOff className="w-3.5 h-3.5 text-[#FF5C00]" />}
              </div>
              <p className="text-xs font-bold text-[#fadcd2]">
                {navigator.onLine ? 'Online' : 'Offline Safe'}
              </p>
              <p className="text-[10px] text-[#e4beb1]/50 truncate">
                {navigator.onLine ? 'Syncing active' : 'Cached in LocalDB'}
              </p>
            </div>

            {/* Battery Status */}
            <div className="p-3 rounded-2xl bg-[#1b0e08] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase">
                <span>Battery</span>
                {battery.isCharging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-[#25D366]" />
                ) : (
                  <Battery className={`w-3.5 h-3.5 ${battery.isLowBattery ? 'text-[#FF5C00]' : 'text-[#e4beb1]'}`} />
                )}
              </div>
              <p className="text-xs font-bold text-[#fadcd2]">
                {battery.isSupported ? `${battery.percentage}%` : 'Normal'}
              </p>
              <p className="text-[10px] text-[#e4beb1]/50">
                {battery.isCharging ? 'Charging' : battery.isLowBattery ? 'Low Power' : 'Discharging'}
              </p>
            </div>

            {/* Storage Quota */}
            <div className="p-3 rounded-2xl bg-[#1b0e08] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase">
                <span>Local Storage</span>
                <HardDrive className="w-3.5 h-3.5 text-[#ffb59a]" />
              </div>
              <p className="text-xs font-bold text-[#fadcd2]">
                {storageInfo ? `${storageInfo.usedMB} MB` : 'Healthy'}
              </p>
              <p className="text-[10px] text-[#e4beb1]/50">
                {storageInfo ? `${storageInfo.percentUsed}% of ${storageInfo.quotaMB}MB` : 'Quota Safe'}
              </p>
            </div>

            {/* Supabase Status */}
            <div className="p-3 rounded-2xl bg-[#1b0e08] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase">
                <span>Cloud Sync</span>
                <Database className="w-3.5 h-3.5 text-[#FF5C00]" />
              </div>
              <p className="text-xs font-bold text-[#fadcd2]">
                {isSupabaseConfigured() ? 'Connected' : 'Local Ready'}
              </p>
              <p className="text-[10px] text-[#e4beb1]/50 truncate">
                {syncState.pendingCount > 0 ? `${syncState.pendingCount} pending` : 'All synced'}
              </p>
            </div>
          </div>

          {/* Section 1: Emergency One-Tap Backups */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1a0c06] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#fadcd2] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#FF5C00]" />
                  <span>Instant Emergency Backup</span>
                </h3>
                <p className="text-xs text-[#e4beb1]/70 mt-0.5">
                  Save a physical copy to your device disk in case your phone restarts or runs out of battery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownloadBackup}
                className="py-3 px-4 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 min-h-[44px]"
              >
                <Download className="w-4 h-4 fill-current" />
                <span>Download Full JSON Backup</span>
              </button>

              <button
                onClick={handleCreateSnapshot}
                disabled={isCreatingSnapshot}
                className="py-3 px-4 rounded-xl bg-[#281309] hover:bg-[#381a0d] text-[#fadcd2] font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2 min-h-[44px] active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-[#FF5C00]" />
                <span>{isCreatingSnapshot ? 'Creating Snapshot...' : 'Create Time Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Power Conservation Mode */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1a0c06] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUltraPowerSaver ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-[#FF5C00]/20 text-[#FF5C00]'}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#fadcd2]">Ultra Power Saver Mode</h3>
                  {isUltraPowerSaver && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#e4beb1]/70 mt-0.5">
                  Disables ambient blur animations and pauses non-critical polling to maximize battery on event floor.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onToggleUltraPowerSaver(!isUltraPowerSaver);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                isUltraPowerSaver
                  ? 'bg-[#25D366] text-black'
                  : 'bg-white/10 hover:bg-white/20 text-[#fadcd2]'
              }`}
            >
              {isUltraPowerSaver ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {/* Section 2.5: Global Web-NFC Hardware Toggle (Battery Conservation) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1a0c06] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isNfcEnabled ? 'bg-[#FF5C00]/20 text-[#FF5C00]' : 'bg-white/10 text-white/40'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#fadcd2]">Web-NFC Bump Scanner</h3>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isNfcEnabled ? 'bg-[#FF5C00]/20 text-[#ffb59a] border border-[#FF5C00]/30' : 'bg-white/10 text-white/50'
                  }`}>
                    {isNfcEnabled ? 'ACTIVE & LISTENING' : 'PAUSED (SAVING BATTERY)'}
                  </span>
                </div>
                <p className="text-xs text-[#e4beb1]/70 mt-0.5">
                  Allows physical phone-to-phone contact bumping. Turn off to preserve battery when not networking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleNfc(!isNfcEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                isNfcEnabled
                  ? 'bg-[#FF5C00] text-black hover:bg-[#ff7a33]'
                  : 'bg-white/10 hover:bg-white/20 text-[#fadcd2]'
              }`}
            >
              {isNfcEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Section 3: Time-Machine Rollback Snapshots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#FF5C00]" />
                <span>Recovery Snapshots ({snapshots.length})</span>
              </h3>
              <span className="text-[11px] text-[#e4beb1]/60">Auto-saved checkpoints</span>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#140804] border border-dashed border-white/10 text-center text-xs text-[#e4beb1]/60">
                No rollback snapshots yet. Click "Create Time Snapshot" above to create an instant restore checkpoint.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#1e0f08] border border-white/5 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#fadcd2]">Snapshot at {s.timestamp}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#ffb59a]">
                          {s.connectionsCount} connections • {s.momentsCount} moments
                        </span>
                      </div>
                      <p className="text-[10px] text-[#e4beb1]/50 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(s)}
                      className="px-3 py-1.5 rounded-lg bg-[#2c150b] hover:bg-[#FF5C00] hover:text-black text-xs font-bold text-[#ffb59a] transition-colors flex items-center gap-1.5"
                    >
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#1b0c05] flex items-center justify-between">
          <div className="text-xs text-[#e4beb1]/60">
            <span>Momentum OS Contingency Protocol v2.6</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#fadcd2] text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
