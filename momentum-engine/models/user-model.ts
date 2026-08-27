/**
 * Momentum Intelligence Engine - Probabilistic User Model
 * Tracks Inferred Preferences with Explicit Confidence, Recency, and Evidence
 */

export interface InferredPreference {
  domain: string;
  topic: string;
  weight: number;      // [0.0 - 1.0]
  confidence: number;  // [0.0 - 1.0]
  evidenceCount: number;
  lastUpdated: number;
}

export class UserModel {
  private userId: string;
  private preferences: Map<string, InferredPreference> = new Map();
  private goals: string[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  public updateInterest(domain: string, topic: string, evidenceWeight: number = 0.2): InferredPreference {
    const key = `${domain}:${topic.toLowerCase()}`;
    const existing = this.preferences.get(key);

    const now = Date.now();
    if (existing) {
      existing.weight = Math.min(1.0, existing.weight + evidenceWeight * 0.2);
      existing.confidence = Math.min(0.99, existing.confidence + 0.1);
      existing.evidenceCount += 1;
      existing.lastUpdated = now;
      return existing;
    }

    const newPref: InferredPreference = {
      domain,
      topic,
      weight: Math.min(1.0, evidenceWeight),
      confidence: 0.4,
      evidenceCount: 1,
      lastUpdated: now,
    };
    this.preferences.set(key, newPref);
    return newPref;
  }

  public getTopInterests(limit: number = 5): InferredPreference[] {
    return Array.from(this.preferences.values())
      .sort((a, b) => b.weight * b.confidence - a.weight * a.confidence)
      .slice(0, limit);
  }

  public getUserId(): string {
    return this.userId;
  }
}
