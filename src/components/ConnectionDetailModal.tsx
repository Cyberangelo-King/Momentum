import React, { useState } from 'react';
import { Connection, Moment } from '../types';
import { generateQuickMessage, summarizeConnection } from '../services/aiService';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with portrait and TEDx badge */}
        <div className="relative bg-[#20110a] p-6 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#FF5C00] shadow-xl bg-[#0A0A0A] flex-shrink-0">
              <img
                src={connection.avatarUrl}
                alt={connection.name}
                className="w-full h-full object-cover"
              />
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
              </div>
              <p className="text-sm text-[#FF5C00] font-medium mt-0.5">
                {connection.profession} • {connection.company}
              </p>
              <p className="text-xs text-[#e4beb1]/60 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                Met at {connection.metTimestamp || '10:00 AM'} ({connection.eventContext})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Action Bar (WhatsApp, Call, Email, LinkedIn, Quick Message) */}
        <div className="p-4 bg-[#1a0c06] border-b border-white/10 grid grid-cols-4 gap-2">
          {connection.whatsapp || connection.phone ? (
            <a
              href={`https://wa.me/${(connection.whatsapp || connection.phone || '').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#fadcd2] border border-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[#25D366] text-xl">chat</span>
              <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 opacity-40 text-white"
            >
              <span className="material-symbols-outlined text-xl">chat</span>
              <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
            </button>
          )}

          {connection.phone ? (
            <a
              href={`tel:${connection.phone}`}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#fadcd2] border border-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[#FF5C00] text-xl">call</span>
              <span className="text-[10px] font-semibold mt-1">Call</span>
            </a>
          ) : (
            <button
              disabled
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 opacity-40 text-white"
            >
              <span className="material-symbols-outlined text-xl">call</span>
              <span className="text-[10px] font-semibold mt-1">Call</span>
            </button>
          )}

          {connection.email ? (
            <a
              href={`mailto:${connection.email}?subject=Great%20meeting%20you%20at%20TEDxAkure%202026`}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#fadcd2] border border-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[#ffb59a] text-xl">mail</span>
              <span className="text-[10px] font-semibold mt-1">Email</span>
            </a>
          ) : (
            <button
              disabled
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 opacity-40 text-white"
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span className="text-[10px] font-semibold mt-1">Email</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenQuickMessage(connection);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#FF5C00] text-black font-bold hover:bg-[#ff7a33] transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-xl font-bold">auto_fix_high</span>
            <span className="text-[10px] font-bold mt-1">AI Draft</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Conversation Memory Section */}
          <div className="bg-[#180b06] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF5C00] text-lg">psychology</span>
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
                  <span className="material-symbols-outlined text-xs">refresh</span>
                )}
                Gemini Recall
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
              <p className="text-xs text-[#e4beb1]/90 bg-[#100603] p-3 rounded-xl border border-white/5 leading-relaxed">
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
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#271812] text-[#ffb59a] border border-white/5 font-medium"
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
              onClick={() => {
                if (confirm(`Remove ${connection.name} from connections?`)) {
                  onDeleteConnection(connection.id);
                  onClose();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
