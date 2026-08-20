import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { Camera, Upload, Check, X, Sparkles, User, Mail, Briefcase, Globe, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [title, setTitle] = useState(profile.title);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl);
  const [targetConnections, setTargetConnections] = useState(profile.targetConnections || 50);
  const [conferenceName, setConferenceName] = useState(profile.conferenceName || 'TEDxAkure');
  const [location, setLocation] = useState(profile.location || 'Akure, Ondo State, Nigeria');
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatarUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      title: title.trim() || profile.title,
      avatarUrl: avatarUrl || profile.avatarUrl,
      portfolioUrl: portfolioUrl.trim() || profile.portfolioUrl,
      targetConnections: Number(targetConnections) || 50,
      conferenceName: conferenceName.trim() || 'TEDxAkure',
      location: location.trim() || 'Akure, Ondo State, Nigeria',
    };
    onSaveProfile(updated);
    onClose();
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-[#120804] border border-white/10 sm:rounded-3xl rounded-t-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#200e06] to-[#160904] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#fadcd2] font-serif-display">
                  Edit Profile & Avatar
                </h2>
                <p className="text-xs text-[#e4beb1]/60">Customize your TEDx conference identity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Avatar Uploader Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#1a0c06] border border-white/5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#FF5C00] shadow-xl bg-black flex-shrink-0">
                  <img
                    src={avatarUrl || profile.avatarUrl}
                    alt="Angelo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="absolute -bottom-2 -right-2 p-2 bg-[#FF5C00] hover:bg-[#ff7a33] text-black rounded-xl shadow-lg transition-transform active:scale-95"
                  title="Take Photo"
                >
                  <Camera className="w-4 h-4 font-bold" />
                </button>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div>
                  <h3 className="text-xs font-bold text-[#fadcd2] uppercase tracking-wider">
                    Profile Picture
                  </h3>
                  <p className="text-[11px] text-[#e4beb1]/60">
                    Upload your headshot or snap a live photo
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#fadcd2] border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#28130a] hover:bg-[#381a0e] text-[#fadcd2] border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Upload Image</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
                  placeholder="Angelo Akinboyejo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Professional Title & Role</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
                  placeholder="Lead Systems Engineer & AI Architect"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Contact Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors"
                    placeholder="faithakinboyejo@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#FF5C00]" />
                    <span>Target Connections</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={targetConnections}
                    onChange={(e) => setTargetConnections(Number(e.target.value))}
                    className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Portfolio URL (QR Share Target)</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full bg-[#160a05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#fadcd2] focus:outline-none focus:border-[#FF5C00] transition-colors font-mono text-xs"
                  placeholder="https://angelo-tedxakure-portfolio.netlify.app"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-white/10 text-[#fadcd2] font-semibold text-xs hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#FF5C00] text-black font-bold text-sm hover:bg-[#ff7a33] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={(dataUrl) => {
          setAvatarUrl(dataUrl);
          setIsCameraOpen(false);
        }}
        mode="photo"
        title="Snap Your Profile Photo"
      />
    </>
  );
};
