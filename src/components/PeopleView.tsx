import React, { useState, useMemo } from 'react';
import { Connection, RelationshipType, EventConfig } from '../types';
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
  Image as ImageIcon,
  RotateCcw,
  ArrowLeftRight,
  SendHorizontal,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { triggerHaptic } from '../services/haptics';

interface PeopleViewProps {
  connections: Connection[];
  activeEvent?: EventConfig;
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickConnect: () => void;
  onOpenQuickMessage: (connection: Connection) => void;
  targetCount: number;
  onClearDemoData?: () => void;
  onTrashConnection?: (connection: Connection) => void;
  onRestoreConnection?: (connectionId: string) => void;
  onUpdateConnection?: (updated: Connection) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  connections,
  activeEvent,
  onSelectConnection,
  onOpenQuickConnect,
  onOpenQuickMessage,
  targetCount,
  onClearDemoData,
  onTrashConnection,
  onRestoreConnection,
  onUpdateConnection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | RelationshipType | 'high-priority' | 'with-photos' | 'demo'>('all');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [trashedNotice, setTrashedNotice] = useState<{ id: string; name: string } | null>(null);
  const [showGestureHint, setShowGestureHint] = useState(true);

  const effectiveTarget = activeEvent?.targetConnections || targetCount || 50;

  const demoCount = useMemo(() => {
    return connections.filter((c) => c.id.startsWith('c1') || c.id.startsWith('c2') || c.id.startsWith('c3') || c.id.startsWith('c4') || c.id.startsWith('c5') || c.id.startsWith('demo-')).length;
  }, [connections]);

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      // Event filter
      if (!showAllEvents && activeEvent) {
        if (c.eventId && c.eventId !== activeEvent.id) return false;
      }

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
      if (selectedFilter === 'demo') return c.id.startsWith('c1') || c.id.startsWith('c2') || c.id.startsWith('c3') || c.id.startsWith('demo-');
      return c.relationship === selectedFilter;
    });
  }, [connections, searchQuery, selectedFilter, showAllEvents, activeEvent]);

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
    lead: { label: 'Lead', class: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--border-accent)]' },
    peer: { label: 'Peer', class: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    mentor: { label: 'Mentor', class: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    speaker: { label: 'Speaker', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  };

  // Swipe handling
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, connection: Connection) => {
    const swipeThreshold = 85;
    const velocityThreshold = 250;

    // Swiped Right -> Follow Up Action
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      triggerHaptic('success');
      onOpenQuickMessage(connection);
      return;
    }

    // Swiped Left -> Move to Trash
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      triggerHaptic('delete');
      if (onTrashConnection) {
        onTrashConnection(connection);
      } else if (onUpdateConnection) {
        onUpdateConnection({ ...connection, inTrash: true, deletedAt: new Date().toISOString() });
      }
      setTrashedNotice({ id: connection.id, name: connection.name });
      setTimeout(() => {
        setTrashedNotice((curr) => (curr?.id === connection.id ? null : curr));
      }, 4000);
    }
  };

  const handleUndoTrash = () => {
    if (!trashedNotice) return;
    if (onRestoreConnection) {
      onRestoreConnection(trashedNotice.id);
    }
    triggerHaptic('success');
    setTrashedNotice(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-28 md:pb-12 relative animate-in fade-in duration-200 text-[var(--text-primary)]">
      {/* Toast Notice for Undo Trash */}
      <AnimatePresence>
        {trashedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[var(--bg-surface-card)] border border-rose-500/50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 max-w-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">Moved <strong>{trashedNotice.name}</strong> to Trash</span>
            </div>
            <button
              onClick={handleUndoTrash}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase flex items-center gap-1.5 font-mono">
              Network Directory
            </span>
            {activeEvent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono">
                {activeEvent.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
            Connections ({filteredConnections.length}/{effectiveTarget})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onClearDemoData && demoCount > 0 && (
            <button
              onClick={() => setShowTrashConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-white text-xs font-semibold border border-[var(--border-subtle)] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Remove demo mock contacts"
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Clean Demo Data ({demoCount})</span>
            </button>
          )}

          <button
            onClick={onOpenQuickConnect}
            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-[var(--accent-primary)]/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* Touch Gesture Hint Banner */}
      {showGestureHint && connections.length > 0 && (
        <div className="p-2.5 px-3.5 rounded-xl bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] shadow-sm">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span>
              <strong>Swipe Shortcuts:</strong> Swipe right 👉 to Follow-up • Swipe left 👈 to Trash
            </span>
          </div>
          <button
            onClick={() => setShowGestureHint(false)}
            className="text-white/40 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confirmation Modal for Clearing Demo Data */}
      <AnimatePresence>
        {showTrashConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center text-[var(--text-primary)]"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-display text-white">
                  Remove Demo Data?
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  This will remove the {demoCount} preloaded demo sample contacts so you can focus entirely on real people you meet.
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
        <Search className="absolute left-3.5 top-3 text-[var(--text-secondary)] w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, company, role, or discussion tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-sm"
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === f.id
                ? 'bg-[var(--accent-primary)] text-black shadow-md font-bold'
                : 'bg-[var(--bg-surface-card)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] hover:border-[var(--border-accent)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List / Grouped Directory with Swipe Gestures */}
      {Object.keys(groupedConnections).length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface-card)] rounded-3xl border border-[var(--border-subtle)] space-y-3 shadow-md">
          <div className="w-12 h-12 rounded-full bg-white/5 text-[var(--text-secondary)] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">No connections found</p>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            Try adjusting your search keywords or filter category.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedConnections) as [string, Connection[]][]).map(([letter, group]) => (
            <div key={letter} className="space-y-2.5">
              {/* Group Letter Header */}
              <div className="sticky top-16 md:top-0 z-10 bg-[var(--bg-canvas)]/95 backdrop-blur-md py-1 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--accent-primary)] font-serif-display font-mono">
                  {letter}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-semibold font-mono">
                  {group.length} contact{group.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {group.map((c) => {
                  const badge = relationshipBadges[c.relationship] || relationshipBadges.lead;
                  const photoCount = c.photos?.length || 0;
                  return (
                    <div
                      key={c.id}
                      className="relative overflow-hidden rounded-2xl bg-[var(--bg-canvas)] select-none shadow-sm"
                    >
                      {/* Swipe Action Revealed Underneath: LEFT (Swipe Right = Follow-Up) */}
                      <div className="absolute inset-y-0 left-0 w-1/2 bg-[var(--bg-surface-subtle)] border-y border-l border-[var(--border-accent)] rounded-l-2xl flex items-center justify-start pl-5 text-[var(--accent-primary)] font-bold text-xs gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--accent-primary)] animate-pulse" />
                        <span>Follow-up</span>
                      </div>

                      {/* Swipe Action Revealed Underneath: RIGHT (Swipe Left = Trash) */}
                      <div className="absolute inset-y-0 right-0 w-1/2 bg-rose-950/60 border-y border-r border-rose-500/40 rounded-r-2xl flex items-center justify-end pr-5 text-rose-400 font-bold text-xs gap-2">
                        <span>Trash</span>
                        <Trash2 className="w-5 h-5 text-rose-400" />
                      </div>

                      {/* Foreground Swipeable Card */}
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(e, info) => handleDragEnd(e, info, c)}
                        onClick={() => onSelectConnection(c)}
                        whileHover={{ scale: 1.003 }}
                        whileTap={{ scale: 0.995 }}
                        className="relative bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] active:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-sm group touch-pan-y"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pointer-events-none">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--border-subtle)] flex-shrink-0 relative group-hover:border-[var(--accent-primary)] transition-colors bg-neutral-900">
                            <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                            {c.priority === 'high' && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--accent-primary)] rounded-full border border-black" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white truncate group-hover:text-[var(--accent-primary)] transition-colors">
                                {c.name}
                              </h3>
                              <span
                                className={`text-[9px] px-2 py-0.2 rounded-full border font-bold uppercase tracking-wider font-mono ${badge.class}`}
                              >
                                {badge.label}
                              </span>
                              {photoCount > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--border-accent)] px-2 py-0.2 rounded-full font-mono">
                                  <Camera className="w-3 h-3 text-[var(--accent-primary)]" />
                                  <span>{photoCount}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--accent-primary)] truncate mt-0.5">
                              {c.profession} • {c.company}
                            </p>
                            {c.notes && (
                              <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-sm mt-0.5">
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
                              className="p-2 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.08] text-[#25D366] border border-[var(--border-subtle)] transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          ) : null}

                          <button
                            onClick={() => onOpenQuickMessage(c)}
                            className="p-2 rounded-xl bg-[var(--accent-primary)] text-black font-bold hover:brightness-110 shadow-md transition-colors"
                            title="Generate AI Follow-up Draft"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
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
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-black flex items-center justify-center shadow-2xl z-30 active:scale-95 transition-transform"
        title="Quick Connect (10s)"
      >
        <UserPlus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};


