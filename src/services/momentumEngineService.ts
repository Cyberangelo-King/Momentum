/**
 * Client Service for Momentum Intelligence Engine
 * Interfaces with the governed backend endpoints and local fallback simulators.
 */

import {
  EngineHealth,
  RecommendationItem,
  PredictionResult,
  Hypothesis,
  ProductOpportunity,
  CapabilityNode,
  CandidateStrategy,
  AuditLogEntry,
} from '../../momentum-engine/core/types';

export async function fetchEngineHealth(): Promise<EngineHealth | null> {
  try {
    const res = await fetch('/api/engine/health');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch engine health from server:', err);
  }
  return null;
}

export async function sendEngineObservation(params: {
  actor: string;
  type: string;
  entity?: string;
  payload?: Record<string, unknown>;
  context?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/engine/observe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchEngineRecommendations(params: {
  userId: string;
  context?: Record<string, unknown>;
  count?: number;
}): Promise<RecommendationItem[]> {
  try {
    const res = await fetch('/api/engine/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.recommendations || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine recommendations:', err);
  }
  return [];
}

export async function fetchEngineHypotheses(): Promise<Hypothesis[]> {
  try {
    const res = await fetch('/api/engine/hypotheses');
    if (res.ok) {
      const data = await res.json();
      return data.hypotheses || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine hypotheses:', err);
  }
  return [];
}

export async function fetchEngineOpportunities(): Promise<ProductOpportunity[]> {
  try {
    const res = await fetch('/api/engine/opportunities');
    if (res.ok) {
      const data = await res.json();
      return data.opportunities || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine opportunities:', err);
  }
  return [];
}

export async function fetchEngineCapabilities(): Promise<CapabilityNode[]> {
  try {
    const res = await fetch('/api/engine/capabilities');
    if (res.ok) {
      const data = await res.json();
      return data.capabilities || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine capabilities:', err);
  }
  return [];
}

export async function fetchEngineCandidates(): Promise<{ champion: CandidateStrategy; candidates: CandidateStrategy[] } | null> {
  try {
    const res = await fetch('/api/engine/candidates');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch engine candidates:', err);
  }
  return null;
}

export async function fetchEngineConstitution(): Promise<Array<{ law: string; title: string; description: string; isVetoCapable: boolean }>> {
  try {
    const res = await fetch('/api/engine/constitution');
    if (res.ok) {
      const data = await res.json();
      return data.laws || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine constitution:', err);
  }
  return [];
}

export async function fetchEngineAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/engine/audit-logs');
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('Failed to fetch engine audit logs:', err);
  }
  return [];
}

export async function triggerEngineEvolution(): Promise<CandidateStrategy | null> {
  try {
    const res = await fetch('/api/engine/evolve', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.candidate || null;
    }
  } catch (err) {
    console.warn('Failed to trigger engine evolution:', err);
  }
  return null;
}

export async function toggleEngineKillSwitch(switchName: string, state: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/engine/kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ switchName, state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runEngineDiagnosticTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; status: 'PASSED' | 'FAILED'; details?: string }>;
} | null> {
  try {
    const res = await fetch('/api/engine/tests/run', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to run engine tests:', err);
  }
  return null;
}
