import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Connection, Moment, Idea, SyncQueueItem, SyncState } from '../types';
import { syncConnectionsToSupabase, syncMomentsToSupabase, syncIdeasToSupabase } from './supabaseSync';

const QUEUE_STORAGE_KEY = 'momentum_offline_queue_v1';
const LAST_SYNC_STORAGE_KEY = 'momentum_last_synced_at_v1';

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private autoSyncInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.lastSyncedAt = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
      
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Periodic background sync attempt every 45s when online
      this.autoSyncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing && isSupabaseConfigured()) {
          this.flushQueue();
        }
      }, 45000);
    }
  }

  public getState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.getQueue().length,
      lastSyncedAt: this.lastSyncedAt,
      error: this.lastError,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('Sync listener notification error:', err);
      }
    });
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.lastError = null;
    this.notify();
    // Immediate flush when transitioning from offline to online
    this.flushQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  public getQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setQueue(queue: SyncQueueItem[]): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to write sync queue', e);
    }
    this.notify();
  }

  /**
   * Enqueue an entity for syncing to Supabase.
   * Deduplicates queue by replacing any existing pending item with the same ID.
   */
  public enqueue(entityType: 'connection' | 'moment' | 'idea', action: 'upsert' | 'delete', payload: any): void {
    const queue = this.getQueue();
    const itemId = payload.id;

    // Filter out previous queued action for the same item to prevent redundant network calls
    const filtered = queue.filter((q) => !(q.entityType === entityType && q.id === itemId));

    filtered.push({
      id: itemId,
      entityType,
      action,
      payload,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });

    this.setQueue(filtered);

    // If online, immediately trigger sync
    if (this.isOnline && isSupabaseConfigured() && !this.isSyncing) {
      this.flushQueue();
    }
  }

  /**
   * Process all queued items and synchronize full local state to Supabase without duplicates
   */
  public async flushQueue(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, syncedCount: 0, error: 'Supabase is not configured' };
    }

    if (this.isSyncing) {
      return { success: false, syncedCount: 0, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    const queue = this.getQueue();
    let processedCount = 0;

    try {
      // 1. Process queued single deletions if any
      const deletions = queue.filter((q) => q.action === 'delete');
      const client = getSupabaseClient();
      if (client && deletions.length > 0) {
        for (const item of deletions) {
          const tableName = item.entityType === 'connection' ? 'connections' : item.entityType === 'moment' ? 'moments' : 'ideas';
          await client.from(tableName).delete().eq('id', item.id);
          processedCount++;
        }
      }

      // 2. Perform safe batch sync from storage to guarantee deduplication and data integrity
      const connectionsData = localStorage.getItem('momentum_connections_v1');
      const momentsData = localStorage.getItem('momentum_moments_v1');
      const ideasData = localStorage.getItem('momentum_ideas_v1');

      if (connectionsData) {
        const connections: Connection[] = JSON.parse(connectionsData);
        // Only sync active (non-trash or as marked)
        await syncConnectionsToSupabase(connections);
      }

      if (momentsData) {
        const moments: Moment[] = JSON.parse(momentsData);
        await syncMomentsToSupabase(moments);
      }

      if (ideasData) {
        const ideas: Idea[] = JSON.parse(ideasData);
        await syncIdeasToSupabase(ideas);
      }

      // Clear the processed queue
      this.setQueue([]);
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.lastSyncedAt = now;
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);
      
      this.isSyncing = false;
      this.notify();
      return { success: true, syncedCount: processedCount || queue.length };
    } catch (err: any) {
      this.lastError = err?.message || 'Sync failed';
      this.isSyncing = false;
      this.notify();
      return { success: false, syncedCount: 0, error: this.lastError };
    }
  }

  /**
   * Manual Force Sync triggered by user button in UI
   */
  public async syncAllNow(connections: Connection[], moments: Moment[], ideas: Idea[]): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      return { success: false, message: 'You are currently offline. Changes are saved locally and will sync when reconnected.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase credentials are not configured in environment variables.' };
    }

    this.isSyncing = true;
    this.notify();

    try {
      await Promise.all([
        syncConnectionsToSupabase(connections),
        syncMomentsToSupabase(moments),
        syncIdeasToSupabase(ideas),
      ]);

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.lastSyncedAt = now;
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);
      this.setQueue([]);
      this.isSyncing = false;
      this.notify();
      return { success: true, message: `Successfully synchronized with Supabase at ${now}` };
    } catch (err: any) {
      this.isSyncing = false;
      this.lastError = err?.message || 'Sync error';
      this.notify();
      return { success: false, message: `Sync failed: ${this.lastError}` };
    }
  }
}

export const syncManager = new SyncManager();
