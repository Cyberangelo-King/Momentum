import React, { useState, useEffect } from 'react';
import { EventSession, SpeakerBriefing, SpeakerQuestionItem } from '../types';
import { fetchSpeakerBriefing, generateSpeakerQuestions } from '../services/aiService';
import { triggerHaptic } from '../services/haptics';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Compass, 
  Plus, 
  Check, 
  Mic, 
  FileText, 
  Share2, 
  ArrowRight,
  Layers,
  MessageSquarePlus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionDossierModalProps {
  session: EventSession | null;
  isOpen?: boolean;
  onClose: () => void;
  onStartCaptureForSession?: (session: EventSession, type?: string) => void;
  onOpenLiveCapture?: (session: EventSession) => void;
  onAddQuestionToNote?: (question: SpeakerQuestionItem) => void;
}

export const SessionDossierModal: React.FC<SessionDossierModalProps> = ({
  session,
  isOpen = true,
  onClose,
  onStartCaptureForSession,
  onOpenLiveCapture,
  onAddQuestionToNote,
}) => {
  if (!session || isOpen === false) return null;

  const [briefing, setBriefing] = useState<SpeakerBriefing | null>(session.briefing || null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(!session.briefing);
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'briefing' | 'questions' | 'themes'>('briefing');
  const [isGeneratingMoreQuestions, setIsGeneratingMoreQuestions] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBriefing() {
      if (!session) return;
      if (session.briefing) {
        setBriefing(session.briefing);
        setIsLoadingBriefing(false);
        return;
      }
      setIsLoadingBriefing(true);
      try {
        const data = await fetchSpeakerBriefing(session);
        if (isMounted) {
          setBriefing(data);
        }
      } catch (err) {
        console.warn('Failed to load briefing:', err);
      } finally {
        if (isMounted) setIsLoadingBriefing(false);
      }
    }
    loadBriefing();
    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleSaveQuestion = (q: SpeakerQuestionItem) => {
    triggerHaptic('medium');
    setSavedQuestionIds((prev) => [...prev, q.id]);
    if (onAddQuestionToNote) {
      onAddQuestionToNote({
        ...q,
        sessionId: session.id,
        speakerName: session.speaker,
      });
    }
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    triggerHaptic('success');
    const newQ: SpeakerQuestionItem = {
      id: `custom_q_${Date.now()}`,
      question: customQuestion.trim(),
      angle: 'Personal Angle',
      whyItWorks: 'Custom question prepared prior to session entry.',
      sessionId: session.id,
      speakerName: session.speaker,
    };
    if (briefing) {
      setBriefing({
        ...briefing,
        preGeneratedQuestions: [newQ, ...briefing.preGeneratedQuestions],
      });
    }
    setSavedQuestionIds((prev) => [...prev, newQ.id]);
    if (onAddQuestionToNote) {
      onAddQuestionToNote(newQ);
    }
    setCustomQuestion('');
  };

  const handleGenerateMoreQuestions = async () => {
    setIsGeneratingMoreQuestions(true);
    triggerHaptic('light');
    try {
      const res = await generateSpeakerQuestions({
        speakerName: session.speaker,
        speakerRole: session.speakerRole,
        sessionTitle: session.title,
        topic: session.title,
        angle: 'provocative',
      });
      if (res && res.questions && briefing) {
        const mapped: SpeakerQuestionItem[] = res.questions.map((q) => ({
          id: q.id || `q_${Date.now()}_${Math.random()}`,
          question: q.question,
          angle: q.angle,
          whyItWorks: q.whyItWorks,
          followUpHook: q.followUpHook,
          sessionId: session.id,
          speakerName: session.speaker,
        }));
        setBriefing({
          ...briefing,
          preGeneratedQuestions: [...briefing.preGeneratedQuestions, ...mapped],
        });
        triggerHaptic('success');
      }
    } catch (e) {
      console.warn('Generate questions error:', e);
    } finally {
      setIsGeneratingMoreQuestions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-2xl max-h-[90vh] bg-[#140b07] border border-[#FF5C00]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left"
      >
        {/* Header Hero Area */}
        <div className="relative p-6 sm:p-7 border-b border-white/10 bg-gradient-to-br from-[#241108] via-[#160a04] to-[#0e0502]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#FF5C00]/40 flex-shrink-0 bg-black">
                <img
                  src={session.heroImage || session.speakerAvatar}
                  alt={session.speaker}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] uppercase tracking-wider">
                    BEFORE Stage • Session Briefing
                  </span>
                  <span className="text-xs text-[#e4beb1]/70">{session.stage} • {session.timeStr}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-[#fadcd2] mt-1 leading-tight truncate">
                  {session.title}
                </h2>
                <p className="text-xs text-[#ffb59a] font-medium mt-0.5">
                  {session.speaker} — <span className="text-[#e4beb1]/70">{session.speakerRole}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl text-[#e4beb1]/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/5">
            <button
              onClick={() => setActiveTab('briefing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'briefing'
                  ? 'bg-[#FF5C00] text-black shadow-md'
                  : 'bg-white/5 text-[#fadcd2]/70 hover:text-white'
              }`}
            >
              Strategic Briefing
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'questions'
                  ? 'bg-[#FF5C00] text-black shadow-md'
                  : 'bg-white/5 text-[#fadcd2]/70 hover:text-white'
              }`}
            >
              <span>Prepared Q&A ({briefing?.preGeneratedQuestions.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'themes'
                  ? 'bg-[#FF5C00] text-black shadow-md'
                  : 'bg-white/5 text-[#fadcd2]/70 hover:text-white'
              }`}
            >
              Core Themes
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoadingBriefing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#FF5C00] animate-spin" />
              <p className="text-xs font-semibold text-[#fadcd2]">Synthesizing Speaker Intelligence Dossier...</p>
              <p className="text-[11px] text-[#e4beb1]/60">Analyzing speaker background, session angle, and high-impact questions.</p>
            </div>
          ) : briefing ? (
            <>
              {activeTab === 'briefing' && (
                <div className="space-y-5">
                  {/* Why it Matters Card */}
                  <div className="p-4.5 rounded-2xl bg-[#1d0e07] border border-[#FF5C00]/30 shadow-inner">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#FF5C00] uppercase tracking-wider mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Why This Session Matters</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#fadcd2] leading-relaxed">
                      {briefing.whyItMatters}
                    </p>
                  </div>

                  {/* Speaker Background Context */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF5C00]" />
                      <span>Speaker Profile & Context</span>
                    </h4>
                    <p className="text-xs text-[#e4beb1]/80 leading-relaxed">
                      {briefing.speakerBio || session.description}
                    </p>
                  </div>

                  {/* Recommended Angles */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-[#FF5C00]" />
                      <span>Key Strategic Observation Angles</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {briefing.recommendedAngles.map((angle, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#201008] border border-white/5 text-xs text-[#fadcd2] font-medium"
                        >
                          <span className="text-[10px] text-[#FF5C00] font-bold block mb-1">Angle #{idx + 1}</span>
                          {angle}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-4">
                  {/* Custom Pre-Event Question Input */}
                  <div className="p-3.5 rounded-2xl bg-[#1c0d06] border border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomQuestion()}
                      placeholder="Add your own custom question before entering the room..."
                      className="flex-1 bg-transparent text-xs text-[#fadcd2] placeholder-[#e4beb1]/40 outline-none px-2"
                    />
                    <button
                      onClick={handleAddCustomQuestion}
                      disabled={!customQuestion.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs disabled:opacity-40 hover:bg-[#ff7a33] transition-colors flex items-center gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      Prepared Questions ({briefing.preGeneratedQuestions.length})
                    </span>
                    <button
                      onClick={handleGenerateMoreQuestions}
                      disabled={isGeneratingMoreQuestions}
                      className="text-xs text-[#FF5C00] hover:underline flex items-center gap-1 font-semibold"
                    >
                      {isGeneratingMoreQuestions ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Generate Strategic Questions</span>
                    </button>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-3">
                    {briefing.preGeneratedQuestions.map((q) => {
                      const isSaved = savedQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl bg-[#1a0c06] border border-white/10 hover:border-[#FF5C00]/40 transition-all text-left space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF5C00]/15 text-[#FF5C00] uppercase tracking-wider">
                                {q.angle || 'Q&A Strategy'}
                              </span>
                              <p className="text-xs sm:text-sm font-semibold text-[#fadcd2] leading-snug">
                                "{q.question}"
                              </p>
                            </div>
                            <button
                              onClick={() => handleSaveQuestion(q)}
                              className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                                isSaved
                                  ? 'bg-[#25D366]/20 text-[#25D366]'
                                  : 'bg-white/5 text-[#fadcd2] hover:bg-[#FF5C00] hover:text-black'
                              }`}
                              title={isSaved ? 'Linked to Notes' : 'Save to Notes'}
                            >
                              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>

                          {q.whyItWorks && (
                            <p className="text-[11px] text-[#e4beb1]/70 leading-relaxed pl-1 border-l-2 border-[#FF5C00]/30">
                              <span className="text-[#FF5C00] font-semibold">Why it works:</span> {q.whyItWorks}
                            </p>
                          )}
                          {q.followUpHook && (
                            <p className="text-[11px] text-[#e4beb1]/60 italic pl-1">
                              <span className="text-[#ffb59a] font-semibold">Follow-up hook:</span> "{q.followUpHook}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'themes' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#1d0e07] border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-[#FF5C00] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>Anticipated Core Themes</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {briefing.coreThemes.map((theme, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-[#fadcd2]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] mt-1.5 flex-shrink-0" />
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Action Footer: Instant Bridge to CAPTURE */}
        <div className="p-5 border-t border-white/10 bg-[#120703] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#e4beb1]/70">
            <span>Ready for session? Tap to start live in-room capture:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
                if (onStartCaptureForSession) {
                  onStartCaptureForSession(session, 'recording');
                } else if (onOpenLiveCapture) {
                  onOpenLiveCapture(session);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 min-h-[44px]"
            >
              <Mic className="w-4 h-4" />
              <span>Record Live Talk</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
                if (onStartCaptureForSession) {
                  onStartCaptureForSession(session, 'note');
                } else if (onOpenLiveCapture) {
                  onOpenLiveCapture(session);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-[#221008] border border-white/10 text-[#fadcd2] font-semibold text-xs hover:bg-[#32160c] transition-all flex items-center gap-2 min-h-[44px] active:scale-95"
            >
              <FileText className="w-4 h-4 text-[#FF5C00]" />
              <span>Smart Notes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
