/**
 * Momentum Intelligence Engine - Sandbox Runner
 * Isolated Simulation Environment for Experimental Strategy Candidates
 * Guarantees zero filesystem, zero secrets, and zero production database authority.
 */

import { CandidateStrategy, SecurityZone } from '../core/types';
import { SecurityEngine } from '../security/security-engine';
import { SafetyEngine } from '../safety/safety-engine';

export class SandboxRunner {
  private securityEngine: SecurityEngine;
  private safetyEngine: SafetyEngine;

  constructor() {
    this.securityEngine = new SecurityEngine();
    this.safetyEngine = new SafetyEngine();
  }

  /**
   * Runs candidate in isolated mock simulation against historical synthetic benchmarks
   */
  public runSimulation(candidate: CandidateStrategy): {
    passed: boolean;
    userValueScore: number;
    trustCalibration: number;
    efficiencyScore: number;
    safetyScore: number;
    securityScore: number;
    overallFitness: number;
    vetoReason?: string;
  } {
    // 1. Security check
    const secCheck = this.securityEngine.evaluateCandidateSecurity({
      name: candidate.name,
      weights: candidate.weights,
    });
    if (!secCheck.passed) {
      return {
        passed: false,
        userValueScore: 0,
        trustCalibration: 0,
        efficiencyScore: 0,
        safetyScore: 0,
        securityScore: secCheck.securityScore,
        overallFitness: 0,
        vetoReason: `Security Gate Veto: ${secCheck.riskFactors.join('; ')}`,
      };
    }

    // 2. Safety check
    const safetyCheck = this.safetyEngine.evaluateCandidateSafety({
      weights: {
        noveltyExploration: candidate.weights.noveltyExploration,
        trustWeight: candidate.weights.trustWeight,
      },
    });
    if (!safetyCheck.passed) {
      return {
        passed: false,
        userValueScore: 0,
        trustCalibration: 0,
        efficiencyScore: 0,
        safetyScore: safetyCheck.safetyScore,
        securityScore: secCheck.securityScore,
        overallFitness: 0,
        vetoReason: `Safety Gate Veto: ${safetyCheck.concerns.join('; ')}`,
      };
    }

    // 3. Simulated Benchmark Evaluation
    // User Value increases with personal fit + context relevance
    const userValueScore = Number(
      (0.4 + candidate.weights.personalFit * 0.4 + candidate.weights.contextRelevance * 0.3).toFixed(3)
    );

    // Trust calibration correlates with trustWeight
    const trustCalibration = Number((0.5 + candidate.weights.trustWeight * 0.45).toFixed(3));

    // Latency & Efficiency is penalized by over-exploration
    const efficiencyScore = Number((0.98 - candidate.weights.noveltyExploration * 0.1).toFixed(3));

    // Multi-objective overall fitness calculation
    const overallFitness = Number(
      (
        userValueScore * 0.35 +
        trustCalibration * 0.30 +
        efficiencyScore * 0.15 +
        safetyCheck.safetyScore * 0.10 +
        secCheck.securityScore * 0.10
      ).toFixed(3)
    );

    return {
      passed: true,
      userValueScore,
      trustCalibration,
      efficiencyScore,
      safetyScore: safetyCheck.safetyScore,
      securityScore: secCheck.securityScore,
      overallFitness,
    };
  }
}
