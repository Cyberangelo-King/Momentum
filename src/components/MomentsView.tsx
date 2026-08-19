import React, { useState, useMemo } from 'react';
import { Moment, Connection } from '../types';

interface MomentsViewProps {
  moments: Moment[];
  connections: Connection[];
  onOpenCapture: () => void;
  onSelectConnection: (connection: Connection) => void;
  onAddMoment: (moment: Moment) => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  moments,
  connections,
  onOpenCapture,
  onSelectConnection,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video' | 'note'>('all');
  const [activeLightbox, setActiveLightbox] = useState<Moment | null>(null);

  const filteredMoments = useMemo(() => {
    if (filterType === 'all') return moments;
    return moments.filter((m) => m.type === filterType);
  }, [moments, filterType]);

  const findConnectionById = (id: string) => connections.find((c) => c.id === id);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          className="px-4 py-2 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base font-bold">add_a_photo</span>
          <span className="hidden sm:inline">New Moment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: `All Moments (${moments.length})` },
          { id: 'photo', label: `Photos (${moments.filter((m) => m.type === 'photo').length})` },
          { id: 'video', label: `Videos (${moments.filter((m) => m.type === 'video').length})` },
          { id: 'note', label: `Notes (${moments.filter((m) => m.type === 'note').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-[#FF5C00] text-black shadow-md'
                : 'bg-[#180b06] text-[#e4beb1]/80 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#FF5C00]/30">
        {filteredMoments.map((moment) => (
          <div key={moment.id} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#180b06] border-2 border-[#FF5C00] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]"></div>
            </div>

            {/* Moment Card */}
            <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl overflow-hidden transition-all shadow-lg">
              {/* Media preview */}
              {moment.mediaUrl && (
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
                      className="w-full h-full object-cover max-h-80 group-hover/media:scale-102 transition-transform duration-300"
                    />
                  )}

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#FF5C00] border border-white/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      {moment.type === 'video' ? 'videocam' : 'photo_camera'}
                    </span>
                    {moment.type.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Text content */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FF5C00] font-bold tracking-wide">
                    {moment.timestamp} • {moment.location}
                  </span>
                  <span className="text-[#e4beb1]/50">{moment.date}</span>
                </div>

                <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
                  {moment.title}
                </h3>

                {moment.caption && (
                  <p className="text-xs text-[#e4beb1]/85 leading-relaxed">
                    {moment.caption}
                  </p>
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
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#271812] hover:bg-[#381a0e] text-[#ffb59a] text-[11px] font-semibold border border-white/5 transition-colors"
                        >
                          <img
                            src={person.avatarUrl}
                            alt={person.name}
                            className="w-3.5 h-3.5 rounded-full object-cover"
                          />
                          <span>{person.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            {activeLightbox.type === 'video' ? (
              <video
                src={activeLightbox.mediaUrl}
                controls
                autoPlay
                className="max-h-[75vh] w-auto rounded-2xl shadow-2xl border border-white/10"
              />
            ) : (
              <img
                src={activeLightbox.mediaUrl}
                alt={activeLightbox.title}
                className="max-h-[75vh] w-auto rounded-2xl shadow-2xl border border-white/10 object-contain"
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
    </div>
  );
};
