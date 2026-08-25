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
  onOpenPostEventReview?: () => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  connections,
  moments,
  ideas,
  profile,
  onOpenExports,
  onOpenCollage,
  onOpenPostEventReview,
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
          <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase font-mono">
            Reflection & Impact
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
            Event Recap & Synthesis
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            "I captured the people, moments, and ideas — and I know what to do next."
          </p>
        </div>

        <button
          onClick={loadRecap}
          disabled={isLoadingRecap}
          className="p-2.5 rounded-xl bg-[var(--bg-surface-card)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Regenerate Synthesis"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecap ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh AI</span>
        </button>
      </div>

      {/* 50-Connection Milestone Card */}
      <div
        onClick={handleTriggerMilestoneConfetti}
        className="bg-[var(--bg-surface-card)] border border-[var(--border-accent)] rounded-2xl p-6 relative overflow-hidden shadow-2xl cursor-pointer group"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-black flex items-center justify-center font-bold text-xs">
                ★
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] font-mono">
                {isGoalMet ? 'Milestone Completed' : 'Progressing to Goal'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
              {total} of {target} Connections Met
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isGoalMet
                ? 'Incredible work! You reached your goal of new relationships. Tap to celebrate!'
                : `You are currently at ${Math.round((total / target) * 100)}% of your connection target. Keep the momentum going!`}
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--accent-primary)] text-black flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Flame className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Connections</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
              {total}
            </span>
            <span className="text-xs text-[var(--accent-primary)] font-bold ml-1 font-mono">/ {target}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Moments Logged</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
              {moments.length}
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 font-mono">photos & vids</span>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Talk Insights</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
              {ideas.length}
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 font-mono">quotes</span>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between h-28">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Follow-ups Due</span>
          <div>
            <span className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
              {connections.filter((c) => c.followUpStatus === 'today' || c.followUpStatus === 'overdue').length}
            </span>
            <span className="text-xs text-red-400 font-bold ml-1 font-mono">active</span>
          </div>
        </div>
      </div>

      {/* AI Daily Synthesis Card */}
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            AI Daily Synthesis
          </h3>
        </div>

        {isLoadingRecap ? (
          <div className="py-8 flex flex-col items-center justify-center text-xs text-[var(--text-secondary)] gap-2">
            <span className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></span>
            <span>Synthesizing your event journey...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-primary)] font-serif-display leading-relaxed">
              {recapData?.dailySynthesis ||
                `Your interactions today clustered around key innovation and collaboration topics. You established ${total} key touchpoints with leaders driving these discussions.`}
            </p>

            {/* Theme Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(recapData?.themes || ['Pan-African Logistics', 'AI Ethics', 'Emerging Tech']).map(
                (theme, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] border border-[var(--border-accent)] font-semibold font-mono"
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
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#0A66C2]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              LinkedIn Event Reflection
            </h3>
          </div>

          <button
            onClick={handleCopyPost}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1.5 shadow transition-all"
          >
            {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPost ? 'Copied to Clipboard' : 'Copy Post'}
          </button>
        </div>

        <div className="bg-[var(--bg-canvas)] p-4 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-mono">
          {recapData?.linkedInPost}
        </div>
      </div>

      {/* 5-Pillar Comprehensive Synthesis Trigger */}
      {onOpenPostEventReview && (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface-card)] border border-[var(--border-accent)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)] text-black flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] uppercase tracking-wider font-mono">
                  5-Pillar Framework
                </span>
                <span className="text-xs text-[var(--text-secondary)]">AI Powered</span>
              </div>
              <h3 className="text-base font-bold text-white font-serif-display mt-0.5">
                Deep Post-Event Reflection & Forward Strategy
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                1. What happened • 2. What I learned • 3. Mindset shifts • 4. Action commitments • 5. Key follow-ups
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPostEventReview}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-lg min-h-[44px]"
          >
            <span>Open 5-Pillar Review</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action shortcuts for exports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onOpenExports}
          className="p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[var(--accent-primary)]" />
            <div>
              <h4 className="text-sm font-bold text-white">Export Journal PDF</h4>
              <p className="text-[11px] text-[var(--text-secondary)]">Full formatted conference archive</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>

        <button
          onClick={onOpenCollage}
          className="p-4 rounded-2xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-[var(--accent-primary)]" />
            <div>
              <h4 className="text-sm font-bold text-white">Photo Collage Generator</h4>
              <p className="text-[11px] text-[var(--text-secondary)]">High-res shareable image</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </div>
  );
};
