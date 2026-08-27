/**
 * Momentum Intelligence Engine - Perception Engine
 * Aggregates Real-Time Signals, Context vectors, Noise Filters & Anomaly Detectors
 */

import { EngineContext, EngineEvent } from '../core/types';

export interface SignalVector {
  domainIntensity: Record<string, number>;
  engagementVelocity: number;
  diversityIndex: number;
  anomalyScore: number;
}

export class PerceptionEngine {
  private eventHistory: EngineEvent[] = [];

  public observeEvent(event: EngineEvent): SignalVector {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 500) {
      this.eventHistory.pop();
    }

    return this.extractSignals();
  }

  /**
   * Computes multidimensional signals across recent observations
   */
  public extractSignals(): SignalVector {
    const domainCounts: Record<string, number> = {};
    let totalEvents = this.eventHistory.length;

    for (const evt of this.eventHistory) {
      const domain = evt.context.domain || 'general';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }

    const domainIntensity: Record<string, number> = {};
    for (const [dom, count] of Object.entries(domainCounts)) {
      domainIntensity[dom] = totalEvents > 0 ? Number((count / totalEvents).toFixed(3)) : 0;
    }

    // Measure event rate (events per minute over recent window)
    const now = Date.now();
    const oneMinAgo = now - 60000;
    const eventsLastMinute = this.eventHistory.filter((e) => e.timestamp > oneMinAgo).length;
    const engagementVelocity = eventsLastMinute;

    // Diversity Index (Shannon entropy approximation over domain distribution)
    let entropy = 0;
    for (const p of Object.values(domainIntensity)) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    const diversityIndex = Math.min(1.0, entropy / 2.5);

    // Anomaly detection: velocity spikes > 40/min
    const anomalyScore = engagementVelocity > 40 ? 0.85 : 0.05;

    return {
      domainIntensity,
      engagementVelocity,
      diversityIndex,
      anomalyScore,
    };
  }

  public synthesizeContext(base: Partial<EngineContext>): EngineContext {
    return {
      timestamp: Date.now(),
      domain: base.domain || 'general',
      intent: base.intent || 'discovery',
      networkConnectivity: base.networkConnectivity || 'online',
      ...base,
    };
  }
}
