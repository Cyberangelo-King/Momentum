import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  itemType?: 'memory' | 'connection' | 'idea' | 'batch' | 'item';
  description?: string;
  details?: { label: string; value: string | number }[];
  warningMessage?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'memory',
  description,
  details = [],
  warningMessage = 'This action is permanent and cannot be undone. Associated metadata and relationships will be safely updated.',
  isDeleting = false,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default to prevent accidental keyboard submit
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    triggerHaptic('heavy');
    onConfirm();
  };

  const handleCancelClick = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-[#120804] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden text-[#fadcd2] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1a0c06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-bold font-serif-display text-[#fadcd2]">
                {title}
              </h2>
              <p className="text-xs text-[#e4beb1]/60">Permanent Destructive Action</p>
            </div>
          </div>
          <button
            onClick={handleCancelClick}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Target Item Name Banner */}
          {itemName && (
            <div className="p-3.5 rounded-2xl bg-[#1e0e07] border border-white/10">
              <span className="text-[10px] text-[#FF5C00] font-bold uppercase tracking-wider block mb-0.5">
                Target {itemType.toUpperCase()}
              </span>
              <p className="text-sm font-semibold text-white truncate">{itemName}</p>
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-[#e4beb1]/85 leading-relaxed">
            {description ||
              `Are you sure you want to delete this ${itemType}? It will be permanently removed from your local storage and cloud database.`}
          </p>

          {/* Key Details Grid */}
          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
              {details.map((d, idx) => (
                <div key={idx} className="space-y-0.5">
                  <span className="text-[10px] text-[#e4beb1]/50 font-bold uppercase tracking-wider block">
                    {d.label}
                  </span>
                  <span className="text-xs font-semibold text-[#fadcd2] truncate block">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Warning notice */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-200/90 leading-tight font-medium">
              {warningMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/10 bg-[#160a05] flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleCancelClick}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#fadcd2] transition-colors border border-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : `Delete ${itemType === 'memory' ? 'Memory' : itemType === 'connection' ? 'Contact' : itemType === 'idea' ? 'Insight' : 'Permanently'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
