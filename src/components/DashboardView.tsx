import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Connection, EventSession, Moment, Idea, UserProfile } from '../types';

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
}) => {
  const currentCount = connections.length;
  const target = profile.targetConnections || 50;
  const percentage = Math.min(Math.round((currentCount / target) * 100), 100);

  // SVG Progress Ring calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5C00', '#ffb59a', '#ffffff', '#e4beb1'],
    });
  };

  useEffect(() => {
    if (currentCount >= target) {
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
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Mobile Top Welcome & Live Badge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-ping"></span>
            TEDxAkure 2026 • Live Event
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Welcome back, {profile.name.split(' ')[0]}
          </h1>
        </div>

        <button
          onClick={triggerCelebration}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#28130a] border border-[#FF5C00]/30 text-[#ffb59a] text-xs font-semibold hover:bg-[#381a0e] transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-[#FF5C00]">celebration</span>
          Goal: {target}
        </button>
      </div>

      {/* Hero Circular 50-Connection Progress Card */}
      <div className="bg-[#180b06] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C00]/5 rounded-full blur-3xl pointer-events-none" />

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
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-xl font-bold text-[#fadcd2] font-serif-display">
                {currentCount >= target
                  ? 'Goal Achieved! You met 50 people!'
                  : `${target - currentCount} connections remaining to hit 50`}
              </h2>
              <p className="text-xs text-[#e4beb1]/70 mt-1 max-w-md leading-relaxed">
                Capture names, roles, and insights instantly during coffee breaks and keynotes. Every
                person is a future collaborator.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
              <button
                onClick={onOpenQuickConnect}
                className="px-5 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined text-base font-bold">bolt</span>
                Quick Connect
              </button>

              <button
                onClick={onOpenCapture}
                className="px-4 py-2.5 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#381a0e] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-[#FF5C00]">add_a_photo</span>
                Capture Moment
              </button>

              <button
                onClick={onOpenAddIdea}
                className="px-4 py-2.5 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/10 font-semibold text-xs hover:bg-[#381a0e] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-[#ffb59a]">lightbulb</span>
                Log Insight
              </button>
            </div>
          </div>
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
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#271812] hover:bg-[#381a0e] text-[#ffb59a] text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-sm">note_add</span>
          Record Session Notes
        </button>
      </div>

      {/* Met Today Avatar Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF5C00] text-base">group</span>
            People Met Today ({connections.length})
          </h2>
          <button
            onClick={() => onSelectTab('people')}
            className="text-xs text-[#FF5C00] font-semibold hover:underline flex items-center gap-0.5"
          >
            View All
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add Connection Bubble */}
          <button
            onClick={onOpenQuickConnect}
            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl bg-[#1e100a] border border-dashed border-[#FF5C00]/50 hover:border-[#FF5C00] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">person_add</span>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1]">
                Connection Velocity
              </h3>
              <p className="text-xs text-[#e4beb1]/60">Accumulation pacing through the day</p>
            </div>
            <span className="text-xs font-bold text-[#FF5C00]">
              {Math.round(currentCount / 6)} / hour
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
                <span className="material-symbols-outlined text-[#FF5C00] text-sm">alarm</span>
                Follow-up Queue
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
