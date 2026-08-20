import React from 'react';
import { GamificationStats, GamificationBadge } from '../services/gamification';
import confetti from 'canvas-confetti';
import { Trophy, Award, Zap, CheckCircle2, Lock, X, Sparkles, Flame, Target, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GamificationStats;
}

export const GamificationModal: React.FC<GamificationModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#FF5C00', '#ffb59a', '#ffffff', '#e4beb1', '#ffd700'],
    });
  };

  const unlockedCount = stats.badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-[#120804] border border-white/10 sm:rounded-3xl rounded-t-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#2a1106] via-[#1c0b04] to-[#120804] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] flex items-center justify-center text-2xl shadow-inner">
              {stats.levelBadge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] uppercase tracking-wider">
                  Level {stats.level}
                </span>
                <span className="text-xs text-[#e4beb1]/60">TEDxAkure Quest</span>
              </div>
              <h2 className="text-xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
                {stats.levelTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main XP Card */}
          <div className="p-5 rounded-2xl bg-[#1a0c06] border border-white/10 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C00]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs text-[#e4beb1]/70 uppercase font-semibold tracking-wider">
                  Total Momentum XP
                </span>
                <div className="text-3xl font-bold font-serif-display text-[#fadcd2] flex items-center gap-1.5 mt-0.5">
                  <span>{stats.totalXp}</span>
                  <span className="text-xs text-[#FF5C00] font-sans-ui font-bold">XP</span>
                </div>
              </div>

              <button
                onClick={triggerCelebration}
                className="px-3.5 py-2 rounded-xl bg-[#FF5C00] hover:bg-[#ff7a33] text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrate</span>
              </button>
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-[#e4beb1]/70 font-semibold">
                <span>Next Tier: Level {stats.level + 1}</span>
                <span>{stats.levelProgressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.levelProgressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#FF5C00] to-[#ffb59a] rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#e4beb1]/50">
                <span>{stats.currentLevelBaseXp} XP</span>
                <span>{stats.nextLevelXp} XP</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#160a05] border border-white/5">
              <span className="text-[10px] text-[#e4beb1]/60 uppercase font-bold tracking-wider">
                Connects
              </span>
              <p className="text-lg font-bold text-[#fadcd2] font-serif-display mt-0.5">
                {stats.connectionsCount}/{stats.targetConnections}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#160a05] border border-white/5">
              <span className="text-[10px] text-[#e4beb1]/60 uppercase font-bold tracking-wider">
                Photos Saved
              </span>
              <p className="text-lg font-bold text-[#fadcd2] font-serif-display mt-0.5">
                {stats.photosCount}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#160a05] border border-white/5">
              <span className="text-[10px] text-[#e4beb1]/60 uppercase font-bold tracking-wider">
                Badges Won
              </span>
              <p className="text-lg font-bold text-[#FF5C00] font-serif-display mt-0.5">
                {unlockedCount}/{stats.badges.length}
              </p>
            </div>
          </div>

          {/* Badges List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span>Conference Achievement Badges</span>
              </h3>
              <span className="text-xs font-semibold text-[#FF5C00]">
                {unlockedCount} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    badge.isUnlocked
                      ? 'bg-[#1c0c05] border-[#FF5C00]/30 shadow-md'
                      : 'bg-[#140804] border-white/5 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      badge.isUnlocked
                        ? 'bg-[#FF5C00] text-black font-bold shadow'
                        : 'bg-white/5 text-[#e4beb1]/40'
                    }`}
                  >
                    {badge.isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#fadcd2] truncate">
                        {badge.title}
                      </h4>
                      <span className="text-[10px] font-bold text-[#FF5C00] flex-shrink-0">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-[#e4beb1]/70 mt-0.5 leading-snug">
                      {badge.description}
                    </p>

                    {/* Mini Progress */}
                    {!badge.isUnlocked && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[9px] text-[#e4beb1]/50">
                          <span>Progress</span>
                          <span>
                            {badge.progress}/{badge.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FF5C00]/60 rounded-full"
                            style={{
                              width: `${(badge.progress / badge.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
