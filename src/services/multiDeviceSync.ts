/**
 * Real-Time Multi-Device Synchronization & Auth Service
 * Ensures changes made on any phone, tablet, or desktop are instantly updated on all other devices.
 */

import { Connection, Moment, Idea, UserProfile, SecuritySettings } from '../types';

export interface MultiDeviceSyncState {
  deviceId: string;
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  remoteVersion: number;
  activeDevicesCount: number;
  error: string | null;
}

type SyncCallback = (data: {
  connections?: Connection[];
  moments?: Moment[];
  ideas?: Idea[];
  profile?: UserProfile;
  security?: SecuritySettings;
}) => void;

class MultiDeviceSyncEngine {
  private deviceId: string;
  private isConnected = false;
  private isSyncing = false;
  private lastSyncedAt: string | null = null;
  private remoteVersion = 1;
  private listeners: Set<SyncCallback> = new Set();
  private stateListeners: Set<(state: MultiDeviceSyncState) => void> = new Set();
  private eventSource: EventSource | null = null;
  private pollingTimer: number | null = null;
  private activeDevicesCount = 1;
  private error: string | null = null;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.setupNetworkListeners();
    this.startSyncStream();
  }

  private getOrCreateDeviceId(): string {
    const key = 'momentum_device_id_v1';
    let id = localStorage.getItem(key);
    if (!id) {
      const platform = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
      id = `${platform}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  private notifyStateChange() {
    const current = this.getStatus();
    this.stateListeners.forEach((fn) => fn(current));
  }

  public getStatus(): MultiDeviceSyncState {
    return {
      deviceId: this.deviceId,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isConnected: this.isConnected,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      remoteVersion: this.remoteVersion,
      activeDevicesCount: this.activeDevicesCount,
      error: this.error,
    };
  }

  public subscribeState(listener: (state: MultiDeviceSyncState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.getStatus());
    return () => this.stateListeners.delete(listener);
  }

  public onRemoteUpdate(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyStateChange();
        this.startSyncStream();
        this.pullLatestState();
      });
      window.addEventListener('offline', () => {
        this.isConnected = false;
        this.notifyStateChange();
      });
    }
  }

  /**
   * Starts Server-Sent Events stream for instant push from other devices
   */
  public startSyncStream() {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.error = null;
        this.notifyStateChange();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'SYNC_CONNECTED') {
            this.isConnected = true;
            this.remoteVersion = payload.version || this.remoteVersion;
            this.notifyStateChange();
          } else if (payload.type === 'SYNC_UPDATE') {
            // If the update originated from another device, apply it to the local app
            if (payload.originDevice !== this.deviceId && payload.data) {
              this.remoteVersion = payload.version;
              this.lastSyncedAt = payload.lastUpdatedAt || new Date().toISOString();
              this.listeners.forEach((fn) => fn(payload.data));
              this.notifyStateChange();
            }
          }
        } catch {
          // Ignore json parse error
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStateChange();
        // Setup fallback polling
        this.setupFallbackPolling();
      };
    } catch {
      this.setupFallbackPolling();
    }
  }

  private setupFallbackPolling() {
    if (this.pollingTimer) return;
    this.pollingTimer = window.setInterval(() => {
      if (navigator.onLine) {
        this.pullLatestState();
      }
    }, 4000);
  }

  /**
   * Pulls the absolute latest global state from the backend
   */
  public async pullLatestState(): Promise<{
    connections?: Connection[];
    moments?: Moment[];
    ideas?: Idea[];
    profile?: UserProfile;
    security?: SecuritySettings;
  } | null> {
    if (!navigator.onLine) return null;

    try {
      this.isSyncing = true;
      this.notifyStateChange();

      const response = await fetch('/api/sync/state');
      if (!response.ok) throw new Error('Sync fetch failed');

      const data = await response.json();
      if (data && data.data) {
        this.lastSyncedAt = data.lastUpdatedAt || new Date().toISOString();
        this.remoteVersion = data.version || this.remoteVersion;
        this.isConnected = true;
        this.error = null;

        // Notify listeners if valid data present
        if (data.data.connections || data.data.moments || data.data.ideas || data.data.profile) {
          this.listeners.forEach((fn) => fn(data.data));
        }

        return data.data;
      }
    } catch (err: any) {
      this.error = err?.message || 'Sync error';
    } finally {
      this.isSyncing = false;
      this.notifyStateChange();
    }
    return null;
  }

  /**
   * Pushes local mutations to all other devices in real-time
   */
  public async pushState(payload: {
    connections?: Connection[];
    moments?: Moment[];
    ideas?: Idea[];
    profile?: UserProfile;
    security?: SecuritySettings;
  }): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      this.isSyncing = true;
      this.notifyStateChange();

      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          ...payload,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        this.lastSyncedAt = resData.lastUpdatedAt || new Date().toISOString();
        this.remoteVersion = resData.version || this.remoteVersion;
        this.activeDevicesCount = resData.connectedDevicesCount || 1;
        this.isConnected = true;
        this.error = null;
        return true;
      }
    } catch (err: any) {
      this.error = err?.message || 'Push sync failed';
    } finally {
      this.isSyncing = false;
      this.notifyStateChange();
    }
    return false;
  }
}

export const multiDeviceSync = new MultiDeviceSyncEngine();
