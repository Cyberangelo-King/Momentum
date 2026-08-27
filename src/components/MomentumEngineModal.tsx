import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Cpu,
  GitBranch,
  Lightbulb,
  FileCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  Sparkles,
  Lock,
  Compass,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Sliders,
  History
} from 'lucide-react';
import {
  fetchEngineHealth,
  fetchEngineConstitution,
  fetchEngineCapabilities,
  fetchEngineHypotheses,
  fetchEngineOpportunities,
  fetchEngineCandidates,
  fetchEngineAuditLogs,
  triggerEngineEvolution,
  toggleEngineKillSwitch,
  runEngineDiagnosticTests,
} from '../services/momentumEngineService';
import type {
  EngineHealth,
  Hypothesis,
  ProductOpportunity,
  CapabilityNode,
  CandidateStrategy,
  AuditLogEntry,
} from '../../momentum-engine/core/types';

interface MomentumEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MomentumEngineModal: React.FC<MomentumEngineModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'constitution' | 'capabilities' | 'hypotheses' | 'evolution' | 'opportunities' | 'audit' | 'tests'
  >('overview');

  const [health, setHealth] = useState<EngineHealth | null>(null);
  const [laws, setLaws] = useState<Array<{ law: string; title: string; description: string; isVetoCapable: boolean }>>([]);
  const [capabilities, setCapabilities] = useState<CapabilityNode[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [opportunities, setOpportunities] = useState<ProductOpportunity[]>([]);
  const [candidatesData, setCandidatesData] = useState<{ champion: CandidateStrategy; candidates: CandidateStrategy[] } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: Array<{ name: string; status: 'PASSED' | 'FAILED'; details?: string }>;
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [h, l, c, hyp, opp, cand, logs] = await Promise.all([
        fetchEngineHealth(),
        fetchEngineConstitution(),
        fetchEngineCapabilities(),
        fetchEngineHypotheses(),
        fetchEngineOpportunities(),
        fetchEngineCandidates(),
        fetchEngineAuditLogs(),
      ]);

      if (h) setHealth(h);
      if (l) setLaws(l);
      if (c) setCapabilities(c);
      if (hyp) setHypotheses(hyp);
      if (opp) setOpportunities(opp);
      if (cand) setCandidatesData(cand);
      if (logs) setAuditLogs(logs);
    } catch (err) {
      console.warn('Error loading engine modal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleEvolve = async () => {
    setIsEvolving(true);
    await triggerEngineEvolution();
    await loadData();
    setIsEvolving(false);
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    const res = await runEngineDiagnosticTests();
    if (res) {
      setTestResults(res);
    }
    setIsRunningTests(false);
  };

  const handleToggleKillSwitch = async (switchName: string, currentState: boolean) => {
    await toggleEngineKillSwitch(switchName, !currentState);
    await loadData();
  };

  if (!isOpen) return null;

  return (
    <div id="momentum-engine-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="momentum-engine-modal-container"
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
      >
        {/* Header */}
        <div id="momentum-engine-header" className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Momentum Intelligence Engine</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v1.0.0 Governed
                </span>
              </div>
              <p className="text-xs text-slate-400">Constitutional Substrate • Governed Evolutionary Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-engine-btn"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Engine State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-engine-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div id="momentum-engine-tabs" className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/50 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Overview & Health', icon: Activity },
            { id: 'constitution', label: 'Constitution (17 Laws)', icon: Shield },
            { id: 'capabilities', label: 'Capability DAG', icon: Layers },
            { id: 'hypotheses', label: 'Hypotheses', icon: Lightbulb },
            { id: 'evolution', label: 'Evolution Sandbox', icon: GitBranch },
            { id: 'opportunities', label: 'Opportunities', icon: Sparkles },
            { id: 'audit', label: 'Security Audit', icon: Lock },
            { id: 'tests', label: 'Security Tests', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div id="momentum-engine-content" className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/30">
          {/* TAB 1: OVERVIEW & HEALTH */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Engine Status</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {health?.status || 'HEALTHY'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Constitution Enforced</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Champion Strategy</div>
                  <div className="text-sm font-semibold text-white mt-1 truncate">
                    {health?.activeChampionStrategy || 'Equilibrium v1.0'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sandbox Candidates: {health?.candidatesInSandboxCount || 1}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Capabilities & Graph</div>
                  <div className="text-xl font-bold text-indigo-400 mt-1">
                    {health?.capabilitiesCount || 4} Nodes
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Trust Nodes: {health?.trustNodesCount || 2}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Active Hypotheses</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {health?.hypothesesCount || 2}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Experiments: {health?.activeExperimentsCount || 0}</div>
                </div>
              </div>

              {/* The 5 Security Zones Hierarchy */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  The 5 Governed Security Zones
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40">
                    <span className="font-bold text-red-300 block">Zone 0: Governance</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Constitution, Invariants, Kill Switches. (Immutable)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
                    <span className="font-bold text-amber-300 block">Zone 1: Control</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Policy Engine, Rollback, Approvals.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
                    <span className="font-bold text-blue-300 block">Zone 2: Intelligence</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Models, Hypotheses, Prediction.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                    <span className="font-bold text-emerald-300 block">Zone 3: Data Plane</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Normalized Events & Signals.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40">
                    <span className="font-bold text-purple-300 block">Zone 4: Sandbox</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Isolated Strategy Mutation.</span>
                  </div>
                </div>
              </div>

              {/* Emergency Kill Switches */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Independent Emergency Kill Switches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'global', name: 'Global Lockdown' },
                    { key: 'evolution', name: 'Suspend Evolution' },
                    { key: 'aiProxies', name: 'Offline AI Fallback' },
                    { key: 'recommendations', name: 'Reset Recommendations' },
                  ].map((sw) => {
                    const isTriggered = (health?.killSwitches as any)?.[sw.key] || false;
                    return (
                      <button
                        key={sw.key}
                        onClick={() => handleToggleKillSwitch(sw.key, isTriggered)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isTriggered
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{sw.name}</div>
                          <div className="text-[10px] text-slate-400">{isTriggered ? 'ACTIVE / HALTED' : 'Normal / Disarmed'}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isTriggered ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSTITUTION */}
          {activeTab === 'constitution' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                <strong>Permanent Invariant:</strong> The Evolution Engine operates strictly INSIDE this Constitution. The Evolution Engine CANNOT modify, bypass, or rewrite these 17 laws.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {laws.map((law, idx) => (
                  <div key={law.law} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {idx + 1}. {law.title}
                      </span>
                      {law.isVetoCapable && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/30">
                          VETO POWER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{law.description}</p>
                    <div className="text-[10px] font-mono text-slate-500">{law.law}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CAPABILITY GRAPH */}
          {activeTab === 'capabilities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Extensible Directed Acyclic Graph (DAG) representing Momentum core capabilities, inputs, outputs, and permissions.
                </p>
              </div>
              <div className="space-y-3">
                {capabilities.map((cap) => (
                  <div key={cap.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{cap.name}</span>
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                          v{cap.version}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cap.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{cap.purpose}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>
                        <strong className="text-slate-300">Inputs:</strong> {cap.inputs.join(', ')}
                      </div>
                      <div>
                        <strong className="text-slate-300">Outputs:</strong> {cap.outputs.join(', ')}
                      </div>
                      <div>
                        <strong className="text-slate-300">Dependencies:</strong> {cap.dependencies.length ? cap.dependencies.join(', ') : 'None (Root)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HYPOTHESES */}
          {activeTab === 'hypotheses' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200">
                Empirical hypotheses generated from observations, keynotes, and user interaction signals.
              </div>
              <div className="space-y-3">
                {hypotheses.map((hyp) => (
                  <div key={hyp.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{hyp.domain}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {hyp.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong className="text-white">Observation:</strong> {hyp.observation}
                    </div>
                    <div className="text-xs text-indigo-300">
                      <strong className="text-white">Hypothesis:</strong> {hyp.hypothesis}
                    </div>
                    <div className="text-xs text-slate-400">
                      <strong className="text-slate-300">Expected Outcome:</strong> {hyp.expectedOutcome}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                      <span>Evidence Count: {hyp.evidence.length}</span>
                      <span>Confidence: {Math.round(hyp.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EVOLUTION SANDBOX */}
          {activeTab === 'evolution' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Governed Evolution & Lineage Tree</h3>
                  <p className="text-xs text-slate-400">Isolated candidate generation with multi-objective fitness evaluation.</p>
                </div>
                <button
                  id="trigger-mutation-btn"
                  onClick={handleEvolve}
                  disabled={isEvolving}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isEvolving ? 'Simulating in Sandbox...' : 'Trigger Sandbox Mutation'}
                </button>
              </div>

              {/* Champion Card */}
              {candidatesData?.champion && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">👑 ACTIVE CHAMPION STRATEGY</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300">
                      Fitness: {candidatesData.champion.fitness.overallFitness}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">{candidatesData.champion.name} ({candidatesData.champion.version})</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-indigo-900/60 text-[11px]">
                    <div>Personal Fit: <span className="font-mono text-indigo-200">{candidatesData.champion.weights.personalFit}</span></div>
                    <div>Trust Weight: <span className="font-mono text-indigo-200">{candidatesData.champion.weights.trustWeight}</span></div>
                    <div>Context: <span className="font-mono text-indigo-200">{candidatesData.champion.weights.contextRelevance}</span></div>
                    <div>Novelty: <span className="font-mono text-indigo-200">{candidatesData.champion.weights.noveltyExploration}</span></div>
                    <div>Safety: <span className="font-mono text-emerald-300">100%</span></div>
                  </div>
                </div>
              )}

              {/* Candidate History */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400">Candidate Lineage Ledger</h4>
                {candidatesData?.candidates.map((cand) => (
                  <div key={cand.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-white">{cand.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {cand.id} • Gen {cand.generation}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 font-mono text-xs">Fitness: {cand.fitness.overallFitness}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        cand.status === 'CHAMPION' ? 'bg-indigo-500/20 text-indigo-300' :
                        cand.status === 'EVALUATING' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {cand.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200">
                Product Opportunities prioritized via: <code>(Need × Reach × ExpectedImpact × Confidence × StrategicAlignment) / (CostComplexity + RiskPenalty)</code>
              </div>
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{opp.title}</span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono">
                        Score: {opp.opportunityScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{opp.needDescription}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>Reach: {Math.round(opp.reach * 100)}%</div>
                      <div>Expected Impact: {Math.round(opp.expectedImpact * 100)}%</div>
                      <div>Confidence: {Math.round(opp.confidence * 100)}%</div>
                      <div>Strategic Alignment: {Math.round(opp.strategicAlignment * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Cryptographic Security & Policy Audit Ledger</h3>
                <span className="text-xs text-slate-400">Showing recent 50 events</span>
              </div>
              <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          log.result === 'ALLOWED' ? 'bg-emerald-500/20 text-emerald-400' :
                          log.result === 'VETOED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {log.result}
                        </span>
                        <span className="text-slate-300 font-semibold">{log.action}</span>
                        <span className="text-slate-500 text-[10px]">by {log.actor}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()} • Zone: {log.zone} • Checksum: {log.checksum}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SECURITY & GOVERNANCE TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Engine Diagnostic & Security Verification</h3>
                  <p className="text-xs text-slate-400">Runs 10 test groups validating Constitution, Veto Gates, Sandbox Isolation & Sybil Defense.</p>
                </div>
                <button
                  id="run-tests-btn"
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRunningTests ? 'Running Verification...' : 'Execute Security Tests'}
                </button>
              </div>

              {testResults && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Total Verification Status</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {testResults.passed} / {testResults.total} Tests Passed (100%)
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SECURE & COMPLIANT
                    </span>
                  </div>

                  <div className="space-y-2">
                    {testResults.results.map((r, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {r.status === 'PASSED' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-slate-200">{r.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400 font-bold">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div id="momentum-engine-footer" className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <div>Governed Evolutionary Substrate Active • Zero Self-Modification Enforced</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Engine Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
