import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Users,
  Camera,
  BrainCircuit,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  QrCode,
  FileText,
  Compass,
  Download,
  Lock,
  Globe,
  Radio,
  Share2
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface OnboardingStep {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  highlights: {
    icon: React.ElementType;
    title: string;
    detail: string;
  }[];
  proTip: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    badge: 'Momentum OS v2.4',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Your Personal Event OS',
    subtitle: 'Transforming passive attendance into high-velocity networking & compound intelligence.',
    description:
      'Momentum is an offline-first workspace engineered for conferences, masterminds, and summits. Everything is stored locally with real-time Supabase cloud sync and zero-latency access.',
    icon: Sparkles,
    iconBg: 'bg-[var(--accent-primary)]/10 border-[var(--border-accent)]',
    iconColor: 'text-[var(--accent-primary)]',
    highlights: [
      {
        icon: Zap,
        title: 'Zero-Latency Execution',
        detail: 'Instant modal switching, quick connect badge scans, and sub-100ms UI responses.',
      },
      {
        icon: ShieldCheck,
        title: 'Offline-First & Protected',
        detail: 'Works 100% offline during congested convention hall Wi-Fi outages with PIN & biometric lock.',
      },
      {
        icon: BrainCircuit,
        title: 'Google Gemini 3.7 Flash AI',
        detail: 'Instant keynote synthesis, audio transcription, speaker briefings, and customized follow-up emails.',
      },
    ],
    proTip: 'You can access all controls offline. When connectivity returns, changes automatically sync.',
  },
  {
    id: 'compounding_loop',
    badge: 'Core Workflow',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    title: 'The 5-Stage Compounding Engine',
    subtitle: 'From the first handshake to closed partnerships.',
    description:
      'Every connection and session note moves through a disciplined workflow designed to maximize relationship equity.',
    icon: Compass,
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    iconColor: 'text-sky-400',
    highlights: [
      {
        icon: Users,
        title: '1. Connect (CRM)',
        detail: 'Quickly log contact details, business cards, photo tags, mutual interests, and priority tags.',
      },
      {
        icon: Camera,
        title: '2. Multimodal Capture',
        detail: 'Record crystal-clear voice memos, slide photos, live speaker quotes, and structured smart notes.',
      },
      {
        icon: FileText,
        title: '3. AI Follow-Up Tracker',
        detail: '1-tap WhatsApp, LinkedIn & Email drafts personalized with mutual conference context.',
      },
    ],
    proTip: 'Set follow-up deadlines right at capture time so overdue reminders keep you accountable.',
  },
  {
    id: 'ai_superpowers',
    badge: 'AI Intelligence',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    title: 'Intelligence & Live Copilot',
    subtitle: 'Executive tools built to give you the upper hand in every room.',
    description:
      'Leverage Gemini 3.7 Flash across every interaction for instant briefing dossiers, pitch practice, and relational network graph discovery.',
    icon: BrainCircuit,
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-400',
    highlights: [
      {
        icon: Radio,
        title: 'Live Copilot HUD',
        detail: 'Real-time speaker talking points, audience icebreakers, and live contextual suggestions.',
      },
      {
        icon: Share2,
        title: 'Constellation Graph & Matchmaker',
        detail: 'AI finds hidden synergies among your contacts and drafts warm introduction messages.',
      },
      {
        icon: Zap,
        title: 'Elevator Pitch Arena',
        detail: 'Simulate pitches against realistic VC, founder, or corporate buyer personas with instant charisma feedback.',
      },
    ],
    proTip: 'Open the Speaker Dossier before any session to get tailored questions that make you stand out during Q&A.',
  },
  {
    id: 'multi_event',
    badge: 'Universal Hub',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    title: 'Universal Multi-Event Hub',
    subtitle: 'One operating system for every summit, hackathon, and conference.',
    description:
      'Seamlessly switch between TEDxAkure 2026, tech summits, investor days, and private masterminds. Each event maintains its own isolated leads, notes, and targets.',
    icon: Globe,
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    iconColor: 'text-teal-400',
    highlights: [
      {
        icon: QrCode,
        title: 'Holographic 3D Pass & NFC',
        detail: 'Share your digital portfolio and contact QR instantly without friction.',
      },
      {
        icon: Download,
        title: 'Comprehensive Exports & PDF',
        detail: 'Export complete event memories to structured CSV, clean JSON, or an Executive PDF Dossier.',
      },
      {
        icon: Lock,
        title: 'Private & Secure',
        detail: 'Lock your workspace with a 4-digit PIN or biometric pass whenever stepping away.',
      },
    ],
    proTip: 'Use the 1-Click AI Agenda Parser in Event Hub to turn raw schedule text into structured interactive sessions.',
  },
];

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
          triggerHaptic('light');
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          handleFinish();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          triggerHaptic('light');
          setCurrentStepIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Escape') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleFinish = () => {
    triggerHaptic('selection');
    localStorage.setItem('momentum_onboarding_completed', 'true');
    onClose();
  };

  const handleNext = () => {
    triggerHaptic('light');
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div
      id="onboarding-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-xl bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentStep.badgeColor}`}
            >
              {currentStep.badge}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <button
            id="onboarding-skip-btn"
            onClick={handleFinish}
            className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Skip Tour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content Body with Smooth Animation */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Header Icon + Title */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${currentStep.iconBg} ${currentStep.iconColor}`}
                >
                  <StepIcon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-display tracking-tight leading-snug">
                    {currentStep.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.04]">
                {currentStep.description}
              </p>

              {/* 3 Key Highlights */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Key Capabilities
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentStep.highlights.map((h, i) => {
                    const HIcon = h.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--border-accent)] flex items-center justify-center shrink-0 mt-0.5">
                          <HIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white leading-tight">{h.title}</h4>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                            {h.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pro Tip Callout */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-300">Pro Tip: </span>
                  <span className="text-neutral-200">{currentStep.proTip}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center justify-between gap-3">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentStepIndex(idx);
                }}
                title={`Go to step ${idx + 1}: ${step.title}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[var(--accent-primary)]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                id="onboarding-back-btn"
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              id="onboarding-next-btn"
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-xl bg-[var(--accent-primary)] text-black text-xs font-bold transition-all shadow-md shadow-[var(--accent-primary)]/20 hover:brightness-110 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>
                {currentStepIndex === ONBOARDING_STEPS.length - 1
                  ? 'Launch Momentum OS'
                  : 'Next Step'}
              </span>
              {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
