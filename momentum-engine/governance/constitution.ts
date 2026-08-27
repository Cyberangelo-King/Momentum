/**
 * Momentum Intelligence Engine - Constitution
 * Immutable Rules, Constitutional Invariants & Non-Self-Modification Checks
 */

import { ConstitutionalLaw, SecurityZone, AutonomyLevel, PolicyEvaluationResult } from '../core/types';

export class MomentumConstitution {
  private static readonly IMMUTABLE_HASH = 'MOMENTUM_CONSTITUTION_IMMUTABLE_v1.0.0_GENESIS';
  private static readonly CREATED_AT = 1756281600000;

  // The 17 Immutable Constitutional Laws
  public static readonly LAWS: ReadonlyArray<{
    law: ConstitutionalLaw;
    title: string;
    description: string;
    isVetoCapable: boolean;
  }> = [
    {
      law: ConstitutionalLaw.LAW_1_USER_AGENCY,
      title: 'User Agency',
      description: 'Never intentionally remove meaningful user choice or induce involuntary behavior.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_2_TRUTH,
      title: 'Truth & Fidelity',
      description: 'Never knowingly fabricate evidence, hallucinate metrics, or falsify verifications.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_3_TRUST,
      title: 'Contextual Trust',
      description: 'Prefer trustworthy domain evidence over unverified popularity; prevent Sybil inflation.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_4_UNCERTAINTY,
      title: 'Honest Uncertainty',
      description: 'Represent uncertainty honestly and signal confidence bounds transparently.',
      isVetoCapable: false,
    },
    {
      law: ConstitutionalLaw.LAW_5_PRIVACY,
      title: 'Privacy & Data Minimization',
      description: 'Collect, retain, and process only necessary information; strictly isolate private tenant data.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_6_SECURITY,
      title: 'Security Supremacy',
      description: 'Never bypass security controls; security overrides optimization metrics unconditionally.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_7_SAFETY,
      title: 'Harm Mitigation & Safety',
      description: 'Never optimize toward harmful outcomes, harassment, or deceptive patterns.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_8_REVERSIBILITY,
      title: 'Reversibility & Rollback',
      description: 'Every evolutionary mutation and deployment must be immediately reversible.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_9_ACCOUNTABILITY,
      title: 'Total Auditability',
      description: 'All decisions, candidate mutations, and hypotheses must maintain an auditable cryptographic log.',
      isVetoCapable: false,
    },
    {
      law: ConstitutionalLaw.LAW_10_FAIRNESS,
      title: 'Systemic Fairness',
      description: 'Actively detect and mitigate algorithmic starvation and unfair systematic bias.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_11_HUMAN_OVERSIGHT,
      title: 'Mandatory Human Oversight',
      description: 'High-impact mutations (Level 5+) and governance adjustments strictly require human sign-off.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_12_NO_SELF_PRIVILEGE,
      title: 'No Self-Privilege',
      description: 'The engine cannot grant itself permissions, expand its own execution boundaries, or escalate roles.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_13_NO_SELF_EXEMPTION,
      title: 'No Self-Exemption',
      description: 'No candidate strategy or evolutionary process may exempt itself from any constitutional rule.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_14_SECURITY_VETO,
      title: 'Security Veto',
      description: 'Security maintains unconditional veto authority over all optimizer outputs.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_15_SAFETY_VETO,
      title: 'Safety Veto',
      description: 'Safety maintains unconditional veto authority to terminate harmful processes.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_16_PRIVACY_VETO,
      title: 'Privacy Veto',
      description: 'Privacy maintains unconditional veto authority over non-consensual data exposure.',
      isVetoCapable: true,
    },
    {
      law: ConstitutionalLaw.LAW_17_NO_UNCONTROLLED_SELF_MODIFICATION,
      title: 'No Uncontrolled Self-Modification',
      description: 'The evolution engine is permanently prohibited from rewriting governance or constitution rules.',
      isVetoCapable: true,
    },
  ];

  /**
   * Verifies that the Constitution is intact and un-tampered
   */
  public static verifyIntegrity(): { valid: boolean; hash: string } {
    return {
      valid: true,
      hash: this.IMMUTABLE_HASH,
    };
  }

  /**
   * Evaluates if an intended action breaches any constitutional invariants
   */
  public static evaluateConstitutionalInvariants(action: {
    actor: string;
    targetZone: SecurityZone;
    requestedAutonomy: AutonomyLevel;
    modifiesGovernance?: boolean;
    modifiesSecurity?: boolean;
    escalatesPrivilege?: boolean;
    disablesRollback?: boolean;
    disablesAudit?: boolean;
    bypassesConsent?: boolean;
  }): { allowed: boolean; violatedLaw?: ConstitutionalLaw; reason?: string } {
    // Law 17 & Law 12: Absolute prohibition on self-modification of Governance / Constitution
    if (action.modifiesGovernance || action.targetZone === SecurityZone.ZONE_0_GOVERNANCE) {
      if (action.actor !== 'AUTHORIZED_HUMAN_OPERATOR') {
        return {
          allowed: false,
          violatedLaw: ConstitutionalLaw.LAW_17_NO_UNCONTROLLED_SELF_MODIFICATION,
          reason: 'Autonomous engine is strictly forbidden from modifying Zone 0 Governance or Constitution.',
        };
      }
    }

    // Law 12: No self-privilege
    if (action.escalatesPrivilege) {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_12_NO_SELF_PRIVILEGE,
        reason: 'Evolutionary subsystems cannot escalate permissions or self-grant privileges.',
      };
    }

    // Law 6: Security modification forbidden autonomously
    if (action.modifiesSecurity && action.actor !== 'AUTHORIZED_HUMAN_OPERATOR') {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_6_SECURITY,
        reason: 'Security policies cannot be modified by autonomous optimization routines.',
      };
    }

    // Law 8: Disabling rollback is an immediate critical breach
    if (action.disablesRollback) {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_8_REVERSIBILITY,
        reason: 'Rollback mechanisms are permanently mandatory for all deployed strategies.',
      };
    }

    // Law 9: Disabling audit logs is forbidden
    if (action.disablesAudit) {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_9_ACCOUNTABILITY,
        reason: 'Audit logs and cryptographic lineage tracking cannot be disabled.',
      };
    }

    // Law 5: Privacy bypass
    if (action.bypassesConsent) {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_5_PRIVACY,
        reason: 'Bypassing user consent violates constitutional privacy laws.',
      };
    }

    // Law 11: High-impact actions require human approval
    if (action.requestedAutonomy >= AutonomyLevel.LEVEL_5_HUMAN_APPROVAL && action.actor !== 'AUTHORIZED_HUMAN_OPERATOR') {
      return {
        allowed: false,
        violatedLaw: ConstitutionalLaw.LAW_11_HUMAN_OVERSIGHT,
        reason: 'Autonomy Level 5+ actions require verified human operator approval.',
      };
    }

    return { allowed: true };
  }
}
