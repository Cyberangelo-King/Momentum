import React, { useState } from 'react';
import { Connection, Moment, Idea, UserProfile } from '../types';
import {
  exportConnectionsCSV,
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
  RefreshCw 
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

  const handleExportCSV = () => {
    exportConnectionsCSV(connections);
    showNotice('Connections CSV downloaded successfully!');
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
        <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
          Data Sovereignty
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
          Export & Archival OS
        </h1>
        <p className="text-xs text-[#e4beb1]/70 mt-1">
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
        <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
              Personal Journal (PDF)
            </h3>
            <p className="text-xs text-[#e4beb1]/70 leading-relaxed">
              Multi-page PDF featuring executive conference synthesis, priority connections directory, and speaker quotes.
            </p>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={pdfProgress !== null}
            className="w-full py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
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
        <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#ffb59a] flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
              Social Photo Collage
            </h3>
            <p className="text-xs text-[#e4beb1]/70 leading-relaxed">
              Generate an aesthetic grid of your best captured event photographs and keynote quotes for social media.
            </p>
          </div>

          <button
            onClick={onOpenCollage}
            className="w-full py-2.5 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/15 hover:bg-[#381a0e] transition-all flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF5C00]" />
            <span>Launch Collage Studio</span>
          </button>
        </div>

        {/* CRM CSV */}
        <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#25D366] flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
              CRM Contact SpreadSheet (CSV)
            </h3>
            <p className="text-xs text-[#e4beb1]/70 leading-relaxed">
              Clean, structured CSV containing all {connections.length} contacts, phone numbers, LinkedIn URLs, and follow-up dates.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/15 hover:bg-[#381a0e] transition-all flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-[#25D366]" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Media Archive ZIP */}
        <div className="bg-[#140b07] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-blue-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif-display text-[#fadcd2]">
              Media Archive Package (ZIP)
            </h3>
            <p className="text-xs text-[#e4beb1]/70 leading-relaxed">
              Complete ZIP archive containing all raw photos, markdown journal notes, and metadata files.
            </p>
          </div>

          <button
            onClick={handleExportZIP}
            disabled={zipProgress !== null}
            className="w-full py-2.5 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/15 hover:bg-[#381a0e] transition-all flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-50"
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
      <div className="bg-[#140b07] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#fadcd2]">Raw Database Export (JSON)</h4>
          <p className="text-xs text-[#e4beb1]/60">Full unlossy JSON serialization of applet state</p>
        </div>
        <button
          onClick={handleExportJSON}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#28130a] text-[#fadcd2] border border-white/10 text-xs font-semibold hover:bg-[#381a0e]"
        >
          Export Raw JSON
        </button>
      </div>

      {/* Reset Conference Data */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-red-400">Reset Local Conference Data</h4>
          <p className="text-[11px] text-[#e4beb1]/50">
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
