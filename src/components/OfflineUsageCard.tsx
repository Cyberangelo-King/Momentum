import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Wifi, 
  HardDrive, 
  Users, 
  Camera, 
  Lightbulb, 
  ShieldCheck, 
  RefreshCw, 
  Download,
  Database,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Connection, Moment, Idea } from '../types';
import { syncManager } from '../services/syncManager';
import { getStorageMetrics, downloadEmergencyBackup } from '../services/contingencyService';
import { triggerHaptic } from '../services/haptics';

interface OfflineUsageCardProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  onOpenContingency?: () => void;
}

export const OfflineUsageCard: React.FC<OfflineUsageCardProps> = ({
  connections,
  moments,
  ideas,
  onOpenContingency,
}) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncState, setSyncState] = useState(syncManager.getState());
  const [storageInfo, setStorageInfo] = useState<{ usedMB: string; quotaMB: string; percentUsed: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = syncManager.subscribe((state) => {
      setSyncState(state);
    });

    getStorageMetrics().then(setStorageInfo);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  // Compute offline captured items
  // An item is considered offline-captured if explicitly flagged isOfflineCaptured OR if it was created during offline session / currently in sync queue
  const offlineConnections = connections.filter((c) => c.isOfflineCaptured);
  const offlineMoments = moments.filter((m) => m.isOfflineCaptured);
  const offlineIdeas = ideas.filter((i) => i.isOfflineCaptured);

  const totalOfflineCaptured = offlineConnections.length + offlineMoments.length + offlineIdeas.length;
  const totalLocalItems = connections.length + moments.length + ideas.length;

  const handleForceSync = async () => {
    triggerHaptic('light');
    setIsSyncing(true);
    const res = await syncManager.flushQueue();
    setIsSyncing(false);
    if (res.success) {
      setSyncToast('All local items synced successfully');
    } else {
      setSyncToast(res.error || 'Saved in local storage (will auto-sync when online)');
    }
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleDownloadBackup = () => {
    triggerHaptic('light');
    downloadEmergencyBackup();
  };

  return (
    <div className="bg-[#140b07] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5C00]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
            {isOnline ? <HardDrive className="w-5 h-5" /> : <WifiOff className="w-5 h-5 text-[#FF5C00]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#fadcd2] font-serif-display">
                Offline Usage & Local Storage
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                isOnline 
                  ? 'bg-[#25D366]/20 text-[#25D366]' 
                  : 'bg-[#FF5C00]/20 text-[#FF5C00]'
              }`}>
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                    <span>Cloud Ready</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse" />
                    <span>Offline Active</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#e4beb1]/70 mt-0.5">
              100% of your conference records are cached and protected locally on device.
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenContingency && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenContingency();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#221008] hover:bg-[#32160c] border border-white/10 text-[#fadcd2] text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Open Contingency & Backup Hub"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>Contingency</span>
            </button>
          )}

          <button
            onClick={handleDownloadBackup}
            className="p-2 rounded-xl bg-[#221008] hover:bg-[#32160c] border border-white/10 text-[#fadcd2] transition-colors"
            title="Download emergency JSON backup"
          >
            <Download className="w-4 h-4 text-[#ffb59a]" />
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="p-2.5 rounded-xl bg-[#0d2614] border border-[#25D366]/40 text-[#c7f8d6] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Offline Captured Total */}
        <div className="p-3 rounded-2xl bg-[#1d0e07] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase tracking-wider">
            <span>Offline Captures</span>
            <WifiOff className="w-3.5 h-3.5 text-[#FF5C00]" />
          </div>
          <p className="text-xl font-bold font-serif-display text-[#fadcd2]">
            {totalOfflineCaptured}
          </p>
          <p className="text-[10px] text-[#e4beb1]/50">
            {totalOfflineCaptured > 0 ? 'Saved with 0 Wi-Fi' : 'Offline ready'}
          </p>
        </div>

        {/* Total Locally Cached Items */}
        <div className="p-3 rounded-2xl bg-[#1d0e07] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase tracking-wider">
            <span>Local Database</span>
            <Database className="w-3.5 h-3.5 text-[#25D366]" />
          </div>
          <p className="text-xl font-bold font-serif-display text-[#fadcd2]">
            {totalLocalItems}
          </p>
          <p className="text-[10px] text-[#e4beb1]/50">
            {connections.length} people • {moments.length} snaps
          </p>
        </div>

        {/* Sync Queue / Pending */}
        <div className="p-3 rounded-2xl bg-[#1d0e07] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase tracking-wider">
            <span>Cloud Sync Queue</span>
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-[#FF5C00]' : 'text-[#ffb59a]'}`} />
          </div>
          <p className="text-xl font-bold font-serif-display text-[#fadcd2]">
            {syncState.pendingCount}
          </p>
          <p className="text-[10px] text-[#e4beb1]/50">
            {syncState.pendingCount > 0 ? 'Pending auto-push' : 'All records synced'}
          </p>
        </div>

        {/* Local Storage Footprint */}
        <div className="p-3 rounded-2xl bg-[#1d0e07] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#e4beb1]/60 text-[10px] font-bold uppercase tracking-wider">
            <span>Storage Size</span>
            <HardDrive className="w-3.5 h-3.5 text-[#ffb59a]" />
          </div>
          <p className="text-xl font-bold font-serif-display text-[#fadcd2]">
            {storageInfo ? `${storageInfo.usedMB} MB` : '< 1 MB'}
          </p>
          <p className="text-[10px] text-[#e4beb1]/50">
            {storageInfo ? `${storageInfo.percentUsed}% of local quota` : 'Optimized footprint'}
          </p>
        </div>
      </div>

      {/* Granular Offline Breakdown Bar */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#e4beb1]/70">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#FF5C00]" />
            <strong className="text-[#fadcd2]">{offlineConnections.length}</strong> offline contacts
          </span>
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#FF5C00]" />
            <strong className="text-[#fadcd2]">{offlineMoments.length}</strong> offline moments
          </span>
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#ffb59a]" />
            <strong className="text-[#fadcd2]">{offlineIdeas.length}</strong> offline insights
          </span>
        </div>

        {syncState.lastSyncedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#e4beb1]/50">
            <Clock className="w-3 h-3" />
            <span>Last sync: {syncState.lastSyncedAt}</span>
          </div>
        )}
      </div>
    </div>
  );
};
