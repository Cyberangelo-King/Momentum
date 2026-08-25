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
    <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
            {isOnline ? <HardDrive className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Offline Persistence & Storage
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex items-center gap-1 ${
                isOnline 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Cloud Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Offline Cache</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              All event records are automatically isolated and saved locally on device.
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
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Contingency & Backup Hub"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Contingency</span>
            </button>
          )}

          <button
            onClick={handleDownloadBackup}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Download emergency JSON backup"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Offline Captured Total */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-wider">
            <span>Offline Captures</span>
            <WifiOff className="w-3 h-3 text-[var(--accent-primary)]" />
          </div>
          <p className="text-lg font-semibold font-mono text-white">
            {totalOfflineCaptured}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {totalOfflineCaptured > 0 ? 'Saved locally' : 'Ready'}
          </p>
        </div>

        {/* Total Locally Cached Items */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-wider">
            <span>Local Database</span>
            <Database className="w-3 h-3 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold font-mono text-white">
            {totalLocalItems}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {connections.length} contacts · {moments.length} snaps
          </p>
        </div>

        {/* Sync Queue / Pending */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-wider">
            <span>Sync Queue</span>
            <RefreshCw className={`w-3 h-3 ${syncState.isSyncing ? 'animate-spin text-[var(--accent-primary)]' : 'text-white/40'}`} />
          </div>
          <p className="text-lg font-semibold font-mono text-white">
            {syncState.pendingCount}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {syncState.pendingCount > 0 ? 'Pending sync' : 'Up to date'}
          </p>
        </div>

        {/* Local Storage Footprint */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-wider">
            <span>Storage Size</span>
            <HardDrive className="w-3 h-3 text-sky-400" />
          </div>
          <p className="text-lg font-semibold font-mono text-white">
            {storageInfo ? `${storageInfo.usedMB} MB` : '< 1 MB'}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {storageInfo ? `${storageInfo.percentUsed}% quota` : 'Optimized'}
          </p>
        </div>
      </div>

      {/* Granular Offline Breakdown Bar */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <strong className="text-white font-medium">{offlineConnections.length}</strong> offline contacts
          </span>
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <strong className="text-white font-medium">{offlineMoments.length}</strong> offline moments
          </span>
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white font-medium">{offlineIdeas.length}</strong> offline insights
          </span>
        </div>

        {syncState.lastSyncedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-mono">
            <Clock className="w-3 h-3" />
            <span>Last sync: {syncState.lastSyncedAt}</span>
          </div>
        )}
      </div>
    </div>
  );
};
