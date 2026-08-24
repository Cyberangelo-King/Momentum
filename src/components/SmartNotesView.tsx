import React, { useState, useMemo } from 'react';
import { Note, NoteCategory, Connection, EventSession, EventConfig } from '../types';
import { NoteEditorModal } from './NoteEditorModal';
import { SpeakerQuestionGeneratorModal } from './SpeakerQuestionGeneratorModal';
import { VoiceMemoModal } from './VoiceMemoModal';
import { 
  FileText, 
  Plus, 
  Search, 
  Sparkles, 
  Mic, 
  HelpCircle, 
  Pin, 
  Tag, 
  User, 
  MapPin, 
  ListChecks, 
  Lightbulb, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check, 
  Download, 
  Filter, 
  Trash2, 
  Play, 
  Pause,
  ArrowRight,
  Bookmark,
  Calendar,
  Layers,
  Wand2,
  Globe
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface SmartNotesViewProps {
  notes: Note[];
  connections: Connection[];
  sessions: EventSession[];
  activeEvent?: EventConfig;
  onSaveNote: (note: Note) => void;
  onUpdateNote?: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onTrashNote?: (note: Note) => void;
  onRestoreNote?: (noteId: string) => void;
  onSaveVoiceMoment?: (momentData: any) => void;
  onOpenSpeakerDossier?: (session: EventSession) => void;
}

export const SmartNotesView: React.FC<SmartNotesViewProps> = ({
  notes,
  connections,
  sessions,
  activeEvent,
  onSaveNote,
  onUpdateNote,
  onDeleteNote,
  onTrashNote,
  onRestoreNote,
  onSaveVoiceMoment,
  onOpenSpeakerDossier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterHasActions, setFilterHasActions] = useState(false);
  const [filterHasQuestions, setFilterHasQuestions] = useState(false);
  const [showAllEventsNotes, setShowAllEventsNotes] = useState(false);
  
  // Modals state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isQuestionGenOpen, setIsQuestionGenOpen] = useState(false);
  const [isVoiceMemoOpen, setIsVoiceMemoOpen] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [playingAudioNoteId, setPlayingAudioNoteId] = useState<string | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const categories = ['All', 'Talk', 'Keynote', 'Panel', 'Workshop', 'Brainstorm', 'Strategy', 'General'];

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => !n.inTrash)
      .filter((n) => {
        if (!showAllEventsNotes && activeEvent) {
          if (n.eventId && n.eventId !== activeEvent.id) return false;
        }
        if (selectedCategory !== 'All' && n.category !== selectedCategory) {
          return false;
        }
        if (filterHasActions && (!n.actionItems || n.actionItems.length === 0)) {
          return false;
        }
        if (filterHasQuestions && (!n.suggestedQuestions || n.suggestedQuestions.length === 0)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchContent = n.content?.toLowerCase().includes(q);
          const matchSpeaker = n.speaker?.toLowerCase().includes(q);
          const matchLocation = n.location?.toLowerCase().includes(q);
          const matchTags = n.tags?.some((t) => t.toLowerCase().includes(q));
          const matchActions = n.actionItems?.some((a) => a.text.toLowerCase().includes(q));
          return matchTitle || matchContent || matchSpeaker || matchLocation || matchTags || matchActions;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned notes first, then latest updated
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [notes, selectedCategory, filterHasActions, filterHasQuestions, searchQuery, showAllEventsNotes, activeEvent]);

  // Overall stats
  const totalNotes = notes.filter((n) => !n.inTrash).length;
  const pendingActionsCount = notes
    .filter((n) => !n.inTrash)
    .flatMap((n) => n.actionItems || [])
    .filter((a) => !a.completed).length;
  const totalQuestionsCount = notes
    .filter((n) => !n.inTrash)
    .flatMap((n) => n.suggestedQuestions || []).length;

  const handleOpenNewNote = (initialData?: Partial<Note>) => {
    triggerHaptic('light');
    if (initialData) {
      const draftNote: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: initialData.title || '',
        content: initialData.content || '',
        category: initialData.category || 'Talk',
        speaker: initialData.speaker,
        location: initialData.location || 'Main Stage',
        tags: initialData.tags || [],
        actionItems: initialData.actionItems || [],
        keyTakeaways: initialData.keyTakeaways || [],
        generatedQuestions: initialData.generatedQuestions || [],
        suggestedQuestions: initialData.suggestedQuestions || [],
        summary: initialData.summary,
        audioDataUrl: initialData.audioDataUrl,
        audioDurationFormatted: initialData.audioDurationFormatted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEditingNote(draftNote);
    } else {
      setEditingNote(null);
    }
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    triggerHaptic('light');
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated: Note = {
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
  };

  const handleToggleActionInCard = (note: Note, actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updatedItems = (note.actionItems || []).map((a) =>
      a.id === actionId ? { ...a, completed: !a.completed } : a
    );
    const updated: Note = {
      ...note,
      actionItems: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
  };

  const handleCopyNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `# ${note.title}\n\n`;
    if (note.speaker) text += `**Speaker:** ${note.speaker}\n`;
    if (note.location) text += `**Location:** ${note.location}\n`;
    text += `**Category:** ${note.category}\n\n---\n\n${note.content}\n\n`;

    if (note.keyTakeaways && note.keyTakeaways.length > 0) {
      text += `### Key Takeaways\n`;
      note.keyTakeaways.forEach((k) => (text += `- ${k}\n`));
      text += `\n`;
    }

    if (note.actionItems && note.actionItems.length > 0) {
      text += `### Action Items\n`;
      note.actionItems.forEach((a) => (text += `- [${a.completed ? 'x' : ' '}] ${a.text}\n`));
      text += `\n`;
    }

    const allQuestions = (note.generatedQuestions || []).concat(
      (note.suggestedQuestions || []).map((q, idx) =>
        typeof q === 'string' ? { id: `q_${idx}`, question: q, angle: 'Strategic' } : q
      )
    );

    if (allQuestions.length > 0) {
      text += `### Prepared Questions\n`;
      allQuestions.forEach((q) => {
        const qText = typeof q === 'string' ? q : q.question;
        const qAngle = typeof q === 'string' ? 'Strategic' : q.angle || (q as any).targetAngle || 'Strategic';
        text += `- "${qText}" (${qAngle})\n`;
      });
      text += `\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    triggerHaptic('light');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleToggleAudio = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.audioDataUrl) return;

    if (playingAudioNoteId === note.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioNoteId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(note.audioDataUrl);
      audio.onended = () => setPlayingAudioNoteId(null);
      audio.play();
      audioPlayerRef.current = audio;
      setPlayingAudioNoteId(note.id);
    }
  };

  const handleExportAllNotes = () => {
    triggerHaptic('medium');
    let fullDoc = `# TEDxAkure 2026 — Master Event Notes & Strategic Insights\n`;
    fullDoc += `*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
    fullDoc += `---\n\n`;

    filteredNotes.forEach((n, idx) => {
      fullDoc += `## ${idx + 1}. ${n.title}\n`;
      if (n.speaker) fullDoc += `**Speaker:** ${n.speaker}  \n`;
      if (n.location) fullDoc += `**Location/Stage:** ${n.location}  \n`;
      fullDoc += `**Category:** ${n.category} | **Created:** ${new Date(n.createdAt).toLocaleDateString()}  \n\n`;
      
      if (n.summary) {
        fullDoc += `> **Executive Takeaway:** ${n.summary}\n\n`;
      }

      fullDoc += `${n.content}\n\n`;

      if (n.keyTakeaways && n.keyTakeaways.length > 0) {
        fullDoc += `#### 💡 Key Takeaways\n`;
        n.keyTakeaways.forEach((k) => (fullDoc += `- ${k}\n`));
        fullDoc += `\n`;
      }

      if (n.actionItems && n.actionItems.length > 0) {
        fullDoc += `#### 🎯 Action Items & Follow-ups\n`;
        n.actionItems.forEach((a) => (fullDoc += `- [${a.completed ? 'x' : ' '}] ${a.text} (${a.priority || 'medium'})\n`));
        fullDoc += `\n`;
      }

      const noteQuestions = (n.generatedQuestions || []).concat(
        (n.suggestedQuestions || []).map((q, qIdx) =>
          typeof q === 'string' ? { id: `q_${qIdx}`, question: q, angle: 'Strategic' } : q
        )
      );

      if (noteQuestions.length > 0) {
        fullDoc += `#### ❓ Prepared Speaker Questions\n`;
        noteQuestions.forEach((q) => {
          const qText = typeof q === 'string' ? q : q.question;
          const qAngle = typeof q === 'string' ? 'Strategic' : q.angle || (q as any).targetAngle || 'Strategic';
          const qContext = typeof q === 'string' ? '' : q.whyItWorks || (q as any).context || '';
          fullDoc += `- **"${qText}"** (*${qAngle}*)${qContext ? `: ${qContext}` : ''}\n`;
        });
        fullDoc += `\n`;
      }

      fullDoc += `---\n\n`;
    });

    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TEDxAkure_2026_Smart_Notes_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0A0502] text-[#fadcd2] pb-24 md:pb-12 pt-16 md:pt-6 px-4 sm:px-6 md:pl-72 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF8246] border border-[#FF5C00]/30 text-[11px] font-bold uppercase tracking-wider">
                Event OS Intelligence
              </span>
              <span className="text-xs text-[#e4beb1]/60 font-mono">
                {totalNotes} {totalNotes === 1 ? 'Note' : 'Notes'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-white tracking-tight">
              Smart Notes & AI Copilot
            </h1>
            <p className="text-xs sm:text-sm text-[#e4beb1]/80 max-w-2xl">
              Better than pen and paper. Capture live talk reflections, extract action items, and let Gemini 3.7 prepare sharp speaker questions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsQuestionGenOpen(true);
              }}
              className="py-2.5 px-3.5 rounded-xl bg-[#201008] hover:bg-[#2e160c] border border-[#FF5C00]/30 text-xs font-semibold text-[#FF8246] flex items-center gap-1.5 transition-colors active:scale-95"
              title="Generate tailored questions for speakers"
            >
              <HelpCircle className="w-4 h-4 text-[#FF5C00]" />
              <span>Speaker Q&A</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsVoiceMemoOpen(true);
              }}
              className="py-2.5 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors active:scale-95"
              title="Record spoken audio memo with Gemini transcription"
            >
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Voice Memo</span>
            </button>

            <button
              onClick={() => handleOpenNewNote()}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#ff7e38] text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#FF5C00]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#160a04] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-[#e4beb1]/60 uppercase tracking-wider font-semibold">Total Notes</p>
            <p className="text-xl font-bold font-serif-display text-white mt-0.5">{totalNotes}</p>
          </div>
          <div className="p-3 bg-[#160a04] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-[#e4beb1]/60 uppercase tracking-wider font-semibold">Pending Actions</p>
            <p className="text-xl font-bold font-serif-display text-[#FF8246] mt-0.5">{pendingActionsCount}</p>
          </div>
          <div className="p-3 bg-[#160a04] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-[#e4beb1]/60 uppercase tracking-wider font-semibold">Q&A Questions</p>
            <p className="text-xl font-bold font-serif-display text-emerald-400 mt-0.5">{totalQuestionsCount}</p>
          </div>
          <div className="p-3 bg-[#160a04] border border-white/5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#e4beb1]/60 uppercase tracking-wider font-semibold">Markdown Export</p>
              <p className="text-xs font-bold text-[#fadcd2] mt-0.5">Bundle All</p>
            </div>
            <button
              onClick={handleExportAllNotes}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              title="Download all notes as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across titles, takeaways, action items, tags, or speakers..."
                className="w-full bg-[#140b07] border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none placeholder:text-white/30"
              />
              <Search className="w-4 h-4 text-[#FF5C00] absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-white/50 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterHasActions(!filterHasActions);
                  triggerHaptic('light');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  filterHasActions
                    ? 'bg-[#FF5C00] text-black border-[#FF5C00]'
                    : 'bg-[#140b07] text-[#e4beb1]/70 border-white/10 hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>To-dos</span>
              </button>

              <button
                onClick={() => {
                  setFilterHasQuestions(!filterHasQuestions);
                  triggerHaptic('light');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  filterHasQuestions
                    ? 'bg-[#FF5C00] text-black border-[#FF5C00]'
                    : 'bg-[#140b07] text-[#e4beb1]/70 border-white/10 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Questions</span>
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  triggerHaptic('light');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#FF5C00] text-black font-bold'
                    : 'bg-[#160a04] text-[#e4beb1]/70 border border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((noteItem) => {
            const hasAudio = !!noteItem.audioDataUrl;
            const isPlayingThisAudio = playingAudioNoteId === noteItem.id;
            const completedActions = (noteItem.actionItems || []).filter((a) => a.completed).length;
            const totalActions = (noteItem.actionItems || []).length;

            return (
              <div
                key={noteItem.id}
                onClick={() => handleEditNote(noteItem)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-[#FF5C00]/5 ${
                  noteItem.isPinned
                    ? 'bg-gradient-to-br from-[#1d0e07] to-[#140a04] border-[#FF5C00]/40'
                    : 'bg-[#120803] border-white/10 hover:border-[#FF5C00]/30'
                }`}
              >
                {/* Note Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF5C00]/15 text-[#FF8246] border border-[#FF5C00]/30">
                        {noteItem.category || 'Note'}
                      </span>
                      {noteItem.speaker && (
                        <span className="text-[11px] text-[#fadcd2] font-semibold flex items-center gap-1">
                          <User className="w-3 h-3 text-[#FF5C00]" />
                          <span>{noteItem.speaker}</span>
                        </span>
                      )}
                      {noteItem.location && (
                        <span className="text-[10px] text-[#e4beb1]/60 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#FF5C00]" />
                          <span>{noteItem.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleTogglePin(noteItem, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          noteItem.isPinned
                            ? 'text-[#FF5C00] bg-[#FF5C00]/10'
                            : 'text-white/30 hover:text-white hover:bg-white/5'
                        }`}
                        title={noteItem.isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${noteItem.isPinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleCopyNote(noteItem, e)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="Copy Markdown"
                      >
                        {copiedNoteId === noteItem.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold font-serif-display text-white group-hover:text-[#ffb59a] transition-colors leading-snug">
                    {noteItem.title || 'Untitled Note'}
                  </h3>

                  {/* AI Summary Banner if exists */}
                  {noteItem.summary && (
                    <p className="text-xs text-[#fadcd2]/90 italic bg-[#1a0c06] p-2.5 rounded-xl border border-[#FF5C00]/20 leading-relaxed">
                      "{noteItem.summary}"
                    </p>
                  )}

                  {/* Content Preview */}
                  <p className="text-xs text-[#e4beb1]/80 line-clamp-3 leading-relaxed">
                    {noteItem.content || 'No text content yet. Click to start typing or speak.'}
                  </p>
                </div>

                {/* Key takeaways or actions preview */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  {/* Action items preview list */}
                  {noteItem.actionItems && noteItem.actionItems.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#e4beb1]/60">
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3 text-[#FF5C00]" />
                          <span>Action Items</span>
                        </span>
                        <span>{completedActions}/{totalActions}</span>
                      </div>
                      <div className="space-y-1">
                        {noteItem.actionItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => handleToggleActionInCard(noteItem, item.id, e)}
                            className="flex items-center gap-2 text-xs text-[#fadcd2]/90 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            )}
                            <span className={`truncate ${item.completed ? 'line-through text-white/40' : ''}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prepared Questions counter pill */}
                  {noteItem.suggestedQuestions && noteItem.suggestedQuestions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#FF8246] bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-2.5 py-1 rounded-xl">
                      <HelpCircle className="w-3 h-3" />
                      <span className="font-bold">{noteItem.suggestedQuestions.length} Speaker Questions Prepared</span>
                    </div>
                  )}

                  {/* Tags */}
                  {noteItem.tags && noteItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {noteItem.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-[10px] text-[#e4beb1]/60 bg-white/5 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata & Audio player pill */}
                  <div className="flex items-center justify-between text-[11px] text-[#e4beb1]/50 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(noteItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </span>

                    {hasAudio && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleAudio(noteItem, e)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 hover:bg-rose-500/30 transition-colors"
                      >
                        {isPlayingThisAudio ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        <span>{noteItem.audioDurationFormatted || 'Audio memo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 px-6 text-center bg-[#140b07] border border-white/5 rounded-3xl space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-serif-display text-white">
              {searchQuery ? 'No matching notes found' : 'Your Conference Notebook is Ready'}
            </h3>
            <p className="text-xs text-[#e4beb1]/80 max-w-md mx-auto leading-relaxed">
              Capture keynote insights, brainstorm ideas, organize follow-up tasks, or let Gemini prepare strategic questions for any speaker.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
            <button
              onClick={() => handleOpenNewNote({ category: 'Keynote', title: 'Opening Keynote Notes' })}
              className="p-3 bg-[#1e100a] hover:bg-[#2e160c] border border-white/10 rounded-2xl transition-colors flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#fadcd2]">Keynote Reflection</p>
                <p className="text-[10px] text-[#e4beb1]/60">Template with AI takeaway</p>
              </div>
            </button>

            <button
              onClick={() => setIsQuestionGenOpen(true)}
              className="p-3 bg-[#1e100a] hover:bg-[#2e160c] border border-white/10 rounded-2xl transition-colors flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#fadcd2]">Speaker Q&A Prep</p>
                <p className="text-[10px] text-[#e4beb1]/60">Generate sharp questions</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        note={editingNote}
        onSaveNote={onSaveNote}
        onDeleteNote={onDeleteNote}
        connections={connections}
        sessions={sessions}
        activeEvent={activeEvent}
      />

      {/* Speaker Question Generator Modal */}
      <SpeakerQuestionGeneratorModal
        isOpen={isQuestionGenOpen}
        onClose={() => setIsQuestionGenOpen(false)}
        connections={connections}
        sessions={sessions}
        onSaveAsNote={(noteDraft) => {
          handleOpenNewNote(noteDraft);
          setIsQuestionGenOpen(false);
        }}
      />

      {/* Voice Memo Modal with Convert-to-Note support */}
      <VoiceMemoModal
        isOpen={isVoiceMemoOpen}
        connections={connections}
        onClose={() => setIsVoiceMemoOpen(false)}
        onSaveVoiceMoment={onSaveVoiceMoment}
        onConvertToNote={(noteData) => {
          handleOpenNewNote({
            title: noteData.title,
            content: noteData.transcript,
            location: noteData.location,
            audioDataUrl: noteData.audioDataUrl,
            audioDurationFormatted: noteData.durationFormatted,
            category: 'Talk',
            tags: ['Voice Capture', 'Spoken Reflection'],
          });
        }}
      />
    </div>
  );
};
