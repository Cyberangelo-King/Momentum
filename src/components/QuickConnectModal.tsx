import React, { useState, useRef } from 'react';
import { Connection, RelationshipType, PriorityLevel } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { summarizeConnection } from '../services/aiService';
import { compressImage } from '../services/imageCompression';
import { Camera, Image as ImageIcon, Plus, Trash2, Bolt, Check, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(async (file: File) => {
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.78,
          mimeType: 'image/jpeg',
        });
        setPhotos((prev) => [...prev, compressed.dataUrl]);
        if (!avatarUrl) setAvatarUrl(compressed.dataUrl);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const url = reader.result as string;
            setPhotos((prev) => [...prev, url]);
            if (!avatarUrl) setAvatarUrl(url);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleAddPhotoFromCamera = (dataUrl: string) => {
    setPhotos((prev) => [...prev, dataUrl]);
    if (!avatarUrl) setAvatarUrl(dataUrl);
    setIsCameraOpen(false);
  };

  const handleRemovePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    if (avatarUrl === photos[idx]) {
      setAvatarUrl(updated[0] || '');
    }
  };

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

    const primaryAvatar =
      avatarUrl ||
      photos[0] ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`;

    const newConnection: Connection = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      profession: profession.trim() || 'Attendee',
      company: company.trim() || 'Innovator',
      avatarUrl: primaryAvatar,
      photos: photos,
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
    setPhotos([]);
    setAvatarUrl('');
    setRelationship('lead');
    setPriority('high');
    setShowAdvanced(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-[#120804] border border-white/10 sm:rounded-3xl rounded-t-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#220f06] to-[#150803] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5C00] text-black flex items-center justify-center font-bold shadow-lg shadow-[#FF5C00]/20">
                <Bolt className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#fadcd2] font-serif-display">
                  Quick Connect
                </h2>
                <p className="text-xs text-[#e4beb1]/60">
                  Connection #{existingCount + 1} of 50 Target
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Photos & Badge Attachments Section */}
            <div className="p-4 rounded-2xl bg-[#180b06] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#fadcd2] uppercase tracking-wider">
                    Attendee Photos & Lanyard Badges
                  </h3>
                  <p className="text-[11px] text-[#e4beb1]/60">
                    Snap badge, selfie, or business card
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="p-2 rounded-xl bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Take Photo"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#fadcd2] border border-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Import Image"
                  >
                    <ImageIcon className="w-4 h-4 text-[#ffb59a]" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              {photos.length > 0 ? (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {photos.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group"
                    >
                      <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      {avatarUrl === imgUrl && (
                        <div className="absolute top-1 left-1 bg-[#FF5C00] text-black text-[8px] font-bold px-1 rounded">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border border-dashed border-white/20 hover:border-[#FF5C00] flex flex-col items-center justify-center text-[#e4beb1]/60 hover:text-white transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#FF5C00]" />
                    <span className="text-[9px] mt-0.5 font-medium">Add</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full py-4 border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5C00]/60 transition-colors bg-[#130703]"
                >
                  <Camera className="w-6 h-6 text-[#FF5C00] mb-1" />
                  <p className="text-xs font-semibold text-[#fadcd2]">Take Photo or Pick from Gallery</p>
                  <p className="text-[10px] text-[#e4beb1]/50">Helps with instant face & name recall</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Essential Fields */}
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Amina Yusuf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
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
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Role / Profession</label>
                <input
                  type="text"
                  placeholder="e.g. Founder & CTO"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
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
                    className={`py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                      relationship === rel
                        ? 'bg-[#FF5C00] text-black shadow-md'
                        : 'bg-[#1e0f08] text-[#e4beb1]/70 hover:text-white border border-white/5'
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
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                >
                  <option value="high">★ High Priority</option>
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
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                />
              </div>
            </div>

            {/* Quick Context Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                Conversation Memory & Key Insights
              </label>
              <textarea
                rows={2}
                placeholder="What did you discuss? (e.g. Collaborating on AI computer vision pilot)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] resize-none"
              />
            </div>

            {/* Toggle Advanced Contact Channels */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#FF5C00] font-semibold flex items-center gap-1 hover:underline pt-1"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showAdvanced ? 'Hide Additional Channels' : 'Add WhatsApp, LinkedIn, Email'}</span>
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
                    className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#e4beb1] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#e4beb1] mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-[#fadcd2] font-semibold text-xs hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isAiSummarizing}
                className="flex-1 py-3 rounded-xl bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-98"
              >
                {isAiSummarizing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Connection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={handleAddPhotoFromCamera}
        mode="photo"
        title="Snap Badge or Attendee Photo"
      />
    </>
  );
};

