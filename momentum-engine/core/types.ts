/**
 * Momentum Intelligence Engine - Core Types & Data Contracts
 * Version: 1.0.0
 * Architecture: Governed Evolutionary Intelligence
 */

export enum SecurityZone {
  ZONE_0_GOVERNANCE = 'ZONE_0_GOVERNANCE',         // Supreme, Immutable
  ZONE_1_CONTROL_PLANE = 'ZONE_1_CONTROL_PLANE',     // Orchestrator, Deployment
  ZONE_2_INTELLIGENCE = 'ZONE_2_INTELLIGENCE',       // Models, Hypotheses
  ZONE_3_DATA_PLANE = 'ZONE_3_DATA_PLANE',           // Raw & Normalized Events
  ZONE_4_SANDBOX = 'ZONE_4_SANDBOX',                 // Quarantined Mutations
}

export enum AutonomyLevel {
  LEVEL_0_OBSERVATION = 0,       // Passive metrics only
  LEVEL_1_ADVISORY = 1,          // Propose ideas to human
  LEVEL_2_ADAPTIVE_WEIGHTS = 2,  // Auto-tune bounded hyper-parameters
  LEVEL_3_CONTROLLED_EXP = 3,    // Launch canary A/B experiments
  LEVEL_4_AUTO_PROMOTION = 4,    // Promote vetted low-risk champions
  LEVEL_5_HUMAN_APPROVAL = 5,    // Requires operator sign-off
  LEVEL_6_NON_AUTONOMOUS = 6,    // Security/Constitution (Strictly manual)
}

export enum ConstitutionalLaw {
  LAW_1_USER_AGENCY = 'LAW_1_USER_AGENCY',
  LAW_2_TRUTH = 'LAW_2_TRUTH',
  LAW_3_TRUST = 'LAW_3_TRUST',
  LAW_4_UNCERTAINTY = 'LAW_4_UNCERTAINTY',
  LAW_5_PRIVACY = 'LAW_5_PRIVACY',
  LAW_6_SECURITY = 'LAW_6_SECURITY',
  LAW_7_SAFETY = 'LAW_7_SAFETY',
  LAW_8_REVERSIBILITY = 'LAW_8_REVERSIBILITY',
  LAW_9_ACCOUNTABILITY = 'LAW_9_ACCOUNTABILITY',
  LAW_10_FAIRNESS = 'LAW_10_FAIRNESS',
  LAW_11_HUMAN_OVERSIGHT = 'LAW_11_HUMAN_OVERSIGHT',
  LAW_12_NO_SELF_PRIVILEGE = 'LAW_12_NO_SELF_PRIVILEGE',
  LAW_13_NO_SELF_EXEMPTION = 'LAW_13_NO_SELF_EXEMPTION',
  LAW_14_SECURITY_VETO = 'LAW_14_SECURITY_VETO',
  LAW_15_SAFETY_VETO = 'LAW_15_SAFETY_VETO',
  LAW_16_PRIVACY_VETO = 'LAW_16_PRIVACY_VETO',
  LAW_17_NO_UNCONTROLLED_SELF_MODIFICATION = 'LAW_17_NO_UNCONTROLLED_SELF_MODIFICATION',
}

export interface EngineContext {
  userId?: string;
  domain?: string;
  intent?: string;
  location?: string;
  timestamp: number;
  sessionDurationSec?: number;
  connectionCount?: number;
  notesCount?: number;
  activeTrack?: string;
  networkConnectivity?: 'online' | 'offline' | 'degraded';
  metadata?: Record<string, unknown>;
}

export interface EngineEvent {
  id: string;
  actor: string;
  type: string;
  entity?: string;
  timestamp: number;
  context: EngineContext;
  payload?: Record<string, unknown>;
  signature?: string;
  validated?: boolean;
  securityZone: SecurityZone;
}

export interface MemoryRecord {
  id: string;
  tier: 'episodic' | 'semantic' | 'product' | 'world' | 'experiment';
  entityId: string;
  key: string;
  value: unknown;
  confidence: number;
  evidence: string[];
  recency: number;
  source: string;
  domain?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface TrustNode {
  nodeId: string;
  domain: string;
  trustScore: number;       // [0.0 - 1.0]
  evidenceCount: number;
  consistencyScore: number; // [0.0 - 1.0]
  lastUpdated: number;
  anomalyFlag?: boolean;
  reputationHistory: Array<{ timestamp: number; score: number; delta: number; reason: string }>;
}

export interface TrustEdge {
  fromNodeId: string;
  toNodeId: string;
  domain: string;
  weight: number;
  interactionCount: number;
  lastInteraction: number;
}

export interface PredictionResult<T = unknown> {
  id: string;
  modelVersion: string;
  predictedValue: T;
  confidence: number;       // [0.0 - 1.0]
  uncertaintyInterval: [number, number];
  timestamp: number;
  context: EngineContext;
  actualOutcome?: T;
  predictionError?: number;
  surpriseScore?: number;   // -log(P)
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  noveltyScore: number;
  frictionScore: number;
  domain: string;
  payload?: Record<string, unknown>;
}

export interface Hypothesis {
  id: string;
  observation: string;
  hypothesis: string;
  expectedOutcome: string;
  confidence: number;
  evidence: string[];
  status: 'PROPOSED' | 'TESTING' | 'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE' | 'SUPERSEDED';
  createdAt: number;
  updatedAt: number;
  experimentId?: string;
  pVal?: number;
  domain: string;
}

export interface Experiment {
  id: string;
  hypothesisId: string;
  name: string;
  description: string;
  controlCohort: string;
  treatmentCohort: string;
  championStrategyId: string;
  challengerStrategyId: string;
  allocationPercent: number; // e.g. 5% canary
  metrics: {
    userValueDelta: number;
    trustDelta: number;
    latencyDeltaMs: number;
    errorDelta: number;
  };
  sampleSize: number;
  status: 'QUEUED' | 'RUNNING' | 'CONCLUDED' | 'ABORTED';
  startedAt: number;
  concludedAt?: number;
  verdict?: 'CHAMPION_WINS' | 'CHALLENGER_WINS' | 'INCONCLUSIVE';
}

export interface CandidateStrategy {
  id: string;
  name: string;
  version: string;
  parentId?: string;
  generation: number;
  mutationType: 'WEIGHT_MUTATION' | 'CROSSOVER' | 'HEURISTIC_SWAP' | 'POLICY_ADAPTATION';
  weights: {
    personalFit: number;
    trustWeight: number;
    contextRelevance: number;
    noveltyExploration: number;
    evidenceThreshold: number;
  };
  fitness: {
    userValueScore: number;
    trustCalibration: number;
    efficiencyScore: number;
    safetyScore: number;
    securityScore: number;
    overallFitness: number;
  };
  status: 'SANDBOXED' | 'EVALUATING' | 'CANARY' | 'CHAMPION' | 'REJECTED' | 'RETIRED';
  lineageHistory: string[];
  createdAt: number;
}

export interface CapabilityNode {
  id: string;
  name: string;
  version: string;
  purpose: string;
  dependencies: string[];
  inputs: string[];
  outputs: string[];
  requiredZone: SecurityZone;
  autonomyLevel: AutonomyLevel;
  risks: string[];
  status: 'ACTIVE' | 'EXPERIMENTAL' | 'DEPRECATED' | 'RETIRED';
  speciationParent?: string;
}

export interface ProductOpportunity {
  id: string;
  title: string;
  needDescription: string;
  reach: number;
  expectedImpact: number;
  confidence: number;
  strategicAlignment: number;
  costComplexity: number;
  riskPenalty: number;
  opportunityScore: number; // (Need * Reach * Impact * Conf * Align) / (Cost + Risk)
  discoveredAt: number;
  evidenceSignals: string[];
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  vetoReason?: string;
  vetoLaw?: ConstitutionalLaw;
  vetoZone?: SecurityZone;
  riskScore: number;
  requiredAutonomy: AutonomyLevel;
  requiresHumanApproval: boolean;
  auditId: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  zone: SecurityZone;
  result: 'ALLOWED' | 'VETOED' | 'QUARANTINED' | 'ESCALATED';
  details: Record<string, unknown>;
  checksum: string;
}

export interface EngineHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'EMERGENCY_LOCKDOWN';
  uptimeSeconds: number;
  activeSecurityZone: SecurityZone;
  constitutionStatus: 'ENFORCED' | 'VIOLATED';
  killSwitches: {
    global: boolean;
    evolution: boolean;
    aiProxies: boolean;
    recommendations: boolean;
  };
  activeChampionStrategy: string;
  candidatesInSandboxCount: number;
  activeExperimentsCount: number;
  hypothesesCount: number;
  memoryRecordsCount: number;
  trustNodesCount: number;
  capabilitiesCount: number;
  lastAuditTimestamp: number;
}
