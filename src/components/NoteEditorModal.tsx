import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteCategory, NoteActionItem, SpeakerQuestionItem, Connection, EventSession, EventConfig } from '../types';
import { enhanceNoteWithGemini, generateSpeakerQuestions, transcribeAudioWithGemini, refineTranscriptWithGemini } from '../services/aiService';
import { VoiceRecorderSession, SpeechTranscriber, isSpeechRecognitionSupported, VoiceRecordingResult } from '../services/speechService';
import { 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Pin, 
  Tag, 
  User, 
  MapPin, 
  ListChecks, 
  HelpCircle, 
  FileText, 
  Wand2, 
  Loader2, 
  Copy, 
  Bold, 
  List, 
  Quote, 
  Plus, 
  CheckCircle2, 
  Circle,
  Lightbulb,
  Share2,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  onSaveNote: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  connections: Connection[];
  sessions: EventSession[];
  activeEvent?: EventConfig;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  note,
  onSaveNote,
  onDeleteNote,
  connections,
  sessions,
  activeEvent,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Talk');
  const [speaker, setSpeaker] = useState('');
  const [location, setLocation] = useState('Main Stage');
  const [sessionId, setSessionId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // AI-generated structured data
  const [actionItems, setActionItems] = useState<NoteActionItem[]>([]);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SpeakerQuestionItem[]>([]);
  const [summary, setSummary] = useState<string>('');

  // Audio recording inside note
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioDataUrl, setAudioDataUrl] = useState<string | undefined>(undefined);
  const [audioDurationFormatted, setAudioDurationFormatted] = useState<string | undefined>(undefined);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // AI Loading states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New action item input
  const [newActionText, setNewActionText] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const recorderRef = useRef<VoiceRecorderSession | null>(null);
  const transcriberRef = useRef<SpeechTranscriber | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const categories: NoteCategory[] = ['Talk', 'Keynote', 'Panel', 'Workshop', 'Brainstorm', 'Strategy', 'General'];

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setCategory(note.category || 'Talk');
        setSpeaker(note.speaker || '');
        setLocation(note.location || 'Main Stage');
        setSessionId(note.sessionId || '');
        setIsPinned(!!note.isPinned);
        setTags(note.tags || []);
        setActionItems(note.actionItems || []);
        setKeyTakeaways(note.keyTakeaways || []);
        
        const existingQuestions: SpeakerQuestionItem[] = (note.generatedQuestions || []).concat(
          (note.suggestedQuestions || []).map((q, idx) => {
            if (typeof q === 'string') {
              return { id: `sq_${idx}`, question: q, angle: 'Strategic' };
            }
            return {
              id: q.id || `sq_${idx}`,
              question: q.question,
              angle: q.angle || (q as any).targetAngle || 'Strategic',
              whyItWorks: q.whyItWorks || (q as any).context,
              followUpHook: q.followUpHook || (q as any).followUpAngle,
            };
          })
        );
        setSuggestedQuestions(existingQuestions);
        setSummary(note.summary || '');
        setAudioDataUrl(note.audioDataUrl);
        setAudioDurationFormatted(note.audioDurationFormatted);
      } else {
        // Defaults for new note
        setTitle('');
        setContent('');
        setCategory('Talk');
        setSpeaker('');
        setLocation('Main Stage');
        setSessionId('');
        setIsPinned(false);
        setTags([]);
        setActionItems([]);
        setKeyTakeaways([]);
        setSuggestedQuestions([]);
        setSummary('');
        setAudioDataUrl(undefined);
        setAudioDurationFormatted(undefined);
      }
      setIsRecordingAudio(false);
      setRecordingDuration(0);
      setIsPlayingAudio(false);
      setStatusMessage(null);
    } else {
      cleanupAudio();
    }
  }, [isOpen, note]);

  const cleanupAudio = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.abort();
      recorderRef.current = null;
    }
    if (transcriberRef.current) {
      transcriberRef.current.abort();
      transcriberRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  const handleStartRecording = async () => {
    cleanupAudio();
    setIsRecordingAudio(true);
    setRecordingDuration(0);
    triggerHaptic('medium');

    try {
      const recorder = new VoiceRecorderSession();
      await recorder.start();
      recorderRef.current = recorder;

      // Also start live speech preview if supported
      if (isSpeechRecognitionSupported()) {
        const transcriber = new SpeechTranscriber({
          onTranscript: (liveText) => {
            // Optional: live indicator
          },
          onError: () => {},
        });
        transcriber.start();
        transcriberRef.current = transcriber;
      }

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start mic recording in note:', err);
      setIsRecordingAudio(false);
      triggerHaptic('error');
    }
  };

  const handleStopRecording = async () => {
    triggerHaptic('heavy');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (transcriberRef.current) {
      transcriberRef.current.stop();
    }

    if (recorderRef.current) {
      try {
        const result = await recorderRef.current.stop();
        setIsRecordingAudio(false);
        setAudioDataUrl(result.dataUrl);
        setAudioDurationFormatted(result.durationFormatted);

        // Run Neural Multimodal audio transcription
        if (result.dataUrl) {
          setIsTranscribingAudio(true);
          setStatusMessage('Transcribing audio clip with verbatim neural intelligence...');
          
          const aiTranscribe = await transcribeAudioWithGemini(
            result.dataUrl,
            result.mimeType,
            `TEDxAkure 2026 note capture for ${title || speaker || 'talk'}`
          );

          if (aiTranscribe && aiTranscribe.transcript) {
            setContent((prev) => {
              const newContent = prev.trim() 
                ? `${prev}\n\n### 🎙️ Spoken Reflection (${result.durationFormatted})\n${aiTranscribe.transcript}`
                : aiTranscribe.transcript;
              return newContent;
            });

            if (!title && aiTranscribe.title) {
              setTitle(aiTranscribe.title);
            }

            if (aiTranscribe.keyPoints && aiTranscribe.keyPoints.length > 0) {
              setKeyTakeaways((prev) => [...new Set([...prev, ...aiTranscribe.keyPoints!])]);
            }

            setStatusMessage('Audio transcribed & merged with note.');
            triggerHaptic('success');
            setTimeout(() => setStatusMessage(null), 3000);
          }
        }
      } catch (err) {
        console.error('Recording stop error:', err);
        setIsRecordingAudio(false);
      } finally {
        setIsTranscribingAudio(false);
      }
    }
  };

  const handleToggleAudioPlay = () => {
    if (!audioDataUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioDataUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioElementRef.current = audio;
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // AI Note Enhancer
  const handleEnhanceWithGemini = async () => {
    if (!content.trim() && !title.trim()) {
      setStatusMessage('Please write some notes or thoughts first.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setIsEnhancing(true);
    setStatusMessage('Neural Engine is structuring, polishing, and extracting insights...');
    triggerHaptic('medium');

    try {
      const context = `TEDxAkure 2026 Event. Category: ${category}. Speaker: ${speaker}. Location: ${location}.`;
      const enhanced = await enhanceNoteWithGemini(title, content, context);

      if (enhanced) {
        if (enhanced.title && (!title || title.length < 5)) {
          setTitle(enhanced.title);
        }
        if (enhanced.structuredContent) {
          setContent(enhanced.structuredContent);
        }
        if (enhanced.summary) {
          setSummary(enhanced.summary);
        }
        if (enhanced.keyTakeaways && enhanced.keyTakeaways.length > 0) {
          setKeyTakeaways(enhanced.keyTakeaways);
        }
        if (enhanced.actionItems && enhanced.actionItems.length > 0) {
          const newItems: NoteActionItem[] = enhanced.actionItems.map((item, idx) => ({
            id: `act_${Date.now()}_${idx}`,
            text: item.text,
            done: !!item.done || !!item.completed,
            completed: !!item.done || !!item.completed,
            priority: item.priority || 'medium',
          }));
          setActionItems((prev) => [...prev, ...newItems]);
        }
        if (enhanced.suggestedQuestions && enhanced.suggestedQuestions.length > 0) {
          const formattedQuestions: SpeakerQuestionItem[] = enhanced.suggestedQuestions.map((q, idx) => ({
            id: q.id || `q_${Date.now()}_${idx}`,
            question: q.question,
            angle: q.angle || (q as any).targetAngle || 'Strategic',
            whyItWorks: q.whyItWorks || (q as any).context,
            followUpHook: q.followUpHook || (q as any).followUpAngle,
          }));
          setSuggestedQuestions(formattedQuestions);
        }
        const returnedTags = enhanced.suggestedTags || enhanced.tags || [];
        if (returnedTags.length > 0) {
          setTags((prev) => [...new Set([...prev, ...returnedTags])]);
        }

        setStatusMessage('Note enhanced & structured with Neural Engine!');
        triggerHaptic('success');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Enhance error:', err);
      setStatusMessage('Could not complete AI enhancement. Please check connection.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Dedicated Speaker Questions generator for this note
  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    setStatusMessage('Neural Engine is crafting strategic speaker questions...');
    triggerHaptic('medium');

    try {
      const effectiveSpeaker = speaker.trim() || 'Speaker';
      const effectiveTopic = title.trim() || 'Conference Talk';
      const response = await generateSpeakerQuestions(
        effectiveSpeaker,
        effectiveTopic,
        `Note content: ${content.slice(0, 800)}`
      );

      if (response && response.questions && response.questions.length > 0) {
        setSuggestedQuestions(response.questions);
        setStatusMessage(`Generated ${response.questions.length} solid speaker questions!`);
        triggerHaptic('success');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Questions error:', err);
      setStatusMessage('Failed to generate questions.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      triggerHaptic('light');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    triggerHaptic('light');
  };

  const handleAddActionItem = () => {
    if (!newActionText.trim()) return;
    const newItem: NoteActionItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newActionText.trim(),
      done: false,
      completed: false,
      priority: newActionPriority,
    };
    setActionItems([...actionItems, newItem]);
    setNewActionText('');
    triggerHaptic('light');
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems(
      actionItems.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
    triggerHaptic('light');
  };

  const handleDeleteActionItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id));
    triggerHaptic('light');
  };

  const handleInsertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    triggerHaptic('light');

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 50);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      setStatusMessage('Please provide a title or content for your note.');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    const now = new Date().toISOString();
    const finalNote: Note = {
      id: note?.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      category,
      speaker: speaker.trim() || undefined,
      speakerName: speaker.trim() || undefined,
      location: location.trim() || undefined,
      sessionId: sessionId || undefined,
      tags,
      isPinned,
      actionItems,
      keyTakeaways,
      generatedQuestions: suggestedQuestions,
      suggestedQuestions,
      summary: summary.trim() || undefined,
      audioDataUrl,
      audioDurationFormatted,
      timestamp: note?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: note?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: note?.createdAt || now,
      updatedAt: now,
      eventId: note?.eventId || activeEvent?.id,
      isDemo: false,
    };

    triggerHaptic('success');
    onSaveNote(finalNote);
    onClose();
  };

  const handleCopyNoteMarkdown = () => {
    let md = `# ${title || 'Untitled Note'}\n\n`;
    if (speaker) md += `**Speaker:** ${speaker}\n`;
    if (location) md += `**Location:** ${location}\n`;
    md += `**Category:** ${category}\n\n---\n\n`;
    md += `${content}\n\n`;

    if (keyTakeaways.length > 0) {
      md += `### 💡 Key Takeaways\n`;
      keyTakeaways.forEach((k) => (md += `- ${k}\n`));
      md += `\n`;
    }

    if (actionItems.length > 0) {
      md += `### 🎯 Action Items\n`;
      actionItems.forEach((a) => (md += `- [${a.completed ? 'x' : ' '}] ${a.text} (${a.priority || 'normal'})\n`));
      md += `\n`;
    }

    if (suggestedQuestions.length > 0) {
      md += `### ❓ Prepared Speaker Questions\n`;
      suggestedQuestions.forEach((q) => (md += `- **"${q.question}"** — *${q.targetAngle || 'angle'}*: ${q.context || ''}\n`));
      md += `\n`;
    }

    navigator.clipboard.writeText(md);
    setStatusMessage('Copied full formatted note to clipboard!');
    triggerHaptic('light');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold shrink-0 border border-[var(--border-accent)]">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold font-serif-display text-white truncate">
                {note ? 'Edit Note & AI Copilot' : 'New Smart Note'}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                AI-Powered Note-Taking & Q&A Prep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPinned(!isPinned);
                triggerHaptic('light');
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isPinned
                  ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]'
                  : 'bg-white/5 text-[var(--text-secondary)] border-white/10 hover:text-white'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleCopyNoteMarkdown}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[var(--text-primary)] hover:text-white transition-colors"
              title="Copy as Markdown"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close note modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="bg-[var(--accent-primary)]/20 border-b border-[var(--border-accent)] px-4 py-2 text-xs font-medium text-[var(--accent-primary)] flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-white/60 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Note Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full bg-transparent border-b border-[var(--border-subtle)] pb-2 text-lg sm:text-xl font-bold font-serif-display text-white focus:border-[var(--accent-primary)] focus:outline-none placeholder:text-white/30"
            />
          </div>

          {/* Metadata Row: Category, Speaker, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-2xl">
            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-mono">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoteCategory)}
                className="w-full bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker Name */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-mono">
                Speaker / Host
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="Speaker name"
                  className="w-full bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none pl-7"
                />
                <User className="w-3.5 h-3.5 text-[var(--accent-primary)] absolute left-2 top-2" />
              </div>
            </div>

            {/* Location / Stage */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-mono">
                Stage / Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none pl-7"
                />
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)] absolute left-2 top-2" />
              </div>
            </div>
          </div>

          {/* Quick AI & Voice Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[var(--accent-primary)] flex items-center gap-1 px-2 font-mono">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>AI Copilot:</span>
              </span>

              {/* Enhance Button */}
              <button
                type="button"
                onClick={handleEnhanceWithGemini}
                disabled={isEnhancing}
                className="py-1.5 px-3 rounded-xl bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-[var(--accent-primary)] border border-[var(--border-accent)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Structure messy notes, summarize & extract tasks"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Structure & Enhance</span>
              </button>

              {/* Questions Generator Button */}
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions}
                className="py-1.5 px-3 rounded-xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] text-white border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Generate sharp questions for the speaker"
              >
                {isGeneratingQuestions ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                )}
                <span>Speaker Questions</span>
              </button>
            </div>

            {/* Audio Voice Dictation Button */}
            <div className="flex items-center gap-2">
              {!isRecordingAudio ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isTranscribingAudio}
                  className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTranscribingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{isTranscribingAudio ? 'Transcribing...' : 'Record Voice Memo'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="py-1.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-lg shadow-rose-600/30"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop ({formatTimer(recordingDuration)})</span>
                </button>
              )}
            </div>
          </div>

          {/* Attached Audio Player Bar if exists */}
          {audioDataUrl && (
            <div className="p-3 bg-[#1e100a] border border-[#FF5C00]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleAudioPlay}
                  className="w-8 h-8 rounded-lg bg-[#FF5C00] text-black flex items-center justify-center font-bold hover:bg-[#ff7a33] transition-transform active:scale-95"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <p className="text-xs font-bold text-[#fadcd2]">Attached Spoken Clip</p>
                  <p className="text-[10px] text-[#FF8246] font-mono">{audioDurationFormatted || 'Audio memo'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  cleanupAudio();
                  setAudioDataUrl(undefined);
                  setAudioDurationFormatted(undefined);
                  triggerHaptic('light');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/20"
                title="Remove attached audio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Markdown Quick Formatting Helpers */}
          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleInsertMarkdown('### ')}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#e4beb1] font-bold text-[11px]"
                title="Heading"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => handleInsertMarkdown('**', '**')}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#e4beb1] font-bold text-[11px]"
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertMarkdown('- ')}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#e4beb1] text-[11px]"
                title="Bullet List"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertMarkdown('> ')}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#e4beb1] text-[11px]"
                title="Quote"
              >
                <Quote className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-[#e4beb1]/50">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          {/* Primary Note Textarea */}
          <div>
            <textarea
              ref={contentTextareaRef}
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture speaker insights, core quotes, technical diagrams, questions, or ideas. Click 'Structure & Enhance' anytime for AI to polish and organize..."
              className="w-full bg-[#0b0502] border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none resize-y leading-relaxed font-sans"
            />
          </div>

          {/* AI Executive Summary Card (if available) */}
          {summary && (
            <div className="p-3.5 bg-[#1b0e08] border border-[#FF5C00]/30 rounded-2xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#FF8246] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Executive Takeaway</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSummary('')}
                  className="text-white/40 hover:text-white text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-[#fadcd2]/90 leading-relaxed italic">{summary}</p>
            </div>
          )}

          {/* Key Takeaways Section */}
          {keyTakeaways.length > 0 && (
            <div className="p-3.5 bg-[#150a04] border border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#fadcd2] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Key Takeaways ({keyTakeaways.length})</span>
                </h4>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-[#e4beb1]/90">
                {keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="leading-snug">{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items Section */}
          <div className="p-3.5 bg-[#150a04] border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#fadcd2] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span>Action Items & Follow-ups ({actionItems.filter((a) => a.completed).length}/{actionItems.length})</span>
              </h4>
            </div>

            {/* Action Items List */}
            {actionItems.length > 0 && (
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      item.completed
                        ? 'bg-black/30 border-white/5 text-white/40 line-through'
                        : 'bg-[#1e100a] border-white/10 text-[#fadcd2]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleActionItem(item.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                      <span className="text-xs">{item.text}</span>
                    </button>

                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          item.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : item.priority === 'low'
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.priority || 'medium'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteActionItem(item.id)}
                        className="text-white/40 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Action Item Row */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddActionItem()}
                placeholder="Add follow-up task or reminder..."
                className="flex-1 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
              />
              <select
                value={newActionPriority}
                onChange={(e) => setNewActionPriority(e.target.value as any)}
                className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="button"
                onClick={handleAddActionItem}
                className="p-2 rounded-xl bg-[var(--accent-primary)] text-black hover:brightness-110 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Suggested Speaker Questions Section */}
          {suggestedQuestions.length > 0 && (
            <div className="p-3.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1.5 font-mono">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Prepared Speaker Questions ({suggestedQuestions.length})</span>
                </h4>
              </div>

              <div className="space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[var(--bg-surface-card)] rounded-xl border border-[var(--border-subtle)] space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white">
                        "{q.question}"
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(q.question);
                          triggerHaptic('light');
                          setStatusMessage('Copied question!');
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                        className="p-1 text-[var(--text-secondary)] hover:text-white rounded hover:bg-white/5"
                        title="Copy question"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {q.context && (
                      <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                        <strong className="text-[var(--accent-primary)]">Strategic context:</strong> {q.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Row */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Tags & Key Topics
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] text-[11px] text-[var(--accent-primary)] flex items-center gap-1 font-mono"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add custom tag..."
                className="flex-1 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 sm:p-4 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          {note && onDeleteNote ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onDeleteNote(note.id);
                onClose();
              }}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
