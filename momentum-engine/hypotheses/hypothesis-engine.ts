/**
 * Momentum Intelligence Engine - Hypothesis Engine
 * Synthesizes Observations into Empirical Hypotheses with Lifecycle Management
 */

import { Hypothesis } from '../core/types';

export class HypothesisEngine {
  private hypotheses: Map<string, Hypothesis> = new Map();

  constructor() {
    this.seedBaselineHypotheses();
  }

  private seedBaselineHypotheses(): void {
    const baselines: Array<Omit<Hypothesis, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        observation: 'Attendees who capture structured notes with verbatim audio transcripts follow up 3x faster.',
        hypothesis: 'Verbatim voice memo transcription reduces note recall friction and elevates follow-up conversion.',
        expectedOutcome: '+25% conversion on 24-hour WhatsApp follow-ups.',
        confidence: 0.85,
        evidence: ['TEDxAkure Field Trial 1', 'Smart Notes Log Data'],
        status: 'SUPPORTED',
        domain: 'networking_velocity',
      },
      {
        observation: 'Pre-generating 3 speaker-specific questions increases attendee engagement at stage mics.',
        hypothesis: 'Automated speaker dossiers and icebreakers reduce social friction for intros by >40%.',
        expectedOutcome: '+40% speaker interaction rate during networking intervals.',
        confidence: 0.90,
        evidence: ['Speaker Dossier Ingestion Logs'],
        status: 'SUPPORTED',
        domain: 'speaker_engagement',
      },
    ];

    for (const item of baselines) {
      this.propose(item);
    }
  }

  public propose(params: Omit<Hypothesis, 'id' | 'createdAt' | 'updatedAt'>): Hypothesis {
    const now = Date.now();
    const id = `hyp_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const hypothesis: Hypothesis = {
      id,
      createdAt: now,
      updatedAt: now,
      ...params,
    };

    this.hypotheses.set(id, hypothesis);
    return hypothesis;
  }

  public updateStatus(
    id: string,
    status: Hypothesis['status'],
    evidenceItem?: string,
    pVal?: number
  ): Hypothesis | undefined {
    const hyp = this.hypotheses.get(id);
    if (!hyp) return undefined;

    hyp.status = status;
    hyp.updatedAt = Date.now();
    if (evidenceItem) {
      hyp.evidence.push(evidenceItem);
    }
    if (pVal !== undefined) {
      hyp.pVal = pVal;
    }

    return hyp;
  }

  public getAll(): Hypothesis[] {
    return Array.from(this.hypotheses.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getActiveCount(): number {
    return Array.from(this.hypotheses.values()).filter((h) => h.status === 'PROPOSED' || h.status === 'TESTING').length;
  }
}
