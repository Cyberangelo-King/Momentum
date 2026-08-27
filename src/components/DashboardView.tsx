import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Connection, EventSession, Moment, Idea, UserProfile, Note, EventConfig } from '../types';
import { calculateGamification } from '../services/gamification';
import { useBatteryStatus } from '../hooks/useBatteryStatus';
import { OfflineUsageCard } from './OfflineUsageCard';
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
  X,
  FileText,
  BrainCircuit,
  Compass,
  Target,
  Mic,
  ArrowRight,
  BookOpen,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../services/haptics';

interface DashboardViewProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes?: Note[];
  sessions: EventSession[];
  profile: UserProfile;
  activeEvent?: EventConfig;
  onOpenEventHub?: () => void;
  onOpenQuickConnect: () => void;
  onOpenCapture: () => void;
  onOpenAddIdea: () => void;
  onSelectConnection: (connection: Connection) => void;
  onSelectTab: (tab: any) => void;
  onOpenProfile?: () => void;
  onOpenGamification?: () => void;
  onOpenContingency?: () => void;
  onOpenSessionDossier?: (session: EventSession) => void;
  onOpenPostEventReview?: () => void;
  onOpenConstellation?: () => void;
  onOpenPitchSimulator?: () => void;
  onOpenDigitalBadge?: () => void;
  onOpenLiveCopilot?: () => void;
  onOpenEventAnalytics?: () => void;
  onOpenOnboarding?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  connections,
  moments,
  ideas,
  notes = [],
  sessions,
  profile,
  activeEvent,
  onOpenEventHub,
  onOpenQuickConnect,
  onOpenCapture,
  onOpenAddIdea,
  onSelectConnection,
  onSelectTab,
  onOpenProfile,
  onOpenGamification,
  onOpenContingency,
  onOpenSessionDossier,
  onOpenPostEventReview,
  onOpenConstellation,
  onOpenPitchSimulator,
  onOpenDigitalBadge,
  onOpenLiveCopilot,
  onOpenEventAnalytics,
  onOpenOnboarding,
}) => {
  const [isBatteryBannerDismissed, setIsBatteryBannerDismissed] = useState(false);
  const battery = useBatteryStatus();

  // Active event-specific connection counting & target
  const scopedConnections = activeEvent
    ? connections.filter((c) => !c.eventId || c.eventId === activeEvent.id)
    : connections;

  const currentCount = scopedConnections.length;
  const target = activeEvent?.targetConnections || profile.targetConnections || 50;
  const percentage = Math.min(Math.round((currentCount / target) * 100), 100);

  const gamification = calculateGamification(scopedConnections, moments, ideas, target);

  // SVG Progress Ring calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const triggerCelebration = () => {
    triggerHaptic('milestone');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#818cf8', '#34d399', '#f8fafc'],
    });
  };

  useEffect(() => {
    if (currentCount >= target && currentCount > 0) {
      triggerCelebration();
    }
  }, [currentCount, target]);

  // Next up session from active event or sessions array
  const activeSessionsList = activeEvent?.sessions?.length ? activeEvent.sessions : sessions;
  const nextSession = activeSessionsList[0] || {
    title: 'Keynote & Executive Panel',
    speaker: 'Featured Keynote',
    timeStr: 'Upcoming',
    stage: activeEvent?.stages?.[0] || 'Main Stage',
    heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  };

  // Hourly networking momentum chart data
  const chartData = [
    { time: '08:00', connections: Math.max(1, Math.floor(currentCount * 0.1)) },
    { time: '10:00', connections: Math.max(2, Math.floor(currentCount * 0.35)) },
    { time: '12:00', connections: Math.max(4, Math.floor(currentCount * 0.65)) },
    { time: '14:00', connections: Math.max(6, Math.floor(currentCount * 0.85)) },
    { time: '16:00', connections: currentCount },
  ];

  const overdueFollowUps = scopedConnections.filter((c) => c.followUpStatus === 'overdue' || c.followUpStatus === 'today');

  // Milestone checkpoints for the connections goal
  const step = Math.max(5, Math.floor(target / 4));
  const milestones = [
    { target: step, label: 'Initial Contact', achieved: currentCount >= step },
    { target: step * 2, label: 'Midway', achieved: currentCount >= step * 2 },
    { target: step * 3, label: 'Network Effect', achieved: currentCount >= step * 3 },
    { target: target, label: 'Target Met', achieved: currentCount >= target },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 md:pb-16 text-[var(--text-primary)]">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div 
          onClick={() => {
            triggerHaptic('light');
            if (onOpenProfile) onOpenProfile();
          }} 
          className="cursor-pointer group flex items-center gap-3.5 min-w-0"
          title="Profile settings"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.12] group-hover:border-[var(--accent-primary)] transition-colors relative flex-shrink-0 bg-[var(--bg-surface-subtle)]">
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {activeEvent ? activeEvent.name : 'Event Workspace'}
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white mt-0.5 truncate group-hover:text-[var(--accent-primary)] transition-colors">
              {profile.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Onboarding Tour Trigger */}
          {onOpenOnboarding && (
            <button
              id="dashboard-tour-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenOnboarding();
              }}
              title="Open Interactive OS Guide & Feature Tour"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-white/90 transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>OS Tour</span>
            </button>
          )}

          {/* Event Hub Modal Trigger */}
          {onOpenEventHub && (
            <button
              onClick={() => {
                triggerHaptic('selection');
                onOpenEventHub();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-white/90 transition-colors cursor-pointer shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Event Hub</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
          )}

          {/* XP Badge */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenGamification) onOpenGamification();
              else triggerCelebration();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-white transition-colors cursor-pointer shadow-sm"
          >
            <span className="text-base">{gamification.levelBadge}</span>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] font-mono text-[var(--accent-primary)] leading-none">
                Lvl {gamification.level}
              </div>
              <div className="text-[11px] font-mono text-white/80 leading-none mt-1">
                {gamification.totalXp} XP
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Battery Warning */}
      <AnimatePresence>
        {battery.isSupported && battery.isLowBattery && !isBatteryBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BatteryWarning className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-medium text-amber-200">
                  Device battery low ({battery.percentage}%). Power-saving defaults applied.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsBatteryBannerDismissed(true)}
              className="text-amber-200/60 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Networking Target Card */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-lg"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Progress Ring */}
          <div 
            className="relative flex items-center justify-center cursor-pointer group flex-shrink-0" 
            onClick={triggerCelebration}
          >
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-white/[0.06]"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                stroke="var(--accent-primary)"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <motion.span 
                key={currentCount}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-semibold font-mono text-white tracking-tight"
              >
                {currentCount}
              </motion.span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                of {target} Target
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-primary)] font-semibold mt-1">
                {percentage}% Completed
              </span>
            </div>
          </div>

          {/* Context & Actions */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--text-secondary)] text-[11px] font-mono mb-2">
                <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Networking Objective</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {currentCount >= target
                  ? 'Target Achieved'
                  : `${target - currentCount} connections remaining to reach quota`}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-lg leading-relaxed">
                Seamless contact exchange, speech insight logging, and structured follow-up scheduling with 100% offline persistence.
              </p>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {milestones.map((m) => (
                <div
                  key={m.target}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    m.achieved
                      ? 'bg-white/[0.06] border-[var(--accent-primary)]/40 text-white'
                      : 'bg-white/[0.02] border-white/[0.05] text-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span>{m.target} Goal</span>
                    {m.achieved && <CheckCircle2 className="w-3 h-3 text-[var(--accent-primary)]" />}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block truncate mt-0.5">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 justify-center lg:justify-start">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenQuickConnect();
                }}
                className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-black font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Bolt className="w-3.5 h-3.5 fill-current" />
                <span>Quick Connect</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenCapture();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.08] text-white border border-[var(--border-subtle)] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Capture Photo</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenAddIdea();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.08] text-white border border-[var(--border-subtle)] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Idea</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab('notes');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.08] text-white border border-[var(--border-subtle)] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Notes & Q&A</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Intelligence & Event Tooling Grid */}
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-white">
              Event Intelligence Suite
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Real-time networking tools, pitch simulator, and contact exchange.
            </p>
          </div>
          {onOpenEventAnalytics && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenEventAnalytics();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Event Analytics</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Constellation Graph */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenConstellation) onOpenConstellation();
            }}
            className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[96px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-mono text-[var(--text-secondary)]">Network</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                Network Radar
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">Graph & Matching</p>
            </div>
          </button>

          {/* Card 2: AI Pitch Arena */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenPitchSimulator) onOpenPitchSimulator();
            }}
            className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-amber-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[96px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-mono text-amber-400">Rehearse</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                Pitch Simulator
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">30s Rehearsal</p>
            </div>
          </button>

          {/* Card 3: Holographic Pass */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenDigitalBadge) onOpenDigitalBadge();
            }}
            className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-emerald-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[96px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-mono text-emerald-400">Digital Pass</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                Contact Card
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">QR & vCard Export</p>
            </div>
          </button>

          {/* Card 4: Live Venue HUD */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenLiveCopilot) onOpenLiveCopilot();
            }}
            className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-purple-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[96px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-mono text-purple-400">Venue HUD</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                Live Briefing
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">Stages & Schedules</p>
            </div>
          </button>
        </div>
      </div>

      {/* Experience Workflow Strip: Before -> Capture -> Understand -> Reflect -> Act */}
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Workflow Pipeline
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">5 Phases</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* 1. BEFORE */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenSessionDossier && sessions[0]) {
                onOpenSessionDossier(sessions[0]);
              }
            }}
            className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-sky-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[85px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">1. Prepare</span>
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Speaker Dossier</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Briefing & Background</p>
            </div>
          </button>

          {/* 2. CAPTURE */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenCapture();
            }}
            className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[85px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">2. Capture</span>
              <Mic className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Instant Capture</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Audio & Notes</p>
            </div>
          </button>

          {/* 3. UNDERSTAND */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectTab('notes');
            }}
            className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-purple-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[85px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">3. Synthesize</span>
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Structured Notes</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Core Insights</p>
            </div>
          </button>

          {/* 4. REFLECT */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenPostEventReview) {
                onOpenPostEventReview();
              }
            }}
            className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-emerald-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[85px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">4. Reflect</span>
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Event Review</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Takeaway Analysis</p>
            </div>
          </button>

          {/* 5. ACT */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectTab('followups');
            }}
            className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/[0.05] hover:border-amber-400/40 hover:bg-white/[0.06] transition-colors text-left flex flex-col justify-between min-h-[85px] col-span-2 sm:col-span-1 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">5. Execute</span>
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Follow-Up CRM</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Outreach Queue</p>
            </div>
          </button>
        </div>
      </div>

      {/* Next Up Session Card */}
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/[0.08]">
            <img
              src={nextSession.heroImage}
              alt={nextSession.speaker}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--accent-primary)] uppercase tracking-wider">
                Next · {nextSession.timeStr}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{nextSession.stage}</span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">
              {nextSession.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{nextSession.speaker}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onOpenSessionDossier && sessions[0]) {
                onOpenSessionDossier(sessions[0]);
              }
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-sky-400 text-xs font-medium border border-sky-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Speaker Dossier</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAddIdea();
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-amber-400 text-xs font-medium border border-amber-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Take Notes</span>
          </button>
        </div>
      </div>

      {/* Met Today Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Captured Contacts ({connections.length})</span>
          </h2>
          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectTab('people');
            }}
            className="text-xs text-[var(--accent-primary)] font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add Connection Bubble */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenQuickConnect();
            }}
            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.15] hover:border-[var(--accent-primary)] transition-colors group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/[0.05] text-[var(--accent-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bolt className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-1">Add</span>
          </button>

          {/* Connection Avatars */}
          {connections.slice(0, 15).map((c) => (
            <div
              key={c.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectConnection(c);
              }}
              className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl bg-[var(--bg-surface-card)] border border-white/[0.05] hover:border-[var(--accent-primary)]/40 transition-colors cursor-pointer group p-1"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:scale-105 transition-transform relative">
                <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                {c.priority === 'high' && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[var(--accent-primary)] rounded-full border border-black" />
                )}
              </div>
              <span className="text-[10px] text-white/90 font-medium mt-1 truncate w-full text-center">
                {c.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Network Trend & Active Action Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Momentum Velocity Chart */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Connection Velocity</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Rate of contact additions over time</p>
            </div>
            <span className="text-xs font-mono font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--border-accent)]">
              {Math.max(1, Math.round(currentCount / 6))} / hr
            </span>
          </div>

          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="var(--font-mono)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-card)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: 12,
                    fontSize: 11,
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="connections"
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Queue: Follow-ups Due */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                <AlarmClock className="w-3.5 h-3.5 text-amber-400" />
                <span>Follow-Up Queue</span>
              </h3>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab('followups');
                }}
                className="text-xs text-[var(--accent-primary)] font-medium hover:underline cursor-pointer"
              >
                View all ({overdueFollowUps.length})
              </button>
            </div>

            <div className="space-y-2">
              {overdueFollowUps.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectConnection(item);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.06] transition-colors cursor-pointer border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{item.company}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.followUpStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                  </span>
                </div>
              ))}
              {overdueFollowUps.length === 0 && (
                <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
                  No overdue follow-ups pending.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[var(--text-secondary)] mt-3">
            <span>{moments.length} Moments captured</span>
            <span>{ideas.length} Ideas recorded</span>
          </div>
        </div>
      </div>

      {/* Offline Storage Summary */}
      <OfflineUsageCard
        connections={connections}
        moments={moments}
        ideas={ideas}
        onOpenContingency={onOpenContingency}
      />
    </div>
  );
};
