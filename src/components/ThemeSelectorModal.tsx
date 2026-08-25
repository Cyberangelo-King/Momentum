import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Check, Sparkles, Moon, Sun, ShieldCheck } from 'lucide-react';
import { ThemeId, ThemeConfig } from '../types';
import { AVAILABLE_THEMES, getStoredTheme, setAppTheme } from '../services/themeService';
import { triggerHaptic } from '../services/haptics';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getStoredTheme);

  if (!isOpen) return null;

  const handleSelectTheme = (themeId: ThemeId) => {
    triggerHaptic('light');
    setCurrentTheme(themeId);
    setAppTheme(themeId);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[var(--bg-surface-card)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-[var(--text-primary)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-primary)]">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif-display tracking-tight text-white flex items-center gap-2">
                  <span>Visual Atmosphere & Color Scheme</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Choose a refined, eye-friendly palette tailored for conference lighting.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
              aria-label="Close theme modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme List */}
          <div className="p-6 space-y-3.5 max-h-[65vh] overflow-y-auto">
            {AVAILABLE_THEMES.map((theme: ThemeConfig) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2.5 ${
                    isSelected
                      ? 'bg-[var(--bg-surface-subtle)] border-[var(--accent-primary)] shadow-lg'
                      : 'bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.04] hover:border-white/20'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 20px ${theme.accentColor}25` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-serif-display">
                          {theme.name}
                        </span>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold"
                          style={{
                            backgroundColor: `${theme.accentColor}20`,
                            color: theme.accentColor,
                            border: `1px solid ${theme.accentColor}40`,
                          }}
                        >
                          {theme.category}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    {/* Radio Checkmark */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'border-transparent text-black'
                          : 'border-white/20 bg-transparent'
                      }`}
                      style={{
                        backgroundColor: isSelected ? theme.accentColor : 'transparent',
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">Palette:</span>
                    <div className="flex items-center gap-1.5">
                      {theme.previewColors.map((hex, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
            <span className="text-xs text-[var(--text-secondary)]">
              Preference automatically saved locally.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all text-black bg-[var(--accent-primary)] hover:brightness-110 shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
