import React, { useState, useMemo } from 'react';
import { Connection, RelationshipType } from '../types';

interface PeopleViewProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickConnect: () => void;
  onOpenQuickMessage: (connection: Connection) => void;
  targetCount: number;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  connections,
  onSelectConnection,
  onOpenQuickConnect,
  onOpenQuickMessage,
  targetCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | RelationshipType | 'high-priority'>('all');

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'high-priority') return c.priority === 'high';
      return c.relationship === selectedFilter;
    });
  }, [connections, searchQuery, selectedFilter]);

  // Alphabetical grouping
  const groupedConnections = useMemo(() => {
    const sorted = [...filteredConnections].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, Connection[]> = {};

    sorted.forEach((c) => {
      const firstLetter = c.name.charAt(0).toUpperCase() || '#';
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(c);
    });

    return groups;
  }, [filteredConnections]);

  const relationshipBadges: Record<string, { label: string; class: string }> = {
    lead: { label: 'Lead', class: 'bg-[#FF5C00]/20 text-[#ffb59a] border-[#FF5C00]/40' },
    peer: { label: 'Peer', class: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    mentor: { label: 'Mentor', class: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    speaker: { label: 'Speaker', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-28 md:pb-12 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
            Network Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Connections ({connections.length}/{targetCount})
          </h1>
        </div>

        <button
          onClick={onOpenQuickConnect}
          className="px-4 py-2 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base font-bold">person_add</span>
          <span className="hidden sm:inline">Add Connection</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#e4beb1]/50 text-xl">
          search
        </span>
        <input
          type="text"
          placeholder="Search by name, company, role, or discussion tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#140b07] border border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-xs sm:text-sm text-[#fadcd2] placeholder:text-[#e4beb1]/40 focus:outline-none focus:border-[#FF5C00] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-white/50 hover:text-white p-0.5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All Contacts' },
          { id: 'lead', label: 'Leads' },
          { id: 'peer', label: 'Peers' },
          { id: 'mentor', label: 'Mentors' },
          { id: 'speaker', label: 'Speakers' },
          { id: 'high-priority', label: '★ High Priority' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === f.id
                ? 'bg-[#FF5C00] text-black shadow-md'
                : 'bg-[#180b06] text-[#e4beb1]/80 hover:text-white border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List / Grouped Directory */}
      {Object.keys(groupedConnections).length === 0 ? (
        <div className="text-center py-16 bg-[#140b07] rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 text-[#e4beb1]/50 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">search_off</span>
          </div>
          <p className="text-sm font-semibold text-[#fadcd2]">No connections found</p>
          <p className="text-xs text-[#e4beb1]/60 max-w-xs mx-auto">
            Try adjusting your search keywords or filter category.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedConnections) as [string, Connection[]][]).map(([letter, group]) => (
            <div key={letter} className="space-y-2">
              {/* Group Letter Header */}
              <div className="sticky top-16 md:top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md py-1 border-b border-white/10">
                <span className="text-xs font-extrabold text-[#FF5C00] font-serif-display">
                  {letter}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {group.map((c) => {
                  const badge = relationshipBadges[c.relationship] || relationshipBadges.lead;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectConnection(c)}
                      className="bg-[#140b07] hover:bg-[#20110a] border border-white/10 hover:border-[#FF5C00]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 relative">
                          <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                          {c.priority === 'high' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#FF5C00] rounded-full border border-black" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#fadcd2] truncate">{c.name}</h3>
                            <span
                              className={`text-[9px] px-2 py-0.2 rounded-full border font-bold uppercase tracking-wider ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#FF5C00] truncate">
                            {c.profession} • {c.company}
                          </p>
                          {c.notes && (
                            <p className="text-[11px] text-[#e4beb1]/60 truncate max-w-xs mt-0.5">
                              {c.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Trigger Buttons */}
                      <div
                        className="flex items-center gap-1 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.whatsapp || c.phone ? (
                          <a
                            href={`https://wa.me/${(c.whatsapp || c.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#25D366] border border-white/5"
                            title="Chat on WhatsApp"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                          </a>
                        ) : null}

                        <button
                          onClick={() => onOpenQuickMessage(c)}
                          className="p-2 rounded-xl bg-[#FF5C00] text-black font-bold hover:bg-[#ff7a33] shadow-md"
                          title="Generate AI Follow-up Draft"
                        >
                          <span className="material-symbols-outlined text-base font-bold">
                            auto_awesome
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={onOpenQuickConnect}
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#FF5C00] text-black flex items-center justify-center shadow-2xl z-30 active:scale-95 transition-transform"
        title="Quick Connect (10s)"
      >
        <span className="material-symbols-outlined text-2xl font-bold">bolt</span>
      </button>
    </div>
  );
};
