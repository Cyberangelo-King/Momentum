import React, { useState, useEffect, useRef } from 'react';
import { Connection, EventConfig, UserProfile } from '../types';
import { 
  NfcContactPayload, 
  startWebNfcReader, 
  isWebNfcSupported, 
  getNfcServiceEnabled, 
  setNfcServiceEnabled, 
  mockNfcBumpAttendees, 
  createNfcExchangeLog 
} from '../services/nfcService';
import { triggerHaptic } from '../services/haptics';
import { 
  Smartphone, 
  Radio, 
  Zap, 
  Battery, 
  CheckCircle2, 
  Sparkles, 
  X, 
  AlertCircle, 
  UserPlus, 
  Layers, 
  ShieldCheck, 
  Power,
  Users,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NfcBumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  profile: UserProfile;
  activeEvent?: EventConfig;
  onReceiveNfcContact: (payload: NfcContactPayload, rawMessage?: string) => void;
  onOpenQuickConnectWithData?: (payload: NfcContactPayload) => void;
}

export const NfcBumpModal: React.FC<NfcBumpModalProps> = ({
  isOpen,
  onClose,
  connections,
  profile,
  activeEvent,
  onReceiveNfcContact,
  onOpenQuickConnectWithData,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(getNfcServiceEnabled);
  const [hardwareSupported, setHardwareSupported] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Ready to bump phones');
  const [lastReceived, setLastReceived] = useState<NfcContactPayload | null>(null);
  const [bumpSimulationStep, setBumpSimulationStep] = useState<'idle' | 'contact' | 'handshake' | 'success'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      const supported = isWebNfcSupported();
      setHardwareSupported(supported);
      const enabled = getNfcServiceEnabled();
      setNfcEnabled(enabled);

      if (enabled) {
        startListening();
      }
    } else {
      stopListening();
      setBumpSimulationStep('idle');
      setLastReceived(null);
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = async () => {
    setIsScanning(true);
    setScanStatus('Actively listening for NFC tag or phone bump...');
    abortControllerRef.current = new AbortController();

    const success = await startWebNfcReader({
      signal: abortControllerRef.current.signal,
      onRead: (payload, raw, serialNumber) => {
        triggerHaptic('nfc_handshake');
        setLastReceived(payload);
        setScanStatus(`Received contact: ${payload.name}!`);
        onReceiveNfcContact(payload, raw);
      },
      onError: (err) => {
        setScanStatus(err.message || 'Hardware scan unavailable; using virtual bump simulator');
      },
    });

    if (!success) {
      setScanStatus('Virtual NFC Bump Radar active (touch or tap to pair)');
    }
  };

  const stopListening = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleToggleNfcService = () => {
    const next = !nfcEnabled;
    triggerHaptic('medium');
    setNfcEnabled(next);
    setNfcServiceEnabled(next);

    if (next) {
      startListening();
    } else {
      stopListening();
      setScanStatus('NFC Scanner paused to conserve battery');
    }
  };

  const handleSimulateBump = (attendeePayload: NfcContactPayload) => {
    if (!nfcEnabled) {
      triggerHaptic('warning');
      alert('Please enable the NFC Service toggle first to scan for contacts.');
      return;
    }

    triggerHaptic('medium');
    setBumpSimulationStep('contact');
    setScanStatus(`Aligning phone antenna with ${attendeePayload.name}...`);

    setTimeout(() => {
      // Step 2: Haptic Handshake
      triggerHaptic('nfc_handshake');
      setBumpSimulationStep('handshake');
      setScanStatus('Exchanging cryptographic NDEF vCard tokens...');

      setTimeout(() => {
        // Step 3: Success & Parsed
        triggerHaptic('success');
        setBumpSimulationStep('success');
        setLastReceived(attendeePayload);
        setScanStatus(`Handshake verified with ${attendeePayload.name}!`);
        onReceiveNfcContact(attendeePayload);

        setTimeout(() => {
          setBumpSimulationStep('idle');
        }, 3000);
      }, 700);
    }, 600);
  };

  const handleTestCollisionBump = () => {
    // Pick an existing connection from the user's CRM to test collision
    const existing = connections.find((c) => !c.inTrash) || {
      name: 'Tunde Balogun',
      company: 'Kwara Clean Energy',
      profession: 'Co-Founder & CEO',
      email: 'tunde@kwaracleanenergy.ng',
      phone: '+234 803 499 1822',
      linkedin: 'https://linkedin.com/in/tunde-balogun',
      notes: 'Met during solar pitch session.',
      tags: ['#NFCBump', '#Solar', '#Lead'],
    };

    const collisionPayload: NfcContactPayload = {
      name: existing.name,
      company: existing.company || 'Clean Energy Ltd',
      profession: existing.profession || 'Director',
      email: existing.email || 'tunde@kwaracleanenergy.ng',
      phone: existing.phone || '+234 803 499 1822',
      linkedin: existing.linkedin || 'https://linkedin.com/in/tunde-balogun',
      notes: 'Re-bumped phone during evening networking dinner.',
      tags: ['#NFCBump', '#ReEncounter'],
    };

    handleSimulateBump(collisionPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="w-full max-w-lg rounded-3xl bg-[#0f0703] border border-[#FF5C00]/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#fadcd2]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#220f06] via-[#160a03] to-[#0f0703] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-[#FF5C00] text-black flex items-center justify-center font-bold shadow-lg shadow-[#FF5C00]/20">
              <Smartphone className="w-5 h-5" />
              {isScanning && nfcEnabled && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif-display">
                  Web-NFC Phone Bump Studio
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                  nfcEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {nfcEnabled ? 'Active Beam' : 'Battery Saver'}
                </span>
              </div>
              <p className="text-xs text-[#ffb59a]/70">
                Contactless 1-tap attendee exchange with duplicate collision guard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global NFC Toggle Banner */}
        <div className="px-5 py-3 bg-[#180b05] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${nfcEnabled ? 'text-[#FF5C00] animate-pulse' : 'text-neutral-500'}`} />
            <div>
              <span className="text-xs font-bold text-white">NFC Background Scanner</span>
              <p className="text-[10px] text-[#e4beb1]/60">Turn off when not mingling to save phone battery</p>
            </div>
          </div>

          <button
            onClick={handleToggleNfcService}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              nfcEnabled
                ? 'bg-[#FF5C00] text-black shadow-md shadow-[#FF5C00]/20'
                : 'bg-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{nfcEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {/* Central Pulse Radar & Phone Bump Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#140803] to-[#0a0402]">
          {/* Concentric Animated Radar Rings */}
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            {nfcEnabled && isScanning && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.25, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-[#FF5C00]/40 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.35, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: 0.8, ease: 'easeOut' }}
                  className="absolute inset-4 rounded-full border border-amber-400/30 pointer-events-none"
                />
              </>
            )}

            {/* Center Phone Bump Icon Container */}
            <motion.div
              animate={
                bumpSimulationStep === 'contact'
                  ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -8, 8, 0] }
                  : bumpSimulationStep === 'handshake'
                  ? { scale: [1, 1.2, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
                  : {}
              }
              className={`relative z-10 w-28 h-28 rounded-3xl p-1 flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                bumpSimulationStep === 'success'
                  ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-500/20 text-emerald-300'
                  : bumpSimulationStep === 'handshake'
                  ? 'bg-amber-950/80 border-amber-400 shadow-xl shadow-amber-500/30 text-amber-300'
                  : nfcEnabled
                  ? 'bg-gradient-to-tr from-[#2a1005] to-[#160702] border-[#FF5C00] shadow-xl shadow-[#FF5C00]/25 text-[#FF5C00]'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-500'
              }`}
            >
              {bumpSimulationStep === 'success' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              ) : bumpSimulationStep === 'handshake' ? (
                <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
              ) : (
                <Smartphone className={`w-10 h-10 ${nfcEnabled ? 'animate-pulse' : ''}`} />
              )}

              <span className="text-[10px] font-bold mt-1 text-center leading-tight">
                {bumpSimulationStep === 'success'
                  ? 'Bumped!'
                  : bumpSimulationStep === 'handshake'
                  ? 'Handshake'
                  : nfcEnabled
                  ? 'Ready to Bump'
                  : 'Scanner Off'}
              </span>
            </motion.div>
          </div>

          {/* Real-time Status Badge */}
          <div className="mt-1 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-center max-w-sm">
            <p className="text-xs text-[#fadcd2] font-mono truncate">{scanStatus}</p>
          </div>
        </div>

        {/* Attendee Simulation & Testing Hub */}
        <div className="p-5 overflow-y-auto space-y-3 bg-[#110703] border-t border-white/10 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#FF5C00]" />
              <span>Tap to Simulate Attendee NFC Bump</span>
            </div>
            <span className="text-[10px] text-[#ffb59a]/70 font-mono">1-Touch Handshake</span>
          </div>

          {/* Quick Bump Candidate Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mockNfcBumpAttendees.slice(0, 4).map((attendee, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulateBump(attendee)}
                disabled={!nfcEnabled || bumpSimulationStep !== 'idle'}
                className="p-2.5 rounded-2xl bg-[#1b0c05] hover:bg-[#281309] border border-white/5 hover:border-[#FF5C00]/40 transition-all flex items-center gap-2.5 text-left active:scale-95 disabled:opacity-50 group"
              >
                <img
                  src={attendee.avatarUrl}
                  alt={attendee.name}
                  className="w-9 h-9 rounded-xl object-cover border border-[#FF5C00]/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#ffb59a] transition-colors">
                    {attendee.name}
                  </h4>
                  <p className="text-[10px] text-[#e4beb1]/60 truncate">{attendee.company}</p>
                </div>
                <Smartphone className="w-3.5 h-3.5 text-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>

          {/* Test Duplicate Collision Bump */}
          <button
            onClick={handleTestCollisionBump}
            disabled={!nfcEnabled || bumpSimulationStep !== 'idle'}
            className="w-full p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Duplicate Collision Detection (Re-encounter Existing Contact)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
