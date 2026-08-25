import React from 'react';
import { Connection, NfcExchangeLog } from '../types';
import { NfcCollisionMatch, createNfcExchangeLog } from '../services/nfcService';
import { triggerHaptic } from '../services/haptics';
import { 
  AlertTriangle, 
  Smartphone, 
  RefreshCw, 
  UserCheck, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface NfcCollisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collision: NfcCollisionMatch | null;
  onLogReencounter: (existingId: string, newLog: NfcExchangeLog, updatedNotes?: string) => void;
  onMergeContact: (updatedConnection: Connection) => void;
  onCreateSeparate: (newConnectionPayload: Connection) => void;
}

export const NfcCollisionModal: React.FC<NfcCollisionModalProps> = ({
  isOpen,
  onClose,
  collision,
  onLogReencounter,
  onMergeContact,
  onCreateSeparate,
}) => {
  if (!isOpen || !collision) return null;

  const { existingConnection, incomingPayload, matchedField, matchedValue } = collision;
  const previousBumpsCount = (existingConnection.nfcExchangeHistory?.length || 0) + (existingConnection.isNfcCaptured ? 1 : 0);

  const handleLogReencounterClick = () => {
    triggerHaptic('nfc_handshake');
    const newLog = createNfcExchangeLog(
      'bump',
      incomingPayload.eventId || existingConnection.eventId,
      incomingPayload.eventName || existingConnection.eventContext,
      `Re-encountered at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
    onLogReencounter(existingConnection.id, newLog, incomingPayload.notes);
    onClose();
  };

  const handleMergeClick = () => {
    triggerHaptic('success');
    const newLog = createNfcExchangeLog(
      'bump',
      incomingPayload.eventId || existingConnection.eventId,
      incomingPayload.eventName || existingConnection.eventContext,
      'Contact merged & updated via NFC bump'
    );

    const mergedHistory = [...(existingConnection.nfcExchangeHistory || []), newLog];
    const mergedTags = Array.from(
      new Set([...(existingConnection.tags || []), ...(incomingPayload.tags || []), '#NFCBump'])
    );

    const updated: Connection = {
      ...existingConnection,
      profession: incomingPayload.profession || existingConnection.profession,
      company: incomingPayload.company || existingConnection.company,
      email: incomingPayload.email || existingConnection.email,
      phone: incomingPayload.phone || existingConnection.phone,
      linkedin: incomingPayload.linkedin || existingConnection.linkedin,
      notes: incomingPayload.notes
        ? `${existingConnection.notes || ''}\n[NFC Bump Update]: ${incomingPayload.notes}`.trim()
        : existingConnection.notes,
      isNfcCaptured: true,
      nfcTimestamp: existingConnection.nfcTimestamp || new Date().toISOString(),
      nfcExchangeHistory: mergedHistory,
      tags: mergedTags,
    };

    onMergeContact(updated);
    onClose();
  };

  const handleCreateSeparateClick = () => {
    triggerHaptic('medium');
    const newLog = createNfcExchangeLog(
      'bump',
      incomingPayload.eventId,
      incomingPayload.eventName,
      'Created as separate contact entry'
    );

    const newConn: Connection = {
      id: `c_nfc_${Date.now()}`,
      name: incomingPayload.name,
      profession: incomingPayload.profession || 'Attendee',
      company: incomingPayload.company || 'Conference Guest',
      email: incomingPayload.email || '',
      phone: incomingPayload.phone || '',
      linkedin: incomingPayload.linkedin || '',
      notes: incomingPayload.notes || 'Exchanged contact via Web-NFC phone bump.',
      relationship: 'lead',
      priority: 'high',
      followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      followUpStatus: 'today',
      metTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      eventId: incomingPayload.eventId,
      eventContext: incomingPayload.eventName || 'Live Event',
      conversationMemory: [],
      avatarUrl:
        incomingPayload.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isNfcCaptured: true,
      nfcTimestamp: new Date().toISOString(),
      nfcExchangeHistory: [newLog],
      tags: incomingPayload.tags || ['#NFCBump'],
    };

    onCreateSeparate(newConn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="w-full max-w-lg rounded-3xl bg-[#120804] border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col text-[#fadcd2]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#241005] via-[#1a0c06] to-[#120804] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif-display">
                  NFC Contact Collision Detected
                </h2>
              </div>
              <p className="text-xs text-[#ffb59a]/80">
                Matched existing contact via <span className="font-semibold text-amber-400 uppercase">{matchedField}</span>: {matchedValue}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          <p className="text-xs text-[#e4beb1]/80 leading-relaxed">
            You just bumped phones with <span className="font-bold text-white">{incomingPayload.name}</span>, but they already exist in your Momentum CRM. How would you like to handle this interaction?
          </p>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Existing Contact */}
            <div className="p-3.5 rounded-2xl bg-[#1c0c05] border border-white/10 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Existing In CRM
                </span>
                {previousBumpsCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF5C00]/20 text-[#ffb59a] font-bold">
                    {previousBumpsCount} Previous Bump{previousBumpsCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <img
                  src={existingConnection.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={existingConnection.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#FF5C00]/40 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{existingConnection.name}</h4>
                  <p className="text-[11px] text-[#ffb59a] truncate">{existingConnection.profession}</p>
                  <p className="text-[10px] text-[#e4beb1]/60 truncate">{existingConnection.company}</p>
                </div>
              </div>

              <div className="text-[10px] text-[#e4beb1]/60 pt-1 space-y-0.5 border-t border-white/5 font-mono">
                {existingConnection.email && <div className="truncate">📧 {existingConnection.email}</div>}
                {existingConnection.phone && <div className="truncate">📞 {existingConnection.phone}</div>}
              </div>
            </div>

            {/* Incoming Bump Payload */}
            <div className="p-3.5 rounded-2xl bg-[#221008] border border-amber-500/30 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 animate-pulse" />
                  Incoming Phone Bump
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Just Now
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <div className="w-10 h-10 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00] flex items-center justify-center text-white shrink-0 font-bold">
                  {incomingPayload.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{incomingPayload.name}</h4>
                  <p className="text-[11px] text-[#ffb59a] truncate">{incomingPayload.profession || 'Attendee'}</p>
                  <p className="text-[10px] text-[#e4beb1]/60 truncate">{incomingPayload.company || 'Guest'}</p>
                </div>
              </div>

              <div className="text-[10px] text-[#e4beb1]/60 pt-1 space-y-0.5 border-t border-white/5 font-mono">
                {incomingPayload.email && <div className="truncate">📧 {incomingPayload.email}</div>}
                {incomingPayload.phone && <div className="truncate">📞 {incomingPayload.phone}</div>}
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2.5 pt-2">
            {/* Primary: Log Re-encounter Bump */}
            <button
              onClick={handleLogReencounterClick}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#FF5C00] to-[#ff7a33] text-black font-bold text-xs flex items-center justify-between shadow-lg shadow-[#FF5C00]/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-black" />
                </div>
                <div>
                  <div className="font-bold text-black">Log Re-encounter Bump (Recommended)</div>
                  <div className="text-[10px] text-black/80 font-normal">
                    Appends timestamped encounter log to history without duplicating contact
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-black shrink-0" />
            </button>

            {/* Secondary: Merge & Update Contact */}
            <button
              onClick={handleMergeClick}
              className="w-full p-3 rounded-2xl bg-[#241006] hover:bg-[#34160a] border border-[#FF5C00]/30 text-white font-semibold text-xs flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-white font-bold">Merge & Update Contact Details</div>
                  <div className="text-[10px] text-[#e4beb1]/60">
                    Updates contact email/phone and saves bump timestamp
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>

            {/* Tertiary: Create Separate Record */}
            <button
              onClick={handleCreateSeparateClick}
              className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[#e4beb1]/70 hover:text-white text-[11px] flex items-center justify-center gap-2 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create As A Separate Contact Entry</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
