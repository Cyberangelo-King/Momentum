import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  HardDrive, 
  Activity, 
  Users, 
  Camera, 
  Lightbulb, 
  FileText, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';
import { TrialQuotaMetrics, Connection, Moment, Idea, Note, UserProfile } from '../types';
import { exportTrialDataZipOrJson, endTrialSession } from '../services/trialService';
import { exportConnectionsCSV } from '../services/exportService';
import { triggerHaptic } from '../services/haptics';

interface TrialManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: TrialQuotaMetrics;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes: Note[];
  profile: UserProfile;
  onEndTrial: () => void;
}

export const TrialManagerModal: React.FC<TrialManagerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  connections,
  moments,
  ideas,
  notes,
  profile,
  onEndTrial,
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    triggerHaptic('light');
    exportTrialDataZipOrJson(connections, moments, ideas, notes, profile);
  };

  const handleExportCSV = () => {
    triggerHaptic('light');
    exportConnectionsCSV(connections);
  };

  const handleConfirmEndTrial = () => {
    triggerHaptic('warning');
    if (window.confirm('Are you sure you want to end your 1-day guest trial? Be sure you downloaded your data first.')) {
      endTrialSession();
      onEndTrial();
      onClose();
    }
  };

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-[var(--text-primary)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-serif-display tracking-tight text-white">
                    1-Day Guest Trial Pass
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold uppercase">
                    24h Sandbox
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Safe exploratory workspace with bandwidth and storage guardrails.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Close trial modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Live Expiration Countdown Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Session Expiration Timer</span>
                </span>
                <span className="font-mono font-bold text-sky-300 text-sm">
                  {metrics.remainingTimeFormatted}
                </span>
              </div>

              {/* Progress bar representing remaining percentage of the 24 hours */}
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(100, (metrics.remainingTimeMs / (24 * 60 * 60 * 1000)) * 100))}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-sky-200/70 leading-normal">
                Guest trials automatically reset after 24 hours to prevent device memory accumulation. Download your data before expiration.
              </p>
            </div>

            {/* Quota & Guardrails Status Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                Storage & Bandwidth Guardrails
              </h3>

              {/* Storage Meter */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    <span>Local Sandbox Storage</span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <strong className="text-white">{formatMB(metrics.storageUsedBytes)} MB</strong> / {formatMB(metrics.storageQuotaBytes)} MB ({metrics.storagePercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.storagePercent > 85 ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, metrics.storagePercent)}%` }}
                  />
                </div>
              </div>

              {/* Bandwidth Transfer Meter */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Session Bandwidth Meter</span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <strong className="text-white">{formatMB(metrics.bandwidthUsedBytes)} MB</strong> / {formatMB(metrics.bandwidthQuotaBytes)} MB ({metrics.bandwidthPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, metrics.bandwidthPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Entity Record Limits */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                Sandbox Entity Capacities
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-white">Contacts</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {metrics.connectionsCount}/{metrics.maxConnections}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span className="text-xs text-white">Moments</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-300">
                    {metrics.momentsCount}/{metrics.maxMoments}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white">Ideas</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {metrics.ideasCount}/{metrics.maxIdeas}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white">Notes</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {metrics.notesCount}/{metrics.maxNotes}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                Export & Preserve Your Data
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Leads CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Full Session Backup (JSON)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer with End Trial / Upgrade Option */}
          <div className="p-4 sm:p-5 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleConfirmEndTrial}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Trial Session</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all text-black bg-[var(--accent-primary)] hover:brightness-110 shadow-md active:scale-95"
            >
              Continue Exploring
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
