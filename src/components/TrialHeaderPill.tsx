import React from 'react';
import { Clock, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { TrialQuotaMetrics } from '../types';

interface TrialHeaderPillProps {
  metrics: TrialQuotaMetrics;
  onClick: () => void;
}

export const TrialHeaderPill: React.FC<TrialHeaderPillProps> = ({ metrics, onClick }) => {
  if (!metrics.isTrial) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border transition-all cursor-pointer shadow-sm active:scale-95 ${
        metrics.isExpired
          ? 'bg-rose-950/80 border-rose-500/50 text-rose-200 animate-pulse'
          : metrics.storagePercent > 85
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
          : 'bg-sky-500/15 border-sky-400/40 text-sky-200 hover:bg-sky-500/25'
      }`}
      title="Click to view 1-Day Trial status, storage and bandwidth metrics"
    >
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          metrics.isExpired ? 'bg-rose-400' : 'bg-sky-400'
        }`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          metrics.isExpired ? 'bg-rose-500' : 'bg-sky-400'
        }`} />
      </span>

      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      <span className="font-bold text-white">24h Trial:</span>
      <span className="text-sky-300">{metrics.remainingTimeFormatted}</span>

      <span className="hidden sm:inline-block text-[10px] text-sky-200/60 pl-1 border-l border-sky-400/20">
        {metrics.storagePercent}% Storage
      </span>
    </button>
  );
};
