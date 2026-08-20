import React from 'react';
import { motion } from 'motion/react';
import { Shield, Loader2 } from 'lucide-react';

export const AuthLoadingSplash: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#070403] text-[#fadcd2] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Warm background pulse */}
      <div 
        aria-hidden="true"
        className="absolute w-80 h-80 bg-[#FF5C00]/10 rounded-full blur-3xl animate-pulse pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-5 z-10"
      >
        {/* Momentum Logo with Ember Glow */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 bg-[#FF5C00]/30 rounded-2xl blur-lg animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF5C00] to-[#E62B1E] flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-[#FF5C00]/30">
            M
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-white font-serif-display">
            Momentum <span className="text-[#FF5C00] text-xs font-mono font-normal">OS</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-[#e4beb1]/70 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5C00]" />
            <span>Verifying Security Credentials...</span>
          </div>
        </div>

        <p className="text-[11px] text-white/30 font-mono max-w-xs mx-auto">
          Single-Owner Terminal · TEDxAkure 2026
        </p>
      </motion.div>
    </div>
  );
};
