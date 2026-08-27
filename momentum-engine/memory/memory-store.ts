/**
 * Momentum Intelligence Engine - Tiered Memory Store
 * Episodic, Semantic, Product, World, and Experiment Memory with Data Minimization
 */

import { MemoryRecord } from '../core/types';

export class MemoryStore {
  private static instance: MemoryStore;
  private records: Map<string, MemoryRecord> = new Map();
  private readonly maxRecordsPerTier = 2000;

  private constructor() {
    this.seedProductMemory();
  }

  public static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }

  private seedProductMemory(): void {
    const defaultProductKnowledge: Array<Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        tier: 'product',
        entityId: 'momentum_core',
        key: 'primary_purpose',
        value: 'Accelerate high-impact professional relationship compounding at conferences & summits',
        confidence: 1.0,
        evidence: ['CONSTITUTION.md', 'README.md'],
        recency: 1.0,
        source: 'GENESIS_SPEC',
        domain: 'product_strategy',
      },
      {
        tier: 'product',
        entityId: 'momentum_core',
        key: 'target_connections_milestone',
        value: 50,
        confidence: 1.0,
        evidence: ['TEDxAkure 2026 Target Target Rule'],
        recency: 1.0,
        source: 'GENESIS_SPEC',
        domain: 'growth_milestone',
      },
      {
        tier: 'world',
        entityId: 'conference_domain',
        key: 'event_context_tedxakure',
        value: {
          name: 'TEDxAkure 2026',
          theme: 'Future Unbound: Tech, Creative Capital & African Frontiers',
          location: 'Akure, Nigeria',
        },
        confidence: 1.0,
        evidence: ['Event Profile Config'],
        recency: 1.0,
        source: 'EVENT_REGISTRY',
        domain: 'event_context',
      },
    ];

    for (const item of defaultProductKnowledge) {
      this.set(item);
    }
  }

  public set(params: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'>): MemoryRecord {
    const keyId = `${params.tier}:${params.entityId}:${params.key}`;
    const now = Date.now();
    const existing = this.records.get(keyId);

    const record: MemoryRecord = {
      id: existing ? existing.id : `mem_${now}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      ...params,
    };

    this.records.set(keyId, record);
    return record;
  }

  public get(tier: MemoryRecord['tier'], entityId: string, key: string): MemoryRecord | undefined {
    return this.records.get(`${tier}:${entityId}:${key}`);
  }

  public query(filter: {
    tier?: MemoryRecord['tier'];
    entityId?: string;
    domain?: string;
    minConfidence?: number;
    limit?: number;
  }): MemoryRecord[] {
    const results: MemoryRecord[] = [];
    const limit = filter.limit || 50;

    for (const record of this.records.values()) {
      if (filter.tier && record.tier !== filter.tier) continue;
      if (filter.entityId && record.entityId !== filter.entityId) continue;
      if (filter.domain && record.domain !== filter.domain) continue;
      if (filter.minConfidence !== undefined && record.confidence < filter.minConfidence) continue;

      results.push(record);
      if (results.length >= limit) break;
    }

    return results;
  }

  public count(): number {
    return this.records.size;
  }

  /**
   * Data minimization: deletes expired or user-requested records
   */
  public purgeUser(userId: string): number {
    let deleted = 0;
    for (const [k, v] of this.records.entries()) {
      if (v.entityId === userId || v.tier === 'episodic') {
        this.records.delete(k);
        deleted++;
      }
    }
    return deleted;
  }
}
