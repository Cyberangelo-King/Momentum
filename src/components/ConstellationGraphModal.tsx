import React, { useState, useMemo, useEffect } from 'react';
import { Connection, EventConfig, WarmIntroRecommendation, UserProfile } from '../types';
import { 
  X, 
  Share2, 
  Sparkles, 
  Users, 
  Zap, 
  Copy, 
  Check, 
  Send, 
  ArrowRight, 
  Filter, 
  Maximize2,
  Minimize2,
  Search,
  MessageCircle,
  Mail,
  Linkedin
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { fetchWarmIntroRecommendations } from '../services/aiService';

interface ConstellationGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  profile?: UserProfile;
  activeEvent?: EventConfig;
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickMessage?: (connection: Connection) => void;
}

export const ConstellationGraphModal: React.FC<ConstellationGraphModalProps> = ({
  isOpen,
  onClose,
  connections,
  profile,
  activeEvent,
  onSelectConnection,
  onOpenQuickMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'constellation' | 'matchmaker'>('constellation');
  const [selectedNode, setSelectedNode] = useState<Connection | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Matchmaker state
  const [isLoadingIntros, setIsLoadingIntros] = useState<boolean>(false);
  const [introRecommendations, setIntroRecommendations] = useState<WarmIntroRecommendation[]>([]);
  const [copiedIntroId, setCopiedIntroId] = useState<string | null>(null);

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      if (filterRole !== 'all' && c.relationship !== filterRole) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchComp = (c.company || '').toLowerCase().includes(q);
        const matchRole = (c.profession || '').toLowerCase().includes(q);
        const matchTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchComp && !matchRole && !matchTags) return false;
      }
      return true;
    });
  }, [connections, filterRole, searchQuery]);

  // Generate orbital coordinates for nodes
  const nodesWithPositions = useMemo(() => {
    const total = filteredConnections.length;
    if (total === 0) return [];

    const centerX = 350;
    const centerY = 280;
    const innerRadius = 110;
    const midRadius = 180;
    const outerRadius = 240;

    return filteredConnections.map((conn, idx) => {
      let radius = midRadius;
      if (conn.priority === 'high') radius = innerRadius;
      else if (conn.priority === 'low') radius = outerRadius;

      // Golden ratio angle distribution
      const angle = (idx * (2 * Math.PI / Math.max(total, 1))) + (idx * 0.3);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        ...conn,
        x,
        y,
      };
    });
  }, [filteredConnections]);

  // Fetch AI Matchmaker suggestions on demand
  const handleLoadIntros = async () => {
    if (connections.length < 2) return;
    setIsLoadingIntros(true);
    triggerHaptic('light');
    try {
      const res = await fetchWarmIntroRecommendations(connections, activeEvent?.name);
      setIntroRecommendations(res.recommendations);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Matchmaker load failed:', e);
    } finally {
      setIsLoadingIntros(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'matchmaker' && introRecommendations.length === 0 && connections.length >= 2) {
      handleLoadIntros();
    }
  }, [isOpen, activeTab]);

  const handleCopyIntro = (intro: WarmIntroRecommendation) => {
    navigator.clipboard.writeText(intro.draftIntroMessage);
    setCopiedIntroId(intro.id);
    triggerHaptic('medium');
    setTimeout(() => setCopiedIntroId(null), 2500);
  };

  const handleSendChannel = (intro: WarmIntroRecommendation) => {
    triggerHaptic('light');
    const msg = encodeURIComponent(intro.draftIntroMessage);
    if (intro.channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    } else if (intro.channel === 'email') {
      const sub = encodeURIComponent(intro.suggestedSubject);
      window.open(`mailto:?subject=${sub}&body=${msg}`, '_blank');
    } else {
      window.open(`https://www.linkedin.com/messaging/`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div 
        className={`w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl max-h-[92dvh] rounded-3xl'} bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden text-white transition-all my-auto`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--border-accent)] flex items-center justify-center shadow-lg shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Constellation Graph & Matchmaker</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-semibold uppercase">
                  {connections.length} Nodes
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Visual relationship radar & AI double-opt-in warm intro engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsFullscreen(!isFullscreen);
              }}
              className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              aria-label="Close Constellation Modal"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('constellation');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'constellation'
                  ? 'border-[var(--accent-primary)] text-white bg-white/5'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Interactive Radar Graph
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('matchmaker');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matchmaker'
                  ? 'border-[var(--accent-primary)] text-white bg-white/5'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              AI Warm Intro Matchmaker
              {introRecommendations.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold">
                  {introRecommendations.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters for Graph */}
          {activeTab === 'constellation' && (
            <div className="flex items-center gap-2 pb-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 text-xs rounded-lg bg-black/40 border border-[var(--border-subtle)] text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => {
                  triggerHaptic('light');
                  setFilterRole(e.target.value);
                }}
                className="px-2 py-1 text-xs rounded-lg bg-black/40 border border-[var(--border-subtle)] text-neutral-300 focus:outline-none"
              >
                <option value="all">All Tiers</option>
                <option value="lead">Leads & Founders</option>
                <option value="speaker">Keynote Speakers</option>
                <option value="mentor">Mentors & VCs</option>
                <option value="peer">Peers & Builders</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[380px] p-4 relative">
          {activeTab === 'constellation' ? (
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              {/* Interactive SVG Canvas */}
              <div className="flex-1 min-h-[360px] relative rounded-2xl bg-black/40 border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center">
                {/* Background Radar Rings */}
                <svg className="w-full h-full min-h-[380px]" viewBox="0 0 700 560">
                  <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>

                  {/* Radar Circles */}
                  <circle cx="350" cy="280" r="240" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <circle cx="350" cy="280" r="180" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <circle cx="350" cy="280" r="110" fill="none" stroke="var(--border-accent)" />
                  <circle cx="350" cy="280" r="45" fill="url(#radarGlow)" />

                  {/* Center Node (You / Momentum User) */}
                  <circle cx="350" cy="280" r="16" fill="var(--accent-primary)" className="animate-pulse" />
                  <text x="350" y="284" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold">YOU</text>

                  {/* Connection Lines from Center */}
                  {nodesWithPositions.map((node) => (
                    <line
                      key={`line-${node.id}`}
                      x1="350"
                      y1="280"
                      x2={node.x}
                      y2={node.y}
                      stroke="url(#lineGrad)"
                      strokeWidth={node.priority === 'high' ? 1.5 : 0.8}
                      opacity={selectedNode && selectedNode.id !== node.id ? 0.2 : 0.6}
                    />
                  ))}

                  {/* Inter-Node Links (Matching tags) */}
                  {nodesWithPositions.map((nodeA, i) =>
                    nodesWithPositions.slice(i + 1).map((nodeB) => {
                      const sharedTag = (nodeA.tags || []).some((t) => (nodeB.tags || []).includes(t));
                      if (!sharedTag) return null;
                      return (
                        <line
                          key={`inter-${nodeA.id}-${nodeB.id}`}
                          x1={nodeA.x}
                          y1={nodeA.y}
                          x2={nodeB.x}
                          y2={nodeB.y}
                          stroke="var(--accent-primary)"
                          strokeWidth="0.5"
                          strokeDasharray="2 2"
                          opacity="0.25"
                        />
                      );
                    })
                  )}

                  {/* Connection Nodes */}
                  {nodesWithPositions.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isHigh = node.priority === 'high';
                    return (
                      <g
                        key={`node-${node.id}`}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedNode(node);
                        }}
                        className="cursor-pointer transition-transform hover:scale-125"
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isHigh ? 18 : 14}
                          fill={isSelected ? '#ffffff' : 'var(--bg-surface-card)'}
                          stroke={isHigh ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)'}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all duration-200 shadow-md"
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fill={isSelected ? '#000000' : '#ffffff'}
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {node.name.charAt(0)}
                        </text>
                        {/* Name label beneath */}
                        <text
                          x={node.x}
                          y={node.y + 24}
                          textAnchor="middle"
                          fill="var(--text-secondary)"
                          fontSize="8"
                          fontWeight="600"
                          opacity={isSelected ? 1 : 0.8}
                        >
                          {node.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Radar Legend */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-[10px] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                    <span className="text-neutral-300">Inner Orbit: High Priority Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full border border-white/40" />
                    <span className="text-neutral-400">Mid/Outer: Peers & Collaborators</span>
                  </div>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="w-full lg:w-72 bg-[var(--bg-surface-subtle)] rounded-2xl border border-[var(--border-subtle)] p-4 flex flex-col justify-between">
                {selectedNode ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[var(--border-accent)] overflow-hidden shrink-0">
                        {selectedNode.avatarUrl || selectedNode.photos?.[0] ? (
                          <img
                            src={selectedNode.avatarUrl || selectedNode.photos?.[0]}
                            alt={selectedNode.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[var(--accent-primary)]">
                            {selectedNode.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white leading-tight">{selectedNode.name}</h3>
                        <p className="text-xs text-[var(--accent-primary)]">{selectedNode.profession}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{selectedNode.company}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">Context / Notes</span>
                      <p className="line-clamp-3 text-neutral-300 italic">
                        "{selectedNode.notes || 'Met during active conference session.'}"
                      </p>
                    </div>

                    {selectedNode.tags && selectedNode.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--border-accent)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onSelectConnection(selectedNode);
                        }}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer hover:brightness-110"
                      >
                        Open Full Profile Dossier
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400">
                    <Users className="w-10 h-10 mb-2 opacity-30 text-[var(--accent-primary)]" />
                    <p className="text-xs font-semibold text-white">Select any star node</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Tap on a contact on the constellation map to inspect relationship synergy and shared tags.
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                  <span>Total Network</span>
                  <span className="font-bold text-[var(--accent-primary)]">{connections.length} connections</span>
                </div>
              </div>
            </div>
          ) : (
            /* AI Warm Intro Matchmaker */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                    AI Double-Opt-In Warm Intro Recommender
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Scans your attendee network to find synergistic pairs and drafts warm introduction messages.
                  </p>
                </div>
                <button
                  onClick={handleLoadIntros}
                  disabled={isLoadingIntros}
                  className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isLoadingIntros ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>

              {isLoadingIntros ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">AI Superconnector analyzing mutual tags, company goals & keynotes...</p>
                </div>
              ) : introRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {introRecommendations.map((intro) => (
                    <div
                      key={intro.id}
                      className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-all space-y-3"
                    >
                      {/* Pair Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-[var(--bg-surface-card)] flex items-center justify-center font-bold text-xs text-[var(--accent-primary)] overflow-hidden">
                              {intro.personA.avatarUrl ? (
                                <img src={intro.personA.avatarUrl} alt={intro.personA.name} className="w-full h-full object-cover" />
                              ) : (
                                intro.personA.name.charAt(0)
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-[var(--bg-surface-card)] flex items-center justify-center font-bold text-xs text-amber-400 overflow-hidden">
                              {intro.personB.avatarUrl ? (
                                <img src={intro.personB.avatarUrl} alt={intro.personB.name} className="w-full h-full object-cover" />
                              ) : (
                                intro.personB.name.charAt(0)
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              <span>{intro.personA.name}</span>
                              <span className="text-[var(--accent-primary)]">↔</span>
                              <span>{intro.personB.name}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              {intro.personA.company || 'Innovator'} & {intro.personB.company || 'Leader'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {intro.sharedInterests.map((t, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Synergy Reason */}
                      <p className="text-xs text-neutral-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <strong className="text-white">Synergy Thesis: </strong>
                        {intro.synergyReason}
                      </p>

                      {/* Draft Message */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                          <span>Drafted Message ({intro.channel.toUpperCase()})</span>
                          <span className="italic">{intro.suggestedSubject}</span>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                          {intro.draftIntroMessage}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleCopyIntro(intro)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          {copiedIntroId === intro.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Intro
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleSendChannel(intro)}
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 border border-[var(--border-accent)] text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          {intro.channel === 'whatsapp' ? (
                            <MessageCircle className="w-3.5 h-3.5" />
                          ) : intro.channel === 'email' ? (
                            <Mail className="w-3.5 h-3.5" />
                          ) : (
                            <Linkedin className="w-3.5 h-3.5" />
                          )}
                          Dispatch via {intro.channel.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-[var(--accent-primary)]" />
                  <p className="text-xs font-bold text-white">Need at least 2 connections to find match synergies</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Capture more contacts during sessions and networking breaks, then return here to discover high-value warm intros.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
