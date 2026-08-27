/**
 * Momentum Intelligence Engine - Extensible Capability Graph
 * Represents Capabilities as a Directed Acyclic Graph (DAG) with Crossover & Speciation
 */

import { CapabilityNode, SecurityZone, AutonomyLevel } from '../core/types';

export class CapabilityGraph {
  private static instance: CapabilityGraph;
  private nodes: Map<string, CapabilityNode> = new Map();

  private constructor() {
    this.seedCoreCapabilities();
  }

  public static getInstance(): CapabilityGraph {
    if (!CapabilityGraph.instance) {
      CapabilityGraph.instance = new CapabilityGraph();
    }
    return CapabilityGraph.instance;
  }

  private seedCoreCapabilities(): void {
    const coreCapabilities: CapabilityNode[] = [
      {
        id: 'cap_contact_exchange',
        name: 'Instant Contact Exchange (QR & NFC)',
        version: '1.0.0',
        purpose: 'Frictionless, zero-network contact ingest and personal badge broadcasting.',
        dependencies: [],
        inputs: ['vCard payload', 'NFC NDEF Record'],
        outputs: ['Contact Entity', 'Connection Record'],
        requiredZone: SecurityZone.ZONE_3_DATA_PLANE,
        autonomyLevel: AutonomyLevel.LEVEL_0_OBSERVATION,
        risks: ['Spoofed QR payload (mitigated by input sanitizer)'],
        status: 'ACTIVE',
      },
      {
        id: 'cap_smart_notes',
        name: 'Smart Notes & Audio Transcription',
        version: '1.0.0',
        purpose: 'Capture live keynote reflections with verbatim speech-to-text and structuring.',
        dependencies: ['cap_contact_exchange'],
        inputs: ['Audio blob', 'Note markdown text'],
        outputs: ['Structured Note', 'Key Takeaways', 'Action Items'],
        requiredZone: SecurityZone.ZONE_2_INTELLIGENCE,
        autonomyLevel: AutonomyLevel.LEVEL_1_ADVISORY,
        risks: ['Hallucinated action items (mitigated by explicit certainty intervals)'],
        status: 'ACTIVE',
      },
      {
        id: 'cap_trust_graph',
        name: 'Contextual Trust Graph',
        version: '1.0.0',
        purpose: 'Track domain-specific trust, detect Sybil bursts, and protect against artificial manipulation.',
        dependencies: ['cap_contact_exchange'],
        inputs: ['Interaction events', 'Mutual connections'],
        outputs: ['Trust Node Score', 'Anomaly Flags'],
        requiredZone: SecurityZone.ZONE_1_CONTROL_PLANE,
        autonomyLevel: AutonomyLevel.LEVEL_2_ADAPTIVE_WEIGHTS,
        risks: ['Collusion rings (mitigated by rate-limiting delta curves)'],
        status: 'ACTIVE',
      },
      {
        id: 'cap_post_event_reflection',
        name: '5-Pillar Post-Event Reflection & Executive Recap',
        version: '1.0.0',
        purpose: 'Synthesize all conference contacts, notes, and milestones into an A4 briefing and LinkedIn post.',
        dependencies: ['cap_contact_exchange', 'cap_smart_notes', 'cap_trust_graph'],
        inputs: ['All contacts', 'All notes', 'ROI metrics'],
        outputs: ['Executive Summary', 'Action Item Plan', 'LinkedIn Draft'],
        requiredZone: SecurityZone.ZONE_2_INTELLIGENCE,
        autonomyLevel: AutonomyLevel.LEVEL_1_ADVISORY,
        risks: ['Privacy leakage in public drafts (mitigated by tenant scrubbing)'],
        status: 'ACTIVE',
      },
    ];

    for (const cap of coreCapabilities) {
      this.nodes.set(cap.id, cap);
    }
  }

  public registerCapability(capability: CapabilityNode): { success: boolean; reason?: string } {
    if (this.nodes.has(capability.id)) {
      return { success: false, reason: `Capability '${capability.id}' already exists.` };
    }

    // Verify dependencies exist
    for (const dep of capability.dependencies) {
      if (!this.nodes.has(dep)) {
        return { success: false, reason: `Missing required dependency '${dep}'.` };
      }
    }

    this.nodes.set(capability.id, capability);
    return { success: true };
  }

  /**
   * Crossover: Combines two existing capabilities to propose an emergent feature
   */
  public proposeCrossover(capAId: string, capBId: string): CapabilityNode | null {
    const a = this.nodes.get(capAId);
    const b = this.nodes.get(capBId);
    if (!a || !b) return null;

    const crossoverId = `crossover_${capAId.replace('cap_', '')}_x_${capBId.replace('cap_', '')}`;
    return {
      id: crossoverId,
      name: `${a.name} ⨉ ${b.name}`,
      version: '0.1.0-experimental',
      purpose: `Emergent synthesis combining ${a.name} with ${b.name}`,
      dependencies: [a.id, b.id],
      inputs: [...new Set([...a.inputs, ...b.inputs])],
      outputs: [`Emergent Insight from ${a.name} & ${b.name}`],
      requiredZone: SecurityZone.ZONE_2_INTELLIGENCE,
      autonomyLevel: AutonomyLevel.LEVEL_1_ADVISORY,
      risks: ['Unverified interaction dynamics (requires sandbox trial)'],
      status: 'EXPERIMENTAL',
      speciationParent: a.id,
    };
  }

  public getAll(): CapabilityNode[] {
    return Array.from(this.nodes.values());
  }

  public getCount(): number {
    return this.nodes.size;
  }
}
