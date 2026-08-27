/**
 * Momentum Intelligence Engine - Controlled Experiment Engine
 * Manages A/B Cohorts, Champion vs. Challenger Trials & Metric Tracking
 */

import { Experiment } from '../core/types';
import { AuditLogger } from '../security/audit-logger';

export class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map();
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  public launchExperiment(params: {
    hypothesisId: string;
    name: string;
    description: string;
    championStrategyId: string;
    challengerStrategyId: string;
    allocationPercent?: number;
  }): Experiment {
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const exp: Experiment = {
      id,
      hypothesisId: params.hypothesisId,
      name: params.name,
      description: params.description,
      controlCohort: 'COHORT_A_CHAMPION',
      treatmentCohort: 'COHORT_B_CHALLENGER',
      championStrategyId: params.championStrategyId,
      challengerStrategyId: params.challengerStrategyId,
      allocationPercent: params.allocationPercent || 5,
      metrics: {
        userValueDelta: 0,
        trustDelta: 0,
        latencyDeltaMs: 0,
        errorDelta: 0,
      },
      sampleSize: 0,
      status: 'RUNNING',
      startedAt: Date.now(),
    };

    this.experiments.set(id, exp);
    this.auditLogger.record({
      actor: 'EXPERIMENT_ENGINE',
      action: 'EXPERIMENT_LAUNCHED',
      zone: 1 as any, // Zone 1 Control Plane
      result: 'ALLOWED',
      details: { expId: id, name: exp.name, canaryPercent: exp.allocationPercent },
    });

    return exp;
  }

  public recordTrialResult(expId: string, result: {
    isTreatment: boolean;
    userValueDelta: number;
    trustDelta: number;
    latencyMs: number;
    errorOccurred: boolean;
  }): Experiment | undefined {
    const exp = this.experiments.get(expId);
    if (!exp || exp.status !== 'RUNNING') return undefined;

    exp.sampleSize += 1;
    if (result.isTreatment) {
      exp.metrics.userValueDelta = Number((exp.metrics.userValueDelta * 0.9 + result.userValueDelta * 0.1).toFixed(3));
      exp.metrics.trustDelta = Number((exp.metrics.trustDelta * 0.9 + result.trustDelta * 0.1).toFixed(3));
      if (result.errorOccurred) {
        exp.metrics.errorDelta += 1;
      }
    }

    return exp;
  }

  public concludeExperiment(expId: string, verdict: Experiment['verdict']): Experiment | undefined {
    const exp = this.experiments.get(expId);
    if (!exp) return undefined;

    exp.status = 'CONCLUDED';
    exp.concludedAt = Date.now();
    exp.verdict = verdict;

    this.auditLogger.record({
      actor: 'EXPERIMENT_ENGINE',
      action: 'EXPERIMENT_CONCLUDED',
      zone: 1 as any,
      result: 'ALLOWED',
      details: { expId, verdict, sampleSize: exp.sampleSize },
    });

    return exp;
  }

  public getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter((e) => e.status === 'RUNNING');
  }

  public getAll(): Experiment[] {
    return Array.from(this.experiments.values()).sort((a, b) => b.startedAt - a.startedAt);
  }
}
