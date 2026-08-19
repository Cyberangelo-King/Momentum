import React, { useState, useMemo } from 'react';
import { Connection, FollowUpStatus } from '../types';

interface FollowUpsViewProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickMessage: (connection: Connection) => void;
  onUpdateConnection: (updated: Connection) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  connections,
  onSelectConnection,
  onOpenQuickMessage,
  onUpdateConnection,
}) => {
  const [activeTab, setActiveTab] = useState<FollowUpStatus>('today');

  const counts = useMemo(() => {
    return {
      today: connections.filter((c) => c.followUpStatus === 'today').length,
      upcoming: connections.filter((c) => c.followUpStatus === 'upcoming').length,
      overdue: connections.filter((c) => c.followUpStatus === 'overdue').length,
      completed: connections.filter((c) => c.followUpStatus === 'completed').length,
    };
  }, [connections]);

  const currentList = useMemo(() => {
    return connections.filter((c) => c.followUpStatus === activeTab);
  }, [connections, activeTab]);

  const toggleComplete = (connection: Connection) => {
    const nextStatus: FollowUpStatus =
      connection.followUpStatus === 'completed' ? 'today' : 'completed';
    onUpdateConnection({
      ...connection,
      followUpStatus: nextStatus,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 md:pb-12">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[#FF5C00] tracking-widest uppercase">
          Action Orientation
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-[#fadcd2] mt-0.5">
          Follow-up Tracker
        </h1>
        <p className="text-xs text-[#e4beb1]/70 mt-1">
          Turn serendipitous event connections into enduring partnerships and collaborations.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-[#140b07] p-1 rounded-2xl border border-white/10">
        {[
          { id: 'today', label: 'Today', count: counts.today, color: 'text-[#FF5C00]' },
          { id: 'upcoming', label: 'Upcoming', count: counts.upcoming, color: 'text-blue-400' },
          { id: 'overdue', label: 'Overdue', count: counts.overdue, color: 'text-red-400' },
          { id: 'completed', label: 'Done', count: counts.completed, color: 'text-emerald-400' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FollowUpStatus)}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
              activeTab === tab.id
                ? 'bg-[#FF5C00] text-black shadow-md'
                : 'text-[#e4beb1]/70 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/5 ' + tab.color
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-[#140b07] rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 text-emerald-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <p className="text-sm font-semibold text-[#fadcd2]">
            No follow-ups currently in "{activeTab}"
          </p>
          <p className="text-xs text-[#e4beb1]/60 max-w-xs mx-auto">
            You're all caught up or no items match this filter category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectConnection(item)}
              className="bg-[#140b07] hover:bg-[#20110a] border border-white/10 hover:border-[#FF5C00]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all shadow-md"
            >
              {/* Person details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                  <img
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#fadcd2] truncate">{item.name}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#271812] text-[#ffb59a] font-bold uppercase tracking-wider">
                      {item.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-[#FF5C00] truncate">
                    {item.profession} • {item.company}
                  </p>
                  <p className="text-[11px] text-[#e4beb1]/70 mt-1 line-clamp-1">
                    "{item.notes || 'Met at TEDxAkure'}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 justify-between sm:justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleComplete(item)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    item.followUpStatus === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-[#e4beb1]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {item.followUpStatus === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{item.followUpStatus === 'completed' ? 'Completed' : 'Mark Done'}</span>
                </button>

                <button
                  onClick={() => onOpenQuickMessage(item)}
                  className="px-3.5 py-2 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm font-bold">auto_awesome</span>
                  <span>AI Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
