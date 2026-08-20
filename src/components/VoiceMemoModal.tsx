import React, { useState, useEffect, useRef } from 'react';
import { Connection } from '../types';
import { 
  SpeechTranscriber, 
  VoiceRecorderSession, 
  isSpeechRecognitionSupported, 
  VoiceRecordingResult 
} from '../services/speechService';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Tag, 
  MapPin, 
  Check, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface VoiceMemoModalProps {
  isOpen: boolean;
  connections: Connection[];
  onClose: () => void;
  onSaveVoiceMoment: (data: {
    title: string;
    transcript: string;
    audioDataUrl: string;
    durationFormatted: string;
    location: string;
    taggedPeopleIds: string[];
  }) => void;
}

export const VoiceMemoModal: React.FC<VoiceMemoModalProps> = ({
  isOpen,
  connections,
  onClose,
  onSaveVoiceMoment,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [memoTitle, setMemoTitle] = useState('Voice Reflection');
  const [memoLocation, setMemoLocation] = useState('Main Concourse');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [recordingResult, setRecordingResult] = useState<VoiceRecordingResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  const recorderRef = useRef<VoiceRecorderSession | null>(null);
  const transcriberRef = useRef<SpeechTranscriber | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setRecordingState('idle');
      setTimerSeconds(0);
      setVolumeLevel(0);
      setTranscript('');
      setMemoTitle('Voice Reflection');
      setRecordingResult(null);
      setMicError(null);
      setTaggedPeople([]);
    } else {
      stopAll();
    }
  }, [isOpen]);

  const stopAll = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.abort();
      recorderRef.current = null;
    }
    if (transcriberRef.current) {
      transcriberRef.current.abort();
      transcriberRef.current = null;
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const handleStartRecording = async () => {
    setMicError(null);
    setTranscript('');
    setTimerSeconds(0);
    triggerHaptic('medium');

    try {
      // 1. Initialize audio recorder
      const recorder = new VoiceRecorderSession({
        onVolumeChange: (vol) => setVolumeLevel(vol),
      });
      await recorder.start();
      recorderRef.current = recorder;

      // 2. Initialize Web Speech API transcriber
      if (speechSupported) {
        const transcriber = new SpeechTranscriber({
          onTranscript: (newText) => {
            setTranscript(newText);
          },
          onError: (err) => {
            console.warn('Speech recognition warning:', err);
          },
        });
        transcriber.start();
        transcriberRef.current = transcriber;
      }

      setRecordingState('recording');

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permissions in browser settings.'
          : 'Could not initialize microphone. Please ensure an audio input device is connected.'
      );
      setRecordingState('idle');
      triggerHaptic('error');
    }
  };

  const handleStopRecording = async () => {
    triggerHaptic('heavy');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (transcriberRef.current) {
      transcriberRef.current.stop();
    }

    if (recorderRef.current) {
      try {
        const result = await recorderRef.current.stop();
        setRecordingResult(result);
        setRecordingState('preview');
        if (!memoTitle || memoTitle === 'Voice Reflection') {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMemoTitle(`Voice Memo • ${nowStr}`);
        }
      } catch (err) {
        console.error('Failed to stop voice recording:', err);
        setRecordingState('idle');
      }
    }
  };

  const handleResetRecording = () => {
    triggerHaptic('light');
    stopAll();
    setRecordingState('idle');
    setTimerSeconds(0);
    setTranscript('');
    setRecordingResult(null);
  };

  const toggleAudioPlayback = () => {
    if (!audioPreviewRef.current && recordingResult?.dataUrl) {
      const audio = new Audio(recordingResult.dataUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioPreviewRef.current = audio;
    }

    if (audioPreviewRef.current) {
      if (isPlayingAudio) {
        audioPreviewRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPreviewRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleSave = () => {
    if (!recordingResult) return;
    triggerHaptic('success');

    onSaveVoiceMoment({
      title: memoTitle.trim() || 'Spoken Moment',
      transcript: transcript.trim() || 'Voice memo recorded at TEDxAkure 2026',
      audioDataUrl: recordingResult.dataUrl,
      durationFormatted: recordingResult.durationFormatted,
      location: memoLocation,
      taggedPeopleIds: taggedPeople,
    });

    onClose();
  };

  const toggleTagPerson = (id: string) => {
    if (taggedPeople.includes(id)) {
      setTaggedPeople(taggedPeople.filter((p) => p !== id));
    } else {
      setTaggedPeople([...taggedPeople, id]);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#20110a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
                Voice Memo & Speech Transcriber
              </h2>
              <p className="text-[11px] text-[#e4beb1]/70">
                Web Speech API • Real-Time On-Device Transcription
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close voice memo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Microphone Error Banner */}
          {micError && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Microphone Access Error</p>
                <p className="text-[11px] leading-relaxed text-rose-200/90">{micError}</p>
              </div>
            </div>
          )}

          {/* Web Speech API Support Badge */}
          <div className="flex items-center justify-between p-2.5 bg-[#1a0c07] border border-white/5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  speechSupported ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
                }`}
              />
              <span className="text-[#e4beb1]/80 text-[11px]">
                {speechSupported
                  ? 'Web Speech API Ready (Continuous Engine)'
                  : 'Web Speech API Unavailable in this browser (Audio-only mode)'}
              </span>
            </div>
            <button
              onClick={() => setShowSecurityDetails(!showSecurityDetails)}
              className="text-[10px] text-[#FF5C00] hover:underline flex items-center gap-1 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy & Security</span>
            </button>
          </div>

          {/* Security Information Drawer */}
          {showSecurityDetails && (
            <div className="p-4 bg-[#1a0e08] border border-[#FF5C00]/30 rounded-xl text-xs text-[#e4beb1]/90 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-[#FF5C00] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Security & Hardware Privacy Architecture</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#fadcd2]/80 leading-relaxed">
                <li>
                  <strong className="text-[#FF5C00]">Zero Passive Listening:</strong> The microphone stream is strictly requested upon clicking Record, and all hardware media tracks are immediately stopped upon session conclusion.
                </li>
                <li>
                  <strong className="text-[#FF5C00]">On-Device Processing:</strong> Speech recognition runs client-side via the browser's native engine. Audio bytes are never uploaded to unverified third-party ad networks.
                </li>
                <li>
                  <strong className="text-[#FF5C00]">Local Sandbox Storage:</strong> Captured voice memos are saved directly to your device's isolated storage sandbox, protected by your app PIN lock.
                </li>
              </ul>
            </div>
          )}

          {/* RECORDING / IDLE STATE */}
          {recordingState !== 'preview' ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-6 bg-[#0e0603] rounded-2xl border border-white/5 p-6">
              {/* Animated Volume Waveform Bars */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full">
                {[12, 24, 38, 55, 75, 90, 75, 55, 38, 24, 12].map((height, i) => {
                  const dynamicHeight =
                    recordingState === 'recording'
                      ? Math.max(8, Math.min(60, (height * (volumeLevel + 20)) / 60))
                      : 6;

                  return (
                    <div
                      key={i}
                      style={{ height: `${dynamicHeight}px` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        recordingState === 'recording'
                          ? 'bg-[#FF5C00] shadow-[0_0_10px_rgba(255,92,0,0.5)]'
                          : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Timer Display */}
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-[#fadcd2] tracking-wider">
                  {formatTimer(timerSeconds)}
                </div>
                <div className="text-[11px] font-semibold text-[#e4beb1]/60 mt-1 flex items-center justify-center gap-1.5">
                  {recordingState === 'recording' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-rose-400 font-bold uppercase tracking-wider">
                        Recording Audio & Transcribing...
                      </span>
                    </>
                  ) : (
                    <span>Ready to capture voice reflection</span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {recordingState === 'idle' ? (
                <button
                  onClick={handleStartRecording}
                  className="px-6 py-3.5 rounded-2xl bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] flex items-center gap-2.5 shadow-xl shadow-[#FF5C00]/25 active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording Voice Memo</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStopRecording}
                    className="px-6 py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-500 flex items-center gap-2.5 shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>Stop & Review Memo</span>
                  </button>
                </div>
              )}

              {/* Live Streaming Transcript preview during recording */}
              {recordingState === 'recording' && (
                <div className="w-full bg-[#180b06] border border-[#FF5C00]/30 rounded-xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-[#FF5C00] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Live Web Speech Stream</span>
                  </div>
                  <p className="text-xs text-[#fadcd2] italic leading-relaxed min-h-[40px]">
                    {transcript || 'Listening for speech... (Start speaking your thoughts)'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW & EDIT STATE */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Playback Control Bar */}
              <div className="p-4 bg-[#1e100a] border border-[#FF5C00]/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudioPlayback}
                    className="w-12 h-12 rounded-xl bg-[#FF5C00] text-black flex items-center justify-center hover:bg-[#ff7a33] shadow-md transition-transform active:scale-95"
                    aria-label={isPlayingAudio ? 'Pause playback' : 'Play recorded voice memo'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                  <div>
                    <h4 className="text-xs font-bold text-[#fadcd2]">Recorded Voice Memo</h4>
                    <p className="text-[11px] text-[#FF5C00] font-mono font-semibold">
                      Duration: {recordingResult?.durationFormatted}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetRecording}
                  className="p-2.5 rounded-xl bg-[#28130a] text-[#e4beb1]/70 hover:text-white hover:bg-[#381a0e] text-xs flex items-center gap-1.5 transition-colors border border-white/5"
                  title="Re-record"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
              </div>

              {/* Title & Location fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                    Memo Title
                  </label>
                  <input
                    type="text"
                    value={memoTitle}
                    onChange={(e) => setMemoTitle(e.target.value)}
                    className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={memoLocation}
                      onChange={(e) => setMemoLocation(e.target.value)}
                      className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none pl-8"
                    />
                    <MapPin className="w-3.5 h-3.5 text-[#FF5C00] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Automatic Transcription Box (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#e4beb1] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Auto-Transcribed Text (Editable)</span>
                  </label>
                  <span className="text-[10px] text-[#e4beb1]/60">
                    {transcript.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Speech transcription will appear here. You can refine or edit words directly."
                  className="w-full bg-[#0d0603] border border-white/10 rounded-xl p-3 text-xs text-[#fadcd2] focus:border-[#FF5C00] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Tag connections present */}
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5">
                  Tag Connections Present
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#0d0603] rounded-xl border border-white/10">
                  {connections.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleTagPerson(c.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        taggedPeople.includes(c.id)
                          ? 'bg-[#FF5C00] text-black font-bold'
                          : 'bg-[#1e100a] text-[#e4beb1]/70 hover:text-white'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#180b06] border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#fadcd2] hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          {recordingState === 'preview' && (
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Voice Moment & Transcript</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
