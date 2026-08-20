import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Connection, Moment, Idea, UserProfile } from '../types';
import { generateDailyRecap, RecapResponse } from '../services/aiService';
import { 
  RotateCw, 
  Flame, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  LayoutGrid, 
  ChevronRight, 
  Star 
} from 'lucide-react';

interface RecapViewProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  profile: UserProfile;
  onOpenExports: () => void;
  onOpenCollage: () => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  connections,
  moments,
  ideas,
  profile,
  onOpenExports,
  onOpenCollage,
}) => {
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [isLoadingRecap, setIsLoadingRecap] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  const total = connections.length;
  const target = profile.targetConnections || 50;
  const isGoalMet = total >= target;

  useEffect(() => {
    loadRecap();
  }, [connections.length, moments.length, ideas.length]);

  const loadRecap = async () => {
    setIsLoadingRecap(true);
    try {
      const names = connections.map((c) => c.name);
      const topIdeas = ideas.map((i) => i.quote);
      const res = await generateDailyRecap(total, moments.length, ideas.length, names, topIdeas);
      setRecapData(res);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoadingRecap(false);
    }
  };

  const handleCopyPost = () => {
    if (!recapData) return;
    navigator.clipboard.writeText(recapData.linkedInPost);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2000);
  };

  const handleTriggerMilestoneConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FF5C00', '#fadcd2', '#ffffff', '#ffb59a'],
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
            Reflection & Impact
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Event Recap & Synthesis
          </h1>
          <p className="text-xs text-[#e4beb1]/70 mt-1">
            "I came to TEDxAkure to meet 50 people. I captured the people, moments, and ideas — and I know what to do next."
          </p>
        </div>

        <button
          onClick={loadRecap}
          disabled={isLoadingRecap}
          className="p-2.5 rounded-xl bg-[#28130a] text-[#ffb59a] hover:bg-[#381a0e] border border-white/10 text-xs font-semibold flex items-center gap-1.5"
          title="Regenerate Synthesis"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecap ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh AI</span>
        </button>
      </div>

      {/* 50-Connection Milestone Card */}
      <div
        onClick={handleTriggerMilestoneConfetti}
        className="bg-gradient-to-br from-[#2b1207] via-[#1a0c06] to-[#0A0A0A] border border-[#FF5C00]/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl cursor-pointer group"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FF5C00] text-black flex items-center justify-center font-bold text-xs">
                ★
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF5C00]">
                {isGoalMet ? 'Milestone Completed' : 'Progressing to Goal'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2]">
              {total} of {target} Connections Met
            </h2>
            <p className="text-xs text-[#e4beb1]/75 leading-relaxed">
              {isGoalMet
                ? 'Incredible work! You reached your goal of 50 new relationships at TEDxAkure 2026. Tap to celebrate!'
                : `You are currently at ${Math.round((total / target) * 100)}% of your connection target. Keep the momentum going!`}
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF5C00] text-black flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Flame className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[#e4beb1]/70">Connections</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2]">
              {total}
            </span>
            <span className="text-xs text-[#FF5C00] font-bold ml-1">/ 50</span>
          </div>
        </div>

        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[#e4beb1]/70">Moments Logged</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2]">
              {moments.length}
            </span>
            <span className="text-xs text-[#e4beb1]/50 ml-1">photos & vids</span>
          </div>
        </div>

        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[#e4beb1]/70">Talk Insights</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2]">
              {ideas.length}
            </span>
            <span className="text-xs text-[#e4beb1]/50 ml-1">quotes</span>
          </div>
        </div>

        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[#e4beb1]/70">Follow-ups Due</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2]">
              {connections.filter((c) => c.followUpStatus === 'today' || c.followUpStatus === 'overdue').length}
            </span>
            <span className="text-xs text-red-400 font-bold ml-1">active</span>
          </div>
        </div>
      </div>

      {/* AI Daily Synthesis Card */}
      <div className="bg-[#180b06] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF5C00]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1]">
            Gemini Daily Synthesis
          </h3>
        </div>

        {isLoadingRecap ? (
          <div className="py-8 flex flex-col items-center justify-center text-xs text-[#e4beb1]/60 gap-2">
            <span className="w-6 h-6 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin"></span>
            <span>Synthesizing your conference journey...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#fadcd2] font-serif-display leading-relaxed">
              {recapData?.dailySynthesis ||
                `Your interactions today clustered around two powerful themes: Pan-African logistics and AI ethics in emerging markets. You established ${total} key touchpoints with speakers leading these discussions.`}
            </p>

            {/* Theme Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(recapData?.themes || ['Pan-African Logistics', 'AI Ethics', 'Emerging Tech']).map(
                (theme, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full bg-[#271812] text-[#ffb59a] border border-[#FF5C00]/30 font-semibold"
                  >
                    #{theme}
                  </span>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* LinkedIn Shareable Post Card */}
      <div className="bg-[#140b07] border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#0A66C2]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1]">
              LinkedIn Event Reflection
            </h3>
          </div>

          <button
            onClick={handleCopyPost}
            className="px-3 py-1.5 rounded-lg bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 shadow"
          >
            {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPost ? 'Copied to Clipboard' : 'Copy Post'}
          </button>
        </div>

        <div className="bg-[#0d0603] p-4 rounded-xl border border-white/10 text-xs text-[#fadcd2] leading-relaxed whitespace-pre-line font-mono">
          {recapData?.linkedInPost}
        </div>
      </div>

      {/* Action shortcuts for exports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onOpenExports}
          className="p-4 rounded-2xl bg-[#28130a] hover:bg-[#381a0e] border border-white/10 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#FF5C00]" />
            <div>
              <h4 className="text-sm font-bold text-[#fadcd2]">Export Journal PDF</h4>
              <p className="text-[11px] text-[#e4beb1]/60">Full formatted conference archive</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>

        <button
          onClick={onOpenCollage}
          className="p-4 rounded-2xl bg-[#28130a] hover:bg-[#381a0e] border border-white/10 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-[#ffb59a]" />
            <div>
              <h4 className="text-sm font-bold text-[#fadcd2]">Photo Collage Generator</h4>
              <p className="text-[11px] text-[#e4beb1]/60">High-res shareable image</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </div>
  );
};
