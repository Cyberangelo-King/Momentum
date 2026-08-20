import React, { useState, useMemo } from 'react';
import { Connection, RelationshipType } from '../types';
import { 
  Search, 
  X, 
  UserPlus, 
  Camera, 
  Sparkles, 
  MessageSquare, 
  Star, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  Layers,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PeopleViewProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickConnect: () => void;
  onOpenQuickMessage: (connection: Connection) => void;
  targetCount: number;
  onClearDemoData?: () => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  connections,
  onSelectConnection,
  onOpenQuickConnect,
  onOpenQuickMessage,
  targetCount,
  onClearDemoData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | RelationshipType | 'high-priority' | 'with-photos' | 'demo'>('all');
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);

  const demoCount = useMemo(() => {
    return connections.filter((c) => c.id.startsWith('c1') || c.id.startsWith('c2') || c.id.startsWith('c3') || c.id.startsWith('c4') || c.id.startsWith('c5') || c.id.startsWith('demo-')).length;
  }, [connections]);

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
      if (selectedFilter === 'with-photos') return (c.photos && c.photos.length > 0);
      if (selectedFilter === 'demo') return c.id.startsWith('c1') || c.id.startsWith('c2') || c.id.startsWith('c3') || c.id.startsWith('c4') || c.id.startsWith('c5') || c.id.startsWith('demo-');
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
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-28 md:pb-12 relative animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase flex items-center gap-1.5">
            Network Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Connections ({connections.length}/{targetCount})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onClearDemoData && demoCount > 0 && (
            <button
              onClick={() => setShowTrashConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-[#281107] hover:bg-[#3d180a] text-[#ffb59a] text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
              title="Remove demo mock contacts"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>Clean Demo Data ({demoCount})</span>
            </button>
          )}

          <button
            onClick={onOpenQuickConnect}
            className="px-4 py-2 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Demo Data */}
      <AnimatePresence>
        {showTrashConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#180b06] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-display text-[#fadcd2]">
                  Remove Demo Data?
                </h3>
                <p className="text-xs text-[#e4beb1]/70 mt-1">
                  This will remove the {demoCount} preloaded demo sample contacts so you can focus entirely on real people you meet at TEDxAkure.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowTrashConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearDemoData?.();
                    setShowTrashConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg"
                >
                  Delete Demo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-[#e4beb1]/50 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, company, role, or discussion tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#140b07] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#fadcd2] placeholder:text-[#e4beb1]/40 focus:outline-none focus:border-[#FF5C00] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-white/50 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All Contacts' },
          { id: 'with-photos', label: '📸 With Photos' },
          { id: 'lead', label: 'Leads' },
          { id: 'peer', label: 'Peers' },
          { id: 'mentor', label: 'Mentors' },
          { id: 'speaker', label: 'Speakers' },
          { id: 'high-priority', label: '★ High Priority' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
        <div className="text-center py-16 bg-[#140b07] rounded-3xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 text-[#e4beb1]/50 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#fadcd2]">No connections found</p>
          <p className="text-xs text-[#e4beb1]/60 max-w-xs mx-auto">
            Try adjusting your search keywords or filter category.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedConnections) as [string, Connection[]][]).map(([letter, group]) => (
            <div key={letter} className="space-y-2.5">
              {/* Group Letter Header */}
              <div className="sticky top-16 md:top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-md py-1 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#FF5C00] font-serif-display">
                  {letter}
                </span>
                <span className="text-[10px] text-[#e4beb1]/50 font-semibold">
                  {group.length} contact{group.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {group.map((c) => {
                  const badge = relationshipBadges[c.relationship] || relationshipBadges.lead;
                  const photoCount = c.photos?.length || 0;
                  return (
                    <motion.div
                      key={c.id}
                      onClick={() => onSelectConnection(c)}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.99 }}
                      className="bg-[#140b07] hover:bg-[#1f0f08] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 relative group-hover:border-[#FF5C00] transition-colors">
                          <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                          {c.priority === 'high' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#FF5C00] rounded-full border border-black" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#fadcd2] truncate group-hover:text-white">
                              {c.name}
                            </h3>
                            <span
                              className={`text-[9px] px-2 py-0.2 rounded-full border font-bold uppercase tracking-wider ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                            {photoCount > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#ffb59a] bg-[#2b1208] border border-[#FF5C00]/30 px-2 py-0.2 rounded-full">
                                <Camera className="w-3 h-3 text-[#FF5C00]" />
                                <span>{photoCount}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#FF5C00] truncate mt-0.5">
                            {c.profession} • {c.company}
                          </p>
                          {c.notes && (
                            <p className="text-[11px] text-[#e4beb1]/60 truncate max-w-sm mt-0.5">
                              {c.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Trigger Buttons */}
                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.whatsapp || c.phone ? (
                          <a
                            href={`https://wa.me/${(c.whatsapp || c.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#25D366] border border-white/5 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        ) : null}

                        <button
                          onClick={() => onOpenQuickMessage(c)}
                          className="p-2 rounded-xl bg-[#FF5C00] text-black font-bold hover:bg-[#ff7a33] shadow-md transition-colors"
                          title="Generate AI Follow-up Draft"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
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
        <UserPlus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};

