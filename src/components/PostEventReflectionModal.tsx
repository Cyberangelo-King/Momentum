import React, { useState, useEffect } from 'react';
import { 
  Connection, 
  Moment, 
  Idea, 
  Note, 
  EventSession, 
  UserProfile, 
  PostEventReflection 
} from '../types';
import { fetchPostEventReview } from '../services/aiService';
import { triggerHaptic } from '../services/haptics';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Compass, 
  CheckSquare, 
  Users, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Loader2, 
  Layers, 
  Calendar, 
  Award,
  Send,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PostEventReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes: Note[];
  sessions: EventSession[];
  profile: UserProfile;
  onOpenQuickMessage?: (connection: Connection) => void;
}

export const PostEventReflectionModal: React.FC<PostEventReflectionModalProps> = ({
  isOpen,
  onClose,
  connections,
  moments,
  ideas,
  notes,
  sessions,
  profile,
  onOpenQuickMessage,
}) => {
  const [reflection, setReflection] = useState<PostEventReflection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePillar, setActivePillar] = useState<
    'what-happened' | 'what-i-learned' | 'changed-thinking' | 'do-next' | 'who-to-follow-up'
  >('what-i-learned');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !reflection) {
      loadReflection();
    }
  }, [isOpen]);

  const loadReflection = async () => {
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      const data = await fetchPostEventReview({
        connections: connections.filter((c) => !c.inTrash),
        moments: moments.filter((m) => !m.inTrash),
        ideas,
        notes: notes.filter((n) => !n.inTrash),
        sessions,
        profile,
      });
      setReflection(data);
      triggerHaptic('milestone');
    } catch (err) {
      console.warn('Failed to generate post-event reflection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const handleExportFullMarkdown = () => {
    if (!reflection) return;
    triggerHaptic('success');

    let md = `# TEDxAkure 2026 — Comprehensive Post-Event Reflection\n\n`;
    md += `**Generated for:** ${profile.name} (${profile.title})\n`;
    md += `**Generated Date:** ${new Date().toLocaleDateString()}\n\n`;
    md += `> ${reflection.executiveSummary}\n\n`;
    md += `---\n\n`;

    md += `## 1. What Happened\n`;
    md += `- **Sessions Attended:** ${reflection.whatHappened.totalSessionsAttended}\n`;
    md += `- **Connections Made:** ${reflection.whatHappened.totalConnectionsMet}\n`;
    reflection.whatHappened.sessionsSummary.forEach((s) => (md += `- ${s}\n`));
    md += `\n`;

    md += `## 2. What I Learned (Core Theses & Concepts)\n`;
    reflection.whatILearned.coreTheses.forEach((t) => (md += `### Thesis: ${t}\n`));
    md += `\n**Key Concepts:**\n`;
    reflection.whatILearned.synthesizedConcepts.forEach((c) => (md += `- ${c}\n`));
    md += `\n**Standout Quotes:**\n`;
    reflection.whatILearned.standoutQuotes.forEach(
      (q) => (md += `> "${q.quote}" — *${q.speaker || 'Speaker'} (${q.sessionTitle || 'TEDxAkure'})*\n\n`)
    );

    md += `## 3. What Changed My Thinking\n`;
    md += `### Contrarian Insights:\n`;
    reflection.whatChangedMyThinking.contrarianInsights.forEach((ci) => (md += `- ${ci}\n`));
    md += `\n### Worldview & Paradigm Shifts:\n`;
    reflection.whatChangedMyThinking.worldviewShifts.forEach((ws) => (md += `- ${ws}\n`));
    md += `\n`;

    md += `## 4. What I Should Do Next (Action Commitments)\n`;
    md += `### Immediate (Next 24 Hours):\n`;
    reflection.whatIShouldDoNext.immediate24h.forEach((a) => (md += `- [ ] ${a.text}\n`));
    md += `\n### This Week:\n`;
    reflection.whatIShouldDoNext.thisWeek.forEach((a) => (md += `- [ ] ${a.text}\n`));
    md += `\n### Long-Term Strategic Goals:\n`;
    reflection.whatIShouldDoNext.strategicGoals.forEach((g) => (md += `- ${g}\n`));
    md += `\n`;

    md += `## 5. Who to Follow Up With\n`;
    reflection.whoToFollowUpWith.keyPeople.forEach((p) => {
      md += `### ${p.name} (${p.company})\n`;
      md += `- **Context/Reason:** ${p.reason}\n`;
      md += `- **Suggested Channel:** ${p.recommendedChannel.toUpperCase()}\n`;
      md += `- **Draft Outreach:** "${p.draftText}"\n\n`;
    });

    md += `---\n\n## LinkedIn Ready Post\n\n\`\`\`text\n${reflection.linkedInRecapPost}\n\`\`\`\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TEDxAkure_Post_Event_Review_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="w-full max-w-4xl max-h-[92vh] bg-[#120703] border border-[#FF5C00]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left"
      >
        {/* Header Hero Area */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#281106] via-[#1a0c05] to-[#0e0502] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#ff3700] text-black flex items-center justify-center font-bold shadow-lg shadow-[#FF5C00]/30 flex-shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] uppercase tracking-wider">
                  REFLECT STAGE • 5-PILLAR EVENT SYNTHESIS
                </span>
                <span className="text-xs text-[#e4beb1]/60">TEDxAkure 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-white mt-1">
                Post-Event Reflection & Forward Strategy
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-[#e4beb1]/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Pillar Navigation Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'what-i-learned' as const, label: '2. What I Learned', icon: BookOpen },
            { id: 'changed-thinking' as const, label: '3. Mindset Shifts', icon: Compass },
            { id: 'do-next' as const, label: '4. Action Roadmap', icon: Target },
            { id: 'who-to-follow-up' as const, label: '5. Key People', icon: Users },
            { id: 'what-happened' as const, label: '1. What Happened', icon: Calendar },
          ].map((pillar) => {
            const Icon = pillar.icon;
            const isSelected = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActivePillar(pillar.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#FF5C00] text-black shadow-md font-bold'
                    : 'bg-white/5 text-[#e4beb1]/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pillar.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#FF5C00] animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#fadcd2]">
                  Synthesizing TEDxAkure 5-Pillar Reflection via Neural Engine...
                </p>
                <p className="text-xs text-[#e4beb1]/60">
                  Aggregating all {connections.length} contacts, {notes.length} notes, {ideas.length} ideas, and keynote audio.
                </p>
              </div>
            </div>
          ) : reflection ? (
            <>
              {/* Executive Summary Callout */}
              <div className="p-4 rounded-2xl bg-[#1d0e07] border border-[#FF5C00]/30 shadow-inner space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF5C00] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Executive Takeaway</span>
                  </div>
                  <button
                    onClick={() => handleCopyText(reflection.executiveSummary, 'summary')}
                    className="text-[11px] text-[#e4beb1]/60 hover:text-white flex items-center gap-1"
                  >
                    {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'summary' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#fadcd2] leading-relaxed italic">
                  "{reflection.executiveSummary}"
                </p>
              </div>

              {/* Pillar 1: What Happened */}
              {activePillar === 'what-happened' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-[#1a0c06] border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-[#e4beb1]/60">Sessions Attended</span>
                      <p className="text-2xl font-bold font-serif-display text-white mt-1">
                        {reflection.whatHappened.totalSessionsAttended}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#1a0c06] border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-[#e4beb1]/60">Connections Made</span>
                      <p className="text-2xl font-bold font-serif-display text-[#FF8246] mt-1">
                        {reflection.whatHappened.totalConnectionsMet}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#1a0c06] border border-white/5 col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-[#e4beb1]/60">Notes & Ideas Logged</span>
                      <p className="text-2xl font-bold font-serif-display text-emerald-400 mt-1">
                        {notes.length + ideas.length}
                      </p>
                    </div>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      Sessions Summary
                    </h4>
                    <ul className="space-y-2">
                      {reflection.whatHappened.sessionsSummary.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#fadcd2]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Pillar 2: What I Learned */}
              {activePillar === 'what-i-learned' && (
                <div className="space-y-4">
                  {/* Core Theses */}
                  <div className="p-4 rounded-2xl bg-[#1a0c06] border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-[#FF5C00] uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Core Overarching Theses</span>
                    </h4>
                    <div className="space-y-2.5">
                      {reflection.whatILearned.coreTheses.map((thesis, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs sm:text-sm text-[#fadcd2] font-semibold">
                          #{i + 1}. {thesis}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synthesized Concepts */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      Synthesized Insights & Mental Models
                    </h4>
                    <ul className="space-y-2">
                      {reflection.whatILearned.synthesizedConcepts.map((concept, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#fadcd2]/90 leading-relaxed">
                          <span className="text-[#FF5C00] font-bold mt-0.5">•</span>
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Memorable Quotes */}
                  {reflection.whatILearned.standoutQuotes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                        Standout In-Room Quotes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {reflection.whatILearned.standoutQuotes.map((q, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-[#1c0e07] border border-[#FF5C00]/20 space-y-1">
                            <p className="text-xs text-[#fadcd2] italic">"{q.quote}"</p>
                            <p className="text-[10px] text-[#FF8246] font-semibold">
                              — {q.speaker || 'Speaker'} {q.sessionTitle ? `(${q.sessionTitle})` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pillar 3: What Changed My Thinking */}
              {activePillar === 'changed-thinking' && (
                <div className="space-y-4">
                  {/* Contrarian Insights */}
                  <div className="p-4.5 rounded-2xl bg-[#1c0d06] border border-amber-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      <span>Contrarian & Non-Obvious Insights</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {reflection.whatChangedMyThinking.contrarianInsights.map((ci, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-[#fadcd2] leading-relaxed">
                          ⚡ {ci}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Worldview Shifts */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      Ecosystem Worldview Shifts
                    </h4>
                    <ul className="space-y-2">
                      {reflection.whatChangedMyThinking.worldviewShifts.map((shift, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#fadcd2]/90 leading-relaxed">
                          <span className="text-[#FF5C00] font-bold">→</span>
                          <span>{shift}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Pillar 4: What I Should Do Next */}
              {activePillar === 'do-next' && (
                <div className="space-y-4">
                  {/* Immediate 24h Action Commitments */}
                  <div className="p-4.5 rounded-2xl bg-[#1d0e07] border border-[#FF5C00]/40 space-y-3">
                    <h4 className="text-xs font-bold text-[#FF5C00] uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Immediate 24-Hour Commitments (Move Forward)</span>
                    </h4>
                    <div className="space-y-2">
                      {reflection.whatIShouldDoNext.immediate24h.map((act) => (
                        <div key={act.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 text-xs text-[#fadcd2]">
                          <span className="w-2 h-2 rounded-full bg-[#FF5C00]" />
                          <span className="font-medium flex-1">{act.text}</span>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md uppercase">High Priority</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* This Week */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      This Week's Follow-Through
                    </h4>
                    <div className="space-y-2">
                      {reflection.whatIShouldDoNext.thisWeek.map((act) => (
                        <div key={act.id} className="p-2.5 rounded-xl bg-[#160a04] border border-white/5 flex items-center gap-2.5 text-xs text-[#fadcd2]/90">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{act.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Long-Term */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-[#e4beb1] uppercase tracking-wider">
                      Strategic Goals Derived from Event
                    </h4>
                    <ul className="space-y-1.5">
                      {reflection.whatIShouldDoNext.strategicGoals.map((g, idx) => (
                        <li key={idx} className="text-xs text-[#fadcd2]/80 flex items-start gap-2">
                          <span className="text-[#FF5C00] font-bold">✓</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Pillar 5: Who to Follow Up With */}
              {activePillar === 'who-to-follow-up' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#e4beb1]">
                    <span className="font-bold uppercase tracking-wider">
                      High-Leverage Connections to Engage
                    </span>
                    <span className="text-[11px] text-[#FF5C00]">1-Tap Outreach</span>
                  </div>

                  <div className="space-y-3">
                    {reflection.whoToFollowUpWith.keyPeople.map((person, idx) => {
                      const matchedConn = connections.find(
                        (c) => c.name.toLowerCase() === person.name.toLowerCase()
                      );
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#1a0c06] border border-white/10 hover:border-[#FF5C00]/40 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-bold text-white">{person.name}</h5>
                              <p className="text-xs text-[#e4beb1]/70">{person.company}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] uppercase">
                              {person.recommendedChannel}
                            </span>
                          </div>

                          <p className="text-xs text-[#fadcd2] bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <strong className="text-[#FF8246]">Reason to reach out:</strong> {person.reason}
                          </p>

                          <div className="p-3 rounded-xl bg-[#221008] border border-white/5 space-y-1.5">
                            <span className="text-[10px] font-bold text-[#e4beb1]/60 uppercase">Drafted Outreach Text:</span>
                            <p className="text-xs text-[#fadcd2] italic leading-relaxed">
                              "{person.draftText}"
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleCopyText(person.draftText, `draft_${idx}`)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#fadcd2] font-semibold flex items-center gap-1.5"
                            >
                              {copiedSection === `draft_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>Copy Draft</span>
                            </button>

                            {matchedConn && onOpenQuickMessage && (
                              <button
                                onClick={() => {
                                  triggerHaptic('success');
                                  onClose();
                                  onOpenQuickMessage(matchedConn);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 min-h-[36px]"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send via Quick Message</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions: Markdown & Share */}
        <div className="p-5 border-t border-white/10 bg-[#120703] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={loadReflection}
            disabled={isLoading}
            className="text-xs text-[#e4beb1]/70 hover:text-white flex items-center gap-1.5 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
            <span>Regenerate Synthesis</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFullMarkdown}
              disabled={!reflection}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#fadcd2] font-semibold text-xs transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Markdown (.md)</span>
            </button>

            <button
              onClick={() => {
                if (reflection?.linkedInRecapPost) {
                  handleCopyText(reflection.linkedInRecapPost, 'linkedin');
                }
              }}
              disabled={!reflection}
              className="px-4 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center gap-2 shadow-lg shadow-[#FF5C00]/20 min-h-[44px]"
            >
              {copiedSection === 'linkedin' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedSection === 'linkedin' ? 'Copied LinkedIn Post!' : 'Copy LinkedIn Recap'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
