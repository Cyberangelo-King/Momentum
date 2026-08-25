import React, { useState } from 'react';
import { Connection, Moment, Idea, UserProfile } from '../types';
import {
  exportConnectionsCSV,
  exportNfcConnectionsCSV,
  exportFullJSON,
  generatePersonalJournalPDF,
  exportMediaArchiveZIP,
} from '../services/exportService';
import { 
  FileText, 
  LayoutGrid, 
  SlidersHorizontal, 
  Table, 
  Download, 
  Archive, 
  CheckCircle2, 
  FileJson, 
  AlertTriangle, 
  RefreshCw,
  Smartphone,
  Radio
} from 'lucide-react';

interface ExportsViewProps {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  profile: UserProfile;
  onOpenCollage: () => void;
  onResetData: () => void;
}

export const ExportsView: React.FC<ExportsViewProps> = ({
  connections,
  moments,
  ideas,
  profile,
  onOpenCollage,
  onResetData,
}) => {
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const nfcCapturedCount = connections.filter(
    (c) => c.isNfcCaptured || (c.nfcExchangeHistory && c.nfcExchangeHistory.length > 0) || (c.tags && c.tags.includes('#NFCBump'))
  ).length;

  const handleExportCSV = () => {
    exportConnectionsCSV(connections);
    showNotice('Connections CSV downloaded successfully!');
  };

  const handleExportNfcCSV = () => {
    exportNfcConnectionsCSV(connections);
    showNotice(`Exported ${nfcCapturedCount > 0 ? nfcCapturedCount : connections.length} NFC-captured connection leads with handshake logs!`);
  };

  const handleExportJSON = () => {
    exportFullJSON(connections, moments, ideas, profile);
    showNotice('Full CRM JSON database downloaded!');
  };

  const handleGeneratePDF = async () => {
    setPdfProgress(10);
    try {
      await generatePersonalJournalPDF(connections, moments, ideas, profile, (percent) => {
        setPdfProgress(percent);
      });
      showNotice('Personal Journal PDF generated and saved!');
    } catch (err) {
      console.error(err);
      showNotice('Failed to generate PDF');
    } finally {
      setTimeout(() => setPdfProgress(null), 1500);
    }
  };

  const handleExportZIP = async () => {
    setZipProgress(10);
    try {
      await exportMediaArchiveZIP(connections, moments, ideas, (percent) => {
        setZipProgress(percent);
      });
      showNotice('Media Archive ZIP created and downloaded!');
    } catch (err) {
      console.error(err);
      showNotice('Failed to package ZIP');
    } finally {
      setTimeout(() => setZipProgress(null), 1500);
    }
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase font-mono">
          Data Sovereignty
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
          Export & Archival OS
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Download your complete event database in open formats for your CRM, personal vault, and portfolio.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {statusMessage}
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PDF Document */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-white">
              Personal Journal (PDF)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Multi-page PDF featuring executive conference synthesis, priority connections directory, and speaker quotes.
            </p>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={pdfProgress !== null}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {pdfProgress !== null ? (
              <span>Compiling PDF ({pdfProgress}%)...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>

        {/* Photo Collage */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-white">
              Social Photo Collage
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Generate an aesthetic grid of your best captured event photographs and keynote quotes for social media.
            </p>
          </div>

          <button
            onClick={onOpenCollage}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] text-white border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-all flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Launch Collage Studio</span>
          </button>
        </div>

        {/* CRM CSV */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-white">
              CRM Contact SpreadSheet (CSV)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Clean, structured CSV containing all {connections.length} contacts, phone numbers, LinkedIn URLs, and follow-up dates.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] text-white border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-all flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Full CSV</span>
          </button>
        </div>

        {/* NFC Bumped Leads CSV */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden group">
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--border-accent)] text-[var(--accent-primary)] text-[10px] font-bold font-mono">
            {nfcCapturedCount} Bumped
          </div>

          <div className="space-y-2">
            <div className="relative w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-display text-white flex items-center gap-1.5">
              <span>NFC Bumped Leads (CSV)</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Filtered CSV export of all verified Web-NFC phone bumped connections with timestamps, serial tags, and interaction counts.
            </p>
          </div>

          <button
            onClick={handleExportNfcCSV}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Export NFC Bumped CSV ({nfcCapturedCount})</span>
          </button>
        </div>

        {/* Media Archive ZIP */}
        <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-white">
              Media Archive Package (ZIP)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Complete ZIP archive containing all raw photos, markdown journal notes, and metadata files.
            </p>
          </div>

          <button
            onClick={handleExportZIP}
            disabled={zipProgress !== null}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] text-white border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-all flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-50"
          >
            {zipProgress !== null ? (
              <span>Packaging ZIP ({zipProgress}%)...</span>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-400" />
                <span>Download Archive (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* JSON Full Dump */}
      <div className="bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Raw Database Export (JSON)</h4>
          <p className="text-xs text-[var(--text-secondary)]">Full unlossy JSON serialization of applet state</p>
        </div>
        <button
          onClick={handleExportJSON}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--bg-surface-subtle)] text-white border border-[var(--border-subtle)] text-xs font-semibold hover:border-[var(--border-accent)] transition-colors"
        >
          Export Raw JSON
        </button>
      </div>

      {/* Reset Conference Data */}
      <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-red-400">Reset Local Conference Data</h4>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Re-populate initial sample state for TEDxAkure 2026.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset conference data back to initial TEDxAkure 2026 state?')) {
              onResetData();
              showNotice('Conference data restored to original state!');
            }
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/40 text-red-300 border border-red-800/40 text-xs font-semibold hover:bg-red-900/40"
        >
          Reset Conference State
        </button>
      </div>
    </div>
  );
};
