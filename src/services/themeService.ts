import { ThemeConfig, ThemeId } from '../types';

const THEME_STORAGE_KEY = 'momentum_theme_mode_v2';

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'cyber_cobalt',
    name: 'Cyber Cobalt & Slate',
    category: 'Cool & High-Tech (Default)',
    description: 'Ultra-clean obsidian canvas with electric cobalt, ice cyan, and crisp typography. Easy on the eyes and remarkably cool.',
    accentColor: '#38bdf8',
    accentSecondary: '#6366f1',
    previewColors: ['#0B0F17', '#1E293B', '#38BDF8'],
  },
  {
    id: 'nordic_emerald',
    name: 'Nordic Titanium & Mint',
    category: 'Minimalist & Calm',
    description: 'Graphite and titanium base paired with arctic emerald and cool jade highlights for a calm, professional demeanor.',
    accentColor: '#34d399',
    accentSecondary: '#059669',
    previewColors: ['#0D1117', '#161B22', '#34D399'],
  },
  {
    id: 'royal_iris',
    name: 'Midnight Nebula & Iris',
    category: 'Deep & Sophisticated',
    description: 'Deep midnight slate with royal iris and lavender gradients for a premium, futuristic aesthetic.',
    accentColor: '#818cf8',
    accentSecondary: '#a78bfa',
    previewColors: ['#0B0B14', '#1E1B4B', '#818CF8'],
  },
  {
    id: 'sunset_ember',
    name: 'Sunset Ember & Quartz',
    category: 'Warm & High-Energy',
    description: 'Subtle charcoal background with refined amber and terracotta accents for a vibrant, classic conference vibe.',
    accentColor: '#f97316',
    accentSecondary: '#ef4444',
    previewColors: ['#0D0B0A', '#1F1510', '#F97316'],
  },
];

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'cyber_cobalt';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (stored && AVAILABLE_THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Could not read stored theme', e);
  }
  // Default to Cyber Cobalt (Cool, sleek, tech-forward, high readability)
  return 'cyber_cobalt';
}

export function applyThemeToDOM(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);

  // Set CSS custom properties based on theme
  switch (themeId) {
    case 'cyber_cobalt':
      root.style.setProperty('--bg-canvas', '#090D14');
      root.style.setProperty('--bg-surface-card', '#111827');
      root.style.setProperty('--bg-surface-subtle', '#1A2234');
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-accent', 'rgba(56, 189, 248, 0.35)');
      root.style.setProperty('--accent-primary', '#38BDF8');
      root.style.setProperty('--accent-secondary', '#6366F1');
      root.style.setProperty('--accent-glow', 'rgba(56, 189, 248, 0.15)');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-secondary', '#94A3B8');
      root.style.setProperty('--text-accent', '#38BDF8');
      break;

    case 'nordic_emerald':
      root.style.setProperty('--bg-canvas', '#0A0E12');
      root.style.setProperty('--bg-surface-card', '#11171D');
      root.style.setProperty('--bg-surface-subtle', '#18222B');
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-accent', 'rgba(52, 211, 153, 0.35)');
      root.style.setProperty('--accent-primary', '#34D399');
      root.style.setProperty('--accent-secondary', '#059669');
      root.style.setProperty('--accent-glow', 'rgba(52, 211, 153, 0.15)');
      root.style.setProperty('--text-primary', '#F0FDF4');
      root.style.setProperty('--text-secondary', '#94A3B8');
      root.style.setProperty('--text-accent', '#34D399');
      break;

    case 'royal_iris':
      root.style.setProperty('--bg-canvas', '#090814');
      root.style.setProperty('--bg-surface-card', '#111024');
      root.style.setProperty('--bg-surface-subtle', '#1C1A3A');
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-accent', 'rgba(129, 140, 248, 0.35)');
      root.style.setProperty('--accent-primary', '#818CF8');
      root.style.setProperty('--accent-secondary', '#A78BFA');
      root.style.setProperty('--accent-glow', 'rgba(129, 140, 248, 0.18)');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-secondary', '#A5B4FC');
      root.style.setProperty('--text-accent', '#818CF8');
      break;

    case 'sunset_ember':
      root.style.setProperty('--bg-canvas', '#0A0807');
      root.style.setProperty('--bg-surface-card', '#140F0D');
      root.style.setProperty('--bg-surface-subtle', '#201714');
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-accent', 'rgba(249, 115, 22, 0.35)');
      root.style.setProperty('--accent-primary', '#F97316');
      root.style.setProperty('--accent-secondary', '#EF4444');
      root.style.setProperty('--accent-glow', 'rgba(249, 115, 22, 0.15)');
      root.style.setProperty('--text-primary', '#FAECE6');
      root.style.setProperty('--text-secondary', '#D4B8B0');
      root.style.setProperty('--text-accent', '#F97316');
      break;
  }
}

export function setAppTheme(themeId: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    console.warn('Could not persist theme preference', e);
  }
  applyThemeToDOM(themeId);
}
