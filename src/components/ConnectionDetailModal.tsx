import React, { useState, useRef } from 'react';
import { Connection, Moment, NfcExchangeLog } from '../types';
import { generateQuickMessage, summarizeConnection } from '../services/aiService';
import { createNfcExchangeLog } from '../services/nfcService';
import { triggerHaptic } from '../services/haptics';
import { CameraCaptureModal } from './CameraCaptureModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  X, 
  MessageSquare, 
  Phone, 
  Mail, 
  Sparkles, 
  Star, 
  Calendar, 
  ExternalLink,
  Plus,
  Smartphone,
  Radio,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConnectionDetailModalProps {
  connection: Connection | null;
  onClose: () => void;
  onUpdateConnection: (updated: Connection) => void;
  onDeleteConnection: (id: string) => void;
  relatedMoments: Moment[];
  onOpenQuickMessage: (connection: Connection) => void;
}

export const ConnectionDetailModal: React.FC<ConnectionDetailModalProps> = ({
  connection,
  onClose,
  onUpdateConnection,
  onDeleteConnection,
  relatedMoments,
  onOpenQuickMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedStatus, setEditedStatus] = useState(connection?.followUpStatus || 'today');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [bumpToast, setBumpToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!connection) return null;

  const handleStartEdit = () => {
    setEditedNotes(connection.notes || '');
    setEditedStatus(connection.followUpStatus);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateConnection({
      ...connection,
      notes: editedNotes,
      followUpStatus: editedStatus,
    });
    setIsEditing(false);
  };

  const handleLogAnotherBump = () => {
    triggerHaptic('nfc_handshake');
    const newLog = createNfcExchangeLog(
      'bump',
      connection.eventId,
      connection.eventContext,
      `Re-encounter bump at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );

    const updatedHistory = [...(connection.nfcExchangeHistory || []), newLog];
    const updatedTags = Array.from(new Set([...(connection.tags || []), '#NFCBump']));

    const updated: Connection = {
      ...connection,
      isNfcCaptured: true,
      nfcTimestamp: connection.nfcTimestamp || new Date().toISOString(),
      nfcExchangeHistory: updatedHistory,
      tags: updatedTags,
    };

    onUpdateConnection(updated);
    setBumpToast(`Logged NFC re-encounter bump with ${connection.name}!`);
    setTimeout(() => setBumpToast(null), 3500);
  };

  const handleAddPhoto = (newPhotoUrl: string) => {
    const existingPhotos = connection.photos || [];
    const updatedPhotos = [...existingPhotos, newPhotoUrl];
    onUpdateConnection({
      ...connection,
      photos: updatedPhotos,
      avatarUrl: connection.avatarUrl || newPhotoUrl,
    });
    setIsCameraOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const url = reader.result as string;
          handleAddPhoto(url);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetPrimaryAvatar = (url: string) => {
    onUpdateConnection({
      ...connection,
      avatarUrl: url,
    });
  };

  const handleDeletePhoto = (index: number) => {
    const existingPhotos = connection.photos || [];
    const photoToDelete = existingPhotos[index];
    const updatedPhotos = existingPhotos.filter((_, i) => i !== index);
    
    let newAvatar = connection.avatarUrl;
    if (connection.avatarUrl === photoToDelete) {
      newAvatar = updatedPhotos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    }

    onUpdateConnection({
      ...connection,
      photos: updatedPhotos,
      avatarUrl: newAvatar,
    });
  };

  const handleAiRefreshSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await summarizeConnection(connection.name, connection.company, connection.notes);
      if (res.memoryPoints?.length) {
        onUpdateConnection({
          ...connection,
          conversationMemory: res.memoryPoints,
          tags: Array.from(new Set([...connection.tags, ...(res.suggestedTags || [])])),
        });
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const relationshipColors: Record<string, string> = {
    lead: 'bg-[#ff5c00]/20 text-[#ffb59a] border-[#ff5c00]/40',
    peer: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    mentor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    speaker: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  const allPhotos = Array.from(
    new Set([
      ...(connection.photos || []),
      ...(connection.avatarUrl && !connection.avatarUrl.includes('unsplash.com') ? [connection.avatarUrl] : [])
    ])
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-[#120804] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with portrait and TEDx badge */}
          <div className="relative bg-gradient-to-r from-[#220f06] to-[#150803] p-6 border-b border-white/10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#FF5C00] shadow-xl bg-black flex-shrink-0">
                  <img
                    src={connection.avatarUrl}
                    alt={connection.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[#FF5C00] text-black rounded-lg shadow-md hover:bg-[#ff7a33] transition-colors"
                  title="Snap new photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold font-serif-display text-[#fadcd2]">
                    {connection.name}
                  </h2>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                      relationshipColors[connection.relationship] || relationshipColors.lead
                    }`}
                  >
                    {connection.relationship}
                  </span>
                  {connection.isNfcCaptured && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#ffb59a] border border-[#FF5C00]/40 font-bold flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-[#FF5C00]" />
                      <span>NFC Verified</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#FF5C00] font-medium mt-0.5">
                  {connection.profession} • {connection.company}
                </p>
                <p className="text-xs text-[#e4beb1]/60 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Met at {connection.metTimestamp || '10:00 AM'} ({connection.eventContext})</span>
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

          {/* Action Bar (WhatsApp, Call, Email, LinkedIn, Quick Message) */}
          <div className="p-4 bg-[#180b06] border-b border-white/10 grid grid-cols-4 gap-2">
            {connection.whatsapp || connection.phone ? (
              <a
                href={`https://wa.me/${(connection.whatsapp || connection.phone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#221008] hover:bg-[#32160c] text-[#fadcd2] border border-white/5 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
                <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 opacity-30 text-white cursor-not-allowed"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
              </button>
            )}

            {connection.phone ? (
              <a
                href={`tel:${connection.phone}`}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#221008] hover:bg-[#32160c] text-[#fadcd2] border border-white/5 transition-colors"
              >
                <Phone className="w-5 h-5 text-[#FF5C00]" />
                <span className="text-[10px] font-semibold mt-1">Call</span>
              </a>
            ) : (
              <button
                disabled
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 opacity-30 text-white cursor-not-allowed"
              >
                <Phone className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-1">Call</span>
              </button>
            )}

            {connection.email ? (
              <a
                href={`mailto:${connection.email}?subject=Great%20meeting%20you%20at%20TEDxAkure%202026`}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#221008] hover:bg-[#32160c] text-[#fadcd2] border border-white/5 transition-colors"
              >
                <Mail className="w-5 h-5 text-[#ffb59a]" />
                <span className="text-[10px] font-semibold mt-1">Email</span>
              </a>
            ) : (
              <button
                disabled
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 opacity-30 text-white cursor-not-allowed"
              >
                <Mail className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-1">Email</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenQuickMessage(connection);
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FF5C00] text-black font-bold hover:bg-[#ff7a33] transition-colors shadow-lg active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">AI Draft</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* NFC Bump Toast Banner */}
            <AnimatePresence>
              {bumpToast && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{bumpToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NFC Contact Exchange & Bump History Section */}
            <div className="bg-[#180b06] border border-[#FF5C00]/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF5C00]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#fadcd2] flex items-center gap-1.5">
                      <span>NFC Bump & Handshake Log</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#ffb59a] font-mono">
                        {(connection.nfcExchangeHistory?.length || (connection.isNfcCaptured ? 1 : 0))} Exchanges
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogAnotherBump}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FF5C00]/20 hover:bg-[#FF5C00]/30 text-[#FF5C00] border border-[#FF5C00]/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Log Re-encounter Bump</span>
                </button>
              </div>

              {/* Chronological History Log */}
              {connection.nfcExchangeHistory && connection.nfcExchangeHistory.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {connection.nfcExchangeHistory.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-2.5 rounded-xl bg-[#221008] border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-[#fadcd2] flex items-center gap-2">
                            <span>{log.notes || 'NFC Contact Beam'}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-[#e4beb1]/70 font-mono">
                              {log.deviceType || 'Handset'}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#e4beb1]/60 mt-0.5">
                            Venue: {log.eventName || connection.eventContext || 'Conference Hall'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono font-bold text-[#ffb59a]">
                          {log.timeFormatted || log.timestamp?.slice(11, 16)}
                        </div>
                        <div className="text-[9px] text-[#e4beb1]/50">
                          {log.dateFormatted || log.timestamp?.slice(0, 10)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : connection.isNfcCaptured ? (
                <div className="p-2.5 rounded-xl bg-[#221008] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF5C00]" />
                    <span className="text-[#fadcd2] font-semibold">Initial Web-NFC Handshake</span>
                  </div>
                  <span className="text-[10px] text-[#ffb59a] font-mono">
                    {connection.nfcTimestamp ? new Date(connection.nfcTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : connection.metTimestamp}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-[#e4beb1]/60 italic bg-[#140804] p-2.5 rounded-xl border border-white/5">
                  No NFC bump logged yet. Tap "Log Re-encounter Bump" when you bump phones with {connection.name}.
                </p>
              )}
            </div>

            {/* Photos & Badges Section */}
            <div className="bg-[#180b06] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Saved Photos & Badges ({allPhotos.length})</span>
                  </h3>
                  <p className="text-[11px] text-[#e4beb1]/60">
                    Badge lanyard, selfie, or handshake snaps
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="p-1.5 rounded-lg bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 text-xs font-semibold flex items-center gap-1"
                    title="Take Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#fadcd2] border border-white/10 text-xs font-semibold flex items-center gap-1"
                    title="Upload Photo"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#ffb59a]" />
                    <span className="text-[11px] hidden sm:inline">Upload</span>
                  </button>
                </div>
              </div>

              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                  {allPhotos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/50"
                    >
                      <img
                        src={photoUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                        onClick={() => setSelectedPhotoPreview(photoUrl)}
                      />

                      {connection.avatarUrl === photoUrl && (
                        <div className="absolute top-1 left-1 bg-[#FF5C00] text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                          Main
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        {connection.avatarUrl !== photoUrl && (
                          <button
                            onClick={() => handleSetPrimaryAvatar(photoUrl)}
                            className="p-1.5 bg-[#FF5C00] text-black rounded-lg text-[9px] font-bold hover:bg-[#ff7a33]"
                            title="Make Avatar"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(idx)}
                          className="p-1.5 bg-rose-500/80 text-white rounded-lg text-[9px] font-bold hover:bg-rose-600"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-dashed border-white/20 hover:border-[#FF5C00] flex flex-col items-center justify-center p-3 text-[#e4beb1]/60 hover:text-white transition-colors aspect-square"
                  >
                    <Plus className="w-5 h-5 text-[#FF5C00]" />
                    <span className="text-[10px] mt-1 font-medium">Add Snap</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsCameraOpen(true)}
                  className="py-6 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5C00]/40 transition-colors bg-[#100603]"
                >
                  <Camera className="w-6 h-6 text-[#FF5C00] mb-1" />
                  <p className="text-xs font-semibold text-[#fadcd2]">No photos saved yet</p>
                  <p className="text-[10px] text-[#e4beb1]/50">Tap to snap badge or upload photo</p>
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

            {/* Conversation Memory Section */}
            <div className="bg-[#180b06] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1]">
                    Conversation Memory
                  </h3>
                </div>
                <button
                  onClick={handleAiRefreshSummary}
                  disabled={isSummarizing}
                  className="text-[11px] text-[#FF5C00] font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isSummarizing ? (
                    <span className="w-3 h-3 border border-[#FF5C00] border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Neural Recall
                </button>
              </div>

              <ul className="space-y-2">
                {(connection.conversationMemory && connection.conversationMemory.length > 0
                  ? connection.conversationMemory
                  : [connection.notes || 'Met at TEDxAkure session.']
                ).map((point, idx) => (
                  <li key={idx} className="text-xs text-[#fadcd2] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#FF5C00] font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Raw Notes & Edit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1]">
                  Notes & Follow-up State
                </h3>
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="text-xs text-[#FF5C00] font-semibold hover:underline"
                  >
                    Edit Note
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs text-[#25D366] font-bold hover:underline"
                  >
                    Save Changes
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/20 rounded-xl p-3 text-xs text-[#fadcd2] focus:outline-none focus:border-[#FF5C00]"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#e4beb1]">Status:</label>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value as any)}
                      className="bg-[#0A0A0A] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-[#fadcd2]"
                    >
                      <option value="today">Due Today</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="overdue">Overdue</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#e4beb1]/90 bg-[#140804] p-3.5 rounded-xl border border-white/5 leading-relaxed">
                  {connection.notes || 'No raw notes recorded.'}
                </p>
              )}
            </div>

            {/* Tags */}
            {connection.tags && connection.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] mb-2">
                  Context Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {connection.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#221008] text-[#ffb59a] border border-white/5 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Moments */}
            {relatedMoments.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e4beb1] mb-2">
                  Tagged Moments ({relatedMoments.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {relatedMoments.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl overflow-hidden bg-[#20110a] border border-white/10"
                    >
                      {m.mediaUrl ? (
                        <img src={m.mediaUrl} alt={m.title} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-[#32160c] flex items-center justify-center p-2 text-center text-[10px] text-[#e4beb1]">
                          "{m.caption}"
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-[#fadcd2] truncate">{m.title}</p>
                        <p className="text-[9px] text-[#e4beb1]/60">{m.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Contact action */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[11px] text-[#e4beb1]/50">
                Follow-up scheduled: {connection.followUpDate || 'None'}
              </span>
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDeleteConnection(connection.id);
          setIsConfirmDeleteOpen(false);
          onClose();
        }}
        title="Delete this connection?"
        itemName={`${connection.name} (${connection.company || connection.profession})`}
        itemType="connection"
        description={`This will permanently remove ${connection.name} and all captured conversation notes from your device and cloud database. Any moments tagged with this person will remain safe in your timeline with this contact unlinked.`}
        details={[
          { label: 'Role / Company', value: `${connection.profession} • ${connection.company}` },
          { label: 'Relationship', value: connection.relationship.toUpperCase() },
          {
            label: 'Tagged Moments',
            value: relatedMoments.length ? `${relatedMoments.length} moment(s) unlinked` : 'None',
          },
          { label: 'Storage', value: 'Local Storage & Supabase' },
        ]}
        warningMessage="This action cannot be undone. All contact details and conversation memories will be permanently deleted."
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={handleAddPhoto}
        mode="photo"
        title={`Snap Photo with ${connection.name}`}
      />

      {/* Lightbox / Full Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20">
            <img
              src={selectedPhotoPreview}
              alt="Enlarged"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

