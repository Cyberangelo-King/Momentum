/**
 * Notification Service for Momentum OS
 * Handles Web Notifications API permissions, scheduling, and local reminders for follow-ups.
 */

import { Connection } from '../types';
import { triggerHaptic } from './haptics';

const STORAGE_KEY_NOTIFS = 'momentum_notifications_enabled';
const STORAGE_KEY_SCHEDULED = 'momentum_scheduled_reminders';

export interface ScheduledReminder {
  connectionId: string;
  connectionName: string;
  reminderTimestamp: number;
  message?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private checkIntervalId: any = null;

  private constructor() {
    if (typeof window !== 'undefined' && this.isEnabled() && this.getPermissionStatus() === 'granted') {
      this.startReminderChecker();
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Checks if browser supports the Web Notification API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Returns the current Notification permission state
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Checks if notifications are explicitly toggled on by user preference in Momentum
   */
  public isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY_NOTIFS) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Requests permission from the browser and updates user preference
   */
  public async requestPermission(): Promise<{ granted: boolean; status: NotificationPermission }> {
    if (!this.isSupported()) {
      return { granted: false, status: 'denied' };
    }

    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === 'granted';
      
      if (isGranted) {
        this.setEnabled(true);
        this.startReminderChecker();
        triggerHaptic('success');
      } else {
        this.setEnabled(false);
      }

      return { granted: isGranted, status: permission };
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return { granted: false, status: this.getPermissionStatus() };
    }
  }

  /**
   * Toggles notification state in localStorage
   */
  public setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, enabled ? 'true' : 'false');
      if (enabled && this.getPermissionStatus() === 'granted') {
        this.startReminderChecker();
      } else if (!enabled) {
        this.stopReminderChecker();
      }
    } catch (e) {
      console.warn('Failed to save notification preference', e);
    }
  }

  /**
   * Sends an immediate or scheduled notification
   */
  public sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
      data?: any;
    }
  ): boolean {
    if (!this.isSupported() || this.getPermissionStatus() !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        body: options?.body || 'You have a pending follow-up action in Momentum.',
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag || 'momentum-reminder',
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      triggerHaptic('light');
      return true;
    } catch (err) {
      console.warn('Failed to dispatch notification:', err);
      return false;
    }
  }

  /**
   * Sends an instant test notification
   */
  public sendTestNotification(): boolean {
    return this.sendNotification('Momentum • Reminders Active ⚡', {
      body: 'Notifications are connected! You will receive tactical reminders for your high-priority TEDxAkure connections.',
      tag: 'momentum-test-' + Date.now(),
    });
  }

  /**
   * Dispatches follow-up reminder for a specific connection
   */
  public notifyFollowUpDue(connection: Connection): boolean {
    return this.sendNotification(`Follow-up Due: ${connection.name}`, {
      body: `${connection.profession || 'Connection'} • ${connection.company || 'TEDxAkure'} \n"${connection.notes?.slice(0, 80) || 'Action item pending'}"`,
      tag: `followup-${connection.id}`,
    });
  }

  /**
   * Schedules a reminder in local state to trigger at a future time
   */
  public scheduleReminder(connection: Connection, delayMinutes: number): void {
    if (typeof window === 'undefined') return;
    try {
      const existing: ScheduledReminder[] = this.getScheduledReminders();
      const targetTime = Date.now() + delayMinutes * 60 * 1000;
      
      const newReminder: ScheduledReminder = {
        connectionId: connection.id,
        connectionName: connection.name,
        reminderTimestamp: targetTime,
        message: `Follow up with ${connection.name} (${connection.profession || 'Contact'})`,
      };

      const filtered = existing.filter((r) => r.connectionId !== connection.id);
      filtered.push(newReminder);
      localStorage.setItem(STORAGE_KEY_SCHEDULED, JSON.stringify(filtered));

      // Also set a browser timeout if tab stays open
      setTimeout(() => {
        if (this.isEnabled() && this.getPermissionStatus() === 'granted') {
          this.notifyFollowUpDue(connection);
        }
      }, delayMinutes * 60 * 1000);
    } catch (err) {
      console.warn('Failed to schedule reminder', err);
    }
  }

  public getScheduledReminders(): ScheduledReminder[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCHEDULED);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private startReminderChecker(): void {
    if (this.checkIntervalId) return;
    // Check every 60 seconds for due scheduled reminders
    this.checkIntervalId = setInterval(() => {
      this.processDueReminders();
    }, 60 * 1000);
  }

  private stopReminderChecker(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  private processDueReminders(): void {
    if (typeof window === 'undefined' || !this.isEnabled() || this.getPermissionStatus() !== 'granted') return;
    try {
      const now = Date.now();
      const reminders = this.getScheduledReminders();
      const pending = reminders.filter((r) => r.reminderTimestamp <= now);
      const remaining = reminders.filter((r) => r.reminderTimestamp > now);

      if (pending.length > 0) {
        pending.forEach((r) => {
          this.sendNotification(`Reminder: ${r.connectionName}`, {
            body: r.message || `Time to follow up with ${r.connectionName}`,
            tag: `scheduled-${r.connectionId}-${now}`,
          });
        });
        localStorage.setItem(STORAGE_KEY_SCHEDULED, JSON.stringify(remaining));
      }
    } catch (e) {
      console.warn('Error processing reminders', e);
    }
  }
}

export const notificationService = NotificationService.getInstance();
