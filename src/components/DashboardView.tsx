import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Connection, EventSession, Moment, Idea, UserProfile } from '../types';
import { calculateGamification } from '../services/gamification';
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
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

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
  const currentCount = connections.length;
  const target = profile.targetConnections || 50;
  const percentage = Math.min(Math.round((currentCount / target) * 100), 100);

  const gamification = calculateGamification(connections, moments, ideas, target);

  // SVG Progress Ring calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12 animate-in fade-in duration-200">
      {/* Mobile Top Welcome & Live Badge */}
      <div className="flex items-center justify-between gap-3">
        <div 
          onClick={onOpenProfile} 
          className="cursor-pointer group flex items-center gap-3 min-w-0"
          title="Click to edit profile"
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-[#FF5C00] transition-colors relative flex-shrink-0">
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] rounded-full border border-black" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#FF5C00] tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-ping" />
              TEDxAkure 2026 • Live
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-display text-[#fadcd2] mt-0.5 truncate group-hover:text-white transition-colors">
              Welcome, {profile.name.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Gamification Level & Milestone Pill */}
        <button
          onClick={onOpenGamification || triggerCelebration}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#1e0f08] border border-[#FF5C00]/30 hover:border-[#FF5C00] text-[#fadcd2] text-xs font-semibold shadow-md active:scale-95 transition-all group"
        >
          <span className="text-base">{gamification.levelBadge}</span>
          <div className="text-left hidden sm:block">
            <div className="text-[10px] text-[#FF5C00] font-bold uppercase leading-none">
              Level {gamification.level}
            </div>
            <div className="text-[11px] text-[#ffb59a] font-semibold leading-none mt-0.5">
              {gamification.totalXp} XP
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#FF5C00] group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Hero Circular 50-Connection Progress Card */}
      <div className="bg-gradient-to-br from-[#1b0c05] via-[#120703] to-[#0d0502] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* Progress Ring Visual */}
          <div className="relative flex items-center justify-center cursor-pointer group" onClick={triggerCelebration}>
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-white/10"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-[#FF5C00] transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold font-serif-display text-[#fadcd2] group-hover:scale-105 transition-transform">
                {currentCount}
              </span>
              <span className="text-[10px] text-[#e4beb1]/70 uppercase tracking-widest font-semibold">
                of {target} Target
              </span>
              <span className="text-[10px] text-[#FF5C00] font-bold mt-0.5">
                {percentage}% Done
              </span>
            </div>
          </div>

          {/* Context & Rapid Actions */}
          <div className="flex-1 text-center sm:text-left space-y-3.5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#fadcd2] font-serif-display">
                {currentCount >= target
                  ? '🎉 50 Target Achieved! You conquered TEDx!'
                  : `${target - currentCount} connections remaining to hit 50`}
              </h2>
              <p className="text-xs text-[#e4beb1]/70 mt-1 max-w-md leading-relaxed">
                Capture names, lanyard badges, and insights instantly during coffee breaks and keynotes.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 justify-center sm:justify-start">
              <button
                onClick={onOpenQuickConnect}
                className="px-5 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95"
              >
                <Bolt className="w-4 h-4 fill-current" />
                <span>Quick Connect (10s)</span>
              </button>

              <button
                onClick={onOpenCapture}
                className="px-4 py-2.5 rounded-xl bg-[#221008] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#32160c] transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#FF5C00]" />
                <span>Capture Moment</span>
              </button>

              <button
                onClick={onOpenAddIdea}
                className="px-4 py-2.5 rounded-xl bg-[#221008] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#32160c] transition-colors flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-[#ffb59a]" />
                <span>Log Insight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Interactive Level Banner */}
      <div 
        onClick={onOpenGamification}
        className="p-4 rounded-2xl bg-[#140804] border border-white/10 hover:border-[#FF5C00]/40 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center font-bold text-lg flex-shrink-0">
            {gamification.levelBadge}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#fadcd2]">
                Rank: {gamification.levelTitle}
              </span>
              <span className="text-[10px] text-[#FF5C00] font-bold px-2 py-0.2 rounded-full bg-[#FF5C00]/20">
                Level {gamification.level}
              </span>
            </div>
            <p className="text-[11px] text-[#e4beb1]/60 mt-0.5">
              {gamification.totalXp} XP total • {gamification.badges.filter(b => b.isUnlocked).length} badges unlocked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="w-32 sm:w-40 space-y-1">
            <div className="flex justify-between text-[10px] text-[#e4beb1]/70 font-semibold">
              <span>Tier Progress</span>
              <span>{gamification.levelProgressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF5C00] rounded-full"
                style={{ width: `${gamification.levelProgressPercent}%` }}
              />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#e4beb1]/60 group-hover:text-[#FF5C00] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Next Up Live Talk Card */}
      <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
            <img
              src={nextSession.heroImage}
              alt={nextSession.speaker}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-bold uppercase tracking-wider">
                Next Up • {nextSession.timeStr}
              </span>
              <span className="text-[11px] text-[#e4beb1]/60">{nextSession.stage}</span>
            </div>
            <h3 className="text-base font-bold font-serif-display text-[#fadcd2] mt-0.5">
              {nextSession.title}
            </h3>
            <p className="text-xs text-[#e4beb1]/70">{nextSession.speaker}</p>
          </div>
        </div>

        <button
          onClick={onOpenAddIdea}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#221008] hover:bg-[#32160c] text-[#ffb59a] text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 flex-shrink-0 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5 text-[#FF5C00]" />
          <span>Record Session Notes</span>
        </button>
      </div>

      {/* Met Today Avatar Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF5C00]" />
            <span>People Met Today ({connections.length})</span>
          </h2>
          <button
            onClick={() => onSelectTab('people')}
            className="text-xs text-[#FF5C00] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add Connection Bubble */}
          <button
            onClick={onOpenQuickConnect}
            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl bg-[#1a0c06] border border-dashed border-[#FF5C00]/50 hover:border-[#FF5C00] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bolt className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] text-[#e4beb1] font-semibold mt-1">Add</span>
          </button>

          {/* Connection Avatars */}
          {connections.slice(0, 15).map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectConnection(c)}
              className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl bg-[#140804] border border-white/5 hover:border-[#FF5C00]/40 transition-all cursor-pointer group p-1"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:scale-105 transition-transform relative">
                <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                {c.priority === 'high' && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#FF5C00] rounded-full border border-black"></span>
                )}
              </div>
              <span className="text-[10px] text-[#fadcd2] font-medium mt-1 truncate w-full text-center">
                {c.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Network Trend & Active Action Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Momentum Velocity Chart */}
        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span>Connection Velocity</span>
              </h3>
              <p className="text-xs text-[#e4beb1]/60">Accumulation pacing through the day</p>
            </div>
            <span className="text-xs font-bold text-[#FF5C00]">
              {Math.round(currentCount / 6)} / hr
            </span>
          </div>

          <div className="h-36 w-full pt-2">
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
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#180b06',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#fadcd2',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="connections"
                  stroke="#FF5C00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Queue: Follow-ups Due */}
        <div className="bg-[#140b07] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-1.5">
                <AlarmClock className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span>Follow-up Queue</span>
              </h3>
              <button
                onClick={() => onSelectTab('followups')}
                className="text-xs text-[#FF5C00] font-semibold hover:underline"
              >
                Tracker ({overdueFollowUps.length})
              </button>
            </div>

            <div className="space-y-2">
              {overdueFollowUps.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectConnection(item)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#20110a] hover:bg-[#2e170e] transition-colors cursor-pointer border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#fadcd2]">{item.name}</p>
                      <p className="text-[10px] text-[#e4beb1]/60">{item.company}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00]">
                    {item.followUpStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#e4beb1]/60">
            <span>{moments.length} Moments captured</span>
            <span>{ideas.length} Ideas logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};

