import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SyncState, Connection, Moment, Idea } from '../types';
import { syncManager } from '../services/syncManager';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface SyncStatusBadgeProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  connections,
  moments,
  ideas,
}) => {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (syncState.isSyncing) return;
    const res = await syncManager.syncAllNow(connections, moments, ideas);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onClick={handleManualSync}
        disabled={syncState.isSyncing}
        title={
          !configured
            ? 'Supabase credentials not configured'
            : !syncState.isOnline
            ? 'Offline - changes stored locally and will sync when connected'
            : `Click to sync with Supabase cloud (Last: ${syncState.lastSyncedAt || 'Just now'})`
        }
        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
          !syncState.isOnline
            ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            : syncState.isSyncing
            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            : configured
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
        }`}
      >
        {syncState.isSyncing ? (
          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
        ) : !syncState.isOnline ? (
          <CloudOff className="w-3 h-3 text-rose-400" />
        ) : configured ? (
          <Cloud className="w-3 h-3 text-emerald-400" />
        ) : (
          <Cloud className="w-3 h-3 text-neutral-500" />
        )}

        <span className="truncate max-w-[110px] sm:max-w-none">
          {!syncState.isOnline
            ? 'Offline (Local)'
            : syncState.isSyncing
            ? 'Syncing...'
            : configured
            ? 'Cloud Synced'
            : 'Local Ready'}
        </span>

        {syncState.pendingCount > 0 && (
          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded-full font-mono">
            {syncState.pendingCount}
          </span>
        )}
      </button>

      {/* Popover feedback notice */}
      {feedback && (
        <div className="absolute top-8 right-0 z-50 p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl text-neutral-200 text-xs whitespace-nowrap animate-fade-in flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
