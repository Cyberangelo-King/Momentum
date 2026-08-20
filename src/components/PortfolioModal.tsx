import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, ExternalLink, Download, Share2, Sparkles, X, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ isOpen, onClose, profile }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const portfolioUrl = profile.portfolioUrl || 'https://angelo-tedxakure-portfolio.netlify.app';

  useEffect(() => {
    if (!isOpen) return;

    // Generate crisp QR code on canvas and data URL
    QRCode.toDataURL(
      portfolioUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, portfolioUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `angelo-tedxakure-portfolio-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#E62B1E] flex items-center justify-center text-white shadow-lg shadow-[#FF4D00]/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Angelo's Portfolio
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#FF4D00]/20 text-[#FF6B26] border border-[#FF4D00]/30">
                  TEDxAkure 2026
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Scan to view digital portfolio & projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col items-center text-center space-y-6">
          {/* Profile Card Header */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#FF4D00] shadow-md shadow-[#FF4D00]/20"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 text-black">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mt-3">{profile.name}</h3>
            <p className="text-xs text-[#FF6B26] font-medium">{profile.title}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{profile.email}</p>
          </div>

          {/* QR Code Presentation Box */}
          <div className="relative bg-white p-5 rounded-2xl shadow-xl shadow-black/60 flex flex-col items-center justify-center border-4 border-neutral-900">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Angelo TEDxAkure Portfolio QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
                Generating QR Code...
              </div>
            )}
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-neutral-800 tracking-wider uppercase">
                Scan with any Camera App
              </span>
            </div>
          </div>

          {/* URL Pill Display */}
          <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between text-left">
            <div className="truncate mr-2">
              <p className="text-[10px] text-neutral-500 uppercase font-semibold">Portfolio URL</p>
              <p className="text-xs text-neutral-300 font-mono truncate">{portfolioUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#E62B1E] hover:from-[#FF6B26] hover:to-[#FF4D00] text-white font-semibold text-sm transition-all shadow-lg shadow-[#FF4D00]/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Link</span>
            </a>
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-sm transition-colors border border-neutral-700"
            >
              <Download className="w-4 h-4" />
              <span>Save Image</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#141414] text-center">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B26]" />
            Show this screen to attendees & speakers during networking sessions
          </p>
        </div>
      </div>
    </div>
  );
};
