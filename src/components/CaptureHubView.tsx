import React, { useState, useRef, useEffect } from 'react';
import { Moment, Idea, Connection, Note, EventConfig } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { VoiceMemoModal } from './VoiceMemoModal';
import { uploadAndCompressMedia } from '../services/imageCompression';
import { 
  SpeechTranscriber, 
  isSpeechRecognitionSupported 
} from '../services/speechService';
import { 
  Camera, 
  Video, 
  Lightbulb, 
  PenLine, 
  History, 
  X, 
  Clock, 
  Sparkles, 
  Tag, 
  User, 
  Mic, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Radio,
  FileText,
  Globe
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface CaptureHubViewProps {
  moments: Moment[];
  ideas: Idea[];
  connections: Connection[];
  activeEvent?: EventConfig;
  onAddMoment: (moment: Moment) => void;
  onAddIdea: (idea: Idea) => void;
  onAddNote?: (note: Note) => void;
  onSelectMoment?: (moment: Moment) => void;
}

export const CaptureHubView: React.FC<CaptureHubViewProps> = ({
  moments,
  ideas,
  connections,
  activeEvent,
  onAddMoment,
  onAddIdea,
  onAddNote,
}) => {
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | 'both'>('photo');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVoiceMemoOpen, setIsVoiceMemoOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingIdeaModal, setIsAddingIdeaModal] = useState(false);
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  // Playing audio state for recent captures
  const [playingMomentId, setPlayingMomentId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // New Note state + Speech dictation
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteLocation, setNoteLocation] = useState('Main Concourse');
  const [isDictatingNote, setIsDictatingNote] = useState(false);
  const noteTranscriberRef = useRef<SpeechTranscriber | null>(null);

  // New Idea state + Speech dictation
  const [ideaQuote, setIdeaQuote] = useState('');
  const [ideaTakeaway, setIdeaTakeaway] = useState('');
  const [ideaSpeaker, setIdeaSpeaker] = useState('');
  const [ideaSession, setIdeaSession] = useState('Keynote Hall');
  const [ideaCategory, setIdeaCategory] = useState<'Keynote' | 'Workshop' | 'Fireside Chat' | 'Design & UX' | 'Technology' | 'Leadership'>('Keynote');
  const [isDictatingIdea, setIsDictatingIdea] = useState(false);
  const ideaTranscriberRef = useRef<SpeechTranscriber | null>(null);

  // Photo / Video capture details modal
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaLocation, setMediaLocation] = useState('Main Auditorium');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);

  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (noteTranscriberRef.current) {
        noteTranscriberRef.current.abort();
      }
      if (ideaTranscriberRef.current) {
        ideaTranscriberRef.current.abort();
      }
    };
  }, []);

  const handleOpenPhotoCamera = () => {
    setCameraMode('photo');
    setIsCameraOpen(true);
  };

  const handleOpenVideoCamera = () => {
    setCameraMode('video');
    setIsCameraOpen(true);
  };

  const handleMediaCaptured = (url: string, type: 'photo' | 'video') => {
    setPendingMedia({ url, type });
    setMediaTitle(type === 'photo' ? 'Conference Snapshot' : 'Live Video Moment');
    setMediaCaption('');
  };

  const handleSaveMediaMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMedia) return;

    setIsSavingMedia(true);
    let finalMediaUrl = pendingMedia.url;
    let finalThumbUrl = pendingMedia.url;

    if (pendingMedia.type === 'photo') {
      try {
        const uploadResult = await uploadAndCompressMedia(pendingMedia.url, 'moments', 'tedx_moments');
        if (uploadResult?.url) {
          finalMediaUrl = uploadResult.url;
          finalThumbUrl = uploadResult.url;
        }
      } catch (err) {
        console.warn('Media upload fallback to dataUrl:', err);
      }
    }

    const newMoment: Moment = {
      id: `m_${Date.now()}`,
      type: pendingMedia.type,
      title: mediaTitle.trim() || 'TEDx Moment',
      caption: mediaCaption.trim() || 'Captured at TEDxAkure 2026',
      mediaUrl: finalMediaUrl,
      thumbnailUrl: finalThumbUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      taggedPeopleIds: taggedPeople,
      taggedPeopleNames: connections.filter((c) => taggedPeople.includes(c.id)).map((c) => c.name),
      location: mediaLocation,
    };

    onAddMoment(newMoment);
    setIsSavingMedia(false);
    setPendingMedia(null);
    setTaggedPeople([]);
  };

  const handleSaveVoiceMoment = (data: {
    title: string;
    transcript: string;
    audioDataUrl: string;
    durationFormatted: string;
    location: string;
    taggedPeopleIds: string[];
  }) => {
    const newMoment: Moment = {
      id: `m_${Date.now()}`,
      type: 'voice',
      title: data.title,
      caption: data.transcript,
      mediaUrl: data.audioDataUrl,
      audioDuration: data.durationFormatted,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      taggedPeopleIds: data.taggedPeopleIds,
      taggedPeopleNames: connections
        .filter((c) => data.taggedPeopleIds.includes(c.id))
        .map((c) => c.name),
      location: data.location,
    };

    onAddMoment(newMoment);
  };

  const handleTogglePlayAudio = (moment: Moment) => {
    if (playingMomentId === moment.id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingMomentId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(moment.mediaUrl);
      audio.onended = () => setPlayingMomentId(null);
      audio.play().catch((err) => console.warn('Audio playback error:', err));
      activeAudioRef.current = audio;
      setPlayingMomentId(moment.id);
    }
  };

  // Live Speech Dictation for Field Notes
  const toggleNoteDictation = () => {
    if (isDictatingNote) {
      if (noteTranscriberRef.current) {
        noteTranscriberRef.current.stop();
        noteTranscriberRef.current = null;
      }
      setIsDictatingNote(false);
      triggerHaptic('light');
    } else {
      if (!speechSupported) return;
      triggerHaptic('medium');
      const transcriber = new SpeechTranscriber({
        onTranscript: (text) => {
          setNoteContent((prev) => {
            return text;
          });
        },
        onEnd: () => {
          setIsDictatingNote(false);
        },
      });
      if (noteContent) {
        transcriber.setInitialText(noteContent);
      }
      transcriber.start();
      noteTranscriberRef.current = transcriber;
      setIsDictatingNote(true);
    }
  };

  // Live Speech Dictation for Talk Insights
  const toggleIdeaDictation = () => {
    if (isDictatingIdea) {
      if (ideaTranscriberRef.current) {
        ideaTranscriberRef.current.stop();
        ideaTranscriberRef.current = null;
      }
      setIsDictatingIdea(false);
      triggerHaptic('light');
    } else {
      if (!speechSupported) return;
      triggerHaptic('medium');
      const transcriber = new SpeechTranscriber({
        onTranscript: (text) => {
          setIdeaQuote(text);
        },
        onEnd: () => {
          setIsDictatingIdea(false);
        },
      });
      if (ideaQuote) {
        transcriber.setInitialText(ideaQuote);
      }
      transcriber.start();
      ideaTranscriberRef.current = transcriber;
      setIsDictatingIdea(true);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    if (noteTranscriberRef.current) {
      noteTranscriberRef.current.stop();
      noteTranscriberRef.current = null;
      setIsDictatingNote(false);
    }

    const newMoment: Moment = {
      id: `m_${Date.now()}`,
      type: 'note',
      title: noteTitle.trim() || 'Field Note',
      caption: noteContent.trim(),
      mediaUrl: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      taggedPeopleIds: [],
      location: noteLocation || activeEvent?.location || 'Main Hall',
      eventId: activeEvent?.id,
    };

    onAddMoment(newMoment);
    setNoteTitle('');
    setNoteContent('');
    setIsAddingNote(false);
  };

  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaQuote.trim()) return;

    if (ideaTranscriberRef.current) {
      ideaTranscriberRef.current.stop();
      ideaTranscriberRef.current = null;
      setIsDictatingIdea(false);
    }

    const eventTag = activeEvent?.hashtag || '#EventOS';

    const newIdea: Idea = {
      id: `i_${Date.now()}`,
      quote: ideaQuote.trim(),
      takeaway: ideaTakeaway.trim(),
      speakerName: ideaSpeaker.trim() || 'Keynote Speaker',
      speakerRole: 'Presenter',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      sessionTitle: ideaSession.trim() || activeEvent?.sessions?.[0]?.title || 'Main Session',
      stageName: activeEvent?.stages?.[0] || 'Main Stage',
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: ideaCategory,
      tags: [eventTag, `#${ideaCategory.replace(/\s+/g, '')}`],
      eventId: activeEvent?.id,
    };

    onAddIdea(newIdea);
    setIdeaQuote('');
    setIdeaTakeaway('');
    setIdeaSpeaker('');
    setIsAddingIdeaModal(false);
  };

  const toggleTagPerson = (id: string) => {
    if (taggedPeople.includes(id)) {
      setTaggedPeople(taggedPeople.filter((p) => p !== id));
    } else {
      setTaggedPeople([...taggedPeople, id]);
    }
  };

  const featuredIdea = ideas[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-12 text-[var(--text-primary)]">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase">
          Multimodal Memory
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
          Capture Hub
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Collect photographs, video reflections, Web Speech voice memos, and rapid insights with zero latency.
        </p>
      </div>

      {/* Bento Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Photo Card */}
        <div
          onClick={handleOpenPhotoCamera}
          className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Photo Snap</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Live camera snapshot</p>
          </div>
        </div>

        {/* Video Card */}
        <div
          onClick={handleOpenVideoCamera}
          className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Short Video</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Record talk snippet</p>
          </div>
        </div>

        {/* Voice Memo Card (Web Speech API) */}
        <div
          onClick={() => setIsVoiceMemoOpen(true)}
          className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group relative overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold border border-[var(--border-accent)] font-mono">
              SPEECH API
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1">
              <span>Voice Memo</span>
              <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Auto-transcribe speech</p>
          </div>
        </div>

        {/* Talk Quote Card */}
        <div
          onClick={() => setIsAddingIdeaModal(true)}
          className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Talk Insight</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Speaker quote & thesis</p>
          </div>
        </div>

        {/* Rapid Note Card */}
        <div
          onClick={() => setIsAddingNote(true)}
          className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group col-span-2 sm:col-span-1 shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Field Note</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Thoughts & impressions</p>
          </div>
        </div>
      </div>

      {/* Featured Insight Card */}
      {featuredIdea && (
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-accent)] rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-black font-bold uppercase tracking-wider font-mono">
              Featured Insight
            </span>
            <span className="text-xs text-[var(--text-secondary)]">• {featuredIdea.sessionTitle}</span>
          </div>

          <blockquote className="text-base sm:text-lg font-serif-display italic text-white leading-relaxed">
            "{featuredIdea.quote}"
          </blockquote>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <img
                src={featuredIdea.speakerAvatar}
                alt={featuredIdea.speakerName}
                className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)]"
              />
              <span className="text-xs font-semibold text-white">
                {featuredIdea.speakerName}
              </span>
            </div>
            <span className="text-[11px] text-[var(--accent-primary)] font-semibold font-mono">
              {featuredIdea.category}
            </span>
          </div>
        </div>
      )}

      {/* Recent Captures Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-[var(--accent-primary)]" />
            Recent Captures ({moments.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {moments.map((m) => (
            <div
              key={m.id}
              className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-md flex flex-col justify-between"
            >
              {m.type === 'voice' ? (
                /* Voice Memo Card Display */
                <div className="bg-[var(--bg-surface-subtle)] p-4 border-b border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-[10px] font-bold border border-[var(--border-accent)] flex items-center gap-1 font-mono">
                      <Mic className="w-3 h-3" />
                      VOICE MEMO
                    </span>
                    {m.audioDuration && (
                      <span className="text-[11px] font-mono text-[var(--text-secondary)] font-semibold">
                        {m.audioDuration}
                      </span>
                    )}
                  </div>

                  {/* Audio player button */}
                  {m.mediaUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-black/40 rounded-xl border border-[var(--border-subtle)]">
                      <button
                        onClick={() => handleTogglePlayAudio(m)}
                        className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] text-black flex items-center justify-center hover:brightness-110 transition-transform active:scale-95 shrink-0"
                        aria-label={playingMomentId === m.id ? 'Pause memo' : 'Play voice memo'}
                      >
                        {playingMomentId === m.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1 h-5">
                          {[6, 12, 18, 14, 8, 16, 20, 12, 6, 14, 18, 10, 6].map((h, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${h}px` }}
                              className={`w-1 rounded-full ${
                                playingMomentId === m.id
                                  ? 'bg-[var(--accent-primary)] animate-pulse'
                                  : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                          {playingMomentId === m.id ? 'Playing audio stream...' : 'Tap to play audio'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Transcribed text */}
                  {m.caption && (
                    <div className="p-2.5 bg-white/[0.03] rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[10px] uppercase font-bold text-[var(--accent-primary)] tracking-wider mb-0.5 flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        Transcript:
                      </p>
                      <p className="text-xs text-[var(--text-primary)] italic line-clamp-3 leading-relaxed">
                        "{m.caption}"
                      </p>
                    </div>
                  )}
                </div>
              ) : m.mediaUrl ? (
                <div className="relative h-44 bg-black overflow-hidden group">
                  {m.type === 'video' ? (
                    <video
                      src={m.mediaUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={m.thumbnailUrl}
                    />
                  ) : (
                    <img
                      src={m.mediaUrl}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-[var(--accent-primary)] border border-white/10 font-mono">
                    {m.type.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="h-32 bg-[var(--bg-surface-subtle)] p-4 flex flex-col justify-between border-b border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--accent-primary)] font-bold font-mono">NOTE</span>
                  <p className="text-xs text-[var(--text-primary)] italic line-clamp-3">"{m.caption}"</p>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] mb-1 font-mono">
                    <span>{m.location}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{m.title}</h3>
                  {m.type !== 'voice' && m.caption && m.mediaUrl && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {m.caption}
                    </p>
                  )}
                </div>

                {m.taggedPeopleNames && m.taggedPeopleNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-[var(--border-subtle)]">
                    {m.taggedPeopleNames.map((name, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] border border-[var(--border-subtle)] font-mono"
                      >
                        @{name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Memo Modal */}
      <VoiceMemoModal
        isOpen={isVoiceMemoOpen}
        connections={connections}
        onClose={() => setIsVoiceMemoOpen(false)}
        onSaveVoiceMoment={handleSaveVoiceMoment}
        onConvertToNote={(noteData) => {
          if (onAddNote) {
            const newNote: Note = {
              id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              title: noteData.title || 'Spoken Field Reflection',
              content: noteData.transcript || '',
              category: 'Talk',
              location: noteData.location || 'Capture Hub',
              keyTakeaways: [],
              actionItems: [],
              generatedQuestions: [],
              audioDataUrl: noteData.audioDataUrl,
              audioDurationFormatted: noteData.durationFormatted,
              tags: ['Voice Memo', 'Spoken Reflection'],
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            onAddNote(newNote);
          }
        }}
      />

      {/* Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={(url) => {
          setIsCameraOpen(false);
          handleMediaCaptured(url, 'photo');
        }}
        onCaptureVideo={(url) => {
          setIsCameraOpen(false);
          handleMediaCaptured(url, 'video');
        }}
        mode={cameraMode}
      />

      {/* Save Media Details Modal */}
      {pendingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-white">
                Save {pendingMedia.type === 'photo' ? 'Photo' : 'Video'} Moment
              </h2>
              <button
                onClick={() => setPendingMedia(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-40 rounded-xl overflow-hidden bg-black">
              {pendingMedia.type === 'video' ? (
                <video src={pendingMedia.url} controls className="w-full h-full object-cover" />
              ) : (
                <img
                  src={pendingMedia.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <form onSubmit={handleSaveMediaMoment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Caption / Story
                </label>
                <textarea
                  rows={2}
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="What made this moment memorable?"
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Tag People Present
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[var(--bg-surface-subtle)] rounded-xl border border-[var(--border-subtle)]">
                  {connections.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleTagPerson(c.id)}
                      className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                        taggedPeople.includes(c.id)
                          ? 'bg-[var(--accent-primary)] text-black font-bold'
                          : 'bg-white/5 text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingMedia(null)}
                  disabled={isSavingMedia}
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSavingMedia}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isSavingMedia ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Optimizing & Saving...</span>
                    </>
                  ) : (
                    <span>Save to Moments</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Field Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-white">
                Log Field Note
              </h2>
              <button
                onClick={() => {
                  if (noteTranscriberRef.current) {
                    noteTranscriberRef.current.stop();
                    noteTranscriberRef.current = null;
                  }
                  setIsDictatingNote(false);
                  setIsAddingNote(false);
                }}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Headline</label>
                <input
                  type="text"
                  placeholder="e.g. UX Workshop Note"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Thought / Note *
                  </label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleNoteDictation}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        isDictatingNote
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictatingNote ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="The transition between states is where the UX magic happens..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Location</label>
                <input
                  type="text"
                  value={noteLocation}
                  onChange={(e) => setNoteLocation(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (noteTranscriberRef.current) {
                      noteTranscriberRef.current.stop();
                      noteTranscriberRef.current = null;
                    }
                    setIsDictatingNote(false);
                    setIsAddingNote(false);
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 shadow-md"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Idea Modal */}
      {isAddingIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-white">
                Save Talk Insight
              </h2>
              <button
                onClick={() => {
                  if (ideaTranscriberRef.current) {
                    ideaTranscriberRef.current.stop();
                    ideaTranscriberRef.current = null;
                  }
                  setIsDictatingIdea(false);
                  setIsAddingIdeaModal(false);
                }}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Key Quote or Core Idea *
                  </label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleIdeaDictation}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        isDictatingIdea
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictatingIdea ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Community is the ultimate moat in a world of infinite replication."
                  value={ideaQuote}
                  onChange={(e) => setIdeaQuote(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Speaker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Amina Yusuf"
                  value={ideaSpeaker}
                  onChange={(e) => setIdeaSpeaker(e.target.value)}
                  className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Session</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Stage"
                    value={ideaSession}
                    onChange={(e) => setIdeaSession(e.target.value)}
                    className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <select
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value as any)}
                    className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
                  >
                    <option value="Keynote">Keynote</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Design & UX">Design & UX</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Technology">Technology</option>
                    <option value="Fireside Chat">Fireside Chat</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (ideaTranscriberRef.current) {
                      ideaTranscriberRef.current.stop();
                      ideaTranscriberRef.current = null;
                    }
                    setIsDictatingIdea(false);
                    setIsAddingIdeaModal(false);
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 shadow-md"
                >
                  Save Insight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
