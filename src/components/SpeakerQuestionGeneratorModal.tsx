import React, { useState } from 'react';
import { Connection, EventSession, Note } from '../types';
import { generateSpeakerQuestions } from '../services/aiService';
import { 
  Sparkles, 
  X, 
  HelpCircle, 
  Copy, 
  Check, 
  User, 
  Lightbulb, 
  Compass, 
  Briefcase, 
  Cpu, 
  Globe, 
  PlusCircle, 
  Loader2, 
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface SpeakerQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  sessions: EventSession[];
  onSaveAsNote?: (note: Partial<Note>) => void;
  defaultSpeaker?: string;
  defaultTopic?: string;
}

export const SpeakerQuestionGeneratorModal: React.FC<SpeakerQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  connections,
  sessions,
  onSaveAsNote,
  defaultSpeaker = '',
  defaultTopic = '',
}) => {
  const [speakerName, setSpeakerName] = useState(defaultSpeaker);
  const [talkTopic, setTalkTopic] = useState(defaultTopic);
  const [contextNotes, setContextNotes] = useState('');
  const [selectedAngle, setSelectedAngle] = useState<string>('Practical Implementation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedAsNoteIndex, setSavedAsNoteIndex] = useState<number | null>(null);

  const [generatedQuestions, setGeneratedQuestions] = useState<
    Array<{
      question: string;
      context: string;
      targetAngle: string;
      followUpAngle?: string;
    }>
  >([]);

  const angles = [
    { label: 'Practical Implementation', icon: Briefcase, desc: 'Real-world hurdles, playbooks & execution' },
    { label: 'Visionary & Ecosystem', icon: Globe, desc: 'Future trajectory & African tech ecosystem' },
    { label: 'Technical & Systems', icon: Cpu, desc: 'Architecture, mechanics & edge cases' },
    { label: 'Contrarian & Critical', icon: Compass, desc: 'Challenging assumptions & nuanced trade-offs' },
  ];

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!speakerName.trim() && !talkTopic.trim()) {
      setError('Please enter either a speaker name or talk topic to generate questions.');
      return;
    }

    setError(null);
    setIsLoading(true);
    triggerHaptic('medium');

    try {
      const response = await generateSpeakerQuestions({
        speakerName: speakerName.trim() || 'Keynote Speaker',
        sessionTitle: talkTopic.trim() || 'TEDxAkure 2026 Talk',
        topic: talkTopic.trim() || undefined,
        talkNotes: `${selectedAngle} angle. Context: ${contextNotes.trim()}`,
      });

      if (response && response.questions && response.questions.length > 0) {
        const formatted = response.questions.map((q) => ({
          question: q.question,
          context: q.whyItWorks || `Strategic angle: ${q.angle}`,
          targetAngle: q.angle || selectedAngle,
          followUpAngle: q.followUpHook,
        }));
        setGeneratedQuestions(formatted);
        triggerHaptic('success');
      } else {
        setError('Could not generate questions at this moment. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to generate speaker questions:', err);
      setError(err?.message || 'Failed to connect with Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    triggerHaptic('light');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveQuestionAsNote = (qItem: { question: string; context: string; targetAngle: string }, index: number) => {
    if (onSaveAsNote) {
      onSaveAsNote({
        title: `Q&A Prep: ${speakerName || talkTopic}`,
        content: `### Prepared Question for ${speakerName || 'Speaker'}\n\n**"${qItem.question}"**\n\n#### Why this question matters\n${qItem.context}\n\n#### Target Angle\n${qItem.targetAngle}\n\n#### Context / Talk Topic\n${talkTopic}\n\n---\n*Captured via Gemini Speaker Q&A Copilot for TEDxAkure 2026*`,
        speaker: speakerName || undefined,
        category: 'Talk',
        tags: ['Q&A', 'Speaker Questions', qItem.targetAngle.toLowerCase().replace(/\s+/g, '-')],
        generatedQuestions: [
          {
            id: `q_${Date.now()}`,
            question: qItem.question,
            angle: qItem.targetAngle,
            whyItWorks: qItem.context,
            context: qItem.context,
            targetAngle: qItem.targetAngle,
          },
        ],
        suggestedQuestions: [
          {
            id: `q_${Date.now()}`,
            question: qItem.question,
            angle: qItem.targetAngle,
            whyItWorks: qItem.context,
            context: qItem.context,
            targetAngle: qItem.targetAngle,
          },
        ],
      });
      setSavedAsNoteIndex(index);
      triggerHaptic('success');
      setTimeout(() => setSavedAsNoteIndex(null), 2500);
    }
  };

  const handleSelectSpeakerPreset = (name: string, topic?: string) => {
    setSpeakerName(name);
    if (topic) setTalkTopic(topic);
    triggerHaptic('light');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#20110a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5C00] to-[#ff8c4a] text-black flex items-center justify-center font-bold shadow-md shadow-[#FF5C00]/20">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
                Speaker Q&A Strategy Generator
              </h2>
              <p className="text-[11px] text-[#e4beb1]/70">
                Gemini 3.7 AI • Thought-Provoking, High-Impact Questions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close generator modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Quick presets from attendees / sessions */}
          {sessions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-[#e4beb1]/70 block mb-1.5 uppercase tracking-wider">
                Quick Select Conference Speaker / Session
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {sessions.slice(0, 5).map((s) => {
                  const spName = s.speaker || s.speakerName || 'Speaker';
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSpeakerPreset(spName, s.title)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        speakerName === spName
                          ? 'bg-[#FF5C00] text-black border-[#FF5C00] font-bold'
                          : 'bg-[#1a0e08] text-[#fadcd2] border-white/10 hover:border-[#FF5C00]/40'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>{spName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#fadcd2] mb-1">
                Speaker Name
              </label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="e.g. Dr. Folashade Adeyemi"
                className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#fadcd2] mb-1">
                Talk Topic / Theme
              </label>
              <input
                type="text"
                value={talkTopic}
                onChange={(e) => setTalkTopic(e.target.value)}
                placeholder="e.g. Building Resilient AI Infra in Africa"
                className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none"
              />
            </div>
          </div>

          {/* Talk Key points or notes for context */}
          <div>
            <label className="block text-xs font-semibold text-[#fadcd2] mb-1">
              Talk Context, Rough Notes or Key Arguments (Optional)
            </label>
            <textarea
              rows={2}
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g. Discussed local data latency, decentralized power grids, and funding pipelines for Ondo state founders..."
              className="w-full bg-[#0d0603] border border-white/10 rounded-xl p-3 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Select Target Strategy Angle */}
          <div>
            <label className="block text-xs font-semibold text-[#fadcd2] mb-2">
              Question Strategy Angle
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {angles.map((ang) => {
                const Icon = ang.icon;
                const isSelected = selectedAngle === ang.label;
                return (
                  <button
                    type="button"
                    key={ang.label}
                    onClick={() => {
                      setSelectedAngle(ang.label);
                      triggerHaptic('light');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#2a1308] border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)]'
                        : 'bg-[#100703] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF5C00]' : 'text-neutral-400'}`} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#fadcd2]'}`}>
                        {ang.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#e4beb1]/70 leading-tight">
                      {ang.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Generate Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#ff7e38] text-black font-bold text-xs hover:brightness-110 shadow-lg shadow-[#FF5C00]/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting Strategic Speaker Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Generate Solid Questions with Gemini</span>
              </>
            )}
          </button>

          {/* Generated Questions List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF8246] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Prepared Q&A Arsenal ({generatedQuestions.length})</span>
                </h3>
                <span className="text-[10px] text-[#e4beb1]/60">
                  Ready for mic line or 1-on-1 networking
                </span>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#1b0d07] border border-[#FF5C00]/30 rounded-2xl space-y-3 hover:border-[#FF5C00] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-[#FF5C00]/20 text-[#FF8246] border border-[#FF5C00]/30">
                          {q.targetAngle || selectedAngle}
                        </span>
                        <p className="text-sm font-semibold text-[#fadcd2] leading-snug">
                          "{q.question}"
                        </p>
                      </div>
                    </div>

                    {/* Context / Why this matters */}
                    {q.context && (
                      <div className="p-2.5 bg-[#0d0603] rounded-xl border border-white/5 text-[11px] text-[#e4beb1]/80 leading-relaxed">
                        <span className="font-bold text-[#FF8246]">Why it hits: </span>
                        {q.context}
                      </div>
                    )}

                    {/* Follow-up angle */}
                    {q.followUpAngle && (
                      <div className="text-[11px] text-[#fadcd2]/70 italic flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-[#FF5C00]" />
                        <span>Follow-up pivot: {q.followUpAngle}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleCopy(q.question, idx)}
                        className="py-1.5 px-3 rounded-lg bg-[#28130a] text-[#fadcd2] hover:text-white hover:bg-[#381a0e] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/5"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onSaveAsNote && (
                        <button
                          type="button"
                          onClick={() => handleSaveQuestionAsNote(q, idx)}
                          className="py-1.5 px-3 rounded-lg bg-[#FF5C00]/20 text-[#FF8246] hover:bg-[#FF5C00]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#FF5C00]/30"
                        >
                          {savedAsNoteIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Saved to Notes!</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save as Note</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#180b06] border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-[#e4beb1]/60">
            Powered by Google Gemini 3.7
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
