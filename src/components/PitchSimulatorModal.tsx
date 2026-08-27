import React, { useState, useEffect, useRef } from 'react';
import { EventConfig, PitchFeedback, UserProfile } from '../types';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Check, 
  Copy, 
  Flame, 
  Award, 
  Target, 
  MessageSquare, 
  Volume2, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { fetchPitchSimulation } from '../services/aiService';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';

interface PitchSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  activeEvent?: EventConfig;
  defaultPitch?: string;
}

interface PersonaOption {
  key: string;
  name: string;
  role: string;
  vibe: string;
  avatar: string;
  difficultLevel: 'Gentle' | 'Realistic' | 'Ruthless';
}

const PERSONAS: PersonaOption[] = [
  {
    key: 'tech-vc',
    name: 'Sarah Chen',
    role: 'Partner at Tier-1 Frontier Fund',
    vibe: 'Looking for 100x TAM, defensible moats, and fast execution.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    difficultLevel: 'Ruthless',
  },
  {
    key: 'angel-investor',
    name: 'Kunle Adebayo',
    role: 'Early Angel & Serial Founder',
    vibe: 'Cares about founder passion, grit, and authentic problem obsession.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    difficultLevel: 'Realistic',
  },
  {
    key: 'tech-lead',
    name: 'David Okafor',
    role: 'Principal Architect & Co-founder Lead',
    vibe: 'Listens for technical depth, scalable architecture, and zero BS.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    difficultLevel: 'Realistic',
  },
  {
    key: 'enterprise-buyer',
    name: 'Elena Rostov',
    role: 'VP of Digital Strategy & Procurement',
    vibe: 'Needs ROI, compliance, easy migration, and immediate time-to-value.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    difficultLevel: 'Ruthless',
  },
  {
    key: 'keynote-speaker',
    name: 'Prof. Amara Mensah',
    role: 'Keynote Speaker & Ecosystem Pioneer',
    vibe: 'Interested in regional societal impact, policy alignment, and systems thinking.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    difficultLevel: 'Gentle',
  },
];

export const PitchSimulatorModal: React.FC<PitchSimulatorModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeEvent,
  defaultPitch = '',
}) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaOption>(PERSONAS[0]);
  const [pitchText, setPitchText] = useState<string>(defaultPitch);
  const [targetDurationSec, setTargetDurationSec] = useState<number>(30);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timerSec, setTimerSec] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<PitchFeedback | null>(null);
  const [copiedRewrite, setCopiedRewrite] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'teleprompter'>('practice');

  // Teleprompter state
  const [isTeleprompterScrolling, setIsTeleprompterScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 = slow, 2 = normal, 3 = fast
  const teleprompterRef = useRef<HTMLDivElement>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);

  const brandColor = activeEvent?.branding?.primaryColor || '#FF5C00';

  // Timer interval during recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimerSec((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Teleprompter auto scroll
  useEffect(() => {
    let animId: number;
    if (isTeleprompterScrolling && teleprompterRef.current) {
      const scroll = () => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += scrollSpeed * 0.8;
        }
        animId = requestAnimationFrame(scroll);
      };
      animId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animId);
  }, [isTeleprompterScrolling, scrollSpeed]);

  const handleStartRecording = () => {
    triggerHaptic('medium');
    setIsRecording(true);
    setTimerSec(0);
    setPitchText('');

    if (isSpeechRecognitionSupported()) {
      try {
        const stop = startSpeechRecognition(
          (text) => {
            setPitchText((prev) => (prev ? `${prev} ${text}` : text));
          },
          (err) => console.warn('Speech err in pitch arena:', err),
          () => setIsRecording(false)
        );
        stopSpeechRef.current = stop;
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    }
  };

  const handleStopRecording = () => {
    triggerHaptic('medium');
    setIsRecording(false);
    if (stopSpeechRef.current) {
      stopSpeechRef.current();
      stopSpeechRef.current = null;
    }
  };

  const handleRunEvaluation = async () => {
    if (!pitchText.trim()) return;
    triggerHaptic('light');
    setIsEvaluating(true);
    try {
      const res = await fetchPitchSimulation(pitchText, selectedPersona.key, activeEvent?.name, targetDurationSec);
      setFeedback(res);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Pitch eval failed:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyRewrite = () => {
    if (!feedback?.tailoredRewrite) return;
    navigator.clipboard.writeText(feedback.tailoredRewrite);
    setCopiedRewrite(true);
    triggerHaptic('medium');
    setTimeout(() => setCopiedRewrite(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-4xl max-h-[94vh] rounded-3xl bg-[#0c0603] border border-[#FF5C00]/30 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1c0a03] to-[#0c0603]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
            >
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Pitch Arena & Charisma Coach</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] font-bold">
                  Neural Sparring Engine
                </span>
              </div>
              <p className="text-xs text-[#ffb59a]/70">
                Practice your 30s elevator pitch with realistic persona critique before stepping into the crowd
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              handleStopRecording();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 flex items-center justify-between border-b border-white/5 bg-[#120804]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('practice');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'practice'
                  ? 'border-[#FF5C00] text-white bg-white/5'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Pitch Sparring Arena
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('teleprompter');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'teleprompter'
                  ? 'border-[#FF5C00] text-white bg-white/5'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Live Teleprompter
            </button>
          </div>

          {/* Time Limit Pills */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[10px] text-neutral-400 font-semibold mr-1">Target:</span>
            {[15, 30, 60].map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  triggerHaptic('light');
                  setTargetDurationSec(sec);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  targetDurationSec === sec
                    ? 'bg-[#FF5C00] text-black'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {activeTab === 'practice' ? (
            <>
              {/* Persona Picker Strip */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffb59a] uppercase tracking-wider block">
                  Select Who You Are Approaching:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {PERSONAS.map((p) => {
                    const isSelected = selectedPersona.key === p.key;
                    return (
                      <div
                        key={p.key}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedPersona(p);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#220d04] border-[#FF5C00] shadow-lg shadow-[#FF5C00]/10 scale-[1.02]'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              p.difficultLevel === 'Ruthless' ? 'bg-red-500/20 text-red-400' :
                              p.difficultLevel === 'Realistic' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {p.difficultLevel}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {p.vibe}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pitch Delivery Area */}
              <div className="p-4 md:p-5 rounded-2xl bg-[#140803] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Your Elevator Pitch</span>
                    <span className="text-[10px] text-neutral-400">
                      ({pitchText.split(/\s+/).filter(Boolean).length} words)
                    </span>
                  </div>

                  {/* Pitch Timer indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                      isRecording
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                        : timerSec > 0
                        ? 'bg-white/5 border-white/10 text-neutral-300'
                        : 'bg-transparent border-transparent text-neutral-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-neutral-500'}`} />
                      {String(Math.floor(timerSec / 60)).padStart(2, '0')}:{String(timerSec % 60).padStart(2, '0')} / {targetDurationSec}s
                    </div>
                  </div>
                </div>

                <textarea
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  placeholder="Speak your pitch into the microphone or type it here... (e.g. 'Hey Kunle! We are building a low-latency event OS for high-impact conferences...')"
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#FF5C00] transition-colors resize-none font-sans leading-relaxed"
                />

                {/* Control Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <button
                        onClick={handleStopRecording}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <MicOff className="w-4 h-4" />
                        Finish Speaking ({timerSec}s)
                      </button>
                    ) : (
                      <button
                        onClick={handleStartRecording}
                        className="px-4 py-2 rounded-xl bg-[#FF5C00]/20 hover:bg-[#FF5C00]/30 border border-[#FF5C00]/40 text-[#FF8246] text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <Mic className="w-4 h-4" />
                        Record Speech Live
                      </button>
                    )}

                    {pitchText && (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setPitchText('');
                          setTimerSec(0);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs transition-colors"
                        title="Clear pitch"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleRunEvaluation}
                    disabled={isEvaluating || !pitchText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7A33] text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Analyzing Charisma & Hooks...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Spar with {selectedPersona.name.split(' ')[0]}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback Breakdown Screen */}
              {feedback && (
                <div className="space-y-4 animate-fade-in">
                  {/* Scorecard Hero */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#200d04] via-[#150702] to-[#0c0502] border border-[#FF5C00]/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-[#FF5C00]/50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-black text-[#FF5C00]">{feedback.score}</span>
                        <span className="text-[9px] uppercase font-bold text-neutral-400">Score</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">
                          {feedback.score >= 85 ? 'High Conviction Delivery!' : feedback.score >= 70 ? 'Solid Core, Needs Tighter Hook' : 'Needs Polish & Sharper Clarity'}
                        </h3>
                        <p className="text-xs text-[#ffb59a]">
                          Pitched to <strong className="text-white">{selectedPersona.name}</strong> ({selectedPersona.role})
                        </p>
                      </div>
                    </div>

                    {/* Sub-scores */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-around">
                      <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs font-bold text-amber-400">{feedback.hookScore}/10</span>
                        <span className="text-[9px] block text-neutral-400 uppercase">Hook</span>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs font-bold text-emerald-400">{feedback.clarityScore}/10</span>
                        <span className="text-[9px] block text-neutral-400 uppercase">Clarity</span>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs font-bold text-purple-400">{feedback.deliveryScore}/10</span>
                        <span className="text-[9px] block text-neutral-400 uppercase">Delivery</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Persona Reaction */}
                  <div className="p-4 rounded-2xl bg-[#180b05] border border-white/10 flex items-start gap-3">
                    <img
                      src={selectedPersona.avatar}
                      alt={selectedPersona.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#FF5C00]/40 shrink-0 mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{selectedPersona.name} reacts:</h4>
                        <span className="text-[10px] text-neutral-400">({selectedPersona.difficultLevel} Judge)</span>
                      </div>
                      <p className="text-xs text-neutral-200 italic leading-relaxed">
                        "{feedback.personaResponse}"
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        What Landed Exceptionally Well:
                      </span>
                      <ul className="text-xs text-neutral-300 space-y-1 pl-4 list-disc">
                        {feedback.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Friction Points to Eliminate:
                      </span>
                      <ul className="text-xs text-neutral-300 space-y-1 pl-4 list-disc">
                        {feedback.weaknesses.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Filler words warning */}
                  {feedback.fillerWordsDetected && feedback.fillerWordsDetected.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-xs text-neutral-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Filler words detected: </span>
                      <div className="flex gap-1">
                        {feedback.fillerWordsDetected.map((w, idx) => (
                          <span key={idx} className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                            "{w}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Rewrite: 10x Tailored Script */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1c0d05] to-[#0f0602] border border-[#FF5C00]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FF8246] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Hypnotic 30-Second Rewrite:
                      </span>
                      <button
                        onClick={handleCopyRewrite}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-neutral-300 flex items-center gap-1 transition-all"
                      >
                        {copiedRewrite ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Script
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-white leading-relaxed font-serif-display font-medium bg-black/30 p-3 rounded-xl border border-white/5">
                      "{feedback.tailoredRewrite}"
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Suggested Closing Hook:</span>
                      <span className="text-[#ffb59a] font-bold">"{feedback.suggestedClosingHook}"</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Teleprompter View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#140803] border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Rehearsal Teleprompter</h3>
                  <p className="text-xs text-[#ffb59a]/70">
                    Scroll through your script at steady cadence before walking up to your next connection
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                    <span className="text-[10px] text-neutral-400">Speed:</span>
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          triggerHaptic('light');
                          setScrollSpeed(s);
                        }}
                        className={`w-5 h-5 rounded text-[10px] font-bold ${
                          scrollSpeed === s ? 'bg-[#FF5C00] text-black' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsTeleprompterScrolling(!isTeleprompterScrolling);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                      isTeleprompterScrolling
                        ? 'bg-red-600 text-white'
                        : 'bg-[#FF5C00] text-black'
                    }`}
                  >
                    {isTeleprompterScrolling ? 'Pause Scroll' : 'Start Auto-Scroll'}
                  </button>
                </div>
              </div>

              {/* Scrolling Window */}
              <div
                ref={teleprompterRef}
                className="h-80 rounded-2xl bg-black/90 border border-white/10 p-6 overflow-y-auto space-y-6 text-center scroll-smooth"
              >
                <p className="text-2xl md:text-3xl font-serif-display font-medium text-white leading-relaxed tracking-wide pt-12 pb-32">
                  {feedback?.tailoredRewrite || pitchText || 'Type or evaluate your pitch first to populate the live teleprompter window.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
