import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Moment, Connection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Camera, Video, FileText, MapPin, Calendar, Clock, User, X, Sparkles, Trash2, CheckCircle2, Mic, Play, Pause, Volume2 } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { triggerHaptic } from '../services/haptics';

interface MomentsViewProps {
  moments: Moment[];
  connections: Connection[];
  onOpenCapture: () => void;
  onSelectConnection: (connection: Connection) => void;
  onAddMoment: (moment: Moment) => void;
  onDeleteMoment?: (id: string) => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  moments,
  connections,
  onOpenCapture,
  onSelectConnection,
  onDeleteMoment,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video' | 'note' | 'voice'>('all');
  const [activeLightbox, setActiveLightbox] = useState<Moment | null>(null);
  const [momentToDelete, setMomentToDelete] = useState<Moment | null>(null);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);
  const [playingMomentId, setPlayingMomentId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleAudio = (moment: Moment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingMomentId === moment.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingMomentId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(moment.mediaUrl);
      audio.onended = () => setPlayingMomentId(null);
      audio.play().catch((err) => console.warn('Audio playback error:', err));
      audioRef.current = audio;
      setPlayingMomentId(moment.id);
    }
  };

  const filteredMoments = useMemo(() => {
    if (filterType === 'all') return moments;
    return moments.filter((m) => m.type === filterType);
  }, [moments, filterType]);

  const findConnectionById = (id: string) => connections.find((c) => c.id === id);

  const handleInitiateDelete = (moment: Moment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    setMomentToDelete(moment);
  };

  const handleConfirmDelete = () => {
    if (!momentToDelete) return;
    const title = momentToDelete.title;
    if (onDeleteMoment) {
      onDeleteMoment(momentToDelete.id);
    }
    if (activeLightbox?.id === momentToDelete.id) {
      setActiveLightbox(null);
    }
    if (playingMomentId === momentToDelete.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingMomentId(null);
    }
    setMomentToDelete(null);
    setDeleteSuccessToast(`Memory "${title}" permanently deleted.`);
    setTimeout(() => setDeleteSuccessToast(null), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12"
    >
      {/* Toast feedback */}
      {deleteSuccessToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 bg-[#140b07] border border-rose-500/50 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-[#fadcd2] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
            Chronological Timeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Event Moments ({moments.length})
          </h1>
        </div>

        <button
          onClick={onOpenCapture}
          className="px-4 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Capture Moment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: `All (${moments.length})`, icon: Sparkles },
          { id: 'photo', label: `Photos (${moments.filter((m) => m.type === 'photo').length})`, icon: Camera },
          { id: 'video', label: `Videos (${moments.filter((m) => m.type === 'video').length})`, icon: Video },
          { id: 'voice', label: `Voice Memos (${moments.filter((m) => m.type === 'voice').length})`, icon: Mic },
          { id: 'note', label: `Notes (${moments.filter((m) => m.type === 'note').length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-[#FF5C00] text-black shadow-md'
                  : 'bg-[#180b06] text-[#e4beb1]/80 hover:text-white border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#FF5C00]/30">
        <AnimatePresence mode="popLayout">
          {filteredMoments.map((moment, index) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="relative group"
            >
              {/* Timeline dot */}
              <div className="absolute -left-6 sm:-left-8 top-2 w-4 h-4 rounded-full bg-[#180b06] border-2 border-[#FF5C00] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]"></div>
              </div>

              {/* Moment Card */}
              <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl overflow-hidden transition-all shadow-lg">
                {/* Voice Memo Dedicated Player Block */}
                {moment.type === 'voice' ? (
                  <div className="bg-[#1c0e08] p-4 border-b border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-bold border border-[#FF5C00]/30 flex items-center gap-1.5">
                        <Mic className="w-3 h-3" />
                        <span>VOICE MEMO</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {moment.audioDuration && (
                          <span className="text-[11px] font-mono text-[#e4beb1]/70 font-semibold">
                            {moment.audioDuration}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleInitiateDelete(moment, e)}
                          title="Delete this voice memo"
                          className="p-1.5 text-white/40 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Audio Player */}
                    {moment.mediaUrl && (
                      <div className="flex items-center gap-3 p-3 bg-[#0d0603] rounded-xl border border-white/5">
                        <button
                          onClick={(e) => handleToggleAudio(moment, e)}
                          className="w-10 h-10 rounded-xl bg-[#FF5C00] text-black flex items-center justify-center hover:bg-[#ff7a33] transition-transform active:scale-95 shrink-0 shadow-md"
                          aria-label={playingMomentId === moment.id ? 'Pause memo' : 'Play voice memo'}
                        >
                          {playingMomentId === moment.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-1 h-6">
                            {[8, 14, 22, 16, 10, 18, 24, 16, 8, 18, 22, 12, 8, 16, 20, 14, 8].map(
                              (h, idx) => (
                                <div
                                  key={idx}
                                  style={{ height: `${h}px` }}
                                  className={`w-1 rounded-full transition-all ${
                                    playingMomentId === moment.id
                                      ? 'bg-[#FF5C00] animate-pulse'
                                      : 'bg-white/20'
                                  }`}
                                />
                              )
                            )}
                          </div>
                          <p className="text-[10px] text-[#e4beb1]/60 truncate mt-1 font-mono">
                            {playingMomentId === moment.id
                              ? '▶ Playing audio recording...'
                              : 'Tap to listen to speech recording'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Media preview for Photo/Video */
                  moment.mediaUrl && (
                    <div
                      onClick={() => setActiveLightbox(moment)}
                      className="relative max-h-80 bg-black overflow-hidden cursor-pointer group/media"
                    >
                      {moment.type === 'video' ? (
                        <video
                          src={moment.mediaUrl}
                          controls
                          className="w-full h-full object-cover max-h-80"
                        />
                      ) : (
                        <img
                          src={moment.mediaUrl}
                          alt={moment.title}
                          className="w-full h-full object-cover max-h-80 group-hover/media:scale-105 transition-transform duration-500 ease-out"
                        />
                      )}

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#FF5C00] border border-white/10 flex items-center gap-1.5">
                        {moment.type === 'video' ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                        <span>{moment.type.toUpperCase()}</span>
                      </span>

                      {/* Quick Delete Overlay Button on Media */}
                      <button
                        onClick={(e) => handleInitiateDelete(moment, e)}
                        title="Delete this memory"
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-rose-600/90 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}

                {/* Text content & Speech Transcript */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#FF5C00] font-bold tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3 inline" />
                      {moment.timestamp} • {moment.location}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#e4beb1]/50">{moment.date}</span>
                      {moment.type !== 'voice' && !moment.mediaUrl && (
                        <button
                          onClick={(e) => handleInitiateDelete(moment, e)}
                          title="Delete this field note"
                          className="p-1.5 text-white/40 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
                    {moment.title}
                  </h3>

                  {moment.caption && (
                    <div
                      className={
                        moment.type === 'voice'
                          ? 'p-3 bg-[#1e0f08] border border-white/5 rounded-xl'
                          : ''
                      }
                    >
                      {moment.type === 'voice' && (
                        <span className="text-[10px] uppercase font-bold text-[#FF5C00] tracking-wider mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Speech-to-Text Transcription:</span>
                        </span>
                      )}
                      <p
                        className={`text-xs text-[#e4beb1]/85 leading-relaxed ${
                          moment.type === 'voice' ? 'italic font-serif-body' : ''
                        }`}
                      >
                        {moment.caption}
                      </p>
                    </div>
                  )}

                  {/* Tagged people chips */}
                  {moment.taggedPeopleIds && moment.taggedPeopleIds.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-[#e4beb1]/60 font-semibold uppercase tracking-wider">
                        Tagged:
                      </span>
                      {moment.taggedPeopleIds.map((pid) => {
                        const person = findConnectionById(pid);
                        if (!person) return null;
                        return (
                          <button
                            key={pid}
                            onClick={() => onSelectConnection(person)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#271812] hover:bg-[#381a0e] text-[#ffb59a] text-[11px] font-semibold border border-white/5 transition-colors"
                          >
                            <img
                              src={person.avatarUrl}
                              alt={person.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>{person.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Full-screen Lightbox */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <button
                onClick={(e) => handleInitiateDelete(activeLightbox, e)}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Memory</span>
              </button>
              <button
                onClick={() => setActiveLightbox(null)}
                className="text-white/80 hover:text-white p-2"
                aria-label="Close Lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {activeLightbox.type === 'video' ? (
              <video
                src={activeLightbox.mediaUrl}
                controls
                autoPlay
                className="max-h-[70vh] w-auto rounded-2xl shadow-2xl border border-white/10"
              />
            ) : (
              <img
                src={activeLightbox.mediaUrl}
                alt={activeLightbox.title}
                className="max-h-[70vh] w-auto rounded-2xl shadow-2xl border border-white/10 object-contain"
              />
            )}

            <div className="mt-4 text-center max-w-xl">
              <h3 className="text-lg font-bold font-serif-display text-[#fadcd2]">
                {activeLightbox.title}
              </h3>
              <p className="text-xs text-[#e4beb1]/80 mt-1">{activeLightbox.caption}</p>
              <p className="text-[11px] text-[#FF5C00] font-semibold mt-1">
                {activeLightbox.timestamp} • {activeLightbox.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Accessible Delete Confirmation Modal */}
      {momentToDelete && (
        <DeleteConfirmationModal
          isOpen={!!momentToDelete}
          onClose={() => setMomentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete this memory?"
          itemName={momentToDelete.title}
          itemType="memory"
          description="This will permanently remove the captured moment and its associated media. Any tagged connections will safely remain in your network with this memory unlinked."
          details={[
            { label: 'Type', value: momentToDelete.type.toUpperCase() },
            { label: 'Time & Location', value: `${momentToDelete.timestamp} • ${momentToDelete.location}` },
            {
              label: 'Tagged People',
              value: momentToDelete.taggedPeopleIds?.length
                ? `${momentToDelete.taggedPeopleIds.length} contact(s) unlinked`
                : 'None',
            },
            { label: 'Storage', value: 'Local Cache & Cloud DB' },
          ]}
          warningMessage="This action cannot be undone. The record will be safely pruned from both local and cloud databases."
        />
      )}
    </motion.div>
  );
};


