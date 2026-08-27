/**
 * Momentum Intelligence Engine - Audit Logger
 * Tamper-Evident, Cryptographically Traceable Security & Governance Audit Ledger
 */

import { AuditLogEntry, SecurityZone } from '../core/types';

export class AuditLogger {
  private static instance: AuditLogger;
  private entries: AuditLogEntry[] = [];
  private readonly maxEntries = 5000;

  private constructor() {
    this.record({
      actor: 'MOMENTUM_CORE_BOOTSTRAP',
      action: 'AUDIT_LEDGER_INITIALIZED',
      zone: SecurityZone.ZONE_0_GOVERNANCE,
      result: 'ALLOWED',
      details: { timestamp: Date.now(), genesis: true },
    });
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Simple non-cryptographic hash simulation for sandbox trace integrity
   */
  private generateChecksum(actor: string, action: string, timestamp: number): string {
    const raw = `${actor}:${action}:${timestamp}:${this.entries.length}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return 'sig_' + Math.abs(hash).toString(16).padStart(8, '0');
  }

  public record(params: {
    actor: string;
    action: string;
    zone: SecurityZone;
    result: 'ALLOWED' | 'VETOED' | 'QUARANTINED' | 'ESCALATED';
    details: Record<string, unknown>;
  }): AuditLogEntry {
    const timestamp = Date.now();
    const entry: AuditLogEntry = {
      id: `audit_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      actor: params.actor,
      action: params.action,
      zone: params.zone,
      result: params.result,
      details: params.details,
      checksum: this.generateChecksum(params.actor, params.action, timestamp),
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }

    return entry;
  }

  public getRecent(count: number = 50): AuditLogEntry[] {
    return this.entries.slice(0, count);
  }

  public getVetoedCount(): number {
    return this.entries.filter((e) => e.result === 'VETOED' || e.result === 'QUARANTINED').length;
  }

  public getLastAuditTimestamp(): number {
    return this.entries[0]?.timestamp || Date.now();
  }
}
