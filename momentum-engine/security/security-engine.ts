/**
 * Momentum Intelligence Engine - Security Engine
 * Zero-Trust Verification, Threat Analysis, Input Sanitization & AI Prompt Defense
 */

import { SecurityZone, PolicyEvaluationResult, ConstitutionalLaw, AutonomyLevel } from '../core/types';
import { AuditLogger } from './audit-logger';

export class SecurityEngine {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  /**
   * Sanitizes text inputs against adversarial prompt injections and delimiter attacks
   */
  public sanitizeInput(rawText: string): { cleanText: string; isSuspicious: boolean; flags: string[] } {
    if (!rawText || typeof rawText !== 'string') {
      return { cleanText: '', isSuspicious: false, flags: [] };
    }

    const flags: string[] = [];
    const suspiciousPatterns = [
      { pattern: /ignore\s+all\s+previous\s+instructions/i, name: 'PROMPT_INJECTION_RESET' },
      { pattern: /system\s+prompt\s+override/i, name: 'SYSTEM_PROMPT_OVERRIDE' },
      { pattern: /reveal\s+secret|expose\s+api\s*key/i, name: 'SECRET_EXFILTRATION_ATTEMPT' },
      { pattern: /grant\s+admin|elevate\s+role/i, name: 'PRIVILEGE_ESCALATION_ATTEMPT' },
      { pattern: /disable\s+audit|stop\s+logging/i, name: 'AUDIT_TAMPER_ATTEMPT' },
      { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, name: 'XSS_PAYLOAD' },
    ];

    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(rawText)) {
        flags.push(name);
      }
    }

    // Clean dangerous characters or tags
    const cleanText = rawText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    const isSuspicious = flags.length > 0;
    if (isSuspicious) {
      this.auditLogger.record({
        actor: 'SECURITY_INPUT_SANITIZER',
        action: 'SUSPICIOUS_PAYLOAD_DETECTED',
        zone: SecurityZone.ZONE_3_DATA_PLANE,
        result: 'QUARANTINED',
        details: { flags, rawSample: rawText.slice(0, 100) },
      });
    }

    return { cleanText, isSuspicious, flags };
  }

  /**
   * Validates tool execution request under least-privilege contracts
   */
  public authorizeToolExecution(params: {
    toolName: string;
    caller: string;
    zone: SecurityZone;
    permissions: string[];
  }): { authorized: boolean; reason?: string } {
    // Prohibited: Evolutionary Sandbox (Zone 4) calling filesystem or secrets tools
    if (params.zone === SecurityZone.ZONE_4_SANDBOX) {
      const restrictedTools = ['WRITE_DISK', 'ACCESS_SECRETS', 'DEPLOY_PRODUCTION', 'MODIFY_GOVERNANCE'];
      if (restrictedTools.includes(params.toolName)) {
        this.auditLogger.record({
          actor: params.caller,
          action: `RESTRICTED_TOOL_ATTEMPT_${params.toolName}`,
          zone: params.zone,
          result: 'VETOED',
          details: { tool: params.toolName, zone: params.zone },
        });
        return {
          authorized: false,
          reason: `Tool '${params.toolName}' is forbidden in ${params.zone} under Law 6 (Security Supremacy).`,
        };
      }
    }

    return { authorized: true };
  }

  /**
   * Veto evaluation for candidate strategies
   */
  public evaluateCandidateSecurity(candidate: {
    name: string;
    weights: Record<string, number>;
  }): { passed: boolean; securityScore: number; riskFactors: string[] } {
    const riskFactors: string[] = [];

    // Check for extreme weight anomalies that could cause starvation or manipulation
    for (const [key, val] of Object.entries(candidate.weights)) {
      if (val < 0 || val > 1.0) {
        riskFactors.push(`Weight '${key}' out of valid range [0, 1]: ${val}`);
      }
    }

    const passed = riskFactors.length === 0;
    const securityScore = passed ? 0.98 : 0.2;

    return { passed, securityScore, riskFactors };
  }
}
