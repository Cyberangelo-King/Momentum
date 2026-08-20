/**
 * Speech Recognition and Audio Recording Service
 * Utilizes standard Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * and HTML5 MediaRecorder with strict security and privacy guarantees.
 */

// Interface declaration for SpeechRecognition window augmentations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

/**
 * Checks if the browser supports the Web Speech API (SpeechRecognition)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Speech Transcriber Controller
 */
export class SpeechTranscriber {
  private recognition: SpeechRecognitionInstance | null = null;
  private isRunning: boolean = false;
  private onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (err: string) => void;
  private onEndCallback?: () => void;
  private finalTranscriptAccumulated: string = '';

  constructor(options: {
    onTranscript: (text: string, isFinal: boolean) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
    lang?: string;
  }) {
    this.onTranscriptUpdate = options.onTranscript;
    this.onErrorCallback = options.onError;
    this.onEndCallback = options.onEnd;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = options.lang || 'en-US';
        this.recognition.maxAlternatives = 1;

        this.setupListeners();
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isRunning = true;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          const piece = result[0].transcript.trim();
          if (piece) {
            this.finalTranscriptAccumulated = this.finalTranscriptAccumulated
              ? `${this.finalTranscriptAccumulated} ${piece}`
              : piece;
          }
        } else {
          currentInterim += result[0].transcript;
        }
      }

      const fullCombined = (
        this.finalTranscriptAccumulated +
        (currentInterim ? ` ${currentInterim}` : '')
      ).trim();

      this.onTranscriptUpdate(fullCombined, false);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is a soft timeout from silence, not a fatal breach
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      console.warn('Web Speech API event error:', event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isRunning = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  public start() {
    if (!this.recognition || this.isRunning) return;
    try {
      this.finalTranscriptAccumulated = '';
      this.recognition.start();
      this.isRunning = true;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
    }
  }

  public stop() {
    if (!this.recognition || !this.isRunning) return;
    try {
      this.recognition.stop();
      this.isRunning = false;
    } catch (err) {
      console.warn('Failed to stop speech recognition:', err);
    }
  }

  public abort() {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
      this.isRunning = false;
    } catch (err) {
      console.warn('Failed to abort speech recognition:', err);
    }
  }

  public setInitialText(text: string) {
    this.finalTranscriptAccumulated = text;
  }
}

/**
 * Audio Recorder Session with Live Visualizer Analyser
 */
export interface VoiceRecordingResult {
  blob: Blob;
  dataUrl: string;
  durationSeconds: number;
  durationFormatted: string;
}

export class VoiceRecorderSession {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private onVolumeChange?: (volumePercent: number) => void;

  constructor(options?: { onVolumeChange?: (volumePercent: number) => void }) {
    this.onVolumeChange = options?.onVolumeChange;
  }

  public async start(): Promise<void> {
    this.audioChunks = [];
    
    // Request explicit user permission for microphone stream
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.startTime = Date.now();

    // Setup live frequency / volume analyzer for UI visualizer
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const volumePercent = Math.min(100, Math.round((average / 128) * 100));
          if (this.onVolumeChange) {
            this.onVolumeChange(volumePercent);
          }
          this.animationFrameId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
    } catch (e) {
      console.warn('AudioContext visualization setup warning:', e);
    }

    // Determine safe supported mime type
    let mimeType = 'audio/webm';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
    }

    this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Slice every 250ms
  }

  public async stop(): Promise<VoiceRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.cleanupAnalyser();

      this.mediaRecorder.onstop = async () => {
        try {
          const durationMs = Date.now() - this.startTime;
          const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
          const mins = Math.floor(durationSeconds / 60);
          const secs = durationSeconds % 60;
          const durationFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          // Convert to base64 DataURL for safe local state and IndexedDB storage
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            this.releaseTracks();
            resolve({
              blob: audioBlob,
              dataUrl,
              durationSeconds,
              durationFormatted,
            });
          };
          reader.onerror = () => {
            this.releaseTracks();
            reject(new Error('Failed to convert recorded audio to base64'));
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          this.releaseTracks();
          reject(err);
        }
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  public abort() {
    this.cleanupAnalyser();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // silent
      }
    }
    this.releaseTracks();
  }

  private cleanupAnalyser() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  /**
   * CRITICAL SECURITY RULE:
   * Always close and stop hardware media tracks immediately upon session termination
   * so the microphone light turns off and hardware resource is released.
   */
  private releaseTracks() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      this.audioStream = null;
    }
  }
}
