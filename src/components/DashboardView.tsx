import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Connection, EventSession, Moment, Idea, UserProfile } from '../types';
import { calculateGamification } from '../services/gamification';
import { useBatteryStatus } from '../hooks/useBatteryStatus';
import { 
  Trophy, 
  Sparkles, 
  Bolt, 
  Camera, 
  Lightbulb, 
  Users, 
  ChevronRight, 
  AlarmClock, 
  UserCheck, 
  TrendingUp,
  Award,
  CheckCircle2,
  Flame,
  BatteryWarning,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../services/haptics';

interface DashboardViewProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  sessions: EventSession[];
  profile: UserProfile;
  onOpenQuickConnect: () => void;
  onOpenCapture: () => void;
  onOpenAddIdea: () => void;
  onSelectConnection: (connection: Connection) => void;
  onSelectTab: (tab: any) => void;
  onOpenProfile?: () => void;
  onOpenGamification?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  connections,
  moments,
  ideas,
  sessions,
  profile,
  onOpenQuickConnect,
  onOpenCapture,
  onOpenAddIdea,
  onSelectConnection,
  onSelectTab,
  onOpenProfile,
  onOpenGamification,
}) => {
  const [isBatteryBannerDismissed, setIsBatteryBannerDismissed] = useState(false);
  const battery = useBatteryStatus();

  const currentCount = connections.length;
  const target = profile.targetConnections || 50;
  const percentage = Math.min(Math.round((currentCount / target) * 100), 100);

  const gamification = calculateGamification(connections, moments, ideas, target);

  // SVG Progress Ring calculations
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const triggerCelebration = () => {
    triggerHaptic('milestone');
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#FF5C00', '#ffb59a', '#ffffff', '#e4beb1', '#ffd700'],
    });
  };

  useEffect(() => {
    if (currentCount >= target && currentCount > 0) {
      triggerCelebration();
    }
  }, [currentCount, target]);

  // Next up session
  const nextSession = sessions[0] || {
    title: 'The Future of Lagos Tech',
    speaker: 'Dr. Amina Yusuf',
    timeStr: 'In 10 mins',
    stage: 'Main Stage',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb3Bc4wJERWd1XMsg7mlbuMAKjzifyF_VoYBU0OVa86tK2YyKoV6s4preMnBmZPP4Q_fat0Fq1b3k3jQ1Z1V5AEUPdpzQqZhekLbNW6Kh9AtJAKvR2n04MHa2SVjHthEnhN0bmVEveN04SRjEjOnyjrkcy7XhuLDsQ9MvQDLsJzhERPeQRx-nc_yNJzSzdEan1xnrw29CtCveBDFY8s99Vi4f1XTrzSr1HF1DJyzYi5fAAxsI2kjUAJw',
  };

  // Hourly networking momentum chart data
  const chartData = [
    { time: '8 AM', connections: 2 },
    { time: '10 AM', connections: 11 },
    { time: '12 PM', connections: 22 },
    { time: '2 PM', connections: 28 },
    { time: '4 PM', connections: currentCount },
  ];

  const overdueFollowUps = connections.filter((c) => c.followUpStatus === 'overdue' || c.followUpStatus === 'today');

  // Milestone checkpoints for the 50 connections goal
  const milestones = [
    { target: 10, label: 'Icebreaker', achieved: currentCount >= 10 },
    { target: 25, label: 'Halfway', achieved: currentCount >= 25 },
    { target: 40, label: 'Catalyst', achieved: currentCount >= 40 },
    { target: 50, label: 'Champion', achieved: currentCount >= 50 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-28 md:pb-16">
      {/* Mobile Top Welcome & Live Badge */}
      <div className="flex items-center justify-between gap-4">
        <div 
          onClick={() => {
            triggerHaptic('light');
            if (onOpenProfile) onOpenProfile();
          }} 
          className="cursor-pointer group flex items-center gap-3.5 min-w-0"
          title="Click to edit profile"
        >
          <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-[#FF5C00] transition-colors relative flex-shrink-0">
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] rounded-full border-2 border-black" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#FF5C00] tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-ping" />
              TEDxAkure 2026 • Live OS
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-display text-[#fadcd2] mt-0.5 truncate group-hover:text-white transition-colors">
              Welcome, {profile.name.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Gamification Level & Milestone Pill */}
        <button
          onClick={() => {
            triggerHaptic('light');
            if (onOpenGamification) onOpenGamification();
            else triggerCelebration();
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#1e0f08] border border-[#FF5C00]/30 hover:border-[#FF5C00] text-[#fadcd2] text-xs font-semibold shadow-md active:scale-95 transition-all group min-h-[44px]"
        >
          <span className="text-lg">{gamification.levelBadge}</span>
          <div className="text-left hidden sm:block">
            <div className="text-[10px] text-[#FF5C00] font-bold uppercase leading-none">
              Level {gamification.level}
            </div>
            <div className="text-[11px] text-[#ffb59a] font-semibold leading-none mt-1">
              {gamification.totalXp} XP
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-[#FF5C00] group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Low Battery Warning Banner (Battery Status API) */}
      <AnimatePresence>
        {battery.isSupported && battery.isLowBattery && !isBatteryBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#2c1005] via-[#1f0d04] to-[#160803] border border-[#FF5C00]/40 shadow-lg flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center flex-shrink-0 animate-pulse">
                <BatteryWarning className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#fadcd2]">
                    Low Device Battery ({battery.percentage}%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-bold uppercase tracking-wider">
                    Power Save Mode
                  </span>
                </div>
                <p className="text-[11px] text-[#e4beb1]/80 mt-0.5 leading-relaxed">
                  Conserve battery during keynotes: use Quick Connect text notes, lower screen brightness, and avoid high-res video recording.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBatteryBannerDismissed(true)}
              className="text-[#e4beb1]/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Circular 50-Connection Progress Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-[#1d0d06] via-[#120703] to-[#0d0502] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5C00]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#FF5C00]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Animated Progress Ring Visual */}
          <div 
            className="relative flex items-center justify-center cursor-pointer group flex-shrink-0" 
            onClick={() => {
              triggerCelebration();
            }}
          >
            {/* Ambient pulse glow on high progress */}
            <div className="absolute inset-0 rounded-full bg-[#FF5C00]/15 blur-xl group-hover:bg-[#FF5C00]/30 transition-all scale-95" />

            <svg width="180" height="180" className="transform -rotate-90">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8246" />
                  <stop offset="50%" stopColor="#FF5C00" />
                  <stop offset="100%" stopColor="#FF3300" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="text-white/10"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
              />

              {/* Framer Motion Animated Stroke Ring */}
              <motion.circle
                cx="90"
                cy="90"
                r={radius}
                stroke="url(#ringGradient)"
                strokeWidth="14"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
                strokeLinecap="round"
                fill="transparent"
                filter={percentage > 0 ? 'url(#glow)' : undefined}
              />
            </svg>

            {/* Inner Ring Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <motion.span 
                key={currentCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold font-serif-display text-[#fadcd2] tracking-tight"
              >
                {currentCount}
              </motion.span>
              <span className="text-[10px] text-[#e4beb1]/70 uppercase tracking-widest font-semibold mt-0.5">
                of {target} Target
              </span>
              <span className="text-[11px] text-[#FF5C00] font-bold mt-1 bg-[#FF5C00]/15 px-2 py-0.5 rounded-full">
                {percentage}% Done
              </span>
            </div>
          </div>

          {/* Context & Rapid Actions */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>50 Connections Goal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#fadcd2] font-serif-display leading-tight">
                {currentCount >= target
                  ? '🎉 50 Target Achieved! You conquered TEDx!'
                  : `${target - currentCount} connections left to hit 50`}
              </h2>
              <p className="text-sm text-[#e4beb1]/70 mt-1.5 max-w-lg leading-relaxed">
                Connect seamlessly with African founders, speakers, and investors. Save badges, phone numbers, and talk insights with zero lag.
              </p>
            </div>

            {/* Milestone Checkpoint Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {milestones.map((m) => (
                <div
                  key={m.target}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    m.achieved
                      ? 'bg-[#FF5C00]/15 border-[#FF5C00]/50 text-[#fadcd2]'
                      : 'bg-white/5 border-white/5 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>{m.target} Met</span>
                    {m.achieved && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5C00]" />}
                  </div>
                  <span className="text-[10px] opacity-80 block truncate mt-0.5">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Main Action Buttons with Min 44px Touch Targets */}
            <div className="flex flex-wrap items-center gap-3 pt-2 justify-center lg:justify-start">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenQuickConnect();
                }}
                className="px-5 py-3 rounded-2xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-lg shadow-[#FF5C00]/25 active:scale-95 min-h-[48px]"
              >
                <Bolt className="w-4 h-4 fill-current" />
                <span>Quick Connect (10s)</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenCapture();
                }}
                className="px-4 py-3 rounded-2xl bg-[#221008] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#32160c] transition-colors flex items-center gap-2 min-h-[48px] active:scale-95"
              >
                <Camera className="w-4 h-4 text-[#FF5C00]" />
                <span>Capture Moment</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenAddIdea();
                }}
                className="px-4 py-3 rounded-2xl bg-[#221008] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#32160c] transition-colors flex items-center gap-2 min-h-[48px] active:scale-95"
              >
                <Lightbulb className="w-4 h-4 text-[#ffb59a]" />
                <span>Log Insight</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gamification Interactive Level Banner */}
      <div 
        onClick={() => {
          triggerHaptic('light');
          if (onOpenGamification) onOpenGamification();
        }}
        className="p-5 rounded-3xl bg-[#140804] border border-white/10 hover:border-[#FF5C00]/40 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center font-bold text-xl flex-shrink-0">
            {gamification.levelBadge}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#fadcd2]">
                Rank: {gamification.levelTitle}
              </span>
              <span className="text-[10px] text-[#FF5C00] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20">
                Level {gamification.level}
              </span>
            </div>
            <p className="text-xs text-[#e4beb1]/60 mt-0.5">
              {gamification.totalXp} XP total • {gamification.badges.filter(b => b.isUnlocked).length} badges unlocked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="w-36 sm:w-48 space-y-1.5">
            <div className="flex justify-between text-[11px] text-[#e4beb1]/70 font-semibold">
              <span>Tier Progress</span>
              <span>{gamification.levelProgressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF5C00] rounded-full transition-all duration-700"
                style={{ width: `${gamification.levelProgressPercent}%` }}
              />
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#e4beb1]/60 group-hover:text-[#FF5C00] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Next Up Live Talk Card */}
      <div className="bg-[#140b07] border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-18 h-18 rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
            <img
              src={nextSession.heroImage}
              alt={nextSession.speaker}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-bold uppercase tracking-wider">
                Next Up • {nextSession.timeStr}
              </span>
              <span className="text-xs text-[#e4beb1]/60">{nextSession.stage}</span>
            </div>
            <h3 className="text-lg font-bold font-serif-display text-[#fadcd2] mt-1">
              {nextSession.title}
            </h3>
            <p className="text-xs text-[#e4beb1]/70 mt-0.5">{nextSession.speaker}</p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenAddIdea();
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#221008] hover:bg-[#32160c] text-[#ffb59a] text-xs font-semibold border border-white/10 flex items-center justify-center gap-2 flex-shrink-0 transition-colors min-h-[48px] active:scale-95"
        >
          <Lightbulb className="w-4 h-4 text-[#FF5C00]" />
          <span>Record Session Notes</span>
        </button>
      </div>

      {/* Met Today Avatar Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF5C00]" />
            <span>People Met Today ({connections.length})</span>
          </h2>
          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectTab('people');
            }}
            className="text-xs text-[#FF5C00] font-semibold hover:underline flex items-center gap-1 min-h-[36px]"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2">
          {/* Add Connection Bubble */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenQuickConnect();
            }}
            className="flex-shrink-0 flex flex-col items-center justify-center w-18 h-22 rounded-2xl bg-[#1a0c06] border border-dashed border-[#FF5C00]/50 hover:border-[#FF5C00] transition-colors group active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bolt className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[11px] text-[#e4beb1] font-semibold mt-1.5">Add</span>
          </button>

          {/* Connection Avatars */}
          {connections.slice(0, 15).map((c) => (
            <div
              key={c.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectConnection(c);
              }}
              className="flex-shrink-0 flex flex-col items-center justify-center w-18 h-22 rounded-2xl bg-[#140804] border border-white/5 hover:border-[#FF5C00]/40 transition-all cursor-pointer group p-1.5 active:scale-95"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 group-hover:scale-105 transition-transform relative">
                <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                {c.priority === 'high' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#FF5C00] rounded-full border-2 border-black"></span>
                )}
              </div>
              <span className="text-[11px] text-[#fadcd2] font-medium mt-1.5 truncate w-full text-center">
                {c.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Network Trend & Active Action Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Momentum Velocity Chart */}
        <div className="bg-[#140b07] border border-white/10 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#FF5C00]" />
                <span>Connection Velocity</span>
              </h3>
              <p className="text-xs text-[#e4beb1]/60 mt-0.5">Accumulation pacing through the day</p>
            </div>
            <span className="text-xs font-bold text-[#FF5C00] bg-[#FF5C00]/10 px-2.5 py-1 rounded-full">
              {Math.max(1, Math.round(currentCount / 6))} / hr
            </span>
          </div>

          <div className="h-40 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#FF5C00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#66554e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#180b06',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fadcd2',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="connections"
                  stroke="#FF5C00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Queue: Follow-ups Due */}
        <div className="bg-[#140b07] border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-1.5">
                <AlarmClock className="w-4 h-4 text-[#FF5C00]" />
                <span>Follow-up Queue</span>
              </h3>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab('followups');
                }}
                className="text-xs text-[#FF5C00] font-semibold hover:underline"
              >
                Tracker ({overdueFollowUps.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {overdueFollowUps.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectConnection(item);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#20110a] hover:bg-[#2e170e] transition-colors cursor-pointer border border-white/5 active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#fadcd2]">{item.name}</p>
                      <p className="text-[11px] text-[#e4beb1]/60">{item.company}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF5C00]/20 text-[#FF5C00]">
                    {item.followUpStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#e4beb1]/60 mt-4">
            <span>{moments.length} Moments captured</span>
            <span>{ideas.length} Ideas logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};


