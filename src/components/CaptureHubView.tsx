import React, { useState, useRef, useEffect } from 'react';
import { Moment, Idea, Connection } from '../types';
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
  Radio
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface CaptureHubViewProps {
  moments: Moment[];
  ideas: Idea[];
  connections: Connection[];
  onAddMoment: (moment: Moment) => void;
  onAddIdea: (idea: Idea) => void;
  onSelectMoment?: (moment: Moment) => void;
}

export const CaptureHubView: React.FC<CaptureHubViewProps> = ({
  moments,
  ideas,
  connections,
  onAddMoment,
  onAddIdea,
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
      location: noteLocation,
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

    const newIdea: Idea = {
      id: `i_${Date.now()}`,
      quote: ideaQuote.trim(),
      takeaway: ideaTakeaway.trim(),
      speakerName: ideaSpeaker.trim() || 'TEDx Speaker',
      speakerRole: 'Presenter',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      sessionTitle: ideaSession.trim() || 'Main Session',
      stageName: 'Main Stage',
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: ideaCategory,
      tags: ['#TEDxAkure', `#${ideaCategory.replace(/\s+/g, '')}`],
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
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
          Multimodal Memory
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
          Capture Hub
        </h1>
        <p className="text-xs text-[#e4beb1]/70 mt-1">
          Collect photographs, video reflections, Web Speech voice memos, and rapid insights with zero latency.
        </p>
      </div>

      {/* Bento Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Photo Card */}
        <div
          onClick={handleOpenPhotoCamera}
          className="bg-[#180b06] hover:bg-[#26130b] border border-white/10 hover:border-[#FF5C00]/50 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fadcd2]">Photo Snap</h3>
            <p className="text-[10px] text-[#e4beb1]/60 mt-0.5">Live camera snapshot</p>
          </div>
        </div>

        {/* Video Card */}
        <div
          onClick={handleOpenVideoCamera}
          className="bg-[#180b06] hover:bg-[#26130b] border border-white/10 hover:border-[#FF5C00]/50 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fadcd2]">Short Video</h3>
            <p className="text-[10px] text-[#e4beb1]/60 mt-0.5">Record talk snippet</p>
          </div>
        </div>

        {/* Voice Memo Card (Web Speech API) */}
        <div
          onClick={() => setIsVoiceMemoOpen(true)}
          className="bg-[#1e0e07] hover:bg-[#2c150c] border border-[#FF5C00]/30 hover:border-[#FF5C00] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group relative overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00] text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-bold border border-[#FF5C00]/30">
              SPEECH API
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fadcd2] flex items-center gap-1">
              <span>Voice Memo</span>
              <Sparkles className="w-3 h-3 text-[#FF5C00]" />
            </h3>
            <p className="text-[10px] text-[#e4beb1]/70 mt-0.5">Auto-transcribe speech</p>
          </div>
        </div>

        {/* Talk Quote Card */}
        <div
          onClick={() => setIsAddingIdeaModal(true)}
          className="bg-[#180b06] hover:bg-[#26130b] border border-white/10 hover:border-[#FF5C00]/50 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fadcd2]">Talk Insight</h3>
            <p className="text-[10px] text-[#e4beb1]/60 mt-0.5">Speaker quote & thesis</p>
          </div>
        </div>

        {/* Rapid Note Card */}
        <div
          onClick={() => setIsAddingNote(true)}
          className="bg-[#180b06] hover:bg-[#26130b] border border-white/10 hover:border-[#FF5C00]/50 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-36 group col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fadcd2]">Field Note</h3>
            <p className="text-[10px] text-[#e4beb1]/60 mt-0.5">Thoughts & impressions</p>
          </div>
        </div>
      </div>

      {/* Featured Insight Card */}
      {featuredIdea && (
        <div className="bg-[#1e100a] border border-[#FF5C00]/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00] text-black font-bold uppercase tracking-wider">
              Featured Insight
            </span>
            <span className="text-xs text-[#e4beb1]/70">• {featuredIdea.sessionTitle}</span>
          </div>

          <blockquote className="text-base sm:text-lg font-serif-display italic text-[#fadcd2] leading-relaxed">
            "{featuredIdea.quote}"
          </blockquote>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <img
                src={featuredIdea.speakerAvatar}
                alt={featuredIdea.speakerName}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
              <span className="text-xs font-semibold text-[#fadcd2]">
                {featuredIdea.speakerName}
              </span>
            </div>
            <span className="text-[11px] text-[#FF5C00] font-semibold">
              {featuredIdea.category}
            </span>
          </div>
        </div>
      )}

      {/* Recent Captures Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-2">
            <History className="w-4 h-4 text-[#FF5C00]" />
            Recent Captures ({moments.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {moments.map((m) => (
            <div
              key={m.id}
              className="bg-[#140b07] border border-white/10 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between"
            >
              {m.type === 'voice' ? (
                /* Voice Memo Card Display */
                <div className="bg-[#1c0e08] p-4 border-b border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-bold border border-[#FF5C00]/30 flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      VOICE MEMO
                    </span>
                    {m.audioDuration && (
                      <span className="text-[11px] font-mono text-[#e4beb1]/70 font-semibold">
                        {m.audioDuration}
                      </span>
                    )}
                  </div>

                  {/* Audio player button */}
                  {m.mediaUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-[#0e0603] rounded-xl border border-white/5">
                      <button
                        onClick={() => handleTogglePlayAudio(m)}
                        className="w-9 h-9 rounded-lg bg-[#FF5C00] text-black flex items-center justify-center hover:bg-[#ff7a33] transition-transform active:scale-95 shrink-0"
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
                                  ? 'bg-[#FF5C00] animate-pulse'
                                  : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-[#e4beb1]/60 truncate mt-0.5">
                          {playingMomentId === m.id ? 'Playing audio stream...' : 'Tap to play audio'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Transcribed text */}
                  {m.caption && (
                    <div className="p-2.5 bg-[#25130b] rounded-xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-[#FF5C00] tracking-wider mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Transcript:
                      </p>
                      <p className="text-xs text-[#fadcd2] italic line-clamp-3 leading-relaxed">
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
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-[#FF5C00] border border-white/10">
                    {m.type.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="h-32 bg-[#20100a] p-4 flex flex-col justify-between border-b border-white/5">
                  <span className="text-xs text-[#FF5C00] font-bold">NOTE</span>
                  <p className="text-xs text-[#fadcd2] italic line-clamp-3">"{m.caption}"</p>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#e4beb1]/60 mb-1">
                    <span>{m.location}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#fadcd2]">{m.title}</h3>
                  {m.type !== 'voice' && m.caption && m.mediaUrl && (
                    <p className="text-xs text-[#e4beb1]/80 mt-1 line-clamp-2 leading-relaxed">
                      {m.caption}
                    </p>
                  )}
                </div>

                {m.taggedPeopleNames && m.taggedPeopleNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-white/5">
                    {m.taggedPeopleNames.map((name, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#28130a] text-[#ffb59a]"
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
            className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
                Save {pendingMedia.type === 'photo' ? 'Photo' : 'Video'} Moment
              </h2>
              <button
                onClick={() => setPendingMedia(null)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
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
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                  Caption / Story
                </label>
                <textarea
                  rows={2}
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="What made this moment memorable?"
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                  Tag People Present
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#0d0603] rounded-xl border border-white/10">
                  {connections.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleTagPerson(c.id)}
                      className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                        taggedPeople.includes(c.id)
                          ? 'bg-[#FF5C00] text-black font-bold'
                          : 'bg-[#1e100a] text-[#e4beb1]/70 hover:text-white'
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
                  className="w-1/3 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#fadcd2] disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSavingMedia}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center justify-center gap-2 disabled:opacity-50"
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
            className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
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
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Headline</label>
                <input
                  type="text"
                  placeholder="e.g. UX Workshop Note"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#e4beb1]">
                    Thought / Note *
                  </label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleNoteDictation}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        isDictatingNote
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20'
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
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Location</label>
                <input
                  type="text"
                  value={noteLocation}
                  onChange={(e) => setNoteLocation(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
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
                  className="w-1/3 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#fadcd2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33]"
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
            className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
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
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#e4beb1]">
                    Key Quote or Core Idea *
                  </label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleIdeaDictation}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        isDictatingIdea
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20'
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
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Speaker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Amina Yusuf"
                  value={ideaSpeaker}
                  onChange={(e) => setIdeaSpeaker(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Session</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Stage"
                    value={ideaSession}
                    onChange={(e) => setIdeaSession(e.target.value)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Category</label>
                  <select
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value as any)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
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
                  className="w-1/3 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#fadcd2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33]"
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
