import React, { useState, useMemo, useEffect } from 'react';
import { Connection, FollowUpStatus, FollowUpPipelineStage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Bell,
  BellRing,
  BellOff,
  Send,
  Timer,
  Kanban,
  List,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Linkedin,
  ChevronRight,
  Zap
} from 'lucide-react';
import { notificationService, ScheduledReminder } from '../services/notificationService';
import { triggerHaptic } from '../services/haptics';
import { fetchBatchFollowUps } from '../services/aiService';

interface FollowUpsViewProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onOpenQuickMessage: (connection: Connection) => void;
  onUpdateConnection: (updated: Connection) => void;
  eventName?: string;
  profileName?: string;
}

const PIPELINE_COLUMNS: { id: FollowUpPipelineStage; label: string; color: string; bg: string }[] = [
  { id: 'to-send', label: 'To Send', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { id: 'sent', label: 'Sent', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { id: 'replied', label: 'Replied', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { id: 'meeting-booked', label: 'Meeting Booked', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { id: 'closed-deal', label: 'Deal Closed', color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/20' },
];

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  connections,
  onSelectConnection,
  onOpenQuickMessage,
  onUpdateConnection,
  eventName,
  profileName,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<FollowUpStatus>('today');
  const [isNotifSupported, setIsNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [quickReminderConnId, setQuickReminderConnId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch Outreach modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [batchDrafts, setBatchDrafts] = useState<Array<{ connectionId: string; subject: string; message: string; channel: 'whatsapp' | 'email' | 'linkedin' }>>([]);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  useEffect(() => {
    setIsNotifSupported(notificationService.isSupported());
    setNotifPermission(notificationService.getPermissionStatus());
    setIsNotifEnabled(notificationService.isEnabled());
    setScheduledReminders(notificationService.getScheduledReminders());
  }, []);

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
    const nextPipeline: FollowUpPipelineStage = 
      connection.followUpStatus === 'completed' ? 'to-send' : 'meeting-booked';

    onUpdateConnection({
      ...connection,
      followUpStatus: nextStatus,
      pipelineStage: connection.pipelineStage || nextPipeline,
    });
    triggerHaptic('success');
  };

  const handleAdvancePipeline = (connection: Connection, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    const stages: FollowUpPipelineStage[] = ['to-send', 'sent', 'replied', 'meeting-booked', 'closed-deal'];
    const currentStage = connection.pipelineStage || 'to-send';
    const nextIdx = (stages.indexOf(currentStage) + 1) % stages.length;
    const nextStage = stages[nextIdx];

    onUpdateConnection({
      ...connection,
      pipelineStage: nextStage,
      followUpStatus: nextStage === 'closed-deal' || nextStage === 'meeting-booked' ? 'completed' : connection.followUpStatus,
    });
    showToast(`${connection.name} moved to "${PIPELINE_COLUMNS.find(c => c.id === nextStage)?.label}"`);
  };

  const handleToggleNotifications = async () => {
    if (!isNotifSupported) {
      showToast('Notifications are not supported in this browser environment.');
      return;
    }

    if (notifPermission !== 'granted') {
      const { granted, status } = await notificationService.requestPermission();
      setNotifPermission(status);
      setIsNotifEnabled(granted);
      if (granted) {
        showToast('Push notifications enabled for follow-ups! 🔔');
        notificationService.sendTestNotification();
      } else {
        showToast('Notification permission was declined or blocked.');
      }
    } else {
      const nextState = !isNotifEnabled;
      notificationService.setEnabled(nextState);
      setIsNotifEnabled(nextState);
      triggerHaptic('light');
      showToast(nextState ? 'Reminders active for pending follow-ups.' : 'Follow-up reminders muted.');
    }
  };

  const handleSendTestNotification = () => {
    if (notifPermission !== 'granted') {
      handleToggleNotifications();
      return;
    }
    const sent = notificationService.sendTestNotification();
    if (sent) {
      showToast('Test notification dispatched to your browser!');
    } else {
      showToast('Unable to dispatch notification.');
    }
  };

  const handleSetQuickReminder = (connection: Connection, minutes: number) => {
    if (notifPermission !== 'granted') {
      handleToggleNotifications();
      return;
    }
    notificationService.scheduleReminder(connection, minutes);
    setScheduledReminders(notificationService.getScheduledReminders());
    setQuickReminderConnId(null);
    triggerHaptic('success');
    showToast(`Reminder set for ${connection.name} in ${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`);
  };

  const handleGenerateBatch = async () => {
    setIsBatchModalOpen(true);
    setIsGeneratingBatch(true);
    triggerHaptic('light');
    try {
      const pending = connections.filter((c) => c.followUpStatus !== 'completed');
      const targetConnections = pending.length > 0 ? pending : connections;
      const res = await fetchBatchFollowUps(targetConnections.slice(0, 10), eventName, profileName);
      setBatchDrafts(res.messages);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Batch generation error:', e);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleCopyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    triggerHaptic('medium');
    setTimeout(() => setCopiedDraftId(null), 2500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-5xl mx-auto space-y-6 pb-28 md:pb-12"
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 bg-[var(--bg-surface-card)] border border-[var(--border-accent)] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <BellRing className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-widest uppercase font-mono">
              Action & Dealflow OS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold font-mono border border-[var(--border-accent)]">
              Pro Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white mt-0.5">
            Follow-up & Relationship Pipeline
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Turn serendipitous event connections into executed partnerships, investments, and collaborations.
          </p>
        </div>

        {/* View Switcher & AI Batch Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* List vs Kanban Toggle */}
          <div className="flex items-center bg-[var(--bg-surface-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('list');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-[var(--accent-primary)] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('kanban');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-[var(--accent-primary)] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          {/* AI Batch Outreach Button */}
          <button
            onClick={handleGenerateBatch}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Batch Outreach (1-Tap)
          </button>

          {/* Browser Notification Toggle Control */}
          <button
            onClick={handleToggleNotifications}
            className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isNotifEnabled && notifPermission === 'granted'
                ? 'bg-[var(--bg-surface-subtle)] text-white border-[var(--border-accent)]'
                : 'bg-[var(--bg-surface-card)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
            title="Toggle Browser Push Notifications"
          >
            {isNotifEnabled && notifPermission === 'granted' ? (
              <BellRing className="w-4 h-4 text-[var(--accent-primary)]" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <>
          {/* Filter Status Tabs */}
          <div className="grid grid-cols-4 gap-2 bg-[var(--bg-surface-card)] p-1.5 rounded-2xl border border-[var(--border-subtle)]">
            {[
              { id: 'today', label: 'Today', count: counts.today, color: 'text-[var(--accent-primary)]' },
              { id: 'upcoming', label: 'Upcoming', count: counts.upcoming, color: 'text-blue-400' },
              { id: 'overdue', label: 'Overdue', count: counts.overdue, color: 'text-red-400' },
              { id: 'completed', label: 'Done', count: counts.completed, color: 'text-emerald-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FollowUpStatus)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)] text-black shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/5 ' + tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List Content */}
          {currentList.length === 0 ? (
            <div className="text-center py-16 bg-[var(--bg-surface-card)] rounded-2xl border border-[var(--border-subtle)] space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                No follow-ups currently in "{activeTab}"
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                You're all caught up or no items match this filter category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {currentList.map((item, index) => {
                  const hasReminder = scheduledReminders.some((r) => r.connectionId === item.id);
                  const isReminderMenuOpen = quickReminderConnId === item.id;
                  const currentStage = item.pipelineStage || 'to-send';
                  const stageMeta = PIPELINE_COLUMNS.find(c => c.id === currentStage) || PIPELINE_COLUMNS[0];

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onClick={() => onSelectConnection(item)}
                      className="bg-[var(--bg-surface-card)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all shadow-md group relative"
                    >
                      {/* Person details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--border-subtle)] flex-shrink-0 bg-neutral-900">
                          <img
                            src={item.avatarUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-[var(--accent-primary)] transition-colors">
                              {item.name}
                            </h3>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-bold uppercase tracking-wider font-mono">
                              {item.relationship}
                            </span>

                            {/* Clickable Pipeline Stage Badge */}
                            <button
                              onClick={(e) => handleAdvancePipeline(item, e)}
                              className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10 ${stageMeta.bg} ${stageMeta.color} hover:brightness-125 font-mono`}
                              title="Click to advance dealflow stage"
                            >
                              <span>{stageMeta.label}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>

                            {hasReminder && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--border-accent)] font-semibold flex items-center gap-1 font-mono">
                                <BellRing className="w-2.5 h-2.5 text-[var(--accent-primary)]" />
                                <span>Reminder Set</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--accent-primary)] truncate font-mono">
                            {item.profession} {item.company ? `• ${item.company}` : ''}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-1">
                            "{item.notes || 'Met at active event'}"
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)] justify-between sm:justify-end flex-shrink-0 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Quick Reminder button */}
                        <div className="relative">
                          <button
                            onClick={() => setQuickReminderConnId(isReminderMenuOpen ? null : item.id)}
                            className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                              hasReminder
                                ? 'bg-[var(--bg-surface-subtle)] text-white border-[var(--border-accent)]'
                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] border-[var(--border-subtle)]'
                            }`}
                            title="Set browser reminder"
                          >
                            <Timer className="w-4 h-4 text-[var(--accent-primary)]" />
                          </button>

                          {/* Reminder Dropdown Menu */}
                          {isReminderMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-44 bg-[var(--bg-surface-card)] border border-[var(--border-accent)] rounded-xl p-1.5 shadow-2xl z-30 space-y-1">
                              <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] px-2 py-1 font-mono">
                                Remind Me In:
                              </p>
                              {[
                                { label: '15 Minutes', mins: 15 },
                                { label: '1 Hour', mins: 60 },
                                { label: '3 Hours', mins: 180 },
                                { label: 'Tomorrow (9 AM)', mins: 1440 },
                              ].map((opt) => (
                                <button
                                  key={opt.mins}
                                  onClick={() => handleSetQuickReminder(item, opt.mins)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white font-medium transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => toggleComplete(item)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            item.followUpStatus === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.followUpStatus === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span>{item.followUpStatus === 'completed' ? 'Completed' : 'Mark Done'}</span>
                        </button>

                        <button
                          onClick={() => onOpenQuickMessage(item)}
                          className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Message</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colItems = connections.filter((c) => (c.pipelineStage || 'to-send') === col.id);
            return (
              <div
                key={col.id}
                className="bg-[var(--bg-surface-card)] rounded-2xl border border-[var(--border-subtle)] p-3 flex flex-col min-w-[200px] h-[550px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] mb-3">
                  <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 font-bold font-mono">
                    {colItems.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectConnection(item)}
                      className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-white/[0.08] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] cursor-pointer transition-all space-y-2 group shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 bg-neutral-800"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[var(--accent-primary)]">{item.name}</h4>
                          <p className="text-[10px] text-[var(--text-secondary)] truncate">{item.company || item.profession}</p>
                        </div>
                      </div>

                      {/* Quick Action footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickMessage(item);
                          }}
                          className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Sparkles className="w-3 h-3" />
                          Message
                        </button>

                        <button
                          onClick={(e) => handleAdvancePipeline(item, e)}
                          className="text-neutral-400 hover:text-white flex items-center gap-0.5 font-bold"
                          title="Advance stage"
                        >
                          <span>Move</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-center p-2 text-[11px] text-neutral-600 border border-dashed border-white/5 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Batch Outreach Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-[var(--bg-surface-card)] border border-[var(--border-accent)] shadow-2xl flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-serif-display">AI Batch Follow-Up Engine</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Generated bespoke follow-ups across WhatsApp, Email, & LinkedIn for your recent connections
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {isGeneratingBatch ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-neutral-400">Synthesizing personalized notes and context memory...</p>
                </div>
              ) : batchDrafts.length > 0 ? (
                <div className="space-y-3">
                  {batchDrafts.map((draft) => {
                    const conn = connections.find((c) => c.id === draft.connectionId);
                    return (
                      <div
                        key={draft.connectionId}
                        className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{conn?.name || 'Contact'}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-mono">({conn?.company || conn?.profession})</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-bold uppercase text-neutral-300 font-mono">
                            {draft.channel}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-subtle)]">
                          {draft.message}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleCopyDraft(draft.connectionId, draft.message)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 transition-all"
                          >
                            {copiedDraftId === draft.connectionId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              const msg = encodeURIComponent(draft.message);
                              if (draft.channel === 'whatsapp') window.open(`https://wa.me/?text=${msg}`, '_blank');
                              else if (draft.channel === 'email') window.open(`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${msg}`, '_blank');
                              else window.open('https://www.linkedin.com/messaging/', '_blank');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-black font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            {draft.channel === 'whatsapp' ? <MessageCircle className="w-3.5 h-3.5" /> : draft.channel === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Linkedin className="w-3.5 h-3.5" />}
                            Send via {draft.channel.toUpperCase()}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400">
                  No pending connections found for batch drafting.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
