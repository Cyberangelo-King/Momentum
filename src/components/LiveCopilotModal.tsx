import React, { useState, useEffect } from 'react';
import { EventConfig, Connection, UserProfile } from '../types';
import { 
  X, 
  Sparkles, 
  Clock, 
  MapPin, 
  Wifi, 
  Zap, 
  Copy, 
  Check, 
  Compass, 
  Target, 
  Coffee, 
  BatteryCharging, 
  ShieldAlert, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { fetchEventIcebreakers } from '../services/aiService';

interface LiveCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent?: EventConfig;
  connections: Connection[];
  profile?: UserProfile;
  onOpenPitchSimulator?: () => void;
  onOpenQuickConnect?: () => void;
}

export const LiveCopilotModal: React.FC<LiveCopilotModalProps> = ({
  isOpen,
  onClose,
  activeEvent,
  connections,
  profile,
  onOpenPitchSimulator,
  onOpenQuickConnect,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoadingIcebreakers, setIsLoadingIcebreakers] = useState<boolean>(false);

  const target = activeEvent?.targetConnections || 50;
  const currentCount = connections.length;
  const remaining = Math.max(0, target - currentCount);

  const sessions = activeEvent?.sessions || [];
  const liveSession = sessions.find((s) => s.status === 'live') || sessions[0];
  const upcomingSession = sessions.find((s) => s.status === 'upcoming');

  const venueKit = activeEvent?.venueKit || {
    wifiSsid: `${activeEvent?.name?.replace(/\s+/g, '') || 'Event'}_Guest_HighSpeed`,
    wifiPassword: `${activeEvent?.year || '2026'}Momentum!`,
    powerOutlets: ['Front Stage Row 4 (Left Wing)', 'Media Lounge B Floor Boxes', 'Coffee Bar Pillar 3'],
    quietZones: ['East Mezzanine Terrace', 'VIP Green Room Antechamber', 'Courtyard Garden Bench 2'],
    foodNotes: ['Lunch buffet opens at 1:00 PM at Grand Atrium', 'Artisan Coffee Bar running all day'],
    emergencyContact: '+234 800 MOMENTUM (Organizing Desk)',
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerHaptic('medium');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadIcebreakers = async () => {
    if (!activeEvent) return;
    setIsLoadingIcebreakers(true);
    triggerHaptic('light');
    try {
      const res = await fetchEventIcebreakers(
        activeEvent.name,
        activeEvent.eventType,
        activeEvent.themeDescription,
        activeEvent.location
      );
      setIcebreakers(res.icebreakers);
    } catch (e) {
      console.warn('Failed to load icebreakers:', e);
    } finally {
      setIsLoadingIcebreakers(false);
    }
  };

  useEffect(() => {
    if (isOpen && icebreakers.length === 0) {
      if (activeEvent?.customIcebreakers && activeEvent.customIcebreakers.length > 0) {
        setIcebreakers(activeEvent.customIcebreakers);
      } else {
        loadIcebreakers();
      }
    }
  }, [isOpen, activeEvent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-3xl max-h-[92dvh] rounded-3xl bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden text-white my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--border-accent)] flex items-center justify-center shrink-0 shadow-lg">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Live Event Copilot & Venue Kit</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-black font-bold uppercase tracking-wider">
                  HUD
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Live session radar, networking pacing engine, and venue survival tools
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Close Live Copilot"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Target Pacing Progress Strip */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black/50 border border-[var(--border-accent)] flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-black text-[var(--accent-primary)]">{currentCount}</span>
                <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">/ {target}</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {remaining === 0 ? 'Goal Crushed! 50/50 Unlocked' : `${remaining} Connections to Goal`}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Target velocity: ~{(remaining / 3).toFixed(1)} contacts/hr to finish before closing remarks.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
                if (onOpenPitchSimulator) onOpenPitchSimulator();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Open Pitch Arena
            </button>
          </div>

          {/* Live Stage Radar */}
          {liveSession && (
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Happening Now</span>
                </div>
                <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {liveSession.timeStr} • {liveSession.stage}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <img
                  src={liveSession.heroImage}
                  alt={liveSession.title}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{liveSession.title}</h4>
                  <p className="text-xs text-[var(--accent-primary)] font-medium">{liveSession.speaker} ({liveSession.speakerRole})</p>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1">{liveSession.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Hallway Icebreaker Teleprompter */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Live 30-Second Icebreakers
                </h3>
              </div>
              <button
                onClick={loadIcebreakers}
                disabled={isLoadingIcebreakers}
                className="text-[10px] text-[var(--text-secondary)] hover:text-white flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingIcebreakers ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
                Refresh Prompts
              </button>
            </div>

            <div className="space-y-2">
              {icebreakers.slice(0, 3).map((prompt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyText(prompt, `ice_${idx}`)}
                  className="p-3 rounded-xl bg-black/30 border border-[var(--border-subtle)] hover:border-[var(--border-accent)] cursor-pointer flex items-center justify-between gap-3 group transition-all"
                >
                  <p className="text-xs text-neutral-200 group-hover:text-white leading-relaxed">
                    "{prompt}"
                  </p>
                  <div className="shrink-0 text-neutral-500 group-hover:text-[var(--accent-primary)]">
                    {copiedKey === `ice_${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Survival Cheatsheet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* WiFi credentials */}
            <div className="p-4 rounded-2xl bg-black/40 border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  Venue WiFi Network
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Fast</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">SSID</span>
                  <span className="font-mono text-white font-bold">{venueKit.wifiSsid}</span>
                </div>
                <button
                  onClick={() => handleCopyText(venueKit.wifiSsid || '', 'ssid')}
                  aria-label="Copy WiFi SSID"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'ssid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Password</span>
                  <span className="font-mono text-[var(--accent-primary)] font-bold">{venueKit.wifiPassword}</span>
                </div>
                <button
                  onClick={() => handleCopyText(venueKit.wifiPassword || '', 'pass')}
                  aria-label="Copy WiFi Password"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Power outlets & Quiet Spots */}
            <div className="p-4 rounded-2xl bg-black/40 border border-[var(--border-subtle)] space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                Power Outlets & Quiet Zones
              </span>
              <div className="space-y-1.5 text-xs text-neutral-300">
                {(venueKit.powerOutlets || []).slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
                {(venueKit.quietZones || []).slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="truncate">{venueKit.foodNotes?.[0] || 'Coffee bar open all day'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
