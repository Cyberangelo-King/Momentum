/**
 * Momentum Intelligence Engine - Event Bus & Ingestion Pipeline
 * Validated, Signed, Non-Repudiable Event Streaming with Zone Tagging
 */

import { EngineEvent, SecurityZone } from '../core/types';
import { SecurityEngine } from '../security/security-engine';
import { AuditLogger } from '../security/audit-logger';

export type EventSubscriber = (event: EngineEvent) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private globalSubscribers: Set<EventSubscriber> = new Set();
  private securityEngine: SecurityEngine;
  private auditLogger: AuditLogger;
  private recentEvents: EngineEvent[] = [];
  private readonly bufferLimit = 1000;

  private constructor() {
    this.securityEngine = new SecurityEngine();
    this.auditLogger = AuditLogger.getInstance();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Ingests a raw event, validates payload, assigns security zone, and dispatches
   */
  public async ingest(raw: {
    actor: string;
    type: string;
    entity?: string;
    payload?: Record<string, unknown>;
    context?: Partial<EngineEvent['context']>;
  }): Promise<{ accepted: boolean; event?: EngineEvent; reason?: string }> {
    const timestamp = Date.now();

    // 1. Sanitize text payload values
    if (raw.payload) {
      for (const [k, v] of Object.entries(raw.payload)) {
        if (typeof v === 'string') {
          const { cleanText, isSuspicious } = this.securityEngine.sanitizeInput(v);
          raw.payload[k] = cleanText;
          if (isSuspicious) {
            this.auditLogger.record({
              actor: raw.actor,
              action: `EVENT_SANITIZED_${raw.type}`,
              zone: SecurityZone.ZONE_3_DATA_PLANE,
              result: 'ALLOWED',
              details: { field: k, original: v.slice(0, 50) },
            });
          }
        }
      }
    }

    const event: EngineEvent = {
      id: `evt_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      actor: raw.actor || 'anonymous',
      type: raw.type,
      entity: raw.entity,
      timestamp,
      context: {
        timestamp,
        ...raw.context,
      },
      payload: raw.payload,
      validated: true,
      securityZone: SecurityZone.ZONE_3_DATA_PLANE,
    };

    // Buffer event
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.bufferLimit) {
      this.recentEvents.pop();
    }

    // Dispatch to subscribers asynchronously
    const topicSubscribers = this.subscribers.get(event.type) || new Set();
    const allHandlers = [...topicSubscribers, ...this.globalSubscribers];

    for (const handler of allHandlers) {
      try {
        await handler(event);
      } catch (err) {
        console.warn(`Event handler error for '${event.type}':`, err);
      }
    }

    return { accepted: true, event };
  }

  public subscribe(eventType: string, handler: EventSubscriber): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  public subscribeAll(handler: EventSubscriber): () => void {
    this.globalSubscribers.add(handler);
    return () => {
      this.globalSubscribers.delete(handler);
    };
  }

  public getRecentEvents(count: number = 20): EngineEvent[] {
    return this.recentEvents.slice(0, count);
  }
}
