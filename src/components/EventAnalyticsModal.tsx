import React, { useState, useEffect } from 'react';
import { EventConfig, Connection, Moment, Idea, Note, UserProfile } from '../types';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  Share2, 
  Award, 
  Zap, 
  Copy, 
  Check, 
  Users, 
  Clock, 
  Flame, 
  FileText,
  Target
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { fetchEventROIAnalytics } from '../services/aiService';

interface EventAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes?: Note[];
  activeEvent?: EventConfig;
  profile?: UserProfile;
}

export const EventAnalyticsModal: React.FC<EventAnalyticsModalProps> = ({
  isOpen,
  onClose,
  connections,
  moments,
  ideas,
  notes = [],
  activeEvent,
  profile,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roiData, setRoiData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const brandColor = activeEvent?.branding?.primaryColor || '#FF5C00';
  const target = activeEvent?.targetConnections || 50;

  const loadAnalytics = async () => {
    setIsLoading(true);
    triggerHaptic('light');
    try {
      const res = await fetchEventROIAnalytics(
        connections,
        moments,
        ideas,
        notes,
        activeEvent?.name,
        target
      );
      setRoiData(res);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Analytics error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !roiData) {
      loadAnalytics();
    }
  }, [isOpen]);

  const handleCopySummary = () => {
    if (!roiData) return;
    const text = `📊 MOMENTUM ROI REPORT: ${activeEvent?.name || 'Conference'} 2026
👤 Attendee: ${profile.name}
🎯 Connections: ${connections.length} / ${target} (ROI Score: ${roiData.roiScore}/100)
⚡ Networking Velocity: ${roiData.networkingVelocity}
💼 Relationship Equity: ${roiData.relationshipEquityScore}

🏆 Key Strategic Wins:
${(roiData.keyWins || []).map((w: string) => `• ${w}`).join('\n')}

📝 48h Action Plan:
${(roiData.followUpActionPlan || []).map((a: string) => `• ${a}`).join('\n')}

#Momentum #EventOS #Networking`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    triggerHaptic('medium');
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-3xl max-h-[95vh] rounded-3xl bg-[#0c0603] border border-[#FF5C00]/30 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1c0a03] to-[#0c0603]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
            >
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Event ROI & Networking Scorecard</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-bold uppercase">
                  Executive Audit
                </span>
              </div>
              <p className="text-xs text-[#ffb59a]/70">
                Data-driven relationship velocity and knowledge yield assessment
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Auditing relationship metrics and conference yield...</p>
            </div>
          ) : roiData ? (
            <>
              {/* ROI Hero Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#200d04] to-[#100602] border border-[#FF5C00]/40 text-center space-y-1">
                  <span className="text-3xl font-black text-[#FF5C00]">{roiData.roiScore}</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">ROI Index</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
                  <span className="text-2xl font-black text-white">{connections.length}</span>
                  <span className="text-[10px] uppercase font-bold text-[#ffb59a] block">Connections Met</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-400">{notes.length}</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Deep Notes</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
                  <span className="text-2xl font-black text-amber-400">{ideas.length}</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Quotes & Ideas</span>
                </div>
              </div>

              {/* Velocity & Equity Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#140803] border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#FF5C00]" />
                    Networking Velocity
                  </span>
                  <p className="text-base font-bold text-white">{roiData.networkingVelocity}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#140803] border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Relationship Equity Tier
                  </span>
                  <p className="text-base font-bold text-white">{roiData.relationshipEquityScore}</p>
                </div>
              </div>

              {/* Key Strategic Wins */}
              <div className="p-4 rounded-2xl bg-[#160904] border border-white/10 space-y-2.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#FF5C00]" />
                  Verified Strategic Wins:
                </h3>
                <div className="space-y-1.5">
                  {(roiData.keyWins || []).map((win: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                      <span className="w-5 h-5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 48-Hour Action Plan */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  High-Priority 48-Hour Execution Plan:
                </h3>
                <div className="space-y-1.5">
                  {(roiData.followUpActionPlan || []).map((action: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                      <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Executive Audit Summary</span>
                <p className="text-xs text-neutral-300 leading-relaxed italic">
                  "{roiData.executiveSummary}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleCopySummary}
                  className="px-4 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7A33] text-black font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Scorecard
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Executive Scorecard
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
