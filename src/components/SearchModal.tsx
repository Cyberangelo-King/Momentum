import React, { useState, useMemo } from 'react';
import { Connection, Moment, Idea } from '../types';
import { Search, X, Video, Camera } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  onSelectConnection: (c: Connection) => void;
  onSelectMoment: (m: Moment) => void;
  onSelectIdea: (i: Idea) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  connections,
  moments,
  ideas,
  onSelectConnection,
  onSelectMoment,
  onSelectIdea,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { connections: [], moments: [], ideas: [] };
    const q = query.toLowerCase();

    return {
      connections: connections.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.profession.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      ),
      moments: moments.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.caption.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      ),
      ideas: ideas.filter(
        (i) =>
          i.quote.toLowerCase().includes(q) ||
          i.speakerName.toLowerCase().includes(q) ||
          i.sessionTitle.toLowerCase().includes(q) ||
          (i.takeaway && i.takeaway.toLowerCase().includes(q))
      ),
    };
  }, [query, connections, moments, ideas]);

  if (!isOpen) return null;

  const totalResults =
    results.connections.length + results.moments.length + results.ideas.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md p-4 pt-16 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#1e100a]">
          <Search className="w-5 h-5 text-[#FF5C00]" />
          <input
            type="text"
            autoFocus
            placeholder="Search people, notes, moments, ideas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#fadcd2] focus:outline-none placeholder:text-[#e4beb1]/40"
          />
          <button onClick={onClose} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results area */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-[#e4beb1]/50 space-y-2">
              <Search className="w-8 h-8 text-white/20 mx-auto" />
              <p>Type to search your entire TEDxAkure memory OS</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-xs text-[#e4beb1]/50 space-y-2">
              <p>No results matching "{query}"</p>
            </div>
          ) : (
            <>
              {/* Connections Section */}
              {results.connections.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider">
                    People ({results.connections.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.connections.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onClose();
                          onSelectConnection(c);
                        }}
                        className="p-2.5 rounded-xl bg-[#20100a] hover:bg-[#2f170e] flex items-center justify-between cursor-pointer border border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#fadcd2]">{c.name}</p>
                            <p className="text-[10px] text-[#e4beb1]/60">{c.company}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#FF5C00] font-semibold">{c.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Talk Insights Section */}
              {results.ideas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider">
                    Talk Insights ({results.ideas.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.ideas.map((idea) => (
                      <div
                        key={idea.id}
                        onClick={() => {
                          onClose();
                          onSelectIdea(idea);
                        }}
                        className="p-2.5 rounded-xl bg-[#20100a] hover:bg-[#2f170e] cursor-pointer border border-white/5"
                      >
                        <p className="text-xs text-[#fadcd2] italic line-clamp-1">"{idea.quote}"</p>
                        <p className="text-[10px] text-[#FF5C00] font-semibold mt-0.5">
                          — {idea.speakerName} ({idea.sessionTitle})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moments Section */}
              {results.moments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider">
                    Moments ({results.moments.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.moments.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onClose();
                          onSelectMoment(m);
                        }}
                        className="p-2.5 rounded-xl bg-[#20100a] hover:bg-[#2f170e] flex items-center justify-between cursor-pointer border border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          {m.type === 'video' ? (
                            <Video className="w-4 h-4 text-[#FF5C00]" />
                          ) : (
                            <Camera className="w-4 h-4 text-[#FF5C00]" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-[#fadcd2]">{m.title}</p>
                            <p className="text-[10px] text-[#e4beb1]/60">{m.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#e4beb1]/50">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
