import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Plus,
  Check,
  Globe,
  MapPin,
  Users,
  Layers,
  Trash2,
  Copy,
  ChevronRight,
  RefreshCw,
  Zap,
  Tag,
  Clock,
  Briefcase,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventConfig, EventSession, EventTemplatePreset, EventColorTheme } from '../types';
import { eventTemplatePresets } from '../data/eventTemplates';
import { parseAgendaText, fetchEventIcebreakers } from '../services/aiService';
import { triggerHaptic } from '../services/haptics';

interface EventHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: EventConfig;
  events: EventConfig[];
  onSelectEvent: (event: EventConfig) => void;
  onCreateFromPreset: (preset: EventTemplatePreset, overrides?: Partial<EventConfig>) => void;
  onCreateCustomEvent: (eventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (updated: EventConfig) => void;
  onDeleteEvent: (eventId: string) => void;
  onDuplicateEvent: (eventId: string) => void;
}

type TabType = 'my-events' | 'create-preset' | 'ai-agenda-import' | 'custom-builder' | 'manage-sessions' | 'memory-bank';

const THEME_OPTIONS: Array<{ key: EventColorTheme; name: string; primary: string; accent: string; bg: string }> = [
  { key: 'tangerine', name: 'Electric Tangerine', primary: '#FF5C00', accent: '#ff7a33', bg: 'bg-[#FF5C00]' },
  { key: 'cyber-blue', name: 'Cyber Blue', primary: '#3B82F6', accent: '#60A5FA', bg: 'bg-[#3B82F6]' },
  { key: 'emerald', name: 'Emerald Pulse', primary: '#10B981', accent: '#34D399', bg: 'bg-[#10B981]' },
  { key: 'purple', name: 'Neon Purple', primary: '#8B5CF6', accent: '#A78BFA', bg: 'bg-[#8B5CF6]' },
  { key: 'amber', name: 'Executive Gold', primary: '#F59E0B', accent: '#FBBF24', bg: 'bg-[#F59E0B]' },
  { key: 'rose', name: 'Rose Cyber', primary: '#EC4899', accent: '#F472B6', bg: 'bg-[#EC4899]' },
];

export const EventHubModal: React.FC<EventHubModalProps> = ({
  isOpen,
  onClose,
  activeEvent,
  events,
  onSelectEvent,
  onCreateFromPreset,
  onCreateCustomEvent,
  onUpdateEvent,
  onDeleteEvent,
  onDuplicateEvent,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('my-events');

  // Custom Event Form State
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [tagline, setTagline] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [eventType, setEventType] = useState<EventConfig['eventType']>('conference');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetConnections, setTargetConnections] = useState(50);
  const [stagesInput, setStagesInput] = useState('Main Stage, Workshop A, Fireside Pavilion');
  const [selectedTheme, setSelectedTheme] = useState<EventColorTheme>('tangerine');

  // AI Agenda Parser State
  const [agendaRawText, setAgendaRawText] = useState('');
  const [isParsingAgenda, setIsParsingAgenda] = useState(false);
  const [parsedSessionsPreview, setParsedSessionsPreview] = useState<EventSession[]>([]);
  const [parsedStagesPreview, setParsedStagesPreview] = useState<string[]>([]);
  const [agendaEventName, setAgendaEventName] = useState('');

  // Manage Sessions State (for editing active event)
  const [editingEvent, setEditingEvent] = useState<EventConfig>(activeEvent);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionSpeaker, setNewSessionSpeaker] = useState('');
  const [newSessionRole, setNewSessionRole] = useState('');
  const [newSessionTime, setNewSessionTime] = useState('10:00 AM');
  const [newSessionStage, setNewSessionStage] = useState(activeEvent.stages[0] || 'Main Stage');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [isGeneratingIcebreakers, setIsGeneratingIcebreakers] = useState(false);

  // Sync editingEvent with activeEvent when opened
  React.useEffect(() => {
    setEditingEvent(activeEvent);
  }, [activeEvent]);

  if (!isOpen) return null;

  const handleParseAgenda = async () => {
    if (!agendaRawText.trim()) return;
    setIsParsingAgenda(true);
    triggerHaptic('medium');
    try {
      const res = await parseAgendaText(agendaRawText, agendaEventName || 'New Event', 'Main Stage');
      setParsedSessionsPreview(res.sessions);
      setParsedStagesPreview(res.detectedStages);
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to parse agenda', err);
    } finally {
      setIsParsingAgenda(false);
    }
  };

  const handleCreateFromAgendaImport = () => {
    if (parsedSessionsPreview.length === 0) return;
    triggerHaptic('success');

    const themeObj = THEME_OPTIONS.find((t) => t.key === selectedTheme) || THEME_OPTIONS[0];
    const newEventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: agendaEventName || 'Imported Conference',
      year: new Date().getFullYear().toString(),
      tagline: 'AI-Synthesized Event Agenda',
      themeDescription: 'Extracted directly from conference program timetable.',
      eventType: 'conference',
      startDate: new Date().toISOString().split('T')[0],
      location: location || 'Convention Center',
      venue: venue || 'Main Arena',
      city: 'Global',
      country: '',
      targetConnections: 50,
      stages: parsedStagesPreview.length > 0 ? parsedStagesPreview : ['Main Stage', 'Breakout Track'],
      branding: {
        themeKey: selectedTheme,
        primaryColor: themeObj.primary,
        accentColor: themeObj.accent,
        badgeBgColor: `${themeObj.primary}25`,
        badgeTextColor: themeObj.primary,
        bannerGradient: `from-[${themeObj.primary}33] via-[#1a0c06] to-[#0a0a0a]`,
        taglineColor: '#fadcd2',
      },
      sessions: parsedSessionsPreview,
      customIcebreakers: [
        'What session topic on today’s agenda are you most eager to apply in practice?',
        'Which presentation gave you the most actionable insight so far?',
      ],
      isArchived: false,
      isCustom: true,
    };

    onCreateCustomEvent(newEventData);
    setAgendaRawText('');
    setParsedSessionsPreview([]);
    setActiveTab('my-events');
  };

  const handleCreateCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    triggerHaptic('success');

    const themeObj = THEME_OPTIONS.find((t) => t.key === selectedTheme) || THEME_OPTIONS[0];
    const stagesArray = stagesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newEventData: Omit<EventConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      year: year.trim() || new Date().getFullYear().toString(),
      tagline: tagline.trim() || 'Accelerating High-Conviction Connections',
      themeDescription: themeDescription.trim() || 'Connecting industry leaders, founders, and innovators.',
      eventType,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || undefined,
      location: location.trim() || 'Innovation Center',
      venue: venue.trim() || location.trim() || 'Main Arena',
      city: location.split(',')[0]?.trim() || 'Global',
      country: location.split(',')[1]?.trim() || '',
      targetConnections: Number(targetConnections) || 50,
      stages: stagesArray.length > 0 ? stagesArray : ['Main Stage', 'Track B'],
      branding: {
        themeKey: selectedTheme,
        primaryColor: themeObj.primary,
        accentColor: themeObj.accent,
        badgeBgColor: `${themeObj.primary}25`,
        badgeTextColor: themeObj.primary,
        bannerGradient: `from-[${themeObj.primary}33] via-[#1a0c06] to-[#0a0a0a]`,
        taglineColor: '#fadcd2',
      },
      sessions: [
        {
          id: `s-${Date.now()}-1`,
          title: `Welcome & Opening Keynote: ${name}`,
          speaker: 'Keynote Speaker',
          speakerRole: 'Industry Pioneer',
          timeStr: '9:30 AM',
          stage: stagesArray[0] || 'Main Stage',
          status: 'upcoming',
          description: `Opening address and strategic vision for ${name}.`,
          heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
          topics: ['Keynote', 'Vision', 'Strategy'],
        },
      ],
      customIcebreakers: [
        `What brings you to ${name} this year?`,
        'What is the highest-leverage challenge your team is currently tackling?',
      ],
      isArchived: false,
      isCustom: true,
    };

    onCreateCustomEvent(newEventData);
    setName('');
    setTagline('');
    setThemeDescription('');
    setLocation('');
    setActiveTab('my-events');
  };

  const handleAddSession = () => {
    if (!newSessionTitle.trim()) return;
    triggerHaptic('medium');

    const newSession: EventSession = {
      id: `s-manual-${Date.now()}`,
      title: newSessionTitle.trim(),
      speaker: newSessionSpeaker.trim() || 'Featured Speaker',
      speakerRole: newSessionRole.trim() || 'Speaker & Specialist',
      timeStr: newSessionTime.trim() || '10:00 AM',
      stage: newSessionStage.trim() || (editingEvent.stages[0] || 'Main Stage'),
      status: 'upcoming',
      description: newSessionDesc.trim() || 'Interactive session and keynote discussion.',
      heroImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      topics: ['Session', 'Industry'],
    };

    const updatedEvent = {
      ...editingEvent,
      sessions: [...editingEvent.sessions, newSession],
    };

    setEditingEvent(updatedEvent);
    onUpdateEvent(updatedEvent);

    setNewSessionTitle('');
    setNewSessionSpeaker('');
    setNewSessionRole('');
    setNewSessionDesc('');
  };

  const handleDeleteSession = (sessionId: string) => {
    triggerHaptic('warning');
    const updated = {
      ...editingEvent,
      sessions: editingEvent.sessions.filter((s) => s.id !== sessionId),
    };
    setEditingEvent(updated);
    onUpdateEvent(updated);
  };

  const handleGenerateAiIcebreakers = async () => {
    setIsGeneratingIcebreakers(true);
    triggerHaptic('medium');
    try {
      const res = await fetchEventIcebreakers(
        editingEvent.name,
        editingEvent.eventType,
        editingEvent.themeDescription,
        editingEvent.location
      );
      if (res.icebreakers && res.icebreakers.length > 0) {
        const updated = {
          ...editingEvent,
          customIcebreakers: res.icebreakers,
        };
        setEditingEvent(updated);
        onUpdateEvent(updated);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingIcebreakers(false);
    }
  };

  return (
    <div id="event-hub-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Modal Top Banner & Active Event Indicator */}
        <div className="relative p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#141414] via-[#0E0E0E] to-[#160B06]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg"
                style={{
                  backgroundColor: `${activeEvent.branding.primaryColor}20`,
                  borderColor: `${activeEvent.branding.primaryColor}50`,
                  color: activeEvent.branding.primaryColor,
                }}
              >
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${activeEvent.branding.primaryColor}25`,
                      color: activeEvent.branding.primaryColor,
                    }}
                  >
                    Active Event
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {activeEvent.eventType.toUpperCase()} • {activeEvent.year}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  {activeEvent.name}
                </h2>
                <p className="text-xs text-neutral-400 line-clamp-1 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  {activeEvent.location || activeEvent.venue} • Goal: {activeEvent.targetConnections} Connections
                </p>
              </div>
            </div>

            <button
              id="event-hub-close-btn"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-5 pt-3 border-t border-white/5 scrollbar-none">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('my-events');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'my-events'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              My Events ({events.length})
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('create-preset');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'create-preset'
                  ? 'bg-[#FF5C00] text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
              Event Templates
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('ai-agenda-import');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'ai-agenda-import'
                  ? 'bg-[#3B82F6] text-white font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />
              AI Agenda Ingest
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('custom-builder');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'custom-builder'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Custom Builder
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('manage-sessions');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'manage-sessions'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Schedule & Icebreakers
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 max-h-[calc(92vh-180px)] space-y-6">
          {/* TAB 1: MY EVENTS LIST */}
          {activeTab === 'my-events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Event Portfolio</h3>
                  <p className="text-xs text-neutral-400">Switch active workspace or manage conferences</p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab('create-preset');
                  }}
                  className="px-3 py-1.5 bg-[#FF5C00] text-black text-xs font-bold rounded-lg hover:bg-[#ff7a33] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {events.map((evt) => {
                  const isActive = evt.id === activeEvent.id;
                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-[#141414] border-white/30 shadow-lg'
                          : 'bg-[#0E0E0E] border-white/5 hover:border-white/15'
                      }`}
                      style={{
                        borderLeftColor: evt.branding.primaryColor,
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${evt.branding.primaryColor}20`,
                                color: evt.branding.primaryColor,
                              }}
                            >
                              {evt.eventType}
                            </span>
                            <h4 className="text-base font-bold text-white mt-1 line-clamp-1">{evt.name}</h4>
                            <p className="text-xs text-neutral-400 line-clamp-1">{evt.tagline}</p>
                          </div>

                          {isActive ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                triggerHaptic('success');
                                onSelectEvent(evt);
                              }}
                              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                            >
                              Switch
                            </button>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-500" />
                            {evt.location || 'Global'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-neutral-500" />
                            Goal: {evt.targetConnections}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-neutral-500" />
                            {evt.sessions.length} sessions
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-neutral-500 font-mono">{evt.startDate}</span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              onDuplicateEvent(evt.id);
                            }}
                            title="Duplicate event structure"
                            className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {events.length > 1 && (
                            <button
                              onClick={() => {
                                triggerHaptic('warning');
                                onDeleteEvent(evt.id);
                              }}
                              title="Delete event"
                              className="p-1.5 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE FROM GLOBAL PRESETS */}
          {activeTab === 'create-preset' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conference & Event Archetypes</h3>
                <p className="text-xs text-neutral-400">Instantiate a battle-tested event template pre-populated with tracks, stages, sessions, and icebreakers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventTemplatePresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-white/10 bg-[#0F0F0F] hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${preset.primaryColor}20`,
                            color: preset.primaryColor,
                          }}
                        >
                          {preset.eventType.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-neutral-500">Goal: {preset.defaultTarget}</span>
                      </div>

                      <h4 className="text-base font-bold text-white mt-2">{preset.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1">{preset.subtitle}</p>

                      <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[11px] text-neutral-300">
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Tag className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span>Tracks: {preset.sampleStages.join(' • ')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Briefcase className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span>{preset.sampleSessions.length} Seed Keynotes & Panels</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        onCreateFromPreset(preset);
                        setActiveTab('my-events');
                      }}
                      className="mt-4 w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                      style={{
                        backgroundColor: preset.primaryColor,
                        color: '#000000',
                      }}
                    >
                      Use Template
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AI AGENDA INGEST */}
          {activeTab === 'ai-agenda-import' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#3B82F6]/20 text-[#3B82F6]">
                    <Zap className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Conference Schedule Extractor</h3>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Paste raw agenda text, speaker lists, or timetable from any conference website or WhatsApp invite. Gemini will extract tracks, talks, and timings automatically!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Event Name</label>
                    <input
                      type="text"
                      value={agendaEventName}
                      onChange={(e) => setAgendaEventName(e.target.value)}
                      placeholder="e.g. AfroTech Frontier 2026"
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Raw Agenda Text or Schedule Copy</label>
                    <textarea
                      rows={8}
                      value={agendaRawText}
                      onChange={(e) => setAgendaRawText(e.target.value)}
                      placeholder={`Paste schedule text here, for example:
9:00 AM - Registration & Welcome
10:00 AM - "Building Sovereign AI" by Dr. Amina Yusuf (Main Stage)
11:30 AM - "Designing Friction-Free Products" by Sarah Chen (Design Studio)
2:00 PM - "Scaling African Fintech" - Panel with Founders (Fireside Pavilion)`}
                      className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 font-mono focus:outline-none focus:border-[#3B82F6] leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleParseAgenda}
                      disabled={isParsingAgenda || !agendaRawText.trim()}
                      className="flex-1 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isParsingAgenda ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing Agenda with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Extract Schedule with AI
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAgendaRawText(`9:30 AM - Opening Keynote: "The Agentic Web" - Alex Turner, Head of Autonomous Agents (Main Hall)
11:00 AM - Technical Deep Dive: "Rust & High-Throughput Distributed Indexing" - Elena Rostova (Track A)
1:30 PM - Panel: "Navigating Early Stage Seed Rounds in Emerging Tech" - Marcus Reid & Tunde Adebayo (Founders Lounge)
3:45 PM - Fireside: "The Future of Synthetic Data" - Zainab Al-Hassan (Auditorium B)`);
                      }}
                      className="px-3 py-2.5 bg-white/5 border border-white/10 text-neutral-400 hover:text-white rounded-lg text-xs"
                    >
                      Sample
                    </button>
                  </div>
                </div>

                {/* Live Parsed Preview */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Parsed Sessions Preview</span>
                      <span className="text-[10px] text-[#3B82F6] font-mono">{parsedSessionsPreview.length} sessions detected</span>
                    </h4>

                    {parsedSessionsPreview.length === 0 ? (
                      <div className="py-12 text-center text-xs text-neutral-500">
                        Paste schedule text on the left and click "Extract Schedule" to see structured output.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {parsedSessionsPreview.map((s, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                              <span className="text-[#3B82F6] font-semibold">{s.timeStr}</span>
                              <span className="bg-white/10 px-1.5 py-0.2 rounded text-[10px]">{s.stage}</span>
                            </div>
                            <div className="font-bold text-white mt-1">{s.title}</div>
                            <div className="text-[11px] text-neutral-300">Speaker: {s.speaker} ({s.speakerRole})</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {parsedSessionsPreview.length > 0 && (
                    <button
                      onClick={handleCreateFromAgendaImport}
                      className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      Create & Launch Event from Agenda
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM BUILDER */}
          {activeTab === 'custom-builder' && (
            <form onSubmit={handleCreateCustomSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Event Builder</h3>
                <p className="text-xs text-neutral-400">Configure every parameter for your target conference or retreat</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. WebSummit 2026"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  >
                    <option value="conference">Tech Conference</option>
                    <option value="summit">Executive Summit</option>
                    <option value="tedx">TEDx / Keynote</option>
                    <option value="hackathon">Hackathon & Demo Day</option>
                    <option value="mastermind">Mastermind / Retreat</option>
                    <option value="trade-expo">Trade Expo / Showcase</option>
                    <option value="unconference">Unconference / Open Space</option>
                    <option value="meetup">Community Meetup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. The Global Stage for Tech"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Location / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lisbon, Portugal"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Connection Goal</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={targetConnections}
                    onChange={(e) => setTargetConnections(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Stages & Tracks (Comma-separated)</label>
                  <input
                    type="text"
                    value={stagesInput}
                    onChange={(e) => setStagesInput(e.target.value)}
                    placeholder="Main Stage, AI Track, Founders Stage, Workshop B"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF5C00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Color Accent Theme</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        type="button"
                        key={t.key}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedTheme(t.key);
                        }}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          selectedTheme === t.key
                            ? 'border-white bg-white/15 shadow-md'
                            : 'border-white/10 bg-black/40 hover:border-white/20'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${t.bg}`} />
                        <span className="truncate">{t.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF5C00] text-black font-bold text-xs rounded-xl hover:bg-[#ff7a33] transition-all shadow-lg shadow-[#FF5C00]/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create & Activate Event
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: MANAGE SESSIONS & ICEBREAKERS */}
          {activeTab === 'manage-sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {editingEvent.name} — Schedule & Speakers
                  </h3>
                  <p className="text-xs text-neutral-400">Add or refine keynotes, talks, and conversation starters</p>
                </div>

                <button
                  onClick={handleGenerateAiIcebreakers}
                  disabled={isGeneratingIcebreakers}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                  {isGeneratingIcebreakers ? 'Synthesizing...' : 'AI Icebreakers'}
                </button>
              </div>

              {/* Event Icebreakers Panel */}
              {editingEvent.customIcebreakers && editingEvent.customIcebreakers.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-[#fadcd2] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#FF5C00]" />
                    Event-Tailored Conversation Icebreakers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editingEvent.customIcebreakers.map((prompt, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-neutral-300">
                        "{prompt}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Sessions List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Configured Sessions ({editingEvent.sessions.length})
                </h4>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {editingEvent.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 font-mono text-[10px]">
                          {sess.timeStr}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm line-clamp-1">{sess.title}</div>
                          <div className="text-neutral-400 text-[11px]">
                            {sess.speaker} • <span className="text-[#FF5C00]">{sess.stage}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Session Form */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#FF5C00]" />
                  Add Session / Talk
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Talk Title</label>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      placeholder="e.g. The Future of AI Infrastructure"
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Speaker Name</label>
                    <input
                      type="text"
                      value={newSessionSpeaker}
                      onChange={(e) => setNewSessionSpeaker(e.target.value)}
                      placeholder="e.g. Dr. Amina Yusuf"
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Speaker Role / Org</label>
                    <input
                      type="text"
                      value={newSessionRole}
                      onChange={(e) => setNewSessionRole(e.target.value)}
                      placeholder="e.g. Chief Scientist, LabX"
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Time & Stage</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSessionTime}
                        onChange={(e) => setNewSessionTime(e.target.value)}
                        placeholder="10:00 AM"
                        className="w-1/2 px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white font-mono"
                      />
                      <select
                        value={newSessionStage}
                        onChange={(e) => setNewSessionStage(e.target.value)}
                        className="w-1/2 px-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                      >
                        {editingEvent.stages.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSession}
                  disabled={!newSessionTitle.trim()}
                  className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  Save Session to Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
