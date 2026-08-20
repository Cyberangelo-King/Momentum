import React, { useState, useEffect } from 'react';
import { Connection } from '../types';
import { generateQuickMessage } from '../services/aiService';
import { 
  Sparkles, 
  X, 
  MessageSquare, 
  Linkedin, 
  Mail, 
  RefreshCw, 
  Check, 
  Copy, 
  Send 
} from 'lucide-react';

interface QuickMessageModalProps {
  connection: Connection | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkFollowUpComplete: (connectionId: string, message: string) => void;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({
  connection,
  isOpen,
  onClose,
  onMarkFollowUpComplete,
}) => {
  const [channel, setChannel] = useState<'whatsapp' | 'linkedin' | 'email'>('whatsapp');
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && connection) {
      loadDraft(channel);
    }
  }, [isOpen, connection, channel]);

  if (!isOpen || !connection) return null;

  const loadDraft = async (selectedChannel: 'whatsapp' | 'linkedin' | 'email') => {
    setIsLoading(true);
    setCopied(false);
    try {
      const res = await generateQuickMessage(connection, selectedChannel);
      setDraftMessage(res.message);
      setSource(res.source);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAndComplete = () => {
    handleCopy();
    onMarkFollowUpComplete(connection.id, draftMessage);

    if (channel === 'whatsapp' && (connection.whatsapp || connection.phone)) {
      const num = (connection.whatsapp || connection.phone || '').replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(draftMessage)}`;
      window.open(waUrl, '_blank');
    } else if (channel === 'email' && connection.email) {
      const mailUrl = `mailto:${connection.email}?subject=${encodeURIComponent(
        'Great meeting you at TEDxAkure 2026'
      )}&body=${encodeURIComponent(draftMessage)}`;
      window.open(mailUrl, '_blank');
    } else if (channel === 'linkedin' && connection.linkedin) {
      window.open(connection.linkedin, '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#20110a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF5C00] text-black flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
                AI Follow-up Draft
              </h2>
              <p className="text-xs text-[#e4beb1]/70">For {connection.name} ({connection.company})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selection Tabs */}
        <div className="p-3 bg-[#180b06] border-b border-white/10 flex gap-2">
          {(['whatsapp', 'linkedin', 'email'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setChannel(ch);
                loadDraft(ch);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                channel === ch
                  ? 'bg-[#FF5C00] text-black shadow-md'
                  : 'bg-[#26150e] text-[#e4beb1]/70 hover:text-white'
              }`}
            >
              {ch === 'whatsapp' ? (
                <MessageSquare className="w-3.5 h-3.5" />
              ) : ch === 'linkedin' ? (
                <Linkedin className="w-3.5 h-3.5" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              {ch}
            </button>
          ))}
        </div>

        {/* Draft Editor */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#e4beb1]/70">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00]"></span>
              {source === 'gemini' ? 'Gemini 3.7 Flash Model' : 'Smart Offline Template'}
            </span>
            <button
              onClick={() => loadDraft(channel)}
              disabled={isLoading}
              className="text-[#FF5C00] font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>

          <div className="relative">
            {isLoading ? (
              <div className="w-full h-40 bg-[#0d0603] rounded-xl border border-white/10 flex flex-col items-center justify-center text-xs text-[#e4beb1]/70 gap-2">
                <span className="w-5 h-5 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin"></span>
                <span>Crafting authentic follow-up...</span>
              </div>
            ) : (
              <textarea
                rows={6}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                className="w-full bg-[#0d0603] border border-white/15 rounded-xl p-3.5 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] leading-relaxed resize-none"
              />
            )}
          </div>

          <p className="text-[11px] text-[#e4beb1]/50">
            Context: Tailored to your discussion on "{connection.notes || 'conference themes'}".
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1e100a] border-t border-white/10 flex gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-[#fadcd2] font-semibold text-xs hover:bg-white/5 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-[#25D366]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <button
            onClick={handleSendAndComplete}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            Launch {channel} & Mark Done
          </button>
        </div>
      </div>
    </div>
  );
};
