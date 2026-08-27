/**
 * Momentum Intelligence Engine - Product World Model & Unmet Need Discovery
 * Maintains Institutional Memory of Capabilities, Failures, and Discovers High-Leverage Opportunities
 */

import { ProductOpportunity } from '../core/types';
import { CapabilityGraph } from '../capabilities/capability-graph';

export class ProductWorldModel {
  private static instance: ProductWorldModel;
  private capabilityGraph: CapabilityGraph;
  private discoveredOpportunities: Map<string, ProductOpportunity> = new Map();

  private constructor() {
    this.capabilityGraph = CapabilityGraph.getInstance();
    this.seedInitialOpportunities();
  }

  public static getInstance(): ProductWorldModel {
    if (!ProductWorldModel.instance) {
      ProductWorldModel.instance = new ProductWorldModel();
    }
    return ProductWorldModel.instance;
  }

  private seedInitialOpportunities(): void {
    const baselines: ProductOpportunity[] = [
      {
        id: 'opp_multi_language_audio',
        title: 'Real-Time Multilingual Speech-to-Text for Regional African Dialects',
        needDescription: 'Attendees at Pan-African conferences frequently switch between English, Yoruba, and French during impromptu hallways.',
        reach: 0.75,
        expectedImpact: 0.88,
        confidence: 0.80,
        strategicAlignment: 0.95,
        costComplexity: 0.40,
        riskPenalty: 0.10,
        opportunityScore: 0.98,
        discoveredAt: Date.now() - 86400000,
        evidenceSignals: ['Field User Ingestion Logs', 'User Feedback Queries'],
      },
      {
        id: 'opp_bluetooth_proximity_radar',
        title: 'Offline BLE Proximity Mesh for Hallway Discovery',
        needDescription: 'Discover high-signal attendees standing within 10 feet in high-density auditoriums without requiring internet.',
        reach: 0.85,
        expectedImpact: 0.92,
        confidence: 0.70,
        strategicAlignment: 0.90,
        costComplexity: 0.50,
        riskPenalty: 0.15,
        opportunityScore: 0.94,
        discoveredAt: Date.now() - 43200000,
        evidenceSignals: ['Zero-Wi-Fi Audit Reports', 'Hallway Congestion Feedback'],
      },
    ];

    for (const opp of baselines) {
      this.discoveredOpportunities.set(opp.id, opp);
    }
  }

  /**
   * Opportunity Prioritization Formula:
   * OpportunityScore = (Need × Reach × ExpectedImpact × Confidence × StrategicAlignment) / (CostComplexity + RiskPenalty)
   */
  public evaluateOpportunity(params: {
    title: string;
    needDescription: string;
    reach: number;
    expectedImpact: number;
    confidence: number;
    strategicAlignment: number;
    costComplexity: number;
    riskPenalty: number;
    evidenceSignals: string[];
  }): ProductOpportunity {
    const num = params.reach * params.expectedImpact * params.confidence * params.strategicAlignment;
    const den = Math.max(0.1, params.costComplexity + params.riskPenalty);
    const score = Number((num / den).toFixed(3));

    const opp: ProductOpportunity = {
      id: `opp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: params.title,
      needDescription: params.needDescription,
      reach: params.reach,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      strategicAlignment: params.strategicAlignment,
      costComplexity: params.costComplexity,
      riskPenalty: params.riskPenalty,
      opportunityScore: score,
      discoveredAt: Date.now(),
      evidenceSignals: params.evidenceSignals,
    };

    this.discoveredOpportunities.set(opp.id, opp);
    return opp;
  }

  public getTopOpportunities(limit: number = 5): ProductOpportunity[] {
    return Array.from(this.discoveredOpportunities.values())
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);
  }
}
