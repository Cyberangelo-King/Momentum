import React, { useState, useMemo } from 'react';
import { Idea } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Plus, Search, Copy, Check, Sparkles, X, Quote } from 'lucide-react';

interface IdeasViewProps {
  ideas: Idea[];
  onAddIdea: (idea: Idea) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ ideas, onAddIdea }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
            Intellectual Synthesis
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
            Talk Insights ({ideas.length})
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Insight</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-[#e4beb1]/50 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by quote, speaker name, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#140b07] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#fadcd2] placeholder:text-[#e4beb1]/40 focus:outline-none focus:border-[#FF5C00] transition-colors"
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
                ? 'bg-[#FF5C00] text-black shadow-md'
                : 'bg-[#180b06] text-[#e4beb1]/80 hover:text-white border border-white/10'
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
              className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group relative"
            >
              <div className="space-y-3">
                {/* Category & Session Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5C00]/15 text-[#FF5C00] uppercase tracking-wider">
                    {idea.category}
                  </span>
                  <span className="text-[11px] text-[#e4beb1]/60">{idea.timeStr} • {idea.stageName}</span>
                </div>

                {/* Quote */}
                <blockquote className="text-base font-serif-display italic text-[#fadcd2] leading-relaxed relative">
                  "{idea.quote}"
                </blockquote>

                {/* Key Takeaway */}
                {idea.takeaway && (
                  <div className="bg-[#1e100a] p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-[#e4beb1]/90 leading-relaxed">
                      <strong className="text-[#FF5C00]">Core Takeaway:</strong> {idea.takeaway}
                    </p>
                  </div>
                )}
              </div>

              {/* Speaker Info & Copy Button */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={idea.speakerAvatar}
                    alt={idea.speakerName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#fadcd2]">{idea.speakerName}</h4>
                    <p className="text-[10px] text-[#e4beb1]/60">{idea.sessionTitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyQuote(idea)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-[#FF5C00] hover:text-black text-[#e4beb1] transition-all flex items-center justify-center"
                  title="Copy Quote"
                >
                  {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Idea Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
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
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                  Key Quote or Idea *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Community is the ultimate moat in a world of infinite software replication."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                  Personal Takeaway / Application
                </label>
                <textarea
                  rows={2}
                  placeholder="How does this apply to my current projects?"
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Speaker Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tunde Agboola"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
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
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Session Title</label>
                  <input
                    type="text"
                    placeholder="The Future of SaaS"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Stage</label>
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
    </motion.div>
  );
};

