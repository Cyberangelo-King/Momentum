/**
 * Momentum Intelligence Engine - Learning Engine
 * Processes Feedback Loops, Concept Drift & Converts Surprise into Knowledge Updates
 */

import { MemoryStore } from '../memory/memory-store';

export class LearningEngine {
  private memoryStore: MemoryStore;
  private surpriseHistory: Array<{ timestamp: number; score: number; topic: string }> = [];

  constructor() {
    this.memoryStore = MemoryStore.getInstance();
  }

  /**
   * Processes a surprise/error event and logs feedback for potential hypothesis generation
   */
  public recordSurprise(topic: string, surpriseScore: number): {
    highSurpriseAnomaly: boolean;
    recommendedInvestigation: boolean;
  } {
    const entry = { timestamp: Date.now(), score: surpriseScore, topic };
    this.surpriseHistory.unshift(entry);
    if (this.surpriseHistory.length > 200) {
      this.surpriseHistory.pop();
    }

    const highSurprise = surpriseScore > 2.0; // P < 0.13
    if (highSurprise) {
      this.memoryStore.set({
        tier: 'product',
        entityId: 'surprise_monitor',
        key: `anomaly_${Date.now()}`,
        value: { topic, surpriseScore },
        confidence: 0.9,
        evidence: [`Surprise threshold exceeded: ${surpriseScore}`],
        recency: 1.0,
        source: 'LEARNING_ENGINE',
        domain: 'system_curiosity',
      });
    }

    return {
      highSurpriseAnomaly: highSurprise,
      recommendedInvestigation: highSurprise,
    };
  }

  /**
   * Calculates concept drift over time windows
   */
  public detectConceptDrift(): { driftDetected: boolean; averageSurprise: number } {
    if (this.surpriseHistory.length < 10) {
      return { driftDetected: false, averageSurprise: 0 };
    }

    const recent = this.surpriseHistory.slice(0, 10);
    const avg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
    const driftDetected = avg > 1.5;

    return {
      driftDetected,
      averageSurprise: Number(avg.toFixed(2)),
    };
  }
}
