import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (dataUrl: string) => void;
  onCaptureVideo?: (videoUrl: string) => void;
  mode?: 'photo' | 'video' | 'both';
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureImage,
  onCaptureVideo,
  mode = 'both',
  title = 'Capture Live Media',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && !capturedImage && !recordedVideoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage, recordedVideoUrl]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser environment');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video' || mode === 'both',
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Unable to access camera. You can still upload files.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const startVideoRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        stopCamera();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording start error', err);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setRecordedVideoUrl(videoUrl);
      stopCamera();
    }
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCaptureImage(capturedImage);
    } else if (recordedVideoUrl && onCaptureVideo) {
      onCaptureVideo(recordedVideoUrl);
    }
    resetState();
    onClose();
  };

  const resetState = () => {
    setCapturedImage(null);
    setRecordedVideoUrl(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    stopCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF5C00]">photo_camera</span>
            <h2 className="text-lg font-bold text-[#fadcd2]">{title}</h2>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full max-h-[60vh] object-contain"
            />
          ) : recordedVideoUrl ? (
            <video
              src={recordedVideoUrl}
              controls
              autoPlay
              className="w-full h-full max-h-[60vh] object-contain"
            />
          ) : (
            <>
              {cameraError ? (
                <div className="p-6 text-center text-[#e4beb1]/80 max-w-xs flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl text-[#FF5C00] mb-2">
                    videocam_off
                  </span>
                  <p className="text-sm mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#FF5C00] text-black font-semibold rounded-lg text-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Choose from Device
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover min-h-[300px]"
                />
              )}
            </>
          )}

          {/* Recording Timer indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              REC {Math.floor(recordingSeconds / 60)}:
              {recordingSeconds % 60 < 10 ? '0' : ''}
              {recordingSeconds % 60}
            </div>
          )}

          {/* Switch camera button */}
          {!capturedImage && !recordedVideoUrl && !cameraError && (
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 backdrop-blur-sm border border-white/20 transition-transform active:rotate-180 duration-300"
              title="Switch Camera"
            >
              <span className="material-symbols-outlined text-xl">flip_camera_ios</span>
            </button>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#1e100a] border-t border-white/10 flex items-center justify-between gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {capturedImage || recordedVideoUrl ? (
            <>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setRecordedVideoUrl(null);
                  startCamera();
                }}
                className="px-4 py-2.5 rounded-lg border border-white/20 text-[#fadcd2] font-semibold text-sm hover:bg-white/5"
              >
                Retake
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Use This Capture
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#fadcd2] hover:bg-white/10"
                title="Upload Photo or Video"
              >
                <span className="material-symbols-outlined">folder_open</span>
              </button>

              {/* Photo snap */}
              <button
                onClick={takePhoto}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Snap Photo
              </button>

              {/* Video record toggle */}
              {(mode === 'video' || mode === 'both') && onCaptureVideo && (
                <button
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${
                    isRecording
                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                      : 'bg-white/5 border-white/10 text-[#fadcd2] hover:bg-white/10'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Record Video Snippet'}
                >
                  <span className="material-symbols-outlined">
                    {isRecording ? 'stop' : 'videocam'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
