import React, { useState } from 'react';
import { Connection, RelationshipType, PriorityLevel } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { summarizeConnection } from '../services/aiService';

interface QuickConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConnection: (connection: Connection) => void;
  existingCount: number;
}

export const QuickConnectModal: React.FC<QuickConnectModalProps> = ({
  isOpen,
  onClose,
  onSaveConnection,
  existingCount,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('lead');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let memoryPoints = [
      `Met ${name} (${company || 'TEDxAkure attendee'}) during conference networking.`,
      notes ? `Notes: "${notes}"` : 'Agreed to connect and explore collaborative opportunities.',
    ];
    let tags = ['#TEDxAkure', relationship];

    // Optional quick AI synthesis if notes exist
    if (notes.trim().length > 10) {
      setIsAiSummarizing(true);
      try {
        const aiSummary = await summarizeConnection(name, company, notes);
        if (aiSummary.memoryPoints?.length) {
          memoryPoints = aiSummary.memoryPoints;
        }
        if (aiSummary.suggestedTags?.length) {
          tags = [...tags, ...aiSummary.suggestedTags];
        }
      } catch (err) {
        console.warn('AI summarize fallback', err);
      } finally {
        setIsAiSummarizing(false);
      }
    }

    const newConnection: Connection = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      profession: profession.trim() || 'Attendee',
      company: company.trim() || 'Innovator',
      avatarUrl:
        avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
      phone: phone.trim(),
      whatsapp: phone.trim() ? phone.trim().replace(/[^0-9+]/g, '') : undefined,
      email: email.trim(),
      linkedin: linkedin.trim(),
      notes: notes.trim(),
      relationship,
      priority,
      followUpDate,
      followUpStatus: 'today',
      metTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      eventContext: 'TEDxAkure 2026',
      conversationMemory: memoryPoints,
      tags,
    };

    onSaveConnection(newConnection);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCompany('');
    setProfession('');
    setPhone('');
    setEmail('');
    setLinkedin('');
    setNotes('');
    setAvatarUrl('');
    setRelationship('lead');
    setPriority('high');
    setShowAdvanced(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
        <div
          className="bg-[#180b06] border border-white/10 sm:rounded-2xl rounded-t-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in fade-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-[#271812] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FF5C00] text-black flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#fadcd2] font-serif-display">
                  Quick Connect
                </h2>
                <p className="text-xs text-[#e4beb1]/70">
                  Connection #{existingCount + 1} of 50 Target
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/5"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Photo / Badge Snap Row */}
            <div className="flex items-center gap-4 bg-[#140804] p-3 rounded-xl border border-white/5">
              <div
                onClick={() => setIsCameraOpen(true)}
                className="w-16 h-16 rounded-xl bg-[#271812] border border-dashed border-[#FF5C00]/40 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5C00] overflow-hidden flex-shrink-0 group relative"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[#FF5C00] group-hover:scale-110 transition-transform">
                      photo_camera
                    </span>
                    <span className="text-[9px] text-[#e4beb1]/60 mt-0.5 font-medium">Snap</span>
                  </>
                )}
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-[#fadcd2]">Attendee Photo or Badge</p>
                <p className="text-[11px] text-[#e4beb1]/60">
                  Snap lanyard badge or selfie for instant memory recall.
                </p>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-[11px] text-[#FF5C00] hover:underline mt-1 block"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Essential 3 Fields */}
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Amina Yusuf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Company / Org</label>
                <input
                  type="text"
                  placeholder="e.g. Future Africa"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Role / Profession</label>
                <input
                  type="text"
                  placeholder="e.g. CEO, Designer"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                />
              </div>
            </div>

            {/* Relationship Chips */}
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5">
                Relationship Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['lead', 'peer', 'mentor', 'speaker'] as RelationshipType[]).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelationship(rel)}
                    className={`py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                      relationship === rel
                        ? 'bg-[#FF5C00] text-black shadow-md'
                        : 'bg-[#271812] text-[#e4beb1]/70 hover:text-white border border-white/5'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority & Follow-up Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full bg-[#120805] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-[#120805] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                />
              </div>
            </div>

            {/* Quick Context Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                Conversation Memory & Notes
              </label>
              <textarea
                rows={2}
                placeholder="What did you talk about? (e.g., Interested in Series A deck, AI logistics paper)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] resize-none"
              />
            </div>

            {/* Toggle Advanced Contact Channels */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#FF5C00] font-semibold flex items-center gap-1 hover:underline pt-1"
            >
              <span className="material-symbols-outlined text-sm">
                {showAdvanced ? 'expand_less' : 'add_circle'}
              </span>
              {showAdvanced ? 'Hide Additional Channels' : 'Add WhatsApp, LinkedIn, Email'}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1 border-t border-white/5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-[#e4beb1] mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#e4beb1] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#e4beb1] mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-[#120805] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-[#fadcd2] font-semibold text-xs hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isAiSummarizing}
                className="flex-1 py-3 rounded-xl bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                {isAiSummarizing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base font-bold">check</span>
                    <span>Save Connection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={(url) => {
          setAvatarUrl(url);
          setIsCameraOpen(false);
        }}
        mode="photo"
        title="Snap Badge or Attendee Photo"
      />
    </>
  );
};
