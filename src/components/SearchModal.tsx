import React, { useState, useMemo } from 'react';
import { Connection, Moment, Idea, Note, EventConfig } from '../types';
import { Search, X, Video, Camera, FileText, Lightbulb, Users, Globe, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes?: Note[];
  events?: EventConfig[];
  activeEvent?: EventConfig;
  onSelectConnection: (c: Connection) => void;
  onSelectMoment: (m: Moment) => void;
  onSelectIdea: (i: Idea) => void;
  onSelectNote?: (n: Note) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  connections,
  moments,
  ideas,
  notes = [],
  events = [],
  activeEvent,
  onSelectConnection,
  onSelectMoment,
  onSelectIdea,
  onSelectNote,
}) => {
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [events]);

  const results = useMemo(() => {
    if (!query.trim()) return { connections: [], moments: [], ideas: [], notes: [] };
    const q = query.toLowerCase();

    const filterByEvent = <T extends { eventId?: string }>(items: T[]): T[] => {
      if (searchScope === 'all' || !activeEvent) return items;
      return items.filter((item) => !item.eventId || item.eventId === activeEvent.id);
    };

    return {
      connections: filterByEvent(connections).filter(
        (c) =>
          !c.inTrash &&
          (c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.profession.toLowerCase().includes(q) ||
            (c.notes && c.notes.toLowerCase().includes(q)) ||
            (c.tags && c.tags.some((t) => t.toLowerCase().includes(q))))
      ),
      moments: filterByEvent(moments).filter(
        (m) =>
          !m.inTrash &&
          (m.title.toLowerCase().includes(q) ||
            m.caption.toLowerCase().includes(q) ||
            m.location.toLowerCase().includes(q) ||
            (m.speakerName && m.speakerName.toLowerCase().includes(q)))
      ),
      ideas: filterByEvent(ideas).filter(
        (i) =>
          !i.inTrash &&
          (i.quote.toLowerCase().includes(q) ||
            i.speakerName.toLowerCase().includes(q) ||
            i.sessionTitle.toLowerCase().includes(q) ||
            (i.takeaway && i.takeaway.toLowerCase().includes(q)))
      ),
      notes: filterByEvent(notes).filter(
        (n) =>
          !n.inTrash &&
          (n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            (n.speaker && n.speaker.toLowerCase().includes(q)) ||
            (n.speakerName && n.speakerName.toLowerCase().includes(q)) ||
            (n.tags && n.tags.some((t) => t.toLowerCase().includes(q))))
      ),
    };
  }, [query, searchScope, activeEvent, connections, moments, ideas, notes]);

  if (!isOpen) return null;

  const totalResults =
    results.connections.length + results.moments.length + results.ideas.length + results.notes.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 pt-14 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[82vh] shadow-2xl animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#1e0f08]">
          <Search className="w-5 h-5 text-[#FF5C00] shrink-0" />
          <input
            type="text"
            placeholder={
              searchScope === 'current' && activeEvent
                ? `Search ${activeEvent.name} (people, notes, talks)...`
                : 'Universal search across all events...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="bg-transparent border-none outline-none text-white text-base placeholder-[#e4beb1]/40 w-full font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#e4beb1]/60 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scope Toggle & Results Header */}
        <div className="px-4 py-2 bg-[#0E0E0E] border-b border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setSearchScope('current');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                searchScope === 'current'
                  ? 'bg-[#FF5C00] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeEvent ? activeEvent.name.split(' ')[0] : 'Current Event'}
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setSearchScope('all');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                searchScope === 'all'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3 h-3" />
              All Events ({events.length || 1})
            </button>
          </div>

          <span className="text-[11px] text-neutral-400 font-mono">
            {query.trim() ? `${totalResults} found` : 'Type to search'}
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1 divide-y divide-white/5">
          {!query.trim() && (
            <div className="py-12 text-center text-xs text-[#e4beb1]/50 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-[#FF5C00]/50" />
              <p>Type any keyword, person name, company, takeaway, or hashtag.</p>
            </div>
          )}

          {query.trim() && totalResults === 0 && (
            <div className="py-12 text-center text-xs text-[#e4beb1]/50">
              No results found for "{query}". Try a different name, keyword, or switch to "All Events".
            </div>
          )}

          {/* People / Connections Results */}
          {results.connections.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#FF5C00] tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                People ({results.connections.length})
              </div>
              <div className="space-y-1.5">
                {results.connections.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectConnection(c);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                        {c.avatarUrl || c.photos?.[0] ? (
                          <img src={c.avatarUrl || c.photos?.[0]} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#FF5C00]">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-[#FF5C00] transition-colors">
                          {c.name}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {c.company} • {c.profession}
                        </div>
                      </div>
                    </div>

                    {searchScope === 'all' && c.eventId && (
                      <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                        {eventMap.get(c.eventId) || 'Event'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Notes Results */}
          {results.notes.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Smart Notes ({results.notes.length})
              </div>
              <div className="space-y-1.5">
                {results.notes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (onSelectNote) onSelectNote(n);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-[#3B82F6] transition-colors">
                        {n.title}
                      </div>
                      <div className="text-xs text-neutral-400 line-clamp-1">
                        {n.summary || n.content}
                      </div>
                    </div>

                    {searchScope === 'all' && n.eventId && (
                      <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                        {eventMap.get(n.eventId) || 'Event'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ideas / Insights Results */}
          {results.ideas.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" />
                Talk Insights ({results.ideas.length})
              </div>
              <div className="space-y-1.5">
                {results.ideas.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => {
                      onSelectIdea(i);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div>
                      <div className="text-xs text-white font-medium italic line-clamp-1 group-hover:text-amber-300">
                        "{i.quote}"
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Speaker: {i.speakerName} ({i.sessionTitle})
                      </div>
                    </div>

                    {searchScope === 'all' && i.eventId && (
                      <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                        {eventMap.get(i.eventId) || 'Event'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moments Results */}
          {results.moments.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Camera className="w-3 h-3" />
                Moments ({results.moments.length})
              </div>
              <div className="space-y-1.5">
                {results.moments.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMoment(m);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/60 text-white">
                            <Video className="w-4 h-4" />
                          </div>
                        ) : (
                          <img src={m.mediaUrl || m.thumbnailUrl || ''} alt={m.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-emerald-400">
                          {m.title}
                        </div>
                        <div className="text-xs text-neutral-400 line-clamp-1">{m.caption}</div>
                      </div>
                    </div>

                    {searchScope === 'all' && m.eventId && (
                      <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                        {eventMap.get(m.eventId) || 'Event'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
