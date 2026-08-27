/**
 * Momentum Intelligence Engine - Safety Engine
 * Human Welfare, Harm Mitigation, Anti-Addiction & Psychological Guardrails
 */

import { SecurityZone, AuditLogEntry } from '../core/types';
import { AuditLogger } from '../security/audit-logger';

export class SafetyEngine {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  /**
   * Evaluates text or notifications for dark patterns, fake urgency, and psychological coercion
   */
  public evaluateEngagementSafety(payload: {
    text: string;
    notificationFrequencyPerHour?: number;
    hasArtificialUrgency?: boolean;
  }): { isSafe: boolean; safetyScore: number; violations: string[] } {
    const violations: string[] = [];
    const lower = (payload.text || '').toLowerCase();

    // Anti-Addiction / Coercion Checks
    if (payload.notificationFrequencyPerHour && payload.notificationFrequencyPerHour > 4) {
      violations.push('EXCESSIVE_NOTIFICATION_FREQUENCY_COERCION');
    }

    const urgencyPatterns = [
      'act right now or lose everything',
      'limited time only! click immediately',
      'you will regret missing this',
      'urgent warning: your profile is decaying',
    ];

    for (const pattern of urgencyPatterns) {
      if (lower.includes(pattern)) {
        violations.push(`MANIPULATIVE_URGENCY_PATTERN: "${pattern}"`);
      }
    }

    const isSafe = violations.length === 0;
    const safetyScore = isSafe ? 1.0 : Math.max(0.1, 1.0 - violations.length * 0.3);

    if (!isSafe) {
      this.auditLogger.record({
        actor: 'SAFETY_ENGINE',
        action: 'SAFETY_GUARDRAIL_TRIGGERED',
        zone: SecurityZone.ZONE_1_CONTROL_PLANE,
        result: 'VETOED',
        details: { violations, safetyScore },
      });
    }

    return { isSafe, safetyScore, violations };
  }

  /**
   * Safety verification for evolutionary candidate strategies
   */
  public evaluateCandidateSafety(candidate: {
    weights: {
      noveltyExploration: number;
      trustWeight: number;
    };
  }): { passed: boolean; safetyScore: number; concerns: string[] } {
    const concerns: string[] = [];

    // Ensure trust weight is never zeroed out (prevent unverified Sybil inundation)
    if (candidate.weights.trustWeight < 0.1) {
      concerns.push('Trust weight too low (<0.10) risking unverified content explosion.');
    }

    // Ensure novelty does not completely override evidence
    if (candidate.weights.noveltyExploration > 0.8) {
      concerns.push('Novelty exploration too high (>0.80) causing unstable user experience.');
    }

    const passed = concerns.length === 0;
    const safetyScore = passed ? 0.99 : 0.4;

    return { passed, safetyScore, concerns };
  }
}
