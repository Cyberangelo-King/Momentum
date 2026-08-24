import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, EventConfig } from '../types';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

interface DigitalBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activeEvent?: EventConfig;
}

export const DigitalBadgeModal: React.FC<DigitalBadgeModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeEvent,
}) => {
  const [badgeRole, setBadgeRole] = useState<'VIP' | 'FOUNDER' | 'SPEAKER' | 'ATTENDEE'>('FOUNDER');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isNfcBeaming, setIsNfcBeaming] = useState<boolean>(false);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glareX, setGlareX] = useState<number>(50);
  const [glareY, setGlareY] = useState<number>(50);
  const badgeCardRef = useRef<HTMLDivElement>(null);

  const brandColor = activeEvent?.branding?.primaryColor || '#FF5C00';
  const eventName = activeEvent?.name || 'Momentum Event';
  const eventYear = activeEvent?.year || '2026';
  const venue = activeEvent?.venue || 'Innovation Hub';

  // 3D Tilt interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeCardRef.current) return;
    const rect = badgeCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setGlareX((x / rect.width) * 100);
    setGlareY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  };

  // Generate vCard 3.0 string
  const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${profile.name};;;;
FN:${profile.name}
TITLE:${profile.title}
ORG:${activeEvent?.name || 'Event Attendee'}
EMAIL:${profile.email}
URL:${profile.portfolioUrl || 'https://momentum.app'}
NOTE:Met at ${eventName} ${eventYear}
END:VCARD`;

  const vCardEncoded = encodeURIComponent(vCardData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${vCardEncoded}&bgcolor=0e0704&color=ffb59a&format=svg`;

  const handleDownloadVCard = () => {
    triggerHaptic('medium');
    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.name.replace(/\s+/g, '_')}_MomentumPass.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyPassLink = () => {
    triggerHaptic('light');
    const shareUrl = `${window.location.origin}/?badge=${encodeURIComponent(profile.name)}&event=${encodeURIComponent(eventName)}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSimulateNfcBeam = () => {
    triggerHaptic('success');
    setIsNfcBeaming(true);
    setTimeout(() => {
      triggerHaptic('heavy');
      setIsNfcBeaming(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-2xl max-h-[95vh] rounded-3xl bg-[#0d0704] border border-[#FF5C00]/30 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1c0a03] to-[#0d0704]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
            >
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Holographic Pass & NFC Studio</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Live Verified
                </span>
              </div>
              <p className="text-xs text-[#ffb59a]/70">
                Interactive tilt-responsive digital badge with vCard contact exchange
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge Tier Selector */}
        <div className="px-5 py-2.5 bg-[#140803] border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-400">Badge Tier:</span>
          <div className="flex items-center gap-1.5">
            {(['FOUNDER', 'VIP', 'SPEAKER', 'ATTENDEE'] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  triggerHaptic('light');
                  setBadgeRole(role);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  badgeRole === role
                    ? 'bg-[#FF5C00] text-black shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center space-y-6">
          {/* Lanyard Top Strap */}
          <div className="w-16 h-4 bg-gradient-to-b from-[#331508] to-[#1a0a03] rounded-t-lg border-t border-x border-[#FF5C00]/40 flex items-center justify-center -mb-2 shadow-inner">
            <div className="w-8 h-1.5 bg-black/60 rounded-full" />
          </div>

          {/* 3D Tilt Card Container */}
          <div
            ref={badgeCardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              perspective: '1000px',
            }}
            className="cursor-pointer transition-transform duration-100 ease-out"
          >
            <div
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
                boxShadow: '0 25px 50px -12px rgba(255, 92, 0, 0.25)',
              }}
              className="relative w-72 sm:w-80 h-[430px] rounded-3xl bg-gradient-to-b from-[#1f0d04] via-[#120602] to-[#070301] border-2 border-[#FF5C00]/50 p-6 flex flex-col justify-between overflow-hidden"
            >
              {/* Holographic Glare Overlay */}
              <div
                style={{
                  background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 181, 154, 0.25) 0%, rgba(255, 92, 0, 0.1) 40%, transparent 80%)`,
                }}
                className="absolute inset-0 pointer-events-none transition-opacity duration-75 mix-blend-screen"
              />

              {/* Event Badge Header */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-white tracking-tight">
                    {eventName}
                  </h3>
                  <p className="text-[10px] text-[#ffb59a] font-semibold uppercase tracking-wider">
                    {eventYear} • {venue}
                  </p>
                </div>

                {/* Role Pill */}
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg ${
                  badgeRole === 'FOUNDER' ? 'bg-[#FF5C00] text-black' :
                  badgeRole === 'VIP' ? 'bg-amber-400 text-black' :
                  badgeRole === 'SPEAKER' ? 'bg-purple-500 text-white' :
                  'bg-white/20 text-white'
                }`}>
                  {badgeRole}
                </span>
              </div>

              {/* Center User Profile & Photo */}
              <div className="relative z-10 text-center space-y-2.5 my-auto">
                <div className="relative w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#FF5C00] to-amber-400 shadow-xl">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover bg-neutral-900"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-[#FF5C00] flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#FF5C00]" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{profile.name}</h4>
                  <p className="text-xs text-[#ffb59a] font-medium">{profile.title}</p>
                </div>
              </div>

              {/* QR Code & Contact Footer */}
              <div className="relative z-10 p-3 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-between gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#0e0704] border border-[#FF5C00]/30 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={qrCodeUrl} alt="Contact QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block">Instant vCard Pass</span>
                  <p className="text-[11px] text-white truncate font-medium">{profile.email}</p>
                  <span className="text-[9px] text-[#FF5C00] font-semibold">Scan to save directly to phone</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadVCard}
              className="py-3 px-3 rounded-2xl bg-[#FF5C00] hover:bg-[#FF7A33] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Download vCard .vcf
            </button>

            <button
              onClick={handleCopyPassLink}
              className="py-3 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Pass Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Web Pass
                </>
              )}
            </button>

            {/* NFC AirDrop Beam Simulator */}
            <button
              onClick={handleSimulateNfcBeam}
              disabled={isNfcBeaming}
              className="col-span-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#2a1105] to-[#150702] border border-[#FF5C00]/40 text-[#ffb59a] hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Smartphone className={`w-4 h-4 ${isNfcBeaming ? 'animate-bounce text-[#FF5C00]' : ''}`} />
              {isNfcBeaming ? 'Beaming Contact via NFC Wave...' : 'Simulate 1-Tap NFC Contact Beam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
