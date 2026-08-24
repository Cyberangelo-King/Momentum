import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Lightbulb, 
  FileText, 
  Quote, 
  HelpCircle, 
  CheckSquare, 
  Bookmark, 
  X, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  Clock, 
  Volume2, 
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventSession, QuickCaptureType, Note, Idea, NoteActionItem, SpeakerQuestionItem, Moment } from '../types';
import { triggerHaptic } from '../services/haptics';
import { SpeechTranscriber, VoiceRecorderSession } from '../services/speechService';
import { globalTranscriptionEngine } from '../services/transcriptionEngine';
import { extractInsightsWithGemini } from '../services/aiService';

interface InstantCaptureBarProps {
  sessions: EventSession[];
  activeSessionId?: string;
  onSaveNote: (note: Partial<Note>) => void;
  onSaveIdea: (idea: Partial<Idea>) => void;
  onSaveMoment: (moment: Partial<Moment>) => void;
  onSelectTab?: (tab: string) => void;
}

export const InstantCaptureBar: React.FC<InstantCaptureBarProps> = ({
  sessions,
  activeSessionId,
  onSaveNote,
  onSaveIdea,
  onSaveMoment,
  onSelectTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<QuickCaptureType>('recording');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeSessionId || sessions[0]?.id || ''
  );
  
  // Fast Quick Form states
  const [quickText, setQuickText] = useState('');
  const [speakerAttribution, setSpeakerAttribution] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live audio recording states
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveRawTranscript, setLiveRawTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recorderRef = useRef<VoiceRecorderSession | null>(null);
  const transcriberRef = useRef<SpeechTranscriber | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  useEffect(() => {
    if (currentSession && !speakerAttribution) {
      setSpeakerAttribution(currentSession.speaker || '');
    }
  }, [currentSession]);

  // Clean up timers/recorders on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recorderRef.current) recorderRef.current.stop().catch(() => {});
      if (transcriberRef.current) transcriberRef.current.stop();
    };
  }, []);

  const handleStartQuickRecording = async () => {
    triggerHaptic('heavy');
    setIsRecordingAudio(true);
    setRecordingSeconds(0);
    setLiveRawTranscript('');

    try {
      // 1. Start Web Speech real-time low-latency transcriber
      const transcriber = new SpeechTranscriber({
        onTranscript: (text) => setLiveRawTranscript(text),
        onError: (err) => console.warn('Speech transcriber notice:', err),
        onEnd: () => setIsDictating(false),
      });
      transcriberRef.current = transcriber;
      transcriber.start();
      setIsDictating(true);

      // 2. Start MediaRecorder for audio fidelity
      const recorder = new VoiceRecorderSession({
        onVolumeChange: (level) => {
          setAudioLevel(level);
        },
      });
      recorderRef.current = recorder;
      await recorder.start();

      // 3. Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio start error:', err);
      setIsRecordingAudio(false);
      triggerHaptic('error');
    }
  };

  const handleStopAndSaveRecording = async () => {
    triggerHaptic('milestone');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (transcriberRef.current) {
      transcriberRef.current.stop();
    }

    setIsRecordingAudio(false);
    setIsProcessing(true);

    try {
      let audioResult = null;
      if (recorderRef.current) {
        audioResult = await recorderRef.current.stop();
      }

      // Process audio through the Replaceable Transcription Engine
      let transResult = null;
      if (audioResult?.dataUrl) {
        transResult = await globalTranscriptionEngine.processAudio(
          audioResult.dataUrl,
          liveRawTranscript,
          {
            speakerName: currentSession?.speaker || speakerAttribution,
            sessionTitle: currentSession?.title,
            mimeType: audioResult.mimeType,
          }
        );
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      // Save as Note with both Raw and Structured Transcripts
      const newNote: Partial<Note> = {
        id: `note_rec_${Date.now()}`,
        title: transResult?.title || `Voice Reflection: ${currentSession?.title || 'Session'}`,
        content: transResult?.structuredTranscript || liveRawTranscript || 'Live audio recording.',
        rawTranscript: transResult?.rawTranscript || liveRawTranscript,
        structuredTranscript: transResult?.structuredTranscript,
        transcriptSegments: transResult?.segments,
        category: 'Talk',
        speakerName: currentSession?.speaker || speakerAttribution,
        sessionTitle: currentSession?.title,
        sessionId: currentSession?.id,
        stageName: currentSession?.stage,
        keyTakeaways: transResult?.keyPoints || ['Spoken reflection saved.'],
        actionItems: (transResult?.actionItems || []).map((a, i) => ({
          id: `act_${Date.now()}_${i}`,
          text: a.text,
          done: false,
          priority: 'medium' as const,
          sessionTitle: currentSession?.title,
          speakerName: currentSession?.speaker,
        })),
        generatedQuestions: [],
        audioDataUrl: audioResult?.dataUrl,
        audioDurationFormatted: audioResult?.durationFormatted || `${Math.floor(recordingSeconds / 60)}:${recordingSeconds % 60}`,
        tags: transResult?.suggestedTags || ['#TEDxAkure', '#VoiceMemo'],
        timestamp: timeStr,
        date: dateStr,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      onSaveNote(newNote);

      setSuccessToast('🎙️ Live audio & structured transcript saved!');
      setTimeout(() => setSuccessToast(null), 3000);
      setLiveRawTranscript('');
      setRecordingSeconds(0);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to save audio recording:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickText.trim()) return;

    triggerHaptic('success');
    setIsProcessing(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const text = quickText.trim();
    const speaker = speakerAttribution.trim() || currentSession?.speaker || 'Speaker';

    try {
      if (selectedType === 'idea' || selectedType === 'quote') {
        onSaveIdea({
          id: `idea_${Date.now()}`,
          quote: text,
          takeaway: `Captured from ${speaker} during ${currentSession?.title || 'TEDxAkure'}.`,
          speakerName: speaker,
          speakerRole: currentSession?.speakerRole || 'Speaker',
          speakerAvatar: currentSession?.heroImage || '',
          sessionTitle: currentSession?.title || 'Keynote',
          sessionId: currentSession?.id,
          stageName: currentSession?.stage || 'Main Stage',
          timeStr,
          category: 'Keynote',
          tags: ['#TEDxAkure', selectedType === 'quote' ? '#Quote' : '#Idea'],
        });
        setSuccessToast(`💡 ${selectedType === 'quote' ? 'Quote' : 'Idea'} captured!`);
      } else if (selectedType === 'action') {
        const actionItem: NoteActionItem = {
          id: `act_${Date.now()}`,
          text,
          done: false,
          priority: 'high',
          sessionId: currentSession?.id,
          sessionTitle: currentSession?.title,
          speakerName: speaker,
        };

        onSaveNote({
          id: `note_act_${Date.now()}`,
          title: `Action: ${text.slice(0, 40)}...`,
          content: `Action item committed during ${currentSession?.title || 'TEDxAkure'}:\n\n- [ ] ${text}`,
          category: 'Strategy',
          speakerName: speaker,
          sessionTitle: currentSession?.title,
          sessionId: currentSession?.id,
          keyTakeaways: [`Action commitment: ${text}`],
          actionItems: [actionItem],
          generatedQuestions: [],
          tags: ['#TEDxAkure', '#ActionItem'],
          timestamp: timeStr,
          date: dateStr,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        setSuccessToast('⚡ Action item added to your queue!');
      } else if (selectedType === 'question') {
        const questionItem: SpeakerQuestionItem = {
          id: `q_${Date.now()}`,
          question: text,
          angle: 'In-Room Question',
          whyItWorks: 'Question prepared during live keynote for Q&A.',
          sessionId: currentSession?.id,
          speakerName: speaker,
        };

        onSaveNote({
          id: `note_q_${Date.now()}`,
          title: `Question for ${speaker}`,
          content: `Question to ask ${speaker} (${currentSession?.title || 'Session'}):\n\n"${text}"`,
          category: 'Keynote',
          speakerName: speaker,
          sessionTitle: currentSession?.title,
          sessionId: currentSession?.id,
          keyTakeaways: [`Question logged: "${text}"`],
          actionItems: [],
          generatedQuestions: [questionItem],
          tags: ['#TEDxAkure', '#QA'],
          timestamp: timeStr,
          date: dateStr,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        setSuccessToast('❓ Q&A Question recorded!');
      } else if (selectedType === 'bookmark') {
        onSaveMoment({
          id: `mom_bm_${Date.now()}`,
          type: 'bookmark',
          title: `Bookmark: ${currentSession?.title || 'Session'}`,
          caption: text,
          mediaUrl: '',
          location: currentSession?.stage || 'Main Stage',
          timestamp: timeStr,
          date: dateStr,
          sessionId: currentSession?.id,
          sessionTitle: currentSession?.title,
          speakerName: speaker,
          taggedPeopleIds: [],
        });
        setSuccessToast('🔖 Talk moment bookmarked!');
      } else {
        // Standard Field Note with instant Gemini extract
        const note: Partial<Note> = {
          id: `note_jot_${Date.now()}`,
          title: text.slice(0, 45) + (text.length > 45 ? '...' : ''),
          content: text,
          category: 'Quick Jot',
          speakerName: speaker,
          sessionTitle: currentSession?.title,
          sessionId: currentSession?.id,
          stageName: currentSession?.stage,
          keyTakeaways: [text.slice(0, 100)],
          actionItems: [],
          generatedQuestions: [],
          tags: ['#TEDxAkure', '#QuickNote'],
          timestamp: timeStr,
          date: dateStr,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        onSaveNote(note);
        setSuccessToast('📝 Quick note saved!');
      }

      setQuickText('');
      setTimeout(() => setSuccessToast(null), 3000);
      setIsOpen(false);
    } catch (err) {
      console.warn('Quick submit error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSpeechDictation = () => {
    triggerHaptic('medium');
    if (isDictating && transcriberRef.current) {
      transcriberRef.current.stop();
      setIsDictating(false);
    } else {
      const transcriber = new SpeechTranscriber({
        onTranscript: (text) => setQuickText(text),
        onError: (err) => console.warn('Dictation err:', err),
        onEnd: () => setIsDictating(false),
      });
      transcriberRef.current = transcriber;
      transcriber.start();
      setIsDictating(true);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#FF5C00] text-black font-bold text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 1-Tap Capture Trigger Pill (Always Accessible) */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 z-40">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium');
              setIsOpen(true);
            }}
            className="px-4 py-3 rounded-full bg-gradient-to-r from-[#FF5C00] to-[#ff3700] text-black font-bold text-xs shadow-2xl shadow-[#FF5C00]/40 flex items-center gap-2 border border-white/20 hover:brightness-110 transition-all min-h-[48px]"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span className="font-extrabold tracking-wide uppercase text-[11px]">Instant Capture</span>
            <div className="w-2 h-2 rounded-full bg-black/40 animate-ping ml-0.5" />
          </motion.button>
        </div>
      )}

      {/* Instant Capture Modal Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-xl bg-[#140b07] border border-[#FF5C00]/40 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]"
            >
              {/* Header Context Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#221008] via-[#160a04] to-[#0e0502] border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider block">
                      CAPTURE STAGE • ZERO FRICTION
                    </span>
                    <h3 className="text-sm font-bold text-[#fadcd2] truncate">
                      Fast Capture: {currentSession?.title || 'TEDxAkure'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-xl text-[#e4beb1]/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Linked Session Selector */}
              <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-[#e4beb1]/60 font-semibold uppercase flex-shrink-0">Link Session:</span>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedSessionId(s.id);
                      setSpeakerAttribution(s.speaker);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedSessionId === s.id
                        ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/50'
                        : 'text-[#e4beb1]/70 hover:text-white bg-white/5 border border-transparent'
                    }`}
                  >
                    {s.speaker} ({s.stage.split(' ')[0]})
                  </button>
                ))}
              </div>

              {/* Instant Capture Type Pills (1-Tap Switching) */}
              <div className="p-4 grid grid-cols-4 sm:grid-cols-7 gap-1.5 border-b border-white/5 bg-[#180d07]">
                {[
                  { type: 'recording' as const, label: 'Record', icon: Mic },
                  { type: 'idea' as const, label: 'Idea', icon: Lightbulb },
                  { type: 'note' as const, label: 'Note', icon: FileText },
                  { type: 'quote' as const, label: 'Quote', icon: Quote },
                  { type: 'question' as const, label: 'Question', icon: HelpCircle },
                  { type: 'action' as const, label: 'Action', icon: CheckSquare },
                  { type: 'bookmark' as const, label: 'Bookmark', icon: Bookmark },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedType === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedType(item.type);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-[#FF5C00] text-black shadow-md scale-102 font-bold'
                          : 'bg-white/5 text-[#e4beb1]/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Capture Form Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {selectedType === 'recording' ? (
                  /* 1-Tap Audio Recording Mode */
                  <div className="space-y-4 text-center py-2">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#e4beb1]/70">
                        <span>Speaker: <strong className="text-[#fadcd2]">{speakerAttribution}</strong></span>
                        <span className="flex items-center gap-1 font-mono text-[#FF5C00]">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>

                      {/* Live Animated Waveform */}
                      <div className="h-14 flex items-center justify-center gap-1 bg-[#100703] rounded-xl px-4 border border-white/5">
                        {isRecordingAudio ? (
                          Array.from({ length: 24 }).map((_, idx) => {
                            const height = Math.max(
                              4,
                              Math.min(48, Math.sin(idx + recordingSeconds * 2) * 20 + 24 + (audioLevel * 30))
                            );
                            return (
                              <motion.div
                                key={idx}
                                className="w-1 rounded-full bg-[#FF5C00]"
                                animate={{ height: `${height}px` }}
                                transition={{ duration: 0.1 }}
                              />
                            );
                          })
                        ) : (
                          <span className="text-xs text-[#e4beb1]/50 flex items-center gap-2">
                            <Volume2 className="w-4 h-4" /> Tap below to start instant audio capture
                          </span>
                        )}
                      </div>

                      {/* Live Transcript Stream Preview */}
                      {liveRawTranscript && (
                        <div className="p-3 rounded-xl bg-[#1c0d06] border border-[#FF5C00]/30 text-left space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF5C00]">
                            Live Speech Stream (Raw)
                          </span>
                          <p className="text-xs text-[#fadcd2] leading-relaxed line-clamp-3">
                            "{liveRawTranscript}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Record Trigger Controls */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {!isRecordingAudio ? (
                        <button
                          onClick={handleStartQuickRecording}
                          disabled={isProcessing}
                          className="px-6 py-3.5 rounded-full bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-xl shadow-[#FF5C00]/30 active:scale-95 min-h-[48px]"
                        >
                          <Mic className="w-5 h-5 fill-current" />
                          <span>Start Recording Talk</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStopAndSaveRecording}
                          disabled={isProcessing}
                          className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-xl shadow-red-600/30 active:scale-95 min-h-[48px] animate-pulse"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MicOff className="w-5 h-5" />
                          )}
                          <span>Stop & Save to Smart Notes</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Fast Text-Based Capture Mode */
                  <form onSubmit={handleQuickSubmit} className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#e4beb1]/70">
                      <span className="font-semibold text-[#fadcd2]">
                        {selectedType === 'idea' && '💡 Breakthrough Idea / Insight'}
                        {selectedType === 'note' && '📝 Fast Field Note'}
                        {selectedType === 'quote' && '💬 Attributed Quote'}
                        {selectedType === 'question' && '❓ Question for Speaker'}
                        {selectedType === 'action' && '⚡ Action Commitment / Task'}
                        {selectedType === 'bookmark' && '🔖 Timestamped Bookmark'}
                      </span>

                      <button
                        type="button"
                        onClick={toggleSpeechDictation}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isDictating
                            ? 'bg-[#FF5C00] text-black animate-pulse'
                            : 'bg-white/5 text-[#e4beb1] hover:text-white'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{isDictating ? 'Dictating...' : 'Voice Dictate'}</span>
                      </button>
                    </div>

                    <textarea
                      value={quickText}
                      onChange={(e) => setQuickText(e.target.value)}
                      placeholder={
                        selectedType === 'quote'
                          ? '"Quote exactly what the speaker said..."'
                          : selectedType === 'action'
                          ? 'e.g. Follow up on Dr. Amina’s API infrastructure paper by Friday'
                          : selectedType === 'question'
                          ? 'e.g. What is the single biggest bottleneck to scaling in Akure?'
                          : 'Jot your rapid thought with zero lag...'
                      }
                      rows={4}
                      className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#fadcd2] placeholder-[#e4beb1]/40 outline-none focus:border-[#FF5C00] transition-colors resize-none leading-relaxed"
                      autoFocus
                    />

                    {/* Speaker Attribution Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#e4beb1]/60 font-semibold flex-shrink-0">Speaker:</span>
                      <input
                        type="text"
                        value={speakerAttribution}
                        onChange={(e) => setSpeakerAttribution(e.target.value)}
                        placeholder="Speaker name"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#fadcd2] outline-none focus:border-[#FF5C00]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#e4beb1] font-semibold transition-colors min-h-[44px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!quickText.trim() || isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-lg shadow-[#FF5C00]/25 min-h-[44px]"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Save Instant {selectedType.toUpperCase()}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
