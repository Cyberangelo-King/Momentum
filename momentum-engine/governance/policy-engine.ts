/**
 * Momentum Intelligence Engine - Deterministic Policy Engine
 * The Gatekeeper with Supreme Veto Powers across Security, Safety, Privacy, and Human Oversight
 */

import {
  SecurityZone,
  AutonomyLevel,
  ConstitutionalLaw,
  PolicyEvaluationResult,
} from '../core/types';
import { MomentumConstitution } from './constitution';
import { AuditLogger } from '../security/audit-logger';

export interface PolicyEvaluationRequest {
  actor: string;
  sourceZone: SecurityZone;
  targetZone: SecurityZone;
  actionType: string;
  autonomyLevel: AutonomyLevel;
  candidatePayload?: Record<string, unknown>;
  hasHumanApproval?: boolean;
}

export class PolicyEngine {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  /**
   * Deterministic Policy Evaluation with absolute veto supremacy
   */
  public evaluate(req: PolicyEvaluationRequest): PolicyEvaluationResult {
    const auditId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 1. Immutable Constitutional Invariants Check
    const constCheck = MomentumConstitution.evaluateConstitutionalInvariants({
      actor: req.actor,
      targetZone: req.targetZone,
      requestedAutonomy: req.autonomyLevel,
      modifiesGovernance: req.targetZone === SecurityZone.ZONE_0_GOVERNANCE,
      modifiesSecurity: req.actionType.includes('SECURITY_OVERRIDE') || req.actionType.includes('DISABLE_SECURITY'),
      escalatesPrivilege: req.actionType.includes('ESCALATE_PRIVILEGE') || req.actionType.includes('GRANT_PERMISSION'),
      disablesRollback: req.actionType.includes('DISABLE_ROLLBACK'),
      disablesAudit: req.actionType.includes('DISABLE_AUDIT'),
      bypassesConsent: req.actionType.includes('BYPASS_CONSENT'),
    });

    if (!constCheck.allowed) {
      this.auditLogger.record({
        actor: req.actor,
        action: req.actionType,
        zone: req.sourceZone,
        result: 'VETOED',
        details: {
          reason: constCheck.reason,
          law: constCheck.violatedLaw,
          targetZone: req.targetZone,
        },
      });

      return {
        allowed: false,
        vetoLaw: constCheck.violatedLaw,
        vetoReason: constCheck.reason,
        vetoZone: req.targetZone,
        riskScore: 1.0,
        requiredAutonomy: req.autonomyLevel,
        requiresHumanApproval: true,
        auditId,
      };
    }

    // 2. Zone Boundary Crossing Checks (Zero Trust)
    // Sandbox (Zone 4) CANNOT write directly to Control Plane (Zone 1) or Governance (Zone 0)
    if (req.sourceZone === SecurityZone.ZONE_4_SANDBOX) {
      if (req.targetZone === SecurityZone.ZONE_0_GOVERNANCE || req.targetZone === SecurityZone.ZONE_1_CONTROL_PLANE) {
        this.auditLogger.record({
          actor: req.actor,
          action: req.actionType,
          zone: req.sourceZone,
          result: 'VETOED',
          details: { reason: 'Sandbox (Zone 4) cannot write directly to Zone 0/1 without canary gate progression.' },
        });

        return {
          allowed: false,
          vetoLaw: ConstitutionalLaw.LAW_6_SECURITY,
          vetoReason: 'Sandbox boundary violation: Zone 4 artifacts cannot directly mutate Zone 0 or Zone 1.',
          vetoZone: req.targetZone,
          riskScore: 0.95,
          requiredAutonomy: AutonomyLevel.LEVEL_5_HUMAN_APPROVAL,
          requiresHumanApproval: true,
          auditId,
        };
      }
    }

    // 3. Autonomy Level Gate
    if (req.autonomyLevel >= AutonomyLevel.LEVEL_5_HUMAN_APPROVAL && !req.hasHumanApproval) {
      this.auditLogger.record({
        actor: req.actor,
        action: req.actionType,
        zone: req.sourceZone,
        result: 'ESCALATED',
        details: { reason: 'Action requires explicit human operator confirmation.' },
      });

      return {
        allowed: false,
        vetoLaw: ConstitutionalLaw.LAW_11_HUMAN_OVERSIGHT,
        vetoReason: 'Action requires explicit human operator confirmation before execution.',
        riskScore: 0.7,
        requiredAutonomy: req.autonomyLevel,
        requiresHumanApproval: true,
        auditId,
      };
    }

    // 4. Action Permitted & Audited
    this.auditLogger.record({
      actor: req.actor,
      action: req.actionType,
      zone: req.sourceZone,
      result: 'ALLOWED',
      details: { targetZone: req.targetZone, autonomy: req.autonomyLevel },
    });

    return {
      allowed: true,
      riskScore: 0.05,
      requiredAutonomy: req.autonomyLevel,
      requiresHumanApproval: false,
      auditId,
    };
  }
}
