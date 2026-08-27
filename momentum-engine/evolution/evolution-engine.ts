/**
 * Momentum Intelligence Engine - Governed Evolution Engine
 * Manages Mutation, Recombination, Lineage Tracking & Controlled Promotion
 */

import { CandidateStrategy, SecurityZone, AutonomyLevel } from '../core/types';
import { SandboxRunner } from '../sandbox/sandbox-runner';
import { PolicyEngine } from '../governance/policy-engine';
import { AuditLogger } from '../security/audit-logger';

export class EvolutionEngine {
  private sandboxRunner: SandboxRunner;
  private policyEngine: PolicyEngine;
  private auditLogger: AuditLogger;
  private candidatePool: Map<string, CandidateStrategy> = new Map();
  private champion: CandidateStrategy;
  private isEvolutionSuspended: boolean = false;

  constructor() {
    this.sandboxRunner = new SandboxRunner();
    this.policyEngine = new PolicyEngine();
    this.auditLogger = AuditLogger.getInstance();

    this.champion = {
      id: 'strat_champion_v1',
      name: 'Momentum Multi-Objective Baseline',
      version: '1.0.0',
      generation: 1,
      mutationType: 'POLICY_ADAPTATION',
      weights: {
        personalFit: 0.35,
        trustWeight: 0.30,
        contextRelevance: 0.20,
        noveltyExploration: 0.15,
        evidenceThreshold: 0.40,
      },
      fitness: {
        userValueScore: 0.88,
        trustCalibration: 0.92,
        efficiencyScore: 0.95,
        safetyScore: 1.0,
        securityScore: 1.0,
        overallFitness: 0.91,
      },
      status: 'CHAMPION',
      lineageHistory: ['genesis_1.0.0'],
      createdAt: Date.now(),
    };

    this.candidatePool.set(this.champion.id, this.champion);
  }

  public setEvolutionSuspension(suspended: boolean): void {
    this.isEvolutionSuspended = suspended;
    this.auditLogger.record({
      actor: 'OPERATOR',
      action: suspended ? 'EVOLUTION_ENGINE_SUSPENDED' : 'EVOLUTION_ENGINE_RESUMED',
      zone: SecurityZone.ZONE_0_GOVERNANCE,
      result: 'ALLOWED',
      details: { timestamp: Date.now() },
    });
  }

  /**
   * Generates a new candidate via mutation of the current champion's weights
   */
  public generateCandidateMutation(): CandidateStrategy | null {
    if (this.isEvolutionSuspended) {
      return null;
    }

    const nextGen = this.champion.generation + 1;
    const mutate = (val: number) => {
      const delta = (Math.random() - 0.5) * 0.1; // +/- 5% perturbation
      return Math.max(0.1, Math.min(0.6, Number((val + delta).toFixed(3))));
    };

    const newWeights = {
      personalFit: mutate(this.champion.weights.personalFit),
      trustWeight: mutate(this.champion.weights.trustWeight),
      contextRelevance: mutate(this.champion.weights.contextRelevance),
      noveltyExploration: Math.max(0.05, Math.min(0.3, mutate(this.champion.weights.noveltyExploration))),
      evidenceThreshold: mutate(this.champion.weights.evidenceThreshold),
    };

    // Normalize weights
    const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(newWeights) as Array<keyof typeof newWeights>) {
      newWeights[k] = Number((newWeights[k] / sum).toFixed(3));
    }

    const candidate: CandidateStrategy = {
      id: `cand_gen${nextGen}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Adaptive Strategy Gen ${nextGen}`,
      version: `1.${nextGen}.0-cand`,
      parentId: this.champion.id,
      generation: nextGen,
      mutationType: 'WEIGHT_MUTATION',
      weights: newWeights,
      fitness: {
        userValueScore: 0,
        trustCalibration: 0,
        efficiencyScore: 0,
        safetyScore: 0,
        securityScore: 0,
        overallFitness: 0,
      },
      status: 'SANDBOXED',
      lineageHistory: [...this.champion.lineageHistory, `gen_${nextGen}`],
      createdAt: Date.now(),
    };

    // 1. Run in Sandbox Isolation
    const sim = this.sandboxRunner.runSimulation(candidate);
    if (!sim.passed) {
      candidate.status = 'REJECTED';
      this.candidatePool.set(candidate.id, candidate);
      return candidate;
    }

    candidate.fitness = {
      userValueScore: sim.userValueScore,
      trustCalibration: sim.trustCalibration,
      efficiencyScore: sim.efficiencyScore,
      safetyScore: sim.safetyScore,
      securityScore: sim.securityScore,
      overallFitness: sim.overallFitness,
    };

    candidate.status = 'EVALUATING';
    this.candidatePool.set(candidate.id, candidate);

    return candidate;
  }

  /**
   * Promotes a candidate to champion only if it passes all policy gates and outperforms the current champion
   */
  public promoteCandidate(candidateId: string, hasHumanApproval: boolean = false): {
    promoted: boolean;
    reason?: string;
    newChampion?: CandidateStrategy;
  } {
    const candidate = this.candidatePool.get(candidateId);
    if (!candidate) return { promoted: false, reason: 'Candidate not found.' };

    // Gate 1: Check Policy Engine
    const policyResult = this.policyEngine.evaluate({
      actor: 'EVOLUTION_ENGINE_PROMOTER',
      sourceZone: SecurityZone.ZONE_4_SANDBOX,
      targetZone: SecurityZone.ZONE_2_INTELLIGENCE,
      actionType: 'PROMOTION_TO_CHAMPION',
      autonomyLevel: AutonomyLevel.LEVEL_4_AUTO_PROMOTION,
      hasHumanApproval,
    });

    if (!policyResult.allowed) {
      return { promoted: false, reason: `Policy Veto: ${policyResult.vetoReason}` };
    }

    // Gate 2: Fitness must beat champion by at least 1.5%
    if (candidate.fitness.overallFitness <= this.champion.fitness.overallFitness + 0.015) {
      return {
        promoted: false,
        reason: `Insufficient fitness margin (${candidate.fitness.overallFitness} vs Champion ${this.champion.fitness.overallFitness}).`,
      };
    }

    // Success: Retain previous champion in lineage
    this.champion.status = 'RETIRED';
    candidate.status = 'CHAMPION';
    this.champion = candidate;

    this.auditLogger.record({
      actor: 'EVOLUTION_ENGINE',
      action: 'NEW_CHAMPION_STRATEGY_PROMOTED',
      zone: SecurityZone.ZONE_1_CONTROL_PLANE,
      result: 'ALLOWED',
      details: { championId: candidate.id, fitness: candidate.fitness },
    });

    return { promoted: true, newChampion: this.champion };
  }

  public getChampion(): CandidateStrategy {
    return this.champion;
  }

  public getAllCandidates(): CandidateStrategy[] {
    return Array.from(this.candidatePool.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
}
