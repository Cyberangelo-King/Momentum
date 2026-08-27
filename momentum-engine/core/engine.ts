/**
 * Momentum Intelligence Engine - Main Orchestrator & Public API
 * Unified singleton interface providing governed evolutionary intelligence to Momentum OS.
 */

import {
  EngineEvent,
  EngineContext,
  EngineHealth,
  RecommendationItem,
  PredictionResult,
  Hypothesis,
  Experiment,
  CandidateStrategy,
  CapabilityNode,
  ProductOpportunity,
  AuditLogEntry,
  SecurityZone,
  AutonomyLevel,
} from './types';
import { MomentumConstitution } from '../governance/constitution';
import { PolicyEngine } from '../governance/policy-engine';
import { SecurityEngine } from '../security/security-engine';
import { SafetyEngine } from '../safety/safety-engine';
import { AuditLogger } from '../security/audit-logger';
import { EventBus } from '../events/event-bus';
import { PerceptionEngine } from '../perception/perception-engine';
import { MemoryStore } from '../memory/memory-store';
import { TrustEngine } from '../models/trust-engine';
import { UserModel } from '../models/user-model';
import { PredictionEngine } from '../intelligence/prediction-engine';
import { RecommendationEngine } from '../intelligence/recommendation-engine';
import { LearningEngine } from '../learning/learning-engine';
import { HypothesisEngine } from '../hypotheses/hypothesis-engine';
import { ExperimentEngine } from '../experiments/experiment-engine';
import { CapabilityGraph } from '../capabilities/capability-graph';
import { ProductWorldModel } from '../product/world-model';
import { EvolutionEngine } from '../evolution/evolution-engine';
import { RollbackManager } from '../deployment/rollback-manager';

export class MomentumEngine {
  private static instance: MomentumEngine;
  private startTime: number = Date.now();

  // Subsystems
  public readonly policyEngine: PolicyEngine;
  public readonly securityEngine: SecurityEngine;
  public readonly safetyEngine: SafetyEngine;
  public readonly auditLogger: AuditLogger;
  public readonly eventBus: EventBus;
  public readonly perceptionEngine: PerceptionEngine;
  public readonly memoryStore: MemoryStore;
  public readonly trustEngine: TrustEngine;
  public readonly predictionEngine: PredictionEngine;
  public readonly recommendationEngine: RecommendationEngine;
  public readonly learningEngine: LearningEngine;
  public readonly hypothesisEngine: HypothesisEngine;
  public readonly experimentEngine: ExperimentEngine;
  public readonly capabilityGraph: CapabilityGraph;
  public readonly productWorldModel: ProductWorldModel;
  public readonly evolutionEngine: EvolutionEngine;
  public readonly rollbackManager: RollbackManager;

  private userModels: Map<string, UserModel> = new Map();

  private constructor() {
    this.auditLogger = AuditLogger.getInstance();
    this.policyEngine = new PolicyEngine();
    this.securityEngine = new SecurityEngine();
    this.safetyEngine = new SafetyEngine();
    this.eventBus = EventBus.getInstance();
    this.perceptionEngine = new PerceptionEngine();
    this.memoryStore = MemoryStore.getInstance();
    this.trustEngine = TrustEngine.getInstance();
    this.predictionEngine = new PredictionEngine();
    this.recommendationEngine = new RecommendationEngine();
    this.learningEngine = new LearningEngine();
    this.hypothesisEngine = new HypothesisEngine();
    this.experimentEngine = new ExperimentEngine();
    this.capabilityGraph = CapabilityGraph.getInstance();
    this.productWorldModel = ProductWorldModel.getInstance();
    this.evolutionEngine = new EvolutionEngine();
    this.rollbackManager = RollbackManager.getInstance();

    this.bindInternalLoops();
  }

  public static getInstance(): MomentumEngine {
    if (!MomentumEngine.instance) {
      MomentumEngine.instance = new MomentumEngine();
    }
    return MomentumEngine.instance;
  }

  private bindInternalLoops(): void {
    // 1. Listen to all raw events to update perception and memory
    this.eventBus.subscribeAll((event: EngineEvent) => {
      this.perceptionEngine.observeEvent(event);

      // Ingest user signals into UserModel
      if (event.actor && event.actor !== 'anonymous') {
        let uModel = this.userModels.get(event.actor);
        if (!uModel) {
          uModel = new UserModel(event.actor);
          this.userModels.set(event.actor, uModel);
        }
        if (event.context.domain) {
          uModel.updateInterest(event.context.domain, event.type, 0.15);
        }
      }
    });
  }

  /**
   * 1. OBSERVE: Ingest an event safely into the Momentum organism
   */
  public async observe(params: {
    actor: string;
    type: string;
    entity?: string;
    payload?: Record<string, unknown>;
    context?: Partial<EngineContext>;
  }): Promise<{ accepted: boolean; eventId?: string }> {
    const res = await this.eventBus.ingest(params);
    return { accepted: res.accepted, eventId: res.event?.id };
  }

  /**
   * 2. PREDICT: Forecast follow-up or relationship conversion probability
   */
  public predict(params: {
    userSharedInterestsCount: number;
    interactionDurationSec: number;
    trustScore: number;
    context?: Partial<EngineContext>;
  }): PredictionResult<{ conversionProbability: number; highSignalLikelihood: boolean }> {
    const ctx = this.perceptionEngine.synthesizeContext(params.context || {});
    return this.predictionEngine.predictConnectionValue({
      userSharedInterestsCount: params.userSharedInterestsCount,
      interactionDurationSec: params.interactionDurationSec,
      trustScore: params.trustScore,
      context: ctx,
    });
  }

  /**
   * 3. RECOMMEND: Generate multi-objective, contextual recommendations
   */
  public recommend(params: {
    userId: string;
    context?: Partial<EngineContext>;
    candidates?: Array<{
      id: string;
      title: string;
      description: string;
      domain: string;
      tags: string[];
      category: string;
    }>;
    count?: number;
  }): RecommendationItem[] {
    const ctx = this.perceptionEngine.synthesizeContext(params.context || {});
    const candidateList = params.candidates || [
      {
        id: 'spk_1',
        title: 'Frontiers in African AI & Edge Intelligence',
        description: 'Keynote exploration of distributed on-device LLM architectures.',
        domain: 'ai_systems',
        tags: ['AI', 'Edge', 'Silicon'],
        category: 'keynote',
      },
      {
        id: 'spk_2',
        title: 'Creative Capital & Media Syndication',
        description: 'Monetization frameworks for African creators and storytelling infrastructure.',
        domain: 'creative_capital',
        tags: ['Fintech', 'Media', 'IP'],
        category: 'workshop',
      },
      {
        id: 'spk_3',
        title: 'Decentralized Hardware & Local Mesh Networks',
        description: 'Building offline resilient communications for high-density events.',
        domain: 'hardware_networking',
        tags: ['Mesh', 'NFC', 'BLE'],
        category: 'panel',
      },
    ];

    return this.recommendationEngine.generateRecommendations({
      userId: params.userId,
      context: ctx,
      candidates: candidateList,
      count: params.count || 3,
    });
  }

  /**
   * 4. LEARN: Ingest outcome or surprise feedback
   */
  public learn(topic: string, surpriseScore: number): { highSurprise: boolean; driftDetected: boolean } {
    const res = this.learningEngine.recordSurprise(topic, surpriseScore);
    const drift = this.learningEngine.detectConceptDrift();
    return { highSurprise: res.highSurpriseAnomaly, driftDetected: drift.driftDetected };
  }

  /**
   * 5. PROPOSE HYPOTHESIS
   */
  public proposeHypothesis(params: Omit<Hypothesis, 'id' | 'createdAt' | 'updatedAt'>): Hypothesis {
    return this.hypothesisEngine.propose(params);
  }

  /**
   * 6. EXPERIMENT: Launch controlled canary trial
   */
  public experiment(params: {
    hypothesisId: string;
    name: string;
    description: string;
    championStrategyId: string;
    challengerStrategyId: string;
    allocationPercent?: number;
  }): Experiment {
    return this.experimentEngine.launchExperiment(params);
  }

  /**
   * 7. EVOLVE: Generate a new candidate strategy in the sandbox
   */
  public evolve(): CandidateStrategy | null {
    return this.evolutionEngine.generateCandidateMutation();
  }

  /**
   * 8. REGISTER CAPABILITY
   */
  public registerCapability(capability: CapabilityNode): { success: boolean; reason?: string } {
    return this.capabilityGraph.registerCapability(capability);
  }

  /**
   * 9. DISCOVER: Get top product opportunities from the World Model
   */
  public discoverOpportunities(): ProductOpportunity[] {
    return this.productWorldModel.getTopOpportunities(5);
  }

  /**
   * 10. GET HEALTH & STATUS
   */
  public getHealth(): EngineHealth {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const killSwitches = this.rollbackManager.getKillSwitches();
    const champion = this.evolutionEngine.getChampion();

    return {
      status: killSwitches.global ? 'EMERGENCY_LOCKDOWN' : 'HEALTHY',
      uptimeSeconds,
      activeSecurityZone: SecurityZone.ZONE_1_CONTROL_PLANE,
      constitutionStatus: 'ENFORCED',
      killSwitches,
      activeChampionStrategy: `${champion.name} (${champion.version})`,
      candidatesInSandboxCount: this.evolutionEngine.getAllCandidates().length,
      activeExperimentsCount: this.experimentEngine.getActiveExperiments().length,
      hypothesesCount: this.hypothesisEngine.getAll().length,
      memoryRecordsCount: this.memoryStore.count(),
      trustNodesCount: this.trustEngine.getNodesCount(),
      capabilitiesCount: this.capabilityGraph.getCount(),
      lastAuditTimestamp: this.auditLogger.getLastAuditTimestamp(),
    };
  }

  public getRecentAuditLogs(count: number = 20): AuditLogEntry[] {
    return this.auditLogger.getRecent(count);
  }

  public getConstitution() {
    return MomentumConstitution.LAWS;
  }
}

export const momentumEngine = MomentumEngine.getInstance();
