/**
 * Momentum Intelligence Engine - Contextual Trust Engine
 * Domain-Segmented Trust Graph, Sybil Detection, Collusion Defense & Anti-Manipulation
 */

import { TrustNode, TrustEdge } from '../core/types';
import { AuditLogger } from '../security/audit-logger';

export class TrustEngine {
  private static instance: TrustEngine;
  private nodes: Map<string, TrustNode> = new Map();
  private edges: Map<string, TrustEdge> = new Map();
  private auditLogger: AuditLogger;

  private constructor() {
    this.auditLogger = AuditLogger.getInstance();
  }

  public static getInstance(): TrustEngine {
    if (!TrustEngine.instance) {
      TrustEngine.instance = new TrustEngine();
    }
    return TrustEngine.instance;
  }

  private getNodeKey(nodeId: string, domain: string): string {
    return `${nodeId}:${domain}`;
  }

  private getEdgeKey(fromNodeId: string, toNodeId: string, domain: string): string {
    return `${fromNodeId}->${toNodeId}:${domain}`;
  }

  /**
   * Retrieves or initializes a domain-specific trust node
   */
  public getOrCreateNode(nodeId: string, domain: string = 'general'): TrustNode {
    const key = this.getNodeKey(nodeId, domain);
    if (!this.nodes.has(key)) {
      this.nodes.set(key, {
        nodeId,
        domain,
        trustScore: 0.5, // neutral prior
        evidenceCount: 1,
        consistencyScore: 0.7,
        lastUpdated: Date.now(),
        anomalyFlag: false,
        reputationHistory: [
          {
            timestamp: Date.now(),
            score: 0.5,
            delta: 0,
            reason: 'INITIAL_NEUTRAL_TRUST_PRIOR',
          },
        ],
      });
    }
    return this.nodes.get(key)!;
  }

  /**
   * Records a verified interaction between two entities within a specific domain
   */
  public recordInteraction(params: {
    fromNodeId: string;
    toNodeId: string;
    domain: string;
    interactionType: 'qr_bump' | 'voice_note_mention' | 'note_shared' | 'message_sent';
    verified: boolean;
  }): { edge: TrustEdge; updatedScore: number; anomalyDetected: boolean } {
    const edgeKey = this.getEdgeKey(params.fromNodeId, params.toNodeId, params.domain);
    const existingEdge = this.edges.get(edgeKey);

    const edge: TrustEdge = {
      fromNodeId: params.fromNodeId,
      toNodeId: params.toNodeId,
      domain: params.domain,
      weight: existingEdge ? Math.min(1.0, existingEdge.weight + 0.1) : 0.2,
      interactionCount: (existingEdge?.interactionCount || 0) + 1,
      lastInteraction: Date.now(),
    };
    this.edges.set(edgeKey, edge);

    // Update target node trust
    const targetNode = this.getOrCreateNode(params.toNodeId, params.domain);
    const prevScore = targetNode.trustScore;

    // Detect Sybil / Collusion spike (> 10 interactions in 30s)
    const isRapidSpike = edge.interactionCount > 15;
    let delta = params.verified ? 0.05 : 0.01;

    if (isRapidSpike) {
      targetNode.anomalyFlag = true;
      delta = -0.05; // penalize potential burst manipulation
      this.auditLogger.record({
        actor: params.fromNodeId,
        action: 'POTENTIAL_SYBIL_BURST_DETECTED',
        zone: targetNode.trustScore > 0 ? (params.verified ? (1 as any) : (3 as any)) : (3 as any),
        result: 'QUARANTINED',
        details: { target: params.toNodeId, count: edge.interactionCount, domain: params.domain },
      });
    }

    const newScore = Math.max(0.05, Math.min(0.99, Number((prevScore + delta).toFixed(3))));
    targetNode.trustScore = newScore;
    targetNode.evidenceCount += 1;
    targetNode.lastUpdated = Date.now();
    targetNode.reputationHistory.unshift({
      timestamp: Date.now(),
      score: newScore,
      delta,
      reason: isRapidSpike ? 'ANOMALY_SPIKE_PENALTY' : `INTERACTION_${params.interactionType.toUpperCase()}`,
    });

    if (targetNode.reputationHistory.length > 50) {
      targetNode.reputationHistory.pop();
    }

    return {
      edge,
      updatedScore: newScore,
      anomalyDetected: isRapidSpike,
    };
  }

  public getTrustScore(nodeId: string, domain: string = 'general'): number {
    const key = this.getNodeKey(nodeId, domain);
    const node = this.nodes.get(key);
    return node ? node.trustScore : 0.5;
  }

  public getNodesCount(): number {
    return this.nodes.size;
  }
}
