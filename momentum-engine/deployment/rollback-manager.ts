/**
 * Momentum Intelligence Engine - Rollback Manager & Emergency Kill Switches
 * Out-of-Band, Independent Circuit Breakers & State Restoration
 */

import { SecurityZone, AuditLogEntry } from '../core/types';
import { AuditLogger } from '../security/audit-logger';

export class RollbackManager {
  private static instance: RollbackManager;
  private auditLogger: AuditLogger;
  private killSwitches = {
    global: false,
    evolution: false,
    aiProxies: false,
    recommendations: false,
  };
  private snapshotHistory: Array<{ timestamp: number; snapshotId: string; stateDump: string }> = [];

  private constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  public static getInstance(): RollbackManager {
    if (!RollbackManager.instance) {
      RollbackManager.instance = new RollbackManager();
    }
    return RollbackManager.instance;
  }

  public setKillSwitch(switchName: keyof typeof this.killSwitches, state: boolean, actor: string = 'OPERATOR'): void {
    this.killSwitches[switchName] = state;
    this.auditLogger.record({
      actor,
      action: `KILL_SWITCH_${switchName.toUpperCase()}_SET_${state ? 'ACTIVATED' : 'DEACTIVATED'}`,
      zone: SecurityZone.ZONE_0_GOVERNANCE,
      result: 'ALLOWED',
      details: { switchName, state, timestamp: Date.now() },
    });
  }

  public getKillSwitches(): typeof this.killSwitches {
    return { ...this.killSwitches };
  }

  public takeSnapshot(state: Record<string, unknown>): string {
    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.snapshotHistory.unshift({
      timestamp: Date.now(),
      snapshotId,
      stateDump: JSON.stringify(state),
    });

    if (this.snapshotHistory.length > 20) {
      this.snapshotHistory.pop();
    }

    return snapshotId;
  }

  public rollbackToLatest(): { success: boolean; snapshotId?: string; state?: Record<string, unknown> } {
    if (this.snapshotHistory.length === 0) {
      return { success: false };
    }

    const latest = this.snapshotHistory[0];
    this.auditLogger.record({
      actor: 'ROLLBACK_MANAGER',
      action: 'EMERGENCY_ROLLBACK_EXECUTED',
      zone: SecurityZone.ZONE_0_GOVERNANCE,
      result: 'ALLOWED',
      details: { snapshotId: latest.snapshotId },
    });

    return {
      success: true,
      snapshotId: latest.snapshotId,
      state: JSON.parse(latest.stateDump),
    };
  }
}
