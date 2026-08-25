import React, { useState, useMemo } from 'react';
import { Idea } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Plus, Search, Copy, Check, Sparkles, X, Quote, Trash2, CheckCircle2 } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { triggerHaptic } from '../services/haptics';

interface IdeasViewProps {
  ideas: Idea[];
  onAddIdea: (idea: Idea) => void;
  onDeleteIdea?: (id: string) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ ideas, onAddIdea, onDeleteIdea }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ideaToDelete, setIdeaToDelete] = useState<Idea | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Form state
  const [quote, setQuote] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [stageName, setStageName] = useState('Main Stage');
  const [category, setCategory] = useState<Idea['category']>('Keynote');

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.speakerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.takeaway && idea.takeaway.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      return idea.category === selectedCategory;
    });
  }, [ideas, searchQuery, selectedCategory]);

  const handleCopyQuote = (idea: Idea) => {
    const text = `"${idea.quote}" — ${idea.speakerName} (${idea.sessionTitle}, TEDxAkure 2026)`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim()) return;

    const newIdea: Idea = {
      id: `i_${Date.now()}`,
      quote: quote.trim(),
      takeaway: takeaway.trim(),
      speakerName: speakerName.trim() || 'TEDx Speaker',
      speakerRole: speakerRole.trim() || 'Thought Leader',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      sessionTitle: sessionTitle.trim() || 'TEDxAkure Session',
      stageName: stageName.trim(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category,
      tags: ['#TEDxAkure', `#${category.replace(/\s+/g, '')}`],
    };

    onAddIdea(newIdea);
    setQuote('');
    setTakeaway('');
    setSpeakerName('');
    setSpeakerRole('');
    setSessionTitle('');
    setIsAddModalOpen(false);
  };

  const handleInitiateDelete = (idea: Idea, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIdeaToDelete(idea);
  };

  const handleConfirmDelete = () => {
    if (!ideaToDelete) return;
    const quoteSnippet = ideaToDelete.quote.slice(0, 30);
    if (onDeleteIdea) {
      onDeleteIdea(ideaToDelete.id);
    }
    setIdeaToDelete(null);
    setDeleteToast(`Insight "${quoteSnippet}..." deleted.`);
    setTimeout(() => setDeleteToast(null), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12"
    >
      {/* Delete Feedback Toast */}
      {deleteToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 bg-[var(--bg-surface-card)] border border-rose-500/50 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase font-mono">
            Intellectual Synthesis
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
            Talk Insights ({ideas.length})
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Insight</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-[var(--text-secondary)] w-4 h-4" />
        <input
          type="text"
          placeholder="Search by quote, speaker name, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-sm"
        />
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'All Insights' },
          { id: 'Keynote', label: 'Keynotes' },
          { id: 'Design & UX', label: 'Design & UX' },
          { id: 'Leadership', label: 'Leadership' },
          { id: 'Technology', label: 'Technology' },
          { id: 'Workshop', label: 'Workshops' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-[var(--accent-primary)] text-black shadow-md font-bold'
                : 'bg-[var(--bg-surface-card)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] hover:border-[var(--border-accent)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Idea Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIdeas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group relative"
            >
              <div className="space-y-3">
                {/* Category & Session Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] uppercase tracking-wider font-mono border border-[var(--border-accent)]">
                    {idea.category}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] font-mono">{idea.timeStr} • {idea.stageName}</span>
                </div>

                {/* Quote */}
                <blockquote className="text-base font-serif-display italic text-white leading-relaxed relative">
                  "{idea.quote}"
                </blockquote>

                {/* Key Takeaway */}
                {idea.takeaway && (
                  <div className="bg-[var(--bg-surface-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      <strong className="text-[var(--accent-primary)]">Core Takeaway:</strong> {idea.takeaway}
                    </p>
                  </div>
                )}
              </div>

              {/* Speaker Info & Copy Button */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={idea.speakerAvatar}
                    alt={idea.speakerName}
                    className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{idea.speakerName}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">{idea.sessionTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleInitiateDelete(idea, e)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-center"
                    title="Delete Insight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyQuote(idea)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-[var(--accent-primary)] hover:text-black text-[var(--text-secondary)] transition-all flex items-center justify-center"
                    title="Copy Quote"
                  >
                    {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      {ideaToDelete && (
        <DeleteConfirmationModal
          isOpen={!!ideaToDelete}
          onClose={() => setIdeaToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete this insight?"
          itemName={`"${ideaToDelete.quote.slice(0, 50)}..."`}
          itemType="idea"
          description={`Permanently remove this speaker quote by ${ideaToDelete.speakerName} (${ideaToDelete.sessionTitle}) from your captured conference insights.`}
          details={[
            { label: 'Speaker', value: ideaToDelete.speakerName },
            { label: 'Category', value: ideaToDelete.category },
            { label: 'Session', value: ideaToDelete.sessionTitle },
            { label: 'Stage', value: ideaToDelete.stageName },
          ]}
          warningMessage="This insight will be permanently deleted from local storage and your cloud database."
        />
      )}

      {/* Add Idea Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-white">
                Log Talk Insight
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Key Quote or Idea *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Community is the ultimate moat in a world of infinite software replication."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Personal Takeaway / Application
                </label>
                <textarea
                  rows={2}
                  placeholder="How does this apply to my current projects?"
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Speaker Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tunde Agboola"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)]"
                  >
                    <option value="Keynote">Keynote</option>
                    <option value="Design & UX">Design & UX</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Technology">Technology</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Fireside Chat">Fireside Chat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Session Title</label>
                  <input
                    type="text"
                    placeholder="The Future of SaaS"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Stage</label>
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-white hover:bg-white/5"
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
    </motion.div>
  );
};

