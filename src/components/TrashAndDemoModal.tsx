import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Check, Sparkles, X, Database, ShieldAlert } from 'lucide-react';
import { Connection, Moment, Idea } from '../types';
import { sendDemoDataToTrash, permanentlyDeleteDemoData, restoreAllDemoData } from '../services/storage';

interface TrashAndDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  onDataRefresh: (newConn: Connection[], newMoments: Moment[], newIdeas: Idea[]) => void;
}

export const TrashAndDemoModal: React.FC<TrashAndDemoModalProps> = ({
  isOpen,
  onClose,
  connections,
  moments,
  ideas,
  onDataRefresh,
}) => {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoConnectionsCount = connections.filter((c) => c.isDemo && !c.inTrash).length;
  const demoMomentsCount = moments.filter((m) => m.isDemo && !m.inTrash).length;
  const demoIdeasCount = ideas.filter((i) => i.isDemo && !i.inTrash).length;
  const totalDemoActive = demoConnectionsCount + demoMomentsCount + demoIdeasCount;

  const trashedConnectionsCount = connections.filter((c) => c.inTrash).length;
  const trashedMomentsCount = moments.filter((m) => m.inTrash).length;
  const trashedIdeasCount = ideas.filter((i) => i.inTrash).length;
  const totalTrashed = trashedConnectionsCount + trashedMomentsCount + trashedIdeasCount;

  const handleSendDemoToTrash = () => {
    const res = sendDemoDataToTrash();
    const updatedConn = connections.map((c) => (c.isDemo ? { ...c, inTrash: true } : c));
    const updatedMoments = moments.map((m) => (m.isDemo ? { ...m, inTrash: true } : m));
    const updatedIdeas = ideas.map((i) => (i.isDemo ? { ...i, inTrash: true } : i));

    onDataRefresh(updatedConn, updatedMoments, updatedIdeas);
    setSuccessNotice(`Moved ${totalDemoActive} demo sample items to Trash Bin.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleRestoreDemoData = () => {
    restoreAllDemoData();
    const updatedConn = connections.map((c) => (c.isDemo ? { ...c, inTrash: false } : c));
    const updatedMoments = moments.map((m) => (m.isDemo ? { ...m, inTrash: false } : m));
    const updatedIdeas = ideas.map((i) => (i.isDemo ? { ...i, inTrash: false } : i));

    onDataRefresh(updatedConn, updatedMoments, updatedIdeas);
    setSuccessNotice('Restored all demo records.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handlePermanentlyDeleteDemo = () => {
    permanentlyDeleteDemoData();
    const cleanConn = connections.filter((c) => !c.isDemo);
    const cleanMoments = moments.filter((m) => !m.isDemo);
    const cleanIdeas = ideas.filter((i) => !i.isDemo);

    onDataRefresh(cleanConn, cleanMoments, cleanIdeas);
    setConfirmDeleteAll(false);
    setSuccessNotice('Permanently deleted all demo records. Clean slate ready for TEDxAkure 2026!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleClearAllData = () => {
    onDataRefresh([], [], []);
    localStorage.setItem('momentum_connections_v1', JSON.stringify([]));
    localStorage.setItem('momentum_moments_v1', JSON.stringify([]));
    localStorage.setItem('momentum_ideas_v1', JSON.stringify([]));
    setConfirmDeleteAll(false);
    setSuccessNotice('All data wiped clean. Your workspace is 100% fresh!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Demo Data & Trash Bin
              </h2>
              <p className="text-xs text-neutral-400">Manage sample data and clean slate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successNotice && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Current Stats Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <p className="text-[11px] text-neutral-400 font-semibold uppercase">Active Demo Items</p>
              <p className="text-2xl font-bold text-white mt-1">{totalDemoActive}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                {demoConnectionsCount} People • {demoMomentsCount} Moments • {demoIdeasCount} Ideas
              </p>
            </div>
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <p className="text-[11px] text-neutral-400 font-semibold uppercase">Items In Trash</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{totalTrashed}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Can be restored or wiped</p>
            </div>
          </div>

          {/* Action 1: Move Demo Data to Trash */}
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Move Demo Data to Trash</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Hides sample demo profiles and moments so you only see people you actually meet.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSendDemoToTrash}
                disabled={totalDemoActive === 0}
                className="flex-1 py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash ({totalDemoActive})</span>
              </button>
              {totalTrashed > 0 && (
                <button
                  onClick={handleRestoreDemoData}
                  className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Demo</span>
                </button>
              )}
            </div>
          </div>

          {/* Action 2: Permanently Wipe Demo Data */}
          <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Permanent Clean Slate
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Permanently deletes all demo mock data from your device and Supabase database.
              </p>
            </div>

            {!confirmDeleteAll ? (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete All Demo Data</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-950/60 border border-rose-500/60 rounded-xl space-y-2">
                <p className="text-xs text-rose-200 font-medium text-center">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePermanentlyDeleteDemo}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Yes, Delete Demo Data
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="py-2 px-3 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#141414] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
