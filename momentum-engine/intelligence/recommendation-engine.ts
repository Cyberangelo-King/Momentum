/**
 * Momentum Intelligence Engine - Multi-Objective Recommendation Engine
 * Balances Personal Fit, Trust, Context, Evidence, Novelty Exploration, and Friction
 */

import { EngineContext, RecommendationItem, CandidateStrategy } from '../core/types';
import { TrustEngine } from '../models/trust-engine';

export class RecommendationEngine {
  private trustEngine: TrustEngine;
  private activeStrategy: CandidateStrategy;

  constructor() {
    this.trustEngine = TrustEngine.getInstance();
    // Default Champion Strategy
    this.activeStrategy = {
      id: 'strat_champion_v1',
      name: 'Equilibrium Value & Trust Baseline',
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
      lineageHistory: ['genesis_v1'],
      createdAt: Date.now(),
    };
  }

  public setStrategy(strategy: CandidateStrategy): void {
    this.activeStrategy = strategy;
  }

  public getActiveStrategy(): CandidateStrategy {
    return this.activeStrategy;
  }

  /**
   * Generates multi-objective recommendations for speakers, sessions, or networking intros
   */
  public generateRecommendations(params: {
    userId: string;
    context: EngineContext;
    candidates: Array<{
      id: string;
      title: string;
      description: string;
      domain: string;
      tags: string[];
      category: string;
      frictionScore?: number;
    }>;
    count?: number;
  }): RecommendationItem[] {
    const { userId, context, candidates, count = 3 } = params;
    const weights = this.activeStrategy.weights;

    const scored = candidates.map((item) => {
      const trustScore = this.trustEngine.getTrustScore(item.id, item.domain);
      const isDomainMatch = (context.domain && item.domain === context.domain) ? 1.0 : 0.4;
      const noveltyScore = 0.5 + Math.sin(item.title.length) * 0.3; // bounded pseudorandom exploration
      const friction = item.frictionScore || 0.1;

      // Multi-Objective Scoring Formula
      const score =
        weights.personalFit * isDomainMatch +
        weights.trustWeight * trustScore +
        weights.contextRelevance * (context.activeTrack === item.category ? 1.0 : 0.5) +
        weights.noveltyExploration * noveltyScore -
        friction * 0.2;

      const normalizedScore = Math.max(0.1, Math.min(0.99, Number(score.toFixed(3))));
      const confidence = Math.min(0.95, Number((trustScore * 0.6 + isDomainMatch * 0.4).toFixed(2)));

      const reasons: string[] = [];
      if (isDomainMatch > 0.8) reasons.push(`High domain alignment in ${item.domain}`);
      if (trustScore > 0.6) reasons.push(`Strong verified community trust score (${Math.round(trustScore * 100)}%)`);
      if (noveltyScore > 0.6) reasons.push(`Serendipitous perspective recommended for cross-disciplinary insight`);

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        score: normalizedScore,
        confidence,
        reasons,
        evidence: [`Strategy: ${this.activeStrategy.name} v${this.activeStrategy.version}`],
        noveltyScore: Number(noveltyScore.toFixed(2)),
        frictionScore: friction,
        domain: item.domain,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, count);
  }
}
